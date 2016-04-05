'use strict';

var l = require('../lib/winstonConfig'),
    schema = require("kuark-schema"),
    emitter = new (require('events').EventEmitter)(),
    extension = require('kuark-extensions'),
    _ = require('lodash');

/**
 * Fonksiyon parametrelerini kullanım örneği code intellisense
 * Kullanıcıya ait aktif/pasif tahtaları getirir.
 * @returns {Array}
 * @param {integer} _kul_id
 * @param {{rol:(true|false), anahtar:boolean, kullanici:boolean}=} _opts
 *
 * @param {boolean=} _opts.rol
 * @param {boolean} _opts.kullanici
 * @param {boolean} _opts.anahtar
 */

/**
 * Kullanıcı işlemlerini yerine getirir
 * Kullanıcı Kayıtları
 * <pre>
 * HS > idx:kullanici                        : IDX
 * HS > kullanici                            : Tüm kullanıcı bilgilerini tutan HS. kullanici_id | kullanici_bilgileri_json > 1 | {Id:1, AdiSoyadi:"Cem Topkaya"..,Proiveders:{ FB:{id:21342342341123, displayName:"TC Cem Topkaya"...}, ..} }
 * HS > kullanici:local                      : Provider kullanmaksızın girişte kullanacağı eposta | kullanici_id > cem.topkaya@fresenius.com.tr | 1
 * HS > kullanici:facebook                   : facebook_id | kullanici_id > 21342342341123 | 1
 * HS > kullanici:twitter                    : "   "
 * HS > kullanici:googleplus                 : "   "
 * HS > kullanici:activedirectory            : "   "
 * </pre>
 *
 * Kullanıcı Kayıtları
 * <pre>
 *  HS > tahta                               : Tüm tahtalar
 *  ss > kullanici:X:tahta:sahip             : Kullanıcıya ait tahtalar
 *  ss > kullanici:X:tahta:sahip:silinen     : Kullanıcının sildiği tahtaları
 *  ss > kullanici:X:tahta:uye               : Kullanıcının üye olduğu tahtalar
 *
 * </pre>
 * @returns {DBKullanici}
 * @constructor
 */
