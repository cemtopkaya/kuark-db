'use strict';

var schema = require('kuark-schema'),
    emitter = new (require('events').EventEmitter)(),
    exception = require('kuark-istisna'),
    extensions = require('kuark-extensions'),
    l = extensions.winstonConfig,
    _ = require('lodash');

/**
 *
 * @returns {DBUrun}
 * @constructor
 */
function DB_Urun() {

    var /** @type {DBUrun} */ result = null;


    //region ÜRÜN TEKLİF ÇALIŞMALARI

    /**
     * Ürüne ait teklifler dizisi döner
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @returns {*}
     */
    var f_db_urun_teklif_kontrol = function (_tahta_id, _urun_id) {
        return result.dbQ.smembers(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id));
    };


    /**
     * Ürünün kazandığı teklif fiyatlarını getirir
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {integer} _parabirim_id
     * @returns {*}
     */
    var f_db_urunun_kazandigi_teklif_fiyatlari = function (_tahta_id, _urun_id, _parabirim_id) {
        //l.info("f_db_urunun_kazandigi_teklif_fiyatlari");
        //ürünün kazandığı teklifleri bul
        //bu tekliflerin fiyatlarını getir
        return f_db_urunun_teklif_fiyatlari_onay_durumuna_gore(_tahta_id, _urun_id, schema.SABIT.ONAY_DURUM.teklif.KAZANDI, _parabirim_id);
    };

    /**
     * Ürünün onay durumuna göre teklif fiyatlarını getir
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {integer} _onay_durum_id
     * @param {integer} _parabirim_id
     * @returns {Promise}
     */
    var f_db_urunun_teklif_fiyatlari_onay_durumuna_gore = function (_tahta_id, _urun_id, _onay_durum_id, _parabirim_id) {
        //l.info("f_db_urunun_teklif_fiyatlari_onay_durumuna_gore");

        return f_db_urun_teklif_temp(_tahta_id, _urun_id, _parabirim_id, _onay_durum_id)
            .then(function () {
                if (_onay_durum_id && _onay_durum_id > 0) {
                    var anahtar1 = result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _parabirim_id);
                    var anahtar2 = result.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _onay_durum_id);
                    return result.dbQ.zinterstore("temp_utpo", 2, anahtar1, anahtar2)
                        .then(function () {
                            result.dbQ.zrangebyscore("temp_utpo", "-inf", "+inf")
                        });
                } else {
                    return result.dbQ.zrangebyscore(result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _parabirim_id), "-inf", "+inf");
                }
            })
            .then(function (_iTeklif_idler) {
                var db_teklif = require('./db_teklif');

                /** @type {OptionsTeklif} */
                var opts = db_teklif.OptionsTeklif({
                    bArrUrunler: false,
                    bKalemBilgisi: false,
                    bIhaleBilgisi: false,
                    bKurumBilgisi: false,
                    optUrun: {}
                });

                return db_teklif.f_db_teklif_id(_iTeklif_idler, _tahta_id, opts)
                    .then(function (_teklifler) {
                        var teklifler = [].concat(_teklifler);

                        //sadece teklif fiyatlarını al
                        //aynı fiyatları yazmaya gerek yok filtrele ve sırala
                        return _.uniq(teklifler.pluckX("Fiyat"), true);
                    });
            });
    };

    /**
     * Ürününün teklif edildiği TÜM fiyatlar
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {integer} _parabirim_id
     * @returns {Promise|{Fiyat:integer[]}}
     */
    var f_db_urunun_teklif_verildigi_fiyatlari = function (_tahta_id, _urun_id, _parabirim_id) {
        return f_db_urun_teklif_temp(_tahta_id, _urun_id, _parabirim_id)
            .then(function () {
                return result.dbQ.zrangebyscore(result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _parabirim_id), "-inf", "+inf")
                    .then(function (_teklif_idler) {
                        if (Array.isArray(_teklif_idler) && _teklif_idler.length > 0) {

                            var db_teklif = require('./db_teklif');

                            /** @type {OptionsTeklif} */
                            var opts = db_teklif.OptionsTeklif({
                                bArrUrunler: false,
                                bKalemBilgisi: false,
                                bIhaleBilgisi: false,
                                bKurumBilgisi: false,
                                optUrun: {}
                            });

                            return db_teklif.f_db_teklif_id(_teklif_idler, _tahta_id, opts)
                                .then(function (_teklifler) {
                                    var teklifler = [].concat(_teklifler);
                                    //sadece teklif fiyatlarını al
                                    //aynı fiyatları yazmaya gerek yok filtrele ve sırala
                                    return _.uniq(_.map(teklifler, "Fiyat"), true);
                                });

                        } else {
                            return [];
                        }
                    });
            });
    };

    /**
     * Ürünle ilgili temp leri (para birim ve onay durumlarına göre) oluştur
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {integer} _para_id
     * @param {integer=} _onay_durum_id
     * @returns {*}
     */
    var f_db_urun_teklif_temp = function (_tahta_id, _urun_id, _para_id, _onay_durum_id) {

        //ürüne verilmiş tüm teklifleri para birimine göre teklif tarihleri ile sette tutuyoruz
        var sonucAnahtari = result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _para_id);
        return result.dbQ.zcard(sonucAnahtari)
            .then(function (_iToplam) {
                if (_iToplam == 0) {
                    return result.dbQ.zinterstore(sonucAnahtari, 2,
                        result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id),
                        result.kp.teklif.ssetTeklifParaBirimli(_para_id))

                } else {
                    return _iToplam;
                }
            })
            .then(function (_iToplam) {
                if (_onay_durum_id && _onay_durum_id > 0) {
                    //ürünle ilgili teklif onay durumuna göre temp oluştur
                    var anahtar = result.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _onay_durum_id);
                    return result.dbQ.zcard(anahtar)
                        .then(function (_iToplam) {
                            if (_iToplam == 0) {
                                /* return result.dbQ.zinterstore(anahtar, 2,
                                 result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _para_id),
                                 result.kp.teklif.ssetTeklifOnayDurumlari(_onay_durum_id)); */

                                return result.dbQ.zinterstore(anahtar, 2,
                                    result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id),
                                    result.kp.teklif.ssetTeklifOnayDurumlari(_onay_durum_id));
                            } else {
                                return _iToplam;
                            }
                        })
                } else {
                    return _iToplam;
                }
            });
    };


    /**
     * İhale tarihine göre ürünle katıldığı teklif varsa o güne 1 yazılır yoksa 0
     * @param _tahta_id
     * @param _urun_id
     * @param _onay_id
     * @param _para_id
     * @param _tarih1
     * @param _tarih2
     * @returns {*}
     */
    var f_db_urunle_teklif_verilen_ihale_sayisi = function (_tahta_id, _urun_id, _onay_id, _para_id, _tarih1, _tarih2) {
        //1 ürünle verilen teklifler için temp oluştur
        //2 tarih aralığındaki ihaleleri bul
        //3 ihaleye verilen teklifleri ile ürüne verilen tekliflerin kesişimi varsa ihale tarihinde teklif verildi diye 1 yaz yoksa 0 yaz
        //4 geçici anahtarı sil
        //5 ihale tarihine göre grupla ve toplamları dön

        var ihale = require('./db_ihale');

        return result.dbQ.Q.all([
            f_db_urun_teklif_temp(_tahta_id, _urun_id, _para_id, _onay_id),//1
            ihale.f_db_ihale_idler_aktif_tarih_araligindakiler(_tahta_id, _tarih1, _tarih2)//2
        ]).then(function (_ress) {
            var ihale_idler = _ress[1];

            return result.dbQ.hmget_json_parse(result.kp.ihale.tablo, ihale_idler)
                .then(function (ihaleler) {
                    if (ihaleler && ihaleler.length > 0) {
                        var arr = _.map(ihaleler, function (_ihale) {
                            //3

                            return (_onay_id && _onay_id != null && _onay_id != "" && _onay_id > 0
                                ?
                                result.dbQ.zinterstore("temp_utg", "2",
                                    result.kp.ihale.ssetTeklifleri(_ihale.Id),
                                    result.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _onay_id))
                                :
                                result.dbQ.zinterstore("temp_utg", "2",
                                    result.kp.ihale.ssetTeklifleri(_ihale.Id),
                                    result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _para_id)))
                                .then(function (_iteklif_idler) {
                                    return {
                                        Key: _ihale.IhaleTarihi,
                                        Count: _iteklif_idler ? 1 : 0
                                    };
                                });
                        });
                        return result.dbQ.Q.all(arr)
                            .then(function (_res) {
                                //4 geçici oluşturulan anahtarı siliyoruz
                                result.dbQ.del("temp_utg");
                                return _res;
                            });
                    } else {
                        return [];
                    }
                });

        }).then(function (_result) {
            //5
            //buraya ihale tarihinde teklif atılmış ise teklif toplamları gelir
            //şimdi günlere göre gruplayarak tekliflerin toplamlarını sum ile hesaplamalıyız.
            if (_result && _result.length > 0) {
                var result = _.chain(_result)
                    .groupBy("Key")
                    .map(function (value, key) {
                        return {
                            Key: key,
                            Count: _.sum(_.map(value, "Count"))
                        }
                    })
                    .value();
                return _.sortBy(result, "Key");
            } else {
                return [];
            }
        });
    };


    /**
     * Ürüne verilen tekliflerle istenen durumdaki tekliflerin kesişimi alırsak ürünün tekliflerini bulabiliriz.
     * @param _tahta_id
     * @param _urun_id
     * @param _onay_durum_id
     * @param _para_id
     * @param _bTumTeklifBilgileriyle
     * @param _tarih1
     * @param _tarih2
     * @returns {*}
     */
    var f_db_urunun_teklif_detaylari = function (_tahta_id, _urun_id, _onay_durum_id, _para_id, _bTumTeklifBilgileriyle, _tarih1, _tarih2) {
        _tarih1 = _tarih1 || "-inf";
        _tarih2 = _tarih2 || "+inf";

        //1 - ürün teklif idlerini onay durum ve tarih aralığına göre bul
        //2 - teklif bilgilerini dön

        return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, _onay_durum_id, _para_id, _tarih1, _tarih2)//1
            .then(function (_teklif_idler) {
                if (Array.isArray(_teklif_idler) && _teklif_idler.length > 0) {
                    var db_teklif = require('./db_teklif');
                    /** @type {OptionsTeklif} */
                    var opts = db_teklif.OptionsTeklif(_bTumTeklifBilgileriyle
                        ? {}
                        : {
                        bArrUrunler: false,
                        bKalemBilgisi: false,
                        bIhaleBilgisi: false,
                        bKurumBilgisi: false,
                        optUrun: {}
                    });
                    return db_teklif.f_db_teklif_id(_teklif_idler, _tahta_id, opts);//2

                } else {
                    return [];
                }
            });
    };

    /**
     *
     * @param _tahta_id
     * @param _urun_id
     * @param _onay_durum_id
     * @param _para_id
     * @param _tarih1
     * @param _tarih2
     * @returns {Promise|Number[]}
     */
    var f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore = function (_tahta_id, _urun_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        _tarih1 = _tarih1 || "-inf";
        _tarih2 = _tarih2 || "+inf";

        //1- ürüne verilmiş teklifler için temp i oluştur
        //2- eğer onay durumu verilmişse onay durumuna göre ürün teklif temp i oluştur
        //2.1- tarih aralığına göre teklif idlerini bul (ürün teklifleri onay durumuna göre temp den)
        //2.2- tarih aralığına göre teklif idlerini bul (ürün teklifleri temp)

        return f_db_urun_teklif_temp(_tahta_id, _urun_id, _para_id, _onay_durum_id)
            .then(function () {
                if (_onay_durum_id && _onay_durum_id > 0) {
                    var anahtar1 = result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _para_id);
                    var anahtar2 = result.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _onay_durum_id);
                    return result.dbQ.zinterstore("temp_odp", 2, anahtar1, anahtar2)
                        .then(function () {
                            return result.dbQ.zrangebyscore("temp_odp", _tarih1, _tarih2);
                        });
                } else {
                    return result.dbQ.zrangebyscore(result.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _para_id), _tarih1, _tarih2);
                }
            });
    };


    var f_db_urunun_teklif_toplami = function (_tahta_id, _urun_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        _tarih1 = _tarih1 || "-inf";
        _tarih2 = _tarih2 || "+inf";

        if (_onay_durum_id && _onay_durum_id > 0) {
            //istenen onay durumuna bağlı teklif toplamı
            return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
                .then(function (_teklif_idleri) {
                    return [{
                        OnayDurum: _onay_durum_id,
                        Toplam: _teklif_idleri.length
                    }];
                });
        } else {
            //tüm onay durumlarına bağlı teklifleri dönüyoruz
            return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, schema.SABIT.ONAY_DURUM.teklif.TEKLIF, _para_id, _tarih1, _tarih2)
                .then(function (_iTeklif_idler) {
                    var obj = {OnayDurum: "Teklif", Toplam: _iTeklif_idler.length};
                    return [obj];
                })
                .then(function (_arr) {
                    return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, schema.SABIT.ONAY_DURUM.teklif.KAZANDI, _para_id, _tarih1, _tarih2)
                        .then(function (_iTeklif_idler) {
                            var obj = {OnayDurum: "Kazandı", Toplam: _iTeklif_idler.length};
                            _arr.push(obj);
                            return _arr;
                        })
                })
                .then(function (_arr) {
                    return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, schema.SABIT.ONAY_DURUM.teklif.REDDEDILDI, _para_id, _tarih1, _tarih2)
                        .then(function (_iTeklif_idler) {
                            var obj = {OnayDurum: "Reddedildi", Toplam: _iTeklif_idler.length};
                            _arr.push(obj);
                            return _arr;
                        });
                })
                .then(function (_arr) {
                    return f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore(_tahta_id, _urun_id, schema.SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI, _para_id, _tarih1, _tarih2)
                        .then(function (_iTeklif_idler) {
                            var obj = {OnayDurum: "İhaleden Atıldı", Toplam: _iTeklif_idler.length};
                            _arr.push(obj);
                            return _arr;
                        });
                });
        }
    };
    //endregion

    //region ÜRÜNLE ILIŞKILI KURUM IŞLEMLERI
    /**
     * Ürünle ilişkilendirilmiş kurum bilgilerini döner. Yani bu listede üretici satıcı bayi her türlü kurum bilgisi mevcuttur
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @returns {*}
     */
    var f_db_urun_iliskili_kurum_tumu = function (_tahta_id, _urun_id) {
        return result.dbQ.smembers(result.kp.urun.ssetKurumlari(_tahta_id, _urun_id))
            .then(function (_idler) {
                var db_kurum = require("./db_kurum");
                return db_kurum.f_db_kurum_id(_idler);
            });
    };

    /**
     * @function
     * @param _tahta_id
     * @param _urun_id
     * @param _kurum_id
     * @returns {null|number}
     */
    var f_db_urun_iliskili_kurum_ekle = function (_tahta_id, _urun_id, _kurum_id) {
        if (_kurum_id > 0) {
            return result.dbQ.sadd(result.kp.urun.ssetKurumlari(_tahta_id, _urun_id), _kurum_id);
        }
        return _urun_id;
    };
    var f_db_urun_iliskili_kurum_sil = function (_tahta_id, _urun_id, _kurum_id) {

        return f_db_urun_ureticisi(_urun_id)
            .then(function (_dbUretici) {
                if (_dbUretici == null) {
                    return result.dbQ.hdel(result.kp.urun.ssetKurumlari(_tahta_id, _urun_id), _kurum_id);
                }
                else {
                    if (_dbUretici.Id == _kurum_id) {

                        throw "Silinmek istenen firma ürünün üreticisi oldugu için işlem tamamlanamadı!";

                    } else {
                        return result.dbQ.srem(result.kp.urun.ssetKurumlari(_tahta_id, _urun_id), _kurum_id);
                    }
                }
            });
    };
    //endregion

    //region ÜRÜN İŞLEMLERİ (EKLE-SİL-GÜNCELLE-BUL)
    /**
     *
     * @param {integer} _tahta_id
     * @param {integer} _sayfalama
     * @returns {LazyLoadingResponse|Promise}
     */
    var f_db_urun_tumu = function (_tahta_id, _sayfalama) {
        //l.info("f_db_urun_tumu");

        return f_db_urun_aktif_urun_idleri(_tahta_id, _sayfalama)
            .then(
                /** @param {string[]} _aktifUrun_idleri */
                function (_aktifUrun_idleri) {
                    return result.dbQ.Q.all([
                            (_aktifUrun_idleri.length > 0
                                ? result.dbQ.scard(result.kp.temp.ssetTahtaUrun(_tahta_id))
                                : 0),
                            (_aktifUrun_idleri.length > 0
                                ? f_db_urun_id(_aktifUrun_idleri, _tahta_id)
                                : [])
                        ])
                        .then(function (_dbReplies) {
                            var sonuc = schema.f_create_default_object(schema.SCHEMA.LAZY_LOADING_RESPONSE);
                            sonuc.ToplamKayitSayisi = _dbReplies[0];
                            sonuc.Data = _dbReplies[1];
                            return sonuc;
                        })
                })
            .fail(function (_err) {
                l.e("sistemde kayıtlı ürünler çekilemedi." + _err);
                throw new exception.Istisna("Ürünler çekilemedi", "Sistemde kayıtlı ürünler çekilirken hata alındı: " + _err)
            });
    };

    var f_db_urun_aktif_urun_idleri = function (_tahta_id, _sayfalama) {
        var sonucAnahtari = result.kp.temp.ssetTahtaUrun(_tahta_id);
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
                    return result.dbQ.sunionstore(sonucAnahtari, result.kp.tahta.ssetOzelUrunleri(_tahta_id, true));
                }
            })
            .then(function () {

                return (_sayfalama
                    ? result.dbQ.sort(sonucAnahtari, "LIMIT", baslangic, bitis)
                    : result.dbQ.smembers(sonucAnahtari))
                    .then(function (_aktifUrun_idleri) {
                        return _aktifUrun_idleri;
                    });
            });
    };

    /**
     * Ürün/lerin üretici bilgileri
     * @param {integer|integer[]|string|string[]} _urun_id
     * @returns {*}
     */
    var f_db_urun_ureticisi = function (_urun_id) {
        return (Array.isArray(_urun_id)
            ? result.dbQ.hmget(result.kp.urun.hsetUreticiler, _urun_id)
            : result.dbQ.hget(result.kp.urun.hsetUreticiler, _urun_id))
            .then(function (_dbUretici_id) {
                if (!_dbUretici_id) {
                    return null;
                }

                var db_kurum = require("./db_kurum");
                return db_kurum.f_db_kurum_id(_dbUretici_id);

            });
    };

    /**
     * Ürün/lerin bilgisini getirir
     * @param {integer|integer[]|string|string[]} _urun_id
     * @param {integer} _tahta_id
     * @param {OptionsUrun=} _opts
     * @returns {*}
     */
    var f_db_urun_id = function (_urun_id, _tahta_id, _opts) {
        //ürünü buluyoruz ve bilgilerini geri döndürüyoruz

        return (Array.isArray(_urun_id)
            ? result.dbQ.hmget_json_parse(result.kp.urun.tablo, _urun_id)
            : result.dbQ.hget_json_parse(result.kp.urun.tablo, _urun_id))
            .then(function (_dbUrun) {
                if (_dbUrun == null) {
                    return null;

                } else {

                    /**
                     * ürün bilgisini şemasıyla getirir
                     * @param {UrunDB} _urun
                     * @param {OptionsUrun} _optsUrun
                     * @returns {*}
                     */
                    var f_urun_bilgisi = function (_urun, _optsUrun) {

                        if (!_urun) {
                            return null;
                        }

                        var /** @type {Urun} */
                        olusan_urun = schema.f_create_default_object(schema.SCHEMA.URUN);

                        olusan_urun = _.extend(olusan_urun, _urun);

                        return result.dbQ.Q.all([
                            _optsUrun.bUreticiKurum ? f_db_urun_ureticisi(_urun.Id) : {Id: 0},
                            _optsUrun.bArrAnahtarKelimeler ? f_db_urun_anahtar_tumu(_urun.Id, _tahta_id) : [{Id: 0}]
                        ]).then(function (_ress) {
                            olusan_urun.Uretici = /** @type {KurumDB} */_ress[0];
                            olusan_urun.AnahtarKelimeler = /** @type {AnahtarKelime[]} */_ress[1];
                            return olusan_urun;
                        });
                    };

                    var /** @type {OptionsUrun} */
                    opts = result.OptionsUrun(_opts);

                    if (Array.isArray(_dbUrun)) {
                        opts.bUreticiKurum = false;

                        return _dbUrun
                            .mapX(null, f_urun_bilgisi, opts)
                            .allX()
                            .then(function (dbUrunBilgilerle) {

                                return f_db_urun_ureticisi(_urun_id)
                                    .then(function (dbUreticiKurumlar) {

                                        dbUrunBilgilerle.forEach(function (_elm, _idx) {
                                            if (_elm) {
                                                _elm.Uretici = dbUreticiKurumlar[_idx];
                                            }
                                        });

                                        return dbUrunBilgilerle;
                                    });
                            });
                    } else {
                        return f_urun_bilgisi(/** @type {UrunDB} */_dbUrun, opts);
                    }
                }
            });
    };


    /**
     * Ürün ekleme 1 veya 1den fazla ürün listesinin (array) eklenmesi şeklinde olabilir.
     * @param {UrunDB[]} _db_urun
     * @param {integer} _uretici_id
     * @param {integer} _tahta_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    var f_db_urun_ekle = function (_db_urun, _uretici_id, _tahta_id, _kul_id) {
        //l.info("f_db_urun_ekle");

        var f_urun_ekle = function (_db_urun, _uretici_id, _tahta_id, _kul_id) {
            //SON EKLENEN ürünün İD SİNİ ÇEK VE EKLEME İŞLEMİNE BAŞLA
            //l.info("f_urun_ekle");
            return result.dbQ.incr(result.kp.urun.idx)
                .then(function (_id) {
                    _db_urun.Id = _id;

                    return result.dbQ.hset(result.kp.urun.tablo, _id, JSON.stringify(_db_urun))
                        .then(function () {
                            if (_tahta_id && _tahta_id > 0) {
                                return result.dbQ.sadd(result.kp.tahta.ssetOzelUrunleri(_tahta_id, true), _id);
                            } else {
                                return _db_urun;
                            }
                        })
                        .then(function () {
                            if (_uretici_id && _uretici_id > 0) {

                                return result.dbQ.Q.all([
                                    result.dbQ.sadd(result.kp.kurum.ssetUrunleri(_tahta_id, _uretici_id), _id),
                                    result.dbQ.hset(result.kp.urun.hsetUreticiler, _id, _uretici_id),
                                    f_db_urun_iliskili_kurum_ekle(_tahta_id, _id, _uretici_id)
                                ])
                            } else {
                                return _db_urun;
                            }
                        })
                        .then(function () {
                            return f_db_urun_id(_db_urun.Id, _tahta_id)
                                .then(function (_dbUrun) {
                                    emitter.emit(schema.SABIT.OLAY.URUN_EKLENDI, _db_urun, _tahta_id, _kul_id);
                                    return _dbUrun;
                                });
                        });
                });
        };

        return Array.isArray(_db_urun)
            ? _db_urun.mapX(null, f_urun_ekle, _uretici_id, _tahta_id, _kul_id).allX()
            : f_urun_ekle(_db_urun, _uretici_id, _tahta_id, _kul_id);
    };


    /**
     * Ürün güncellenirlen kurumunun değişip değişmediğini kontrol ediliyoruz
     * Değişmişse eski kurumun ürünleri listesinden çıkarıp yenisine ekliyoruz
     result.dbQ.srem(result.kp.kurum.ssetUrunleri(_tahta_id, _eski.Id), _urun.Id),
     result.dbQ.sadd(result.kp.kurum.ssetUrunleri(_tahta_id, _yeni.Id), _urun.Id)
     * @param {integer} _tahta_id
     * @param {UrunDB} _db_urun
     * @param {integer=} _uretici_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    var f_db_urun_guncelle = function (_tahta_id, _db_urun, _uretici_id, _kul_id) {

        emitter.emit(schema.SABIT.OLAY.URUN_GUNCELLENDI, _db_urun, _tahta_id, _kul_id);

        //ürünün üreticisi değişti ise eski kurum id den ürününü çıkarıp yenisine ekliyoruz
        return f_db_urun_ureticisi(_db_urun.Id)
            .then(function (_dbUretici) {
                if (_dbUretici && _dbUretici.Id > 0) {
                    if (_dbUretici.Id != _uretici_id) {
                        return result.dbQ.Q.all([
                            result.dbQ.hset(result.kp.urun.hsetUreticiler, _db_urun.Id, _uretici_id),
                            result.dbQ.srem(result.kp.kurum.ssetUrunleri(_tahta_id, _dbUretici.Id), _db_urun.Id),
                            result.dbQ.sadd(result.kp.kurum.ssetUrunleri(_tahta_id, _uretici_id), _db_urun.Id),
                            f_db_urun_iliskili_kurum_ekle(_tahta_id, _db_urun.Id, _uretici_id),
                            //üretici değiştiğinde ilişkili kurum listesinden kaldırmalıyız
                            f_db_urun_iliskili_kurum_sil(_tahta_id, _db_urun.Id, _dbUretici.Id)
                        ]);
                    }
                } else {
                    result.dbQ.Q.all([
                        result.dbQ.hset(result.kp.urun.hsetUreticiler, _db_urun.Id, _uretici_id),
                        result.dbQ.sadd(result.kp.kurum.ssetUrunleri(_tahta_id, _uretici_id), _db_urun.Id),
                        f_db_urun_iliskili_kurum_ekle(_tahta_id, _db_urun.Id, _uretici_id)
                    ]);
                }
            })
            .then(function () {
                //l.info("ürünü değiştir ve dön");
                return result.dbQ.hset(result.kp.urun.tablo, _db_urun.Id, JSON.stringify(_db_urun))
                    .then(function () {
                        return f_db_urun_id(_db_urun.Id, _tahta_id);
                    });
            });
    };

    /**
     * Ürün silinirken tahtanın özel ürünleri setinden çıkartıyoruz
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    var f_db_urun_sil = function (_tahta_id, _urun_id, _kul_id) {
        //l.info("silinecek ürün_id:" + _urun_id);

        // Validasyon yapalım
        if (!_urun_id) {
            throw new exception.Istisna("Ürün Silinemedi!", "Silinecek ürün bulunamadı! Tekrar deneyiniz.");
        }

        /** @type {OptionsUrun} */
        var opts = {};
        opts.bArrAnahtarKelimeler = false;
        opts.bArrIliskiliFirmalar = false;
        opts.bUreticiKurum = false;

        return f_db_urun_id(_urun_id, _tahta_id, opts)
            .then(function (_dbUrun) {

                emitter.emit(schema.SABIT.OLAY.URUN_SILINDI, _dbUrun, _tahta_id, _kul_id);

                return result.dbQ.Q.all([
                    result.dbQ.srem(result.kp.tahta.ssetOzelUrunleri(_tahta_id, true), _urun_id),
                    result.dbQ.sadd(result.kp.tahta.ssetOzelUrunleri(_tahta_id, false), _urun_id)

                ]).then(function () {

                    return result.dbQ.smembers(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id))
                        .then(function (_iTeklif_idler) {
                            if (Array.isArray(_iTeklif_idler) && _iTeklif_idler.length > 0) {

                                // teklif verilmiş
                                return [
                                    result.dbQ.hdel(result.kp.teklif.hsetUrunleri, _iTeklif_idler),
                                    result.dbQ.srem(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id), _iTeklif_idler)
                                ]
                                    .allX()
                                    .then(function () {
                                        return _urun_id;
                                    });
                            }
                            return _urun_id;
                        });
                });
            });


    };

    //endregion

    //region ANAHTAR KELİMELER
    /**
     * Ürüne bağlı anahtar kelimeleri getirir
     * @param {integer|integer[]|string|string[]} _urun_id
     * @param {integer} _tahta_id
     * @returns {Promise}
     */
    var f_db_urun_anahtar_tumu = function (_urun_id, _tahta_id) {
        console.log("f_db_urun_anahtar_tumu");
        return (Array.isArray(_urun_id)
            ? _urun_id.mapX(null, f_urun_anahtar_bilgisi, _tahta_id).allX()
            : f_urun_anahtar_bilgisi(_urun_id, _tahta_id));

        function f_urun_anahtar_bilgisi(_dbUrun_id, _tahta_id) {
            return result.dbQ.zrangebyscore([result.kp.urun.zsetAnahtarKelimeleri(_tahta_id, _dbUrun_id), '-inf', '+inf'])
                .then(
                    /**
                     *Ürünle ilişkili anahtarlar dizisi
                     * @param {string[]} _arr_anahtar_kelimeler
                     * @returns {Array|AnahtarKelime[]}
                     */
                    function (_arr_anahtar_kelimeler) {
                        if (_arr_anahtar_kelimeler && _arr_anahtar_kelimeler.length > 0) {

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
        }
    };

    /**
     * Ürünle ilişkili anahtar eklenmesi sağlanır.
     * @param {integer} _tahta_id
     * @param {integer} _urun_id
     * @param {AnahtarKelime} _anahtar
     * @returns {*}
     */
    var f_db_urun_anahtar_ekle = function (_tahta_id, _urun_id, _anahtar) {
        return result.f_db_anahtar_ekle(_anahtar.Anahtar)
            .then(
                /**
                 *
                 * @param {AnahtarKelime} _anahtarObjesi
                 * @returns {*}
                 */
                function (_anahtarObjesi) {

                    emitter.emit(schema.SABIT.OLAY.URUN_ANAHTAR_EKLENDI, _tahta_id, _anahtarObjesi);

                    return result.dbQ.Q.all([
                        result.f_db_anahtar_index_ekle_urun(_anahtarObjesi.Id, _urun_id),
                        result.dbQ.zadd(result.kp.urun.zsetAnahtarKelimeleri(_tahta_id, _urun_id), new Date().getTime(), _anahtar.Anahtar)
                    ]).then(function () {
                        return _anahtarObjesi;
                    });
                });
    };

    var f_db_urun_anahtar_sil = function (_tahta_id, _urun_id, _anahtar_id) {
        //return result.dbQ.zrem(result.kp.urun.zsetAnahtarKelimeleri(tahta_id, urun_id), _anahtarKelime);
        //l.info("f_db_urun_anahtar_sil");

        return result.f_db_anahtar_val(_anahtar_id)
            .then(function (_dbAnahtar) {
                if (_dbAnahtar == null) throw new exception.Istisna("Anahtar sil", "Anahtar bilgisi BULUNAMADI! Bu nedenle silme tamamlanamadı..");

                return result.dbQ.zrem(result.kp.urun.zsetAnahtarKelimeleri(_tahta_id, _urun_id), _dbAnahtar.Anahtar);
            });

    };
    //endregion

    //region TAHTALAR ARASI URUN PAYLAŞ
    /**
     * Tahtalar arasında özel ürünlerin paylaşılması sağlanır.
     * @param {{From:int, To:int[], Ids: int[]}} _paylas
     * @returns {*}
     */
    var f_db_urun_paylas = function (_paylas) {
        if (Array.isArray(_paylas.To) && _paylas.To.length > 0) {
            var arr = _paylas.To.map(function (_tahta_id) {
                return f_urun_paylas(_paylas.From, _tahta_id, _paylas.Ids);
            });
            return result.dbQ.Q.all(arr);

        } else {
            return f_urun_paylas(_paylas.From, _paylas.To, _paylas.Ids);
        }
    };

    var f_urun_paylas = function (_from, _to, _ids) {

        return result.dbQ.Q.all([
            result.dbQ.del(result.kp.temp.ssetTahtaUrun(_to)),
            result.dbQ.sadd(result.kp.tahta.ssetOzelUrunleri(_to, true), _ids)
        ]);
    };
    //endregion


    /**
     * @class DBUrun
     */
    result = {
        f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore: f_db_urun_teklif_idleri_onay_durum_ve_tarihe_gore,
        f_db_urunun_teklif_verildigi_fiyatlari: f_db_urunun_teklif_verildigi_fiyatlari,
        f_db_urunun_kazandigi_teklif_fiyatlari: f_db_urunun_kazandigi_teklif_fiyatlari,
        f_db_urunle_teklif_verilen_ihale_sayisi: f_db_urunle_teklif_verilen_ihale_sayisi,
        f_db_urunun_teklif_toplami: f_db_urunun_teklif_toplami,
        f_db_urun_paylas: f_db_urun_paylas,
        f_db_urun_aktif_urun_idleri: f_db_urun_aktif_urun_idleri,
        f_db_urunun_teklif_detaylari: f_db_urunun_teklif_detaylari,
        f_db_urun_teklif_kontrol: f_db_urun_teklif_kontrol,
        f_db_urun_iliskili_kurum_tumu: f_db_urun_iliskili_kurum_tumu,
        f_db_urun_iliskili_kurum_ekle: f_db_urun_iliskili_kurum_ekle,
        f_db_urun_iliskili_kurum_sil: f_db_urun_iliskili_kurum_sil,
        f_db_urun_ureticisi: f_db_urun_ureticisi,
        f_db_urun_tumu: f_db_urun_tumu,
        f_db_urun_id: f_db_urun_id,
        f_db_urun_ekle: f_db_urun_ekle,
        f_db_urun_guncelle: f_db_urun_guncelle,
        f_db_urun_sil: f_db_urun_sil,
        f_db_urun_anahtar_tumu: f_db_urun_anahtar_tumu,
        f_db_urun_anahtar_ekle: f_db_urun_anahtar_ekle,
        f_db_urun_anahtar_sil: f_db_urun_anahtar_sil,
        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsUrun}
         */
        OptionsUrun: function (opts) {
            /** @class OptionsUrun */
            return _.extend({
                bUreticiKurum: true,
                bArrAnahtarKelimeler: false,
                bArrIliskiliFirmalar: false
            }, opts || {})
        }
    };

    return result;
}

/**
 *
 * @type {DBUrun}
 */
var obj = DB_Urun();
obj.__proto__ = require('./db_anahtar');

module.exports = obj;