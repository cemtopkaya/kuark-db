var db = require("../../node/server/db")(),
    should = require('should'),
    events = require('events'),
    global = require('../../node/globals');

describe("DB İhale işlemleri", function () {

    before(function (done) {
        done();
    });

    it("deneme", function (done) {

        this.timeout(500000);
        db.tatta.f_db_tahta_ihale_rapor_bilgileri(9)
            .then(function (_arr) {
                console.log(JSON.stringify(_arr));
                done();
            });
    });

    it("anahtara uygun ihale toplamı", function (done) {
        db.tahta.f_db_tahta_ihale_indeksli_toplami(1)
            .then(function (_ihale) {
                l.info("sonuç: " + JSON.stringify(_ihale));
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("ihale çek", function (done) {
        /** @type {OptionsIhale} */
        var opts = {};
        opts.bArrKalemleri = false;
        opts.bYapanKurum = true;
        opts.bTakip = false;
        db.ihale.f_db_ihale_id(1, 0, opts)
            .then(function (_ihale) {
                l.info("Ihale çekildi. ihale: " + _ihale);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("ihaleleri SIRALI çek", function (done) {
        return db.redis.dbQ.del("temp:tahta:1:ihale:S:ihale:tarih:yapilma")
            .then(db.redis.dbQ.del("temp:tahta:1:ihale"))
            .then(db.ihale.f_db_tahta_ihale_idler_sort_page(1, [{Alan: SABIT.URL_QUERY.SORT.ihale.yapilmaTarihi, Asc: false}]))
            .then(function (_ihale) {
                l.info("Ihale çekildi. ihale: " + JSON.stringify(_ihale));
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("Genel ihaleleri çek", function (done) {
        var opts = {};
        opts.bArrKalemleri = false;
        opts.bYapanKurum = true;
        opts.bTakip = false;
        return db.ihale.f_db_ihale_tumu_genel(opts)
            .then(function (_ihaleler) {
                l.info("Tüm ihaleler çekildi. Toplam çekilen ihale sayısı: " + _ihaleler.length);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("İhaleye bağlı kalemleri çek", function (done) {
        this.timeout(6000);
        return db.ihale.f_db_ihale_kalemleri_by_page(136,1,{"Sayfa":0,"SatirSayisi":10})
            .then(function (_kalemler) {
                console.log("kalemleri:");
                console.log(_kalemler);

                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("İhale sil", function (done) {
        return db.ihale.f_db_tahta_ihale_sil(1, 2)
            .then(function (_res) {
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("Genel ihale ezildi, kalemleri düzenle", function (done) {
        return db.ihale.f_db_ihale_satir_kontrol(6, 110, 9)
            .then(function (_sonuc) {
                console.log("sonuc:");
                console.log(JSON.stringify(_sonuc));

                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("Tahtaya İhale ekle", function (done) {
        /*emitter = events.EventEmitter.prototype;
         emitter.on('aha', function (kisi) {
         console.log('noldu ' + kisi.adi);
         });

         var result = {
         f: function () {
         console.log("cer cop");
         },
         adi:'resul'
         };
         result.__proto__ = events.EventEmitter.prototype;
         result.emit('aha',result);


         emitter.emit('aha', {adi: 'pinar'});
         return true;*/


        var ihale = {
            IhaleNo: "77",
            IhaleTarihi: 1435698000000,
            IhaleUsul: "açık",
            IsTerminTarihi: null,
            Konusu: "testttim diyalizim",
            SozlesmeTarihi: null
        };

        return db.ihale.f_db_ihale_ekle(ihale, 0, 8)
            .then(function (_res) {
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("Tahtanın anahtar kelimelerine göre ihaleler", function (done) {
        db.tahta.f_db_tahta_ihale_indeksli_tahta_anahtarKelimelerineGore(8)
            .then(function (_a) {
                done(_a);
            })
    });

});