var db = require("../src/index")(),
    expect = require('chai').expect,
    assert = require('chai').assert,
    schema = require('kuark-schema'),
    extensions = require('kuark-extensions'),
    _ = require('lodash');

describe("DB Teklif İşlemleri", function () {

    it("İhaleye bağlı teklifler", function (done) {
        this.timeout = 10000;

        /** @type {URLQuery} */
        var url = {};

        /** @type {Sayfalama} */
        var sayfa = {};
        sayfa.Sayfa = 0;
        sayfa.SatirSayisi = 10;
        url.Sayfalama = sayfa;

        db.ihale.f_db_ihale_teklif_tumu(1, 5, url)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(_aktif);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Bir kalemin yalnızca bir kazanını olur", function (done) {
        var teklif = {
            Id: 0,
            TeklifDurumu_Id: 1,
            ParaBirim_Id: 2,
            Ihale: {Id: 5},
            Kalem: {Id: 47},
            Fiyat: 12,
            Aciklama: "yok",
            Ihale_Id: 5,
            Kalem_Id: 47,
            Kurum_Id: 1,
            Urun_Idler: [1],
            Urunler: [{Id: 1, Adi: "test"}]
        };

        db.teklif.f_db_teklif_ekle(1, teklif)
            .then(function (_aktif) {
                console.log("eklenen teklif sonucu");
                console.log(JSON.stringify(_aktif));
                done();
            })
            .fail(function (_err) {
                assert(_err.Icerik == "Seçilen kalemin onay durumu KAZANDI olarak seçili durumda. Bir kalemin sadece bir kazananı olabilir. Lütfen kontrol ediniz.", 'Bir kalemin birden fazla kazananı olmamalı!');
                done();
            });
    })

    it("Teklif ekle", function (done) {

        var teklif = {
            Id: 0,
            TeklifDurumu_Id: 2,
            ParaBirim_Id: 2,
            Ihale: {Id: 5},
            Kalem: {Id: 47},
            Fiyat: 12,
            Aciklama: "yok",
            Ihale_Id: 5,
            Kalem_Id: 47,
            Kurum_Id: 1,
            Urun_Idler: [1],
            Urunler: [{Id: 1, Adi: "test"}]
        };

        db.teklif.f_db_teklif_ekle(1, teklif)
            .then(function (_aktif) {
                console.log("eklenen teklif sonucu");
                console.log(JSON.stringify(_aktif));
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Teklif id den bul", function (done) {

        /** @type {OptionsTeklif} */
        var opts = {
            bArrUrunler: true,
            bKalemBilgisi: true,
            bIhaleBilgisi: true,
            bKurumBilgisi: true,
            optUrun: {}
        };

        db.teklif.f_db_teklif_id(9, 1, opts)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(JSON.stringify(_aktif));
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });


    it("Teklif id ler bul", function (done) {
        /** @type {OptionsTeklif} */
        var opts = {
            bArrUrunler: true,
            bKalemBilgisi: true,
            bIhaleBilgisi: true,
            bKurumBilgisi: true,
            optUrun: {}
        };

        db.teklif.f_db_teklif_id([9, 10], 1, opts)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(JSON.stringify(_aktif));
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Teklif sil", function (done) {
        this.timeout = 6000;
        db.teklif.f_db_teklif_sil(9, 1)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(_aktif);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });


    it("Ürünün kazanan fiyatları", function (done) {
        db.urun.f_db_urunun_kazandigi_teklif_fiyatlari(1, 59, 1)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(_aktif);

                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Ürünün teklif edildiği tüm fiyatları", function (done) {
        db.urun.f_db_urunun_teklif_verildigi_fiyatlari(1, 59, 1)
            .then(function (_aktif) {
                console.log("ürünle teklif verilen fiyatlar");
                console.log(_aktif);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });


    it("Ürünle katıldığı ihale tarihlerine göre gruplama", function (done) {

        var tahta_id = 1, urun_id = 59, onay_id = 0, para_id = 1, tarih1 = "1432971902125", tarih2 = "1512027902125";

        db.urun.f_db_urunle_teklif_verilen_ihale_sayisi(tahta_id, urun_id, onay_id, para_id, tarih1, tarih2)
            .then(function (_aktif) {
                console.log("sonuç");
                console.log(_aktif);

                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });


    it("Ürünün tekliflerini çekme işlemi", function (done) {
        var _tahta_id = 1, _urun_id = 59, _onay_durum_id = 0, _para_id = 1, _bTumTeklifBilgileriyle = false;
        db.urun.f_db_urunun_teklif_detaylari(_tahta_id, _urun_id, _onay_durum_id, _para_id, _bTumTeklifBilgileriyle)
            .then(function (_aktif) {
                console.log("gelen teklifler");
                console.log(_aktif);

                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Ürünün teklif toplamları onay durumuna göre", function (done) {
        db.urun.f_db_urunun_teklif_toplami(1, 59, 0, 1)
            .then(function (_aktif) {
                console.log("gelen teklifler");
                console.log(_aktif);

                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Ürünün teklif toplamları onay durumuna göre1", function (done) {
        db.urun.f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(1, 59, schema.SABIT.ONAY_DURUM.teklif.REDDEDILDI, 1)
            .then(function (_aktif) {
                console.log("gelen teklifler");
                console.log(_aktif);

                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("indexli ihale gruplama ", function (done) {

        var tahta_id = 1,
            tarih1 = 1432059200001,
            tarih2 = 1432069200001;
        db.ihale.f_db_ihale_tarihine_gore_grupla(tahta_id, tarih1, tarih2)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("ihale gruplama ", function (done) {

        var tahta_id = 1,
            tarih1 = 1432059200001,
            tarih2 = 1432069200001;

        db.ihale.f_db_ihale_tarihine_gore_grupla(tahta_id, tarih1, tarih2)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("kurum teklif attıgı ihale gruplama ", function (done) {

        //db.ihale.f_db_ihale_tarihine_gore_grupla(1,1432059200001,1432069200001)
        db.kurum.f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla(1, 11)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("kurum teklif attıgı ve iptal edilen ihale gruplama ", function (done) {

        db.kurum.f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla(1, 11, schema.SABIT.ONAY_DURUM.teklif.REDDEDILDI)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("kurum teklif attıgı ve kazandığı ihale gruplama ", function (done) {

        db.kurum.f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla(1, 11, schema.SABIT.ONAY_DURUM.teklif.KAZANDI)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("gruplama ", function (done) {

        var tahta_id = 1,
            tarih1 = 1432059200001,
            tarih2 = 1432069200001,
            kurum_id = 1,
            onay_id = 0,
            para_id = 1;

        db.redis.dbQ.Q.all([
            db.ihale.f_db_ihale_tarihine_gore_grupla(tahta_id, tarih1, tarih2),
            db.kurum.f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari(tahta_id, kurum_id, onay_id, para_id, tarih1, tarih2),
            db.ihale.f_db_ihale_indexli_tarihine_gore_grupla(tahta_id, tarih1, tarih2)
        ]).then(function (_ress) {


            console.log(JSON.stringify(_ress[0]));
            console.log(JSON.stringify(_.map(_ress[0], "Key")));
            console.log(JSON.stringify(_.map(_ress[0], "Count")));
            console.log("**************");
            console.log(JSON.stringify(_ress[1]));
            console.log(JSON.stringify(_.map(_ress[1], "Key")));
            console.log(JSON.stringify(_.map(_ress[1], "Count")));

            console.log("**************");
            console.log(JSON.stringify(_ress[2]));
            console.log(JSON.stringify(_.map(_ress[2], "Key")));
            console.log(JSON.stringify(_.map(_ress[2], "Count")));

            done();


        }).fail(function (_err) {
            console.log(_err);
            done(_err);
        });
    });

    it("kurum karşılaştırma ", function (done) {

        return db.kurum.f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari(1, 4, 0, 2, 1441870169889, 4289790569889)
            .then(function (_ress) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_ress));
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });

    it("kuruma göre ihaleleri grupla", function (done) {

        db.ihale.f_db_tahta_ihale_gruplama(1, 4, "", 1, 1441547002855, 4289463802855)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("kurumun teklif verdiği kalemler ", function (done) {

        db.kurum.f_db_kurumun_teklif_verdigi_kalemler_toplami(1, 11, 1)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("iki tarih arasında kurumun teklif verdiği ihaleler toplamı", function (done) {
        var tarih1 = new Date().setHours(-20 * 24);
        var tarih2 = new Date().getTime();
        db.kurum.f_db_kurumun_teklif_verdigi_ihaleler_toplami(1, 11, tarih1, tarih2, 1)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("kurumun teklif verdiği ihaleler ", function (done) {
        var tarih1 = new Date().setHours(-20 * 24);
        var tarih2 = new Date().getTime();
        db.kurum.f_db_kurumun_teklif_verdigi_ihaleler(1, 11, 1, 1, tarih1, tarih2)
            .then(function (_res) {
                console.log("ihaleler ne geldi");
                console.log(_res.length);
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });

    it("Onay durumuna göre İki tarih aralığındaki kurumun teklifleri ", function (done) {

        var tarih1 = new Date().setHours(-20 * 24);
        var tarih2 = new Date().getTime();

        db.kurum.f_db_kurumun_teklifleri_detay(1, 1, 0, 1, tarih1, tarih2, true)
            .then(function (_res) {
                console.log("teklifler ne geldi");
                console.log(_res.length);
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err);
                done(_err);
            });
    });
});