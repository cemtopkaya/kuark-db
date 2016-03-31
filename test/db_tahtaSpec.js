var uuid = require('node-uuid'),
    db = require("../../node/server/db")(),
    should = require('should'),
    g = require('../../node/globals'),
    request = require('supertest');

describe("db_tahta", function () {

    var tahta = schema.f_create_default_object(SABIT.SCHEMA.INDEX_TAHTA),
        apiRootUrl = "http://127.0.0.1:3000",
        davetli = {EPosta: "cem.topkaya@fmc-ag.com", Roller: [1, 3, 4]},
        kullanici_id = 1,
        tahtaRolu = {Id: 0, Adi: "Onaycı", Yetki: ["Kullanıcı Ekler", "Ihale Onaylar"]};
    var kullanici = schema.f_create_default_object(SABIT.SCHEMA.KULLANICI),
        apiRootUrl = "http://127.0.0.1:3000";
    kullanici.AdiSoyadi = "Cem Topkaya";
    kullanici.EPosta = "cem.topkaya@fmc-ag.com";
    kullanici.Sifre = ".q1w2e3r4.";


    before(function (done) {
        tahta.Adi = "Kullanıcı Tahtası " + (new Date()).getTime();
        tahta.Aciklama = "Tahta bilgileri";
        done();
    });


    describe("Temel Tahta işlemleri", function () {
        it("Tahta ekleniyor", function (done) {
            db.tahta.f_db_tahta_ekle(tahta, kullanici_id)
                .then(function (_dbTahta) {
                    l.info("Eklenen tahta: " + JSON.stringify(_dbTahta));
                    (_dbTahta.Id).should.be.a.Number.not.equal(0);
                    tahta = _dbTahta;
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Tahta çekiliyor", function (done) {
            db.tahta.f_db_tahta_id(1)
                .then(function (_dbTahta) {
                    l.info("Çekilen tahta: " + JSON.stringify(_dbTahta, null, 2));
                    //(_dbTahta.Genel.Id).should.be.a.Number.not.equal(0);
                    tahta = _dbTahta;
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });
    });

    describe("Test", function () {
        it("Sadece test", function (done) {
            db.redis.dbQ.hmget("adim", ["1", "3", "4"])
                .then(function (_reply) {
                    console.log("_reply:")
                    console.log(_reply)
                })
                .fail(function (_err) {
                    console.log("_err:")
                    console.log(_err)
                })
        });
    });

    describe("Rol işlemleri", function () {
        it("Rol ekle", function (done) {
            var roller = [
                {
                    "Adi": "Admin",
                    "Kurum_C": true,
                    "Urun_C": true,
                    "Ihale_C": true,
                    "Satir_C": true,
                    "Teklif_C": true,
                    "Urun_R": true,
                    "Kurum_R": true,
                    "Ihale_R": true,
                    "Satir_R": true,
                    "Teklif_R": true,
                    "Teklif_U": true,
                    "Satir_U": true,
                    "Ihale_U": true,
                    "Urun_U": true,
                    "Kurum_D": true,
                    "Kurum_U": true,
                    "Urun_D": true,
                    "Ihale_D": true,
                    "Satir_D": true,
                    "Teklif_D": true
                },
                {
                    "Adi": "Viewer",
                    "Urun_R": true,
                    "Kurum_R": true,
                    "Ihale_R": true,
                    "Satir_R": true,
                    "Teklif_R": true
                },
                {
                    "Adi": "Writer",
                    "Urun_R": false,
                    "Kurum_R": false,
                    "Ihale_R": false,
                    "Satir_R": false,
                    "Teklif_R": false,
                    "Kurum_C": true,
                    "Urun_C": true,
                    "Ihale_C": true,
                    "Satir_C": true,
                    "Teklif_C": true,
                    "Teklif_U": true,
                    "Satir_U": true,
                    "Ihale_U": true,
                    "Urun_U": true,
                    "Kurum_U": true
                }
            ]
            db.rol.f_db_rol_ekle(1, roller)
                .then(function (_dbRol) {
                    l.info("Eklenen rol: " + JSON.stringify(_dbRol));

                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Rol güncelle", function (done) {
            var rol = {};
            db.rol.f_db_rol_guncelle(1, rol)
                .then(function (_dbRol) {
                    l.info(JSON.stringify(_dbRol));
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Rol silme", function (done) {
            db.rol.f_db_rol_sil(tahta.Id, tahtaRolu.Id)
                .then(function (_dbRol) {
                    l.info("Silinen rol dbReply: " + JSON.stringify(_dbRol));
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });
    });

    describe("Davetli işlemleri", function () {
        it("Tahtaya davet ekleme", function (done) {
            db.tahta.f_db_tahta_davet_ekle(tahta.Id, davetli)
                .then(function (_dbReply) {
                    l.info("Eklenen davet sonucu dbReply: " + _dbReply);
                    (_dbReply).should.be.a.Number.equal(1);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Tahtaya davet UID ekleme", function (done) {

            db.tahta.f_db_tahta_davet_uid_ekle(tahta.Id, uuid.v1(), davetli.EPosta)
                .then(function (_dbReply) {
                    l.info("Eklenen davet UID sonucu dbReply: " + _dbReply);
                    (_dbReply).should.be.a.Number.equal(1);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Tahtaya davet silme", function (done) {

            var eposta = "cem.topkaya@fmc-ag.com";
            db.tahta.f_db_tahta_davet_sil(tahta.Id, eposta)
                .then(function (_dbReply) {
                    l.info("Davet silmenin sonucu dbReply: " + _dbReply);
                    (_dbReply).should.be.a.Number.equal(1);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });
    });

    describe("Üye işlemleri", function () {
        it("Tahtaya üye ekleme", function (done) {
            var uye = {Kullanici_Id: 1, Roller: [tahtaRolu.Id]};
            db.tahta.f_db_tahta_uye_ekle(tahta.Id, uye)
                .then(function (_dbReply) {
                    l.info("Tahtaya üye eklendi. DB sonucu dbReply: " + _dbReply);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Tahtanın üyelerini çekme", function (done) {
            db.tahta.dbQ.del(db.redis.kp.temp.ssetKullanici)
                .then(function () {
                    db.tahta.f_db_tahta_uyeleri(1)
                        .then(function (_dbReply) {
                            l.info("Tahtanın üyeleri çekildi. DB sonucu dbReply: " + JSON.stringify(_dbReply, null, 2));
                            //_dbReply.should.be.defined;
                            //(_dbReply).should.be.an.Array;
                            done();
                        })
                        .fail(function (_err) {
                            l.error(_err);
                            done(_err);
                        });
                });
        });

    });

    describe("Anahtar işlemleri", function () {
        it("Tahtaya anahtar ekleme", function (done) {
            var anahtar = {AnahtarKelimeler: "duygu;deniz;test"};
            db.tahta.f_db_tahta_anahtar_ekle(1, anahtar)
                .then(function (_dbReply) {
                    l.info("Tahtaya anahtar eklendi. DB sonucu dbReply: " + _dbReply);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Tahtanın anahtarlarını çekme", function (done) {
            db.tahta.f_db_tahta_anahtar_tumu(1)
                .then(function (_dbReply) {
                    l.info("Tahtanın anahtarları çekildi. DB sonucu dbReply: " + _dbReply);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });
    });
});