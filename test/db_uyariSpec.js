var db = require("../src/index")(),
    should = require('chai').should,
    expect = require('chai').expect;

describe("Uyarı servis işlemleri", function () {

    describe("uyarı işlemleri", function () {
        it("Uyarı gönder", function (done) {

            this.timeout(5000);
             db.uyari_servisi.f_servis_uyarilari_cek_calistir()
                .then(function (_res) {
                    console.log("SONUÇ");
                    console.log(_res);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + JSON.stringify(_err));
                    done(_err);
                });
        });

        it("Dikkat toplam", function (done) {

             db.dikkat.f_db_dikkat_toplam(1, true, false, false)
                .then(function (_res) {
                    console.log("SONUÇ");
                    console.log(_res);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + _err);
                    done(_err);
                });
        });

        it("Dikkat tümü", function (done) {

             db.dikkat.f_db_dikkat_tumu(1, true, false, false,0,10)
                .then(function (_res) {
                    console.log("SONUÇ");
                    console.log(_res);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + _err);
                    done(_err);
                });
        });

    });
});