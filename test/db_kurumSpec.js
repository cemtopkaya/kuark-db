var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    should = require('should'),
    g = require('../../node/globals'),
    request = require('supertest');

describe("db_kurum", function () {

    it("Tahtanın görebileceği kurumları çekme", function (done) {
        db.kurum.f_db_kurum_tumu(1, {Sayfa: 2, SatirSayisi: 30})
            .then(function (_kurumlar) {
                console.log(_kurumlar.Data.length)
                console.log(JSON.stringify(_kurumlar));
                done();
            })
            /* .then(function (_aktifKurumlar) {

             var arrPromise = _.map(_aktifKurumlar, function (_kurum) {
             return db.kurum.f_db_kurum_anahtar_tumu(_kurum.Id)
             .then(function (_dbKurumunAnahtarKelimeleri) {
             _kurum.AnahtarKelimeler = _dbKurumunAnahtarKelimeleri;
             })
             });

             return db.db.dbQ.Q.all(arrPromise)
             .then(function () {
             l.info("Kurumlar için anahtar kelimeler çekildi.");
             // Başarılı
             done();
             });
             })*/
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("tahtaya yeni kurum ekleme işlemi", function (done) {

        var kurum = {
            Adi: "test",
            TicariUnvani: "ediyorum",
            Statu: "özel",
            VD: "1",
            VN: "3",
            Kurumdur: true,
            AcikAdres: "aaa",
            Adi: "test",
            Faks: "4444444444",
            Kurumdur: true,
            Sehir: "antalya",
            Web: "hhh"
        };

        return db.kurum.f_db_kurum_ekle(null,kurum, 1)
            .then(function (_res) {
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });

    });

    it("kurum güncelleme işlemi", function (done) {

        var kurum = {
            Adi: "test",
            TicariUnvani: "ediyorum",
            Statu: "özel",
            VD: "1",
            VN: "3",
            Kurumdur: true,
            AcikAdres: "aaa",
            Adi: "test",
            Faks: "4444444444",
            Kurumdur: true,
            Sehir: "antalya",
            Web: "hhh",
            Id: 12
        };

        return db.kurum.f_db_kurum_guncelle(1, kurum)
            .then(function (_res) {
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });

    });

    it("Kurum Sil", function (done) {

        db.cop.f_db_cop_kurum_sil(2, 2, false)
            .then(function (_res) {
                console.log("ne geldi");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });

    it("Kurum kazanç trendi", function (done) {
       /* var tarih1 = new Date().setHours(-20 * 24);
        var tarih2 = new Date().setHours(24);*/
        db.kurum.f_db_kurum_kazanc_trendi(25,3, "1440311423428", "1448177423428")
            .then(function (_res) {
                console.log("kurum kazanç trendi sonucu:");
                console.log(_res);
                done();
            })
            .fail(function (_err) {
                console.log(_err)
            });
    });
});