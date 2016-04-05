var db = require("../src/index")(),
    should = require('chai').should,
    expect = require('chai').expect,
    assert = require('chai').assert,
    defaults = require('json-schema-defaults'),
    schema = require('kuark-schema'),
    extensions = require('kuark-extensions');

describe("DB Kullanıcı işlemleri", function () {

    /** @type {Kullanici} */
    var kullanici = defaults(schema.f_get_schema(schema.SCHEMA.KULLANICI));

    kullanici.AdiSoyadi = "Cem Topkaya";
    kullanici.EPosta = "cem.topkaya@fmc-ag.com";
    kullanici.Sifre = ".q1w2e3r4.";
    kullanici.Providers = {};
    kullanici.Providers.AD = {};


    it("Kullanıcı ekleme", function (done) {

        db.kullanici.f_db_kullanici_ekle(kullanici)
            .then(function (_dbKullanici) {
                console.log("db kullanıcı: " + JSON.stringify(_dbKullanici));
                //return (_dbKullanici.Id).should.be.exactly(37).and.be.a.Number;
                assert(_dbKullanici.Id > 0, 'Kullanıcıyı ekleyebilseydi ID değeri 0\'dan büyük olurdu ama olmadı!');
                done()
            })
            .fail(function (_err) {
                extensions.ssr = [{"_err": _err}];
                done(_err);
            });
    });

    it("Tüm Kullanıcıları çekme", function (done) {

        db.kullanici.f_db_kullanici_tumu(true)
            .then(function (_dbKullanici) {
                console.log("db kullanıcı " + JSON.stringify(_dbKullanici));
                done();
            })
            .fail(function (_err) {
                console.log("HATA>>" + _err);
                done(_err);
            });
    });


    it("Tek kullanıcı çekme", function (done) {
        db.kullanici.f_db_kullanici_id(1)
            .then(function (_dbReply) {
                console.log("_dbReply: " + JSON.stringify(_dbReply, null, 2));
                //return (_dbReply.Id).should.be.a.Number;
                done();
            })
            .fail(function (_err) {
                console.log("Err: " + _err);
                done(_err);
            });
    });

    it("Local kullanıcı bul", function (done) {
        db.kullanici.f_db_kullanici_LOCAL_eposta("cem.topkaya@hotmail.co")
            .then(function (_dbReply) {
                console.log("_dbReply: " + JSON.stringify(_dbReply, null, 2));
                //return (_dbReply.Id).should.be.a.Number;
                //return _dbReply.should.be.Null;
                //return expect(_dbReply).to.be.a('null');
                done();
            })
            .fail(function (_err) {
                console.log("Err: " + _err);
                done(_err);
            });
    });

});