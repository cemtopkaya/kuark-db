'use strict';

var l = require('kuark-extensions').winstonConfig;

/**
 *
 * @returns {DBIleti}
 * @constructor
 */
function DB_Ileti() {
    /**
     *
     * @type {DBIleti}
     */
    var result = {};

    var f_db_ileti_toplam = function (_kul_id) {
        l.info("f_db_ileti_toplam");
        return result.dbQ.zcard(result.kp.kullanici.zsetIleti(_kul_id));
    };

    var f_db_ileti_tumu = function (_kul_id, _iSayfa, _iAdet) {
        l.info("f_db_ileti_tumu");
        return result.dbQ.zrevrangebyscore(result.kp.kullanici.zsetIleti(_kul_id), '+inf', '-inf',"LIMIT",_iSayfa,_iAdet)
            .then(function (_idler) {
                if (_idler && _idler.length > 0) {
                    return result.dbQ.hmget_json_parse(result.kp.uyari.hsetUyariSonuclari, _idler);
                } else {
                    return [];
                }
            });
    };

    var f_db_ileti_ekle = function (kul_id, id) {
        l.info("f_db_ileti_ekle");
        return result.dbQ.zadd(result.kp.kullanici.zsetIleti(kul_id), new Date().getTime(), id);
    };

    /**
     * @class DBIleti
     */
    result = {
        f_db_ileti_toplam: f_db_ileti_toplam,
        f_db_ileti_tumu: f_db_ileti_tumu,
        f_db_ileti_ekle: f_db_ileti_ekle
    };
    return result;
}


/**
 *
 * @type {DBIleti}
 */
var obj = DB_Ileti();
obj.__proto__ = require('./db_log');

module.exports = obj;