/**
 *
 * @returns {DBAnahtar}
 * @constructor
 */
function DB_Anahtar() {
    /**
     *
     * @type {DBAnahtar}
     */
    var result = {};


    /**
     * Gelen anahtar _id ye göre db de kayıtlı bilgiyi döner
     * @param {string} _id
     * @returns {*}
     */
    var f_db_anahtar_val = function (_id) {
        return result.dbQ.hgetall_array(result.kp.anahtar.tablo)
            .then(function (_arrAnahtarlar) {
                var bulunanAnahtar = _arrAnahtarlar.whereXU({value: _id});
                ssg = [{"bulunanAnahtar": bulunanAnahtar}];

                return bulunanAnahtar.length > 0
                    ? {Id: bulunanAnahtar[0].value, Anahtar: bulunanAnahtar[0].key}
                    : null;
            })
    };

    /**
     * Gelen anahtar kelimeye göre db de kayıtlı anahtar_id yi bilgiyi döner
     * @param {string} _anahtarKelime
     * @returns {Promise}
     */
    var f_db_anahtar_key = function (_anahtarKelime) {

        return Array.isArray(_anahtarKelime)
            ? result.dbQ.hmget_json_parse(result.kp.anahtar.tablo, _anahtarKelime)
            : result.dbQ.hget_json_parse(result.kp.anahtar.tablo, _anahtarKelime);
    };

    var f_db_anahtar_ekle = function (_anahtarKelime) {
        return result.dbQ.hexists(result.kp.anahtar.tablo, _anahtarKelime)
            .then(function (_iVarYok) {
                // Anahtar varsa kendi id'sini ve yeni olmadığı bilgisini
                // Yoksa ekliyor ve yeni olduğu bilgisiyle dönüyoruz
                return (_iVarYok == 1
                    ? result.dbQ.hget(result.kp.anahtar.tablo, _anahtarKelime)
                    : result.dbQ.incr(result.kp.anahtar.idx))
                    .then(function (_anahtar_id) {
                        if (_iVarYok == 0) {
                            result.dbQ.hset(result.kp.anahtar.tablo, _anahtarKelime, _anahtar_id);
                        }

                        return {Yeni: _iVarYok == 0, Anahtar: _anahtarKelime, Id: parseInt(_anahtar_id)};
                    });
            });
    };


    //region ÜRÜN İŞLEMLERİ
    var f_db_anahtar_index_ekle_urun = function (anahtar_id, urun_id) {
        return (Array.isArray(urun_id))
            ? result.dbQ.sadd_array([result.kp.anahtar.ssetIndexUrun(anahtar_id)].concat(urun_id))
            : result.dbQ.sadd(result.kp.anahtar.ssetIndexUrun(anahtar_id), urun_id);
    };

    var f_db_anahtar_index_sil_urun = function (anahtar_id, urun_id) {
        return result.dbQ.srem(result.kp.anahtar.ssetIndexUrun(anahtar_id), urun_id);
    };
    //endregion

    //region İHALE İŞLEMLERİ
    var f_db_anahtar_index_ihale = function (anahtar_id) {
        return result.dbQ.smembers(result.kp.anahtar.ssetIndexIhale(anahtar_id));
    };

    var f_db_anahtar_index_ekle_ihale = function (anahtar_id, ihale_id) {
        return (Array.isArray(ihale_id))
            ? result.dbQ.sadd_array([result.kp.anahtar.ssetIndexIhale(anahtar_id)].concat(ihale_id))
            : result.dbQ.sadd(result.kp.anahtar.ssetIndexIhale(anahtar_id), ihale_id);
    };

    var f_db_anahtar_index_sil_ihale = function (anahtar_id, ihale_id) {
        return result.dbQ.srem(result.kp.anahtar.ssetIndexIhale(anahtar_id), ihale_id);
    };
    //endregion

    //region KALEM İŞLEMLERİ
    var f_db_anahtar_index_ekle_kalem = function (anahtar_id, kalem_id) {
        return (Array.isArray(kalem_id))
            ? result.dbQ.sadd_array([result.kp.anahtar.ssetIndexKalem(anahtar_id)].concat(kalem_id))
            : result.dbQ.sadd(result.kp.anahtar.ssetIndexKalem(anahtar_id), kalem_id);
    };

    var f_db_anahtar_index_sil_kalem = function (anahtar_id, kalem_id) {
        return result.dbQ.srem(result.kp.anahtar.ssetIndexKalem(anahtar_id), kalem_id);
    };
    //endregion


    /**
     * @class DBAnahtar
     */
    result = {
        f_db_anahtar_index_ihale: f_db_anahtar_index_ihale,
        f_db_anahtar_index_sil_ihale: f_db_anahtar_index_sil_ihale,
        f_db_anahtar_index_sil_kalem: f_db_anahtar_index_sil_kalem,
        f_db_anahtar_index_ekle_urun: f_db_anahtar_index_ekle_urun,
        f_db_anahtar_index_sil_urun: f_db_anahtar_index_sil_urun,
        f_db_anahtar_index_ekle_ihale: f_db_anahtar_index_ekle_ihale,
        f_db_anahtar_index_ekle_kalem: f_db_anahtar_index_ekle_kalem,
        f_db_anahtar_ekle: f_db_anahtar_ekle,
        f_db_anahtar_val: f_db_anahtar_val,
        f_db_anahtar_key: f_db_anahtar_key
    };

    return result;
}


/**
 *
 * @type {DBAnahtar}
 */
var obj = DB_Anahtar();
obj.__proto__ = require('./db_log');

module.exports = obj;