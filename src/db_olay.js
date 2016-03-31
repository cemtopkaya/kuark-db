/**
 *
 * @returns {DBOlay}
 * @constructor
 */
function DB_Olay() {
    // db işlemlerinin Promise ile yapılabilmesi için.
    /**
     *
     * @type {DBOlay}
     */
    var result = {};


    /**
     * DB de olaylar anahtarı oluşmamışsa yaratılacak
     * Olay anahtarını başlatıp içine eventleri koyacağız
     */
    var f_init_db_olay = function () {
        // OLAY anahtarı yoksa oluştur ve olayları ekle
        return result.dbQ.exists(result.kp.olay.tablo)
            .then(function (_intVarYok) {
                if (_intVarYok == 0) {
                    l.info("olay yokmuş ekleyeceğiz");
                    /*for (o in OLAY_ADI) {
                     l.info(o + " - " + result.OLAY_ADI[o]);
                     result.dbQ.hset(result.kp.olay.tablo, o, result.OLAY_ADI[o]);
                     }*/
                }
            });
    };

    /**
     * sistemde kayıtlı tüm olayları çek
     * @returns {OLAY|{ROL_EKLENDI, ROL_GUNCELLENDI, ROL_SILINDI, URUN_EKLENDI, URUN_GUNCELLENDI, URUN_SILINDI, KURUM_EKLENDI, KURUM_GUNCELLENDI, KURUM_SILINDI, IHALE_EKLENDI, IHALE_GUNCELLENDI, IHALE_SILINDI, IHALE_TARIHI_ERTELENDI, KALEM_EKLENDI, KALEM_GUNCELLENDI, KALEM_SILINDI, KALEM_DURUMU_GUNCELLENDI, TAHTA_ANAHTAR_EKLENDI, TAHTA_ANAHTAR_SILINDI, URUN_ANAHTAR_EKLENDI, URUN_ANAHTAR_SILINDI, TEKLIF_EKLENDI, TEKLIF_GUNCELLENDI, TEKLIF_SILINDI, TEKLIF_DURUMU_GUNCELLENDI}}
     */
    var f_db_olay_tumu = function () {

        return SABIT.OLAY;

        /* return result.dbQ.hvals(result.kp.olay.tablo);
         .then(function (_olaylar) {
         var arr = _olaylar.map(function (elm) {
         var uyari = JSON.parse(elm);
         return uyari;
         });
         return arr;
         });*/
    };

    var f_db_tetiklenecek_olay_tumu = function () {
        return result.dbQ.smembers(result.kp.uyari.ssetTetiklenecekOlay);
    };

    /**
     * GERÇEKLEŞEN_OLAY_KUYRUĞU'na OLAY ekleme
     * @param {string} _olay
     * @param {int} _nesne_id
     * @returns {number}
     */
    var f_db_olay_kuyruguna_ekle = function (_olay, _nesne_id) {

        ssg = "f_db_olay_kuyruguna_ekle";
        return result.dbQ.sismember(result.kp.uyari.ssetTetiklenecekOlay, _olay)
            .then(function (_dbVarYok) {
                if (_dbVarYok > 0) {
                    return result.dbQ.sadd(_olay, _nesne_id);
                } else {
                    l.warning("tetiklenecek olaylar içerisinde bulunamadığı için kuyruga eklenemedi.");
                    return 0;
                }
            });
    };

    /**
     * gerçekleşen olay kuyrugundan çıkar
     * @param {int} _id
     * @returns {*}
     */
    var f_db_olay_kuyrugundan_sil = function (_olay, _nesne_idler) {
        l.info("f_db_olay_kuyrugundan_sil");
        return result.dbQ.srem(_olay, _nesne_idler);
    };


    /* /!**
     * sistemde kayıtlı tüm gerçekleşen olay kuyrugunu çek
     * @returns {*}
     *!/
     var f_db_gerceklesen_olay_kuyrugu_tumu = function () {
     return result.dbQ.hvals_json_parse(result.kp.gerceklesen_olay_kuyrugu.tablo);
     /!* .then(function (_olaylar) {
     var arr = _olaylar.map(function (elm) {
     var uyari = JSON.parse(elm);
     return uyari;
     });
     return arr;
     });*!/
     };


     var f_db_gerceklesen_olay_kuyrugu_tahta_tumu = function (_tahta_id) {
     return f_db_gerceklesen_olay_kuyrugu_tumu()
     .then(function (_arr_kuyruktakiler) {
     return _.filter(_arr_kuyruktakiler, function (_elm) {
     if (_elm.Tahta_Id == _tahta_id) {
     return _elm;
     }
     });
     });
     };

     /!**
     * GERÇEKLEŞEN_OLAY_KUYRUĞU'na OLAY ekleme
     * @param {string} _olay
     * @param {object} _nesne
     * @returns {number}
     *!/
     var f_db_gerceklesen_olay_kuyruguna_ekle = function (_olay, _nesne, _tahta_id) {
     /!*
     * f_tetiklenecek_olaylarda_varmi(olayNesnesi.olayAdi)
     *      > sismember UYARISI_YAPILACAK_OLAYLAR olayNesnesi.olayAdi
     *          > 1: kuyruga ekle
     *              incr IDX:GERCEKLESEN_OLAY_KUYRUGU > id
     *              hset GERCEKLESEN_OLAY_KUYRUGU id _olay
     *            0: kuyruga ekleme
     * *!/
     l.info("f_db_gerceklesen_olay_kuyruguna_ekle");
     /!* result.dbQ.incr(result.kp.gerceklesen_olay_kuyrugu.idx)
     .then(function (_id) {
     result.dbQ.hset(result.kp.gerceklesen_olay_kuyrugu.tablo, _id, _olay);
     result.dbQ.hset(_olay, _id, JSON.stringify(_nesne));
     return _id;
     });

     // Eğer anahtar eklenmişse yayın yapalım
     if (_olay == SABIT.OLAY.TAHTA_ANAHTAR_EKLENDI) {
     l.info("publish edilecek: " + JSON.stringify(_nesne));
     result.dbQ.publish("tahta_anahtar_kelime_eklendi", JSON.stringify(_nesne));
     }
     return 1;*!/

     return result.dbQ.sismember(result.kp.uyari.ssetTetiklenecekOlay, _olay)
     .then(function (_dbVarYok) {
     l.info("sonuc" + _dbVarYok);
     if (_dbVarYok > 0) {

     return result.dbQ.set(_olay, _nesne.Id);

     /!*return result.dbQ.incr(result.kp.gerceklesen_olay_kuyrugu.idx)
     .then(function (_id) {

     var eklenecek_olay_kuyrugu = {
     Id: _id,
     Tahta_Id: _tahta_id && _tahta_id > 0 ? _tahta_id : 0,
     Olay: _olay,
     Nesne_Id: _nesne.Id,
     Nesne: _nesne
     };

     return result.dbQ.hset(result.kp.gerceklesen_olay_kuyrugu.tablo, _id, JSON.stringify(eklenecek_olay_kuyrugu));
     });*!/
     } else {
     l.warning("tetiklenecek olaylar içerisinde bulunamadığı için kuyruga eklenemedi.");
     return 0;
     }
     });
     };


     /!**
     * gerçekleşen olay kuyrugundan çıkar
     * @param {int} _id
     * @returns {*}
     *!/
     var f_db_gerceklesen_olay_kuyrugundan_sil = function (_id) {
     l.info("olay kuyrugundan sil");
     return result.dbQ.hdel(result.kp.gerceklesen_olay_kuyrugu.tablo, _id);
     };*/

    /**
     * @class DBOlay
     */
    result = {
        f_db_tetiklenecek_olay_tumu: f_db_tetiklenecek_olay_tumu,
        f_init_db_olay: f_init_db_olay,
        f_db_olay_tumu: f_db_olay_tumu,
        f_db_olay_kuyruguna_ekle: f_db_olay_kuyruguna_ekle,
        f_db_olay_kuyrugundan_sil: f_db_olay_kuyrugundan_sil
    };
    return result;
}

/**
 *
 * @type {DBOlay}
 */
var obj = DB_Olay();

var redis = require('./Redis');
obj.__proto__ = redis;

module.exports = obj;