/**
 *
 * @returns {DBUyari}
 * @constructor
 */
function DB_Uyari() {

    /** @type {DBUyari} */
    var result = {};


    /**
     * tahtada kayıtlı AKTİF(silinmeyen) uyarılar listesini döner
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_uyarilar_tahta_tumu = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetUyarilari(_tahta_id, true))
            .then(function (_uyari_idleri) {
                return f_db_uyari_id(_uyari_idleri, _tahta_id);
            });
    };

    /**
     * sistemde kayıtlı tüm AKTİF uyarılar listesini döner
     * @returns {*}
     */
    var f_db_uyarilar_tumu = function () {
        //eklenen uyarıların idlerini ve pasife alınan uyarıların id lerini bulup
        //pasifte olmayan idlerini bulup bilgilerini dönüyoruz
        return result.dbQ.Q.all([
                result.dbQ.hkeys(result.kp.uyari.tablo),
                result.dbQ.smembers(result.kp.uyari.ssetPasif)
            ])
            .then(function (_ress) {

                if (Array.isArray(_ress[0])) {
                    if (_ress[0].length == 0) {
                        return [];
                    }

                    var pasif_idler = _ress[1];
                    var uyari_idler = _ress[0].differenceXU(pasif_idler);
                    return result.dbQ.hmget_json_parse(result.kp.uyari.tablo, uyari_idler);
                }

                return [];

            });
    };


    /**
     * Uyarı/ların bilgisini bul
     * @param {integer|integer[]|string|string[]} _uyari_id
     * @param {integer} _tahta_id
     * @param {OptionsUyari=} _opt
     * @returns {*}
     */
    var f_db_uyari_id = function (_uyari_id, _tahta_id, _opt) {

        /** @type {OptionsUyari} */
        var opts = result.OptionsUyari(_opt);

        return (Array.isArray(_uyari_id)
            ? result.dbQ.hmget_json_parse(result.kp.uyari.tablo, _uyari_id)
            : result.dbQ.hget_json_parse(result.kp.uyari.tablo, _uyari_id))
            .then(function (_dbUyari) {
                if (!_dbUyari) {
                    return null;
                } else {
                    var kullanici = require('./db_kullanici'),
                        rol = require('./db_rol');

                    function f_uyari_bilgisi(_uyari) {
                        if (!_uyari) {//uyarı yoksa null dön
                            return null;
                        }
                        var olusan_uyari = schema.f_create_default_object(schema.SCHEMA.UYARI);
                        _.extend(olusan_uyari, _uyari);

                        return result.dbQ.Q.all([
                                opts.bArrUyeleri ? kullanici.f_db_uye_id(_uyari.Uye_Idler, _tahta_id) : [],
                                opts.bArrRolleri ? rol.f_db_rol_id(_uyari.Rol_Idler) : []
                            ])
                            .then(function (_ress) {
                                olusan_uyari.Uyeler = _ress[0];
                                olusan_uyari.Roller = _ress[1];
                                return olusan_uyari;
                            });
                    }

                    return (Array.isArray(_dbUyari)
                        ? _dbUyari.map(f_uyari_bilgisi).allX()
                        : f_uyari_bilgisi(_dbUyari))
                        .then(function (_olusan_uyari) {
                            return _olusan_uyari;
                        });
                }


            });
    };

    /**
     * Uyarı ekle
     * @param {integer} _tahta_id
     * @param {object} _uyari
     * @returns {*}
     */
    var f_db_uyari_ekle = function (_tahta_id, _uyari) {
        /*
         * - idx'i arttır
         * - hset UYARILAR idx _uyari
         * - uyarıyı ekleyen kullanıcı daha sonra tüm uyarılarını görebiliğp/düzenlesin diye:
         *       sadd KULLANICI:x:UYARILAR idx
         * - tetiklenecek uyarılara bu olayı ekleyelim > sadd TETIKLENECEK_OLAYLAR _uyari.olayAdi
         * */
        return result.dbQ.incr(result.kp.uyari.idx)
            .then(function (_id) {
                _uyari.Id = _id;

                return result.dbQ.Q.all([
                        result.dbQ.hset(result.kp.uyari.tablo, _id, JSON.stringify(_uyari)),
                        result.dbQ.sadd(result.kp.tahta.ssetUyarilari(_tahta_id, true), _id)
                    ])
                    .then(function () {
                        //uyarının durumuna göre (true/false) sete ekleyeceğiz
                        //durumu false olanları pasifler setine ekleyeceğiz
                        if (_uyari.Durumu == false) {
                            return result.dbQ.sadd(result.kp.uyari.ssetPasif, _uyari.Id);
                        } else {
                            //durumu true ise tetiklenecekler setine de ekle
                            //pasifteki uyarılardan sil
                            return result.dbQ.Q.all([
                                result.dbQ.srem(result.kp.uyari.ssetPasif, _uyari.Id),
                                result.dbQ.sadd(result.kp.uyari.ssetTetiklenecekOlay, _uyari.Olay)
                            ]);
                        }
                    })
                    .then(function () {
                        return f_db_uyari_id(_uyari.Id, _tahta_id);
                    });
            });
    };

    var f_db_uyari_kopyala = function (_tahta_id, _uyari_id) {
        return f_db_uyari_id(_uyari_id, _tahta_id)
            .then(function (_dbUyari) {
                return f_db_uyari_ekle(_tahta_id, _dbUyari);
            });
    };

    /**
     * Uyarıyı güncelle
     * @param {integer} _tahta_id
     * @param {object} _uyari
     * @returns {*}
     */
    var f_db_uyari_guncelle = function (_tahta_id, _uyari) {
        return result.dbQ.hset(result.kp.uyari.tablo, _uyari.Id, JSON.stringify(_uyari))
            .then(function () {
                //uyarının durumuna göre (true/false) sete ekleyeceğiz
                //durumu false olanları pasifler setine ekleyeceğiz
                //değilse setten çıkar
                if (_uyari.Durumu == false) {
                    return result.dbQ.sadd(result.kp.uyari.ssetPasif, _uyari.Id);
                } else {
                    return result.dbQ.srem(result.kp.uyari.ssetPasif, _uyari.Id);
                }
            })
            .then(function () {
                return f_db_uyari_id(_uyari.Id, _tahta_id)
            });
    };

    /**
     * Uyarıyı sil
     * @param {integer} _tahta_id
     * @param {integer} _uyari_id
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_uyari_sil = function (_tahta_id, _uyari_id, _kul_id) {
        return result.dbQ.Q.all([
            result.dbQ.srem(result.kp.tahta.ssetUyarilari(_tahta_id, true), _uyari_id),
            result.dbQ.sadd(result.kp.tahta.ssetUyarilari(_tahta_id, false), _uyari_id)
        ]);
    };


    /**
     * @class DBUyari
     */
    result = {
        islem: {
            "mail": "mail",
            "alert": "alert",
            "sms": "sms",
            "todo": "todo"
        },
        f_db_uyari_id: f_db_uyari_id,
        f_db_uyari_sil: f_db_uyari_sil,
        f_db_uyari_guncelle: f_db_uyari_guncelle,
        f_db_uyari_ekle: f_db_uyari_ekle,
        f_db_uyarilar_tumu: f_db_uyarilar_tumu,
        f_db_uyarilar_tahta_tumu: f_db_uyarilar_tahta_tumu,
        f_db_uyari_kopyala: f_db_uyari_kopyala,
        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsUyari}
         */
        OptionsUyari: function (opts) {
            /** @class OptionsUyari*/
            var optsDefault = {
                bArrUyeleri: true,
                bArrRolleri: true
            };

            /** @type {OptionsUyari}*/
            return _.extend(optsDefault, opts || {})
        }
    };

    return result;
}


/**
 *
 * @type {DBUyari}
 */
var obj = DB_Uyari();
obj.__proto__ = require('./db_log');

module.exports = obj;