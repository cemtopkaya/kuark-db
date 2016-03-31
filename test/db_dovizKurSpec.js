var uuid = require('node-uuid'),
    db = require("../index")(),
    chai = require('chai'),
    g = require('../../node/globals');

chai.should();

describe("Doviz İşlemleri", function () {

    it("Döviz kurlarını çek", function (done) {
        db.doviz.f_db_doviz_kurlari_cek(10)
            .then(function (_arr) {
                console.log(_arr.length);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Döviz kurlarını ekle", function (done) {
        db.doviz.f_db_doviz_kurlari_cek(3000)
            .then(function (_dovizler) {
                db.doviz.f_db_doviz_kurlari_ekle(_dovizler)
                    .then(function (_arr) {
                        console.log(_arr.length);
                        console.log(JSON.stringify(_arr));
                        done();
                    });

            }).fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });

    });
    it("İki tarih aralığındaki kurlar", function (done) {
        db.doviz.f_db_doviz_tarih_araligindaki_kurlari_getir(1, 1, 1423526400000, 1425359200000)
            .then(function (_sonuc) {
                console.log(JSON.stringify(_sonuc));
                done();


            }).fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });

    });
});