function DB_Kullanici() {
    /**
     *
     * @type {DBKullanici}
     */
    var result = {};

    //region PROFİL BİLGİLERİ
    function f_db_kullanici_profil(kul_id) {
        return result.dbQ.hget_json_parse(result.kp.kullanici.hsetKullaniciProfilleri, kul_id);
    }

    function f_db_kullanici_profil_ekle(kul_id, profil) {

        return result.dbQ.hset(result.kp.kullanici.hsetKullaniciProfilleri, kul_id, JSON.stringify(profil))
            .then(function () {
                return f_db_kullanici_profil(kul_id);
            });
    }

    /**
     * Kullanıcının oturum durumunu getirir
     * @param {int} _kul_id
     * @param {int} _durum_id
     * @returns {*}
     */
    function f_db_kullanici_oturum_durumu(_kul_id) {
        return result.dbQ.hget(result.kp.kullanici.hsetKullaniciOturumDurumlari, _kul_id);
    }

    /**
     * Kullanıcının oturum durumunu ekle(online-offline..vb)
     * @param {int} _kul_id
     * @param {int} _durum_id
     * @returns {*}
     */
    function f_db_kullanici_oturum_durumu_ekle(_kul_id, _durum_id) {
        return result.dbQ.hset(result.kp.kullanici.hsetKullaniciOturumDurumlari, _kul_id, _durum_id);
    }

    //endregion

    //region KULLANICI TAHTALARI
    /**
     * Kullanıcının sahip ve üye olduğu aktif tahtalarını getirir
     * @param kul_id
     * @returns {*}
     */
    function f_db_kullanici_tahta_idleri(kul_id) {
        // 1. + Kullanıcının sahip oldukları
        // 2. + Kullanıcının üyesi olduğu tahta id leri
        // 3. - Kullanıcının sildikleri
        return [
            result.dbQ.sunion(
                result.kp.kullanici.ssetSahipOlduguTahtalari(kul_id, true),//1.
                result.kp.kullanici.ssetUyeOlduguTahtalari(kul_id, true)//2.
            ),
            result.dbQ.smembers(result.kp.tahta.ssetSilinen) //3.
        ].allX().then(function (_arrReplies) {
            var arrAktifTahtalar = _arrReplies[0],
                arrPasifTahtalar = _arrReplies[1],
                kullaniciTahtalari = arrAktifTahtalar.differenceXU(arrPasifTahtalar);

            return kullaniciTahtalari.mapX(null, parseInt);
        }).fail(function (_err) {
            ssr = [{"_err": _err}];
            throw _err;
        });
    }

    /**
     * Kullanıcı tahtalarını dizi içinde nesneler olarak dönecektir
     * @param {integer} _kul_id
     * @param {OptionsTahta=} _opts
     * @returns {Promise}
     */
    function f_db_kullanici_tahtalari(_kul_id, _opts) {

        return f_db_kullanici_tahta_idleri(_kul_id)
            .then(function (_dbArrTahtaId) {
                //console.log = "Oncesi _dbArrTahtaId": _dbArrTahtaId;
                var db_tahta = require('./db_tahta');
                return db_tahta.f_db_tahta_id(_dbArrTahtaId, _opts);
            });
    }

    //endregion

    //region KULLANICI BÖLGELERİ
    /**
     * KULLANICI BÖLGELERİ
     * @param kul_id
     * @returns {*}
     */
    function f_db_kullanici_bolge_tumu(kul_id) {
        return result.dbQ.smembers(result.kp.kullanici.ssetBolgeleri(kul_id));
    }

    function f_db_kullanici_bolge_ekle(kul_id, bolge) {
        return result.dbQ.sadd(result.kp.kullanici.ssetBolgeleri(kul_id), bolge.Id)
    }

    function f_db_kullanici_bolge_sil(kul_id, bolge_id) {
        return result.dbQ.srem(result.kp.kullanici.ssetBolgeleri(kul_id), bolge_id);
    }

    //endregion

    //region Kullanıcı Yetki İŞLEMLERİ
    /**
     * Kullanıcı Yetki İŞLEMLERİ (EKLE-SİL-GÜNCELLE-BUL)
     * @param kul_id
     * @returns {*}
     */
    function f_db_kullanici_yetki_tumu(kul_id) {
        return result.dbQ.smembers(result.kp.kullanici.ssetYetkileri(kul_id))
            .then(function (_aktif) {
                return result.dbQ.hmget_json_parse(result.kp.yetki.tablo, _aktif);
            }).fail(function () {
                l.e("tüm kullanıcı yetkileri çekilemedi!");
            });
    }

    function f_db_kullanici_yetki_ekle(kul_id, _yetki) {
        return result.dbQ.incr(result.kp.yetki.idx)
            .then(function (_id) {
                _yetki.Id = _id;

                return result.dbQ.Q.all([
                    result.dbQ.hset(result.kp.yetki.tablo, _id, JSON.stringify(_yetki)),
                    result.dbQ.sadd(result.kp.kullanici.ssetYetkileri(kul_id), _id)
                ]).then(function () {
                    return result.dbQ.hget(result.kp.yetki.tablo, _id);
                });
            });
    }

    function f_db_kullanici_yetki_guncelle(kul_id, _yetki) {
        return result.dbQ.Q.all([
            result.dbQ.hset(result.kp.yetki.tablo, _yetki.Id, JSON.stringify(_yetki)),
            result.dbQ.sadd(result.kp.kullanici.ssetYetkileri(kul_id), _yetki.Id)

        ]).then(function () {
            return result.dbQ.hget(result.kp.yetki.tablo, _id);
        });
    }

    function f_db_kullanici_yetki_sil(kul_id, yetki_id) {
        return result.dbQ.srem(result.kp.kullanici.ssetYetkileri(kul_id), yetki_id);
    }

    //endregion

    //region KULLANICI İŞLEMLERİ - GET
    function f_aktif_kullanici_idleri() {
        var defered = result.dbQ.Q.defer();

        result.rc.multi()
            .sdiffstore("temp_kul", result.kp.kullanici.ssetGenel, result.kp.kullanici.ssetSilinen)
            .expire("temp_kul", 10)
            .smembers("temp_kul")
            .exec(function (_err, _replies) {
                if (_err) {
                    console.log("hata");
                    console.log(_err);
                    defered.reject(_err);
                } else {
                    defered.resolve(_replies[2]);
                }
            });

        return defered.promise;
    }

    /**
     * KULLANICI İŞLEMLERİ(EKLE-SİL-GÜNCELLE-TUMU)
     * @param aktif
     * @returns {*}
     */
    function f_db_kullanici_tumu(aktif) {
        if (aktif) {
            return f_aktif_kullanici_idleri()
                .then(function (_idler) {
                    return result.dbQ.hmget_json_parse(result.kp.kullanici.tablo, _idler);

                }).fail(function (err) {
                    l.e("kullanıcılar çekilemedi " + err);
                });

        } else {
            return result.dbQ.smembers(result.kp.kullanici.ssetGenel)
                .then(function (_idler) {
                    return result.dbQ.hmget_json_parse(result.kp.kullanici.tablo, _idler);
                }).fail(function (err) {
                    l.e("kullanıcılar çekilemedi " + err);
                });
        }
    }

    /**
     * id lere göre kullanıcıları buluyoruz
     * @param _idler
     * @returns {*}
     */
    function f_db_kullanici_tumu_idye_gore(_idler) {
        return result.dbQ.hmget_json_parse(result.kp.kullanici.tablo, _idler)
            .then(function (_aktif) {
                return _aktif;
            })
            .fail(function () {
                l.e("kullanıcılar çekilemedi");
            });
    }


    /**
     * Kullanıcı ve profil bilgilerinin çekilmesi sağlanır
     * @param _kul_id
     * @param {OptionsKullanici=} _opts, Kullanıcı bilgilerinin detaylarını çekip çekmemek için ayarları içerir
     * @returns {Promise}
     */
    function f_db_kullanici_id(_kul_id, _opts) {
        // _kul_id yoksa null dön
        if (!_kul_id) {
            return null;
        }
        l.info("f_db_kullanici_id");

        // 1. Temel bilgileri
        // 2. Profil bilgileri
        // 3. Tahta bilgileri
        // 3.1 Tahta ID leri (_opts.Tahtalari.arrTahta_id || f_db_kullanici_tahta_idleri(kul_id) )
        // 3.2 Tahta bilgileri
        // 4. oturum durumu

        /** @type {OptionsKullanici} */
        var opts = result.OptionsKullanici(_opts),
            kul_id = _kul_id;

        return [
            // 1
            result.dbQ.hget_json_parse(result.kp.kullanici.tablo, kul_id),
            // 2
            opts.bProfil
                ? result.dbQ.hget_json_parse(result.kp.kullanici.hsetKullaniciProfilleri, kul_id)
                : null,
            // 3
            opts.bTahtalari
                ? (opts.Tahtalari.arrTahta_id != null ? opts.Tahtalari.arrTahta_id : f_db_kullanici_tahta_idleri(kul_id))
                : null,
            //4
            opts.bOturumDurumu
                ? f_db_kullanici_oturum_durumu(parseInt(kul_id))
                : 1
        ].allX()
            .then(function (_dbReplies) {

                if (_dbReplies[0] == null) {
                    //Kullanıcı yok, boş dön
                    return null;
                }

                /** @type {Kullanici} */
                var kullanici = schema.f_create_default_object(schema.SCHEMA.KULLANICI);

                // 1
                _.extend(kullanici, _dbReplies[0]);
                // 2
                kullanici.Profil = _dbReplies[1];

                // 4
                kullanici.OturumDurumu = parseInt(_dbReplies[3]);

                // 3
                var arrKullaniciTahtaIdleri = _dbReplies[2];
                if (Array.isArray(arrKullaniciTahtaIdleri) && arrKullaniciTahtaIdleri.length == 0) {
                    kullanici.Tahtalari = [];
                    return kullanici;
                }

                return arrKullaniciTahtaIdleri
                    .mapX(null, f_db_kullanici_tahtalari, opts.Tahtalari).allX()
                    .then(function (_arrTahtalari) {
                        kullanici.Tahtalari = _arrTahtalari;

                        return kullanici;
                    });
            })
            .then(function (_dbKullanici) {
                return _dbKullanici;
            });
    }


    /**
     * Kullanıcının bilgileri Tahta Üyesi olma durumuna göre çeker
     * @param {integer} _uye_id
     * @param {integer} _tahta_id
     * @param {OptionsUye=} _opts
     */
    function f_db_uye_id(_uye_id, _tahta_id, _opts) {
        // 1. Temel Tahta Üye bilgileri
        // 2. Tahtadaki rolleri


        /** @type {OptionsUye} */
        var opts = result.OptionsUye(_opts);

        return (Array.isArray(_uye_id)
            ? result.dbQ.hmget_json_parse(result.kp.kullanici.tablo, _uye_id)
            : result.dbQ.hget_json_parse(result.kp.kullanici.tablo, _uye_id))
            .then(function (_dbUye) {
                if (!_dbUye) {
                    return null;
                }

                function f_uye_bilgileri(_uye) {
                    /** @type {Uye} */
                    var olusan_uye = schema.f_create_default_object(schema.SCHEMA.UYE);

                    _.extend(olusan_uye, _uye);

                    if (_tahta_id) {
                        //tahtaya bağlı üyelerin rollerini bul
                        return [
                            opts.bArrTahtaUyeRolId
                                ? result.dbQ.hget_json_parse(result.kp.tahta.hsUyeleri(_tahta_id), _uye.Id)
                                : []]
                            .allX()
                            .then(function (_dbReplies) {
                                olusan_uye.Roller = _dbReplies[0];
                                return olusan_uye;
                            });
                    } else {
                        return olusan_uye;
                    }
                }

                return (Array.isArray(_dbUye)
                    ? _dbUye.map(f_uye_bilgileri).allX()
                    : f_uye_bilgileri(_dbUye))
                    .then(function (_olusan_uye) {
                        return _olusan_uye;
                    });
            });


        /* /!** @type {Uye} *!/
         var uye = schema.f_create_default_object(schema.SCHEMA.UYE);

         return [
         // 1
         opts.bTemelTahtaUyeBilgileri
         ? result.dbQ.hget_json_parse(result.kp.kullanici.tablo, _uye_id)
         : null,
         // 2
         opts.bArrTahtaUyeRolId && _tahta_id
         ? result.dbQ.hget_json_parse(result.kp.tahta.hsUyeleri(_tahta_id), _uye_id)
         : null]
         .allX()
         .then(function (_dbReplies) {
         extension.ssg = [{"_dbReplies": _dbReplies}];
         // 1
         _.extend(uye, _dbReplies[0]);

         // 2
         uye.Roller = _dbReplies[1];

         return uye;
         });*/
    }

    /**
     * Birden fazla kullanıcı id için bilgilerinin oluşturulması sağlanır(kullanıcı genel ve profil bilgileri)
     * @param {Integer[]} _arr_kullanici_idleri
     * @returns {*}
     */
    function f_db_kullanici_idler(_arr_kullanici_idleri) {
        return _arr_kullanici_idleri.mapX(null, f_db_kullanici_id).allX();
    }


    function f_db_kullanici_refresh_token_ekle(_kul_id, _token) {
        return result.dbQ.hset(result.kp.kullanici.hsetGPlusToken, _kul_id, JSON.stringify(_token));

        1 | 4587456445

    }

    //endregion

    //region KULLANICI PROVIDER ISLEMLERI

    //region db_kullanici_id dönen fonksiyonlar

    /**
     * Kullanıcı eposta adresiyle, varsa kullanıcı bilgisi döner
     * @param _eposta {String} - Kullanıcı adı olarak e-posta adresini kullanıyoruz.
     * @returns {Promise}
     */
    function f_eposta_to_db_kullanici_id(_eposta) {
        return result.dbQ.hget(result.kp.kullanici.hsetLocalKullanicilari, _eposta);
    }

    function f_AD_to_db_kullanici_id(_userPrincipalName) {
        return result.dbQ.hget(result.kp.kullanici.hsetADKullanicilari, _userPrincipalName);
    }

    function f_FACEBOOK_id_to_db_kullanici_id(fb_id) {
        return result.dbQ.hget(result.kp.kullanici.hsetFacebookKullanicilari, fb_id);
    }

    function f_TWITTER_id_to_db_kullanici_id(tw_id) {
        return result.dbQ.hget(result.kp.kullanici.hsetTwitterKullanicilari, tw_id);
    }

    function f_GPLUS_id_to_db_kullanici_id(gp_id) {
        return result.dbQ.hget(result.kp.kullanici.hsetGPlusKullanicilari, gp_id);
    }

    //endregion

    //region db_kullanici dönen fonksiyonlar

    function f_db_kullanici_LOCAL_eposta(_eposta) {
        return result.dbQ.hget(result.kp.kullanici.hsetLocalKullanicilari, _eposta)
            .then(f_db_kullanici_id);
    }

    /**
     * Kullanıcı eposta adresiyle, varsa kullanıcı bilgisi döner
     * @param _principleName {String} - Kullanıcı adı olarak e-posta adresini kullanıyoruz.
     * @returns {Promise}
     */
    function f_db_kullanici_AD_principleName(_principleName) {
        return f_AD_to_db_kullanici_id(_principleName).then(f_db_kullanici_id);
    }

    function f_db_kullanici_FACEBOOK_id(fb_id) {
        return f_FACEBOOK_id_to_db_kullanici_id(fb_id).then(f_db_kullanici_id);
    }

    function f_db_kullanici_GPLUS_id(gp_id) {
        return f_GPLUS_id_to_db_kullanici_id(gp_id).then(f_db_kullanici_id);
    }

    function f_db_kullanici_TWITTER_id(tw_id) {
        return f_TWITTER_id_to_db_kullanici_id(tw_id).then(f_db_kullanici_id);
    }


    //endregion

    //endregion

    //region KULLANICI EKLE-GUNCELLE-SIL
    /**
     * Kullanıcının sistemde kayıtlı olup olmadığı kontrol edilir, yoksa null döner
     * @param kullanici
     * @returns {*}
     */
    function f_db_kullanici_kontrol(kullanici) {
        var defer = result.dbQ.Q.defer();
        console.log("Kullanici: " + JSON.stringify(kullanici.Providers));
        if (Object.keys(kullanici.Providers).length) {
            var provider_id;
            if (kullanici.Providers.FB) {
                provider_id = kullanici.Providers.FB.id;
                return f_db_kullanici_FACEBOOK_id(provider_id);
            }
            else if (kullanici.Providers.TW) {
                provider_id = kullanici.Providers.TW.id;
                return f_db_kullanici_TWITTER_id(provider_id);
            }
            else if (kullanici.Providers.GP) {
                provider_id = kullanici.Providers.GP.id;
                return f_db_kullanici_GPLUS_id(provider_id);
            }
            else if (kullanici.Providers.AD) {
                provider_id = kullanici.Providers.AD.userPrincipalName;
                return f_db_kullanici_LOCAL_eposta(provider_id);
            }
        } else {
            defer.reject(null);
        }
        return defer.promise;
    }

    function f_db_kullanici_ekle(kullanici) {

        return result.dbQ.incr(result.kp.kullanici.idx)
            .then(function (_id) {
                var provider_id,
                    key;
                kullanici.Id = _id;

                if (kullanici.Providers.AD && kullanici.Providers.AD.userPrincipalName) {
                    provider_id = kullanici.Providers.AD.userPrincipalName;
                    key = result.kp.kullanici.hsetADKullanicilari;
                }
                else if (kullanici.Providers.FB && kullanici.Providers.FB.id) {
                    provider_id = kullanici.Providers.FB.id;
                    key = result.kp.kullanici.hsetFacebookKullanicilari;
                }
                else if (kullanici.Providers.TW && kullanici.Providers.TW.id) {
                    provider_id = kullanici.Providers.TW.id;
                    key = result.kp.kullanici.hsetTwitterKullanicilari;
                }
                else if (kullanici.Providers.GP && kullanici.Providers.GP.id) {
                    provider_id = kullanici.Providers.GP.id;
                    key = result.kp.kullanici.hsetGPlusKullanicilari;
                }

                return [
                    result.dbQ.hset(result.kp.kullanici.tablo, _id, JSON.stringify(kullanici)),
                    result.dbQ.sadd(result.kp.kullanici.ssetGenel, _id),
                    //oturum durumunu default 1:online olarak belirle
                    result.dbQ.hset(result.kp.kullanici.hsetKullaniciOturumDurumlari, _id, 1),
                    // her halükarda(e-posta adresini aldığımız için) local user oluşacak
                    result.dbQ.hset(result.kp.kullanici.hsetLocalKullanicilari, kullanici.EPosta, _id),
                    // Eğer bir provider'dan geliyorsa provider_id ile kullanici_id yi eşleştirecek şekilde de kaydedelim
                    provider_id
                        ? result.dbQ.hset(key, provider_id, _id)
                        : null
                ].allX().then(function () {

                    return f_db_kullanici_id(kullanici.Id).then(function (_dbKullanici) {
                        //kullanıcı işlemleri için tetikle(elastic ekle..vb)
                        emitter.emit(schema.SABIT.OLAY.KULLANICI_EKLENDI, kullanici);
                        return _dbKullanici;
                    });

                });
            });
    }

    function f_db_kullanici_guncelle(kullanici) {
        delete kullanici.AnahtarKelimeler;

        return [
            kullanici.Providers.GP && kullanici.Providers.GP.id
                ? result.dbQ.hset(result.kp.kullanici.hsetGPlusKullanicilari, kullanici.Providers.GP.id, kullanici.Id)
                : null,
            kullanici.Providers.TW && kullanici.Providers.TW.id
                ? result.dbQ.hset(result.kp.kullanici.hsetTwitterKullanicilari, kullanici.Providers.TW.id, kullanici.Id)
                : null,
            kullanici.Providers.FB && kullanici.Providers.FB.id
                ? result.dbQ.hset(result.kp.kullanici.hsetFacebookKullanicilari, kullanici.Providers.FB.id, kullanici.Id)
                : null,
            kullanici.Providers.AD && kullanici.Providers.AD.userPrincipalName
                ? result.dbQ.hset(result.kp.kullanici.hsetADKullanicilari, kullanici.Providers.AD.userPrincipalName, kullanici.Id)
                : null,
            result.dbQ.hset(result.kp.kullanici.tablo, kullanici.Id, JSON.stringify(kullanici))
        ].allX().then(function () {

            emitter.emit(schema.SABIT.OLAY.KULLANICI_GUNCELLENDI, kullanici);
            return f_db_kullanici_id(kullanici.Id);
        });
    }

    function f_db_kullanici_sil(kullanici_id) {
        if (kullanici_id) {

            emitter.emit(schema.SABIT.OLAY.KULLANICI_SILINDI, kullanici_id);

            return result.dbQ.sadd(result.kp.kullanici.ssetSilinen, kullanici_id);

        } else {
            l.e("Silinecek aktif bir kullanici bulunamadı");
        }
    }

    //endregion

    /**
     * @class DBKullanici
     */
    result = {
        f_db_kullanici_oturum_durumu: f_db_kullanici_oturum_durumu,
        f_db_kullanici_oturum_durumu_ekle: f_db_kullanici_oturum_durumu_ekle,
        f_db_kullanici_kontrol: f_db_kullanici_kontrol,
        f_db_kullanici_profil: f_db_kullanici_profil,
        f_db_kullanici_profil_ekle: f_db_kullanici_profil_ekle,
        f_db_kullanici_tahta_idleri: f_db_kullanici_tahta_idleri,
        f_db_kullanici_tahtalari: f_db_kullanici_tahtalari,
        f_db_kullanici_bolge_tumu: f_db_kullanici_bolge_tumu,
        f_db_kullanici_bolge_ekle: f_db_kullanici_bolge_ekle,
        f_db_kullanici_bolge_sil: f_db_kullanici_bolge_sil,
        f_db_kullanici_yetki_tumu: f_db_kullanici_yetki_tumu,
        f_db_kullanici_yetki_ekle: f_db_kullanici_yetki_ekle,
        f_db_kullanici_yetki_guncelle: f_db_kullanici_yetki_guncelle,
        f_db_kullanici_yetki_sil: f_db_kullanici_yetki_sil,
        f_db_kullanici_tumu: f_db_kullanici_tumu,
        f_db_kullanici_tumu_idye_gore: f_db_kullanici_tumu_idye_gore,
        f_db_kullanici_idler: f_db_kullanici_idler,
        f_db_kullanici_id: f_db_kullanici_id,
        f_db_uye_id: f_db_uye_id,
        // kullanıcı_id from provider_id
        f_eposta_to_db_kullanici_id: f_eposta_to_db_kullanici_id,
        f_AD_to_db_kullanici_id: f_AD_to_db_kullanici_id,
        f_FACEBOOK_id_to_db_kullanici_id: f_FACEBOOK_id_to_db_kullanici_id,
        f_TWITTER_id_to_db_kullanici_id: f_TWITTER_id_to_db_kullanici_id,
        f_GPLUS_id_to_db_kullanici_id: f_GPLUS_id_to_db_kullanici_id,
        // kullanıcı from provider
        f_db_kullanici_LOCAL_eposta: f_db_kullanici_LOCAL_eposta,
        f_db_kullanici_AD_principleName: f_db_kullanici_AD_principleName,
        f_db_kullanici_FACEBOOK_id: f_db_kullanici_FACEBOOK_id,
        f_db_kullanici_TWITTER_id: f_db_kullanici_TWITTER_id,
        f_db_kullanici_GPLUS_id: f_db_kullanici_GPLUS_id,
        f_db_kullanici_ekle: f_db_kullanici_ekle,
        f_db_kullanici_guncelle: f_db_kullanici_guncelle,
        f_db_kullanici_sil: f_db_kullanici_sil,
        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsKullanici}
         */
        OptionsKullanici: function (opts) {
            /** @class OptionsKullanici */
            return _._.extend({
                barrTahtaIds: true,
                bTahtalari: true,
                bProfil: true,
                bOturumDurumu: true,
                Tahtalari: {
                    arrTahta_id: null,
                    bGenel: true,
                    bKurumu: true,
                    bAnahtarlari: true,
                    bRolleri: true,
                    bUyeleri: true,
                    optUye: {
                        bArrTahtaUyeRolId: true
                    }
                }
            }, opts || {})
        },
        /**
         *
         * @param {OptionsUye} opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsUye}
         */
        OptionsUye: function (opts) {
            /** @class OptionsUye */
            return _._.extend({
                //bTemelTahtaUyeBilgileri: true,
                bArrTahtaUyeRolId: true
            }, opts || {})
        }
    };
    return result;
}


/**
 *
 * @type {DBKullanici}
 */
var obj = DB_Kullanici();
obj.__proto__ = require('./db_log');

module.exports = obj;