'use strict';

var l = require('../lib/winstonConfig');

/**
 *
 * @returns {DBLog}
 * @constructor
 */
function DB_Log() {
   
    /**
     *
     * @type {DBLog}
     */
    var result = {};


    /**
     * @class DBLog
     */
    result = {

        islem: {
            "EKLE": "ekle",
            "GUNCELLE": "guncelle",
            "SIL": "sil"
        },

        f_db_log_ekle: function (_anahtar, _nesne, _silindiMi, _kul_id) {
            if (!_anahtar) {
                l.warning("Anahtar bilgisi boş olamaz!");
                throw "Anahtar bilgisi boş olamaz!"
            }

            if (!_nesne) {
                l.warning("Loglanacak nesne bilgisi boş olamaz!");
                throw "Loglanacak nesne bilgisi boş olamaz!";
            }


            var obj = {
                Kullanici_Id: !_kul_id ? 0 : _kul_id,
                Tarih: new Date().getTime(),
                Nesne: _nesne,
                Silindi: _silindiMi ? _silindiMi : false
            };
            _anahtar = "log:" + _anahtar + (_nesne.Id ? ":" + _nesne.Id : "");

            return result.dbQ.sadd(_anahtar, JSON.stringify(obj));
        }
    };

    return result;
}


/**
 *
 * @type {DBLog}
 */
var obj = DB_Log();
obj.__proto__ = require('./db_olay');


module.exports = obj;