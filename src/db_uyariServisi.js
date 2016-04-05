'use strict';

var l = require('../lib/winstonConfig'),
    uuid = require('node-uuid'),
    schema = require('kuark-schema'),
    _ = require('lodash'),
    extensions = require('kuark-extensions');

/**
 *
 * @returns {DBUyariServisi}
 * @constructor
 */
function DB_UyariServisi() {
    var
        /**
         *
         * @type {DBUyariServisi}
         */
        result = {},
        arrTetiklenecekOlaylar = null,
        arrUyarilar = null;

    var f_db_uyari_sonucu_ekle = function (_sonuc) {

        //var uid = uuid.v1();
        return result.dbQ.incr(result.kp.uyari.idxUyariSonuc)
            .then(function (_id) {
                _sonuc.Id = _id;

                return result.dbQ.hset(result.kp.uyari.hsetUyariSonuclari, _id, JSON.stringify(_sonuc))
                    .then(function () {
                        return _id;
                    });
            });
    };

    var f_google_takvime_ekle = function (kul, tahta, ihale) {

        function f_add_event(accessToken, calendarId, event) {
            var gcal = require('google-calendar');
            gcal(accessToken).events.insert(calendarId, event, function (err, response) {
                if (err) {
                    return null;
                }
                else {
                    return response;
                }
            });
        }

        //google hesabı tanımlıysa
        //tahtanın ajandası seçilmişse devam et yoksa işlem yapma

        //bilgileri toplayıp takvime gönderiyoruz

        var tarih = ihale.IhaleTarihi ? ihale.IhaleTarihi : ihale.DuzenlemeTarihi,
            aciklama = ihale.IhaleNo ? "İhale No:" + ihale.IhaleNo : " ";
        aciklama += ihale.IhaleUsul ? " Usül:" + ihale.IhaleUsul : " ";
        aciklama += ihale.BolgeAdi ? " Bölge:" + ihale.BolgeAdi : " ";
        aciklama += ihale.Kurum && ihale.Kurum.Adi ? " Kurum:" + ihale.Kurum.Adi : " ";
        aciklama += ihale.DosyaEkleri && ihale.DosyaEkleri.length > 0 ? " Ekler:" + ihale.DosyaEkleri[0].Href : " ";

        var kayit = {
            summary: ihale.Konusu,
            location: ihale.IlAdi,
            description: aciklama,
            start: {
                dateTime: new Date(tarih).toISOString()
            },
            end: {
                dateTime: new Date(tarih).toISOString()
            },
            organizer: {
                displayName: kul.AdiSoyadi
            }
        };

        return f_add_event(kul.Providers.GP.token, tahta.Ajanda.GC.Id, kayit);
    };

    //region YARDIMCI
    /**
     * Gelen olay için kayıtlı id leri çekiyoruz
     * @param {string} _olay
     * @returns {*}
     */
    var f_olaya_uygun_idler = function (_olay) {
        return result.dbQ.smembers(_olay);
    };

    /**
     * Tahtanın görebileceği id ler ile uyarı olayında kayıtlı id lerin kesişimi bulup dönüyoruz.
     * Böylece tahta ile ilişkili olanlar getirilmiş olur.
     * @param {string} _olay
     * @param {int} _tahta_id
     * @returns {*}
     */
    var f_db_nesne_idleri = function (_olay, _tahta_id) {
        return f_olaya_uygun_idler(_olay)
            .then(function (_cekilen_idler) {
                if (_cekilen_idler && _cekilen_idler.length > 0) {
                    switch (_olay) {
                        case schema.SABIT.OLAY.IHALE_EKLENDI:
                        case schema.SABIT.OLAY.IHALE_GUNCELLENDI:
                        case schema.SABIT.OLAY.IHALE_SILINDI:
                        case schema.SABIT.OLAY.IHALE_TARIHI_ERTELENDI:
                        {
                            var db_ihale = require('./db_ihale');
                            return db_ihale.f_db_tahta_ihale_idler_aktif(_tahta_id)
                                .then(function (_ihale_idler) {
                                    return _.intersection(_ihale_idler, _cekilen_idler);
                                });
                        }
                            break;
                        case schema.SABIT.OLAY.KALEM_DURUMU_GUNCELLENDI:
                        case schema.SABIT.OLAY.KALEM_EKLENDI:
                        case schema.SABIT.OLAY.KALEM_GUNCELLENDI:
                        case schema.SABIT.OLAY.KALEM_SILINDI:
                        {
                            var db_kalem = require('./db_kalem');
                            return db_kalem.f_db_tahta_kalem_idler_aktif(_tahta_id)
                                .then(function (_kalem_idler) {
                                    return _.intersection(_kalem_idler, _cekilen_idler);
                                });
                        }
                            break;
                        case schema.SABIT.OLAY.TEKLIF_DURUMU_GUNCELLENDI:
                        case schema.SABIT.OLAY.TEKLIF_EKLENDI:
                        case schema.SABIT.OLAY.TEKLIF_GUNCELLENDI:
                        case schema.SABIT.OLAY.TEKLIF_SILINDI:
                        {
                            var db_tahta = require('./db_tahta');
                            return db_tahta.f_db_tahta_teklif_idleri(_tahta_id)
                                .then(function (_teklif_idler) {
                                    return _.intersection(_teklif_idler, _cekilen_idler);
                                });
                        }
                            break;

                        case schema.SABIT.OLAY.URUN_EKLENDI:
                        case schema.SABIT.OLAY.URUN_GUNCELLENDI:
                        case schema.SABIT.OLAY.URUN_SILINDI:
                        case schema.SABIT.OLAY.URUN_ANAHTAR_EKLENDI:
                        case schema.SABIT.OLAY.URUN_ANAHTAR_SILINDI:
                        {
                            var db_urun = require('./db_urun')
                            return db_urun.f_db_urun_aktif_urun_idleri(_tahta_id)
                                .then(function (_urun_idler) {
                                    return _.intersection(_urun_idler, _cekilen_idler);
                                });
                        }
                            break;

                        case schema.SABIT.OLAY.KURUM_EKLENDI:
                        case schema.SABIT.OLAY.KURUM_GUNCELLENDI:
                        case schema.SABIT.OLAY.KURUM_SILINDI:
                        {
                            var db_kurum = require('./db_kurum');
                            return db_kurum.f_db_aktif_kurum_idleri(_tahta_id)
                                .then(function (_kurum_idler) {
                                    return _.intersection(_kurum_idler, _cekilen_idler);
                                });
                        }
                            break;

                        default:
                            break;
                    }
                } else {
                    return null;
                }
            });
    };

    /**
     * Olay tipine göre elastic tipi belirlenir.
     * @param {string} _olay
     * @returns {string}
     */
    var f_elastic_tipi = function (_olay) {
        var tipi = "";
        switch (_olay) {
            case schema.SABIT.OLAY.IHALE_EKLENDI:
            case schema.SABIT.OLAY.IHALE_GUNCELLENDI:
            case schema.SABIT.OLAY.IHALE_SILINDI:
            case schema.SABIT.OLAY.IHALE_TARIHI_ERTELENDI:
            case schema.SABIT.OLAY.IHALE_TARIHI_X_GUN_KALA:
            {
                tipi = schema.SABIT.ELASTIC.TIP.IHALE;
            }
                break;
            case schema.SABIT.OLAY.KALEM_DURUMU_GUNCELLENDI:
            case schema.SABIT.OLAY.KALEM_EKLENDI:
            case schema.SABIT.OLAY.KALEM_GUNCELLENDI:
            case schema.SABIT.OLAY.KALEM_SILINDI:
            case schema.SABIT.OLAY.KALEM_KATILIYORUZ:
            case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILECEK:
            case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILDI:
            case schema.SABIT.OLAY.KALEM_ITIRAZ_KABUL:
            case schema.SABIT.OLAY.KALEM_ITIRAZ_RED:
            case schema.SABIT.OLAY.KALEM_IPTAL:
            {
                tipi = schema.SABIT.ELASTIC.TIP.KALEM;
            }
                break;
            case schema.SABIT.OLAY.TEKLIF_DURUMU_GUNCELLENDI:
            case schema.SABIT.OLAY.TEKLIF_EKLENDI:
            case schema.SABIT.OLAY.TEKLIF_GUNCELLENDI:
            case schema.SABIT.OLAY.TEKLIF_SILINDI:
            case schema.SABIT.OLAY.TEKLIF_IHALEDEN_ATILDI:
            case schema.SABIT.OLAY.TEKLIF_IPTAL:
            case schema.SABIT.OLAY.TEKLIF_KAZANDI:
            case schema.SABIT.OLAY.TEKLIF_URUN_BELGESI_EKSIK:
            case schema.SABIT.OLAY.TEKLIF_URUNU_REDDEDILDI:
            {
                tipi = schema.SABIT.ELASTIC.TIP.TEKLIF;
            }
                break;

            case schema.SABIT.OLAY.URUN_EKLENDI:
            case schema.SABIT.OLAY.URUN_GUNCELLENDI:
            case schema.SABIT.OLAY.URUN_SILINDI:
            case schema.SABIT.OLAY.URUN_ANAHTAR_EKLENDI:
            case schema.SABIT.OLAY.URUN_ANAHTAR_SILINDI:
            {
                tipi = schema.SABIT.ELASTIC.TIP.URUN;
            }
                break;

            case schema.SABIT.OLAY.KURUM_EKLENDI:
            case schema.SABIT.OLAY.KURUM_GUNCELLENDI:
            case schema.SABIT.OLAY.KURUM_SILINDI:
            {
                tipi = schema.SABIT.ELASTIC.TIP.KURUM;
            }
                break;
            default:
                break;
        }
        return tipi;
    };

    /**
     * Gelen olaya göre kalemin onay durum_id sini elde edeceğiz.
     * @param {string} _olay
     * @returns {string}
     */
    var f_kalem_onay_durum_idsi = function (_olay) {
        var tipi = "";
        switch (_olay) {
            case schema.SABIT.OLAY.KALEM_KATILIYORUZ:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.KATILIYORUZ;
            }
                break;
            case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILECEK:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.ITIRAZ_EDILECEK;
            }
                break;
            case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILDI:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.ITIRAZ_EDILDI;
            }
                break;
            case schema.SABIT.OLAY.KALEM_ITIRAZ_KABUL:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.ITIRAZ_KABUL;
            }
                break;
            case schema.SABIT.OLAY.KALEM_ITIRAZ_RED:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.ITIRAZ_RED;
            }
                break;
            case schema.SABIT.OLAY.KALEM_IPTAL:
            {
                tipi = schema.SABIT.ONAY_DURUM.kalem.IPTAL;
            }
                break;
            default:
                throw "Gelen olaya uygun kalem onay durumu bulunamadı!";
                break;
        }
        return tipi;
    };
    /**
     * Gelen olaya göre TEKLİF onay durum_id sini elde edeceğiz.
     * @param {string} _olay
     * @returns {string}
     */
    var f_teklif_onay_durum_idsi = function (_olay) {
        var tipi = "";
        switch (_olay) {
            case schema.SABIT.OLAY.TEKLIF_KAZANDI:
            {
                tipi = schema.SABIT.ONAY_DURUM.teklif.KAZANDI;
            }
                break;
            case schema.SABIT.OLAY.TEKLIF_IHALEDEN_ATILDI:
            {
                tipi = schema.SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI;
            }
                break;
            case schema.SABIT.OLAY.TEKLIF_REDDEDILDI:
            {
                tipi = schema.SABIT.ONAY_DURUM.teklif.REDDEDILDI;
            }
                break;
            default:
                throw "Gelen olaya uygun teklif onay durumu bulunamadı!";
                break;
        }
        return tipi;
    };

    var f_elastic_filter = function (_idler, _uyari, _tipi) {
        if (_idler && _idler != null) {

            var idler = {
                "ids": {
                    "type": _tipi,
                    "values": _idler.map(function (e) {
                        return e.toString()
                    })
                }
            };

            _uyari.Elastic.query.filtered.filter.bool.must.push(idler);
        }

        return _uyari.Elastic;
    };

    var f_haber_icerik_bilgisi = function (_tip, _obj) {
        if (_tip.indexOf(schema.SABIT.TABLO_ADI.IHALE) != -1) {
            return _obj.Konusu + " konulu yeni İHALE eklendi.";
        }
        else if (_tip.indexOf(schema.SABIT.TABLO_ADI.KURUM) != -1) {
            return _obj.Adi + " isimli yeni FİRMA eklendi.";
        }
        else if (_tip.indexOf(schema.SABIT.TABLO_ADI.KALEM) != -1) {
            return _obj.Aciklama + " içerikli KALEM eklendi.";
        }
        else if (_tip.indexOf(schema.SABIT.TABLO_ADI.URUN) != -1) {
            return _obj.Adi + " isimli yeni ÜRÜN eklendi.";
        }
        else if (_tip.indexOf(schema.SABIT.TABLO_ADI.TEKLIF) != -1) {
            return "TEKLİF eklendi.";
        }
        else if (_tip.indexOf(schema.SABIT.TABLO_ADI.YORUM) != -1) {
            return _obj.Icerik + " içerikli YORUM eklendi.";
        }
    };

    var f_detay_olustur = function (_islem, _uyari, _elm) {
        return {
            //Tahta_Id: _uyari.Tahta_Id,
            //ES: _uyari.RENDER.ElasticQuery,
            Islem: _islem,//mail,todo,sms..gibi
            Tablo_Tipi: _uyari.RENDER.Tipi,//ihale,kalem..gibi
            Tablo_Id: _elm.Id,//tipi ihale ise ihale_id si
            //TabloDeger: _tipi + ":" + _elm.Id,
            Icerik: f_haber_icerik_bilgisi(_uyari.RENDER.Tipi, _elm),
            Baslik: _uyari.RENDER.Tipi + " eklendi.",
            Sonuc: _elm,
            Uyari: _uyari
        };
    };

    var f_uye_id_array = function (_uyari) {
        var ids = [];
        if (Array.isArray(_uyari.RENDER.Uyeler.id_listesi)) {
            ids = _uyari.RENDER.Uyeler.id_listesi;
        } else if (_uyari.RENDER.Uyeler.id_listesi.indexOf(",") > -1) {
            ids = _uyari.RENDER.Uyeler.id_listesi.split(",");
        } else {
            ids = [].concat(_uyari.RENDER.Uyeler.id_listesi);
        }
        return ids;
    };

    //region ALERT
    /**
     * alert seçilmiş kullanıcı:1:haberleri tablosuna kayıt ekler
     * @returns {*}
     */
    var f_alert_secildi = function (_uyari) {

        l.info("f_alert_secildi");

        var ids = f_uye_id_array(_uyari);

        return _uyari.RENDER.Sonuc.Data.map(function (_elm) {
            var detay = f_detay_olustur(schema.SABIT.UYARI.ALERT, _uyari, _elm);
            return f_db_uyari_sonucu_ekle(detay)
                .then(function (_id) {
                    var db_dikkat = require('./db_dikkat');

                    return ids.mapX(null, db_dikkat.f_db_dikkat_ekle, _id).allX();
                });
        }).allX();
    };
    //endregion

    //region TO-DO
    var f_todo_secildi = function (_uyari) {

        l.info("f_todo_secildi");

        //bu uyarı için atanmış kullanıcı id lerini çek
        var kullanici_idleri = f_uye_id_array(_uyari);

        return _uyari.RENDER.Sonuc.Data.map(function (_elm) {
                var detay = f_detay_olustur(schema.SABIT.UYARI.TODO, _uyari, _elm);
                return f_db_uyari_sonucu_ekle(detay)
                    .then(function (_id) {

                        var db_gorev = require('./db_gorev');

                        //eklenen uyarı sonucunu görevlere ekliyoruz

                        return kullanici_idleri.mapX(null, db_gorev.f_db_gorev_ekle, _id).allX();
                    });
            })
            .allX();

    };
    //endregion

    //region MAİL
    /**
     * Gönderilecek mail içeriğini oluştur
     * @param _tahta_id
     * @param _tipi
     * @param _olay
     * @param _sonuc
     * @param _uyari_id
     * @returns {*}
     */
    var f_mail_icerik_olustur_html = function (_tahta_id, _tipi, _olay, _sonuc, _uyari_id) {
        var defer = result.dbQ.Q.defer();

        /** @type {OptionsTahta} */
        var opt = {};
        opt.bAnahtarlari = false;
        opt.bGenel = true;
        opt.bKurumu = false;
        opt.bRolleri = false;
        opt.bUyeleri = false;
        opt.bAjanda = false;

        var db_tahta = require('./db_tahta');
        db_tahta.f_db_tahta_id(_tahta_id, opt)
            .then(function (_dbTahta) {

                var icerik = "[" + _dbTahta.Genel.Adi + "] isimli tahtanın [" + _olay + "] tipindeki uyarı ile ilgili detaylar aşağıdadır:";
                //icerik += "<br/>Detaylarını görmek ve uygulamaya gitmek için <a  target=\"_blank\" href=\"" + schema.SABIT.URL.LOCAL + "/#/tahtalar/tahta/" + _tahta_id + "/uyarilar/sonuclar/" + _sonuc.UUID + "\">[BURAYA]</a> tıklayınız.";
                //icerik += "<br/>Detaylarını görmek ve uygulamaya gitmek için <a  target=\"_blank\" href=\"" + schema.SABIT.URL.LOCAL + "/#/tahtalar/" + _tahta_id + "/uyarilar/" + _uyari_id + "/sonuclar/" + "\">[BURAYA]</a> tıklayınız.";
                icerik += "<br/>Uygulamaya gitmek için <a  target=\"_blank\" href=\"" + schema.SABIT.URL.LOCAL + "/#/" + "\">[BURAYA]</a> tıklayınız.";
                icerik += "<hr/>";

                var iSay = _sonuc.Data.length > 5 ? 5 : _sonuc.Data.length;
                for (var i = 0; i < iSay; i++) {

                    icerik += "<br/>";
                    if (_tipi == schema.SABIT.TABLO_ADI.IHALE) {

                        var ihale = _sonuc.Data[i];
                        icerik += "<br/><b>Ihale No: </b>" + (ihale.IhaleNo || "");
                        icerik += "<br/><b>Konusu: </b>" + (ihale.Konusu || "");
                        icerik += "<br/><b>Kurumu: </b>" + (ihale.Kurum && ihale.Kurum.Id > 0 ? ihale.Kurum.Adi : "");
                        icerik += "<br/><b>Tarihi: </b>" + new Date(ihale.IhaleTarihi).toLocaleDateString();
                        icerik += "<br/><b>Usul: </b>" + (ihale.IhaleUsul || "");
                        icerik += "<br/><b>İl Adı: </b>" + (ihale.IlAdi || "");
                        icerik += "<br/><b>Bölge Adı: </b>" + (ihale.BolgeAdi || "");
                        //icerik += "<br/><b>Şartname Adres: </b>" + (ihale.SartnameAdres || "");
                    }
                    else if (_tipi == schema.SABIT.TABLO_ADI.KALEM) {
                        var kalem = _sonuc.Data[i];
                        icerik += "<br/><b>Sıra No: </b>" + (kalem.SiraNo || "");
                        icerik += "<br/><b>Açıklama: </b>" + (kalem.Aciklama || "");
                        icerik += "<br/><b>Branş Kodu: </b>" + (kalem.BransKodu || "");
                        icerik += "<br/><b>Miktar: </b>" + (kalem.Miktar || "");
                        icerik += "<br/><b>Birim: </b>" + (kalem.Birim || "");
                    }
                    else if (_tipi == schema.SABIT.TABLO_ADI.URUN) {
                        var urun = _sonuc.Data[i];
                        icerik += "<br/><b>Kodu: </b>" + (urun.Kodu || "");
                        icerik += "<br/><b>Açıklama: </b>" + (urun.Aciklama || "");
                        icerik += "<br/><b>Birim: </b>" + (urun.Birim || "");
                        icerik += "<br/><b>Fiyat: </b>" + (urun.Fiyat || "");
                        icerik += "<br/><b>Para Birim: </b>" + (urun.ParaBirim_Id || "");
                    }
                    else if (_tipi == schema.SABIT.TABLO_ADI.KURUM) {
                        var kurum = _sonuc.Data[i];
                        icerik += "<br/><b>Adı: </b>" + (kurum.Adi || "");
                        icerik += "<br/><b>Ticari Unvan: </b>" + (kurum.TicariUnvan || "");
                        icerik += "<br/><b>Statü: </b>" + (kurum.Statu || "");
                        icerik += "<br/><b>Tel1: </b>" + (kurum.Tel1 || "");
                    }
                    else if (_tipi == schema.SABIT.TABLO_ADI.TEKLIF) {
                        var teklif = _sonuc.Data[i],
                            pb = teklif.ParaBirim_Id > 0
                                ? (schema.SABIT.PARA_BIRIMLERI.whereX("Id", teklif.ParaBirim_Id).Adi)
                                : "";

                        icerik += "<br/><b>Kalem: </b>" + (teklif.Kalem && teklif.Kalem.Aciklama || "");
                        icerik += "<br/><b>Kurum: </b>" + (teklif.Kurum && teklif.Kurum.Adi || "");
                        icerik += "<br/><b>Fiyat: </b>" + (teklif.Fiyat || "");
                        icerik += "<br/><b>Para Birim: </b>" + pb;
                    }
                }

                icerik += "<hr/>";

                defer.resolve(icerik);
            });
        return defer.promise;
    };

    var f_mail_uyari_sonucu_olustur = function (_tahta_id, _tipi, _uyeler, _sonuc, _uyari) {
        l.info("f_mail_uyari_sonucu_olustur")

        var ids = f_uye_id_array(_uyari);

        return _sonuc.Data.map(function (_elm) {
            var detay = f_detay_olustur(schema.SABIT.UYARI.MAIL, _uyari, _elm);
            return f_db_uyari_sonucu_ekle(detay)
                .then(function (_sonuc_id) {
                    var db_ileti = require('./db_ileti');
                    return ids.mapX(null, db_ileti.f_db_ileti_ekle, _sonuc_id).allX();
                });
        }).allX();
    };

    var f_mail_secildi = function (_uyari) {
        var defer = result.dbQ.Q.defer();
        l.info("f_mail_secildi");

        var EMail = require('../lib/email'),
            mail = new EMail("", "", "", true);

        f_mail_uyari_sonucu_olustur(_uyari.Tahta_Id, _uyari.RENDER.Tipi, _uyari.RENDER.Uyeler, _uyari.RENDER.Sonuc, _uyari)
            .then(function () {
                f_mail_icerik_olustur_html(_uyari.Tahta_Id, _uyari.RENDER.Tipi, _uyari.Olay, _uyari.RENDER.Sonuc, _uyari.Id)
                    .then(function (_mesaj) {

                        l.info("_uyari.RENDER.Uyeler.mail_listesi.toString()>" + _uyari.RENDER.Uyeler.mail_listesi.toString());

                        var text = _mesaj,
                            from = "",
                            to = _uyari.RENDER.Uyeler.mail_listesi.toString(),
                            cc = "",
                            bcc = "",
                            subject = "İhale uyarısı hk";

                        mail.f_send(text, from, to, cc, bcc, subject, true)
                            .then(function (res) {
                                defer.resolve(res);
                            })
                            .fail(function (_err) {
                                defer.reject({id: 0, mesaj: "mail gönderilemedi"})
                            });
                    });
            });

        return defer.promise;

    };
    //endregion


    /* var f_uyari_sonucuna_ekle1 = function (_tipi, _uyari, _sorgu) {
     var defer = result.dbQ.Q.defer();

     var uid = uuid.v1(),
     sonuc = {
     Tipi: _tipi,
     Uyari: _uyari,
     ES: _sorgu
     };

     result.dbQ.hset(result.kp.tahta.hsetUyariSonuclari(_uyari.Tahta_Id), uid, JSON.stringify(sonuc))
     .then(function () {
     defer.resolve(uid);
     });
     return defer.promise;
     };*/

    /**
     * Elastic sorgusu sonucunu döner
     * @param _tipi
     * @param _query
     * @param _size
     * @param _from
     * @returns {*}
     */
    var f_elastic_sorgula = function (_tipi, _query, _size, _from) {
        return elastic.f_search({
            method: "POST",
            index: schema.SABIT.ELASTIC.INDEKS.APP,
            type: _tipi,
            body: _query,
            size: _size,
            from: _from
        });
    };


    /**
     * Role bağlı üyeleri çekiyoruz
     * @param {int} _tahta_id
     * @param {int[]} _rol_ids
     * @param {object} _uyari
     */
    var f_role_bagli_uyeler = function (_tahta_id, _rol_ids, _uyari) {
        //o role sahip üyeleri çekeceğiz
        l.info("---------f_role_bagli_uyeler-----------")

        var db_tahta = require('./db_tahta');

        var defer = result.dbQ.Q.defer(),
            arrPromise = _rol_ids.map(function (_elm) {
                return db_tahta.f_db_tahta_uyeleri_x_rolune_sahip(_tahta_id, _elm)
                    .then(function (_uyeler) {

                        _uyeler.map(function (_uye) {
                            if (_uye.EPosta) {
                                _uyari.RENDER.Uyeler.mail_listesi.push(_uye.EPosta);
                            }

                            if (_uye.GSM) {
                                _uyari.RENDER.Uyeler.gsm_listesi.push(_uye.GSM);
                            }

                            _uyari.RENDER.Uyeler.id_listesi.push(_uye.Id);
                            _uyari.RENDER.Uyeler.uye_listesi.push(_uye);
                            return _uyari;
                        });
                    });
            });

        result.dbQ.Q.all(arrPromise)
            .then(function () {
                defer.resolve(_uyari.RENDER.Uyeler);
            });

        return defer.promise;
    };
    //endregion

    //region UYARI ÇALIŞTIR
    var f_olayi_tetikle = function (_tetiklenecek_olay_adi) {
        l.info("Tetiklenecek Olay:: %s", _tetiklenecek_olay_adi);
        var defer = result.dbQ.Q.defer();

        //Olaya uygun uyarıları çek
        var olaya_uygun_uyarilar = _.where(arrUyarilar, {"Olay": _tetiklenecek_olay_adi});

        //uyarılar içinde dön
        result.dbQ.Q.all(olaya_uygun_uyarilar.map(f_uyari_calistir))
            .then(function (_res) {
                defer.resolve(_res);
            });

        return defer.promise;
    };


    /**
     * Uyarıyı çalıştır
     * @param _uyari
     */
    var f_uyari_calistir = function (_uyari) {

        function Uyari(_uyarim) {
            this.alert = _uyarim;
            this.alert.RENDER = {
                Uyeler: {
                    mail_listesi: [],
                    gsm_listesi: [],
                    id_listesi: [],
                    uye_listesi: []
                },
                Sonuc: {
                    Toplam: 0,
                    Data: []
                },
                ElasticQuery: {},
                Tipi: "",
                Hata: []
            };
        }

        //region ELASTİC SORGUSUNU HAZIRLA
        Uyari.prototype.f_ES_hazirla_ihale_tarihine_x_gun_kala = function () {
            var alert = this.alert;
            l.info("-----------f_ES_hazirla_ihale_tarihine_x_gun_kala----------------" + alert.Olay);

            if (alert.Kriterler && alert.Kriterler.length > 0) {
                var bugun = new Date(),
                    gun = bugun.getDate(),
                    ay = bugun.getMonth(),
                    yil = bugun.getFullYear(),
                    tarih = new Date(yil, ay, gun),
                    kriter = alert.Kriterler[0],
                    baslangic_tarihi = null,
                    bitis_tarihi = null;

                if (kriter.Prop == "Gun") {
                    baslangic_tarihi = tarih.f_addDays(kriter.Value);
                    bitis_tarihi = baslangic_tarihi.f_addDays(1);
                } else if (kriter.Prop == "Ay") {
                    baslangic_tarihi = tarih.f_addDays(parseInt(kriter.Value) * 30);
                    bitis_tarihi = baslangic_tarihi.f_addDays(1);
                }

                var tipi = f_elastic_tipi(alert.Olay);
                alert.RENDER.Tipi = tipi;

                var db_ihale = require('./db_ihale');
                return db_ihale.f_db_tahta_ihale_idler_aktif(alert.Tahta_Id)
                    .then(function (_idler) {
                        if (_idler && _idler != null) {

                            var sorgu = {
                                "query": {
                                    "filtered": {
                                        "query": {
                                            "bool": {
                                                "must": [
                                                    {
                                                        "ids": {
                                                            "type": tipi,
                                                            "values": _idler.map(function (e) {
                                                                return e.toString()
                                                            })
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        "filter": {
                                            "bool": {
                                                "must": [
                                                    {
                                                        "range": {
                                                            "IhaleTarihi": {
                                                                "gte": baslangic_tarihi.getTime(),
                                                                "lte": bitis_tarihi.getTime()
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            };
                            alert.RENDER.ElasticQuery = sorgu;
                            return sorgu;
                        } else {
                            alert.RENDER.ElasticQuery = null;
                            return null;
                        }
                    });
            }
            else {
                return null;
            }
        };
        Uyari.prototype.f_ES_hazirla_kalem_durumuna_gore = function () {
            //önce tahtanın görebileceği kalem_idlerini buluyoruz
            //sonra bu idlere göre onay durumu uyarıda ne tanımlandı ise ona uygun kalemleri içeren elastic sorgu oluşturuyoruz

            var alert = this.alert,
                tipi = f_elastic_tipi(alert.Olay),
                onay_durum_id = f_kalem_onay_durum_idsi(alert.Olay);
            l.info("------------------ f_ES_hazirla_kalem_durumuna_gore -------------- > " + alert.Olay);
            alert.RENDER.Tipi = tipi;

            var db_kalem = require('./db_kalem');
            return db_kalem.f_db_tahta_kalem_idler_aktif(alert.Tahta_Id)
                .then(function (_idler) {
                    if (_idler && _idler != null) {

                        var sorgu = {
                            "query": {
                                "filtered": {
                                    "query": {
                                        "bool": {
                                            "must": [
                                                {
                                                    "ids": {
                                                        "type": tipi,
                                                        "values": _idler.map(function (e) {
                                                            return e.toString()
                                                        })
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "must": [
                                                {
                                                    "term": {"OnayDurumu.Id": onay_durum_id}
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        };

                        alert.RENDER.ElasticQuery = sorgu;
                        return sorgu;
                    } else {
                        alert.RENDER.ElasticQuery = null;
                        return null;
                    }
                });
        };
        Uyari.prototype.f_ES_hazirla_teklif_durumuna_gore = function () {
            //önce tahtanın görebileceği teklif idleri buluyoruz
            //sonra bu idlere göre onay durumu uyarıda ne tanımlandı ise ona uygun teklifleri içeren elastic sorgu oluşturuyoruz

            var alert = this.alert,
                tipi = f_elastic_tipi(alert.Olay),
                onay_durum_id = f_teklif_onay_durum_idsi(alert.Olay);
            l.info("------------------ f_ES_hazirla_teklif_durumuna_gore -------------- > " + alert.Olay);
            alert.RENDER.Tipi = tipi;

            var db_tahta = require('./db_tahta');
            return db_tahta.f_db_tahta_teklif_idleri(alert.Tahta_Id)
                .then(function (_idler) {
                    if (_idler && _idler != null) {

                        var sorgu = {
                            "query": {
                                "filtered": {
                                    "query": {
                                        "bool": {
                                            "must": [
                                                {
                                                    "ids": {
                                                        "type": tipi,
                                                        "values": _idler.map(function (e) {
                                                            return e.toString()
                                                        })
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "must": [
                                                {
                                                    "term": {"Id": onay_durum_id}
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        };
                        l.info("elastic SORGUMM > " + JSON.stringify(sorgu));
                        alert.RENDER.ElasticQuery = sorgu;
                        return sorgu;
                    } else {
                        alert.RENDER.ElasticQuery = null;
                        return null;
                    }
                });
        };
        Uyari.prototype.f_ES_hazirla_diger = function () {
            var alert = this.alert,
                tipi = f_elastic_tipi(alert.Olay);
            l.info("------------------ f_ES_hazirla_diger -------------- > " + alert.Olay);
            alert.RENDER.Tipi = tipi;

            return f_db_nesne_idleri(alert.Olay, alert.Tahta_Id)
                .then(function (_idler) {
                    if (_idler != null) {
                        var query = f_elastic_filter(_idler, alert, alert.RENDER.Tipi);
                        alert.RENDER.ElasticQuery = query;
                        return query;
                    } else {
                        alert.RENDER.ElasticQuery = null;
                        return null;
                    }
                });
        };
        Uyari.prototype.f_ES_hazirla = function () {
            var promise = null,
                alert = this.alert;

            l.info("------------------ f_ES_hazirla -------------- > " + alert.Olay);

            //bazı uyarıların ElasticQuery değeri oluşturulmamış olabilir.
            //örneğin kalem:durum:katılıyoruz, ihale:tarih:x:gun:kala...
            //bu durumda elastic sorgusunu diğerlerinde göre daha farklı oluşturmalıyız

            switch (alert.Olay) {
                case schema.SABIT.OLAY.IHALE_TARIHI_X_GUN_KALA:
                    promise = this.f_ES_hazirla_ihale_tarihine_x_gun_kala();
                    break;

                case schema.SABIT.OLAY.KALEM_KATILIYORUZ:
                case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILECEK:
                case schema.SABIT.OLAY.KALEM_ITIRAZ_EDILDI:
                case schema.SABIT.OLAY.KALEM_ITIRAZ_KABUL:
                case schema.SABIT.OLAY.KALEM_ITIRAZ_RED:
                case schema.SABIT.OLAY.KALEM_IPTAL:
                    promise = this.f_ES_hazirla_kalem_durumuna_gore();
                    break;

                case schema.SABIT.OLAY.TEKLIF_IHALEDEN_ATILDI:
                case schema.SABIT.OLAY.TEKLIF_IPTAL:
                case schema.SABIT.OLAY.TEKLIF_KAZANDI:
                case schema.SABIT.OLAY.TEKLIF_URUN_BELGESI_EKSIK:
                case schema.SABIT.OLAY.TEKLIF_URUNU_REDDEDILDI:
                    promise = this.f_ES_hazirla_teklif_durumuna_gore();
                    break;

                default:
                    promise = this.f_ES_hazirla_diger();
                    break;
            }

            return promise;
        };
        //endregion

        //region ELASTİC SORGULA
        Uyari.prototype.f_ES_query = function () {
            var alert = this.alert,
                defer = result.dbQ.Q.defer();
            l.info("------------------ f_ES_sorgula -------------- > " + alert.Olay);
            console.log("alert.RENDER.ElasticQuery>" + JSON.stringify(alert.RENDER.ElasticQuery))

            if (alert.RENDER.ElasticQuery != null) {
                elastic.f_search({
                    method: "POST",
                    index: schema.SABIT.ELASTIC.INDEKS.APP,
                    type: alert.RENDER.Tipi,
                    body: alert.RENDER.ElasticQuery
                }).then(function (_resp) {

                    alert.RENDER.Sonuc.Toplam = _resp[0].hits.total;
                    alert.RENDER.Sonuc.Data = _.map(_resp[0].hits.hits, "_source");

                    defer.resolve(_resp[0]);
                });
            } else {
                var hata = {id: 0, mesaj: "Elastic sorgusu oluşturulamadı!"};
                alert.RENDER.Hata.push(hata);
                defer.reject(hata);
            }

            return defer.promise;
        };
        //endregion

        //region UYARI KİŞİLERİNİ HAZIRLA
        Uyari.prototype.f_uyari_uyelerini_hazirla = function () {
            l.info("f_uyari_uyelerini_hazirla");
            var defer = result.dbQ.Q.defer(),
                alert = this.alert;

            //uyarı gönderilecek kişileri bul
            if (alert.Uye_Idler && alert.Uye_Idler.length > 0) {

                alert.RENDER.Uyeler.id_listesi.push(alert.Uye_Idler);

                var db_kullanici = require('./db_kullanici');
                db_kullanici.f_db_uye_id(alert.Uye_Idler, alert.Tahta_Id)
                    .then(function (_uyeler) {
                        if (_uyeler && _uyeler.length > 0) {
                            //üye bilgilerini topla

                            alert.RENDER.Uyeler.uye_listesi = _uyeler;
                            alert.RENDER.Uyeler.mail_listesi = _uyeler.pluckX("EPosta");
                            alert.RENDER.Uyeler.gsm_listesi = _uyeler.pluckX("GSM");

                            console.log("alert.RENDER.Uyeler>" + JSON.stringify(alert.RENDER.Uyeler));
                            defer.resolve(alert.RENDER.Uyeler);

                        } else {
                            defer.resolve(null);
                        }

                        /*   var arrPromises = _uyeler.map(function (_uye) {
                         if (_uye) {

                         alert.RENDER.Uyeler.uye_listesi.push(_uye);

                         if (_uye.EPosta) {
                         alert.RENDER.Uyeler.mail_listesi.push(_uye.EPosta);
                         }

                         if (_uye.GSM) {
                         alert.RENDER.Uyeler.gsm_listesi.push(_uye.GSM);
                         }
                         }
                         return _uye;
                         });

                         result.dbQ.Q.all(arrPromises)
                         .then(function () {
                         console.log("alert.RENDER.Uyeler>" + JSON.stringify(alert.RENDER.Uyeler));
                         defer.resolve(alert.RENDER.Uyeler);
                         });*/
                    });

            } else {
                console.log("alert.RENDER.Uyeler>" + JSON.stringify(alert.RENDER.Uyeler));
                defer.resolve(alert.RENDER.Uyeler);
            }

            return defer.promise;
        };
        Uyari.prototype.f_uyari_rollerini_hazirla = function () {
            l.info("f_uyari_rollerini_hazirla");
            var defer = result.dbQ.Q.defer(),
                alert = this.alert;
            /*
             * Uyarı gönderilecek rol tanımlanmışsa
             * O role sahip üyeleri çekmeli ardından bulunan üyelere mail,sms..vb göndermeliyiz
             * */
            if (alert.Rol_Idler && alert.Rol_Idler.length > 0) {

                f_role_bagli_uyeler(alert.Tahta_Id, alert.Rol_Idler, alert)
                    .then(function () {
                        console.log("alert.RENDER.Uyeler>" + JSON.stringify(alert.RENDER.Uyeler));
                        defer.resolve(alert.RENDER.Uyeler);
                    });

            } else {
                //defer.reject({id: 0, mesaj: "roller dizisi gelmedi"});
                console.log("alert.RENDER.Uyeler>" + JSON.stringify(alert.RENDER.Uyeler));
                defer.resolve(alert.RENDER.Uyeler);
            }

            return defer.promise;
        };
        Uyari.prototype.f_uyari_kisilerini_hazirla = function () {
            l.info("f_uyari_kisilerini_hazirla");
            var defer = result.dbQ.Q.defer(),
                alert = this.alert;

            if (alert.RENDER.ElasticQuery != null) {
                //uyarı gönderilecek kişileri bul

                var self = this;
                result.dbQ.Q.all([
                    self.f_uyari_uyelerini_hazirla(),
                    self.f_uyari_rollerini_hazirla()
                ]).then(function () {
                    defer.resolve(alert.RENDER.Uyeler);
                });

            } else {
                var hata = {id: 0, alert: alert, mesaj: "Elastic sorgusu oluşturulamadı!"};
                alert.RENDER.Hata.push(hata);
            }

            return defer.promise;
        };
        //endregion

        //region UYARI İŞLEMLERİNİ TETİKLE
        Uyari.prototype.f_uyari_yapilacak_islemleri_tetikle = function () {
            l.info("f_uyari_yapilacak_islemleri_tetikle");

            var defer = result.dbQ.Q.defer(),
                alert = this.alert;

            l.info("alert.RENDER.Sonuc>" + JSON.stringify(alert.RENDER.Sonuc));

            if (alert.RENDER.Sonuc.Toplam > 0) {
                //hangi işlemler tanımlandı ise kişilere uygulayacağız

                var arrPromiseIslemler = alert.Islemler.map(function (_islem) {
                    if (_islem == schema.SABIT.UYARI.MAIL) {
                        //mail seçilmiş tüm kişilere mail at
                        if (alert.RENDER.Uyeler.mail_listesi.length > 0) {
                            return f_mail_secildi(alert);
                        } else {
                            alert.RENDER.Hata.push({id: 0, alert: alert, mesaj: "Uyarı gönderilecek üye bilgisi olmadığı için mail gönderilemedi!"});
                        }
                    }
                    else if (_islem == schema.SABIT.UYARI.SMS) {
                        //sms gönderilmesi istenmiş
                        //_kullanicilar.gsm_listesi;
                        return null;
                    }
                    else if (_islem == schema.SABIT.UYARI.ALERT) {
                        //kullanıcı giriş yaptığında haberlerinde göstereceğiz

                        if (alert.RENDER.Uyeler.id_listesi.length > 0) {
                            return f_alert_secildi(alert);
                        } else {
                            alert.RENDER.Hata.push({id: 0, alert: alert, mesaj: "Uyarı gönderilecek üye bilgisi olmadığı için alert eklenemedi!"});
                        }
                    }
                    else if (_islem == schema.SABIT.UYARI.TODO) {
                        //kullanıcının yapılacaklar (to-do) listesine iş düşür
                        if (alert.RENDER.Uyeler.id_listesi.length > 0) {
                            return f_todo_secildi(alert);
                        } else {
                            alert.RENDER.Hata.push({id: 0, alert: alert, mesaj: "Uyarı gönderilecek üye bilgisi olmadığı için GÖREV eklenemedi!"});
                        }
                    }
                });
                result.dbQ.Q.all(arrPromiseIslemler)
                    .then(function () {
                        console.log("uyarılar gönderildi");
                        defer.resolve("uyarılar gönderildi");
                    })
                    .fail(function (_err) {
                        console.log("uyarılar gönderilemedi.HATA>" + _err);
                        defer.reject({id: 0, mesaj: "Uyarılar gönderilemedi! HATA: " + _err});
                    });
            } else {
                var hata = {id: 0, alert: alert, mesaj: "Elastic sonucunda kritere uygun kayıt bulunamadı!"};
                alert.RENDER.Hata.push(hata);
                defer.reject({id: 0, mesaj: "Elastic sonucunda kritere uygun kayıt bulunamadı!"});
            }

            return defer.promise;
        };
        //endregion

        //region GOOGLE TAKVİME EKLE
        Uyari.prototype.f_uyariyi_google_takvime_ekle = function () {
            l.info("f_google_takvime_ekle");
            var defer = result.dbQ.Q.defer(),
                alert = this.alert;


            //gelen uyarı to-do (görev) şeklinde tanımlandı ise ve tipi ihale ise
            //ihale bilgilerine göre google takvime ekliyoruz
            var todo = alert.Islemler.filter(function (_elm) {
                return _elm == schema.SABIT.UYARI.TODO;
            });

            if (todo && todo.length > 0) {
                if (alert.RENDER.Tipi.indexOf(schema.SABIT.TABLO_ADI.IHALE) != -1) {
                    //bu kayıtlı uyarı ihale işlemi
                    //google calendar a eklemeye başla
                    l.info("******google calendar a eklemeye başla************");

                    /** @type {OptionsTahta} */
                    var opt = {};
                    opt.bAnahtarlari = false;
                    opt.bGenel = true;
                    opt.bKurumu = false;
                    opt.bRolleri = false;
                    opt.bUyeleri = false;
                    opt.bAjanda = true;

                    var db_tahta = require('./db_tahta');

                    db_tahta.f_db_tahta_id(alert.Tahta_Id, opt)
                        .then(function (_dbTahta) {
                            l.info("******tahtanın google ajandası************" + JSON.stringify(_dbTahta.Ajanda.GC));
                            if (_dbTahta.Ajanda.GC && _dbTahta.Ajanda.GC.Id) {
                                l.info("******tahtanın google ajandası seçilmiş************");
                                alert.RENDER.Uyeler.uye_listesi.forEach(function (_elm) {
                                    if (_elm.Providers.GP && _elm.Providers.GP.token) {
                                        l.info("******kullanıcının token ı var************" + _elm.Providers.GP.token);
                                        f_google_takvime_ekle(_elm, _dbTahta, _elm)
                                            .then(function (_res) {
                                                defer.resolve(_res);
                                            });
                                    }
                                    defer.resolve(null);
                                });
                            }
                            defer.resolve(null);
                        });
                }
                else {
                    defer.resolve(null);
                }
            }
            else {
                defer.resolve(null);
            }

            return defer.promise;
        };
        //endregion

        //region KUYRUKTAN SİL
        Uyari.prototype.f_kuyruktan_sil = function () {
            l.info("f_kuyruktan_sil");
            var defer = result.dbQ.Q.defer(),
                alert = this.alert;
            defer.resolve("başarılı");
            return defer.promise;
        };
        //endregion

        Uyari.prototype.f_calis = function () {
            var self = this;

            return self.f_ES_hazirla()
                .then(function () {
                    return self.f_ES_query();
                })
                .then(function () {
                    return self.f_uyari_kisilerini_hazirla();
                })
                .then(function () {
                    return self.f_uyari_yapilacak_islemleri_tetikle();
                })
                .then(function () {
                    return self.f_uyariyi_google_takvime_ekle()
                })
                .then(function () {
                    return self.f_kuyruktan_sil();
                })
                .then(function () {
                    l.info("uyarı çalıştı");
                    return "uyarı çalıştı";
                })
                .fail(function (_err) {
                    if (_err.id != 100) {
                        // hata oluştu logla
                    }
                    l.e(self.alert.Olay + " için f_calis metodunda hata alındı: " + _err);
                    l.e(_err);
                });
        };

        var uyari = new Uyari(_uyari);
        return uyari.f_calis();
    };

    /**
     * Tüm oluşturulan uyarıları çekip işleme göre tetikler.
     * @returns {*}
     */
    var f_servis_uyarilari_cek_calistir = function () {

        var defer = result.dbQ.Q.defer();

        var db_olay = require('./db_olay'),
            db_uyari = require('./db_uyari');

        result.dbQ.Q.all([
            db_olay.f_db_tetiklenecek_olay_tumu(),
            db_uyari.f_db_uyarilar_tumu()
        ]).then(function (_results) {

                // TODO: Redis üstünden OLAY'la ilintili UYARILARI çekmek için genel bir SET ve içine UYARI_ID leri konulabilir > uyarilar:OLAYLAR:IHALE:EKLENDI > 1,4,6,7
                // TODO: HMGET uyarilari (SMEMBERS uyarilar:OLAYLAR:IHALE:EKLENDI)
                arrTetiklenecekOlaylar = _results[0];
                arrUyarilar = _results[1];

                l.info("tetiklenecekler: %s \nuyarılar: %s", JSON.stringify(arrTetiklenecekOlaylar), JSON.stringify(arrUyarilar));

                var arrPromises = arrTetiklenecekOlaylar.map(f_olayi_tetikle);
                result.dbQ.Q.all(arrPromises)
                    .then(function () {
                        defer.resolve("gönderdim");
                    });

            })
            .fail(function (_err) {
                defer.reject({id: 0, mesaj: "uyarılar çekilemedi.Hata alındı:" + _err});
            });

        return defer.promise;
    };
    //endregion

    /**
     * @class DBUyariServisi
     */
    result = {
        f_servis_uyarilari_cek_calistir: f_servis_uyarilari_cek_calistir,
        f_db_uyari_sonucu_ekle: f_db_uyari_sonucu_ekle
    };

    return result;
}


/**
 *
 * @type {DBUyariServisi}
 */
var obj = DB_UyariServisi();
obj.__proto__ = require('./db_log');

module.exports = obj;