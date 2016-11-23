var db = require("../src/index")(),
    should = require('chai').should,
    expect = require('chai').expect,
    assert = require('chai').assert,
    schema = require("kuark-schema"),
    extension = require('kuark-extensions'),
    uuid = require('uuid'),
    l = extension.winstonConfig;

describe("DB Tahta İşlemleri", function () {

    /** @type {Tahta} */
    var tahta = schema.f_create_default_object(schema.SCHEMA.INDEX_TAHTA),
        kullanici_id = 1,
        tahtaRolu = {Id: 0, Adi: "Onaycı", Yetki: ["Kullanıcı Ekler", "Ihale Onaylar"]};

    /** @type {Kullanici} */
    var kullanici = schema.f_create_default_object(schema.SCHEMA.KULLANICI);

    kullanici.AdiSoyadi = "Cem Topkaya";
    kullanici.EPosta = "cem.topkaya@fmc-ag.com";
    kullanici.Sifre = ".q1w2e3r4.";

    before(function (done) {

        tahta.Genel.Id = 1;
        tahta.Genel.Adi = "Kullanıcı Tahtası " + (new Date()).getTime();
        tahta.Genel.Aciklama = "Tahta bilgileri";
        tahta.Uyeler = [{Id: 1}];
        tahta.Roller = [{Id: 0}];
        done();
    });


    describe("Temel Tahta işlemleri", function () {
        it("Tahta ekleniyor", function (done) {
            console.log("tahta>" + JSON.stringify(tahta));

            db.tahta.f_db_tahta_ekle(tahta.Genel,1)
                .then(
                    /** @param {Tahta} _dbTahta */
                    function (_dbTahta) {
                        console.log("_dbTahta>"+ _dbTahta);

                        assert(_dbTahta.Genel.Id > 0, 'Tahta sisteme eklenemedi!');
                        done();
                    })
                .fail(function (_err) {
                    extension.ssr = _err;
                    done(_err);
                });
        });


        it("Tahta çekiliyor", function (done) {
            var iCekilenTahta_Id = 1;
            db.tahta.f_db_tahta_id(iCekilenTahta_Id)
                .then(function (_dbTahta) {
                    //l.info("Çekilen tahta: " + JSON.stringify(_dbTahta, null, 2));
                    assert(_dbTahta.Genel.Id == iCekilenTahta_Id, 'Çekilen tahtanın ID bilgisi istediğimiz ID\'den farklı!');
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
                    console.log(_reply);
                    done();
                })
                .fail(function (_err) {
                    console.log("_err:")
                    console.log(_err);
                    done(_err);
                })
        });
    });

    describe("Rol işlemleri", function () {
        it("Rol ekle", function (done) {
            this.timeout = 6000;
            var roller = [{
                    "Id": 0,
                    "Adi": "Admin",
                    "Yetki": {
                        "firma": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": true,
                            "h": true
                        },
                        "urun": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": true,
                            "h": null
                        },
                        "ihale": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": true,
                            "h": true
                        },
                        "kalem": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": true
                        },
                        "kalemDurum": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": null,
                            "s": null,
                            "h": null
                        },
                        "teklif": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "uye": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "uyeRolleri": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": null,
                            "s": null,
                            "h": null
                        },
                        "rol": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "davet": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "uyari": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "tahta": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "haber": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "ajanda": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "ajandaYetki": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "anahtar": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "bolge": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        },
                        "sehir": {
                            "c": true,
                            "r": true,
                            "u": true,
                            "d": true,
                            "s": null,
                            "h": null
                        }
                    }
                }],
                tahta_id = 1;

            db.rol.f_db_rol_ekle(roller, tahta_id)
                .then(function (_dbRol) {
                    l.info("Eklenen rol: " + JSON.stringify(_dbRol));

                    done();
                })
                .fail(function (_err) {
                    extensions.ssr = [{"_err": _err}];
                    done(_err);
                });
        });

        it("Rol güncelle", function (done) {
            this.timeout = 6000;
            var rol = {
                "Id": 1,
                "Adi": "Admin",
                "Yetki": {
                    "firma": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": true,
                        "h": true
                    },
                    "urun": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": true,
                        "h": null
                    },
                    "ihale": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": true,
                        "h": true
                    },
                    "kalem": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": true
                    },
                    "kalemDurum": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": null,
                        "s": null,
                        "h": null
                    },
                    "teklif": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "uye": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "uyeRolleri": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": null,
                        "s": null,
                        "h": null
                    },
                    "rol": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "davet": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "uyari": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "tahta": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "haber": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "ajanda": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "ajandaYetki": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "anahtar": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "bolge": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    },
                    "sehir": {
                        "c": true,
                        "r": true,
                        "u": true,
                        "d": true,
                        "s": null,
                        "h": null
                    }
                }
            };
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
    });

    describe("Davetli işlemleri", function () {
        var davetli = null;
        before(function () {
            davetli = {EPosta: "cem.topkaya@fmc-ag.com", Roller: [1], UID: uuid.v1()};
        });

        it("Tahtaya davet ekleme", function (done) {

            db.tahta.f_db_tahta_davet_ekle(tahta.Genel.Id, davetli)
                .then(function (_dbReply) {
                    l.info("Eklenen davet sonucu dbReply: " + _dbReply);
                    expect(_dbReply).to.be.equal(1);
                    done();
                })
                .fail(function (_err) {
                    l.error(_err);
                    done(_err);
                });
        });

        it("Olmayan daveti tahtadan silme", function (done) {

            var eposta = uuid.v1() + "@fmc-ag.com";
            console.log("Eposta: ", eposta);
            db.tahta.f_db_tahta_davet_sil(tahta.Genel.Id, eposta)
                .then(function (_dbReply) {
                    console.log("_dbReply: > ", _dbReply);
                    expect(_dbReply).to.be.a('null');
                    done();
                })
                .fail(function (_err) {
                    console.error(_err);
                    done(_err);
                });
        });
    });

    describe("Üye işlemleri", function () {
        it("Tahtaya üye ekleme", function (done) {
            this.timeout = 6000;
            var uye = {Kullanici_Id: 1, Roller: [tahtaRolu.Id]};
            db.tahta.f_db_tahta_uye_ekle(tahta.Genel.Id, uye)
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
            this.timeout = 6000;
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

    describe("Anahtar işlemleri", function () {
        it("Tahtaya anahtar ekleme", function (done) {
            this.timeout = 6000;
            /** @type {AnahtarKelime} */
            var anahtar = {};
            anahtar.Anahtar = "kalem";
            anahtar.Id = 0;

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
            this.timeout = 6000;
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