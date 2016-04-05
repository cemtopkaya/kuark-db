'use strict';

var l = require('../lib/winstonConfig');

/**
 *
 * @returns {DBBolge}
 * @constructor
 */
function DB_Bolge() {

    /** @type {DBBolge} */
    var result = {};

    //region BÖLGE
    var f_db_bolge_tumu = function (_tahta_id) {
        /** @type {LazyLoadingResponse} */
        var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);
        if (!_tahta_id || _tahta_id == 0) {
            //region sadece genel bölge adlarını getir
            return result.dbQ.smembers(result.kp.bolge.ssetBolgeGenel)
                .then(function (_bolge_idler) {
                    if (_bolge_idler && _bolge_idler.length > 0) {
                        return f_db_bolge_id(_bolge_idler)
                            .then(function (_dbBolgeler) {
                                sonuc.ToplamKayitSayisi = parseInt(_dbBolgeler.length);
                                sonuc.Data = _dbBolgeler;
                                return sonuc;
                            });
                    } else {
                        sonuc.Data = [];
                        sonuc.ToplamKayitSayisi = 0;
                        return sonuc;
                    }
                });
            //endregion

        } else {
            //region tahta ve genel bölgeleri birleştir
            var anahtar = "temp_bolge";

            return result.dbQ.sunionstore(anahtar, result.kp.tahta.ssetBolgeleri(_tahta_id, true), result.kp.bolge.ssetBolgeGenel)
                .then(function () {
                    return result.dbQ.Q.all([
                        result.dbQ.sdiff(anahtar, result.kp.tahta.ssetBolgeleri(_tahta_id, false)),
                        result.dbQ.expire(anahtar, 10)
                    ]).then(function (_ress) {
                        if (_ress[0] && _ress[0].length > 0) {
                            return f_db_bolge_id(_ress[0])
                                .then(function (_dbBolgeler) {
                                    sonuc.ToplamKayitSayisi = parseInt(_dbBolgeler.length);
                                    sonuc.Data = _dbBolgeler;
                                    return sonuc;
                                });
                        }
                        else {
                            sonuc.Data = [];
                            sonuc.ToplamKayitSayisi = 0;
                            return sonuc;
                        }
                    });
                });
            //endregion
        }
    };

    /**
     * Bölge/lerin bilgisini döner
     * @param {integer|integer[]|string|string[]} _id
     * @returns {*}
     */
    var f_db_bolge_id = function (_id) {
        if (!_id) {
            return null;
        }
        if (Array.isArray(_id) && _id.length > 0) {
            return result.dbQ.hmget_json_parse(result.kp.bolge.tablo, _id);
        } else {
            return result.dbQ.hget_json_parse(result.kp.bolge.tablo, _id);
        }
    };

    /**
     * Bölge adından bölgeyi bulup geri döner
     * @param {string} _bolgeAdi
     * @returns {*}
     */
    var f_db_bolge_bul_adindan = function (_bolgeAdi) {
        return result.dbQ.hgetall_array(result.kp.bolge.tablo)
            .then(function (_arrBolgeler) {
                if (_arrBolgeler && _arrBolgeler.length > 0) {
                    var bolge = _arrBolgeler.whereX("Adi", _bolgeAdi);
                    if (bolge) {
                        return bolge;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            });
    };


    /**
     * Bölge/lerin eklenmesi sağlanır
     * @param {Bolge|Bolge[]} _bolge
     * @param {integer=} _tahta_id
     * @returns {Promise|{state: (string|string), value: Object}[]}
     */
    var f_db_bolge_ekle = function (_bolge, _tahta_id) {

        /**
         *
         * @param {Bolge} _bolge
         * @param {integer} _tahta_id
         * @returns {*}
         */
        var f_bolge_ekle = function (_bolge, _tahta_id) {
            //SON EKLENEN bölgenin İD SİNİ ÇEK VE EKLEME İŞLEMİNE BAŞLA

            return result.dbQ.sismember(result.kp.bolge.ssetAdlari, _bolge.Adi)
                .then(function (_iKayitli) {
                    if (_iKayitli == 1) {
                        return f_db_bolge_bul_adindan(_bolge.Adi);
                    } else {
                        return result.dbQ.incr(result.kp.bolge.idx)
                            .then(function (_id) {
                                _bolge.Id = _id;

                                //tahta_id yoksa genele eklenecek varsa da tahtanın özel bölgelerine
                                return result.dbQ.Q.all([
                                        result.dbQ.hset(result.kp.bolge.tablo, _id, JSON.stringify(_bolge)),
                                        result.dbQ.sadd(result.kp.bolge.ssetAdlari, _bolge.Adi),
                                        !_tahta_id ? result.dbQ.sadd(result.kp.bolge.ssetBolgeGenel, _id) : null,
                                        _tahta_id ? result.dbQ.sadd(result.kp.tahta.ssetBolgeleri(_tahta_id, true), _id) : null
                                    ])
                                    .then(function () {
                                        return f_db_bolge_id(_id);
                                    });
                            });
                    }
                });
        };

        if (Array.isArray(_bolge) && _bolge.length > 0) {
            return _bolge.mapX(null, f_bolge_ekle, _tahta_id).allX();
        }
        else {
            return f_bolge_ekle(_bolge, _tahta_id);
        }
    };

    var f_db_bolge_guncelle = function (_bolge, _tahta_id) {
        return result.dbQ.sismember(result.kp.bolge.ssetBolgeGenel, _bolge.Id)
            .then(function (_iGenel) {
                if (_iGenel > 0) {
                    //genelse yeni ekleyip
                    //genelin id sini tahtanın silinenlere ekliyoruz ki listeyi çektiğimizde eskisini göremeyelim

                    return result.dbQ.sadd(result.kp.tahta.ssetBolgeleri(_tahta_id, false), _bolge.Id)
                        .then(function () {
                            return f_db_bolge_ekle(_bolge, _tahta_id);
                        });

                } else {
                    //bu genel değil

                    return result.dbQ.hset(result.kp.bolge.tablo, _bolge.Id, JSON.stringify(_bolge))
                        .then(function () {
                            return f_db_bolge_id(_bolge.Id);
                        });
                }
            })

    };

    var f_db_bolge_sil = function (_bolge_id, _tahta_id) {

        if (_bolge_id) {
            return result.dbQ.Q.all([
                result.dbQ.srem(result.kp.tahta.ssetBolgeleri(_tahta_id, true), _bolge_id),
                result.dbQ.sadd(result.kp.tahta.ssetBolgeleri(_tahta_id, false), _bolge_id)
            ]);

        } else {
            l.warning("Silinecek aktif bir bölge bulunamadı");
        }
    };
    //endregion

    //region BÖLGE ŞEHİRLERİ
    var f_db_bolge_sehirleri = function (_id) {
        /** @type {LazyLoadingResponse} */
        var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);

        return result.dbQ.smembers(result.kp.bolge.ssetSehirleri(_id))
            .then(/**
             *
             * @param {string[]} _sehir_idler
             * @returns {*}
             */
            function (_sehir_idler) {
                if (_sehir_idler && _sehir_idler.length > 0) {
                    var db_sehir = require("./db_sehir");
                    return db_sehir.f_db_sehir_id(_sehir_idler)
                        .then(function (_sehirler) {
                            sonuc.ToplamKayitSayisi = parseInt(_sehirler.length);
                            sonuc.Data = _sehirler;
                            return sonuc;
                        })

                } else {
                    sonuc.ToplamKayitSayisi = 0;
                    sonuc.Data = [];
                    return sonuc;
                }
            })
            .fail(function () {
                l.e("bölge şehirleri çekilemedi");
            });
    };

    /**
     * Bölge ile ilişkili şehir ekleniyor
     * @param _sehir_idler
     * @param _bolge_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_bolge_sehir_ekle = function (_sehir_idler, _bolge_id, _tahta_id) {
        if (Array.isArray(_sehir_idler) && _sehir_idler.length > 0) {
            return _sehir_idler.mapX(null, function (_sehir_id) {
                return result.dbQ.sadd(result.kp.bolge.ssetSehirleri(_bolge_id), _sehir_id);
            }).allX();
        } else {
            return result.dbQ.sadd(result.kp.bolge.ssetSehirleri(_bolge_id), _sehir_idler);
        }
    };

    /**
     * Bölgeden şehir ilişkisini kaldırıyoruz
     * @param _sehir_id
     * @param _bolge_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_bolge_sehir_sil = function (_sehir_id, _bolge_id, _tahta_id) {
        return result.dbQ.srem(result.kp.bolge.ssetSehirleri(_bolge_id), _sehir_id);
    };

    //endregion

    /**
     * @class DBBolge
     */
    result = {
        f_db_bolge_sehir_sil: f_db_bolge_sehir_sil,
        f_db_bolge_sehir_ekle: f_db_bolge_sehir_ekle,
        f_db_bolge_tumu: f_db_bolge_tumu,
        f_db_bolge_id: f_db_bolge_id,
        f_db_bolge_sehirleri: f_db_bolge_sehirleri,
        f_db_bolge_ekle: f_db_bolge_ekle,
        f_db_bolge_guncelle: f_db_bolge_guncelle,
        f_db_bolge_sil: f_db_bolge_sil
    };

    return result;
}


/**
 *
 * @type {DBBolge}
 */
var obj = DB_Bolge();
obj.__proto__ = require('./db_log');

module.exports = obj;