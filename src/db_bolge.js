/**
 *
 * @returns {DBBolge}
 * @constructor
 */
function DB_Bolge() {

    //region BÖLGE
    var f_db_bolge_tumu = function (_tahta_id) {
        if (!_tahta_id || _tahta_id == 0) {
            //sadece genel bölge adlarını getir
            return result.dbQ.smembers(result.kp.bolge.ssetBolgeGenel)
                .then(function (_bolge_idler) {
                    return result.dbQ.hmget_json_parse(result.kp.bolge.tablo, _bolge_idler);
                });

        } else {
            //tahta ve genel bölgeleri birleştir
            var anahtar = "temp_bolge";

            return result.dbQ.sunionstore(anahtar, result.kp.tahta.ssetBolgeleri(_tahta_id, true), result.kp.bolge.ssetBolgeGenel)
                .then(function () {
                    return result.dbQ.Q.all([
                        result.dbQ.sdiff(anahtar, result.kp.tahta.ssetBolgeleri(_tahta_id, false)),
                        result.dbQ.expire(anahtar, 10)
                    ]).then(function (_ress) {
                        return result.dbQ.hmget_json_parse(result.kp.bolge.tablo, _ress[0]);
                    });
                });
        }
    };

    var f_db_bolge_id = function (_id) {
        if (Array.isArray(_id) && _id.length > 0) {
            return result.dbQ.hmget_json_parse(result.kp.bolge.tablo, _id);
        } else {
            return result.dbQ.hget_json_parse(result.kp.bolge.tablo, _id);
        }
    };

    var f_db_bolge_ekle = function (_bolge, _tahta_id) {
        if (Array.isArray(_bolge) && _bolge.length > 0) {
            return _bolge.mapX(null, f_bolge_ekle, _tahta_id).allX();
        }
        else {
            return f_bolge_ekle(_bolge, _tahta_id);
        }
    };

    var f_bolge_ekle = function (_bolge, _tahta_id) {
        //SON EKLENEN bölgenin İD SİNİ ÇEK VE EKLEME İŞLEMİNE BAŞLA
        return result.dbQ.incr(result.kp.bolge.idx)
            .then(function (_id) {
                _bolge.Id = _id;

                //tahta_id yoksa genele eklenecek varsa da tahtanın özel bölgelerine
                return result.dbQ.Q.all([
                        result.dbQ.hset(result.kp.bolge.tablo, _id, JSON.stringify(_bolge)),
                        !_tahta_id ? result.dbQ.sadd(result.kp.bolge.ssetBolgeGenel, _id) : null,
                        _tahta_id ? result.dbQ.sadd(result.kp.tahta.ssetBolgeleri(_tahta_id, true), _id) : null
                    ])
                    .then(function () {
                        return f_db_bolge_id(_id);
                    });
            });
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
        l.info("f_db_bolge_sehirleri");
        return result.dbQ.smembers(result.kp.bolge.ssetSehirleri(_id))
            .then(function (_aktif) {
                return result.dbQ.hmget_json_parse(result.kp.sehir.tablo, _aktif);
            }).fail(function () {
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
    var result = {
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