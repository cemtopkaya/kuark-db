/**
 * Kurum ekleme:
 *  HS > Kurumlar               : Tüm kurumları bu hash içinde tutacağız.
 *  ZS > Kurumlar:EklenmeTarihi : Tüm kurumların sisteme eklenme tarihlerini tutacağız.
 *  ZS > Kurumlar:IhaleTarihi   : Tüm kurumların  tarihlerini tutacağız.
 *  ZS > Kurum:Genel            : score:EKLENME_TARIHI    value:IDX      Genele açık kurumları(Sisteme girdiğimiz ya da çektiğimiz ihalelerin kurumları)
 *  ZS > Tahta:X:Kurum          : score:EKLENME_TARIHI    value:IDX      Tahtaya kurumun kaydedildiği tarih ve ID değerlerini tutacak
 *  ZS > Tahta:X:Kurum:Silinen  : score:SILINME_TARIHI    value:IDX      Tahtadan kurumun silindiği zaman ve ID değerlerini tutacak
 *  ZS > Kurum:Genel:Silinen    : score:SILINME_TARIHI    value:IDX      Genelden sildiğimiz tarih
 * @returns {DBKurum}
 * @constructor
 */
function DB_Kurum() {
    var result = {};

    //region TEKLİF İŞLEMLERİ/KONTROLLERİ

    //region kurum kazanç trendi
    var f_db_kurum_kazanc_trendi = function (_tahta_id, _kurum_id, _para_id, _tarih1, _tarih2) {
        l.info("f_db_kurum_kazanc_trendi")

        return f_db_kurumun_teklifleri_detay(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.KAZANDI, _para_id, _tarih1, _tarih2, true)
            .then(function (_kazanan_teklifler) {
                var arrTeklifler = _.map(_kazanan_teklifler, function (_elm) {
                    var ihale_tarihi = new Date(_elm.Ihale.IhaleTarihi),
                        t = (ihale_tarihi.getMonth() + 1) + "/" + ihale_tarihi.getDate() + "/" + ihale_tarihi.getFullYear(),
                        tarih = new Date(t).getTime(),
                        fiyat = parseFloat(_elm.Fiyat),
                        miktar = parseFloat((_elm.Kalem.Miktar && _elm.Kalem.Miktar > 0) ? _elm.Kalem.Miktar : 1);

                    return {Tarih: tarih, Toplam: fiyat * miktar};
                });
                return result.dbQ.Q.all(arrTeklifler)
                    .then(function (_res) {
                        return _res;
                    });
            })
            .then(function (_result) {
                var result = _.chain(_result)
                    .groupBy("Tarih")
                    .map(function (value, key) {
                        return {
                            Key: key,
                            Count: _.sum(_.pluck(value, "Toplam"))
                        }
                    })
                    .value();
                return _.sortBy(result, "Key");
            });
    };

    //endregion

    /**
     * Kuruma ait teklif olup olmadığını bulabiliriz. Bunun sonucunda temp oluşturulur, bu nedenle önce bu metod çağırılmalı
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _para_id
     * @param {integer} _onay_id
     * @returns {*}
     */
    var f_db_kurum_teklif_temp = function (_tahta_id, _kurum_id, _para_id, _onay_id) {
        //kurumun verdiği teklif id lerini içeren temp oluştur
        return result.dbQ.exists(result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id))
            .then(function (_iExist) {
                if (_iExist) {
                    return 1;
                } else {
                    return result.dbQ.sinterstore(result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id),
                        result.kp.kurum.ssetTeklifleri(_kurum_id),
                        result.kp.tahta.ssetTeklifleri(_tahta_id, true));
                }
            })
            .then(function () {
                if (_para_id && _para_id > 0 && _para_id != null) {
                    //teklif tarihine göre x para birimli kurum teklifleri temp i oluştur
                    var anahtar = result.kp.temp.zsetKurumTeklifleriParaBirimli(_tahta_id, _kurum_id, _para_id);
                    return result.dbQ.exists(anahtar)
                        .then(function (_iExist) {
                            if (_iExist) {
                                return 1;
                            } else {
                                return result.dbQ.zinterstore(anahtar, 2, result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id), result.kp.teklif.ssetTeklifParaBirimli(_para_id))
                            }
                        });
                } else {
                    return 1;
                }
            })
            .then(function () {
                if (_onay_id && _onay_id > 0 && _onay_id != null) {
                    //teklif tarihine göre x onay durumlu kurum teklifleri temp i oluştur
                    var anahtar = result.kp.temp.zsetKurumTeklifleriOnayDurumunaGore(_tahta_id, _kurum_id, _onay_id);
                    return result.dbQ.exists(anahtar)
                        .then(function (_iExist) {
                            if (_iExist) {
                                return 1;
                            } else {
                                return result.dbQ.zinterstore(anahtar, 2, result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id), result.kp.teklif.ssetTeklifOnayDurumlari(_onay_id))
                            }
                        });
                } else {
                    return 1;
                }
            })
            .then(function () {
                return result.dbQ.smembers(result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id));
            });
    };

    //region kurumun teklif verdiği ürünler
    /**
     * Tahtada kurumun ürüne verdiği teklifleri getirir
     * Eğer tümünü görmek istiyorsa _iAdet değeri 0 gönderilmelidir. Yoksa adet kadar kayıdı getirecektir.
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _urun_id
     * @param {integer} _iAdet
     * @param {integer} _para_id
     * @param {integer} _onay_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_urune_verdigi_teklifler = function (_tahta_id, _kurum_id, _urun_id, _iAdet, _para_id, _onay_id, _tarih1, _tarih2) {
        var teklif = require('./db_teklif');

        //kurumun verdiği teklifleri buluyoruz
        return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, _onay_id, _para_id, _tarih1, _tarih2)
            .then(function (_teklif_idler) {
                //ürünle verilen teklifleri bul
                return result.dbQ.smembers(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id))
                    .then(function (_urun_teklif_idler) {
                        if (_urun_teklif_idler && _urun_teklif_idler.length > 0) {
                            //iki setin kesişimi kurumun ürün için verdiği teklifleri verir

                            var kurumun_urune_verdigi_teklifler = _.intersection(_teklif_idler, _urun_teklif_idler);

                            var idler = (_iAdet && _iAdet > 0)
                                ? _.takeRight(kurumun_urune_verdigi_teklifler, _iAdet)//son x adedi getirmesi sağlanır
                                : kurumun_urune_verdigi_teklifler;

                            /** @type {OptionsTeklif} */
                            var opts = teklif.OptionsTeklif({
                                bArrUrunler: false,
                                bKalemBilgisi: false,
                                bIhaleBilgisi: false,
                                bKurumBilgisi: false
                            });
                            var db_teklif = require('./db_teklif');
                            return db_teklif.f_db_teklif_id(idler, _tahta_id, opts);
                        } else {
                            return [];
                        }
                    });
            });
    };

    /**
     * Tahtada kurumun ürüne verdiği teklif fiyatlarını getirir
     * Eğer tümünü görmek istiyorsa _iAdet değeri 0 gönderilmelidir. Yoksa adet kadar kayıdı getirecektir.
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _urun_id
     * @param {integer} _iAdet
     * @param {integer} _para_id
     * @param {integer} _onay_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_urune_verdigi_teklif_fiyatlari = function (_tahta_id, _kurum_id, _urun_id, _iAdet, _para_id, _onay_id, _tarih1, _tarih2) {
        return f_db_kurumun_urune_verdigi_teklifler(_tahta_id, _kurum_id, _urun_id, _iAdet, _para_id, _onay_id, _tarih1, _tarih2)
            .then(function (_teklifler) {
                return {
                    Tarih: _.pluck(_teklifler, "Ihale.IhaleTarihi"),
                    Fiyat: _.pluck(_teklifler, "Fiyat")
                };
            });
    };

    //endregion

    //region kurumun teklif verdiği kalemler
    /**
     * Kurumun teklif verdiği kalem_id leri buluyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklif_verdigi_kalem_idler = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {

        return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
            .then(function (_teklif_idler) {
                if (_teklif_idler && _teklif_idler.length > 0) {
                    //teklif id lerin bağlı oldugu kalem idleri bul
                    return result.dbQ.hmget(result.kp.teklif.hsetKalemleri, _teklif_idler);
                } else {
                    return [];
                }
            });
    };

    /**
     * Kurumun teklif verdiği kalemleri buluyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklif_verdigi_kalemler = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        //kurumun teklif_id lerini bul
        return f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
            .then(function (_kalem_idler) {
                if (_kalem_idler && _kalem_idler.length > 0) {
                    //teklif id lerin bağlı oldugu kalemleri bul
                    var db_kalem = require('./db_kalem');
                    return db_kalem.f_db_kalem_id(_kalem_idler, _tahta_id);

                } else {
                    return [];
                }
            });
    };

    /**
     * Kurumun teklif verdiği kalemleri buluyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _para_id
     * @returns {*}
     */
    var f_db_kurumun_teklif_verdigi_kalemler_toplami = function (_tahta_id, _kurum_id, _para_id) {
        //kurumun teklif_id lerini bul
        return result.dbQ.Q.all([
            f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.TEKLIF, _para_id),
            f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.KAZANDI, _para_id),
            f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.REDDEDILDI, _para_id),
            f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI, _para_id)
        ]).then(function (_arrPromises) {
            var sonuc = [];
            sonuc.push({Durumu: "Teklif", Toplam: _arrPromises[0].length});
            sonuc.push({Durumu: "Kazandı", Toplam: _arrPromises[1].length});
            sonuc.push({Durumu: "Reddedildi", Toplam: _arrPromises[2].length});
            sonuc.push({Durumu: "İhaleden Atıldı", Toplam: _arrPromises[3].length});
            return sonuc;
        });
    };

    //endregion

    //region kurumun teklif verdiği ihaleler

    /**
     * Kurumun teklif verdiği ihale idlerini döner
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklif_verdigi_ihale_idler = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {

        //kurumun teklif_id lerini bul
        return f_db_kurumun_teklif_verdigi_kalem_idler(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
            .then(function (_kalem_idler) {

                if (_kalem_idler && _kalem_idler.length > 0) {
                    //kalem id erin bağlı oldukları ihale id lerini bul
                    return result.dbQ.hmget(result.kp.kalem.hsetIhaleleri, _kalem_idler)
                        .then(function (_ihale_idler) {
                            //bir ihaleye bağlı birden fazla kalem olduğu için ve kaleme bağlı ihaleleri getirdiğimiz için
                            //aynı ihale_idler listesi dönecektir.bunları sadeleştirerek dönmeliyiz
                            return _.uniq(_ihale_idler);
                        });
                } else {
                    return [];
                }
            });
    };

    /**
     * Kurumun teklif verdiği ihale bilgilerini döner
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklif_verdigi_ihaleler = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        //kurumun teklif_id lerini bul
        return f_db_kurumun_teklif_verdigi_ihale_idler(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
            .then(function (_ihale_idleri) {
                if (_ihale_idleri && _ihale_idleri.length > 0) {
                    return result.dbQ.hmget_json_parse(result.kp.ihale.tablo, _ihale_idleri);
                }
                else {
                    return [];
                }
            });
    };

    var f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari = function (_tahta_id, _kurum_id, _onay_id, _para_id, _tarih1, _tarih2) {

        //1 kurumun tekliflerini temp ile oluşturuyoruz
        //2 tahtanın tarih aralığındaki ihalelerini çekiyoruz
        //2.1 her bir ihale için kurumun teklifi var mı diye sorguluyoruz
        //2.2 varsa ihalenin tarihini Key olarak Toplamı ise 1 olarak atıyoruz
        //2.2 yoksa Key>ihale tarihi Toplam>0 olarak atıyoruz
        //3 sonucu tarihe göre gruplayıp o gün kaç ihale oldugunu buluyoruz
        //4 tarihe göre sıralıyoruz

        var db_ihale = require("./db_ihale");

        return result.dbQ.Q.all([
            f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, _onay_id, _para_id, _tarih1, _tarih2),//1
            db_ihale.f_db_ihale_idler_aktif_tarih_araligindakiler(_tahta_id, _tarih1, _tarih2)//2
        ]).then(function (_ress) {
            var ihale_idler = _ress[1];

            return result.dbQ.hmget_json_parse(result.kp.ihale.tablo, ihale_idler)
                .then(function (ihaleler) {
                    if (ihaleler && ihaleler.length > 0) {
                        var arr = _.map(ihaleler, function (_ihale) {

                            return (_onay_id && _onay_id > 0 && _onay_id != null && _onay_id != ""
                                ?
                                result.dbQ.sinter(
                                    result.kp.ihale.ssetTeklifleri(_ihale.Id),
                                    result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id),
                                    result.kp.teklif.ssetTeklifOnayDurumlari(_onay_id),
                                    result.kp.teklif.ssetTeklifParaBirimli(_para_id))
                                :
                                result.dbQ.sinter(
                                    result.kp.ihale.ssetTeklifleri(_ihale.Id),
                                    result.kp.teklif.ssetTeklifParaBirimli(_para_id),
                                    result.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _kurum_id)))
                                .then(function (_iteklif_idler) {
                                    return {
                                        Key: _ihale.IhaleTarihi,
                                        Count: (_iteklif_idler && _iteklif_idler.length > 0)
                                            ? 1//2.1
                                            : 0//2.2
                                    };
                                });
                        });
                        return result.dbQ.Q.all(arr);
                    } else {
                        return [];
                    }
                });

        }).then(function (_result) {

            //3 buraya ihale tarihinde teklif atılmış ise teklif toplamları gelir
            //şimdi günlere göre gruplayarak tekliflerin toplamlarını sum ile hesaplamalıyız.
            if (_result && _result.length > 0) {
                var result = _.chain(_result)
                    .groupBy("Key")
                    .map(function (value, key) {
                        return {
                            Key: key,
                            Count: _.sum(_.pluck(value, "Count"))
                        }
                    })
                    .value();
                return _.sortBy(result, "Key");//4
            } else {
                return [];
            }
        });
    };

    var f_db_kurumun_teklif_verdigi_ihaleler_toplami = function (_tahta_id, _kurum_id, _tarih1, _tarih2, _para_id) {

        return result.dbQ.Q.all([
            f_db_kurumun_teklif_verdigi_ihaleler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.TEKLIF, _para_id, _tarih1, _tarih2),
            f_db_kurumun_teklif_verdigi_ihaleler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.KAZANDI, _para_id, _tarih1, _tarih2),
            f_db_kurumun_teklif_verdigi_ihaleler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.REDDEDILDI, _para_id, _tarih1, _tarih2),
            f_db_kurumun_teklif_verdigi_ihaleler(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI, _para_id, _tarih1, _tarih2)

        ]).then(function (_arrPromises) {
            var sonuc = [];

            sonuc.push({Durumu: "Teklif", Toplam: _arrPromises[0].length});
            sonuc.push({Durumu: "Kazandı", Toplam: _arrPromises[1].length});
            sonuc.push({Durumu: "Reddedildi", Toplam: _arrPromises[2].length});
            sonuc.push({Durumu: "İhaleden Atıldı", Toplam: _arrPromises[3].length});

            return sonuc;
        })
    };

    //endregion


    var f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {

        return f_db_kurumun_teklif_verdigi_ihaleler(_tahta_id, _kurum_id, _onay_durum_id, _para_id)
            .then(function (_ihaleler) {
                return _ihaleler.groupX("IhaleTarihi", "Id");
            })
            .then(function (_gruplanmis) {
                if (_tarih1 && _tarih2) {
                    return _.filter(_gruplanmis, function (_elm) {
                        return _elm.Key >= _tarih1 && _elm.Key <= _tarih2;
                    });
                } else {
                    return _gruplanmis;
                }
            });
    };


    /**
     * Genel onay durumuna  (kazandı-iptal..vb) ve para birimine (tl-eur) göre kurumun teklif idlerini döner
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklif_idleri = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {
        _tarih1 = _tarih1 || "-inf";
        _tarih2 = _tarih2 || "+inf";

        return f_db_kurum_teklif_temp(_tahta_id, _kurum_id, _para_id, _onay_durum_id)
            .then(function () {
                if (_onay_durum_id && _onay_durum_id > 0 && _onay_durum_id != null) {
                    var anahtar1 = result.kp.temp.zsetKurumTeklifleriOnayDurumunaGore(_tahta_id, _kurum_id, _onay_durum_id),
                        anahtar2 = result.kp.temp.zsetKurumTeklifleriParaBirimli(_tahta_id, _kurum_id, _para_id);

                    return result.dbQ.zinterstore("temp_ktop", 2, anahtar1, anahtar2)
                        .then(function () {
                            return result.dbQ.zrangebyscore("temp_ktop", _tarih1, _tarih2);
                        });

                } else {
                    return result.dbQ.zrangebyscore(result.kp.temp.zsetKurumTeklifleriParaBirimli(_tahta_id, _kurum_id, _para_id), _tarih1, _tarih2);
                }
            });
    };

    /**
     * Genel onay durumuna göre (kazandı-iptal..vb) kurumun tekliflerini döner
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @param {boolean} _bTumTeklifBilgileriyle
     * @returns {*}
     */
    var f_db_kurumun_teklifleri_detay = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2, _bTumTeklifBilgileriyle) {
        return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
            .then(function (_teklif_idler) {
                if (_teklif_idler && _teklif_idler.length > 0) {

                    /** @type {OptionsTeklif} */
                    var opts = teklif.OptionsTeklif(_bTumTeklifBilgileriyle
                        ? {}
                        : {
                        bArrUrunler: false,
                        bKalemBilgisi: false,
                        bIhaleBilgisi: false,
                        bKurumBilgisi: false
                    });
                    var db_teklif = require('./db_teklif');
                    return db_teklif.f_db_teklif_id(_teklif_idler, _tahta_id, opts);

                } else {
                    return [];
                }
            });
    };


    /**
     * İki tarih aralığındaki kurumun teklif verdiği teklif bilgilerini döner
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @param {integer} _onay_durum_id
     * @param {integer} _para_id
     * @param {integer} _tarih1
     * @param {integer} _tarih2
     * @returns {*}
     */
    var f_db_kurumun_teklifleri_toplam = function (_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2) {

        if (_onay_durum_id && _onay_durum_id > 0 && _onay_durum_id != null) {
            //gelen onay durumuna bağlı teklif toplamı

            return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, _onay_durum_id, _para_id, _tarih1, _tarih2)
                .then(function (_teklif_idler) {
                    var durum = SABIT.ONAY_DURUM.teklif.whereX("Id", _onay_durum_id).KisaAdi;
                    return [{Durumu: durum, Toplam: _teklif_idler.length}];
                });

        } else {
            //tüm onay durumlarına göre teklif toplamlarını oluştur

            return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.TEKLIF, _para_id, _tarih1, _tarih2)
                .then(function (_teklif_idler) {
                    return [{Durumu: "Teklif", Toplam: _teklif_idler.length}];
                })
                .then(function (_arr) {
                    return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.KAZANDI, _para_id, _tarih1, _tarih2)
                        .then(function (_teklif_idler) {
                            _arr.push({Durumu: "Kazandı", Toplam: _teklif_idler.length});
                            return _arr;
                        });
                })
                .then(function (_arr) {
                    return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.REDDEDILDI, _para_id, _tarih1, _tarih2)
                        .then(function (_teklif_idler) {
                            _arr.push({Durumu: "Reddedildi", Toplam: _teklif_idler.length});
                            return _arr;
                        });
                })
                .then(function (_arr) {
                    return f_db_kurumun_teklif_idleri(_tahta_id, _kurum_id, SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI, _para_id, _tarih1, _tarih2)
                        .then(function (_teklif_idler) {
                            _arr.push({Durumu: "İhaleden Atıldı", Toplam: _teklif_idler.length});
                            return _arr;
                        });
                })
                .then(function (_arr) {
                    l.info("oluşan arr>" + JSON.stringify(_arr));
                    return _arr;
                });
        }
    };

    //endregion

    //region KURUMUN ÜRÜNLERİ

    /**
     * Kuruma ait sistemde kayıtlı ürünleri getirir
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     * @returns {*}
     */
    var f_db_kurum_urun_tumu = function (_tahta_id, _kurum_id) {

        return result.dbQ.smembers(result.kp.kurum.ssetUrunleri(_tahta_id, _kurum_id))
            .then(function (_urun_idleri) {
                var db_urun = require("./db_urun");
                /** @type {OptionsUrun} */
                var opt = {};
                opt.bArrAnahtarKelimeler = true;
                opt.bArrIliskiliFirmalar = true;
                opt.bUreticiKurum = false;

                return db_urun.f_db_urun_id(_urun_idleri, _tahta_id, opt);
            })
            .fail(function (_err) {
                l.info("HATA ALINDI " + _err);
                return _err;
            });
    };

    //endregion

    //region KURUM EKLE-SİL-GÜNCELLE-BUL-TÜMÜ

    /**
     * Tüm aktif kurumların ID bilgilerini döner
     * @param _tahta_id
     * @param _sayfalama
     * @returns {Array}
     */
    var f_db_aktif_kurum_idleri = function (_tahta_id, _sayfalama) {
        var defer = result.dbQ.Q.defer();

        var multi = result.rc.multi(),
            sonucAnahtari = _tahta_id && _tahta_id > 0
                ? result.kp.temp.ssetTahtaKurum(_tahta_id)
                : result.kp.temp.ssetKurum;


        result.dbQ.exists(sonucAnahtari)
            .then(function (_iExist) {

                if (_iExist) {
                    //temp anahtarı var yeniden çekmeye gerek yok, kurum bilgilerini dön
                } else {
                    //temp anahtarı yok oluştur ve kurum bilgilerini dön

                    //temp:kurum:genel:aktif = kurum:genel - kurum:X
                    multi.sdiffstore(result.kp.temp.ssetKurum, result.kp.kurum.ssetGenel, result.kp.kurum.ssetSilinen);

                    if (_tahta_id && _tahta_id > 0) {
                        multi.sunionstore(result.kp.temp.ssetTahtaKurumTumu(_tahta_id), result.kp.temp.ssetKurum, result.kp.tahta.ssetOzelKurumlari(_tahta_id, true))
                            .sunionstore(result.kp.temp.ssetTahtaKurumIstenmeyen(_tahta_id), result.kp.tahta.ssetOzelKurumlari(_tahta_id, false), result.kp.tahta.ssetGizlenenKurumlari(_tahta_id), result.kp.tahta.ssetEzilenKurumlari(_tahta_id))
                            .sdiffstore(result.kp.temp.ssetTahtaKurum(_tahta_id), result.kp.temp.ssetTahtaKurumTumu(_tahta_id), result.kp.temp.ssetTahtaKurumIstenmeyen(_tahta_id));
                    }
                }

                multi.exec(function (err, replies) {
                    if (err) {
                        l.e("Kurumlar çekilemedi. MULTI ERROR: " + err);
                        defer.reject(err);
                    }
                    l.info("MULTI REPLY:" + replies);

                    if (_sayfalama) {
                        var baslangic = _sayfalama.Sayfa * _sayfalama.SatirSayisi,
                            bitis = _sayfalama.SatirSayisi;
                    }

                    (_sayfalama
                        ? result.dbQ.sort(sonucAnahtari, "LIMIT", baslangic, bitis)
                        : result.dbQ.smembers(sonucAnahtari))
                        .then(function (_dbReply) {
                            defer.resolve(_dbReply);
                        }).fail(function (_err) {
                        l.e("Kurumlar çekilemedi. Hata: " + _err);
                        defer.reject(_err);
                    });
                });
            });


        return defer.promise;
    };

    /**
     * Bu metod genel kurumları veya
     * tahtalaya bağlı tüm >> özel + (aktif genel - silinen genel) - (ezilen genel + silinen özel+gizlenen özel) kurumları getirir
     * @param {integer} _tahta_id
     * @param {integer} _sayfalama
     * @returns {*}
     */
    var f_db_kurum_tumu = function (_tahta_id, _sayfalama) {
        l.info("f_db_kurum_tumu");
        return f_db_aktif_kurum_idleri(_tahta_id, _sayfalama)
            .then(function (_arrKurumId) {
                var sonucAnahtari = _tahta_id && _tahta_id > 0
                        ? result.kp.temp.ssetTahtaKurum(_tahta_id)
                        : result.kp.temp.ssetKurum,
                    sonuc = schema.f_create_default_object(SABIT.SCHEMA.LAZY_LOADING_RESPONSE);

                return _arrKurumId.length == 0
                    ? sonuc
                    : result.dbQ.scard(sonucAnahtari)
                    .then(function (_toplamKayitSayisi) {
                        sonuc.ToplamKayitSayisi = _toplamKayitSayisi;

                        return f_db_kurum_id(_arrKurumId)
                            .then(function (_dbKurumlar) {
                                sonuc.Data = _dbKurumlar;
                                return sonuc;
                            });
                    });
            });
    };

    var f_db_kurum_tahta_aktif = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true))
            .then(function (_arrKurumId) {
                if (_arrKurumId && _arrKurumId.length > 0) {
                    return f_db_kurum_id(_arrKurumId);
                    //return result.dbQ.hmget_json_parse(result.kp.kurum.tablo, _arrKurumId);
                } else {
                    return [];
                }
            });
    };

    var f_db_kurum_adlari_adi = function (_kurumAdi) {
        return result.dbQ.sscan(result.kp.kurum.ssetAdlari, '0', 'match', _kurumAdi)
            .then(function (_res) {
                var sonuc = JSON.parse(JSON.stringify(_res));
                if (sonuc[1].length > 0) {
                    return sonuc[1][1];
                } else {
                    return 0;
                }
            }).then(function (_kurum_id) {
                if (_kurum_id > 0) {
                    l.info("çekilen kurum_id: " + _kurum_id);
                    return result.f_db_kurum_id(_kurum_id);
                }
            });
    };

    /**
     * Kurum bilgisini döner
     * @param {integer|integer[]|string|string[]} kurum_id
     * @returns {*}
     */
    var f_db_kurum_id = function (kurum_id) {
        //kurumu buluyoruz

        return (Array.isArray(kurum_id)
            ? result.dbQ.hmget_json_parse(result.kp.kurum.tablo, kurum_id)
            : result.dbQ.hget_json_parse(result.kp.kurum.tablo, kurum_id))
            .then(function (_dbKurum) {
                if (!_dbKurum) {
                    return null;

                } else {

                    var f_kurum_bilgisi = function (_kurum) {

                        var /** @type {Kurum} */
                        olusan_kurum = schema.f_create_default_object(SABIT.SCHEMA.KURUM);

                        olusan_kurum = extend(olusan_kurum, _kurum);
                        return olusan_kurum;
                    };

                    if (Array.isArray(_dbKurum)) {
                        return _dbKurum.map(f_kurum_bilgisi).allX()
                    } else {
                        return f_kurum_bilgisi(_dbKurum);
                    }
                }
            });
    };


    /**
     * Kurum ekleme tek tek de olabilir array şeklinde de olabilir.
     * Gelen parametrenin tipine göre kontrol edilip kurumlar eklenebilir.
     * Genel veya tahtaya ait özel kurum olup olmama durumuna göre eklenir.
     * @param {KurumDB|KurumDB[]} _kurum
     * @param {integer=} _tahta_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    var f_db_kurum_ekle = function (_kurum, _tahta_id, _kul_id) {

        /**
         *
         * @param {KurumDB|KurumDB[]} _kurum
         * @param _tahta_id
         * @param _kul_id
         * @returns {*}
         */
        var f_kurum_ekle = function (_kurum, _tahta_id, _kul_id) {

            return result.dbQ.incr(result.kp.kurum.idx)
                .then(
                    /**
                     * Kurumun db'deki ID degeri
                     * @param {Integer} _yeniKurumId
                     * @returns {*}
                     */
                    function (_yeniKurumId) {
                        _kurum.Id = _yeniKurumId;

                        return result.dbQ.Q.all([
                            result.dbQ.hset(result.kp.kurum.tablo, _yeniKurumId, JSON.stringify(_kurum)),
                            result.dbQ.sadd(result.kp.kurum.ssetAdlari, _kurum.Adi)
                        ]).then(function () {
                            /**
                             * Ilerleyen zamanda bunu dbden çekerek eşsiz olacak şekilde gireceğim
                             */
                            if (_kurum.IlAdi) {
                                result.dbQ.sadd(result.kp.sehir.ssetAdlari, _kurum.IlAdi);
                            }

                            if (_kurum.BolgeAdi) {
                                result.dbQ.sadd(result.kp.bolge.ssetAdlari, _kurum.BolgeAdi);
                            }

                            if (_kurum.UlkeAdi) {
                                result.dbQ.sadd(result.kp.ulke.ssetAdlari, _kurum.UlkeAdi);
                            }

                            return 1;

                        }).then(function () {
                            return _tahta_id && _tahta_id > 0
                                ? result.dbQ.sadd(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true), _yeniKurumId)
                                : result.dbQ.sadd(result.kp.kurum.ssetGenel, _yeniKurumId);
                        }).then(function () {
                            return f_db_kurum_id(_yeniKurumId)
                                .then(function (_resKurum) {
                                    emitter.emit(SABIT.OLAY.KURUM_EKLENDI, _resKurum, _yeniKurumId, _tahta_id, _kul_id);
                                    return _resKurum;
                                });
                        }).fail(function (_err) {
                            ssr = [{"Kurum ekleme hatalı > _err": _err}];
                        });
                    });
        };

        if (Array.isArray(_kurum)) {
            return _kurum.mapX(null, f_kurum_ekle, _tahta_id, _kul_id).allX();

        } else {
            return f_kurum_ekle(_kurum, _tahta_id, _kul_id);
        }
    };


    /**
     * Genel kurum bilgisi ezilip, Tahtaya yeni (özel) kurum eklenmesi sağlanır. Geriye yeni oluşan veya mevcut özel kurum bilgisi promise döner.
     * Bunu her kurum işleminden önce çağırmalıyız.
     * Özel kurum ise yeni kurum bilgileri hash e eklenerek geriye yeni bilgileri ile döner
     *
     * Kurumun güncellemesi adım adım şöyledir
     * 1-eski kurum_id si tahtanın ezilen kurumları setine eklenir
     * 2-yeni kurum eklenir
     * 3-tahtanın kurumları setine eklenir
     * @param {integer} _tahta_id
     * @param {object} _es_kurum
     * @param {object} _db_kurum
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_kurum_guncelle = function (_tahta_id, _es_kurum, _db_kurum, _kul_id) {
        return f_db_kurum_genel_kontrol(_db_kurum.Id)
            .then(function (_iGenelKurum) {
                if (_iGenelKurum == 1) {
                    //bu tahtaya ait kurum değil-ihale merkezinden çekilen genel kurumdur.
                    var eski_kurum_id = _db_kurum.Id;

                    //tahta ezilen kurumu olarak belirle - tahtanın özel kurumlarından çıkar
                    return result.dbQ.Q.all([
                        result.dbQ.srem(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true), eski_kurum_id),
                        result.dbQ.sadd(result.kp.tahta.ssetEzilenKurumlari(_tahta_id), eski_kurum_id)

                    ]).then(function () {

                        return result.dbQ.incr(result.kp.kurum.idx)
                            .then(function (_yeni_kurum_id) {
                                _es_kurum.Id = _db_kurum.Id = _yeni_kurum_id;

                                emitter.emit(SABIT.OLAY.KURUM_EKLENDI, _es_kurum, _tahta_id, _kul_id);

                                return result.dbQ.hset(result.kp.kurum.tablo, _db_kurum.Id, JSON.stringify(_db_kurum))
                                    .then(function (_arrReply) {
                                        return result.dbQ.Q.all([
                                            result.dbQ.sadd(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true), _yeni_kurum_id),
                                            result.dbQ.sadd(result.kp.kurum.ssetAdlari, _db_kurum.Adi)
                                        ]).then(function (_res) {

                                            if (_db_kurum.IlAdi) {
                                                result.dbQ.sadd(result.kp.sehir.ssetAdlari, _db_kurum.IlAdi);
                                            }

                                            if (_db_kurum.BolgeAdi) {
                                                result.dbQ.sadd(result.kp.bolge.ssetAdlari, _db_kurum.BolgeAdi);
                                            }

                                            if (_db_kurum.UlkeAdi) {
                                                result.dbQ.sadd(result.kp.ulke.ssetAdlari, _db_kurum.UlkeAdi);
                                            }

                                            return 1;
                                        });
                                    })
                                    .then(function () {
                                        return f_db_kurum_id(_yeni_kurum_id);
                                    });
                            });
                    }).fail(function (_err) {
                        console.error("Kurum ekleme işlemi başarılamadı..! HATA: " + _err);
                        throw new exception.istisna("Kurum eklenemedi", "Kurum ekleme işlemi tamamlanamadı. Hata alındı:" + _err);
                    });
                } else {
                    //bu tahtaya ait özel kurumdur.

                    emitter.emit(SABIT.OLAY.KURUM_GUNCELLENDI, _es_kurum, _tahta_id, _kul_id);

                    //bu durumda son haliyle hset e ekle kendisini geri dön
                    return result.dbQ.hset(result.kp.kurum.tablo, _db_kurum.Id, JSON.stringify(_db_kurum))
                        .then(function () {
                            result.dbQ.sadd(result.kp.kurum.ssetAdlari, _db_kurum.Adi);

                            if (_db_kurum.IlAdi) {
                                result.dbQ.sadd(result.kp.sehir.ssetAdlari, _db_kurum.IlAdi);
                            }

                            if (_db_kurum.BolgeAdi) {
                                result.dbQ.sadd(result.kp.bolge.ssetAdlari, _db_kurum.BolgeAdi);
                            }

                            if (_db_kurum.UlkeAdi) {
                                result.dbQ.sadd(result.kp.ulke.ssetAdlari, _db_kurum.UlkeAdi);
                            }

                            return 1;
                        })
                        .then(function () {
                            return f_db_kurum_id(_db_kurum.Id);
                        });
                }
            });
    };

    /**
     * Gelen kurum_id genel kurum setinde ise 1 değilse 0 döner
     * @param {integer} _kurum_id
     * @returns {*}
     */
    var f_db_kurum_genel_kontrol = function (_kurum_id) {
        return result.dbQ.sismember(result.kp.kurum.ssetGenel, _kurum_id);
    };

    /**
     * Kurum silme işlemi
     * @param _tahta_id
     * @param _kurum_id
     * @param _kul_id
     * @returns {*}
     */
    var f_db_kurum_sil = function (_tahta_id, _kurum_id, _kul_id) {
        if (_kurum_id > 0) {

            return f_db_kurum_genel_kontrol(_kurum_id)
                .then(function (_iGenel) {
                    if (_iGenel == 1) {
                        //genel kurum silinemez
                        throw new exception.istisna("Kurum Silinemedi!", "Silinmek istenen kurum GENEL kurumlar içerisinde kayıtlı olduğu için işlem tamamlanamadı!");

                    } else {
                        //özel kurum silinebilir
                        return result.dbQ.Q.all([
                            result.dbQ.srem(result.kp.tahta.ssetOzelKurumlari(_tahta_id, true), _kurum_id),
                            result.dbQ.sadd(result.kp.tahta.ssetOzelKurumlari(_tahta_id, false), _kurum_id)

                        ]).then(function () {
                            emitter.emit(SABIT.OLAY.KURUM_SILINDI, _kurum_id, _tahta_id, _kul_id);

                            //kurumun tekliflerini bul ve sil
                            return result.dbQ.smembers(result.kp.kurum.ssetTeklifleri(_kurum_id))
                                .then(function (_iTeklif_idler) {
                                    if (_iTeklif_idler.length > 0) {

                                        return result.dbQ.Q.all([
                                            result.dbQ.hdel(result.kp.teklif.hsetKurumlari, _iTeklif_idler),
                                            result.dbQ.srem(result.kp.kurum.ssetTeklifleri(_kurum_id), _iTeklif_idler)
                                        ]);
                                    }
                                    return _kurum_id;
                                });
                        });
                    }
                });

        } else {
            l.e("Silinecek kurum bilgisi bulunamadı");
            throw new exception.istisna("Kurum Silinemedi!", "Silinmek istenen kurum bulunamadı! Tekrar deneyiniz.");
        }
    };

    /**
     * Eğer ihaleDunyasi_kurum_id daha önce kaydedilmemişse kayıt edeceğiz
     * @param {KurumDB} _db_kurum
     * @param {integer|string} _iIhaleDunyasiKurumId
     * @returns {Promise}
     */
    var f_db_kurum_ekle_ihaleDunyasindan = function (_db_kurum, _iIhaleDunyasiKurumId) {

        // İhaleDünyası kurum_id si ile bakalım, kurum sistemde kayıtlı mı?
        return result.dbQ.hget(result.kp.kurum.hsetKurum_ihaleDunyasiId, _iIhaleDunyasiKurumId)
            .then(function (_yeniKurumId) {

                // Eğer sistemde kayıtlıysa _yeniKurumId boş gelmeyecek
                return _yeniKurumId // Kayıtlı
                    ? f_db_kurum_id(_yeniKurumId)
                    : f_db_kurum_ekle(_db_kurum, 0, 0)
                    .then(function (_kurum) { // Kaydedilecek
                        // Gelen kurum_id değerini bizim Kurum.Id ile İhale Dünyası kurumlarına da ekleyelim.
                        result.dbQ.hset(result.kp.kurum.hsetKurum_ihaleDunyasiId, _iIhaleDunyasiKurumId, _kurum.Id);
                        return _kurum;
                    });
            });
    };

    //endregion

    //region TAHTALAR ARASI PAYLAŞ
    /**
     * Tahtalar arasında özel kurumların paylaşılması sağlanır.
     * @param {{To:integer[], From:integer,Ids:integer[]}} _paylas
     * @returns {*}
     */
    var f_db_kurum_paylas = function (_paylas) {
        l.info("f_db_kurum_paylas");
        /**
         *
         * @param {integer|integer[]} _to
         * @param {integer} _from
         * @param {integer[]} _ids
         * @returns {*}
         */
        var f_kurum_paylas = function (_to, _from, _ids) {
            return result.dbQ.Q.all([
                result.dbQ.del(result.kp.temp.ssetTahtaKurum(_to)),
                result.dbQ.sadd(result.kp.tahta.ssetOzelKurumlari(_to, true), _ids)
            ]);
        };

        if (Array.isArray(_paylas.To) && _paylas.To.length > 0) {
            /*    var arr = _paylas.To.map(function (_elm) {
             return f_kurum_paylas(_paylas.From, _elm, _paylas.Ids);
             });

             return result.dbQ.Q.all(arr);*/

            return _paylas.To.mapX(null, f_kurum_paylas, _paylas.From, _paylas.Ids).allX();

        } else {
            return f_kurum_paylas(_paylas.To, _paylas.From, _paylas.Ids);
        }
    };


    //endregion

    //region KURUMU GİZLE/GİZLEME
    /**
     * Kullanıcı tahtada gizlediği kurumu tekrardan listede görmek isterse geri alıyoruz
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     */
    var f_db_tahta_kurum_gizlenen_sil = function (_tahta_id, _kurum_id) {
        return result.dbQ.srem(result.kp.tahta.ssetGizlenenKurumlari(_tahta_id), _kurum_id)
            .then(function () {
                emitter.emit(SABIT.OLAY.KURUM_GIZLENDI, _kurum_id, _tahta_id);
                return _kurum_id;
            });
    };

    /**
     * Kullanıcı tahtada görmek istemediği kurum gizleyebilir, böylece listede gizlenenler görünmeyecektir.
     * @param {integer} _tahta_id
     * @param {integer} _kurum_id
     */
    var f_db_tahta_kurum_gizlenen_ekle = function (_tahta_id, _kurum_id) {
        return result.dbQ.sadd(result.kp.tahta.ssetGizlenenKurumlari(_tahta_id), _kurum_id)
            .then(function () {
                emitter.emit(SABIT.OLAY.KURUM_GIZLENDI, _kurum_id, _tahta_id);
                return _kurum_id;
            });
    };

    /**
     * Kullanıcı tahtada görmek istemediği kurum listesini dönüyoruz.
     * @param {integer} _tahta_id
     */
    var f_db_kurum_gizlenen_tumu = function (_tahta_id) {
        return f_db_kurum_gizlenen_idler(_tahta_id)
            .then(function (_kurum_idler) {
                if (_kurum_idler && _kurum_idler.length > 0) {
                    return f_db_kurum_id(_kurum_idler);
                } else {
                    return [];
                }
            });
    };

    /**
     * Gizlenen kurum toplamını getirir
     * @param _tahta_id
     * @returns {*}
     */
    var f_db_kurum_gizlenen_toplami = function (_tahta_id) {

        return result.dbQ.exists(result.kp.temp.ssetTahtaKurumTumu(_tahta_id))
            .then(function (_iExist) {
                return (_iExist
                    ? 1//temp var devam
                    : f_db_aktif_kurum_idleri(_tahta_id));//temp kurum yaratmak için çağırmalıyız
            })
            .then(function () {
                return result.dbQ.Q.all([
                    f_db_kurum_gizlenen_idler(_tahta_id),
                    result.dbQ.scard(result.kp.temp.ssetTahtaKurumTumu(_tahta_id))

                ]).then(function (_ress) {

                    var sonuc = schema.f_create_default_object(SABIT.SCHEMA.GRAFIK_DONUT);
                    var gecerli = parseInt(_ress[0].length || 0),
                        toplam = parseInt(_ress[1] || 0);
                    sonuc.Toplam = toplam;
                    sonuc.Gecerli = gecerli;
                    sonuc.Gecersiz = toplam - gecerli;
                    return sonuc;
                });
            })
    };

    var f_db_kurum_gizlenen_idler = function (_tahta_id) {
        return result.dbQ.smembers(result.kp.tahta.ssetGizlenenKurumlari(_tahta_id));
    };
    //endregion

    /**
     * @class DBKurum
     */
    result = {
        f_db_kurum_gizlenen_idler: f_db_kurum_gizlenen_idler,
        f_db_tahta_kurum_gizlenen_sil: f_db_tahta_kurum_gizlenen_sil,
        f_db_tahta_kurum_gizlenen_ekle: f_db_tahta_kurum_gizlenen_ekle,
        f_db_kurum_gizlenen_toplami: f_db_kurum_gizlenen_toplami,
        f_db_kurum_gizlenen_tumu: f_db_kurum_gizlenen_tumu,
        f_db_kurumun_urune_verdigi_teklifler: f_db_kurumun_urune_verdigi_teklifler,
        f_db_kurumun_urune_verdigi_teklif_fiyatlari: f_db_kurumun_urune_verdigi_teklif_fiyatlari,
        f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla: f_db_kurum_teklif_verdigi_ihaleleri_tarihe_gore_grupla,
        f_db_kurumun_teklif_verdigi_kalemler: f_db_kurumun_teklif_verdigi_kalemler,
        f_db_kurumun_teklif_verdigi_kalemler_toplami: f_db_kurumun_teklif_verdigi_kalemler_toplami,
        f_db_kurumun_teklifleri_detay: f_db_kurumun_teklifleri_detay,
        f_db_kurumun_teklifleri_toplam: f_db_kurumun_teklifleri_toplam,
        f_db_kurumun_teklif_verdigi_ihaleler: f_db_kurumun_teklif_verdigi_ihaleler,
        f_db_kurumun_teklif_verdigi_ihaleler_toplami: f_db_kurumun_teklif_verdigi_ihaleler_toplami,
        f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari: f_db_kurumun_ihale_gunlerine_gore_katildigi_ihale_toplamlari,
        f_db_kurum_teklif_temp: f_db_kurum_teklif_temp,
        f_db_kurum_kazanc_trendi: f_db_kurum_kazanc_trendi,
        f_db_kurum_genel_kontrol: f_db_kurum_genel_kontrol,
        f_db_kurum_urun_tumu: f_db_kurum_urun_tumu,
        f_db_kurum_tumu: f_db_kurum_tumu,
        f_db_aktif_kurum_idleri: f_db_aktif_kurum_idleri,
        f_db_kurum_adlari_adi: f_db_kurum_adlari_adi,
        f_db_kurum_id: f_db_kurum_id,
        f_db_kurum_ekle: f_db_kurum_ekle,
        f_db_kurum_ekle_ihaleDunyasindan: f_db_kurum_ekle_ihaleDunyasindan,
        f_db_kurum_guncelle: f_db_kurum_guncelle,
        f_db_kurum_sil: f_db_kurum_sil,
        f_db_kurum_tahta_aktif: f_db_kurum_tahta_aktif,
        f_db_kurum_paylas: f_db_kurum_paylas
    };

    return result;
}

/**
 *
 * @type {DBKurum}
 */
var obj = DB_Kurum();
obj.__proto__ = require('./db_log');

module.exports = obj;