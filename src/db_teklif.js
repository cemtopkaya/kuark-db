/**
 *
 * @returns {DBTeklif}
 * @constructor
 */
function DB_Teklif() {
    // db işlemlerinin Promise ile yapılabilmesi için.
    var result = {};

    /*TEKLİF İŞLEMLERİ (EKLE-SİL-GÜNCELLE-BUL)*/
    /**
     * Teklif bilgisini döner
     * _bTumBilgileriyle  true ise kurum ürün kalem bilgilerini de bağlar, false ise sadece teklif bilgisini döner
     * @param {integer|integer[]|string|string[]} _teklif_id
     * @param {integer} _tahta_id
     * @param {OptionsTeklif=} _opts
     * @returns {*}
     */
    var f_db_teklif_id = function (_teklif_id, _tahta_id, _opts) {

        var /** @type {OptionsTeklif} */
            opts = result.OptionsTeklif(_opts),
            defer = result.dbQ.Q.defer(),
            arrPromises = [];

        (Array.isArray(_teklif_id)
            ? result.dbQ.hmget_json_parse(result.kp.teklif.tablo, _teklif_id)
            : result.dbQ.hget_json_parse(result.kp.teklif.tablo, _teklif_id))
            .then(function (_dbTeklif) {

                var f_teklif_bilgisi = function (_teklif) {
                    var olusan_teklif = schema.f_create_default_object(SABIT.SCHEMA.TEKLIF);
                    olusan_teklif = extend(olusan_teklif, _teklif);

                    arrPromises.push(opts.bKurumBilgisi
                        ? require("./db_kurum").f_db_kurum_id(_teklif.Kurum_Id)
                        : {});

                    arrPromises.push(opts.bKalemBilgisi
                        ? result.dbQ.hget_json_parse(result.kp.kalem.tablo, _teklif.Kalem_Id)
                        : {});

                    arrPromises.push(opts.bIhaleBilgisi
                        ? result.dbQ.hget_json_parse(result.kp.ihale.tablo, _teklif.Ihale_Id)
                        : {});

                    arrPromises.push(opts.bArrUrunler
                        ? f_db_teklif_urunleri(_teklif_id, _tahta_id)
                        : []);

                    return arrPromises.allX()
                        .then(function (_ress) {

                            olusan_teklif.Kurum = _ress[0];
                            olusan_teklif.Kalem = _ress[1];
                            olusan_teklif.Ihale = _ress[2];
                            olusan_teklif.Urunler = _ress[3];

                            return olusan_teklif;
                        });
                };

                (Array.isArray(_dbTeklif)
                    ? _dbTeklif.mapX(null, f_teklif_bilgisi)
                    .allX()
                    : f_teklif_bilgisi(_dbTeklif))
                    .then(function (_olusan_teklif) {
                        defer.resolve(_olusan_teklif);
                    });
            });
        return defer.promise;
    };


    /**
     * Teklife bağlı ürünler listesini buluyoruz
     * @param {integer} _teklif_id
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_teklif_urunleri = function (_teklif_id, _tahta_id) {

        var defer = result.dbQ.Q.defer();

        result.dbQ.hget(result.kp.teklif.hsetUrunleri, _teklif_id)
            .then(function (_dbUrun_idler) {

                if (_dbUrun_idler && _dbUrun_idler.length > 0) {

                    //aynı ürün gelbiliyor diye uniq metoduna gönderiyoruz ve çift kayıtları teke düşünüyoruz
                    var urun_idler = _.uniq(_dbUrun_idler);

                    var db_urun = require("./db_urun");
                    /** @type {OptionsUrun} */
                    var opt = {};
                    opt.bArrAnahtarKelimeler = true;
                    opt.bArrIliskiliFirmalar = true;
                    opt.bUreticiKurum = true;

                    db_urun.f_db_urun_id(urun_idler, _tahta_id, opt)
                        .then(function (_urunler) {
                            defer.resolve(_urunler);
                        });

                } else {
                    defer.resolve([]);
                }
            });

        return defer.promise;
    };


    /**
     * Kalemin onay durumu bir kez kazandı olarak belirlenebilir, farklı firmalar bir kalem için kazandı olamaz!
     * @param {integer} _tahta_id
     * @param {integer} _kalem_id
     * @param {integer} _onay_durum_id
     * @returns {*}
     */
    var f_db_kalemin_onay_durumu_kazandi_mi = function (_tahta_id, _kalem_id, _onay_durum_id) {
        l.info("f_db_kalemin_onay_durumu_kazandi_mi");
        return result.dbQ.sinter(
            result.kp.kalem.ssetTeklifleri(_kalem_id),
            result.kp.tahta.ssetTeklifleri(_tahta_id, true),
            result.kp.teklif.ssetTeklifOnayDurumlari(SABIT.ONAY_DURUM.teklif.KAZANDI))
            .then(function (_teklif_idler) {
                return (_teklif_idler && _teklif_idler.length > 0 && _onay_durum_id == SABIT.ONAY_DURUM.teklif.KAZANDI)
                    ? true
                    : false;
            });
    };

    var f_db_teklif_ekle = function (_tahta_id, _teklif, _kul_id) {

        return f_db_kalemin_onay_durumu_kazandi_mi(_tahta_id, _teklif.Kalem_Id, _teklif.TeklifDurumu_Id)
            .then(function (_bKazandi) {
                if (_bKazandi == true) {
                    //bir kalemin 1 kazananı olabilir.
                    l.e("1 kalemin 1 kazananı olabilir");
                    throw new exception.istisna("VALİDASYON HATASI", "Seçilen kalemin onay durumu KAZANDI olarak seçili durumda. Bir kalemin sadece bir kazananı olabilir. Lütfen kontrol ediniz.");

                }
                else {
                    l.info("teklif ekle");

                    return result.dbQ.incr(result.kp.teklif.idx)
                        .then(function (_id) {
                            _teklif.Id = _id;

                            return result.dbQ.hset(result.kp.teklif.tablo, _id, JSON.stringify(_teklif))
                                .then(function () {

                                    return result.dbQ.Q.all([
                                        result.dbQ.sadd(result.kp.ihale.ssetTeklifleri(_teklif.Ihale_Id), _teklif.Id),
                                        result.dbQ.sadd(result.kp.tahta.ssetTeklifleri(_tahta_id, true), _id),
                                        result.dbQ.sadd(result.kp.teklif.ssetTeklifParaBirimli(_teklif.ParaBirim_Id), _id),
                                        result.dbQ.sadd(result.kp.kurum.ssetTeklifleri(_teklif.Kurum_Id), _id),
                                        result.dbQ.sadd(result.kp.tahta.ssetTeklifVerilenIhaleler(_tahta_id), _teklif.Ihale_Id),
                                        result.dbQ.hset(result.kp.teklif.hsetKurumlari, _teklif.Id, _teklif.Kurum_Id),
                                        result.dbQ.sadd(result.kp.teklif.ssetTeklifOnayDurumlari(_teklif.TeklifDurumu_Id), _id),
                                        result.dbQ.sadd(result.kp.kalem.ssetTeklifleri(_teklif.Kalem_Id), _id),
                                        result.dbQ.hset(result.kp.teklif.hsetKalemleri, _id, _teklif.Kalem_Id)
                                    ]);
                                })
                                .then(function () {
                                    //teklif eklerken ürünü varsa ekliyoruz
                                    if (_teklif.Urun_Idler.length > 0) {
                                        return result.dbQ.Q.all([
                                            result.dbQ.hset(result.kp.teklif.hsetUrunleri, _id, JSON.stringify(_teklif.Urun_Idler)),
                                            result.dbQ.sadd(result.kp.ihale.ssetUrunleri(_tahta_id, _teklif.Ihale_Id), _teklif.Urun_Idler)
                                        ]).then(function () {
                                            var promises = _.map(_teklif.Urun_Idler, function (_urun_id) {
                                                return result.dbQ.sadd(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id), _id);
                                            });

                                            return result.dbQ.Q.all(promises);
                                        });
                                    } else {
                                        return _teklif;
                                    }
                                })
                                .then(function () {
                                    return f_db_teklif_id(_teklif.Id, _tahta_id)
                                        .then(function (_dbTeklif) {
                                            emitter.emit(SABIT.OLAY.TEKLIF_EKLENDI, _dbTeklif, _tahta_id, _kul_id);
                                            return _dbTeklif;
                                        });
                                });
                        });
                }
            });
    };

    /**
     * Teklif güncellendiğinde hash yeniden oluşturulur
     * Kurumu değişti ise yeni değeri teklif:x:kurum tablosuna eklenir
     * Satırı değişti ise yeni değeri teklif:x:kalem tablosuna eklenir
     * Durumu 2 ise kazandı olarak belirlenir. Hem satırın kazananı hem de tahtanın kazanan teklifleri tablosuna kayıt eklenir.
     * Durumu 3 ise iptal edildiği belirtilir. Hem satırın iptal edileni hem de tahtanın iptal edilen teklifleri tablosuna kayıt eklenir.
     * @param {integer} _tahta_id
     * @param {object} _teklif
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_teklif_guncelle = function (_tahta_id, _teklif, _kul_id) {

        l.info("f_db_teklif_guncelle");

        if (!_teklif.Kurum_Id) {
            throw new exception.istisna("Kurum bulunamadı!", "Teklifin kurumu bulunamadı!");
        }

        return f_db_kalemin_onay_durumu_kazandi_mi(_tahta_id, _teklif.Kalem_Id, _teklif.TeklifDurumu_Id)
            .then(function (_bKazandi) {
                if (_bKazandi == true) {
                    //bir kalemin 1 kazananı olabilir.
                    l.e("1 kalemin 1 kazananı olabilir");
                    throw new exception.istisna("VALİDASYON HATASI", "Seçilen kalemin onay durumu KAZANDI olarak seçili durumda. Bir kalemin sadece bir kazananı olabilir. Lütfen kontrol ediniz.");
                }
                else {
                    /** @type {OptionsTeklif} */
                    var opts = result.OptionsTeklif({
                        bArrUrunler: false,
                        bKalemBilgisi: false,
                        bIhaleBilgisi: false,
                        bKurumBilgisi: false
                    });

                    return f_db_teklif_id(_teklif.Id, _tahta_id, opts)
                        .then(function (_dbEskiTeklif) {
                            if (_dbEskiTeklif && _dbEskiTeklif.Id > 0) {

                                //teklif hash güncelle
                                return result.dbQ.Q.all([
                                    result.dbQ.hset(result.kp.teklif.tablo, _teklif.Id, JSON.stringify(_teklif)),
                                    result.dbQ.hset(result.kp.teklif.hsetKurumlari, _teklif.Id, _teklif.Kurum_Id), //teklifi atan kurum hash değişmiş olabilir, yenisini ekle
                                    result.dbQ.srem(result.kp.teklif.ssetTeklifOnayDurumlari(_dbEskiTeklif.TeklifDurumu_Id), _teklif.Id),
                                    result.dbQ.sadd(result.kp.teklif.ssetTeklifOnayDurumlari(_teklif.TeklifDurumu_Id), _teklif.Id),
                                    //tahtanın para birimli teklifleri setini düzenle
                                    //eski teklifin para birimi farklı ise setten çıkartıp yenisine ekle
                                    result.dbQ.srem(result.kp.teklif.ssetTeklifParaBirimli(_dbEskiTeklif.ParaBirim_Id), _teklif.Id),
                                    result.dbQ.sadd(result.kp.teklif.ssetTeklifParaBirimli(_teklif.ParaBirim_Id), _teklif.Id)
                                ]).then(function () {
                                    if (_dbEskiTeklif.Urun_Idler) {
                                        //teklif verilen ürünler değişmiş olabilir, setleri yeni haliyle düzenle
                                        //önce eskileri kaldır

                                        var promises = _.map(_dbEskiTeklif.Urun_Idler, function (_urun_id) {
                                            return result.dbQ.Q.all([
                                                result.dbQ.srem(result.kp.ihale.ssetUrunleri(_tahta_id, _teklif.Ihale_Id), _urun_id),
                                                result.dbQ.srem(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id), _teklif.Id)
                                            ]);
                                        });

                                        return result.dbQ.Q.all(promises)

                                    } else {
                                        return _teklif;
                                    }

                                }).then(function () {
                                    if (_teklif.Urun_Idler) {
                                        //yeni ürün_idlerini ekle
                                        return result.dbQ.hset(result.kp.teklif.hsetUrunleri, _teklif.Id, JSON.stringify(_teklif.Urun_Idler))
                                            .then(function () {
                                                var promises = _.map(_teklif.Urun_Idler, function (_urun_id) {
                                                    return result.dbQ.Q.all([
                                                        result.dbQ.sadd(result.kp.ihale.ssetUrunleri(_tahta_id, _teklif.Ihale_Id), _urun_id),
                                                        result.dbQ.sadd(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id), _teklif.Id)
                                                    ]);
                                                });

                                                return result.dbQ.Q.all(promises);
                                            });
                                    }
                                    else {
                                        return _teklif;
                                    }
                                }).then(function () {
                                    return f_db_teklif_id(_teklif.Id, _tahta_id)
                                        .then(function (_dbTeklif) {
                                            emitter.emit(SABIT.OLAY.TEKLIF_GUNCELLENDI, _dbEskiTeklif, _dbTeklif, _tahta_id, _kul_id);
                                            return _dbTeklif;
                                        });
                                });

                            } else {
                                throw new exception.istisna("HATA ALINDI", "Teklif bilgisi sistemde bulunamadı!");
                            }
                        });
                }
            });
    };

    /**
     * Teklifin onay durumunu güncelle
     * @param {integer} _tahta_id
     * @param {integer} _teklif_id
     * @param {integer} _onay_durumu_id
     * @param {integer=} _kul_id
     * @returns {*}
     */
    var f_db_teklif_durum_guncelle = function (_tahta_id, _teklif_id, _onay_durumu_id, _kul_id) {

        l.info("f_db_teklif_durum_guncelle");

        /** @type {OptionsTeklif} */
        var opts = result.OptionsTeklif({
            bArrUrunler: false,
            bKalemBilgisi: false,
            bIhaleBilgisi: false,
            bKurumBilgisi: false
        });
        return f_db_teklif_id(_teklif_id, _tahta_id, opts)
            .then(
                /**
                 *
                 * @param {TeklifDB} _dbTeklif
                 * @returns {*}
                 */
                function (_dbTeklif) {

                    if (_dbTeklif && _dbTeklif.Id > 0) {

                        return f_db_kalemin_onay_durumu_kazandi_mi(_tahta_id, _dbTeklif.Kalem_Id, _onay_durumu_id)
                            .then(function (_bKazandi) {
                                if (_bKazandi == true) {
                                    //bir kalemin 1 kazananı olabilir.
                                    l.e("1 kalemin 1 kazananı olabilir");
                                    throw new exception.istisna("VALİDASYON HATASI", "Seçilen kalemin onay durumu KAZANDI olarak seçili durumda. Bir kalemin sadece bir kazananı olabilir. Lütfen kontrol ediniz.");
                                } else {

                                    var eski_onay_durum_id = _dbTeklif.TeklifDurumu_Id;
                                    _dbTeklif.TeklifDurumu_Id = parseInt(_onay_durumu_id);

                                    var kayitEdilecekTeklif = schema.f_suz_klonla(SABIT.SCHEMA.DB.TEKLIF, _dbTeklif);

                                    //teklif hash güncelle
                                    //eski onay durumunu setten kaldır yeni durumuna göre ekle
                                    return result.dbQ.Q.all([
                                        result.dbQ.hset(result.kp.teklif.tablo, _teklif_id, JSON.stringify(kayitEdilecekTeklif)),
                                        result.dbQ.srem(result.kp.teklif.ssetTeklifOnayDurumlari(eski_onay_durum_id), _teklif_id),
                                        result.dbQ.sadd(result.kp.teklif.ssetTeklifOnayDurumlari(_onay_durumu_id), _teklif_id)
                                    ]).then(function () {
                                        return f_db_teklif_id(_teklif_id, _tahta_id)
                                            .then(function (_dbTeklif) {
                                                emitter.emit(SABIT.OLAY.TEKLIF_DURUMU_GUNCELLENDI, _dbTeklif, _tahta_id, _dbTeklif.Kurum_Id, _kul_id);
                                                return _dbTeklif;
                                            });
                                    });
                                }
                            })
                    } else {
                        throw new exception.istisna("HATA OLUŞTU", "Teklif sistemde BULUNAMADI. Lütfen kontrol ediniz.");
                    }
                });
    };

    /**
     * Teklif silinirken yapılacak işlemler
     result.dbQ.srem(result.kp.tahta.ssetTeklifleri(_tahta_id, true), _teklif_id),
     result.dbQ.sadd(result.kp.tahta.ssetTeklifleri(_tahta_id, false), _teklif_id),
     result.dbQ.srem(result.kp.kalem.ssetTeklifleri(_satir_id), _teklif_id),
     result.dbQ.srem(result.kp.ihale.ssetTeklifleri(_ihale_id), _teklif_id),
     result.dbQ.srem(result.kp.urun.ssetTeklifleri(_tahta_id, urun_Id), _teklif_id),
     result.dbQ.del(result.kp.teklif.setKurumu(_teklif_id)),
     result.dbQ.del(result.kp.teklif.setSatiri(_teklif_id))
     result.dbQ.srem(result.kp.kalem.ssetFiyatlari(_satir_id), teklif.Fiyat)
     * @param {integer} _teklif_id
     * @param {integer} _tahta_id
     * @param {integer} _kul_id
     * @returns {*}
     */
    var f_db_teklif_sil = function (_teklif_id, _tahta_id, _kul_id) {
        // Eklenen tekliflarda varsa oradan çıkartıp, silinen tekliflere ekleyeceğiz
        //ihale ve satır tekliflerinin silinen tarfına ekleyip eklenenden çıkartacağız
        /** @type {OptionsTeklif} */
        var opts = result.OptionsTeklif({
            bArrUrunler: false,
            bKalemBilgisi: false,
            bIhaleBilgisi: false,
            bKurumBilgisi: false
        });
        return f_db_teklif_id(_teklif_id, _tahta_id, opts)
            .then(
                /**
                 *
                 * @param {Teklif} teklif
                 * @returns {*}
                 */
                function (teklif) {
                    return result.dbQ.sismember(result.kp.tahta.ssetTeklifleri(_tahta_id, true), _teklif_id)
                        .then(function (_rank) {
                            l.info(_rank);
                            if (_rank) {

                                emitter.emit(SABIT.OLAY.TEKLIF_SILINDI, teklif, _tahta_id, _kul_id);

                                return result.dbQ.Q.all([
                                    result.dbQ.srem(result.kp.tahta.ssetTeklifleri(_tahta_id, true), _teklif_id),
                                    result.dbQ.srem(result.kp.teklif.ssetTeklifParaBirimli(teklif.ParaBirim_Id), _teklif_id),
                                    result.dbQ.sadd(result.kp.tahta.ssetTeklifleri(_tahta_id, false), _teklif_id),
                                    //ihalenin tekliflerinden kaldırıyoruz
                                    result.dbQ.srem(result.kp.ihale.ssetTeklifleri(teklif.Ihale_Id), _teklif_id),
                                    //teklifin durumunu siliyoruz
                                    result.dbQ.srem(result.kp.teklif.ssetTeklifOnayDurumlari(teklif.TeklifDurumu_Id), _teklif_id),
                                    //teklifle ilişkili kalemleri siliyoruz
                                    result.dbQ.srem(result.kp.kalem.ssetTeklifleri(teklif.Kalem_Id), _teklif_id),
                                    result.dbQ.hdel(result.kp.teklif.hsetKalemleri, _teklif_id)
                                ]).then(function () {
                                        return result.dbQ.hget(result.kp.teklif.hsetKurumlari, _teklif_id)
                                            .then(function (_kurum_id) {
                                                if (_kurum_id && _kurum_id != null && _kurum_id > 0) {
                                                    return result.dbQ.Q.all([
                                                        result.dbQ.hdel(result.kp.teklif.hsetKurumlari, _teklif_id),
                                                        result.dbQ.srem(result.kp.kurum.ssetTeklifleri(_kurum_id), _teklif_id)
                                                    ]);
                                                }
                                                return _teklif_id;
                                            });
                                    })
                                    .then(function () {
                                        return result.dbQ.hget_json_parse(result.kp.teklif.hsetUrunleri, _teklif_id)
                                            .then(function (_urun_idler) {
                                                if (_urun_idler && _urun_idler.length > 0) {
                                                    _urun_idler.forEach(function (_urun_id) {
                                                        return result.dbQ.srem(result.kp.urun.ssetTeklifleri(_tahta_id, _urun_id), _teklif_id)
                                                    });
                                                }
                                                return result.dbQ.hdel(result.kp.teklif.hsetUrunleri, _teklif_id);
                                            });
                                    })
                                    .then(function () {
                                        return _teklif_id;
                                    });
                            } else {
                                l.warning("Tahtanın teklifleri içerisinde silinecek aktif bir teklif bulunamadı");
                                return _rank;
                            }
                        });
                });
    };

    /**
     * @class DBTeklif
     */
    result = {
        f_db_teklif_sil: f_db_teklif_sil,
        f_db_teklif_guncelle: f_db_teklif_guncelle,
        f_db_teklif_ekle: f_db_teklif_ekle,
        f_db_teklif_id: f_db_teklif_id,
        f_db_teklif_durum_guncelle: f_db_teklif_durum_guncelle,
        /**
         *
         * @param opts - Ezilecek değerleri taşıyan nesne
         * @returns {OptionsTeklif}
         */
        OptionsTeklif: function (opts) {
            /** @class OptionsTeklif */
            return extend({
                bArrUrunler: true,
                bKalemBilgisi: true,
                bIhaleBilgisi: true,
                bKurumBilgisi: true
            }, opts || {})
        }
    };

    return result;
}

/**
 *
 * @type {DBTeklif}
 */
var obj = DB_Teklif();
obj.__proto__ = require('./db_log');

module.exports = obj;