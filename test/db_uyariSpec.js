var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    should = require('should'),
    global = require('../../node/globals');

describe("Uyarı servis işlemleri", function () {

    before(function (done) {
        done();
    });

    describe("uyarı işlemleri", function () {
        it("Uyarı gönder", function (done) {

            this.timeout(500000);
            return db.uyari_servisi.f_servis_uyarilari_cek_calistir()
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

        it("Dikkat toplam", function (done) {

            return db.dikkat.f_db_dikkat_toplam(1, true, false, false)
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

            return db.dikkat.f_db_dikkat_tumu(1, true, false, false)
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

       /* it("Uyarı sonuçlarını göster", function (done) {

            this.timeout(5000);
            return db.uyari_servisi.f_servis_uyari_sonuclari_tumu(1, "2fd1e7d0-726f-11e5-a652-493f385e92b1", 10, 0)
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
        });*/
    });
});