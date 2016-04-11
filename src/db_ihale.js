'use strict';

var schema = require('kuark-schema'),
    exception = require('kuark-istisna'),
    emitter = new (require('events').EventEmitter)(),
    extensions = require('kuark-extensions'),
    l = extensions.winstonConfig,
    _ = require('lodash');


/**
 * <pre>Ihaleler ekleme:
 *  HS > Ihale                  : TÜM İHALELER bu hash içinde olacak(tahtanın ya da genelin).
 *  ZS > Ihale:EklenmeTarihi    : İhalenin sisteme eklenme tarihi tutacağız.
 *  ZS > Ihale:Tarihi           : İhalenin yapılma tarihi
 *  ZS > Ihale:IptalTarihi      : Ihalenin iptal edildiği tarih.
 *  sS > Ihale:Genel            : Genele açık ihaleler (Sisteme girdiğimiz ya da saglikbank ekap vs. den çektiğimiz ihaleler)
 *  sS > Ihale:Genel:Silinen    : Genelden sildiğimiz IHALE IDX leri
 *  sS > Tahta:X:Ihale          : Tahtaya eklenen IHALE IDX leri
 *  sS > Tahta:X:Ihale:Ezilen   : Tahta tarafından genele ait ama düzenlenerek yeni oluşturulmuş IHALE IDX leri
 *  sS > Tahta:X:Ihale:Gizlenen : Tahta tarafından eklenmiş ya da genelde gözüken ama görünmesi istenmeyen ihale IDX leri
 *  sS > Tahta:X:Ihale:Iptal    : Tahtanın iptal edildi olarak işaretlediği İHALE İDX leri
 *
 * Tahtanın görebileceği tüm ihaleler EKLENME TARİHİNE göre sıralı:
 * SINTERSTORE  tahta_401_tum_ihaleler     Ihale:Genel  Tahta:X:Ihale                                          > genel ve tahtaya ait ihaleler
 * SINTERSTORE  tahta_401_pasif_ihaleler   Ihale:Genel:Silinen + Tahta:X:Ihale:Silinen + Tahta:X:Ihale:Ezilen  > silinen ve yeniden düzenlenen ihaleler
 * SDIFFSTORE   tahta_401_aktif_ihaleler   tahta_401_tum_ihaleler - tahta_401_pasif_ihaleler                   > aktif ihalelerden pasif ihaleleri çıkartıp
 * ZINTERSTORE  tahta_401_aktif_ihaleler   Ihale:EklenmeTarihi                                                 > aktif ihaleleri tarihlerine göre ZS içine koyuyoruz
 *
 * Tahtanın görebileceği tüm iptal edilmiş ihaleler İPTAL TARİHİNE göre sıralı:
 * SINTERSTORE  tahta_401_tum_ihaleler     Ihale:Genel  Tahta:X:Ihale                                          > genel ve tahtaya ait ihaleler
 * SINTERSTORE  tahta_401_pasif_ihaleler   Ihale:Genel:Silinen + Tahta:X:Ihale:Gizlenen + Tahta:X:Ihale:Ezilen > silinen ve yeniden düzenlenen ihaleler
 * SDIFFSTORE   tahta_401_aktif_ihaleler   tahta_401_tum_ihaleler - tahta_401_pasif_ihaleler                   > silinen ve yeniden düzenlenen ihaleler
 * ZINTERSTORE  tahta_401_aktif_ihaleler   Ihale:IptalTarihi
 * </pre>
 * @returns {DBIhale}
 * @constructor
 */
