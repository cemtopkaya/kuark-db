/**
 *
 * @returns {DBYorum}
 * @constructor
 */
function DB_Yorum() {
    var db_haber = require('./db_haber'),
        /**
         *
         * @type {DBYorum}
         */
        result = {};

    var f_db_yorum_id = function (_id) {
        return result.dbQ.hget_json_parse(result.kp.yorum.tablo, _id);
    };

    var f_db_yorum_ekle = function (tahta_id, kul_id, yorum) {
        yorum.Kul_Id = kul_id;

        return result.dbQ.incr(result.dbQ.kp.yorum.idx)
            .then(function (_id) {
                yorum.Id = _id;
                return result.dbQ.hset(result.kp.yorum.tablo, _id, JSON.stringify(yorum));
                /*.then(function () {
                 var haber = {
                 Tipi: SABIT.TABLO_ADI.YORUM,
                 Id: yorum.Id,
                 TabloDeger: "yorum:" + yorum.Id,
                 Icerik: yorum.Icerik + " i�erikli YORUM eklendi.",
                 Sonuc: yorum
                 };

                 db_haber.f_db_haber_ekle(tahta_id, kul_id, haber);
                 return yorum;
                 });*/
            });
    };

    var f_db_yorum_sil = function (tahta_id, yorum_id) {
        throw "HENÜZ HAZIRLANMADI";
    };

    /**
     * @class DBYorum
     */
    result = {
        f_db_yorum_ekle: f_db_yorum_ekle,
        f_db_yorum_id: f_db_yorum_id,
        f_db_yorum_sil: f_db_yorum_sil
    };
    return result;
}


/**
 *
 * @type {DBYorum}
 */
var obj = DB_Yorum();
obj.__proto__ = require('./db_log');

module.exports = obj;