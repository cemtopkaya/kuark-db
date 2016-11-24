var db = require("../src/index")(),
    chai = require('chai'),
    should = chai.should,
//expect = require("chaimel"),
    expect = chai.expect,
    assert = chai.assert,
    schema = require("kuark-schema"),
    extensions = require('kuark-extensions'),
    uuid = require('uuid'),
    l = extensions.winstonConfig;


describe("DB İhale işlemleri", function () {

    it("Rapor sayfası oluşturmak için gerekli bilgiler", function (done) {

        db.tahta.f_db_tahta_ihale_rapor_bilgileri(9)
            .then(function (_arr) {
                console.log(JSON.stringify(_arr));
                done();
            })
            .fail(function (_er) {
                done(_er);
            });
    });

    it("anahtara uygun ihale toplamı", function (done) {
        db.tahta.f_db_tahta_ihale_indeksli_toplami(1)
            .then(function (_sonuc) {
                expect(_sonuc).to.have.property('Toplam');
                expect(_sonuc).to.have.property('Gecerli');
                expect(_sonuc).to.have.property('Gecersiz');
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("ihale id ler çek", function (done) {
        /** @type {OptionsIhale} */
        var opts = {};
        opts.bArrKalemleri = false;
        opts.bYapanKurum = true;
        opts.bTakip = true;

        db.ihale.f_db_ihale_id([4, 5], 1, opts)
            .then(function (_ihale) {
                l.info("Ihale çekildi.");
                console.log(JSON.stringify(_ihale))
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("ihaleleri SIRALI çek", function (done) {

        /** @type {URLQuery} */
        var arama = {},
            tahta_id = 1;
        arama.Sayfalama = {"Sayfa": 0, "SatirSayisi": 10};
        arama.Siralama = [{Alan: schema.SABIT.URL_QUERY.SORT.ihale.yapilmaTarihi, Asc: false}];
        arama.Kriter = schema.SABIT.URL_QUERY.KRITER.AKTIFLER;
        arama.Tarih = {tarih1: new Date().AyinBiriX(), tarih2: new Date().AyinSonuX()};

        [db.redis.dbQ.del("temp:tahta:1:ihale:S:ihale:tarih:yapilma"), db.redis.dbQ.del("temp:tahta:1:ihale")]
            .allX()
            .then(function () {
                db.ihale.f_db_tahta_ihale_idler_sort_page(tahta_id, arama)
                    .then(
                        /** @param {LazyLoadingResponse} _sonuc */
                        function (_sonuc) {
                            extensions.ssg = [{"Çekilen Ihale": _sonuc}];
                            expect(_sonuc).to.have.property('ToplamKayitSayisi');
                            done();
                        })
                    .fail(function (_err) {
                        extensions.ssr = [{"_err": _err}];
                        done(_err);
                    });
            });
    });

    it("Genel ihaleleri çek", function (done) {
        /** @type {OptionsIhale} */
        var opts = {};
        opts.bArrKalemleri = false;
        opts.bYapanKurum = true;
        opts.bTakip = false;


        db.ihale.f_db_ihale_tumu_genel(opts)
            .then(function (_ihaleler) {
                l.info("Tüm ihaleler çekildi. Toplam çekilen ihale sayısı: " + _ihaleler.length);
                done();
            })
            .fail(function (_err) {
                console.log("hata>" + JSON.stringify(_err));
                done(_err);
            });
    });

    it("İhaleye bağlı kalemleri çek", function (done) {

        var ihale_id = 1,
            tahta_id = 1;

        var /** @type {URLQuery} */ arama = {};
        arama.Sayfalama = {"Sayfa": 0, "SatirSayisi": 10};
        arama.Kriter = schema.SABIT.URL_QUERY.KRITER.AKTIFLER;

        db.ihale.f_db_ihale_kalemleri_by_page(ihale_id, tahta_id, arama)
            .then(function (_kalemler) {
                assert(Array.isArray(_kalemler.Data), 'Kalemler bir dizi olarak gelmedi');
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("İhale sil", function (done) {
        var ihale_id = 1,
            tahta_id = 1;
        db.ihale.f_db_tahta_ihale_sil(ihale_id, tahta_id)
            .then(function (_res) {
                console.log("gelen sonuc>" + _res);
                //assert(ihale_id > 0, 'İhale id nin 0 dan büyük olmasını bekliyordum.');
                done();
            })
            .fail(function (_err) {
                //assert(_err.Icerik == 'Silinmek istenen ihale GENEL ihaleler içerisinde kayıtlı olduğu için işlem tamamlanamadı!', 'Beklenen mesaj gelmedi > ' + _err);
                done(_err);

            });
    });

    it("Tahtaya İhale ekle", function (done) {

        var /** @type {IhaleDB|IhaleES} */
            ihale = {
                IhaleNo: "77",
                IhaleTarihi: 1435698000000,
                IhaleUsul: "açık",
                IsTerminTarihi: null,
                Konusu: "testttim diyalizim",
                SozlesmeTarihi: null
            },
            tahta_id = 1,
            kullanici_id = 1;

        db.ihale.f_db_ihale_ekle(ihale, ihale, tahta_id, kullanici_id)
            .then(function (_ihale) {
                assert(_ihale.Id > 0, 'DB ye eklenmiş ihalenin ID degeri 0\'dan büyük gelmeliydi!');
                done();
            })
            .fail(function (_err) {
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });

    it("Tahtanın anahtar kelimelerine göre ihaleler", function (done) {
        db.tahta.f_db_tahta_ihale_indeksli_tahta_anahtarKelimelerineGore(8)
            .then(
                /** @param {Ihale[]} _ihaleler */
                function (_ihaleler) {
                    console.log("length>" + _ihaleler);
                    assert(Array.isArray(_ihaleler), 'Ihale dizisi gelmeliydi ama GELMEDI!');
                    done();
                })
            .fail(function (_err) {
                extensions.ssr = [{"Fail oldu": _err}];
                done(_err);
            });
    });

});