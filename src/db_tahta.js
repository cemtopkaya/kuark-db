/**
 * Tüm tahta işlemleri
 * <pre>
 *  HS > tahta                               : Tüm tahtalar
 *  HS > tahta:401:rol                       : Tahtanın rolleri > 1 | {adi:"Sahip", Yetkileri:["Ihale Girişi","Ihaleye Katılım", "Teklif Girişi"] }
 *  HS > tahta:401:uye                       : Tahtanın üye kullanıcıları ve rolleri > 12 | [1,3,4] > 12 numaralı kullanıcı 1,3,4 rollerine sahip
 *  ss > kullanici:X:tahta:sahip             : Kullanıcıya ait tahtalar
 *  ss > kullanici:X:tahta:sahip:silinen     : Kullanıcının sildiği tahtaları
 *  ss > kullanici:X:tahta:uye               : Kullanıcının üye olduğu tahtalar
 * </pre>
 * @returns {DBTahta}
 * @constructor
 */
function DB_Tahta() {
    // db işlemlerinin Promise ile yapılabilmesi için.
    var
        /** @type {DBTahta} */
        result = {};

    //region TAHTA TAKİPTEKİLER
    /**
     * Tahtanın takip ettiği ihale listesini ihale bilgileriyle getirir
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_takip_tumu = function (_tahta_id) {
        return f_db_tahta_ihale_takip_idler(_tahta_id)
            .then(function (_ihale_idler) {
                if (_ihale_idler && _ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opts = {};
                    opts.bArrKalemleri = true;
                    opts.bYapanKurum = true;
                    opts.bTakip = true;

                    var db_ihale = require("./db_ihale");

                    return db_ihale.f_db_ihale_id(_ihale_idler, _tahta_id, opts);
                } else {
                    return [];
                }
            });
    };

    /**
     * Tahtanın takip edilen ihale id lerini getirir
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_takip_idler = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id));
    };

    var f_db_tahta_ihale_takip_toplami = function (_tahta_id) {
        var db_ihale = require("./db_ihale");
        return result.dbQ.Q.all([
            db_ihale.f_db_tahta_ihale_idler_aktif(_tahta_id),
            f_db_tahta_ihale_takip_idler(_tahta_id)

        ]).then(function (_ress) {

            /** @type {GrafikDonut} */
            var sonuc = schema.f_create_default_object(SABIT.SCHEMA.GRAFIK_DONUT);
            var toplam = parseInt(_ress[0].length || 0),
                gecerli = parseInt(_ress[1].length || 0);
            sonuc.Toplam = toplam;
            sonuc.Gecerli = gecerli;
            sonuc.Gecersiz = toplam - gecerli;
            return sonuc;
        });
    };

    /**
     * Tahtanın indexli ihale id lerini döner
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_indeksli_idler = function (_tahta_id) {
        return result.dbQ.exists(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id))
            .then(function (_exists) {
                if (_exists == 1) {
                    return result.dbQ.smembers(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id));

                } else {
                    var db_ihale = require("./db_ihale");
                    return db_ihale.f_db_ihale_indeksli_tahta_anahtar_kelimelerine_gore(_tahta_id)
                        .then(function () {
                            return result.dbQ.smembers(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id));
                        });
                }
            });
    };


    /**
     * Bu metod tahtanın takip edilen ve indekslenen(tahta anahtalarına uygun olan ihaleler) ihale idlerini getirir
     * @param _tahta_id
     * @returns {*}
     */
    var f_indekslenen_ve_takip_edilen_ihale_idleri = function (_tahta_id) {
        console.log("f_indekslenen_ve_takip_edilen_ihale_idleri")
        return result.dbQ.Q.all([
            f_db_tahta_ihale_indeksli_idler(_tahta_id),
            f_db_tahta_ihale_takip_idler(_tahta_id)
        ]).then(function (_ress) {
            console.log("_ress")
            console.log(JSON.stringify(_ress))
            var indexliler = _ress[0],
            //tahtanin_gorebilecegi=_ress[1],
                takiptekiler = _ress[1];

            return _.union(indexliler, takiptekiler);
        })
    };

    /**
     * Tahtanın anahtar kelimelerine uygun olan ve takip edilen kalem id lerinin birleşimini döner
     * @param _tahta_id
     * @returns {Array}
     */
    var f_indekslenen_ve_takip_edilen_kalem_idler = function (_tahta_id) {

        var db_kalem = require("./db_kalem");
        return result.dbQ.Q.all([
                db_kalem.f_db_kalem_indeksli_idler(_tahta_id),
                db_kalem.f_db_kalem_takip_idler(_tahta_id)
            ])
            .then(function (_ress) {

                var indeksliler = _ress[0],
                    takipteki_kalemler = _ress[1];

                return indeksliler.unionXU(takipteki_kalemler);
            });
    };


    /**
     * İndekslenen (tahta anahtarlarına uygun) ve takipteki ihale detaylarını getir
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_rapor_bilgileri = function (_tahta_id) {
        console.log("f_db_tahta_ihale_rapor_bilgileri");

        /*return f_indekslenen_ve_takip_edilen_kalem_idler(_tahta_id)
         .then(function (_kalem_idler) {
         console.log("_kalem_idler>" + _kalem_idler)
         return result.dbQ.hmget(result.kp.kalem.hsetIhaleleri, _kalem_idler)
         .then(function (_ihale_idler) {
         //aynı ihale_id gelmesin diye uniq metoduna gönderiyoruz
         _ihale_idler = _.uniq(_ihale_idler);

         console.log("_ihale_idler>" + _ihale_idler);

         /!** @type {OptionsIhale} *!/
         var opts = {
         bArrKalemleri: true,
         bYapanKurum: true,
         bTakip: true,
         optsKalem: {
         bArrTeklifleri: true,
         bTakiptemi: true,
         bOnayDurumu: true
         }
         };
         var db_ihale = require("./db_ihale");
         return db_ihale.f_db_ihale_id(_ihale_idler, _tahta_id, opts);
         })
         });*/

        return f_indekslenen_ve_takip_edilen_ihale_idleri(_tahta_id)
            .then(function (_ihale_idler) {
                console.log("_ihale_idler>" + _ihale_idler);

                if (_ihale_idler && _ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opts = {
                        bArrKalemleri: true,
                        bYapanKurum: true,
                        bTakip: true,
                        optsKalem: {
                            bArrTeklifleri: true,
                            bTakiptemi: true,
                            bOnayDurumu: true
                        }
                    };
                    var db_ihale = require("./db_ihale");
                    return db_ihale.f_db_ihale_id(_ihale_idler, _tahta_id, opts);
                } else {
                    return [];
                }
            })
    };

    //endregion

    //region INDEX

    /**
     * tahtanın anahtar kelimelerine göre indeksli ihaleleri getir
     * @param {integer} _tahta_id
     * @param {OptionsIhale=} _opts
     * @returns {*}
     */
    var f_db_tahta_ihale_indeksli_tahta_anahtarKelimelerineGore = function (_tahta_id, _opts) {
        var db_ihale = require("./db_ihale");

        // anahtalar diyaliz > 1, fx80 > 25, av-set > 145
        // a:1:ihale 101, 102
        // tahta:401:anahtar 1,25,145
        // sdiff (sunion a:1 a:25 a:145 ihale:sirala:tarihe) ihale:silinen
        return f_db_tahta_ihale_indeksli_idler(_tahta_id)
            .then(function (_lstIhaleIdler) {
                return _lstIhaleIdler.length == 0
                    ? _lstIhaleIdler
                    : db_ihale.f_db_ihale_id(_lstIhaleIdler, _tahta_id, _opts);
            });
    };

    var f_db_tahta_ihale_indeksli_tahta_anahtar_kelimelerine_gore = function (_tahta_id) {
        var db_tahta = require('./db_tahta');
        return result.dbQ.exists(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id))
            .then(function (_dbReply) {
                return _dbReply
                    ? result.dbQ.smembers(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id)) // Sonuç setini çekelim
                    : db_tahta.f_db_tahta_anahtar_tumu(_tahta_id)
                    .then(function (_arrKelimeler) {

                        if (_arrKelimeler.length == 0) {
                            l.warn("anahtarlar boş geldiği için ihale id gönderemiyoruz");
                            return [];
                        }

                        /*return result.dbQ.hmget_array(result.kp.anahtar.tablo, _arrKelimeler)
                         .then(function (_anahtarIdleri) {*/

                        var _anahtarIdleri = _arrKelimeler.pluckX("Id");

                        var arrInterStore_sonuc = [result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id), result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id), result.kp.temp.ssetTahtaIhale(_tahta_id)], // Anahtar kelimelerle kesişenler
                            arrAnahtarlarinSetAdlari = _anahtarIdleri.map(function (_anahtar_id) {
                                return result.kp.anahtar.ssetIndexIhale(_anahtar_id);
                            });

                        arrAnahtarlarinSetAdlari.unshift(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id)); // ["temp:tahta:401:A:ihale", "a:1:ihale", "a:2:ihale", ..]

                        return f_db_tahta_ihale_idler_aktif(_tahta_id)
                            .then(result.dbQ.sunionstore_array(arrAnahtarlarinSetAdlari)) // Anahtar kelimelerin geçtiği ihaleler
                            .then(result.dbQ.sinterstore_array(arrInterStore_sonuc)) // Anahtar kelimlerin geçtiği, tahtanın görebileceği aktif public/private ihaleler
                            .then(result.dbQ.smembers(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id))); // Sonuç setini çekelim
                        //});
                    })
                    .fail(function (_err) {
                        var hata = "indeksli ihaleleri çekilirken hata oluştu: " + JSON.stringify(_err);
                        l.e(hata);
                        return hata;
                    });
            })
            .then(function () {
                return result.dbQ.smembers(result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id));
            });
    };


    /**
     * İndekslenmiş ihalelerin tarihe göre sıralanmış halini temp de tutulması sağlanır
     * @param {integer} _tahta_id
     */
    var f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali = function (_tahta_id) {
        return f_db_tahta_ihale_indeksli_idler(_tahta_id)
            .then(function () {
                return result.dbQ.exists(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id))
                    .then(function (_iExist) {
                        return _iExist == 1
                            ? []
                            : (result.dbQ.zinterstore(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id), 2,
                            result.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id),
                            result.kp.ihale.zsetYapilmaTarihi));
                    });
            });
    };

    /**
     * İki tarih aralığında anahtara göre indekslenmiş ihaleleri getirir
     * @param _tahta_id
     * @param _arama
     * @returns {*}
     */
    var f_db_tahta_ihale_indeksli_ihaleler_tarihe_gore_sirali = function (_tahta_id, _arama) {

        var baslangic = 0,
            bitis = 10,
            sonucAnahtari = result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id);

        if (_arama.Sayfalama) {
            baslangic = _arama.Sayfalama.Sayfa * _arama.Sayfalama.SatirSayisi;
            bitis = _arama.Sayfalama.SatirSayisi;
        }

        var tarih1 = _arama.Tarih.tarih1,
            tarih2 = _arama.Tarih.tarih2;

        return f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali(_tahta_id)
            .then(function () {
                return (tarih1 && tarih2
                    ? result.dbQ.zrevrangebyscore(sonucAnahtari, tarih2, tarih1, "LIMIT", baslangic, bitis)
                    : result.dbQ.zrevrangebyscore(sonucAnahtari, "+inf", "-inf", "LIMIT", baslangic, bitis))
                    .then(function (_ihale_idler) {

                        var sonuc = schema.f_create_default_object(SABIT.SCHEMA.LAZY_LOADING_RESPONSE);
                        sonuc.ToplamKayitSayisi = _ihale_idler.length;

                        if (_ihale_idler && _ihale_idler.length > 0) {
                            var db_ihale = require("./db_ihale");
                            return db_ihale.f_db_ihale_id(_ihale_idler, _tahta_id)
                                .then(function (_data) {
                                    sonuc.Data = _data;
                                    return sonuc;
                                });
                        } else {
                            sonuc.Data = [];
                            return sonuc;
                        }
                    });
            });
    };


    /**
     * İndekslenmiş ihalelerin detaylarını getirir
     * Tarihi geçen:       10
     * Teklif verilebilir: 90 gibi değerleri döneceğiz
     * @param _tahta_id
     */
    var f_db_tahta_ihale_indeksli_toplami = function (_tahta_id) {
        console.log("f_db_ihale_indeksli_toplami")
        return f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali(_tahta_id)
            .then(function () {
                return result.dbQ.Q.all([
                    result.dbQ.zcount(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id), "-inf", "+inf"),
                    result.dbQ.zcount(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id), new Date().getTime(), "+inf")
                ]).then(function (_results) {
                    console.log("_results")
                    console.log(JSON.stringify(_results));

                    var toplam = parseInt(_results[0] || 0),
                        gecerli = parseInt(_results[1] || 0);

                    var sonuc = {
                        Toplam: toplam,
                        Gecerli: gecerli,
                        Gecersiz: toplam - gecerli
                    };
                    return sonuc;
                });
            });
    };

    //endregion

    //region TAHTANIN GİZLENENLERİ

    /**
     * Kullanıcı tahtada görmek istemediği ihalelerin listesini ihale bilgileriyle dönüyoruz.
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     */
    var f_db_tahta_ihale_gizlenen_tumu = function (_tahta_id) {
        return f_db_tahta_ihale_gizlenen_idler(_tahta_id)
            .then(function (_ihale_idler) {
                if (_ihale_idler && _ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opts = {};
                    opts.bArrKalemleri = true;
                    opts.bYapanKurum = true;
                    opts.bTakip = true;
                    opts.optKalem.bArrTeklifleri = false;
                    opts.optKalem.bOnayDurumu = true;
                    opts.optKalem.bTakiptemi = true;
                    var db_ihale = require("./db_ihale");
                    return db_ihale.f_db_ihale_id(_ihale_idler, _tahta_id, opts);
                } else {
                    return [];
                }
            });
    };

    /**
     * Gizlenen ihale toplamını getirir
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_gizlenen_toplami = function (_tahta_id) {
        var db_ihale = require("./db_ihale");
        return result.dbQ.exists(result.kp.temp.ssetTahtaIhaleTumu(_tahta_id))
            .then(function (_iExist) {
                return (_iExist
                    ? 1//temp kayıtlı
                    : db_ihale.f_db_tahta_ihale_idler_aktif(_tahta_id))//temp oluşturmak için ihale idlerini çek
            })
            .then(function () {
                return result.dbQ.Q.all([
                    f_db_tahta_ihale_gizlenen_idler(_tahta_id),
                    result.dbQ.scard(result.kp.temp.ssetTahtaIhaleTumu(_tahta_id))

                ]).then(function (_ress) {
                    /** @type {GrafikDonut} */
                    var sonuc = schema.f_create_default_object(SABIT.SCHEMA.GRAFIK_DONUT);
                    var gecerli = parseInt(_ress[0].length || 0),
                        toplam = parseInt(_ress[1] || 0);

                    sonuc.Toplam = toplam;
                    sonuc.Gecerli = gecerli;
                    sonuc.Gecersiz = toplam - gecerli;
                    return sonuc;
                });
            });

    };

    var f_db_tahta_ihale_gizlenen_idler = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetGizlenenIhaleleri(_tahta_id));
    };


    //endregion

    //region AJANDA İŞLEMLERİ
    var f_db_tahta_ajanda_ekle = function (_tahta_id, _ajanda) {
        return result.dbQ.hset(result.kp.tahta.hsetTahtaAjanda, _tahta_id, JSON.stringify(_ajanda));
    };

    var f_db_tahta_ajanda_sil = function (_tahta_id) {
        return result.dbQ.hdel(result.kp.tahta.hsetTahtaAjanda, _tahta_id);
    };

    var f_db_tahta_ajandasi = function (_tahta_id) {
        return result.dbQ.hget_json_parse(result.kp.tahta.hsetTahtaAjanda, _tahta_id)
            .then(function (_res) {
                return _res || {};
            });
    };
    //endregion

    //region DAVET İŞLEMLERİ
    /**
     * Tahtaya eposta ve rolleriyle DAVET eklenmesi.
     * <pre>
     * HS > tahta:401:uye   :  Kullanıcı EPOSTA adresini, rolleriyle tutar. > eposta | arrRoller > 80 | [1,3,4]
     * HSET  tahta:401:uye  eposta  [1,3,4]
     * </pre>
     * @param {Integer} _tahta_id
     * @param {{EPosta:String, Roller:Integer[]}} _yetkisiyleDavetli
     */
    var f_db_tahta_davet_ekle = function (_tahta_id, _yetkisiyleDavetli) {
        /**
         HASH olacak tahta:3:davet
         key > uid
         value > {UID:"212123...", EPosta:'cem.topkaya@hotmail.com', Provider:{name:'Facebook', id:'cem.topkaya36'}, Roller:[1,2,3,4] }
         */
        return result.dbQ.hset(result.kp.tahta.hsDavetler(_tahta_id), _yetkisiyleDavetli.UID, JSON.stringify(_yetkisiyleDavetli));
        //return result.dbQ.hset(result.kp.tahta.hsDavetler(_tahta_id), _yetkisiyleDavetli.EPosta, _yetkisiyleDavetli.Roller);
    };

    /**
     * Daveti kontrol et ve geçerliyse "session.ss.davet.Gecerli = true" diye işaretlenmesine yardımcı ol
     * @param {integer} _tahta_id
     * @param {string} _davet_id
     * @param {string} _eposta
     * @returns {Promise}
     */
    var f_db_tahta_davet_eposta = function (_tahta_id, _davet_id, _eposta) {
        return f_db_tahta_davet(_tahta_id, _davet_id)
            .then(function (_davet) {
                ssg = [{"_davet": _davet}];

                if (_davet && _davet.EPosta == _eposta) {
                    return _davet;
                } else {
                    return null;
                }
            });
    };
    /**
     * Tahta_id ye yapılmış UID li davetin tüm bilgisini döner
     * @param _tahta_id
     * @param _davetId
     * @returns {*}
     */
    var f_db_tahta_davet = function (_tahta_id, _davetId) {
        return result.dbQ.hget_json_parse(result.kp.tahta.hsDavetler(_tahta_id), _davetId);
    };
    var f_db_tahta_davetleri = function (_tahta_id) {
        return result.dbQ.hvals_json_parse(result.kp.tahta.hsDavetler(_tahta_id));
    };
    /**
     * Tahtaya eklenmiş davetin eposta adresi vasıtasıyla silinmesi.
     * <pre>
     * HS > tahta:401:davet   :  Davetli EPOSTA adresi ile tüm davetliler içinde arama yapılır ve bulunduğunda UID ile hdel yapılır
     * HDEL  tahta:401:uye  bulunanDavet.UID
     * </pre>
     * @param {Integer} _tahta_id
     * @param {String} _eposta
     */
    var f_db_tahta_davet_sil = function (_tahta_id, _eposta) {
        console.log("davet sil e gelenler:");
        console.log("tahta_id:" + _tahta_id);
        console.log("eposta:" + _eposta);

        return f_db_tahta_davetleri(_tahta_id)
            .then(function (_arrObjectDavetler) {
                console.log("tüm davetler");
                console.log(JSON.stringify(_arrObjectDavetler));
                var davet = _arrObjectDavetler.whereXU({"EPosta": _eposta});

                return (davet.length > 0) ?
                    result.dbQ.hdel(result.kp.tahta.hsDavetler(_tahta_id), davet[0].UID) :
                    null;
            });
    };
    //endregion

    //region ÜYE İŞLEMLERİ
    /**
     * tablo         key  value
     * tahta:401:uye   1  [1,2]
     * @param _tahta_id
     * @param _uye_id
     * @param _rol
     * @returns {Promise}
     */
    var f_db_tahta_uye_rol_guncelle = function (_tahta_id, _uye_id, _rol) {
        return result.dbQ.hset(result.kp.tahta.hsUyeleri(_tahta_id), _uye_id, JSON.stringify(_rol));
    };

    /**
     *
     * Tahtaya bağlı üyelerin eklenmesi.
     * HS > tahta:401:uye   :  Kullanıcı ID sini rolleriyle tutar. > kullanici_id | arrRoller > 80 | [1,3,4]
     * @param {Integer} _tahta_id
     * @param {{ Kullanici_Id:Integer, Roller:Integer[] }} _yetkisiyleKullanici
     * @returns {Promise}
     */
    var f_db_tahta_uye_ekle = function (_tahta_id, _yetkisiyleKullanici) {
        //üye eklenirken kullanıcı:x:tahtalari:uye tablosuna ve tahta:v:uye tablosuna kayıt ekliyoruz
        ssg = [{"_yetkisiyleKullanici": _yetkisiyleKullanici}];
        return result.dbQ.Q.all([
            result.dbQ.hset(result.kp.tahta.hsUyeleri(_tahta_id), _yetkisiyleKullanici.Kullanici_Id, JSON.stringify(_yetkisiyleKullanici.Roller)),
            result.dbQ.sadd(result.kp.kullanici.ssetUyeOlduguTahtalari(_yetkisiyleKullanici.Kullanici_Id, true), _tahta_id)
        ]);
    };

    var f_db_tahta_uye_guncelle = function (_tahta_id, _uye_id, _rol) {
        return result.dbQ.hset(result.kp.tahta.hsUyeleri(_tahta_id), _uye_id, JSON.stringify(_rol.Roller));
    };
    var f_db_tahta_uye_sil = function (_tahta_id, _uye_id) {
        //tahtadan silinmek istenen üye tahtanın sahibi ise silmesine izin vermiyoruz
        //değilse tahtanın üyeleri setinden kaldırıyoruz
        return result.dbQ.sismember(result.kp.kullanici.ssetSahipOlduguTahtalari(_uye_id, true), _tahta_id)
            .then(function (_iSahip) {
                if (_iSahip == 1) {
                    throw new exception.istisna("Üye silinemedi!", "Silinmek istenen üye tahtanın sahibi olduğu için işlem gerçekleştirilemez!");
                } else {
                    return result.dbQ.Q.all([
                        result.dbQ.srem(result.kp.kullanici.ssetUyeOlduguTahtalari(_uye_id, true), _tahta_id),
                        result.dbQ.sadd(result.kp.kullanici.ssetUyeOlduguTahtalari(_uye_id, false), _tahta_id)
                    ]);
                }
            });
    };


    /**
     *
     * @param {integer} _tahta_id
     * @param {OptionsUye=} _opts, Üyelerin hangi bilgilerini istiyoruz
     * @returns {Promise}
     */
    var f_db_tahta_uyeleri = function (_tahta_id, _opts) {

        var /** @type {DBKullanici} */
            kullanici = require('./db_kullanici'),
            /** @type {OptionsUye} */
            opts = kullanici.OptionsUye(_opts);

        console.log("f_db_tahta_uyeleri: _tahta_id> " + _tahta_id);
        return f_db_aktif_tahta_uye_idleri(_tahta_id)
            .then(function (_aktifIdleri) {
                l.i("_aktifKullaniciIdleri: ", JSON.stringify(_aktifIdleri));

                return _aktifIdleri
                    .mapX(null, kullanici.f_db_uye_id, _tahta_id, opts)
                    .allX()
                    .then(function (_uyeler) {
                        return _uyeler;
                    })
            })
            .fail(function (_err) {
                console.log("HATAAA: " + _err);
                ssr = [{"f_db_tahta_uyeleri fail": _err}];
            });
    };

    /**
     * x rolüne sahip tahtanın üyelerini döner
     * @param {integer} _tahta_id
     * @param {integer} _rol_id
     * @returns {*}
     */
    var f_db_tahta_uyeleri_x_rolune_sahip = function (_tahta_id, _rol_id) {
        return f_db_tahta_uyeleri(_tahta_id)
            .then(
                /**
                 * @param {Uye[]} _uyeler
                 * @returns {Array}
                 */
                function (_uyeler) {
                    return _uyeler.whereXU({Roller: [_rol_id]});
                });
    };

    /**
     * Tahta ile ilişkili kullanıcı id leri
     * @param {integer} _tahta_id
     * @param {Sayfalama=} _sayfalama
     * @returns {Promise}
     */
    function f_db_aktif_tahta_uye_idleri(_tahta_id, _sayfalama) {

        var sonucAnahtari = result.kp.temp.ssetTahtaKullanici(_tahta_id);
        if (_sayfalama) {
            var baslangic = _sayfalama.Sayfa * _sayfalama.SatirSayisi,
                bitis = _sayfalama.SatirSayisi;
        }

        return result.dbQ.exists(sonucAnahtari)
            .then(function (_iExist) {
                if (_iExist == 1) {
                    //temp anahtarı var
                    return 1;

                } else {
                    //temp yok oluştur
                    return result.dbQ.hkeys(result.kp.tahta.hsUyeleri(_tahta_id))
                        .then(function (_idler) {
                            if (_idler && _idler.length > 0) {
                                return result.dbQ.sadd(sonucAnahtari, _idler);
                            } else {
                                return null;
                            }
                        });
                }
            })
            .then(function () {
                return (_sayfalama
                    ? result.dbQ.sort(sonucAnahtari, "LIMIT", baslangic, bitis)
                    : result.dbQ.smembers(sonucAnahtari))
                    .then(function (_aktif_idleri) {
                        return _aktif_idleri.mapX(null, parseInt);
                    });
            });
    }

    //endregion

    //region TAHTA İŞLEMLERİ
    /**
     * Sistemdeki tüm tahta nesnelerini lerini döner
     * @returns {*}
     */
    var f_db_tahta_tumu = function () {
        return result.dbQ.hvals_json_parse(result.kp.tahta.tablo);
    };

    /**
     * ID si verilmiş tahta nesnesini döner
     * @param {integer} _tahta_id
     * @param {OptionsTahta=} _opts, Tahtanın hangi bilgilerini istiyorsak seçebiliriz
     * @returns {Promise}
     */
    function f_db_tahta_id(_tahta_id, _opts) {
        var rol = require('./db_rol'),
            kurum = require('./db_kurum');

        /* if (_opts && typeof _opts !== "object") {
         l.e("_opts", JSON.stringify(_opts));
         throw "f_db_tahta_id fonksiyonunda tahta detaylarını belirleyeceğiniz ikinc parametre obje olmalı.";
         }*/

        /** @type {OptionsTahta} */
        var opts = result.OptionsTahta(_opts);

        return result.dbQ.hget_json_parse(result.kp.tahta.tablo, _tahta_id)
            .then(
                /**
                 *
                 * @param {TahtaGenel} _tahta
                 * @returns {*}
                 */
                function (_tahta) {
                    if (!_tahta) {
                        return null;
                    }


                    var /** @type {Tahta} */
                        olusan_tahta = schema.f_create_default_object(SABIT.SCHEMA.INDEX_TAHTA),
                        arrPromises = [];

                    if (opts.bGenel) { // 1. Genel bilgilerini
                        olusan_tahta.Genel = _tahta;
                    }

                    arrPromises.push(
                        (opts.bRolleri)
                            ? rol.f_db_rol_tumu(_tahta_id)
                            : []);

                    arrPromises.push(
                        (opts.bKurumu && _tahta.Kurum_Id)
                            ? kurum.f_db_kurum_id(_tahta.Kurum_Id)
                            : null);

                    arrPromises.push(
                        (opts.bUyeleri)
                            ? f_db_tahta_uyeleri(_tahta_id, opts.optUye)
                            : []);

                    arrPromises.push(
                        (opts.bAnahtarlari)
                            ? f_db_tahta_anahtar_tumu(_tahta_id)
                            : []);

                    arrPromises.push(
                        (opts.bAjanda)
                            ? f_db_tahta_ajandasi(_tahta_id)
                            : null);

                    // tahtanın :
                    // 2. Kurumunu
                    // 3. Kullanicilarini
                    // 4. Rollerini
                    // 5. Anahtarlarını

                    return arrPromises.allX().then(function (_ress) {

                        olusan_tahta.Roller = _ress[0];
                        olusan_tahta.Genel.Kurum = _ress[1];
                        olusan_tahta.Uyeler = _ress[2];
                        olusan_tahta.AnahtarKelimeler = _ress[3];
                        olusan_tahta.Ajanda = _ress[4];

                        ssg = [{"f_db_tahta_id > olusan_tahta": olusan_tahta}];
                        return olusan_tahta;
                    });
                })
            .then(function (_dbTahta) {
                return _dbTahta;
            })
            .fail(function (_err) {
                l.e("Fail içinde HATA:\n\t", _err);
                return _err;
            });
    }

    /**
     * Kullanıcı üye olduğu tahtadan ayrılmak isteyebilir, listeden çıkartıyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_tahtadan_ayril = function (_tahta_id, _kul_id) {

        return result.dbQ.Q.all([
            result.dbQ.srem(result.kp.kullanici.ssetUyeOlduguTahtalari(_kul_id, true), _tahta_id),
            result.dbQ.hdel(result.kp.tahta.hsUyeleri(_tahta_id), _kul_id)
        ]).then(function () {
            emitter.emit(SABIT.OLAY.TAHTA_AYRIL, _tahta_id, _kul_id);
            return _tahta_id;
        });
    };

    /**
     * Tahtalar'a yeni tahta ekler, oluşturan kullanıcıyla ilişkilendirir.
     * <pre>
     * INCR IDX
     * HSet Tahta _tahta
     * SADD Kullanici:X:Tahta:Sahip IDX
     * </pre>
     * @param _tahta_db
     * @param _kul_id
     * @returns {*}
     */
    var f_db_tahta_ekle = function (_tahta_db, _kul_id) {
        /**
         * Tahtanın ilk oluşturulmasında admin kullanıcısını(tahtanın sahibini) tüm rollerle ilişkilendiriyoruz
         * @param _tahta_id
         * @param _kul_id
         * @returns {*}
         */
        var tahta_kullanicilarini_rollerle_iliskilendir = function (_tahta_id, _kul_id) {
            l.info("f_kullaniciyi_rol_iliskilendir");
            // 3. Kullanıcıya rolü atayalım
            // 3.1 Kullanıcının rollerini çek
            // 3.2 Rollerine yeni rolü ekle
            return result.dbQ.Q.all([
                result.dbQ.smembers(result.kp.tahta.ssetOzelTahtaRolleri(_tahta_id, true)),
                result.dbQ.hget(result.kp.tahta.hsUyeleri(_tahta_id), _kul_id) // 3.1
            ]).then(function (_arrDbReplies) {
                var dbRol_idler = _arrDbReplies[1];
                // 3.2
                var roller = Array.isArray(dbRol_idler) ? dbRol_idler : [];

                //şemaya uygun hale getirmek için int yapılıyor
                var arr_tahta_rol_idler = _arrDbReplies[0].mapX(null, parseInt);

                var son = roller.concat(arr_tahta_rol_idler);
                return f_db_tahta_uye_rol_guncelle(_tahta_id, _kul_id, son)
            });
        };

        delete _tahta_db.Kurum;

        l.i("f_db_tahta_ekle > _tahta: " + JSON.stringify(_tahta_db));

        // 1. Tahta oluştur
        // 1.1 incr idx
        // 2. Tahta için temel rolleri oluştur ve tahtayla ilişkilendir
        // 3. Kullaniciyi tahtanın sahibi yap ve ilk rolleri(yonetici, gozlemci) rolünü ver
        // 4. Tahtanın ID sini kullanicinin sahip olduklarinin içine yaz
        // 5. bölgeleri ekle
        return result.dbQ.incr(result.kp.tahta.idx)
            .then(function (_id) {

                var rol = require('./db_rol');

                _tahta_db.Id = _id;
                // TODO: Tahta rollerini json'dan çekiyor ama bunu otomatik hale getirip json ilişkisi kaldırılacak.
                var arrTemelRoller = require("../../public/json/roller.json").data;

                //ssg = [{"arrTemelRoller": arrTemelRoller}];
                return [
                    result.dbQ.hset(result.kp.tahta.tablo, _id, JSON.stringify(_tahta_db)), // 1
                    rol.f_db_rol_ekle(arrTemelRoller, _tahta_db.Id), // 2
                    result.dbQ.sadd(result.kp.kullanici.ssetSahipOlduguTahtalari(_kul_id, true), _id) // 4
                ].allX().then(function () {

                        l.info("kullanıcı rol ilşkilendir");
                        return tahta_kullanicilarini_rollerle_iliskilendir(_id, _kul_id); // 3

                    })
                    .then(function () {
                        //şehirleri ekle
                        return f_sehirleri_ekle();
                    })
                    .then(function () {
                        //tahta bölge ilikilendirme ve bölge ekleme
                        return f_tahta_bolge_iliskilendir(_id);

                    })
                    .then(function () {
                        l.info("HERŞEY BİTTİ TAHTA ID DEN DÖN");
                        return f_db_tahta_id(_id)//4
                            .then(function (_dbTahta) {
                                emitter.emit(SABIT.OLAY.TAHTA_EKLENDI, _dbTahta, _kul_id);
                                return _dbTahta;
                            });
                    })
                    .fail(function (_err) {
                        l.e("f_db_tahta_ekle fail func> ERR: ", _err);
                        return _err;
                    });
            });
    };

    /**
     * Bu metod genel bölgeleri sistemde yoksa ekler ve tahta ile ilişkilendirir
     * @param _tahta_id
     * @returns {*}
     */
    function f_tahta_bolge_iliskilendir(_tahta_id) {

        return result.dbQ.scard(result.kp.bolge.ssetBolgeGenel)
            .then(function (_iToplam) {
                if (_iToplam == 0) {
                    //db de kayıt yok ekle
                    var bolge = require("./db_bolge");
                    var arrBolgeler = require("../../public/json/bolgeler.json").data;
                    return bolge.f_db_bolge_ekle(arrBolgeler);
                } else {
                    //genel bölgeler db de kayıtlı
                    //o zaman bunları tahta ile ilişkilendiriyoruz

                    return _tahta_id;
                }
            });
    }

    /**
     * Sisteme şehirleri ekliyoruz
     * @returns {*}
     */
    function f_sehirleri_ekle() {

        return result.dbQ.exists(result.kp.sehir.idx)
            .then(function (_iExist) {
                if (_iExist == 0) {
                    //db de kayıt yok ekle
                    var db_sehir = require("./db_sehir");
                    var arrSehirler = require("../../public/json/sehirler.json").data;
                    return db_sehir.f_db_sehir_ekle(arrSehirler);
                } else {
                    return null;
                }
            });
    }


    /**
     * Veriyi güncellemeden önceki hali çekilir ve LOG alanına atılır.
     * Güncellenecek nesnenin tarih bilgisi işlemin saati olarak güncellenir ve HSET ile işlem tamamlanır.
     * @param _tahta_db
     * @param _kul_id
     * @returns {*}
     */
    var f_db_tahta_guncelle = function (_tahta_db, _kul_id) {
        delete _tahta_db.Kurum;
        l.info("f_db_tahta_guncelle");
        return result.dbQ.hset(result.kp.tahta.tablo, _tahta_db.Id, JSON.stringify(_tahta_db))
            .then(function () {
                return f_db_tahta_id(_tahta_db.Id)
                    .then(function (_dbTahta) {
                        emitter.emit(SABIT.OLAY.TAHTA_GUNCELLENDI, _dbTahta, _kul_id);
                        return _dbTahta;
                    });
            });
    };

    /**
     * Silme eyleminde objenin son halini LOG a kaydedilir.
     * Silinirken tahta nesnesi içindeki tarih bilgisi güncellenir ve del:true özelliği eklenir ve hash içine kaydedilir
     * Tahta silindiğinde HASH içindeki bilgi kalır ve sadece güncellenirken(tarih ve del props)
     * Silinen Tahtalar setine eklenir.
     *
     * @param {integer} _tahta_id
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_tahta_sil = function (_tahta_id, _kul_id) {

        //_tahta_id nin _kul_id ye ait olması halinde gelmesi gerekiyor. tahta silme sahip olunan tahtalarda geçerlidir.
        return f_db_tahta_id(_tahta_id)
            .then(function (_tahta) {
                //loglara ekle
                //result.f_db_log_ekle(result.kp.tahta.tablo, _tahta, true, _kul_id);

                _tahta.Silindi = true;
                _tahta.Tarih = new Date().getTime();
                _tahta.Kullanici_id = _kul_id;

                return result.dbQ.hset(result.kp.tahta.tablo, _tahta_id, JSON.stringify(_tahta))
                    .then(function () {
                        emitter.emit(SABIT.OLAY.TAHTA_SILINDI, _tahta_id, _kul_id);

                        return result.dbQ.sismember(result.kp.kullanici.ssetSahipOlduguTahtalari(_kul_id, true), _tahta_id)
                            .then(function (_iSahip) {
                                if (_iSahip == 1) {
                                    //kullanıcının sahip oldugu tahtalardan çıkar, silinenlerine ekle
                                    return result.dbQ.Q.all([
                                        result.dbQ.srem(result.kp.kullanici.ssetSahipOlduguTahtalari(_kul_id, true), _tahta_id),//kullanıcının sahip oldugu tahtalar setinden çıkar
                                        result.dbQ.sadd(result.kp.kullanici.ssetSahipOlduguTahtalari(_kul_id, false), _tahta_id)
                                    ]);
                                } else {
                                    //kullanıcının üye oldugu tahtalardan çıkar, silinenlerine ekle
                                    return result.dbQ.Q.all([
                                        result.dbQ.srem(result.kp.kullanici.ssetUyeOlduguTahtalari(_kul_id, true), _tahta_id),//kullanıcının üye oldugu tahtalar setinden çıkar,
                                        result.dbQ.sadd(result.kp.kullanici.ssetUyeOlduguTahtalari(_kul_id, false), _tahta_id)
                                    ]);
                                }
                            })
                            .then(function () {
                                //silinen tahtalara ekle
                                return result.dbQ.sadd(result.kp.tahta.ssetSilinen, _tahta_id);//silinen tahtalar setine ekle
                            });
                    });
            });
    };


    //TAHTAYA AİT İD LER
    /**
     * Tahtaya ait teklifler varsa idleri döner
     * smembers tahta:401:teklif
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_tahta_teklif_idleri = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetTeklifleri(_tahta_id, true));
    };

    /**
     * Tahtaya ait kurumları varsa idleri döner
     * smembers tahta:401:kurum
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_tahta_kurum_idleri = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true));
    };

    //endregion

    //region ANAHTAR KELİME EKLE-SİL
    /**
     * Tahtanın anahtar kelimelerini döner
     * @param {integer} _tahta_id
     *  @example
     * [{Id:1,AnahtarKelime:'diyalizer'}]
     * @returns {*}
     */
    var f_db_tahta_anahtar_tumu = function (_tahta_id) {

        //tahtanın anahtar kelimelerini döner
        return result.dbQ.zrangebyscore([result.kp.tahta.zsetAnahtarKelimeleri(_tahta_id), '-inf', '+inf'])
            .then(function (_arr_anahtar_kelimeler) {
                console.log("_arr_anahtar_kelimeler>" + _arr_anahtar_kelimeler);
                if (_arr_anahtar_kelimeler && _arr_anahtar_kelimeler.length > 0) {

                  /*  var promises = _arr_anahtar_kelimeler.map(function (_anahtar) {
                        return result.f_db_anahtar_key(_anahtar)
                            .then(function (_anahtar_id) {
                                return {Id: _anahtar_id, Anahtar: _anahtar};
                            });
                    });

                    return result.dbQ.Q.all(promises);*/

                    //önce anahtar kelimelere ait id leri tutuyoruz sonra da bilgilerini dönüyoruz
                    return result.f_db_anahtar_key(_arr_anahtar_kelimeler)
                        .then(function (_dbAnahtar_idler) {
                            return _arr_anahtar_kelimeler.map(function (_elm, _idx) {
                                /** @type {AnahtarKelime} */
                                return {Id: _dbAnahtar_idler[_idx], Anahtar: _elm};
                            }).allX();
                        });


                } else {
                    return [];
                }
            });
    };

    /**
     * Tahta ile ilişkili anahtar eklenmesi sağlanır
     * @param {integer} _tahta_id
     * @param {AnahtarKelime} _anahtar
     * @param {integer=} _kul_id
     * @returns {Promise}
     */
    var f_db_tahta_anahtar_ekle = function (_tahta_id, _anahtar, _kul_id) {

        return result.f_db_anahtar_ekle(_anahtar.Anahtar)
            .then(
                /**
                 *
                 * @param {AnahtarKelime} _anahtarObjesi
                 * @returns {*}
                 */
                function (_anahtarObjesi) {
                    l.info("JSON.stringify(_anahtarObjesi):");
                    l.info(JSON.stringify(_anahtarObjesi));
                    emitter.emit(SABIT.OLAY.TAHTA_ANAHTAR_EKLENDI, _tahta_id, _anahtarObjesi, _kul_id);
                    return result.dbQ.zadd(result.kp.tahta.zsetAnahtarKelimeleri(_tahta_id), new Date().getTime(), _anahtar.Anahtar)
                        .then(function () {
                            return _anahtarObjesi;
                        });
                });
    };

    var f_db_tahta_anahtar_sil = function (_tahta_id, _anahtar_id, _kul_id) {

        return result.f_db_anahtar_val(_anahtar_id)
            .then(
                /**
                 * Dönen anahtar kelime
                 * @param {AnahtarKelime} _dbAnahtar
                 * @returns {*}
                 */
                function (_dbAnahtar) {
                    if (_dbAnahtar != null) {
                        emitter.emit(SABIT.OLAY.TAHTA_ANAHTAR_SILINDI, _tahta_id, _dbAnahtar, _kul_id);
                        return result.dbQ.zrem(result.kp.tahta.zsetAnahtarKelimeleri(_tahta_id), _dbAnahtar.Anahtar);
                    }
                    else {
                        throw new exception.istisna("Anahtar sil", "Anahtar bilgisi BULUNAMADI! Bu nedenle silme tamamlanamadı..");
                    }
                });
    };
    //endregion

    /**
     * @class DBTahta
     * @property {OptionsTahta} OptionsTahta
     */
    result = {
        f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali: f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali,
        f_db_tahta_ihale_indeksli_ihaleler_tarihe_gore_sirali: f_db_tahta_ihale_indeksli_ihaleler_tarihe_gore_sirali,
        f_db_tahta_ihale_indeksli_toplami: f_db_tahta_ihale_indeksli_toplami,
        f_db_tahta_ihale_indeksli_tahta_anahtarKelimelerineGore: f_db_tahta_ihale_indeksli_tahta_anahtarKelimelerineGore,
        f_db_tahta_ihale_indeksli_idler: f_db_tahta_ihale_indeksli_idler,

        f_db_tahta_ihale_gizlenen_idler: f_db_tahta_ihale_gizlenen_idler,
        f_db_tahta_ihale_gizlenen_toplami: f_db_tahta_ihale_gizlenen_toplami,
        f_db_tahta_ihale_gizlenen_tumu: f_db_tahta_ihale_gizlenen_tumu,

        f_db_tahta_ihale_takip_toplami: f_db_tahta_ihale_takip_toplami,
        f_db_tahta_ihale_rapor_bilgileri: f_db_tahta_ihale_rapor_bilgileri,
        f_indekslenen_ve_takip_edilen_ihale_idleri: f_indekslenen_ve_takip_edilen_ihale_idleri,
        f_db_tahta_ihale_takip_idler: f_db_tahta_ihale_takip_idler,
        f_db_tahta_ihale_takip_tumu: f_db_tahta_ihale_takip_tumu,

        f_db_tahta_ajanda_ekle: f_db_tahta_ajanda_ekle,
        f_db_tahta_ajanda_sil: f_db_tahta_ajanda_sil,
        f_db_tahta_ajandasi: f_db_tahta_ajandasi,
        f_db_tahta_uyeleri_x_rolune_sahip: f_db_tahta_uyeleri_x_rolune_sahip,
        f_db_aktif_tahta_uye_idleri: f_db_aktif_tahta_uye_idleri,
        f_db_tahta_kurum_idleri: f_db_tahta_kurum_idleri,
        f_db_tahta_teklif_idleri: f_db_tahta_teklif_idleri,
        // Tahtanın temel işlemleri
        f_db_tahta_tumu: f_db_tahta_tumu,
        f_db_tahta_id: f_db_tahta_id,
        f_db_tahtadan_ayril: f_db_tahtadan_ayril,
        f_db_tahta_ekle: f_db_tahta_ekle,
        f_db_tahta_guncelle: f_db_tahta_guncelle,
        f_db_tahta_sil: f_db_tahta_sil,
        // Anahtar işlemleri
        f_db_tahta_anahtar_tumu: f_db_tahta_anahtar_tumu,
        f_db_tahta_anahtar_ekle: f_db_tahta_anahtar_ekle,
        f_db_tahta_anahtar_sil: f_db_tahta_anahtar_sil,
        // Davetli ve Kullanıcı işlemleri
        f_db_tahta_davet: f_db_tahta_davet,
        f_db_tahta_davetleri: f_db_tahta_davetleri,
        f_db_tahta_davet_ekle: f_db_tahta_davet_ekle,
        f_db_tahta_davet_sil: f_db_tahta_davet_sil,
        f_db_tahta_davet_eposta: f_db_tahta_davet_eposta,
        f_db_tahta_uye_ekle: f_db_tahta_uye_ekle,
        f_db_tahta_uye_guncelle: f_db_tahta_uye_guncelle,
        f_db_tahta_uye_sil: f_db_tahta_uye_sil,
        f_db_tahta_uyeleri: f_db_tahta_uyeleri,
        f_db_tahta_uye_rol_guncelle: f_db_tahta_uye_rol_guncelle,
        // Tahta rol işlemleri
        //f_db_tahta_rol_ekle: f_db_tahta_rol_ekle,
        //f_db_tahta_rol_sil: f_db_tahta_rol_sil
        /**
         *
         * @param opt - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsTahta}
         */
        OptionsTahta: function (opt) {
            return extend(
                /** @class OptionsTahta */
                {
                    arrTahta_id: null,
                    bGenel: true,
                    bKurumu: true,
                    bAnahtarlari: true,
                    bRolleri: true,
                    bUyeleri: true,
                    bAjanda: true,
                    optUye: {
                        bTemelTahtaUyeBilgileri: true,
                        bArrTahtaUyeRolId: true
                    }
                }, opt || {});
        }
    };

    return result;
}


/**
 *
 * @type {DBTahta}
 */
var obj = DB_Tahta();
obj.__proto__ = require('./db_anahtar');

module.exports = obj;