function DB_Ihale() {

    var result = {};

    // region TAHTALAR ARASI İHALE PAYLAŞ
    /**
     * Tahtalar arasında özel ihalelerin paylaşılması sağlanır.
     * @param {{From:integer, To:integer[], Ids: integer[]}} _paylas
     * @returns {*}
     */
    var f_paylas = function (_paylas) {

        /**
         *
         * @param {integer} _from
         * @param {integer|integer[]} _to
         * @param {integer[]} _ids
         * @returns {*}
         */
        var f_ihale_paylas = function (_from, _to, _ids) {
            //ihaleler paylaşılırken tüm ihale ve ihaleye ait  kalemler paylaşılacaktır
            return result.dbQ.Q.all([
                result.dbQ.del(result.kp.temp.ssetTahtaIhale(_to)),
                result.dbQ.sadd(result.kp.tahta.ssetOzelIhaleleri(_to, true), _ids)
            ]).then(function () {

                var arr = _ids.mapXU(function (_ihale_id) {
                    return result.dbQ.smembers(result.kp.ihale.ssetKalemleri(_ihale_id))
                        .then(function (_arrKalem_Id) {
                            l.info("_arrKalem_Id: " + _arrKalem_Id);

                            // Eğer ihalenin kalemi yoksa, dön
                            if (_arrKalem_Id.length == 0) {
                                return 1;
                            }

                            //kalemleri varsa tahta ile ilişkilendir
                            return result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(_to, _ihale_id, true), _arrKalem_Id);
                        });
                });
                return result.dbQ.Q.all(arr);
            });
        };

        if (Array.isArray(_paylas.To) && _paylas.To.length > 0) {
            return _paylas.To.map(function (_tahta_id) {
                return f_ihale_paylas(_paylas.From, _tahta_id, _paylas.Ids);
            }).allX();

        } else {
            return f_ihale_paylas(_paylas.From, _paylas.To, _paylas.Ids);
        }
    };


    // endregion

    var f_db_tahta_ihale_gruplama = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        var kurum = require('./db_kurum');

        return result.dbQ.Q.all([
            f_tarihine_gore_grupla(_tahta_id, _tarih1, _tarih2),
            kurum.f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2),
            f_indexli_tarihine_gore_grupla(_tahta_id, _tarih1, _tarih2)
        ])
    };

    /**
     * İndexlenmiş (tahtanın anahtarına uygun) ihaleleri tarih aralığında göre indexlenmiş haliyle buluyoruz
     * @param _tahta_id
     * @param _tarih1
     * @param _tarih2
     * @returns {*}
     */
    var f_indexli_tarihine_gore_grupla = function (_tahta_id, _tarih1, _tarih2) {
        var db_tahta = require("./db_tahta");
        return db_tahta.f_db_tahta_ihale_indeksli_idler_tarihe_gore_sirali(_tahta_id)
            .then(function () {
                return (_tarih1 && _tarih2
                    ? result.dbQ.zrangebyscore(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id), _tarih1, _tarih2)
                    : result.dbQ.zrangebyscore(result.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id), "-inf", "+inf"))
                    .then(function (_ihale_idler) {
                        if (Array.isArray(_ihale_idler) && _ihale_idler.length > 0) {
                            /** @type {OptionsIhale} */
                            var opts = {};
                            opts.bArrKalemleri = false;
                            opts.bYapanKurum = true;
                            opts.bTakip = true;
                            /** @type {OptionsKalem} */
                            //opts.optKalem = {};
                            /*    opts.optKalem.bArrTeklifleri = false;
                             opts.optKalem.bOnayDurumu = false;
                             opts.optKalem.bTakiptemi = false;*/

                            return f_id(_ihale_idler, _tahta_id, opts)
                                .then(function (_ihaleler) {
                                    return _.sortBy(_ihaleler.groupX("IhaleTarihi", "Id"), "Key");
                                });
                        } else {
                            return [];
                        }
                    });
            });
    };

    /**
     * Tahtanın görebileceği ihaleleri tarihlerine göre gruplaması sağlanır
     * Tarih aralığı verilmezse tüm ihaler verilirse tarih aralığındaki ihaleler tarih ve toplamlarına göre array olarak döner
     * @param {integer} _tahta_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_tarihine_gore_grupla = function (_tahta_id, _tarih1, _tarih2) {
        return f_tumu_tarih_araligindakiler(_tahta_id, _tarih1, _tarih2)
            .then(function (_ihaleler) {
                if (Array.isArray(_ihaleler) && _ihaleler.length > 0) {
                    return _.sortBy(_ihaleler.groupX("IhaleTarihi", "Id"), "Key");
                } else {
                    return [];
                }
            });
    };

    /**
     * Tahtanın görebileceği ihaleleri tarihlerine göre listeler
     * Tarih aralığı verilmezse tüm ihaler verilirse tarih aralığındaki ihaleler array olarak döner
     * @param {integer} _tahta_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_tumu_tarih_araligindakiler = function (_tahta_id, _tarih1, _tarih2) {
        console.log("f_tumu_tarih_araligindakiler")
        return f_idler_aktif_tarih_araligindakiler(_tahta_id, _tarih1, _tarih2)
            .then(function (_ihale_idler) {
                if (Array.isArray(_ihale_idler) && _ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opts = {};
                    opts.bArrKalemleri = true;
                    opts.bYapanKurum = true;
                    opts.bTakip = true;
                    opts.optKalem = {};
                    opts.optKalem.bArrTeklifleri = false;
                    opts.optKalem.bOnayDurumu = true;
                    opts.optKalem.bTakiptemi = true;

                    return f_id(_ihale_idler, _tahta_id, opts);
                } else {
                    return [];
                }
            });

    };

    /**
     * Tahtanın görebileceği ihale idlerini tarihlerine göre listeler
     * Tarih aralığı verilmezse tüm ihale idler verilirse tarih aralığındaki ihale idler array olarak döner
     * @param {integer} _tahta_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_idler_aktif_tarih_araligindakiler = function (_tahta_id, _tarih1, _tarih2) {
        console.log("f_idler_aktif_tarih_araligindakiler")
        return f_db_tahta_ihale_idler_aktif(_tahta_id)
            .then(function (_ihale_idler) {
                var tarih1 = _tarih1 ? _tarih1 : "-inf",
                    tarih2 = _tarih2 ? _tarih2 : "+inf";

                return result.dbQ.zunionstore(result.kp.temp.zsetTahtaIhaleTarihineGore(_tahta_id), 2, result.kp.ihale.zsetYapilmaTarihi, result.kp.temp.ssetTahtaIhale(_tahta_id))
                    .then(function () {
                        return result.dbQ.zrangebyscore(result.kp.temp.zsetTahtaIhaleTarihineGore(_tahta_id), tarih1, tarih2);
                    })
                    .then(function (_ihale_idler) {
                        if (Array.isArray(_ihale_idler) && _ihale_idler.length > 0) {
                            return _ihale_idler;
                        } else {
                            return [];
                        }
                    });
            });
    };


    // region İHALE TEKLİFLERİ

    var f_teklif_idleri = function (_tahta_id, _ihale_id, _sayfalama) {
        var defer = result.dbQ.Q.defer();

        var sonucAnahtari = result.kp.temp.ssetTahtaIhaleTeklifleri(_tahta_id, _ihale_id);

        result.dbQ.exists(sonucAnahtari)
            .then(function (_iExist) {
                return _iExist
                    //temp anahtarı var yeniden çekmeye gerek yok, teklif bilgilerini dön
                    ? 1
                    //temp anahtarı yok oluştur ve teklif bilgilerini dön
                    : result.dbQ.sinterstore(sonucAnahtari, result.kp.ihale.ssetTeklifleri(_ihale_id), result.kp.tahta.ssetTeklifleri(_tahta_id, true));
            })
            .then(function () {
                var baslangic = 0,
                    bitis = 10;

                if (_sayfalama) {
                    baslangic = _sayfalama.Sayfa * _sayfalama.SatirSayisi,
                        bitis = _sayfalama.SatirSayisi;
                }

                (_sayfalama
                    ? result.dbQ.sort(sonucAnahtari, "LIMIT", baslangic, bitis)
                    : result.dbQ.smembers(sonucAnahtari))
                    .then(function (_dbReply) {
                        defer.resolve(_dbReply);
                    })
                    .fail(function (_err) {
                        l.e("İhale teklifleri çekilemedi. Hata: " + _err);
                        defer.reject(_err);
                    });
            });

        return defer.promise;
    };

    /**
     * ihaleye ait teklifleri bulur
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     * @param {URLQuery} _arama
     * @returns {Promise}
     */
    var f_teklif_tumu = function (_tahta_id, _ihale_id, _arama) {

        return f_teklif_idleri(_tahta_id, _ihale_id, _arama.Sayfalama)
            .then(
                /**
                 *
                 * @param {string[]} _teklif_idler
                 * @returns {*}
                 */
                function (_teklif_idler) {

                    var sonucAnahtari = result.kp.temp.ssetTahtaIhaleTeklifleri(_tahta_id, _ihale_id),
                        /** @type {LazyLoadingResponse} */
                        sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);

                    if (_teklif_idler && _teklif_idler.length > 0) {
                        return result.dbQ.scard(sonucAnahtari)
                            .then(function (_toplamKayitSayisi) {
                                sonuc.ToplamKayitSayisi = parseInt(_toplamKayitSayisi);

                                var db_teklif = require('./db_teklif');
                                var opts = db_teklif.OptionsTeklif({
                                    bArrUrunler: true,
                                    bKalemBilgisi: true,
                                    bIhaleBilgisi: true,
                                    bKurumBilgisi: true,
                                    optUrun: {}
                                });

                                return db_teklif.f_db_teklif_id(_teklif_idler, _tahta_id, opts)
                                    .then(function (_dbTeklifler) {
                                        //göndermeden önce sıralıyoruz
                                        var teklifler = _.sortBy(_dbTeklifler, ['Kalem_Id', 'TeklifDurumu_Id']);
                                        sonuc.Data = teklifler;
                                        return sonuc;
                                    });
                            });
                    } else {
                        //teklif yok
                        sonuc.ToplamKayitSayisi = 0;
                        sonuc.Data = [];
                        return sonuc;
                    }
                });
    };


    // endregion

    // region İHALEYİ YAPAN KURUM
    /**
     * İhale/leri yapan kurum bilgisini döner
     * @param {integer|integer[]|string|string[]} ihale_id
     * @returns {*}
     */
    var f_yapan_kurum = function (ihale_id) {
        //birden fazla ihale kurumunu bağlayabiliriz(hmget)

        return (Array.isArray(ihale_id)
            ? result.dbQ.hmget(result.kp.ihale.hsetYapanKurumlari, ihale_id)
            : result.dbQ.hget(result.kp.ihale.hsetYapanKurumlari, ihale_id))
            .then(function (_kurum_id) {
                if (!_kurum_id) {
                    return null;
                }

                var db_kurum = require("./db_kurum");
                return db_kurum.f_db_kurum_id(_kurum_id);
            });
    };

    /**
     * İhaleyi yapan kurum bilgisi değiştirildiğinde genel ihaleyi eziyoruz??
     * @param ihale_id
     * @param kurum_id
     * @returns {*}
     */
    var f_yapan_kurum_guncelle = function (ihale_id, kurum_id) {
        return result.dbQ.hset(result.kp.ihale.hsetYapanKurumlari, ihale_id, kurum_id)
            .then(function () {
                return f_yapan_kurum(ihale_id);
            });
    };
    // endregion

    // region İHALEYE KATILAN KURUMLARI
    var f_kurum_tumu = function (tahta_id, ihale_id) {
        return result.dbQ.sinter(result.kp.tahta.ssetTeklifleri(tahta_id, true), result.kp.ihale.ssetTeklifleri(ihale_id))
            .then(function (_teklif_idler) {
                if (_teklif_idler && _teklif_idler.length > 0) {
                    return result.dbQ.hmget(result.kp.teklif.hsetKurumlari, _teklif_idler)
                        .then(function (_kurum_idler) {
                            if (_kurum_idler && _kurum_idler.length > 0) {
                                var db_kurum = require("./db_kurum");
                                return db_kurum.f_db_kurum_id(_kurum_idler);
                            } else {
                                return [];
                            }
                        });
                } else {
                    return null;
                }
            })
            .fail(function () {
                l.e("ihale kurumları çekilemedi");
            });
    };

    var f_guncellendi_teklif_kontrol = function (_tahta_id, _eskiIhale_id, _yeniIhale_id) {
        return result.dbQ.sismember(result.kp.tahta.ssetTeklifVerilenIhaleler(_tahta_id), _eskiIhale_id)
            .then(function (_iIhaleyeTeklifVerilmis) {

                if (_iIhaleyeTeklifVerilmis) {
                    l.info("ihaleye bağlı teklif var");
                    l.info("değiştirmeliyiz");

                    //tahtaya teklif veirlmiş ihaleler setini düzenle
                    return result.dbQ.Q.all([
                        result.dbQ.srem(result.kp.tahta.ssetTeklifVerilenIhaleler(_tahta_id), _eskiIhale_id),
                        result.dbQ.sadd(result.kp.tahta.ssetTeklifVerilenIhaleler(_tahta_id), _yeniIhale_id)

                    ]).then(function () {
                        //teklif verilen ihalenin ürünleri tablosunu yeni ihale id ile değiştiriyoruz
                        return result.dbQ.smembers(result.kp.ihale.ssetUrunleri(_tahta_id, _eskiIhale_id))
                            .then(function (_iUrun_idler) {
                                if (_iUrun_idler && _iUrun_idler.length > 0) {
                                    return result.dbQ.rename(result.kp.ihale.ssetUrunleri(_tahta_id, _eskiIhale_id),
                                        result.kp.ihale.ssetUrunleri(_tahta_id, _yeniIhale_id))
                                }
                                return _yeniIhale_id;
                            });
                    }).then(function () {
                        //genel ihaleye verilen teklifler ile tahtada verilen tekliflerin kesişimini bulup
                        //gelen kayıtları yeni ihale_id ile ilişkilendiriyoruz
                        return result.dbQ.sinter(result.kp.ihale.ssetTeklifleri(_eskiIhale_id), result.kp.tahta.ssetTeklifleri(_tahta_id, true))
                            .then(function (_iTeklif_idler) {
                                if (_iTeklif_idler && _iTeklif_idler.length > 0) {
                                    return result.dbQ.Q.all([
                                        result.dbQ.sadd(result.kp.ihale.ssetTeklifleri(_yeniIhale_id), _iTeklif_idler),
                                        result.dbQ.srem(result.kp.ihale.ssetTeklifleri(_eskiIhale_id), _iTeklif_idler)
                                    ]);
                                }
                                return _yeniIhale_id;
                            });
                    });

                } else {
                    l.info("ihaleye bağlı teklif yok");
                    return _yeniIhale_id;
                }
            });
    };
    // endregion

    // region İHALE KALEMLERİNİ ÇEK
    /**
     * Ihaleye bağlı kalemleri getir. Genel olarak ihalenin kalemleri ve ihalenin tahta üstünde ezilmiş kalemlerini
     * birleştirerek getirir.
     * @example
     * ihale:101:kalemler + tahta:401:ihale:101:kalemleri
     *
     * @param {integer} ihale_id - ihale_id'ye ait satırları getir
     * @param {integer} tahta_id - Tahta içinde ihale_id ye ait ezilmiş satırları da getirmek için
     * @param {OptionsKalem=} opts
     * @returns {Promise}
     */
    var f_kalem_tumu = function (ihale_id, tahta_id, opts) {
        return f_aktif_kalem_idler(ihale_id, tahta_id)
            .then(function (_kalem_idler) {

                if (_kalem_idler.length == 0) {
                    return [];
                }

                var db_kalem = require('./db_kalem');

                return db_kalem.f_db_kalem_id(_kalem_idler, tahta_id, opts);
            });
    };

    /**
     * İhale ile ilişkili kalem id lerini döner (temp setine ekler> TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + KALEM)
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_aktif_kalem_idler = function (_ihale_id, _tahta_id) {
        var defer = result.dbQ.Q.defer();

        result.dbQ.Q.all([
                result.dbQ.sunion(result.kp.ihale.ssetKalemleri(_ihale_id), result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true)),
                result.dbQ.sunion(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, false), result.kp.tahta.ssetEzilenKalemleri(_tahta_id), result.kp.tahta.ssetGizlenenKalemleri(_tahta_id))
            ])
            .then(function (_arrDbReplies) {
                var aktifler = _arrDbReplies[0],
                    pasifler = _arrDbReplies[1];
                defer.resolve(aktifler.differenceXU(pasifler));

            })
            .fail(function (_err) {
                l.e("Kalemler çekilirken hata oldu: " + _err);
                defer.reject(_err)
            });
        return defer.promise;
    };


    /**
     * İhale ile ilişkili kalemleri sayfalama yapısına göre getirir
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     * @param {object} _arama
     * @returns {*}
     */
    var f_kalemleri_by_page = function (_ihale_id, _tahta_id, _arama) {
        l.info("f_kalemleri_by_page");

        //anahtar yok
        //ihalenin aktif kalem idlerini çek
        //sonuçta result.kp.temp.ssetTahtaIhaleKalemleri(_tahta_id, _ihale_id) anahtarı oluşmuş olacaktır
        //böylece sayfalama işlemine geçebiliriz

        var defer = result.dbQ.Q.defer(),
            defer_kriter = result.dbQ.Q.defer();

        var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);

        switch (_arama.Kriter) {
            case schema.SABIT.URL_QUERY.KRITER.TAKIPTEKILER:
            {
                defer_kriter = f_tahtanin_takipteki_kalem_idleri(_ihale_id, _tahta_id);
                break;
            }
            case schema.SABIT.URL_QUERY.KRITER.GIZLENENLER:
            {
                defer_kriter = f_tahtanin_gizlenen_kalem_idleri(_ihale_id, _tahta_id);
                break;
            }
            case schema.SABIT.URL_QUERY.KRITER.AKTIFLER:
            default:
                defer_kriter = f_aktif_kalem_idler(_ihale_id, _tahta_id);
                break;
        }

        defer_kriter.then(function (_cekilen_idler) {
                if (!_cekilen_idler || _cekilen_idler.length == 0) {

                    sonuc.ToplamKayitSayisi = 0;
                    sonuc.Data = [];
                    defer.resolve(sonuc);
                } else {

                    sonuc.ToplamKayitSayisi = _cekilen_idler.length;

                    //temp e ekle ve sonra da sil
                    var temp_key = "temp_tahta_ihale_kalem_" + _ihale_id;
                    result.dbQ.sadd(temp_key, _cekilen_idler)
                        .then(function () {

                            var baslangic = 0,
                                bitis = 10;

                            if (_arama.Sayfalama) {
                                baslangic = _arama.Sayfalama.Sayfa * _arama.Sayfalama.SatirSayisi;
                                bitis = _arama.Sayfalama.SatirSayisi;
                            }

                            l.info("Baslangic: " + baslangic);
                            l.info("Bitis: " + bitis);

                            result.dbQ.sort(temp_key, "LIMIT", baslangic, bitis)
                                .then(/**
                                 *
                                 * @param {string[]} _kalem_idler
                                 */
                                function (_kalem_idler) {

                                    //temp ile işimiz bitti sil
                                    result.dbQ.del(temp_key);

                                    if (_kalem_idler && _kalem_idler.length > 0) {
                                        var db_kalem = require('./db_kalem');

                                        /** @type {OptionsKalem} */
                                        var opt = {};
                                        opt.bArrTeklifleri = false;
                                        opt.bOnayDurumu = true;
                                        opt.bTakiptemi = true;

                                        db_kalem.f_db_kalem_id(_kalem_idler, _tahta_id, opt)
                                            .then(function (_dbKalemler) {
                                                sonuc.Data = [].concat(_dbKalemler);
                                                defer.resolve(sonuc);
                                            });
                                    } else {
                                        sonuc.Data = [];
                                        defer.resolve(sonuc);
                                    }
                                });
                        });
                }

            })
            .fail(function (_err) {
                defer.reject("İhaleye bağlı kalemler sayfalı çekilemedi!", "HATA MESAJI:" + _err);
            });

        return defer.promise;
    };

    // endregion

    var f_sbihale_id = function (sb_ihale_id) {
        return result.dbQ.zscan([result.kp.ihale.zsetSaglikbank, '0', 'match', sb_ihale_id])
            .then(function (_res) {
                var sonuc = JSON.parse(JSON.stringify(_res));
                if (sonuc[1].length > 0) {
                    return sonuc[1][1];
                } else {
                    return 0;
                }
            }).then(function (_ihale_id) {
                if (_ihale_id > 0) {
                    /** @type {OptionsIhale} */
                    var opts = {};
                    opts.bArrKalemleri = false;
                    opts.bYapanKurum = true;
                    opts.bTakip = false;
                    return f_id(_ihale_id, 0, opts);
                }
            })
            .then(function (_sIhale) {
                if (_sIhale) {
                    return JSON.parse(_sIhale);
                } else {
                    return {};
                }
            });
    };


    // region İHALE İD
    /**
     * Tahtanın id den bilgilerini getirir
     * @param {integer|integer[]|string|string[]} _ihale_id
     * @param {integer} _tahta_id
     * @param {OptionsIhale=} _opts
     * @returns {*}
     */
    var f_id = function (_ihale_id, _tahta_id, _opts) {

        var opts = result.OptionsIhale(_opts);

        return (Array.isArray(_ihale_id)
            ? result.dbQ.hmget_json_parse(result.kp.ihale.tablo, _ihale_id)
            : result.dbQ.hget_json_parse(result.kp.ihale.tablo, _ihale_id))
            .then(function (_dbIhale) {
                if (_dbIhale == null) {
                    return null;
                } else {

                    var f_ihale_detaylarini_bagla = function (_ihale, _optsIhale) {

                        //ihale yoksa null dön
                        if (!_ihale) {
                            return null;
                        }

                        var olusan_ihale = schema.f_create_default_object(schema.SCHEMA.IHALE);
                        olusan_ihale = _.extend(olusan_ihale, _ihale);

                        return result.dbQ.Q.all([
                                _optsIhale.bYapanKurum ? f_yapan_kurum(_ihale.Id) : {Id: 0},
                                _optsIhale.bTakip ? result.dbQ.sismember(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale.Id) : 0,
                                opts.bArrKalemleri ? f_kalem_tumu(_ihale.Id, _tahta_id, _optsIhale.optKalem) : []])
                            .then(function (_arrResults) {
                                olusan_ihale.Kurum = _arrResults[0];
                                olusan_ihale.Takip = _arrResults[1];
                                olusan_ihale.Kalemler = _arrResults[2];
                                return olusan_ihale;
                            });

                        /* arrPromises.push(_optsIhale.bYapanKurum
                         ? f_yapan_kurum(_ihale.Id)
                         : null);

                         arrPromises.push(_optsIhale.bTakip
                         ? result.dbQ.sismember(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale.Id)
                         : 0);

                         arrPromises.push(opts.bArrKalemleri
                         ? f_kalem_tumu(_ihale.Id, _tahta_id, _optsIhale.optKalem)
                         : []);

                         return arrPromises.allX()
                         .then(function (_arrResults) {
                         console.log("_arrResults")
                         console.log(JSON.stringify(_arrResults))

                         olusan_ihale.Kurum = _arrResults[0];
                         //olusan_ihale.Kurum_Id = olusan_ihale.Kurum.Id;
                         olusan_ihale.Takip = _arrResults[1];
                         olusan_ihale.Kalemler = _arrResults[2];
                         return olusan_ihale;
                         });*/
                    };

                    // Ihale dizimizin kurumlarını çekerek herbirine bağlayalım
                    if (Array.isArray(_dbIhale)) {
                        opts.bYapanKurum = false;

                        return _dbIhale
                            .mapX(null, f_ihale_detaylarini_bagla, opts)
                            .allX()
                            .then(function (dbIhaleBilgilerle) {
                                return f_yapan_kurum(_ihale_id)
                                    .then(function (dbYapanKurumlar) {

                                        dbIhaleBilgilerle.forEach(function (_elm, _idx, _arr) {
                                            if (_elm) {
                                                _arr[_idx].Kurum = dbYapanKurumlar[_idx];
                                            }
                                        });

                                        return dbIhaleBilgilerle;
                                    });
                            });

                    } else {
                        return f_ihale_detaylarini_bagla(_dbIhale, opts)
                    }
                }
            });
    };

    // endregion

    var f_tumu = function (_tahta_id) {
        /*ihaleleri çekerken>>
         genel ihaleler ile özel ihaleleri birleştirilip
         ezilen ihaleleri birleşimden çıkartarak döndürüyoruz*/

        return f_db_tahta_ihale_idler_aktif(_tahta_id)
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
                    return f_id(_ihale_idler, _tahta_id, opts);
                } else {
                    return [];
                }
            });
    };

    /**
     * Tahtaya ait ihaleleri varsa idleri döner.
     * Tahtanın görebileceği tüm ihale idlerini döner(silinmeyen,gizlenmeyen,ezilmeyen yani aktifler)
     * (özel ∪ genel) - (silinen ∪ gizlenen ∪ ezilen)
     * smembers tahta:401:ihale
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_tahta_ihale_idler_aktif = function (_tahta_id) {
        var defer = result.dbQ.Q.defer();

        result.dbQ.exists(result.kp.temp.ssetTahtaIhale(_tahta_id))
            .then(function (_dbReply) {
                if (_dbReply == 1) {
                    result.dbQ.smembers(result.kp.temp.ssetTahtaIhale(_tahta_id))
                        .then(function (_ihale_idler) {
                            defer.resolve(_ihale_idler);
                        });

                } else {
                    l.info(result.kp.temp.ssetTahtaIhale(_tahta_id) + " anahtarı yok. Oluşturacağız...");

                    result.rc.multi()
                        .sunionstore(result.kp.temp.ssetTahtaIhaleTumu(_tahta_id), result.kp.tahta.ssetOzelIhaleleri(_tahta_id, true), result.kp.ihale.ssetGenel)
                        .sunionstore(result.kp.temp.ssetTahtaIhaleIstenmeyen(_tahta_id), result.kp.tahta.ssetOzelIhaleleri(_tahta_id, false), result.kp.tahta.ssetEzilenIhaleleri(_tahta_id), result.kp.tahta.ssetGizlenenIhaleleri(_tahta_id))
                        .sdiffstore(result.kp.temp.ssetTahtaIhale(_tahta_id), result.kp.temp.ssetTahtaIhaleTumu(_tahta_id), result.kp.temp.ssetTahtaIhaleIstenmeyen(_tahta_id))
                        .exec(function (_err, _replies) {
                            result.dbQ.smembers(result.kp.temp.ssetTahtaIhale(_tahta_id))
                                .then(function (_ihale_idler) {
                                    defer.resolve(_ihale_idler);
                                });
                        });
                }
            });

        return defer.promise;
    };

    /**
     * Tüm tahtalardan görülebilecek genel ihaleler listesi
     * @param {OptionsIhale} _opts
     * @returns {*}
     */
    var f_tumu_genel = function (_opts) {

        /*sadece genel ihaleleri getiriyoruz*/
        return result.dbQ.smembers(result.kp.ihale.ssetGenel)
            .then(function (_ihaleIdleri) {
                if (_ihaleIdleri && _ihaleIdleri.length > 0) {
                    return f_id(_ihaleIdleri, 0, _opts);
                } else {
                    return [];
                }
            })
            .fail(function (_err) {
                l.e("ihaleler çekilemedi");
                throw new exception.Istisna("HATA FIRLATILDI", "Genel ihaleler çekilirken hata alındı:" + _err)
            });
    };


    var f_yapilmaTarihi_Araliginda = function (tarih1_gettime, tarih2_gettime, _tahta_id) {

        var defer = result.dbQ.Q.defer();

        result.dbQ.zrangebyscore([result.kp.ihale.zsetYapilmaTarihi, tarih1_gettime, tarih2_gettime])
            .then(function (_lstIhaleIdler) {
                if (_lstIhaleIdler.length > 0) {

                    f_db_tahta_ihale_idler_aktif(_tahta_id)
                        .then(function (_aktif_ihale_idler) {
                            if (_aktif_ihale_idler && _aktif_ihale_idler.length > 0) {

                                var kesisim = _.intersection(_aktif_ihale_idler, _lstIhaleIdler);

                                /** @type {OptionsIhale} */
                                var opts = {};
                                opts.bArrKalemleri = true;
                                opts.bYapanKurum = true;
                                opts.bTakip = true;
                                opts.optKalem.bArrTeklifleri = false;
                                opts.optKalem.bOnayDurumu = true;
                                opts.optKalem.bTakiptemi = true;
                                f_id(kesisim, _tahta_id, opts)
                                    .then(function (_ihaleler) {
                                        defer.resolve(_ihaleler);
                                    });

                            } else {
                                defer.resolve([]);
                            }
                        });

                } else {
                    defer.resolve([]);
                }
            })
            .fail(function (_err) {
                l.e("yapılma tarihine göre ihaleleri çekerken hata oluştu." + _err)
                defer.reject("yapılma tarihine göre ihaleleri çekerken hata oluştu." + _err);
            });

        return defer.promise;
    };

    var f_sistemeEklenmeTarih_Araliginda = function (tarih1_gettime, tarih2_gettime, _tahta_id) {
        return result.dbQ.zrangebyscore([result.kp.ihale.zsetSistemeEklenmeTarihi, tarih1_gettime, tarih2_gettime])
            .then(function (_lstIhaleIdler) {
                if (_lstIhaleIdler.length > 0) {
                    return f_db_tahta_ihale_idler_aktif(_tahta_id)
                        .then(function (_aktif_ihale_idler) {
                            if (_aktif_ihale_idler && _aktif_ihale_idler.length > 0) {
                                var kesisim = _.intersection(_aktif_ihale_idler, _lstIhaleIdler);
                                /** @type {OptionsIhale} */
                                var opts = {};
                                opts.bArrKalemleri = true;
                                opts.bYapanKurum = true;
                                opts.bTakip = true;
                                opts.optKalem.bArrTeklifleri = false;
                                opts.optKalem.bOnayDurumu = true;
                                opts.optKalem.bTakiptemi = true;
                                return f_id(kesisim, _tahta_id, opts);
                            } else {
                                return [];
                            }
                        });

                } else {
                    return [];
                }
            })
            .fail(function () {
                l.e("sisteme eklenme tarihine göre ihaleleri çekerken hata oluştu.");
                throw ("sisteme eklenme tarihine göre ihaleleri çekerken hata oluştu.");
            });
    };

    /**
     * Arama kriterine göre (Aktif ihalaler, takip edilen ihaleler ya da gizlenen ihaleler) ihale_id lerini döneceğiz
     * TODO: _arama'nın tipini doğru tayin etmeli
     * @param {*} _arama
     * @param {number} _tahta_id
     * @returns {Promise}
     */
    function _f_arama_kriterinden_ihale_idleri(_arama, _tahta_id) {
        // Validasyon
        if (!_arama) throw exception.Istisna('Arama kriteri boş bırakılamaz!');
        if (!_tahta_id) throw exception.Istisna('Tahta ID falsy olamaz!');

        var defer_kriter = result.dbQ.Q.defer();

        switch (_arama.Kriter) {

            case schema.SABIT.URL_QUERY.KRITER.TAKIPTEKILER :
                defer_kriter = f_tahtanin_takipteki_ihale_idleri(_tahta_id);
                break;
            case schema.SABIT.URL_QUERY.KRITER.GIZLENENLER :
                defer_kriter = f_tahtanin_gizlenen_ihale_idleri(_tahta_id);
                break;
            case schema.SABIT.URL_QUERY.KRITER.AKTIFLER :
            default:
                defer_kriter = f_db_tahta_ihale_idler_aktif(_tahta_id);
                break;
        }

        return defer_kriter.promise;
    }

    /**
     * Tahtanın ihalelerini sıralayarak ve sayfalayarak döner.
     * Tahtanın ihalelerini çek,
     * Sıralama türüne göre ihalelerin Sorted Set indeksiyle kesiştir
     * Sıralama yönüne göre(asc/desc)
     * Sayfalama özelliklerine göre
     * @param _tahta_id
     * @param _arama
     * @param _opts
     * @returns {Promise|LazyLoadingResponse}
     */
    var f_db_tahta_ihale_idler_sort_page = function (_tahta_id, _arama, _opts) {

        if (!_arama.Siralama || (Array.isArray(_arama.Siralama) && _arama.Siralama.length == 0 )) {
            throw new exception.Istisna("Sıralama fonksiyonuna sıralama bilgisi olmadan gönderiyorsun. Kendine gel dostum!");
        }

        // Döneceğimiz verinin içinde toplam kayıt sayısı olacakki LAZY LOADING yapabilelim
        var baslangic = 0,
            bitis = 10,
            multi = result.rc.multi(),
            sonucAnahtari = result.kp.temp.zsetTahtaIhaleSiraliIhaleTarihineGore(_tahta_id);

        if (_arama.Sayfalama) {
            baslangic = _arama.Sayfalama.Sayfa * _arama.Sayfalama.SatirSayisi;
            bitis = _arama.Sayfalama.SatirSayisi;
        }

        l.info("Baslangic: " + baslangic);
        l.info("Bitis: " + bitis);

        var defer_kriter = result.dbQ.Q.defer(),
            defer = result.dbQ.Q.defer();

        switch (_arama.Kriter) {

            case schema.SABIT.URL_QUERY.KRITER.TAKIPTEKILER :
                defer_kriter = f_tahtanin_takipteki_ihale_idleri(_tahta_id);
                break;
            case schema.SABIT.URL_QUERY.KRITER.GIZLENENLER :
                defer_kriter = f_tahtanin_gizlenen_ihale_idleri(_tahta_id);
                break;
            case schema.SABIT.URL_QUERY.KRITER.AKTIFLER :
            default:
                defer_kriter = f_db_tahta_ihale_idler_aktif(_tahta_id);
                break;
        }

        defer_kriter.then(function (_donen_ihale_idleri) {

            /** @type {LazyLoadingResponse} */
            var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);

            if (_donen_ihale_idleri && _donen_ihale_idleri.length == 0) {
                sonuc.Data = [];
                sonuc.ToplamKayitSayisi = 0;
                defer.resolve(sonuc);
            }
            else {
                //geçici temp e ekliyoruz sonra da sileceğiz
                //neden?
                //çünkü artık sadece aktif ihale idlerini değil
                //takipteki aktif gizlenen..vb de de çekebiliriz.
                var temp_key = "temp_tahta_ihale_" + _tahta_id;
                result.dbQ.sadd(temp_key, _donen_ihale_idleri)
                    .then(function (_iToplamKayit) {
                        // region sıralama
                        _arama.Siralama.forEach(function (_siralama) {

                            switch (_siralama.Alan) {

                                case schema.SABIT.URL_QUERY.SORT.ihale.yapilmaTarihi:
                                    multi.zinterstore(sonucAnahtari, 2, temp_key, result.kp.ihale.zsetYapilmaTarihi);

                                    _siralama.Asc
                                        ? multi.zrangebyscore(sonucAnahtari, _arama.Tarih.tarih1, _arama.Tarih.tarih2, "LIMIT", baslangic, bitis)
                                        : multi.zrevrangebyscore(sonucAnahtari, _arama.Tarih.tarih2, _arama.Tarih.tarih1, "LIMIT", baslangic, bitis);

                                    break;

                                case schema.SABIT.URL_QUERY.SORT.ihale.ihaleninSistemeEklenmeTarihi:

                                    multi.zinterstore(sonucAnahtari, 2, temp_key, result.kp.ihale.zsetSistemeEklenmeTarihi);

                                    _siralama.Asc
                                        ? multi.zrangebyscore(sonucAnahtari, _arama.Tarih.tarih1, _arama.Tarih.tarih2, "LIMIT", baslangic, bitis)
                                        : multi.zrevrangebyscore(sonucAnahtari, _arama.Tarih.tarih2, _arama.Tarih.tarih1, "LIMIT", baslangic, bitis);

                                    break;
                            }
                        });
                        // endregion

                        // region multi exec
                        multi.exec(function (_err, _replies) {

                            sonuc.ToplamKayitSayisi = _iToplamKayit;

                            //temp le işimiz bitti sil gitsin
                            result.dbQ.del(temp_key);

                            if (_replies[1] && _replies[1].length > 0) {
                                f_id(_replies[1], _tahta_id, _opts)
                                    .then(function (_ihaleler) {
                                        sonuc.Data = _ihaleler;
                                        defer.resolve(sonuc);
                                    });
                            } else {
                                sonuc.Data = [];
                                defer.resolve(sonuc);
                            }
                        });
                        // endregion
                    });
            }
        });
        return defer.promise;
    };

    // region İHALE (ekle-sil-güncelle)

    /**
     * Ihale kaydedilir ve db'de oluşan şekliyle geri döner
     * @param {IhaleES} es_ihale
     * @param {IhaleDB} db_ihale
     * @param {integer} kurum_id
     * @param {integer} tahta_id
     * @param {integer} _kul_id
     * @returns {Promise}
     */
    var f_ekle = function (es_ihale, db_ihale, kurum_id, tahta_id, _kul_id) {

        //SON EKLENEN İHALENİN İD SİNİ ÇEK VE EKLEME İŞLEMİNE BAŞLA
        return result.dbQ.incr(result.kp.ihale.idx)
            .then(function (_id) {
                db_ihale.Id = _id;
                es_ihale.Id = _id;

                return result.dbQ.Q.all([
                        result.dbQ.hset(result.kp.ihale.tablo, _id, JSON.stringify(db_ihale)),
                        result.dbQ.zadd(result.kp.ihale.zsetYapilmaTarihi, db_ihale.IhaleTarihi, db_ihale.Id)

                    ])
                    .then(function () {

                        if (tahta_id && tahta_id > 0) {
                            //tahta ile ilişkilendir
                            return result.dbQ.sadd(result.kp.tahta.ssetOzelIhaleleri(tahta_id, true), db_ihale.Id);
                        } else {
                            return result.dbQ.sadd(result.kp.ihale.ssetGenel, db_ihale.Id);
                        }

                    })
                    .then(function () {
                        //kurumun ihalelerine ekle
                        //ihalenin kurumunu ata
                        if (kurum_id > 0) {
                            return result.dbQ.Q.all([
                                result.dbQ.sadd(result.kp.kurum.ssetIhaleleri(kurum_id), db_ihale.Id),
                                result.dbQ.hset(result.kp.ihale.hsetYapanKurumlari, db_ihale.Id, kurum_id)
                            ]);
                        }
                        return db_ihale;
                    })
                    .then(function () {
                        //sisteme eklenme tarihini ekle
                        if (db_ihale.SistemeEklenmeTarihi) {
                            return result.dbQ.zadd(result.kp.ihale.zsetSistemeEklenmeTarihi, db_ihale.SistemeEklenmeTarihi, db_ihale.Id)
                        }
                        return db_ihale;
                    })
                    .then(function () {
                        //saglıkbank_id sini ekle
                        if (db_ihale.SBIhale_Id && db_ihale.SBIhale_Id > 0) {
                            return result.dbQ.zadd(result.kp.ihale.zsetSaglikbank, db_ihale.Id, db_ihale.SBIhale_Id)
                        }
                        return db_ihale;
                    })
                    .then(function () {
                        emitter.emit(schema.SABIT.OLAY.IHALE_EKLENDI, es_ihale, kurum_id, tahta_id, _kul_id);

                        //ihale bilgisini dön
                        /** @type {OptionsIhale} */
                        var opts = {};
                        opts.bArrKalemleri = true;
                        opts.bYapanKurum = true;
                        opts.bTakip = true;
                        return f_id(db_ihale.Id, tahta_id, opts);
                    });
            })
            .fail(function (_err) {
                throw new exception.Istisna("İhale Eklenemedi!", "İhale eklenirken Hata oluştu: " + _err);
            });
    };


    /**
     * Genel tabloya ihale ekleme.
     * @param _es_ihale
     * @param _db_ihale
     * @param _kullanici_id
     * @returns {*}
     */
    var f_ekle_genel = function (_es_ihale, _db_ihale, _kullanici_id) {

        /**
         * İhale bilgisini sisteme ekleyen fonk
         * @param _es_ihale
         * @param _db_ihale
         * @param _kul_id
         * @returns {*}
         */
        var f_ihaleEkle = function (_es_ihale, _db_ihale, _kul_id) {

            _kul_id = _kul_id || _kullanici_id;

            return result.dbQ.incr(result.kp.ihale.idx)
                .then(function (_id) {
                    _es_ihale.Id = _id;
                    _db_ihale.Id = _id;

                    return result.dbQ.Q.all([
                            result.dbQ.hset(result.kp.ihale.tablo, _db_ihale.Id, JSON.stringify(_db_ihale)),
                            result.dbQ.sadd(result.kp.ihale.ssetGenel, _db_ihale.Id),
                            result.dbQ.sadd(result.kp.ihale.ssetIhaleUsulAdlari, _db_ihale.IhaleUsul),
                            result.dbQ.sadd(result.kp.ihale.ssetGenel, _db_ihale.Id),
                            result.dbQ.hset(result.kp.ihale.hsetIhale_ihaleDunyasiId, _es_ihale.IhaleProviders.IhaleDunyasi.IhaleDunyasiId, _db_ihale.Id),
                            result.dbQ.zadd(result.kp.ihale.zsetYapilmaTarihi, _db_ihale.IhaleTarihi, _db_ihale.Id)
                        ])
                        .then(function () {
                            //şehir ekle
                            if (_db_ihale.IlAdi) {
                                var db_sehir = require("./db_sehir");
                                return db_sehir.f_db_sehir_ekle(/** @type {Sehir} */{Id: 0, Adi: _db_ihale.IlAdi});
                            } else {
                                return _id;
                            }
                        })
                        .then(function () {
                            //bölge ekle
                            if (_db_ihale.BolgeAdi) {
                                var db_bolge = require("./db_bolge");
                                return db_bolge.f_db_bolge_ekle(/** @type {Bolge} */{Id: 0, Adi: _db_ihale.BolgeAdi});
                            } else {
                                return _id;
                            }
                        })
                });
        };

        /**
         * Tüm tahtaları çekip,
         * her biri içinde dönüp
         * ürünün/kurumun/tahtanın/kullanıcının
         * anahtarlarına bağlı satır açıklama veya branş kodu varsa
         * ihale_id ve kalem_id yi indexliyoruz
         */
        var f_ihaleyiKurumlaIliskilendir = function (_es_ihale, _db_ihale, _kul_id) {
            _kul_id = _kul_id || _kullanici_id;
            l.i("İhale kurumla ilişkilenecek > ihaleId: " + _db_ihale.Id + " - kurumId: " + _db_ihale.Kurum_Id);
            // - kurumun ihalelerine ekle
            // - ihalenin kurumunu ata
            if (_db_ihale.Id) {
                return result.dbQ.Q.all([
                    result.dbQ.sadd(result.kp.kurum.ssetIhaleleri(_db_ihale.Kurum_Id), _db_ihale.Id),
                    result.dbQ.hset(result.kp.ihale.hsetYapanKurumlari, _db_ihale.Id, _db_ihale.Kurum_Id)
                ]).then(function () {
                    return _es_ihale;
                });
            } else {
                return _es_ihale;
            }
        };

        var f_kalemleriniEkle = function (_es_ihale, _db_ihale, _kul_id) {
            _kul_id = _kul_id || _kullanici_id;
            // Kalemleri ayıralım
            var ihaleKalemleri = _es_ihale.Kalemler.slice();
            var db_kalem = require('./db_kalem');
            return db_kalem.f_db_kalemleri_ekle(_db_ihale.Id, ihaleKalemleri, _kul_id)
                .then(function () {
                    emitter.emit(schema.SABIT.OLAY.IHALE_EKLENDI, _es_ihale, _es_ihale.Kurum_Id, 0, _kullanici_id);
                    return _es_ihale;
                });
        };

        return f_ihaleEkle(_es_ihale, _db_ihale, _kullanici_id)
            .then(function () {
                return f_ihaleyiKurumlaIliskilendir(_es_ihale, _db_ihale, _kullanici_id)
            })
            .then(function () {
                return f_kalemleriniEkle(_es_ihale, _db_ihale, _kullanici_id)
            })
            .then(function () {
                //ihale bilgisini dön
                /** @type {OptionsIhale} */
                var opts = {};
                opts.bArrKalemleri = true;
                opts.bYapanKurum = true;
                opts.bTakip = false;
                return f_id(_db_ihale.Id, 0, opts)
                    .then(function (_dbIhale) {
                        emitter.emit(schema.SABIT.OLAY.IHALE_EKLENDI, _dbIhale, _dbIhale.Kurum_Id, 0, _kullanici_id);
                        return _dbIhale;
                    });
            });
    };


    /**
     * Genele ihale ekliyoruz. Provider: IhaleDunyasi.net
     * @param ihale
     * @returns {Promise}
     */
    var f_ekle_ihaleDunyasindan = function (_es_ihale, _db_ihale, _kul_id) {

        //SON EKLENEN İHALENİN İD SİNİ ÇEK VE EKLEME İŞLEMİNE BAŞLA
        /**
         * İhale bize ihaleDunyasi.net den geldi ve bu yüzden rediste
         * HSET ihaleDunyasi ihaleDunyasi.IhaleId  ihaleninJsonHali olarak kaydedilir.
         */

        return result.dbQ.hset(result.kp.ihale.ihaleDunyasi.tablo, _es_ihale.IhaleProviders.IhaleDunyasi.IhaleDunyasiId, _es_ihale.IhaleProviders.IhaleDunyasi.raw)
            .then(function () {
                return f_ekle_genel(_es_ihale, _db_ihale, _kul_id)
            });
    };

    var f_db_tahta_ihale_guncelle = function (es_ihale, _db_ihale, _tahta_id, kurum_id, _kul_id) {
        return f_kontrol(es_ihale, _db_ihale, _tahta_id, kurum_id, _kul_id);
    };

    /**
     * Bu metod ihale bilgisi güncellendiğinde yapılır.
     * Genel ihale ise ezilir, değilse yeni haliyle güncellenir.
     * Her şey bittikten sonra ihalenin son bilgilerini geri döner
     * @param ihale
     * @param tahta_id
     * @param kurum_id
     * @returns {*}
     */
    var f_kontrol = function (es_ihale, db_ihale, tahta_id, kurum_id, _kul_id) {

        var orj_ihale_id = db_ihale.Id;
        return f_id(orj_ihale_id, tahta_id)
            .then(function (_eski_ihale_bilgisi) {

                return f_genel_kontrol(orj_ihale_id)
                    .then(function (_iGenelIhale) {
                        if (_iGenelIhale == 1) {

                            //genel ihaleler içinde kayıtlı
                            /*önce ezilen ihalelere ekle
                             * sonra ihale_id yi bir arttır ve yeni tahta ihalesi olarak ekle*/
                            return result.dbQ.sadd(result.kp.tahta.ssetEzilenIhaleleri(tahta_id), orj_ihale_id)
                                .then(function () {
                                    return result.dbQ.incr(result.kp.ihale.idx)
                                        .then(function (_id) {
                                            es_ihale.Id = db_ihale.Id = _id;
                                            db_ihale.Orjinal_Id = orj_ihale_id;

                                            return result.dbQ.Q.all([

                                                result.dbQ.hset(result.kp.ihale.tablo, _id, JSON.stringify(db_ihale)),
                                                result.dbQ.sadd(result.kp.tahta.ssetOzelIhaleleri(tahta_id, true), _id),
                                                result.dbQ.zadd(result.kp.ihale.zsetYapilmaTarihi, db_ihale.IhaleTarihi, db_ihale.Id)

                                            ]).then(function () {

                                                /**ihaleyi indexle
                                                 * ama önce ihale id yi indexlenmişse listeden kaldırmalıyız.
                                                 * (gelen konu içinde indexlenecek anahtar var mı bilmiyoruz, bu nedenle kaldırılmalı)
                                                 */

                                                    //_ihale, _kurum_id, _tahta_id, _kul_id
                                                emitter.emit(schema.SABIT.OLAY.IHALE_EKLENDI, es_ihale, kurum_id, tahta_id, _kul_id);

                                                //ihalenin kurumunu ata
                                                if (kurum_id > 0) {
                                                    return result.dbQ.Q.all([
                                                        result.dbQ.hset(result.kp.ihale.hsetYapanKurumlari, db_ihale.Id, kurum_id),
                                                        result.dbQ.srem(result.kp.kurum.ssetIhaleleri(_eski_ihale_bilgisi.Kurum_Id), db_ihale.Id),
                                                        result.dbQ.sadd(result.kp.kurum.ssetIhaleleri(kurum_id), db_ihale.Id)
                                                    ]);
                                                } else {
                                                    return db_ihale;
                                                }

                                            }).then(function () {
                                                //satırları kopyala ve durumlarını düzenle
                                                return f_guncellendi_satir_kontrol(tahta_id, db_ihale.Id, orj_ihale_id);
                                            }).then(function () {
                                                //teklifi var mı kontrol et varsa düzenle
                                                return f_guncellendi_teklif_kontrol(tahta_id, orj_ihale_id, db_ihale.Id);
                                            }).then(function () {

                                                //ihale bilgisini dön
                                                return f_id(db_ihale.Id, tahta_id);
                                            });
                                        });
                                });
                        }
                        else {

                            // bu ihale genel değil, tahtaya eklenen özel ihaledir

                            return result.dbQ.Q.all([
                                result.dbQ.hset(result.kp.ihale.tablo, db_ihale.Id, JSON.stringify(db_ihale)),
                                result.dbQ.zrem(result.kp.ihale.zsetYapilmaTarihi, db_ihale.Id),
                                result.dbQ.zadd(result.kp.ihale.zsetYapilmaTarihi, db_ihale.IhaleTarihi, db_ihale.Id)

                            ]).then(function () {
                                /**ihaleyi indexle
                                 * ama önce ihale id yi indexlenmişse listeden kaldırmalıyız.
                                 * (gelen konu içinde indexlenecek anahtar var mı bilmiyoruz, bu nedenle kaldırılmalı)
                                 */
                                emitter.emit(schema.SABIT.OLAY.IHALE_GUNCELLENDI,
                                    {
                                        eski_ihale: _eski_ihale_bilgisi,
                                        yeni_ihale: es_ihale,
                                        tahta_id: tahta_id,
                                        kul_id: _kul_id
                                    });

                                if (kurum_id > 0) {

                                    //ihalenin kurumunu yenisiyle değiştiriyoruz
                                    //kurumun ihalelerinde eski kurumu çıkarıp yenisini ekliyoruz

                                    return result.dbQ.Q.all([
                                        result.dbQ.hset(result.kp.ihale.hsetYapanKurumlari, db_ihale.Id, kurum_id),
                                        result.dbQ.srem(result.kp.kurum.ssetIhaleleri(_eski_ihale_bilgisi.Kurum_Id), db_ihale.Id),
                                        result.dbQ.sadd(result.kp.kurum.ssetIhaleleri(kurum_id), db_ihale.Id)
                                    ]);
                                }
                                else {
                                    return db_ihale;
                                }
                            }).then(function () {
                                return f_id(db_ihale.Id, tahta_id);
                            });
                        }
                    });
            });
    };

    var f_db_tahta_ihale_sil = function (_ihale_id, _tahta_id, _kul_id) {

        return f_genel_kontrol(_ihale_id)
            .then(function (_iGenel) {
                if (_iGenel == 1) {

                    //bu ihale genelde silinemez!
                    throw new exception.Istisna("İhale Silinemedi!", "Silinmek istenen ihale GENEL ihaleler içerisinde kayıtlı olduğu için işlem tamamlanamadı!");

                } else {

                    return f_id(_ihale_id, _tahta_id)
                        .then(function (_dbIhale) {
                            emitter.emit(schema.SABIT.OLAY.IHALE_SILINDI, _dbIhale, _tahta_id, _kul_id);

                            return result.dbQ.Q.all([
                                result.dbQ.srem(result.kp.tahta.ssetOzelIhaleleri(_tahta_id, true), _ihale_id),
                                result.dbQ.sadd(result.kp.tahta.ssetOzelIhaleleri(_tahta_id, false), _ihale_id),
                                result.dbQ.del(result.kp.ihale.ssetUrunleri(_tahta_id, _ihale_id))

                            ]).then(function () {
                                l.info("teklifleri sil");
                                //ihaleye ait teklifleri sil

                                return f_teklifleri(_tahta_id, _ihale_id)
                                    .then(
                                        /**
                                         *
                                         * @param {DBTeklif[]} _teklifler
                                         * @returns {integer|Promise}
                                         */
                                        function (_teklifler) {
                                            if (_teklifler != null && _teklifler.length > 0) {

                                                var db_teklif = require('./db_teklif');
                                                //ihaleye ait teklifleri sil
                                                return _teklifler.pluckX("Id").mapX(null, db_teklif.f_db_teklif_sil, _tahta_id, _kul_id).allX();
                                            }
                                            return _ihale_id;
                                        });

                            }).then(function () {
                                //satırlarını sil
                                //önce tahtada ihaleye eklenmiş satırları buluyoruz ve sadece bunları siliyoruz
                                l.info("satırlara geçtim");

                                return result.dbQ.smembers(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true))
                                    .then(function (_satir_idler) {

                                        if (_satir_idler.length > 0) {
                                            var db_kalem = require('./db_kalem');
                                            return _satir_idler.mapX(null, db_kalem.f_db_kalem_sil_tahta, _tahta_id, _ihale_id, _kul_id).allX();

                                        }
                                        return _ihale_id;
                                    });
                            });
                        });
                }
            });
    };

    /**
     * Gelen ihale_id genel ihale setinde ise 1 değilse 0 döner
     * @param {integer} _ihale_id
     */
    var f_genel_kontrol = function (_ihale_id) {
        return result.dbQ.sismember(result.kp.ihale.ssetGenel, _ihale_id);
    };

    /**
     * ihalenin satırlarını yenisine kopyala
     * önce geneldekileri
     * sonra tahtaya eklenmiş özel kalemleri varsa tablonun adını yeni ihale_id si ile değiştir
     *
     * satırın onay durumlarını düzenliyoruz
     * @param {integer} tahta_id
     * @param {integer} yeni_ihale_id
     * @param {integer} orj_ihale_id
     * @returns {*}
     */
    var f_guncellendi_satir_kontrol = function (tahta_id, yeni_ihale_id, orj_ihale_id) {

        return result.dbQ.smembers(result.kp.ihale.ssetKalemleri(orj_ihale_id))
            .then(function (_arrKalem_Id) {
                l.info("_arrKalem_Id: " + _arrKalem_Id);

                // Eğer ihalenin kalemi yoksa, ihale_id sini dön.
                if (_arrKalem_Id.length == 0) {
                    return yeni_ihale_id;
                }

                // Kalemler varsa
                return result.dbQ.Q.all([
                    result.dbQ.sadd(result.kp.ihale.ssetKalemleri(yeni_ihale_id), _arrKalem_Id),
                    result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(tahta_id, yeni_ihale_id, true), _arrKalem_Id),
                    result.dbQ.hdel(result.kp.tahta.hsetKalemOnayDurumlari(tahta_id), _arrKalem_Id)

                ]).then(function () {

                    return result.dbQ.hmget_json_parse(result.kp.tahta.hsetKalemOnayDurumlari(tahta_id), _arrKalem_Id)
                        .then(function (_arrKalemlerinDbOnayDurumlari) {
                            var arrPromises = _arrKalemlerinDbOnayDurumlari.map(function (_dbDurum, _idx) {
                                if (_dbDurum != null) {
                                    //eski satıra ait onay durum bilgileri varsa siliyoruz
                                    return result.dbQ.srem(result.kp.kalem.ssetOnayDurumlari(tahta_id, _dbDurum.Id), _arrKalem_Id[_idx]);
                                }
                            });

                            return result.dbQ.Q.all(arrPromises);
                        });
                });
            })
            .then(function () {
                //tahtanın özel kalemlerinde kayıtlı ise anahtarı (tahta:401:ihale:10:kalem) siliyoruz
                //tahtanın özel kalemlerindeki ihaleye ait kalemleri yeni ihale_id ile sete ekliyoruz
                //(tahta:401:ihale:10:kalem 201 202)
                return result.dbQ.smembers(result.kp.tahta.ssetOzelKalemleri(tahta_id, orj_ihale_id, true))
                    .then(function (_dbKalem_idler) {
                        if (_dbKalem_idler && _dbKalem_idler.length > 0) {

                            return result.dbQ.Q.all([
                                result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(tahta_id, yeni_ihale_id, true), _dbKalem_idler)
                                //result.dbQ.del(result.kp.tahta.ssetOzelKalemleri(tahta_id, orj_ihale_id, true)),
                                //result.dbQ.sadd(result.kp.tahta.ssetOzelKalemleri(tahta_id, orj_ihale_id, false), _dbKalem_idler)
                            ]);
                        } else {
                            return yeni_ihale_id;
                        }
                    });
            })
            .then(function () {
                return orj_ihale_id
            });
    };

    // endregion

    // region İHALE TEKLİFLERİ
    /**
     * ihaleye bağlı teklifleri bul
     * @param {integer} tahta_id
     * @param {integer} ihale_id
     * @returns {*}
     */
    var f_teklifleri = function (tahta_id, ihale_id) {
        var defer = result.dbQ.Q.defer();

        //ihaleye bağlı teklifleri bul
        result.rc.multi()
            .sinterstore("temp_ihale_teklif", result.kp.ihale.ssetTeklifleri(ihale_id), result.kp.tahta.ssetTeklifleri(tahta_id, true))
            .smembers("temp_ihale_teklif")
            .expire("temp_ihale_teklif", 10)
            .exec(function (err, replies) {
                l.info("MULTI REPLY" + JSON.stringify(replies));

                if (replies[1] && replies[1].length > 0) {
                    defer.resolve(replies[1]);

                } else {
                    defer.resolve(null);
                }
            });

        return defer.promise;
    };
    // endregion

    // region İHALEYİ GİZLE/GİZLEME
    /**
     * Kullanıcı tahtada gizlediği ihaleyi tekrardan listede görmek isterse geri alıyoruz
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     */
    var f_db_tahta_ihale_gizlenen_sil = function (_tahta_id, _ihale_id) {
        return result.dbQ.srem(result.kp.tahta.ssetGizlenenIhaleleri(_tahta_id), _ihale_id)
            .then(function () {
                emitter.emit(schema.SABIT.OLAY.IHALE_GIZLENDI, _ihale_id, _tahta_id);
                return _ihale_id;
            });
    };

    /**
     * Kullanıcı tahtada görmek istemediği ihaleleri gizleyebilir, böylece listede gizlenenler görünmeyecektir.
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     */
    var f_db_tahta_ihale_gizlenen_ekle = function (_tahta_id, _ihale_id) {
        return result.dbQ.sadd(result.kp.tahta.ssetGizlenenIhaleleri(_tahta_id), _ihale_id)
            .then(function () {
                emitter.emit(schema.SABIT.OLAY.IHALE_GIZLENDI, _ihale_id, _tahta_id);
                return _ihale_id;
            });
    };


    /**
     * Tahtanın gizlenen ihale idlerini getirir
     * @param {integer} _tahta_id
     */
    var f_tahtanin_gizlenen_ihale_idleri = function (_tahta_id) {

        return result.dbQ.smembers(result.kp.tahta.ssetGizlenenIhaleleri(_tahta_id))
            .then(function (_gizlenen_ihale_idler) {
                if (!_gizlenen_ihale_idler || _gizlenen_ihale_idler.length == 0) {
                    return [];
                }

                return f_db_tahta_ihale_idler_aktif(_tahta_id)
                    .then(function (_aktif_ihale_idler) {
                        return _.intersection(_aktif_ihale_idler, _gizlenen_ihale_idler)
                    });
            });
    };

    /**
     * Tahtanın gizlenen ihalelerini getirir
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     */
    var f_tahtanin_gizlenen_ihaleleri = function (_ihale_id, _tahta_id) {
        f_tahtanin_gizlenen_ihale_idleri(_tahta_id)
            .then(function (_ihale_idler) {
                if (_ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opt = {};
                    opt.bArrKalemleri = false;
                    opt.bTakip = true;
                    opt.bYapanKurum = true;
                    return f_id(_ihale_idler, _tahta_id, opt);
                } else {
                    return [];
                }
            })
    };


    /**
     * Tahtanın gizlenen kalem idlerini getirir
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     */
    var f_tahtanin_gizlenen_kalem_idleri = function (_ihale_id, _tahta_id) {

        return result.dbQ.smembers(result.kp.tahta.ssetGizlenenKalemleri(_tahta_id))
            .then(function (_gizlenen_kalem_idler) {
                console.log("_gizlenen_kalem_idler>" + _gizlenen_kalem_idler);
                //herhangibir kayıt yoksa boş dizi dönüyoruz
                if (!_gizlenen_kalem_idler || _gizlenen_kalem_idler.length == 0) {
                    return [];
                }

                //genel ihalenin kalemleri+tahtada eklenen özel ihale kalemleri-(tahtanın silinen kalemleri+tahtada ezilen kalemler)>işlem yapılacak kalemleri getirir
                return result.dbQ.Q.all([
                        result.dbQ.sunion(result.kp.ihale.ssetKalemleri(_ihale_id), result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, true)),
                        result.dbQ.sunion(result.kp.tahta.ssetOzelKalemleri(_tahta_id, _ihale_id, false), result.kp.tahta.ssetEzilenKalemleri(_tahta_id))
                    ])
                    .then(function (_arrDbReplies) {
                        var aktifler = _arrDbReplies[0],
                            pasifler = _arrDbReplies[1];

                        var aktif_kalem_idleri = aktifler.differenceXU(pasifler);

                        console.log("_aktif_kalem_idleri>" + aktif_kalem_idleri);
                        return _.intersection(aktif_kalem_idleri, _gizlenen_kalem_idler);
                    });
            });
    };

    /**
     * Tahtanın gizlenen kalemlerini getirir
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     */
    var f_tahtanin_gizlenen_kalemleri = function (_ihale_id, _tahta_id) {
        f_tahtanin_gizlenen_kalem_idleri(_ihale_id, _tahta_id)
            .then(function (_kalem_idler) {
                var db_kalem = require("./db_kalem");
                /** @type {OptionsKalem} */
                var opt = {};
                opt.bArrTeklifleri = false;
                opt.bOnayDurumu = true;
                opt.bTakiptemi = true;
                return db_kalem.f_db_kalem_id(_kalem_idler, _tahta_id, opt);
            });
    };

    // endregion

    // region İHALE TAKİP
    /**
     * Kullanıcı tahtada takip ettiği ihalelerden çıkartabilir
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     */
    var f_db_tahta_ihale_takip_sil = function (_tahta_id, _ihale_id) {
        return result.dbQ.srem(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale_id);
    };

    /**
     * Kullanıcı tahtada takip ettiği ihaleleri belirleyebilir.
     * @param {integer} _tahta_id
     * @param {integer} _ihale_id
     */
    var f_db_tahta_ihale_takip_ekle = function (_tahta_id, _ihale_id) {
        return result.dbQ.sadd(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale_id);
    };


    /**
     * Genel ihale id takip edilenler setinde ise 1 değilse 0 döner
     * @param {integer} _tahta_id
     * @param {Object} _ihale
     * @returns {*}
     */
    var f_takipte_mi = function (_tahta_id, _ihale) {
        return result.dbQ.sismember(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id), _ihale.Id)
            .then(function (_iTakip) {
                _ihale.Takip = _iTakip == 1;
                return _ihale;
            });
    };


    /**
     * Gelen ihale bilgilerinin takipte olup olmadığını belirtiyoruz
     * @param {integer} _tahta_id
     * @param {Array/Object} _ihaleler
     * @returns {*}
     */
    var f_takip_kontrol = function (_tahta_id, _ihaleler) {

        if (Array.isArray(_ihaleler) && _ihaleler.length > 0) {

            var arr = _ihaleler.map(function (_ihale) {
                return f_takipte_mi(_tahta_id, _ihale)
            });

            return result.dbQ.Q.all(arr);

        } else {
            return f_takipte_mi(_tahta_id, _ihaleler);
        }
    };


    /**
     * Tahtanın takipteki ihale idlerini getirir
     * @param {integer} _tahta_id
     */
    var f_tahtanin_takipteki_ihale_idleri = function (_tahta_id) {

        return result.dbQ.smembers(result.kp.tahta.ssetTakiptekiIhaleleri(_tahta_id))
            .then(function (_takipteki_ihale_idler) {

                //herhangibir kayıt yoksa boş dizi dönüyoruz
                if (!_takipteki_ihale_idler || _takipteki_ihale_idler.length == 0) {
                    return [];
                }

                return f_db_tahta_ihale_idler_aktif(_tahta_id)
                    .then(function (_aktif_ihale_idler) {
                        return _.intersection(_aktif_ihale_idler, _takipteki_ihale_idler);
                    });
            });
    };

    /**
     * Tahtanın takipteki ihalelerini getirir
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     */
    var f_tahtanin_takipteki_ihaleleri = function (_ihale_id, _tahta_id) {
        f_tahtanin_takipteki_ihale_idleri(_tahta_id)
            .then(function (_ihale_idler) {
                if (_ihale_idler.length > 0) {
                    /** @type {OptionsIhale} */
                    var opt = {};
                    opt.bArrKalemleri = false;
                    opt.bTakip = true;
                    opt.bYapanKurum = true;
                    return f_id(_ihale_idler, _tahta_id, opt);
                } else {
                    return [];
                }
            })
    };


    /**
     * İhalenin takipteki kalem idlerini getirir
     * @param _ihale_id
     * @param _tahta_id
     * @returns {*}
     */
    var f_tahtanin_takipteki_kalem_idleri = function (_ihale_id, _tahta_id) {

        return result.dbQ.smembers(result.kp.tahta.ssetTakiptekiKalemleri(_tahta_id))
            .then(function (_takipteki_kalem_idler) {
                //takip edilen kalem yoksa boş dizi dön
                if (!_takipteki_kalem_idler || _takipteki_kalem_idler.length == 0) {
                    return [];
                }
                return f_aktif_kalem_idler(_ihale_id, _tahta_id)
                    .then(function (_aktif_kalem_idler) {
                        return _.intersection(_aktif_kalem_idler, _takipteki_kalem_idler);
                    });
            });
    };

    var f_tahtanin_takipteki_kalemleri = function (_ihale_id, _tahta_id) {
        f_tahtanin_takipteki_kalem_idleri(_ihale_id, _tahta_id)
            .then(function (_kalem_idler) {
                if (_kalem_idler.length > 0) {
                    var db_kalem = require("./db_kalem");
                    /** @type {OptionsKalem} */
                    var opt = {};
                    opt.bArrTeklifleri = false;
                    opt.bOnayDurumu = true;
                    opt.bTakiptemi = true;
                    return db_kalem.f_db_kalem_id(_kalem_idler, _tahta_id, opt);
                } else {
                    return [];
                }
            });
    };

    // endregion

    /**
     * @class DBIhale
     */
    result = {
        f_db_ihale_tahtanin_takipteki_ihale_idleri: f_tahtanin_takipteki_ihale_idleri,
        f_db_ihale_tahtanin_takipteki_ihaleleri: f_tahtanin_takipteki_ihaleleri,
        f_db_ihale_tahtanin_takipteki_kalemleri: f_tahtanin_takipteki_kalemleri,
        f_db_ihale_tahtanin_takipteki_kalem_idleri: f_tahtanin_takipteki_kalem_idleri,
        f_db_ihale_tahtanin_gizlenen_kalemleri: f_tahtanin_gizlenen_kalemleri,
        f_db_ihale_tahtanin_gizlenen_kalem_idleri: f_tahtanin_gizlenen_kalem_idleri,
        f_db_ihale_tahtanin_gizlenen_ihaleleri: f_tahtanin_gizlenen_ihaleleri,
        f_db_ihale_tahtanin_gizlenen_ihale_idleri: f_tahtanin_gizlenen_ihale_idleri,
        f_db_ihale_aktif_kalem_idler: f_aktif_kalem_idler,
        f_db_ihale_kalemleri_by_page: f_kalemleri_by_page,
        f_db_ihale_paylas: f_paylas,
        f_db_tahta_ihale_gruplama: f_db_tahta_ihale_gruplama,
        f_db_ihale_idler_aktif_tarih_araligindakiler: f_idler_aktif_tarih_araligindakiler,
        f_db_ihale_tumu_tarih_araligindakiler: f_tumu_tarih_araligindakiler,
        f_db_ihale_indexli_tarihine_gore_grupla: f_indexli_tarihine_gore_grupla,
        f_db_ihale_tarihine_gore_grupla: f_tarihine_gore_grupla,
        f_db_ihale_takipte_mi: f_takipte_mi,
        f_db_ihale_takip_kontrol: f_takip_kontrol,
        f_db_tahta_ihale_idler_aktif: f_db_tahta_ihale_idler_aktif,
        f_db_tahta_ihale_idler_sort_page: f_db_tahta_ihale_idler_sort_page,
        f_db_tahta_ihale_takip_ekle: f_db_tahta_ihale_takip_ekle,
        f_db_tahta_ihale_takip_sil: f_db_tahta_ihale_takip_sil,
        f_db_tahta_ihale_gizlenen_ekle: f_db_tahta_ihale_gizlenen_ekle,
        f_db_tahta_ihale_gizlenen_sil: f_db_tahta_ihale_gizlenen_sil,
        f_db_ihale_teklifleri: f_teklifleri,
        f_db_ihale_genel_kontrol: f_genel_kontrol,
        f_db_ihale_kontrol: f_kontrol,
        f_db_ihale_teklif_tumu: f_teklif_tumu,
        f_db_ihale_yapan_kurum: f_yapan_kurum,
        f_db_ihale_yapan_kurum_guncelle: f_yapan_kurum_guncelle,
        f_db_ihale_kurum_tumu: f_kurum_tumu,
        f_db_ihale_kalem_tumu: f_kalem_tumu,
        f_db_ihale_sbihale_id: f_sbihale_id,
        f_db_ihale_tumu: f_tumu,
        f_db_ihale_tumu_genel: f_tumu_genel,
        f_db_ihale_id: f_id,
        f_db_ihale_yapilmaTarihineGore: f_yapilmaTarihi_Araliginda,
        f_db_ihale_sistemeEklenmeTarihineGore: f_sistemeEklenmeTarih_Araliginda,
        f_db_ihale_ekle: f_ekle,
        f_db_ihale_ekle_ihaleDunyasindan: f_ekle_ihaleDunyasindan,
        f_db_tahta_ihale_guncelle: f_db_tahta_ihale_guncelle,
        f_db_tahta_ihale_sil: f_db_tahta_ihale_sil,

        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsIhale}
         */
        OptionsIhale: function (opts) {
            /** @class OptionsIhale */
            return _.extend({
                /** @type {OptionsKalem} */
                optKalem: _.extend({
                    bArrTeklifleri: false,
                    bTakiptemi: true,
                    bOnayDurumu: true
                }, (opts && opts.optsKalem ? opts.optsKalem : {})),
                bArrKalemleri: false,
                bYapanKurum: true,
                bTakip: true
            }, opts || {})
        }
    };

    return result;
}


/**
 *
 * @type {DBIhale}
 */
var obj = DB_Ihale();
obj.__proto__ = require('./db_log');


module.exports = obj;

/**** redis pub/sub ****/
/*var redis = require('redis');
 var sub = result.createClient();
 var pub = result.createClient();
 sub.subscribe('chat');
 sub.subscribe('IHALE:YENI_EKLENDI');


 pub.publish('chat', {msg: 'user joined'});
 sub.on('message', function (channel, message) {
 if(channel === 'ihaleye_kurum_eklendi'){
 // alarm kurulmuş mu? > result.f_isSettedAlert(message)
 //   E: çalıştır
 //
 // socket üzerinden bildirimini yap > result.f_informOverSocket(message)
 //   bağlı kullanıcılardan kim ilgili süz
 //   herbirine gönder
 }
 socket.emit(channel, message);
 });*/
/* --- redis pub/sub ---*/