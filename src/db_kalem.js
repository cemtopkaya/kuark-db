'use strict';

var exception = require('kuark-istisna'),
    schema = require('kuark-schema'),
    emitter = new (require('events').EventEmitter)(),
    _ = require('lodash'),
    extension = require('kuark-extensions'),
    l = extension.winstonConfig;

/**
 *
 * @returns {DBKalem}
 * @constructor
 */
function DB_Kalem() {
    // db işlemlerinin Promise ile yapılabilmesi için.
    var result = {};

    /**
     * Tahta anahtar kelimelerine göre indekslenmiş kalem idlerini getirir
     * @param _tahta_id
     * @returns {*}
     */
    function f_kalem_indeksli_idler(_tahta_id) {
        console.log("f_db_kalem_indeksli_idler");

        var db_tahta = require('./db_tahta');
        var temp_key = result.kp.temp.ssetTahtaAnahtarKalemleri(_tahta_id);

        return result.dbQ.exists(temp_key)
            .then(function (_iExist) {
                if (_iExist == 1) {
                    return result.dbQ.smembers(temp_key);
                } else {
                    //tahtanın anahtarlarını çekiyoruz
                    return db_tahta.f_db_tahta_anahtar_tumu(_tahta_id)
                        .then(function (_arrKelimeler) {
                            console.log("_arrKelimeler>" + _arrKelimeler);
                            if (_arrKelimeler.length == 0) {
                                l.warn("anahtarlar boş geldiği için kalem id gönderemiyoruz");
                                return [];
                            }

                            var anahtarIdleri = _arrKelimeler.pluckX("Id"),
                                arrAnahtarlarinSetAdlari = anahtarIdleri.map(function (_anahtar_id) {
                                    return result.kp.anahtar.ssetIndexKalem(_anahtar_id);
                                });

                            arrAnahtarlarinSetAdlari.unshift(temp_key);

                            //anahtar kelimelerin geçtiği kalemler
                            return result.dbQ.sunionstore_array(arrAnahtarlarinSetAdlari)
                                .then(function () {
                                    return result.dbQ.smembers(temp_key);
                                });
                        })
                        .fail(function (_err) {
                            var hata = "indeksli kalemler çekilirken hata oluştu: " + _err;
                            l.e(hata);
                            return hata;
                        });
                }
            });
    }


    /**
     * Tahtanın anahtar kelimelerine uygun indekslenmiş kalem idlerini getirir
     * @param _tahta_id
     * @param _ihale_id
     * @returns {*}
     */
    function f_kalem_indeksli_idler_ihaleye_bagli(_tahta_id, _ihale_id) {
        var db_ihale = require('./db_ihale');

        return result.dbQ.Q.all([
                f_kalem_indeksli_idler(_tahta_id), //anahtar kelimelerin geçtiği kalemler
                db_ihale.f_db_ihale_aktif_kalem_idler(_ihale_id, _tahta_id)//ihalenin kalemleri
            ])
            .then(function (_ress) {
                var anahtar_kalem_idler = _ress[0],
                    ihale_kalem_idler = _ress[1];
                console.log("anahtar_kalem_idler>" + anahtar_kalem_idler);
                console.log("ihale_kalem_idler>" + ihale_kalem_idler);
                var kesisim = ihale_kalem_idler.intersectionXU(anahtar_kalem_idler);
                console.log("kesisim>" + kesisim);
                return kesisim;
            })
            .fail(function (_err) {
                var hata = "indeksli kalemler çekilirken hata oluştu: " + _err;
                l.e(hata);
                return hata;
            });
    }

    /**
     * İndeksli kalemleri sayfalı getirir
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @param {UrlQuery} _arama
     * @returns {*}
     */
    function f_kalem_indeksliler_by_page(_tahta_id, _ihale_id, _arama) {
        l.info("f_db_kalem_indeksliler_by_page");
        var baslangic = 0,
            bitis = 10,
            sonucAnahtari = "temp_kalem_sayfali",
            defer = result.dbQ.Q.defer();

        if (_arama.Sayfalama) {
            baslangic = _arama.Sayfalama.Sayfa * _arama.Sayfalama.SatirSayisi;
            bitis = _arama.Sayfalama.SatirSayisi;
        }

        var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);
        sonuc.ToplamKayitSayisi = 0;
        sonuc.Data = [];

        f_kalem_indeksli_idler_ihaleye_bagli(_tahta_id, _ihale_id)
            .then(function (_kalem_idler) {
                console.log("_kalem_idler>" + _kalem_idler);
                console.log(" _kalem_idler.length>" + _kalem_idler.length);

                if (_kalem_idler && _kalem_idler.length > 0) {

                    sonuc.ToplamKayitSayisi = _kalem_idler.length;


                    //sayfalı çekebilmek için önce zset e eklemeliyiz(? diye bir sey zset oluşturmak için yazıyoruz)
                    _kalem_idler.mapX(null, function (_id) {
                        db.redis.dbQ.zadd(sonucAnahtari, new Date().getTime(), _id);
                    }).allX()
                        .then(function () {

                            console.log("baslangic>" + baslangic);
                            console.log("bitis>" + bitis);

                            result.dbQ.Q.all([
                                result.dbQ.zrangebyscore(sonucAnahtari, "-inf", "+inf", "LIMIT", baslangic, bitis),
                                result.dbQ.expire(sonucAnahtari, 20)
                            ]).then(function (_ress) {

                                if (_ress[0] && _ress[0].length > 0) {
                                    f_kalem_id(_ress[0], _tahta_id)
                                        .then(function (_data) {
                                            sonuc.Data = _data;
                                            defer.resolve(sonuc);
                                        });
                                } else {
                                    defer.resolve(sonuc);
                                }
                            });
                        });

                } else {
                    defer.resolve(sonuc);
                }
            });
        return defer.promise;
    }

    //region KALEMİN İHALESİ
    /**
     * Kalemin bağlı oldugu ihale bilgisini getirir
     * @param _kalem_id
     * @param _tahta_id
     * @returns {*}
     */
    function f_kalem_ihalesi(_kalem_id, _tahta_id) {
        return result.dbQ.hget(result.kp.kalem.hsetIhaleleri, _kalem_id)
            .then(function (_ihale_id) {
                /** @type {DBIhale} */
                var db_ihale = require('./db_ihale');

                /** @type {OptionsIhale} */
                var opts = {};
                opts.bArrKalemleri = false;
                opts.bTakip = false;
                opts.bYapanKurum = true;

                return db_ihale.f_db_ihale_id(_ihale_id, _tahta_id, opts);
            })
    }

    //endregion

    //region TAKİPTEKİ KALEMLER

    function f_kalem_takipte_mi(_kalem, _tahta_id) {
        return result.dbQ.sismember(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id), _kalem.Id)
            .then(function (_iTakip) {
                _kalem.Takip = _iTakip == 1;
                return _kalem;
            });
    }

    /**
     * Kalemin/kalemlerin takipte olup olmadığını bulup geri döner
     * @param _tahta_id
     * @param _kalemler
     */
    function f_kalem_takip_kontrol(_tahta_id, _kalemler) {

        if (Array.isArray(_kalemler) && _kalemler.length > 0) {

            return _kalemler.mapX(null, f_kalem_takipte_mi, _tahta_id).allX();

        } else {
            return f_kalem_takipte_mi(_kalemler, _tahta_id);
        }
    }

    /**
     * Takip edilecek kalem setinden çıkar
     * @param _tahta_id
     * @param _kalem_id
     * @returns {*}
     */
    function f_tahta_kalem_takip_sil(_tahta_id, _kalem_id) {
        return result.dbQ.srem(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id), _kalem_id);
    }

    /**
     * Takip edilecek kalem setine ekle
     * @param _tahta_id
     * @param _kalem_id
     * @returns {*}
     */
    function f_tahta_kalem_takip_ekle(_tahta_id, _kalem_id) {
        //kalem takip edilecek olarak belirlendiğinde ihalesi de takip edilecek olarak ayarlamalıyız
        return result.dbQ.sadd(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id), _kalem_id)
            .then(function () {
                return result.dbQ.hget(result.kp.kalem.hsetIhaleleri, _kalem_id)
                    .then(function (_ihale_id) {
                        return result.dbQ.sadd(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale_id);
                    });
            });
    }

    /**
     * Tahtada takip edilen tüm kalemleri getirir
     * @param _tahta_id
     * @returns {*}
     */
    function f_tahta_kalem_takip_tumu(_tahta_id) {
        return f_kalem_takip_idler(_tahta_id)
            .then(function (_kalem_idler) {
                if (_kalem_idler && _kalem_idler.length > 0) {
                    return f_kalem_id(_kalem_idler, _tahta_id);
                } else {
                    return [];
                }
            });
    }

    /**
     * Tahtanın takip edilen kalem id lerini getirir
     * @param _tahta_id
     * @returns {*}
     */
    function f_kalem_takip_idler(_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id));
    }

    function f_kalem_takip_toplami(_tahta_id) {
        return result.dbQ.Q.all([
            f_tahta_kalem_idler_aktif(_tahta_id),
            f_kalem_takip_idler(_tahta_id)

        ]).then(function (_ress) {

            var sonuc = schema.f_create_default_object(schema.SCHEMA.GRAFIK_DONUT),
                toplam = parseInt(_ress[0].length || 0),
                gecerli = parseInt(_ress[1].length || 0);
            sonuc.Toplam = toplam;
            sonuc.Gecerli = gecerli;
            sonuc.Gecersiz = toplam - gecerli;
            return sonuc;
        });
    }

    //endregion

    //region KALEM GİZLE/GÖSTER

    /**
     * Kullanıcı tahtada gizlediği kalemi tekrardan listede görmek isterse geri alıyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kalem_id
     */
    function f_kalem_gizlenen_sil(_tahta_id, _kalem_id) {

        return result.dbQ.srem(result.kp.tahta.ssetGizlenenKalemleri(_tahta_id), _kalem_id)
            .then(function () {
                //kalemin ihalesini buluyoruz ki ihale temp setinde kayıt varsa onları da silelim
                result.dbQ.hget(result.kp.kalem.hsetIhaleleri, _kalem_id)
                    .then(function (_ihale_id) {
                        emitter.emit(schema.SABIT.OLAY.KALEM_GIZLENDI_IPTAL, _kalem_id, _ihale_id, _tahta_id);
                        return _kalem_id;
                    });
            });
    }

    /**
     * Kullanıcı tahtada görmek istemediği kalemleri gizleyebilir, böylece listede gizlenenler görünmeyecektir.
     * @param {integer} _tahta_id
     * @param {integer} _kalem_id
     */
    function f_kalem_gizlenen_ekle(_tahta_id, _kalem_id) {
        return result.dbQ.sadd(result.kp.tahta.ssetGizlenenKalemleri(_tahta_id), _kalem_id)
            .then(function () {
                //kalemin ihalesini buluyoruz ki ihale temp setinde kayıt varsa onları da silelim
                result.dbQ.hget(result.kp.kalem.hsetIhaleleri, _kalem_id)
                    .then(function (_ihale_id) {
                        emitter.emit(schema.SABIT.OLAY.KALEM_GIZLENDI, _kalem_id, _ihale_id, _tahta_id);
                        return _kalem_id;
                    });
            });
    }


    /**
     * Kullanıcı tahtada görmek istemediği kalem listesini dönüyoruz.
     * @param {integer} _tahta_id
     */
    function f_kalem_gizlenen_tumu(_tahta_id) {
        return f_kalem_gizlenen_idler(_tahta_id)
            .then(function (_kalem_idler) {
                if (_kalem_idler && _kalem_idler.length > 0) {
                    return f_kalem_id(_kalem_idler, _tahta_id);
                } else {
                    return [];
                }
            });
    }

    /**
     * Gizlenen kalem toplamını getirir
     * @param _tahta_id
     * @returns {*}
     */
    function f_kalem_gizlenen_toplami(_tahta_id) {

        return result.dbQ.exists(result.kp.temp.ssetTahtaKalemTumu(_tahta_id))
            .then(function (_iExist) {
                return (_iExist
                    ? 1//temp var
                    : f_tahta_kalem_idler_aktif(_tahta_id));//temp oluşturmak için kalem idlerini çek )
            })
            .then(function () {
                return result.dbQ.Q.all([
                    f_kalem_gizlenen_idler(_tahta_id),
                    result.dbQ.scard(result.kp.temp.ssetTahtaKalemTumu(_tahta_id))

                ]).then(function (_ress) {

                    var sonuc = schema.f_create_default_object(schema.SCHEMA.GRAFIK_DONUT);
                    var gecerli = parseInt(_ress[0].length || 0),
                        toplam = parseInt(_ress[1] || 0);
                    sonuc.Toplam = toplam;
                    sonuc.Gecerli = gecerli;
                    sonuc.Gecersiz = toplam - gecerli;
                    return sonuc;
                });
            })


    }

    function f_kalem_gizlenen_idler(_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetGizlenenKalemleri(_tahta_id));
    }


    //endregion

    //region KALEM ONAY DURUMU

    /**
     *
     * @param {integer|integer[]|string|string[]} _kalem_id
     * @param {integer} _tahta_id - Tahta id bilgisi olmak zorunda
     * @returns {*}
     */
    function f_kalem_onay_durumu(_kalem_id, _tahta_id) {

        var defer = result.dbQ.Q.defer();

        //noinspection JSValidateTypes
        if (!_tahta_id && _tahta_id === 0) {
            defer.resolve({Id: 2, Baslik: "İlk Kayıt"});
            //throw new exception.Istisna("Kalem onay durumu çekilemedi", "Tahta_id bilgisi kalemin onay durumu çekilirken boş bırakılamaz!");
        }

        // birden fazla satir_id için hmget_json_parse ile çekilebilir şekilde yazılacak
        (Array.isArray(_kalem_id)
            ? result.dbQ.hmget_json_parse(result.kp.tahta.hsetKalemOnayDurumlari(_tahta_id), _kalem_id)
            : result.dbQ.hget_json_parse(result.kp.tahta.hsetKalemOnayDurumlari(_tahta_id), _kalem_id))
            .then(function (_durum) {

                function f_kalem_durumu(_kalemDurumu) {
                    return _kalemDurumu || {Id: 2, Baslik: "İlk Kayıt"};
                }

                return Array.isArray(_durum)
                    ? _durum.map(f_kalem_durumu)
                    : f_kalem_durumu(_durum)

            })
            .then(function (_res) {
                defer.resolve(_res);
            })
            .fail(function (_err) {
                defer.reject("Kalem onay durumu çekilirken hata alındı:", _err);
            });

        return defer.promise;
    }

    /**
     * Kalemin onay durumunu değiştirmemizi sağlar. Örneğin teklifti sonra katılıyoruza çekildi.
     * Bu durumda önce teklif setinden kaldırmalı sonra katılıyoruz setine eklemeliyiz
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @param {integer} _kalem_id
     * @param {OnayDurumu} _onay_durumu
     */
    function f_kalem_onay_durumu_guncelle(_tahta_id, _ihale_id, _kalem_id, _onay_durumu) {
        var defer = result.dbQ.Q.defer();

        if (_onay_durumu && _onay_durumu.Id > 0) {

            f_kalem_onay_durumu(_kalem_id, _tahta_id)
                .then(function (/** @type {OnayDurumu} */ _dbDurum) {

                    result.dbQ.Q.all([
                        (_dbDurum != null ? result.dbQ.srem(result.kp.kalem.ssetOnayDurumlari(_tahta_id, _dbDurum.Id), _kalem_id) : null),
                        result.dbQ.hset(result.kp.tahta.hsetKalemOnayDurumlari(_tahta_id), _kalem_id, JSON.stringify(_onay_durumu)),
                        result.dbQ.sadd(result.kp.kalem.ssetOnayDurumlari(_tahta_id, _onay_durumu.Id), _kalem_id)
                    ]);
                })
                .then(function () {
                    //kalemin durumu değiştiğinde elastic tarafını güncellememiz gerekiyor
                    //bu nedenle önce f_kalem_id metodundan kalem bilgisi alıp sonra da tetikleme işlemini yapıyoruz
                    f_kalem_id(_kalem_id, _tahta_id)
                        .then(function (_dbKalem) {
                            emitter.emit(schema.SABIT.OLAY.KALEM_DURUMU_GUNCELLENDI, _dbKalem, _ihale_id, _tahta_id);

                            defer.resolve(_kalem_id);
                        });
                });
        } else {
            defer.resolve(_kalem_id);
        }

        return defer.promise;
    }

    //endregion

    //region KALEME BAĞLI TEKLİFLER
    /**
     * Kaleme bağlı teklifler idlerini getirir
     * @param {integer} _tahta_id
     * @param {integer} _kalem_id
     * @param {Sayfalama=} _sayfalama
     * @returns {*}
     */
    function f_kalem_teklif_idleri(_tahta_id, _kalem_id, _sayfalama) {
        var defer = result.dbQ.Q.defer();

        var multi = result.rc.multi(),
            sonucAnahtari = result.kp.temp.ssetTahtaKalemTeklifleri(_tahta_id, _kalem_id);

        result.dbQ.exists(sonucAnahtari)
            .then(function (_iExist) {

                if (_iExist) {
                    //temp anahtarı var yeniden çekmeye gerek yok, teklif bilgilerini dön
                } else {
                    //temp anahtarı yok oluştur ve teklif bilgilerini dön
                    multi.sinterstore(sonucAnahtari, result.kp.kalem.ssetTeklifleri(_kalem_id), result.kp.tahta.ssetTeklifleri(_tahta_id, true));
                }

                multi.exec(function (err, replies) {
                    if (err) {
                        l.e("Teklifler çekilemedi. MULTI ERROR: " + err);
                        defer.reject(err);
                    }

                    if (_sayfalama) {
                        var baslangic = _sayfalama.Sayfa * _sayfalama.SatirSayisi,
                            bitis = _sayfalama.SatirSayisi;
                    }

                    (_sayfalama
                        ? result.dbQ.sort(sonucAnahtari, "LIMIT", baslangic, bitis)
                        : result.dbQ.smembers(sonucAnahtari))
                        .then(function (_dbReply) {
                            defer.resolve(_dbReply);
                        })
                        .fail(function (_err) {
                            l.e("Kalem teklifleri çekilemedi. Hata: " + _err);
                            defer.reject(_err);
                        });
                });
            });

        return defer.promise;
    }

    /**
     * Kaleme bağlı tekliflerini getirir
     * @param {integer} _tahta_id
     * @param {integer} _kalem_id
     * @param {Sayfalama=} _sayfalama
     * @returns {*}
     */
    function f_kalem_teklif_tumu(_tahta_id, _kalem_id, _sayfalama) {
        return f_kalem_teklif_idleri(_tahta_id, _kalem_id, _sayfalama)
            .then(function (_aktifler) {
                var sonucAnahtari = result.kp.temp.ssetTahtaKalemTeklifleri(_tahta_id, _kalem_id),
                    sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);

                if (_aktifler.length == 0) {
                    sonuc.ToplamKayitSayisi = 0;
                    sonuc.Data = [];
                    return sonuc;

                } else {

                    return result.dbQ.scard(sonucAnahtari)
                        .then(function (_toplamKayitSayisi) {
                            sonuc.ToplamKayitSayisi = _toplamKayitSayisi;

                            /** @type {OptionsTeklif} */
                            var opts = db.teklif.OptionsTeklif({
                                bArrUrunler: true,
                                bKalemBilgisi: false,
                                bIhaleBilgisi: false,
                                bKurumBilgisi: true,
                                optUrun: {}
                            });


                            var db_teklif = require('./db_teklif');
                            return db_teklif.f_db_teklif_id(_aktifler, _tahta_id, opts)
                                .then(function (_dbTeklifler) {
                                    sonuc.Data = _dbTeklifler;
                                    return sonuc;
                                });
                        });
                }

            });
    }


    /**
     * Kaleme ait teklif olup olmadığını buluyoruz, varsa teklifler dizisi döner
     * @param _tahta_id
     * @param _kalem_id
     * @returns {*}
     */
    function f_kalem_teklif_kontrol(_tahta_id, _kalem_id) {
        if (_tahta_id > 0) {
            return result.dbQ.sinter(result.kp.kalem.ssetTeklifleri(_kalem_id), result.kp.tahta.ssetTeklifleri(_tahta_id, true));
        } else {
            return [];
        }
    }

    //endregion

    //region KALEM İD LER

    /**
     * Tahtanın görebileceği kalem idlerini döner
     * @param {integer} _tahta_id
     * @returns {*}
     */
    function f_tahta_kalem_idler_aktif(_tahta_id) {
        var db_ihale = require('./db_ihale'),
            defer = result.dbQ.Q.defer(),
            anahtar = result.kp.temp.ssetTahtaKalem(_tahta_id);

        result.dbQ.exists(anahtar)
            .then(function (_dbReply) {
                if (_dbReply == 1) {
                    //anahtar var yeniden oluşturmuyoruz

                } else {
                    //anahtar yok
                    //önce tahtanın aktif ihale id leri çekilir
                    //bu ihalelere bağlı kalemler temp.kalem.tumu setine eklenir
                    //aynı şekilde ezilen gizlenen kalemler istenmeyenler setine eklenir
                    //sonuçta kullanıcının göreceği set bu iki setin farkı olacaktır
                    db_ihale.f_db_tahta_ihale_idler_aktif(_tahta_id)
                        .then(function (_ihale_idler) {

                            var arrKalemKeys = [],
                                anahtarTumu = result.kp.temp.ssetTahtaKalemTumu(_tahta_id),
                                anahtarIstenmeyen = result.kp.temp.ssetTahtaKalemIstenmeyen(_tahta_id);

                            _ihale_idler.forEach(function (_elm) {
                                arrKalemKeys.push(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _elm, true), result.kp.ihale.ssetKalemleri(_elm));
                            });
                            arrKalemKeys.unshift(anahtarTumu);

                            result.dbQ.Q.all([
                                result.dbQ.sunionstore_array(arrKalemKeys),
                                result.dbQ.sunionstore(anahtarIstenmeyen, result.kp.tahta.ssetEzilenKalemleri(_tahta_id), result.kp.tahta.ssetGizlenenKalemleri(_tahta_id))
                            ]).then(function () {
                                result.dbQ.sdiffstore(anahtar, anahtarTumu, anahtarIstenmeyen)
                            });
                        });
                }
            })
            .then(function () {
                result.dbQ.smembers(anahtar)
                    .then(function (_kalem_idler) {
                        defer.resolve(_kalem_idler);
                    });
            });

        return defer.promise;
    }

    //SATIR İŞLEMLERİ (ekle-sil-güncelle-bul)
    /**
     *
     * @param {integer|integer[]|string|string[]} kalem_id
     * @param {integer} _tahta_id
     * @param {OptionsKalem=} _opts
     * @returns {*}
     */
    function f_kalem_id(kalem_id, _tahta_id, _opts) {
        var optsKalem = result.OptionsKalem(_opts);

        return (Array.isArray(kalem_id)
            ? result.dbQ.hmget_json_parse(result.kp.kalem.tablo, kalem_id)
            : result.dbQ.hget_json_parse(result.kp.kalem.tablo, kalem_id))
            .then(
                /**
                 *
                 * @param {DBKalem|DBKalem[]} _dbKalem
                 */
                function (_dbKalem) {
                    if (!_dbKalem) {
                        return null;
                    }

                    /**
                     *
                     * @param {KalemDB} _kalem
                     * @param {OptionsKalem} _optKalemBilgileri
                     * @returns {*}
                     */
                    function f_KalemBilgileriniCek(_kalem, _optKalemBilgileri) {

                        if (!_kalem) {
                            return null;
                        }

                        // > Birden fazla kalem_id için tek bir sorguyla  ne çekebiliriz?
                        // - Kalemlerin durum onayını tek bir sorguyla tümü için çekebiliriz.
                        // > Tek tek çekilmesi gereken kalem bilgileri nelerdir?
                        // - Takiptemi, teklifleri
                        // saf olarak gelen kalem bilgisini OnayDurumu, Takip ve Teklifler alanlarıyla genişleterek döneceğiz

                        var olusan_kalem = schema.f_create_default_object(schema.SCHEMA.KALEM);

                        olusan_kalem = _.extend(olusan_kalem, _kalem);

                        return result.dbQ.Q.all([
                                (_optKalemBilgileri.bOnayDurumu && _tahta_id
                                    ? f_kalem_onay_durumu(_kalem.Id, _tahta_id)
                                    : {Id: 0}),
                                (_optKalemBilgileri.bTakiptemi && _tahta_id
                                    ? result.dbQ.sismember(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id), _kalem.Id)
                                    : 0),
                                (_optKalemBilgileri.bArrTeklifleri
                                    ? f_kalem_teklif_tumu(_tahta_id, _kalem.Id)
                                    : [])
                            ])
                            .then(function (_ress) {
                                olusan_kalem.OnayDurumu = _ress[0];
                                olusan_kalem.Takip = _ress[1];
                                olusan_kalem.Teklifler = _ress[2];
                                return olusan_kalem;
                            });
                    };


                    if (Array.isArray(_dbKalem)) {// Onay durumlarını yekten çek, diğer bilgilerini her kalem için tek tek çek
                        optsKalem.bOnayDurumu = false;
                        return _dbKalem
                            .mapX(null, f_KalemBilgileriniCek, optsKalem)
                            .allX()
                            .then(function (dbKalemBilgilerle) {

                                return f_kalem_onay_durumu(kalem_id, _tahta_id)
                                    .then(function (dbKalemOnayDurumlari) {

                                        return dbKalemBilgilerle.map(function (_elm, _idx) {
                                            _elm.OnayDurumu = dbKalemOnayDurumlari[_idx];
                                            return _elm;
                                        });

                                    });
                            })
                            .fail(function (_err) {
                                throw new exception.Istisna("Kalem bilgisi çekilemedi", _err);
                            });
                    } else {
                        return f_KalemBilgileriniCek(_dbKalem, optsKalem);
                    }
                })
            .fail(function (_err) {
                console.log("DB ERROR oldu: ", _err);
                throw new exception.Istisna("Kalem bilgisi çekilemedi", "f_db_kalem_id içinde: " + _err);
            });
    }


    //endregion

    //region KALEM EKLE-GÜNCELLE-SİL
    function f_kalemleri_ekle(_ihale_id, _ihaleKalemleri, _kul_id) {
        return result.dbQ.incrby(result.kp.kalem.idx, _ihaleKalemleri.length)
            .then(function (_sonKalemId) {
                var ilkKalemId = _sonKalemId - _ihaleKalemleri.length;
                var arrKalem = [result.kp.kalem.tablo],
                    arrKalemId = [],
                    arrKalemIdIhaleId = [result.kp.kalem.hsetIhaleleri];
                var arrKalemEmit = [];

                _ihaleKalemleri.forEach(function (_kalem) {

                    ilkKalemId = ilkKalemId + 1;
                    _kalem.Id = ilkKalemId;
                    arrKalem.push(_kalem.Id);
                    arrKalem.push(JSON.stringify(_kalem));
                    arrKalemId.push(_kalem.Id);
                    arrKalemIdIhaleId.push(_kalem.Id);
                    arrKalemIdIhaleId.push(_ihale_id);

                    //emitter.emit metoduna her kalem, ekliyoruz ki teker teker işlem yapmasın
                    arrKalemEmit.push(_kalem);
                    //emitter.emit(schema.SABIT.OLAY.KALEM_EKLENDI, _kalem, _ihale_id, 0, _kul_id);
                });

                //tek seferde tüm kalem setini gönderiyoruz
                emitter.emit(schema.SABIT.OLAY.KALEM_EKLENDI, arrKalemEmit, _ihale_id, 0, _kul_id);

                return result.dbQ.Q.all([
                    result.dbQ.hmset_array(arrKalem),
                    result.dbQ.sadd_array(result.kp.kalem.ssetGenel, arrKalemId),
                    result.dbQ.sadd_array(result.kp.ihale.ssetKalemleri(_ihale_id), arrKalemId),
                    result.dbQ.hmset_array(arrKalemIdIhaleId)
                ]);
            });
    }

    /**
     * Yeni kalem ekle (genel kalem-ihale dünyasından çekilen..vb)
     * @param _ihale_id
     * @param _kalem
     * @param _kul_id
     * @returns {*}
     */
    function f_kalem_ekle(_ihale_id, _kalem, _kul_id) {

        return result.dbQ.incr(result.kp.kalem.idx)
            .then(function (_id) {
                _kalem.Id = _id;

                // satırı ihale ile ilişkilendireceğiz
                return result.dbQ.hset(result.kp.kalem.tablo, _id, JSON.stringify(_kalem))
                    .then(function () {
                        return result.dbQ.Q.all([
                            result.dbQ.sadd(result.kp.kalem.ssetGenel, _kalem.Id),
                            result.dbQ.sadd(result.kp.ihale.ssetKalemleri(_ihale_id), _kalem.Id),
                            result.dbQ.hset(result.kp.kalem.hsetIhaleleri, _kalem.Id, _ihale_id)
                        ]);
                    })
                    .then(function () {
                        emitter.emit(schema.SABIT.OLAY.KALEM_EKLENDI, _kalem, _ihale_id, 0, _kul_id);
                        /** @type {OptionsKalem} */
                        var opts = {
                            bArrTeklifleri: false,
                            bTakiptemi: false,
                            bOnayDurumu: false
                        };
                        return f_kalem_id(_id, 0, opts);
                    });
            });
    }

    /**
     * Tahtaya yeni kalem ekle
     * @param _tahta_id
     * @param _ihale_id
     * @param _es_kalem
     * @param _db_kalem
     * @param _kul_id
     * @returns {*}
     */
    function f_kalem_ekle_tahta(_tahta_id, _ihale_id, _es_kalem, _db_kalem, _kul_id) {

        var onay_durumu = _es_kalem.OnayDurumu;

        //genel ihaleye tahtada yeni kalem ekleniyor
        //bu durumda sadece tahtanın (tahta:401:ihale:101:kalem) kalemlerine eklemeliyiz
        //ihalenin genel kalemlerine değil!! (ihale:101:kalem)
        return result.dbQ.incr(result.kp.kalem.idx)
            .then(function (_id) {
                _es_kalem.Id = _db_kalem.Id = _id;

                emitter.emit(schema.SABIT.OLAY.KALEM_EKLENDI, _es_kalem, _ihale_id, _tahta_id, _kul_id);

                //satırı ihale-tahta ile ilişkilendireceğiz
                return result.dbQ.hset(result.kp.kalem.tablo, _id, JSON.stringify(_db_kalem))
                    .then(function () {

                        return result.dbQ.Q.all([
                            result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true), _db_kalem.Id),
                            result.dbQ.hset(result.kp.kalem.hsetIhaleleri, _db_kalem.Id, _ihale_id)
                        ]);
                    })
                    .then(function () {
                        //onay durumu varsa güncelle yoksa satırı döner
                        return f_kalem_onay_durumu_guncelle(_tahta_id, _ihale_id, _db_kalem.Id, onay_durumu);
                    })
                    .then(function () {
                        return f_kalem_id(_id, _tahta_id);
                    });
            })
            .fail(function (_err) {
                l.e(_err);
                throw new exception.Istisna("kalem eklenemedi", "HATA: " + _err);
            });
    }


    /**
     * Kalemin güncellenmesi sğlanır
     * @param _tahta_id
     * @param _ihale_id
     * @param _es_kalem
     * @param _db_kalem
     * @param _kul_id
     * @returns {*}
     */
    function f_kalem_guncelle(_tahta_id, _ihale_id, _es_kalem, _db_kalem, _kul_id) {

        // region NOTLAR
        /*
         HASH LOGLAR
         * ID
         * LOG:SATIR:1 x
         * SATIR:1 xx
         * SATIR:1 xxx
         *
         *
         *
         * HASH kalem
         * -- Ekleniyor --
         * incr idx:kalem                                                        -> id olarak 1 versin
         * hset kalem | 1 | {.....}                                              -> hset ile HASH içine ekle
         * zadd ihale:1:satirlari:eklenen | 143123123 | 1                        -> eklendiği tarihle EKLENENLERE yaz ki aktif SATIRLAR bulunabilsin
         * sadd LOG:kalem:1 | {kullanici:132, tarih:143123123, nesne:{.....} }   -> log oluştur
         * -- Güncelleme geldi --
         * hset kalem | 1 | {.....}
         * sadd LOG:kalem:1 | {.....}
         * -- Silinecek --
         * zadd ihale:1:satirlari:silinen | 143126663 | 1
         * sadd LOG:kalem:1 | {.....}
         *
         * SET LOG:SATIR:1
         * {kullanici:12, tarih:23423423, metin:'ihale eklendi' nesne:obje}
         * obje2
         * obje3
         *
         * ZSET LOG:SATIR:1
         * tarih   obje
         * tarih1  obje2
         * tarih2  obje3
         *
         *
         * kullanici:1:haberleri:eklenen
         * {tarih:23423423, metin:'Yeni ihale eklendi' nesne:null, referans_id:'ihale:19'} > <a href="#ihale/19">Yeni ihale eklendi</a>
         * {tarih:23423423, metin:'{this.nesne.konusu} başlıklı ihale eklendi' nesne:{id:19, konusu:....}, referans_id:'ihale:19'} > <a href="#ihale/19">Yeni ihale eklendi</a>
         * **/
        // endregion

        var onay_durumu = _es_kalem.OnayDurumu,
            orjinal_kalem_id = _db_kalem.Id;

        /**
         * Genel kalem ise yeni kalem eklenir
         * @returns {*}
         */
        function f_genel_kalem_guncelle() {
            return result.dbQ.incr(result.kp.kalem.idx)
                .then(function (_id) {
                    _es_kalem.Id = _db_kalem.Id = _id;
                    _db_kalem.Orjinal_Id = _es_kalem.Orjinal_Id = orjinal_kalem_id;

                    emitter.emit(schema.SABIT.OLAY.KALEM_GUNCELLENDI,
                        {
                            tahta_id: _tahta_id,
                            yeni_kalem: _es_kalem,
                            orjinal_kalem_id: orjinal_kalem_id,
                            ihale_id: _ihale_id,
                            kul_id: _kul_id
                        });

                    return result.dbQ.hset(result.kp.kalem.tablo, _db_kalem.Id, JSON.stringify(_db_kalem))
                        .then(function () {

                            //onay durumları ile ilgili işlemleri tamamlayacağız
                            //satırın onay durumunu eski listeden kaldırıp yenisine ekliyoruz
                            //örneğin katılıyoruz (2) demişti sadd tahta:401:durum:2 201 setine eklemiştik
                            //sonra gitti itiraz edilecek (3) dedi bu durumda önce gidip katılıyoruz listesinden kaldırıyoruz
                            //srem tahta:401:durum:2 201
                            return f_kalem_onay_durumu(orjinal_kalem_id, _tahta_id)
                                .then(function (_dbDurum) {
                                    if (_dbDurum != null) {
                                        //eski satıra ait onay durum bilgileri vars siliyoruz
                                        return result.dbQ.Q.all([
                                            result.dbQ.srem(result.kp.kalem.ssetOnayDurumlari(_tahta_id, _dbDurum.Id), orjinal_kalem_id),
                                            result.dbQ.hdel(result.kp.tahta.hsetKalemOnayDurumlari(_tahta_id), orjinal_kalem_id)
                                        ]);
                                    }
                                    else {
                                        return _db_kalem;
                                    }
                                });
                        })
                        .then(function () {
                            //genel kalemi tahtanın ezilen kalemlerine ekliyoruz
                            //tahtanın özel kalemlerine ekliyoruz
                            //kalem onay durumları setine ekliyoruz
                            return result.dbQ.Q.all([
                                result.dbQ.sadd(result.kp.tahta.ssetEzilenKalemleri(_tahta_id), orjinal_kalem_id),
                                result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true), _id)
                            ]);
                        })
                        .then(function () {
                            //satırın onay durumlarını düzenle
                            return f_kalem_onay_durumu_guncelle(_tahta_id, _ihale_id, _db_kalem.Id, onay_durumu);
                        })
                        .then(function () {
                            //satıra verilen teklifler ile tahtada verilen tekliflerin kesişimini bulup
                            //gelen kayıtları yeni satır id ile ilişkilendiriyoruz
                            return result.dbQ.sinter(result.kp.kalem.ssetTeklifleri(orjinal_kalem_id), result.kp.tahta.ssetTeklifleri(_tahta_id, true))
                                .then(function (_iTeklif_idler) {
                                    if (_iTeklif_idler && _iTeklif_idler.length > 0) {

                                        var arrPromises = _.map(_iTeklif_idler, function (_teklif_id) {
                                            return result.dbQ.Q.all([
                                                result.dbQ.sadd(result.kp.kalem.ssetTeklifleri(_db_kalem.Id), _teklif_id),
                                                result.dbQ.srem(result.kp.kalem.ssetTeklifleri(orjinal_kalem_id), _teklif_id),
                                                result.dbQ.hset(result.kp.teklif.hsetKalemleri, _teklif_id, _db_kalem.Id)
                                            ]);
                                        });

                                        return result.dbQ.Q.all(arrPromises);
                                    }
                                    return _db_kalem.Id;
                                });
                        })
                        .then(function () {
                            return f_kalem_id(_db_kalem.Id, _tahta_id);
                        });
                });
        }

        /**
         * Tahtaya ait özel kalem güncellenir.
         * @returns {*}
         */
        function f_ozel_kalem_guncelle() {
            emitter.emit(schema.SABIT.OLAY.KALEM_GUNCELLENDI,
                {
                    tahta_id: _tahta_id,
                    yeni_kalem: _es_kalem,
                    orjinal_kalem_id: orjinal_kalem_id,
                    ihale_id: _ihale_id,
                    kul_id: _kul_id
                });

            //özel kalem bilgisinde hash sadece güncellenir
            return result.dbQ.hset(result.kp.kalem.tablo, _db_kalem.Id, JSON.stringify(_db_kalem))
                .then(function () {
                    //onay durumları ile ilgili işlemleri tamamlayacağız
                    //satırın onay durumunu eski listeden kaldırıp yenisine ekliyoruz
                    //örneğin katılıyoruz (2) demişti sadd tahta:401:durum:2 201 setine eklemiştik
                    //sonra gitti itiraz edilecek (3) dedi bu durumda önce gidip katılıyoruz listesinden kaldırıyoruz
                    //srem tahta:401:durum:2 201
                    //onay durumu varsa güncelle yoksa satırı döner
                    return f_kalem_onay_durumu_guncelle(_tahta_id, _ihale_id, _db_kalem.Id, onay_durumu)
                        .then(function () {
                            return f_kalem_id(_db_kalem.Id, _tahta_id);
                        });
                });
        }

        return f_kalem_genel_kontrol(orjinal_kalem_id)
            .then(function (_iGenel) {
                if (_iGenel == 1) {
                    //genel kalem ezilir
                    return f_genel_kalem_guncelle();

                } else {
                    return f_ozel_kalem_guncelle()
                }
            });
    }

    /**
     * Bu kalem genel kalemler setinde ise 1 değilse 0 döner
     * @param _kalem_id
     * @returns {*}
     */
    function f_kalem_genel_kontrol(_kalem_id) {
        return result.dbQ.sismember(result.kp.kalem.ssetGenel, _kalem_id);
    }

    /**
     * Kalem silindiğinde aşağıdaki adımlar gerçekleşir:
     * > tahtanın özel kalemlerinden silinir (aktiften kaldırılır pasife eklenir.)
     * > kaleme ait teklifler varsa silinir
     * > kalem ihale ilişkisi silinir (hdel kalem:ihale 201)
     * @param {integer} _kalem_id
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    function f_kalem_sil_tahta(_kalem_id, _tahta_id, _ihale_id, _kul_id) {
        if (_kalem_id && _kalem_id > 0) {
            return f_kalem_genel_kontrol(_kalem_id)
                .then(function (_iGenel) {
                    if (_iGenel == 1) {

                        //genel kalem silinemez
                        throw new exception.Istisna("Kalem Silinemedi!", "Silinmek istenen kalem GENEL kalemler içerisinde kayıtlı olduğu için işlem tamamlanamadı!");

                    } else {

                        //tahtaya ait özel kalem silinebilir
                        return f_kalem_id(_kalem_id, _tahta_id)
                            .then(function (_dbKalem) {
                                emitter.emit(schema.SABIT.OLAY.KALEM_SILINDI, _dbKalem, _tahta_id, _kul_id);
                                return result.dbQ.Q.all([
                                    // Eklenen satirlarda varsa oradan çıkartıp, silinen satirlara ekleyeceğiz
                                    result.dbQ.srem(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true), _kalem_id),
                                    result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, false), _kalem_id),
                                    result.dbQ.hdel(result.kp.kalem.hsetIhaleleri, _kalem_id)

                                ]).then(function () {
                                    //satır silindiğinde teklifleri de siLmeliyiz
                                    return result.dbQ.smembers(result.kp.kalem.ssetTeklifleri(_kalem_id))
                                        .then(function (_iTeklif_idler) {
                                            if (_iTeklif_idler.length > 0) {
                                                var db_teklif = require('./db_teklif');
                                                return _iTeklif_idler.mapX(null, db_teklif.f_db_teklif_sil, _tahta_id, _kul_id).allX();
                                            }
                                            return _iTeklif_idler;
                                        });
                                });
                            });
                    }
                });

        } else {
            throw new exception.Istisna("Kalem Silinemedi!", "Silinmek istenen kalem_id bulunamadı! Tekrar deneyiniz.");
        }
    }

//endregion

    /**
     * @class DBKalem
     */
    result = {
        f_db_kalem_indeksli_idler: f_kalem_indeksli_idler,
        f_db_kalem_indeksli_idler_ihaleye_bagli: f_kalem_indeksli_idler_ihaleye_bagli,
        f_db_kalem_indeksliler_by_page: f_kalem_indeksliler_by_page,
        f_db_kalem_takipte_mi: f_kalem_takipte_mi,
        f_db_kalem_takip_kontrol: f_kalem_takip_kontrol,
        f_db_kalem_takip_idler: f_kalem_takip_idler,
        f_db_kalem_takip_toplami: f_kalem_takip_toplami,
        f_db_tahta_kalem_takip_sil: f_tahta_kalem_takip_sil,
        f_db_tahta_kalem_takip_ekle: f_tahta_kalem_takip_ekle,
        f_db_tahta_kalem_takip_tumu: f_tahta_kalem_takip_tumu,
        f_db_tahta_kalem_idler_aktif: f_tahta_kalem_idler_aktif,
        f_db_kalem_onay_durumu: f_kalem_onay_durumu,
        f_db_kalem_onay_durumu_guncelle: f_kalem_onay_durumu_guncelle,
        f_db_kalem_teklif_tumu: f_kalem_teklif_tumu,
        f_db_kalem_teklif_kontrol: f_kalem_teklif_kontrol,
        f_db_kalem_id: f_kalem_id,
        f_db_kalem_ekle: f_kalem_ekle,
        f_db_kalemleri_ekle: f_kalemleri_ekle,
        f_db_kalem_ekle_tahta: f_kalem_ekle_tahta,
        f_db_kalem_guncelle: f_kalem_guncelle,
        f_db_kalem_genel_kontrol: f_kalem_genel_kontrol,
        f_db_kalem_sil_tahta: f_kalem_sil_tahta,
        f_db_kalem_gizlenen_ekle: f_kalem_gizlenen_ekle,
        f_db_kalem_gizlenen_sil: f_kalem_gizlenen_sil,
        f_db_kalem_gizlenen_tumu: f_kalem_gizlenen_tumu,
        f_db_kalem_gizlenen_idler: f_kalem_gizlenen_idler,
        f_db_kalem_gizlenen_toplami: f_kalem_gizlenen_toplami,
        f_db_kalem_ihalesi: f_kalem_ihalesi,
        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsKalem}
         */
        OptionsKalem: function (opts) {

            /** @type {OptionsKalem}*/
            return _.extend({
                bArrTeklifleri: false,
                bTakiptemi: true,
                bOnayDurumu: true
            }, opts || {})
        }
    };
    return result;
}

/**
 *
 * @type {DBKalem}
 */
var obj = DB_Kalem();
obj.__proto__ = require('./db_log');

module.exports = obj;