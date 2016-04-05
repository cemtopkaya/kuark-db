var db = require("../src/index")(),
    expect = require('chai').expect,
    assert = require('chai').assert,
    extension = require('kuark-extensions');

describe("DB_kalem - Kalem Onay Durumları", function () {

    it("Tek kalemin ONAY DURUMUNU bul", function (done) {
        this.timeout(5000);
        db.kalem.f_db_kalem_onay_durumu("3", 1)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("Dizi halinde kalemlerin ONAY DURUMUNU bul", function (done) {
        //this.timeout(6000);
        db.kalem.f_db_kalem_onay_durumu(["4204", "4235"], 1)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log("Hata: ", _err)
                done(_err);
            });
    });

});

describe("DB_kalem - Kalemin tümü", function () {

    it("kalem id ler bul", function (done) {

        /** @type {OptionsKalem} */
        var opt = {};
        opt.bArrTeklifleri = false;
        opt.bOnayDurumu = true;
        opt.bTakiptemi = true;

        db.kalem.f_db_kalem_id(["1", "2"], 1, opt)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.error("Hata oluştu: ", _err);
                done(_err);
            });
    });

    it("tahtanın görebileceği kalem idlerini bul", function (done) {

        db.kalem.f_db_tahta_kalem_idler_aktif(1)
            .then(function (_res) {
                console.log("kalem idler length>" + _res.length);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem bul", function (done) {

        db.kalem.f_db_kalem_id(1, 1)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem sil", function (done) {

        db.kalem.f_db_kalem_sil_tahta(1, 1, 1)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                assert(_err.Icerik=='Silinmek istenen kalem GENEL kalemler içerisinde kayıtlı olduğu için işlem tamamlanamadı!','Silememesini belirten bir mesaj bekledim ama şu hata geldi: '+_err);
                done();
            });
    });

    it("kalem ekle", function (done) {

        /** @type {Kalem} */
        var kalem = {SiraNo: "7", Aciklama: "açıklama", Miktar: "1", Birim: "adet", Id: 0};

        db.kalem.f_db_kalem_ekle_tahta(1, 1, kalem, kalem)
            .then(function (_res) {
                console.log("_Res");
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem güncelle", function (done) {
        /** @type {Kalem} */
        var kalem = {SiraNo: "6", Aciklama: "aaa", BransKodu: "dd", Miktar: "8", Birim: "adet", Id: 1};
        db.kalem.f_db_kalem_guncelle_tahta(1, 1, kalem, kalem)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

});