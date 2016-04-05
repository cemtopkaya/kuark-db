var db = require("../src/index")(),
    should = require('chai').should;

describe("Haber işlemleri", function () {

    it("Tahta haberleri", function (done) {

         db.haber.f_db_haber_tumu(25, 0, true,false,false)
            .then(function (_res) {
                console.log("TAHTAYA AİT HABERLER");
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Kullanıcı haberleri", function (done) {
        this.timeout(5000);
         db.haber.f_db_haber_tumu(0,1,true,false,false)
            .then(function (_res) {
                console.log("KULLANICI HABERLERİ");
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });
});