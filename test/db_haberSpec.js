var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    _ = require('underscore'),
    global = require('../../node/globals');

describe("Uyarı servis işlemleri", function () {

    before(function (done) {
        done();
    });

    it("Tahta haberleri", function (done) {

        return db.haber.f_db_haber_tumu(25, 0, true,false,false)
            .then(function (_res) {
                console.log("TAHTAYA AİT HABERLER");
                console.log(_res);
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
        return db.haber.f_db_haber_tumu(0,1,true,false,false)
            .then(function (_res) {
                console.log("KULLANICI HABERLERİ");
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