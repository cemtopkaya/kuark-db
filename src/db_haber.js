'use strict';

var l = require('kuark-extensions').winstonConfig;

/**
 *
 * @returns {DBHaber}
 * @constructor
 */
function DB_Haber() {
    var db_ihale = require('./db_ihale'),
        db_kurum = require('./db_kurum'),
        db_kalem = require('./db_kalem'),
        db_urun = require('./db_urun'),
        db_teklif = require('./db_teklif'),
        db_yorum = require('./db_yorum'),
        result = {};


    //PRIVATE
    var f_kullanici_haber = function (kul_id, _eklenen, _silinen, _okunan) {
        l.info("f_kullanici_haber");
        return result.dbQ.zrangebyscore([result.kp.kullanici.zsetHaberAkisi(kul_id, _eklenen, _silinen, _okunan), '-inf', '+inf'])
            .then(function (_haberler) {
                if (_haberler && _haberler.length > 0) {
                    return result.dbQ.hmget_json_parse(result.kp.kullanici.hsetHaberDetaylari(kul_id), _haberler);
                } else {
                    return [];
                }
            });
    };
    var f_tahta_haber = function (tahta_id, _eklenen, _silinen, _okunan) {
        l.info("f_tahta_haber");
        return result.dbQ.zrangebyscore([result.kp.tahta.zsetHaberAkisi(tahta_id, _eklenen, _silinen, _okunan), '-inf', '+inf'])
            .then(function (_haberler) {
                if (_haberler && _haberler.length > 0) {
                    return result.dbQ.hmget_json_parse(result.kp.tahta.hsetHaberDetaylari(tahta_id), _haberler);
                } else {
                    return [];
                }
            });
    };

    var f_tahta_haber_ekle = function (tahta_id, haber) {
        return result.dbQ.Q.all([
            result.dbQ.zadd(result.kp.tahta.zsetHaberAkisi(tahta_id, true, false, false), new Date().getTime(), haber.TabloDeger),
            result.dbQ.hset(result.kp.tahta.hsetHaberDetaylari(tahta_id), haber.TabloDeger, JSON.stringify(haber))
        ]);
    };
    var f_kullanici_haber_ekle = function (kul_id, haber) {
        return result.dbQ.Q.all([
            result.dbQ.zadd(result.kp.kullanici.zsetHaberAkisi(kul_id, true, false, false), new Date().getTime(), haber.TabloDeger),
            result.dbQ.hset(result.kp.kullanici.hsetHaberDetaylari(kul_id), haber.TabloDeger, JSON.stringify(haber))
        ]);
    };


    //PUBLIC

    /**
     * Kullanıcıya veya tahtaya gelen tüm aktif durumdaki haberleri çeker
     * @param {int} tahta_id
     * @param {int} kul_id
     * @param {boolean} _okunan
     * @returns {*}
     */
    var f_db_haber_tumu = function (tahta_id, kul_id, _eklenen, _silinen, _okunan) {

        if (kul_id && kul_id > 0) {
            return f_kullanici_haber(kul_id, _eklenen, _silinen, _okunan)
        } else {
            return f_tahta_haber(tahta_id, _eklenen, _silinen, _okunan)
        }
    };

    /**
     * Yeni haber ekle kullanıcıya ekleniyorsa kul_id dolu tahtaya ekleniyorsa tahta_id dolu olmalıdır(sıfırdan farklı)
     * @param {int} tahta_id
     * @param {int} kul_id
     * @param tablo
     * @param haber
     */
    var f_db_haber_ekle = function (tahta_id, kul_id, haber) {

        if (kul_id && kul_id > 0) {
            return f_kullanici_haber_ekle(kul_id, haber)
        } else {
            return f_tahta_haber_ekle(tahta_id, haber)
        }
    };


    var f_db_haber_guncelle = function (tahta_id, kul_id, id, eklenen, silinen, okunan) {
        if (kul_id && kul_id > 0) {
            return result.dbQ.zadd(result.kp.kullanici.zsetHaberAkisi(kul_id, eklenen, silinen, okunan), new Date().getTime(), id);
        } else {
            return result.dbQ.zadd(result.kp.tahta.zsetHaberAkisi(tahta_id, eklenen, silinen, okunan), new Date().getTime(), id);
        }
    };

    var f_db_haber_sil = function (tahta_id, kul_id, id) {
        //okunan ve eklenenden silip
        //silinene ekliyoruz
        if (kul_id && kul_id > 0) {
            return result.dbQ.Q.all([
                result.dbQ.zrem(result.kp.kullanici.zsetHaberAkisi(kul_id, true, false, false), id),
                result.dbQ.zrem(result.kp.kullanici.zsetHaberAkisi(kul_id, false, false, true), id),
                result.dbQ.zadd(result.kp.kullanici.zsetHaberAkisi(kul_id, false, true, false), new Date().getTime(), id)]);
        } else {
            return result.dbQ.Q.all([
                result.dbQ.zrem(result.kp.tahta.zsetHaberAkisi(tahta_id, true, false, false), id),
                result.dbQ.zrem(result.kp.tahta.zsetHaberAkisi(tahta_id, false, false, true), id),
                result.dbQ.zadd(result.kp.tahta.zsetHaberAkisi(tahta_id, false, true, false), new Date().getTime(), id)]);
        }
    };

    /**
     * @class DBHaber
     */
    result = {
        f_db_haber_tumu: f_db_haber_tumu,
        f_db_haber_ekle: f_db_haber_ekle,
        f_db_haber_guncelle: f_db_haber_guncelle,
        f_db_haber_sil: f_db_haber_sil
    };
    return result;
}


/**
 *
 * @type {DBHaber}
 */
var obj = DB_Haber();
obj.__proto__ = require('./db_log');

module.exports = obj;