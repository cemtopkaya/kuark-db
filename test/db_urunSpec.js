var db = require("../src/index")(),
    should = require('chai').should,
    expect = require('chai').expect,
    assert = require('chai').assert,
    extensions = require('kuark-extensions');


describe("DB Ürün işlemleri", function () {
    it("Ürünleri çekme işlemi", function (done) {
        db.urun.f_db_urun_tumu(8)
            .then(
                /** @param {LazyLoadingResponse} _aktifUrunler */
                function (_aktifUrunler) {
                    expect(_aktifUrunler).to.have.property('ToplamKayitSayisi');
                    assert(Array.isArray(_aktifUrunler.Data), 'Dizi olarak ürün bekliyordum ama gelmedi! Gelen: ' + _aktifUrunler);
                    done();
                })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Ürüne bağlı anahtar kelimeler listesi", function (done) {
        db.urun.f_db_urun_anahtar_tumu(1, 1)
            .then(function (_aktif) {
                assert(Array.isArray(_aktif), 'Dizi olarak ürün anahtarları bekliyordum ama gelmedi! Gelen: ' + _aktif);
                done();
            })
            .fail(function (_err) {
                // Başarısız
                console.log("_err" + _err);
                done(_err);
            });
    });

    it("Ürün sil", function (done) {

        var tahta_id = 1,
            urun_id = 1;

        db.urun.f_db_urun_sil(tahta_id, urun_id)
            .then(function (_aktif) {
                assert(_aktif == urun_id, 'Silinseydi 1 gelirdi ama ' + _aktif + ' değeri geldi');
                done();
            })
            .fail(function (_err) {
                // Başarısız
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });

    it("Kurumun ürüne verdiği teklifler", function (done) {

        var tahta_id = 1, urun_id = 5, kurum_id = 1;

        db.kurum.f_db_kurumun_urune_verdigi_teklif_fiyatlari(tahta_id, kurum_id, urun_id)
            .then(function (_aktif) {
                expect(_aktif).to.have.property('Fiyat');
                expect(_aktif).to.have.property('Tarih');
                done();
            })
            .fail(function (_err) {
                // Başarısız
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });

    it("Ürün ekle", function (done) {
        var kurum_id = 11,
            parabirim_id = 1;
        var urunler =
            [
                {Adi: 'FRESENIUS FX 8', Kodu: '5004731', Fiyat: 13.8836992997754, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                {Adi: 'FRESENIUS FX 10', Kodu: '5004741', Fiyat: 15.2829930505631, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id},
                {Adi: 'FRESENIUS FX 5', Kodu: '5004831', Fiyat: 13.6776288436553, Birim: 'PCE', Kurum_Id: kurum_id, ParaBirim_Id: parabirim_id}
            ];

        db.urun.f_db_urun_ekle(urunler, kurum_id, 1)
            .then(
                /**@param {Urun[]} _arrUrunler */
                function (_arrUrunler) {
                    assert(Array.isArray(_arrUrunler), 'Dizi şeklinde ürün girişi yaptık ancak dizi olarak sonucu gelmedi!');
                    expect(_arrUrunler[0]).to.have.property('Id');
                    expect(_arrUrunler[0]).to.have.property('Adi');
                    expect(_arrUrunler[0]).to.have.property('Kodu');
                    assert(_arrUrunler[0].Id > 0, 'DB ye eklenmiş olsaydı 0 olmazdı ID değeri');
                    done();
                })
            .fail(function (_err) {
                // Başarısız
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });
});