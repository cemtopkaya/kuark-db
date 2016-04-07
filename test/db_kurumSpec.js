var db = require("../src/index")(),
    should = require('chai').should,
    assert = require('chai').assert,
    expect = require('chai').expect;

describe("DB Kurum İşlemleri", function () {

    it("Tahtanın görebileceği kurumları çekme", function (done) {
        db.kurum.f_db_kurum_tumu(1, {Sayfa: 2, SatirSayisi: 30})
            .then(function (_kurumlar) {
                console.log(_kurumlar.Data.length);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("tahtaya yeni kurum ekleme işlemi", function (done) {

        /** @type {KurumDB} */
        var kurum = {
            Adi: "test",
            TicariUnvani: "ediyorum",
            Statu: "özel",
            VD: "1",
            VN: "3",
            Kurumdur: 1,
            AcikAdres: "aaa",
            Faks: "4444444444",
            Sehir: "antalya",
            Web: "hhh"
        };

        db.kurum.f_db_kurum_ekle(kurum, 1)
            .then(function (_res) {
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
                done(_err);
            });

    });

    it("kurum güncelleme işlemi", function (done) {

        var kurum = {
            Adi: "test",
            TicariUnvani: "ediyorum",
            Statu: "özel",
            VD: "1",
            VN: "3",
            AcikAdres: "aaa",
            Faks: "4444444444",
            Kurumdur: true,
            Sehir: "antalya",
            Web: "hhh",
            Id: 12
        };

        db.kurum.f_db_kurum_guncelle(1, kurum, kurum)
            .then(function (_res) {
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
                done(_err);
            });

    });

    it("Kurum Sil", function (done) {

        db.cop.f_db_cop_kurum_sil(1, 1)
            .then(function (_res) {
                console.log("ne geldi");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log("_err");
                //assert(_err.Icerik == "Silinmek istenen kurum GENEL kurumlar içerisinde kayıtlı olduğu için işlem tamamlanamadı!", 'Silme işini başaramasını bekliyorduk ama öyle olmadı! Gelen: ' + _err);
                //assert(_err.Icerik == "Silmek istediğiniz kuruma ait sistemde kayıtlı teklifler bulunduğu için işlem tamamlanamadı!", 'Silme işini başaramasını bekliyorduk ama öyle olmadı! Gelen: ' + _err);
                done();
            });
    });

    it("Kurum kazanç trendi", function (done) {
        /* var tarih1 = new Date().setHours(-20 * 24);
         var tarih2 = new Date().setHours(24);*/
        db.kurum.f_db_kurum_kazanc_trendi(1, 1, 1, "1440311423428", "1448177423428")
            .then(function (_res) {
                console.log("kurum kazanç trendi sonucu:");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
                done(_err);
            });
    });
});