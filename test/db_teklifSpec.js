var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    should = require('should'),
    g = require('../../node/globals'),
    _ = require('underscore');

describe("db_teklif", function () {

    before(function (done) {
        done();
    });


    it("İhaleye bağlı teklifler", function (done) {
        /** @type {URLQuery} */
        var url = {};

        /** @type {Sayfalama} */
        var sayfa = {};
        sayfa.Sayfa = 0;
        sayfa.SatirSayisi = 10;

        url.Sayfalama = sayfa;

        db.ihale.f_db_ihale_teklif_tumu(1, 9, url)
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

    it("Teklif id den bul", function (done) {
        var defaults = {
            bArrUrunler: true,
            bKalemBilgisi: true,
            bIhaleBilgisi: false,
            bKurumBilgisi: true
        };
        db.teklif.f_db_teklif_id(1, 1, defaults)
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


    it("Ürünle katıldığı ihale tarihlerine göre gruplama", function (done) {
        db.urun.f_db_urunle_teklif_verilen_ihale_sayisi(1, 59, 0, "1432971902125", "1512027902125")
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
        db.urun.f_db_urunun_teklif_detaylari(1, 59, 0, false)
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
        db.urun.f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(1, 59, SABIT.ONAY_DURUM.teklif.REDDEDILDI, 1)
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

        //db.ihale.f_db_ihale_tarihine_gore_grupla(1,1432059200001,1432069200001)
        db.ihale.f_db_ihale_indexli_tarihine_gore_grupla(1)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });

    it("ihale gruplama ", function (done) {

        //db.ihale.f_db_ihale_tarihine_gore_grupla(1,1432059200001,1432069200001)
        db.ihale.f_db_ihale_tarihine_gore_grupla(1)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err)
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
                console.log(_err)
            });
    });

    it("kurum teklif attıgı ve iptal edilen ihale gruplama ", function (done) {

        db.kurum.f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla(1, 11, SABIT.ONAY_DURUM.teklif.REDDEDILDI)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });

    it("kurum teklif attıgı ve kazandığı ihale gruplama ", function (done) {

        db.kurum.f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla(1, 11, SABIT.ONAY_DURUM.teklif.KAZANDI)
            .then(function (_res) {
                console.log("sonuç ne geldi");
                console.log(JSON.stringify(_res));
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });

    it("gruplama ", function (done) {

        db.redis.dbQ.Q.all([
            db.ihale.f_db_ihale_tarihine_gore_grupla(1),
            db.kurum.f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari(1, 11),
            db.ihale.f_db_ihale_indexli_tarihine_gore_grupla(1)
        ]).then(function (_ress) {


            console.log(JSON.stringify(_ress[0]));
            console.log(JSON.stringify(_.pluck(_ress[0], "Key")));
            console.log(JSON.stringify(_.pluck(_ress[0], "Count")));
            console.log("**************");
            console.log(JSON.stringify(_ress[1]));
            console.log(JSON.stringify(_.pluck(_ress[1], "Key")));
            console.log(JSON.stringify(_.pluck(_ress[1], "Count")));

            console.log("**************");
            console.log(JSON.stringify(_ress[2]));
            console.log(JSON.stringify(_.pluck(_ress[2], "Key")));
            console.log(JSON.stringify(_.pluck(_ress[2], "Count")));


            done();


        }).fail(function (_err) {
            console.log(_err)
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
                console.log(_err)
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
                console.log(_err)
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
                console.log(_err)
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
                console.log(_err)
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
                console.log(_err)
            });
    });
});