'use strict';

/**
 *
 * @returns {DBModel}
 * @constructor
 */
function DB() {

    var /** @type {Redis} */
        Redis = require('./Redis'),
        /**
         *
         * @type {DBUrun}
         */
        DB_Urun = require('./db_urun'),
        /**
         *
         * @type {DBKurum}
         */
        DB_Kurum = require('./db_kurum'),
        /**
         *
         * @type {DBKullanici}
         */
        DB_Kullanici = require('./db_kullanici'),
        /**
         *
         * @type {DBIhale}
         */
        DB_Ihale = require('./db_ihale'),
        /**
         *
         * @type {DBBolge}
         */
        DB_Bolge = require('./db_bolge'),
        /**
         *
         * @type {DBSehir}
         */
        DB_Sehir = require('./db_sehir'),
        /**
         *
         * @type {DBKalem}
         */
        DB_Kalem = require('./db_kalem'),
        /**
         *
         * @type {DBTeklif}
         */
        DB_Teklif = require('./db_teklif'),
        /**
         *
         * @type {DBHaber}
         */
        DB_Haber = require('./db_haber'),
        /**
         *
         * @type {DBDikkat}
         */
        DB_Dikkat = require('./db_dikkat'),
        /**
         *
         * @type {DBGorev}
         */
        DB_Gorev = require('./db_gorev'),
        /**
         *
         * @type {DBIleti}
         */
        DB_Ileti = require('./db_ileti'),
        /**
         *
         * @type {DBYorum}
         */
        DB_Yorum = require('./db_yorum'),
        /**
         *
         * @type {DBUyari}
         */
        DB_Uyari = require('./db_uyari'),
        /**
         *
         * @type {DBLog}
         */
        DB_Log = require('./db_log'),
        /**
         *
         * @type {DBRol}
         */
        DB_Rol = require('./db_rol'),
        /**
         *
         * @type {DBTahta}
         */
        DB_Tahta = require('./db_tahta'),
        /**
         *
         * @type {DBCopKutusu}
         */
        DB_Cop_Kutusu = require('./db_cop_kutusu'),
        /**
         *
         * @type {DBAnahtar}
         */
        DB_Anahtar = require('./db_anahtar'),
        /**
         *
         * @type {DBDoviz}
         */
        DB_Doviz = require('./db_doviz'),
        /**
         *
         * @type {DBUyariServisi}
         */
        DB_UyariServisi = require('./db_uyariServisi'),
        /**
         *
         * @type {DBOlay}
         */
        DB_Olay = require('./db_olay'),
        Elastic = require('../lib/elastic'),
        /** @type {DBModel} */
        result = {};

    DB_Olay.f_init_db_olay();

    /**
     * @class DBModel
     */
    result = {
        redis: Redis,
        elastic: Elastic,
        urun: DB_Urun,
        anahtar: DB_Anahtar,
        kurum: DB_Kurum,
        ihale: DB_Ihale,
        kullanici: DB_Kullanici,
        bolge: DB_Bolge,
        sehir: DB_Sehir,
        kalem: DB_Kalem,
        teklif: DB_Teklif,
        haber: DB_Haber,
        dikkat: DB_Dikkat,
        ileti: DB_Ileti,
        gorev: DB_Gorev,
        yorum: DB_Yorum,
        uyari: DB_Uyari,
        log: DB_Log,
        tahta: DB_Tahta,
        rol: DB_Rol,
        cop: DB_Cop_Kutusu,
        doviz: DB_Doviz,
        uyari_servisi: DB_UyariServisi,
        olay: DB_Olay
    };

    return result;
}

module.exports = DB;
