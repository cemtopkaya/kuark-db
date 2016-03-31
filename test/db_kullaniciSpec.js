var db = require("../../node/server/db")(),
    should = require('should'),
    ActiveDirectory = require("../../node/server/ldap/AD"),
    defaults = require('json-schema-defaults'),
//schema = require('../../node/schema'),
    request = require('supertest'),
    g = require('../../node/globals');

describe("DB Kullanıcı işlemleri", function () {

    var kullanici = defaults(schema.f_get_schema(SABIT.SCHEMA.KULLANICI)),
        apiRootUrl = "http://127.0.0.1:3000";
    kullanici.AdiSoyadi = "Cem Topkaya";
    kullanici.EPosta = "cem.topkaya@fmc-ag.com";
    kullanici.Sifre = ".q1w2e3r4.";


    describe("AD", function () {

        before(function (done) {
            var adUserName = kullanici.EPosta;
            if (adUserName.indexOf("@") > 0) {
                adUserName = adUserName.substring(0, adUserName.indexOf("@"));
            }
            var ad = new ActiveDirectory(adUserName, kullanici.Sifre);
            ad.f_Auth()
                .then(function (_adKullanici) {
                    console.log("Ad Kullanıcı: " + JSON.stringify(_adKullanici));
                    if (_adKullanici.dn) {
                        kullanici.EPosta = _adKullanici.mail;
                        kullanici.Providers.AD = _adKullanici;
                        done();
                    } else {
                        console.log("Kullan�c� Active Directory'de tan�ml� de�il!");
                        done();
                    }
                });
        });

        it("Kullanıcı AD login denemesi", function (done) {
            var body = {"email": "cem.topkaya@fresenius.com.tr", "password": ".q1w2e3r4."};
            return request(apiRootUrl)
                .post('/login/local')
                .send(body)
                .expect(302)
                .expect(function (res) {
                    (res.text).should.equal('Moved Temporarily. Redirecting to /')
                })
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    console.log("end içi");
                    // Should.js fluent syntax applied
                    //res.body.should.have.property('_id');
                    //res.body.firstName.should.equal('JP');
                    //res.body.lastName.should.equal('Berd');
                    //res.body.creationDate.should.not.equal(null);
                    done();
                });
        });

        it("Kullanıcı register", function (done) {
            var body = {
                "AdiSoyadi": "Cem TOPKAYA",
                "EPosta": "cem.topkaya@fmc-ag.com",
                "Sifre": ".q1w2e3r4.",
                "Sifre2": ".q1w2e3r4."
            };
            request(apiRootUrl)
                .post('/login/register')
                .send(body)
                .expect(function (res) {
                    debugger;
                    console.log(res);
                }).end(done);
        });
    });

    describe("DB", function () {
        it("Kullanıcı ekleme", function () {

            return db.kullanici.f_db_kullanici_ekle(kullanici)
                .then(function (_dbKullanici) {
                    console.log("db kullan�c�: " + JSON.stringify(_dbKullanici));
                    //return (_dbKullanici.Id).should.be.exactly(37).and.be.a.Number;
                    return (_dbKullanici.Id).should.be.a.Number;
                });
        });

        it("Tüm Kullanıcıları çekme", function (done) {

            return db.kullanici.f_db_kullanici_tumu(true)
                .then(function (_dbKullanici) {
                    console.log("db kullanıcı " + JSON.stringify(_dbKullanici));
                    done();
                }).fail(function (_err) {
                    console.log("HATA>>" + _err);
                    done(_err);
                });
        });
    });

    describe("db_kullanici", function () {
        it("kullanıcı yetkilimi?", function (done) {
            return db.kullanici.f_db_kullanici_yetkilimi(1, 3, "Yetkiler.rol.r")
                .then(function (_dbReply) {
                    console.log("_dbReply: " + JSON.stringify(_dbReply));
                    //return (_dbKullanici.Id).should.be.exactly(37).and.be.a.Number;
                    return (_dbReply).should.be.a.Boolean;
                }).fail(function (_err) {
                    console.log("Err: " + _err);
                    done();
                });
        });

        it("Tek kullanıcı çekme", function (done) {
            return db.kullanici.f_db_kullanici_id(1)
                .then(function (_dbReply) {
                    console.log("_dbReply: " + JSON.stringify(_dbReply, null, 2));
                    //return (_dbReply.Id).should.be.a.Number;
                    return _dbReply;
                }).fail(function (_err) {
                    console.log("Err: " + _err);
                    done();
                });
        });

        it("Local kullanıcı bul", function (done) {
            return db.kullanici.f_db_kullanici_local_eposta("cem.topkaya@hotmail.co")
                .then(function (_dbReply) {
                    console.log("_dbReply: " + JSON.stringify(_dbReply, null, 2));
                    //return (_dbReply.Id).should.be.a.Number;
                    //return _dbReply.should.be.Null;
                    //return expect(_dbReply).to.be.a('null');
                    done();
                }).fail(function (_err) {
                    console.log("Err: " + _err);
                    done();
                });
        })
    })
});