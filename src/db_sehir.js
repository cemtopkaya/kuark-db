'use strict';

var  schema=require('kuark-schema');

/**
 *
 * @returns {DBSehir}
 * @constructor
 */
function DB_Sehir() {

    /** @type {DBSehir} */
    var result = {};

    function f_sehir_tumu() {
        return result.dbQ.hvals_json_parse(result.kp.sehir.tablo)
            .then(function (_arrSehirler) {
                /** @type {LazyLoadingResponse} */
                var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);
                if (_arrSehirler && _arrSehirler.length > 0) {
                    sonuc.ToplamKayitSayisi = parseInt(_arrSehirler.length);
                    sonuc.Data = _arrSehirler;
                    return sonuc;
                } else {
                    sonuc.ToplamKayitSayisi = 0;
                    sonuc.Data = [];
                    return sonuc;
                }
            })
    }

    /**
     * Şehir bilgilerini döner
     * @param {integer|integer[]|string|string[]} _id
     * @returns {*}
     */
    function f_sehir_id(_id) {
        if (!_id) {
            return null;
        }
        return Array.isArray(_id)
            ? result.dbQ.hmget_json_parse(result.kp.sehir.tablo, _id)
            : result.dbQ.hget_json_parse(result.kp.sehir.tablo, _id);
    }

    /**
     * Şehir adından şehir objesini buluyoruz
     * @param {string} _sehirAdi
     * @returns {*}
     */
    function f_sehir_bul_adindan(_sehirAdi) {
        return result.dbQ.hgetall_array(result.kp.sehir.tablo)
            .then(function (_arrSehirler) {
                if (_arrSehirler && _arrSehirler.length > 0) {
                    var sehir = _arrSehirler.whereX("Adi", _sehirAdi);
                    if (sehir) {
                        return sehir;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            });
    }

    /**
     * sehir:ad setindeki şehir adlarını getirir
     * @returns {*}
     */
    function f_sehir_adlari() {
        return result.dbQ.smembers(result.kp.sehir.ssetAdlari);
    }

    /**
     *
     * @param {Sehir|Sehir[]} _sehirler
     * @param _tahta_id
     * @returns {Promise|{state: (string|string), value: Object}[]}
     */
    function f_sehir_ekle(_sehirler, _tahta_id) {
        /**
         *
         * @param {Sehir} _sehir
         * @param {integer=} _tahta_id
         * @returns {*}
         */
        function f_sehir_ekle(_sehir, _tahta_id) {

            return result.dbQ.sismember(result.kp.sehir.ssetAdlari, _sehir.Adi)
                .then(function (_iVar) {
                    if (_iVar == 1) {
                        return f_sehir_bul_adindan(_sehir.Adi);
                    } else {
                        return result.dbQ.incr(result.kp.sehir.idx)
                            .then(function (_id) {
                                _sehir.Id = _id;
                                return result.dbQ.Q.all([
                                        result.dbQ.hset(result.kp.sehir.tablo, _id, JSON.stringify(_sehir)),
                                        result.dbQ.sadd(result.kp.sehir.ssetAdlari, _sehir.Adi)
                                    ])
                                    .then(function () {
                                        return f_sehir_id(_id);
                                    })
                            });
                    }
                });
        }

        if (Array.isArray(_sehirler) && _sehirler.length > 0) {
            return _sehirler.mapX(null, f_sehir_ekle, _tahta_id).allX();

        } else {
            return f_sehir_ekle(_sehirler, _tahta_id);
        }
    }


    /**
     * @class DBSehir
     */
    result = {
        f_db_sehir_ekle: f_sehir_ekle,
        f_db_sehir_adlari: f_sehir_adlari,
        f_db_sehir_tumu: f_sehir_tumu,
        f_db_sehir_id: f_sehir_id
    };
    return result;
}


/**
 *
 * @type {DBSehir}
 */
var obj = DB_Sehir();
obj.__proto__ = require('./db_log');

module.exports = obj;