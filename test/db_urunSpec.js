var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    should = require('should'),
    g = require('../../node/globals'),
    _ = require('underscore'),
    request = require('supertest');

describe("db_urun", function () {

    before(function (done) {
        done();
    });

    describe("Ürün işlemleri", function () {
        it("Ürünleri çekme işlemi", function (done) {
            db.urun.f_db_urun_tumu(8)
                .then(function (_aktif) {
                    console.log("GELEN ÜRÜNLER");
                    console.log(_aktif);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + _err);
                });
        });


        it("Ürün sil", function (done) {
            db.urun.f_db_urun_sil(8, 8)
                .then(function (_aktif) {
                    console.log("GELEN");
                    console.log(_aktif);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + _err);
                });
        });

        it("Kurumun ürüne verdiği teklifler", function (done) {
            db.kurum.f_db_kurumun_urune_verdigi_teklif_fiyatlari(1, 1, 5)
                .then(function (_aktif) {
                    console.log("GELEN");
                    console.log(_aktif);
                    done();
                })
                .fail(function (_err) {
                    // Başarısız
                    console.log("_err" + _err);
                });
        });

        it("Ürün ekle", function (done) {
            var kurum_id = 11,
                parabirim_id = 1;
            var urunler =
                [
                    {Adi: 'CAPD 2 STAYSAFE 2000ML OSTE. 11 LAN.', Kodu: '2197501', Fiyat: 13.8217676767677, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'CAPD 3 STAYSAFE 2000ML OSTEU. 11L RC', Kodu: '2198501', Fiyat: 13.795, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'CAPD  17 STAY.SAFE, 2000ML OE RC', Kodu: '2261301', Fiyat: 13.8206666666667, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'CAPD  19 STAY.SAFE, 2000ML OE RC', Kodu: '2266301', Fiyat: 13.8554411764706, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'AV-Set stnd. Rontis', Kodu: '22H2230S', Fiyat: 4.93678714859438, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'AV-Set torbali Rontis', Kodu: '22H223DS', Fiyat: 5.40070183486239, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'CAPD 17 STAY.SAFE, 2500ML 9 LANG. RC', Kodu: '2561511', Fiyat: 14.5815833333333, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'STAY.SAFE LUER-LOCK SET RB', Kodu: '2599911', Fiyat: 7.97111111111111, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'HOLDER FOR ORGANIZER', Kodu: '2842571N', Fiyat: 53.6165, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'CATHETER EXTENSION STAY-SAFE LL 32 CM', Kodu: '2843181', Fiyat: 12.8875, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'STAY.SAFE DISINFECTION CAP', Kodu: '2845091', Fiyat: 0.27346, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'ATG-Fresenius S Turkey 1x5 ml', Kodu: '3509101', Fiyat: 561.83925, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'ATG-Fresenius S  Turkey 10x5 ml', Kodu: '3509104', Fiyat: 5571.24853448276, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'HEMOFLOW F 3', Kodu: '5001651', Fiyat: 14.1963926940639, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'FRESENIUS FX 8', Kodu: '5004731', Fiyat: 13.8836992997754, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'FRESENIUS FX 10', Kodu: '5004741', Fiyat: 15.2829930505631, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'FRESENIUS FX 5', Kodu: '5004831', Fiyat: 13.6776288436553, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'HEMOFLOW F 4 HPS', Kodu: '5007041', Fiyat: 15.934, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'HEMOFLOW F 7 HPS', Kodu: '5007071', Fiyat: 18.0983177570093, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                    {Adi: 'HEMOFLOW F 10 HPS', Kodu: '5007201', Fiyat: 20.8442056074766, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id}
                ];

            db.urun.f_db_urun_ekle(urunler, kurum_id, 1)
                .then(function (_aktif) {
                    console.log("GELEN");
                    console.log(_aktif);
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