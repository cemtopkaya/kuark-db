var db = require("../../node/server/db")(),
    global = require('../../node/globals'),
    should = require('should'),
    defaults = require('json-schema-defaults'),
    schema = require('../../node/schema'),
    _ = require('underscore'),
    request = require('supertest');

describe("DB_kalem - Kalem Onay Durumları", function () {

    afterEach(function (done) {
        done();
    });

    it("Tek kalemin ONAY DURUMUNU bul", function (done) {
        this.timeout(500000);
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

    before(function (done) {
        done();
    });

    it("kalem id ler bul", function (done) {

        /** @type {OptionsKalem} */
        var opt = {};
        opt.bArrTeklifleri = false;
        opt.bOnayDurumu = true;
        opt.bTakiptemi = true;

        db.kalem.f_db_kalem_id(["6974", "6975"], 1, opt)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                should
                done();
            })
            .fail(function (_err) {
                console.error("Hata oluştu: ",_err);
                done(_err);
            });
    });

    it("tahtanın görebileceği kalem idlerini bul", function (done) {

        return db.kalem.f_db_tahta_kalem_idler_aktif(3)
            .then(function (_res) {
                console.log("kalem idler>");
                console.log(_res.length);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem bul", function (done) {

        return db.kalem.f_db_kalem_id(3)
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

        return db.kalem.f_db_kalem_sil_tahta(2, 1, 1)
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem ekle", function (done) {

        return db.kalem.f_db_kalem_ekle_tahta(6, 101, {SiraNo: "7", Aciklama: "açıklama", Miktar: "1", Birim: "adet", Id: 1})
            .then(function (_res) {
                console.log("_Res");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                done(_err);
            });
    });

    it("kalem güncelle", function (done) {

        return db.kalem.f_db_kalem_guncelle_tahta(6, 101, {SiraNo: "6", Aciklama: "aaa", BransKodu: "dd", Miktar: "8", Birim: "adet", Id: 4671, Id: 1})
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