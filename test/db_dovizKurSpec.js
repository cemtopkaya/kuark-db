var db = require("../src/index")(),
    should = require('chai').should;

describe("Doviz İşlemleri", function () {

    it("Döviz kurlarını çek", function (done) {
        done();
      /*  this.timeout = 5000;
        db.doviz.f_db_doviz_kurlari_cek(1)
            .then(function (_arr) {
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done();
            });*/
    });

    it("Döviz kurlarını ekle", function (done) {
        done();
       /* this.timeout = 5000;
        db.doviz.f_db_doviz_kurlari_cek(2)
            .then(function (_dovizler) {
                db.doviz.f_db_doviz_kurlari_ekle(_dovizler)
                    .then(function (_arr) {
                        done();
                    });

            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done();
            });*/

    });

    it("İki tarih aralığındaki kurlar", function (done) {
        db.doviz.f_db_doviz_tarih_araligindaki_kurlari_getir(1, 1, 1423526400000, 1425359200000)
            .then(function (_sonuc) {
                console.log(JSON.stringify(_sonuc));
                done();

            }).fail(function (_err) {
            // Başarısız
            console.log("_err" + _err);
            done();
        });

    });
});