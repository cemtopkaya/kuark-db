/**
 *
 * @returns {DBSehir}
 * @constructor
 */
function DB_Sehir() {
    var result = {};

    var f_db_sehir_tumu = function () {
        return result.dbQ.hvals_json_parse(result.kp.sehir.tablo);
    };

    var f_db_sehir_id = function (_id) {
        return result.dbQ.hget_json_parse(result.kp.sehir.tablo, _id);
    };

    /**
     * sehir:ad setindeki şehir adlarını getirir
     * @returns {*}
     */
    var f_db_sehir_adlari = function () {
        return result.dbQ.smembers(result.kp.sehir.ssetAdlari);
    };

    /**
     *
     * @param _sehirler
     * @param _tahta_id
     * @returns {Promise|{state: (string|string), value: Object}[]}
     */
    var f_db_sehir_ekle = function (_sehirler, _tahta_id) {
        if (Array.isArray(_sehirler) && _sehirler.length > 0) {
            return _sehirler.mapX(null, f_sehir_ekle, _tahta_id).allX();

        } else {
            return f_sehir_ekle(_sehirler, _tahta_id);
        }
    };

    var f_sehir_ekle = function (_sehir, _tahta_id) {

        return result.dbQ.incr(result.kp.sehir.idx)
            .then(function (_id) {
                _sehir.Id = _id;
                return result.dbQ.hset(result.kp.sehir.tablo, _id, JSON.stringify(_sehir));
            });
    };

    /**
     * @class DBSehir
     */
    result = {
        f_db_sehir_ekle: f_db_sehir_ekle,
        f_db_sehir_adlari: f_db_sehir_adlari,
        f_db_sehir_tumu: f_db_sehir_tumu,
        f_db_sehir_id: f_db_sehir_id
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