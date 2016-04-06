'use strict';

var l = require('../lib/winstonConfig'),
    schema = require("kuark-schema");

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

        return schema.SABIT.OLAY;
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
     * @param {string} _olay
     * @param {integer|integer[]} _nesne_idler
     * @returns {*}
     */
    var f_db_olay_kuyrugundan_sil = function (_olay, _nesne_idler) {
        l.info("f_db_olay_kuyrugundan_sil");
        return result.dbQ.srem(_olay, _nesne_idler);
    };

    var olaylar = [
        {
            bUyari: true,
            bFilter: true,
            kisaAdi: "IHALE_EKLENDI",
            olayAdi: "OLAYLAR:IHALE:EKLENDI",
            olayNesnesi: [
                {adi: "IhaleNo", tipi: "string"},
                {adi: "Konusu", tipi: "string"},
                {adi: "IhaleTarihi", tipi: "Date"},
                {adi: "SistemeEklenmeTarihi", tipi: "Date"},
                {adi: "IhaleUsul", tipi: "string"},
                {adi: "YapilacagiAdres", tipi: "string"},
                {adi: "Kurum.Adi", tipi: "string"},
                {adi: "SBIhale_Id", tipi: "number"}
            ]
        },
        {
            bUyari: true,
            bFilter: true,
            olayAdi: "OLAYLAR:IHALE:GUNCELLENDI",
            kisaAdi: "IHALE_GUNCELLENDI",
            olayNesnesi: [
                {adi: "IhaleNo", tipi: "string"},
                {adi: "Konusu", tipi: "string"},
                {adi: "IhaleTarihi", tipi: "Date"},
                {adi: "SistemeEklenmeTarihi", tipi: "Date"},
                {adi: "IhaleUsul", tipi: "string"},
                {adi: "YapilacagiAdres", tipi: "string"},
                {adi: "Kurum.Adi", tipi: "string"},
                {adi: "SBIhale_Id", tipi: "number"},
                {adi: "Id", tipi: "number"}
            ]
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:IHALE:SILINDI",
            kisaAdi: "IHALE_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:IHALE:GIZLENDI",
            kisaAdi: "IHALE_GIZLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:IHALE:GIZLENDI:IPTAL",
            kisaAdi: "IHALE_GIZLENDI_IPTAL",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:IHALE:TARIHI:ERTELENDI",
            kisaAdi: "IHALE_TARIHI_ERTELENDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:IHALE:TARIHI:X:GUN:KALA",
            kisaAdi: "IHALE_TARIHI_X_GUN_KALA",
            olayNesnesi: [
                {adi: "Gun", tipi: "number"},
                {adi: "Ay", tipi: "number"}
            ]
        },

        {
            bUyari: true,
            bFilter: true,
            olayAdi: "OLAYLAR:KALEM:EKLENDI",
            kisaAdi: "KALEM_EKLENDI",
            olayNesnesi: [
                {adi: "SiraNo", tipi: "string"},
                {adi: "BransKodu", tipi: "string"},
                {adi: "Miktar", tipi: "string"},
                {adi: "Birim", tipi: "string"},
                {adi: "Aciklama", tipi: "string"}
            ]
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:KALEM:GUNCELLENDI",
            kisaAdi: "KALEM_GUNCELLENDI",
            olayNesnesi: [
                {adi: "SiraNo", tipi: "string"},
                {adi: "BransKodu", tipi: "string"},
                {adi: "Miktar", tipi: "string"},
                {adi: "Birim", tipi: "string"},
                {adi: "Aciklama", tipi: "string"},
                {adi: "Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:SILINDI",
            kisaAdi: "KALEM_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:GIZLENDI",
            kisaAdi: "KALEM_GIZLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:GIZLENDI:IPTAL",
            kisaAdi: "KALEM_GIZLENDI_IPTAL",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:GUNCELLENDI",
            kisaAdi: "KALEM_DURUMU_GUNCELLENDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:KATILIYORUZ",
            kisaAdi: "KALEM_KATILIYORUZ",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:ITIRAZ_EDILECEK",
            kisaAdi: "KALEM_ITIRAZ_EDILECEK",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:ITIRAZ_EDILDI",
            kisaAdi: "KALEM_ITIRAZ_EDILDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:ITIRAZ_RED_EDILDI",
            kisaAdi: "KALEM_ITIRAZ_RED",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:ITIRAZ_KABUL_EDILDI",
            kisaAdi: "KALEM_ITIRAZ_KABUL",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:KALEM:DURUMU:IPTAL_EDILDI",
            kisaAdi: "KALEM_IPTAL",
            olayNesnesi: []
        },

        {
            bUyari: true,
            bFilter: true,
            olayAdi: "OLAYLAR:TEKLIF:EKLENDI",
            kisaAdi: "TEKLIF_EKLENDI",
            olayNesnesi: [
                {adi: "Fiyat", tipi: "string"},
                {adi: "ParaBirim_Id", tipi: "number"},
                {adi: "TeklifDurumu_Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:TEKLIF:GUNCELLENDI",
            kisaAdi: "TEKLIF_GUNCELLENDI",
            olayNesnesi: [
                {adi: "Fiyat", tipi: "string"},
                {adi: "ParaBirim_Id", tipi: "number"},
                {adi: "TeklifDurumu_Id", tipi: "number"},
                {adi: "Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:SILINDI",
            kisaAdi: "TEKLIF_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:GUNCELLENDI",
            kisaAdi: "TEKLIF_DURUMU_GUNCELLENDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:KAZANDI",
            kisaAdi: "TEKLIF_KAZANDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:IPTAL_EDILDI",
            kisaAdi: "TEKLIF_IPTAL",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:URUN_BELGESI_EKSIK",
            kisaAdi: "TEKLIF_URUN_BELGESI_EKSIK",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:URUN_REDDEDILDI",
            kisaAdi: "TEKLIF_URUNU_REDDEDILDI",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: false,
            olayAdi: "OLAYLAR:TEKLIF:DURUMU:IHALEDEN_ATILDI",
            kisaAdi: "TEKLIF_IHALEDEN_ATILDI",
            olayNesnesi: []
        },

        {
            bUyari: true,
            bFilter: true,
            olayAdi: "OLAYLAR:URUN:EKLENDI",
            kisaAdi: "URUN_EKLENDI",
            olayNesnesi: [
                {adi: "Adi", tipi: "string"},
                {adi: "Kodu", tipi: "string"},
                {adi: "Aciklama", tipi: "string"},
                {adi: "Birim", tipi: "string"},
                {adi: "Fiyat", tipi: "number"},
                {adi: "ParaBirim_Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:URUN:GUNCELLENDI",
            kisaAdi: "URUN_GUNCELLENDI",
            olayNesnesi: [
                {adi: "Adi", tipi: "string"},
                {adi: "Kodu", tipi: "string"},
                {adi: "Aciklama", tipi: "string"},
                {adi: "Birim", tipi: "string"},
                {adi: "Fiyat", tipi: "number"},
                {adi: "ParaBirim_Id", tipi: "number"},
                {adi: "Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:URUN:SILINDI",
            kisaAdi: "URUN_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:KURUM:GIZLENDI",
            kisaAdi: "KURUM_GIZLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:KURUM:GIZLENDI:IPTAL",
            kisaAdi: "KURUM_GIZLENDI_IPTAL",
            olayNesnesi: []
        },
        {
            bUyari: true,
            bFilter: true,
            olayAdi: "OLAYLAR:KURUM:EKLENDI",
            kisaAdi: "KURUM_EKLENDI",
            olayNesnesi: [
                {adi: "Adi", tipi: "string"},
                {adi: "TicariUnvan", tipi: "string"},
                {adi: "Statu", tipi: "string"},
                {adi: "VD", tipi: "string"},
                {adi: "VN", tipi: "string"},
                {adi: "Eposta", tipi: "string"},
                {adi: "Web", tipi: "string"},
                {adi: "Tel1", tipi: "string"},
                {adi: "Tel2", tipi: "string"},
                {adi: "Faks", tipi: "string"},
                {adi: "AcikAdres", tipi: "string"},
                {adi: "UlkeAdi", tipi: "string"},
                {adi: "Sehir.Adi", tipi: "string"},
                {adi: "Bolge.Adi", tipi: "string"},
                {adi: "Kurumdur", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:KURUM:GUNCELLENDI",
            kisaAdi: "KURUM_GUNCELLENDI",
            olayNesnesi: [
                {adi: "Adi", tipi: "string"},
                {adi: "TicariUnvan", tipi: "string"},
                {adi: "Statu", tipi: "string"},
                {adi: "VD", tipi: "string"},
                {adi: "VN", tipi: "string"},
                {adi: "Eposta", tipi: "string"},
                {adi: "Web", tipi: "string"},
                {adi: "Tel1", tipi: "string"},
                {adi: "Tel2", tipi: "string"},
                {adi: "Faks", tipi: "string"},
                {adi: "AcikAdres", tipi: "string"},
                {adi: "UlkeAdi", tipi: "string"},
                {adi: "Sehir.Adi", tipi: "string"},
                {adi: "Bolge.Adi", tipi: "string"},
                {adi: "Kurumdur", tipi: "number"},
                {adi: "Id", tipi: "number"}
            ]
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KURUM:SILINDI",
            kisaAdi: "KURUM_SILINDI",
            olayNesnesi: []
        },

        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:ANAHTAR:EKLENDI",
            kisaAdi: "TAHTA_ANAHTAR_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:ANAHTAR:SILINDI",
            kisaAdi: "TAHTA_ANAHTAR_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:URUN:ANAHTAR:EKLENDI",
            kisaAdi: "URUN_ANAHTAR_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:URUN:ANAHTAR:SILINDI",
            kisaAdi: "URUN_ANAHTAR_SILINDI",
            olayNesnesi: []
        },

        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:ROL:EKLENDI",
            kisaAdi: "ROL_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:ROL:GUNCELLENDI",
            kisaAdi: "ROL_GUNCELLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:ROL:SILINDI",
            kisaAdi: "ROL_SILINDI",
            olayNesnesi: []
        },

        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KULLANICI:EKLENDI",
            kisaAdi: "KULLANICI_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KULLANICI:GUNCELLENDI",
            kisaAdi: "KULLANICI_GUNCELLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:KULLANICI:SILINDI",
            kisaAdi: "KULLANICI_SILINDI",
            olayNesnesi: []
        },

        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:EKLENDI",
            kisaAdi: "TAHTA_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:GUNCELLENDI",
            kisaAdi: "TAHTA_GUNCELLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:SILINDI",
            kisaAdi: "TAHTA_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: false,
            olayAdi: "OLAYLAR:TAHTA:AYRIL",
            kisaAdi: "TAHTA_AYRIL",
            olayNesnesi: []
        },

        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:DIKKAT:EKLENDI",
            kisaAdi: "DIKKAT_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:DIKKAT:SILINDI",
            kisaAdi: "DIKKAT_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:ILETI:EKLENDI",
            kisaAdi: "ILETI_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:ILETI:SILINDI",
            kisaAdi: "ILETI_SILINDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:GOREV:EKLENDI",
            kisaAdi: "GOREV_EKLENDI",
            olayNesnesi: []
        },
        {
            bUyari: false,
            bFilter: true,
            olayAdi: "OLAYLAR:ILETI:SILINDI",
            kisaAdi: "ILETI_SILINDI",
            olayNesnesi: []
        }
    ];


    /** @class DBOlay */
    result = {
        f_db_tetiklenecek_olay_tumu: f_db_tetiklenecek_olay_tumu,
        f_init_db_olay: f_init_db_olay,
        f_db_olay_tumu: f_db_olay_tumu,
        f_db_olay_kuyruguna_ekle: f_db_olay_kuyruguna_ekle,
        f_db_olay_kuyrugundan_sil: f_db_olay_kuyrugundan_sil,
        SABIT: {
            OLAYLAR: olaylar
        }
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