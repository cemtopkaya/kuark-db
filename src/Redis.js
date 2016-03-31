/**
 * @param {Object} result
 * @returns {KeyPrefix}
 */

/**
 *
 * @param result
 * @returns {{yetki: {idx: string, tablo: string}, rol: {idx: string, tablo: string}, kullanici: {idx: string, tablo: string, ssetGenel: string, ssetSilinen: string, hsetLocalKullanicilari: string, hsetADKullanicilari: string, hsetFacebookKullanicilari: string, hsetTwitterKullanicilari: string, hsetGCTokens: string, hsetGPlusKullanicilari: string, hsetKullaniciProfilleri: string, hsetKullaniciOturumDurumlari: string, ssetBolgeleri: KeyPrefix.kullanici.ssetBolgeleri, ssetYetkileri: KeyPrefix.kullanici.ssetYetkileri, zsetHaberAkisi: KeyPrefix.kullanici.zsetHaberAkisi, hsetHaberDetaylari: KeyPrefix.kullanici.hsetHaberDetaylari, zsetDikkat: KeyPrefix.kullanici.zsetDikkat, zsetGorev: KeyPrefix.kullanici.zsetGorev, zsetSms: KeyPrefix.kullanici.zsetSms, zsetIleti: KeyPrefix.kullanici.zsetIleti, ssetSahipOlduguTahtalari: KeyPrefix.kullanici.ssetSahipOlduguTahtalari, ssetUyeOlduguTahtalari: KeyPrefix.kullanici.ssetUyeOlduguTahtalari}, anahtar: {idx: string, tablo: string, ssetIndexIhale: KeyPrefix.anahtar.ssetIndexIhale, ssetIndexKalem: KeyPrefix.anahtar.ssetIndexKalem, ssetIndexUrun: KeyPrefix.anahtar.ssetIndexUrun}, bolge: {idx: string, tablo: string, ssetAdlari: string, ssetSehirleri: KeyPrefix.bolge.ssetSehirleri}, ihale: {idx: string, tablo: string, ssetIhaleUsulAdlari: string, ssetGenel: string, ssetSilinen: string, hsetIhale_ihaleDunyasiId: string, zsetSaglikbank: string, zsetEkap: string, zsetIhaleMerkezi: string, ssetIhaleMerkezi: string, hsetYapanKurumlari: string, ssetKalemleri: KeyPrefix.ihale.ssetKalemleri, zsetYapilmaTarihi: string, zsetSistemeEklenmeTarihi: string, ssetTeklifleri: KeyPrefix.ihale.ssetTeklifleri, ihaleDunyasi: {idx: string, tablo: string}, ssetUrunleri: KeyPrefix.ihale.ssetUrunleri}, kurum: {idx: string, tablo: string, ssetGenel: string, ssetKurum_id: string, ssetSilinen: string, hsetKurum_ihaleDunyasiId: string, ssetAdlari: string, ssetUrunleri: KeyPrefix.kurum.ssetUrunleri, ssetIhaleleri: KeyPrefix.kurum.ssetIhaleleri, ssetTeklifleri: KeyPrefix.kurum.ssetTeklifleri}, doviz: {zsetKurlari: KeyPrefix.doviz.zsetKurlari, idx: string}, urun: {idx: string, tablo: string, ssetIhaleleri: KeyPrefix.urun.ssetIhaleleri, ssetKalemleri: KeyPrefix.urun.ssetKalemleri, ssetKurumlari: KeyPrefix.urun.ssetKurumlari, ssetTeklifleri: KeyPrefix.urun.ssetTeklifleri, zsetAnahtarKelimeleri: KeyPrefix.urun.zsetAnahtarKelimeleri, hsetUreticiler: string}, ulke: {idx: string, tablo: string, ssetAdlari: string}, sehir: {idx: string, tablo: string, ssetAdlari: string}, kalem: {idx: string, tablo: string, ssetGenel: string, ssetTeklifleri: KeyPrefix.kalem.ssetTeklifleri, ssetOnayDurumlari: KeyPrefix.kalem.ssetOnayDurumlari, hsetIhaleleri: string}, teklif: {idx: string, tablo: string, hsetKurumlari: string, hsetKalemleri: string, hsetUrunleri: string, zsetTeklifYapilmaTarihi: string, ssetTeklifParaBirimli: KeyPrefix.teklif.ssetTeklifParaBirimli, ssetTeklifOnayDurumlari: KeyPrefix.teklif.ssetTeklifOnayDurumlari}, olay: {tablo: string, idx: string}, uyari: {idx: string, idxUyariSonuc: string, tablo: string, ssetTetiklenecekOlay: string, ssetPasif: string, hsetUyariSonuclari: string, zsetGorevDetay: KeyPrefix.uyari.zsetGorevDetay}, gerceklesen_olay_kuyrugu: {idx: string, tablo: string}, tahta: {idx: string, tablo: string, ssetSilinen: string, zsetHaberAkisi: KeyPrefix.tahta.zsetHaberAkisi, hsetHaberDetaylari: KeyPrefix.tahta.hsetHaberDetaylari, hsetKalemOnayDurumlari: KeyPrefix.tahta.hsetKalemOnayDurumlari, ssetOzelTahtaRolleri: KeyPrefix.tahta.ssetOzelTahtaRolleri, hsDavetler: KeyPrefix.tahta.hsDavetler, hsUyeleri: KeyPrefix.tahta.hsUyeleri, ssetTakiptekiIhaleleri: KeyPrefix.tahta.ssetTakiptekiIhaleleri, ssetUyarilari: KeyPrefix.tahta.ssetUyarilari, ssetGizlenenIhaleleri: KeyPrefix.tahta.ssetGizlenenIhaleleri, ssetGizlenenKalemleri: KeyPrefix.tahta.ssetGizlenenKalemleri, ssetGizlenenKurumlari: KeyPrefix.tahta.ssetGizlenenKurumlari, ssetEzilenIhaleleri: KeyPrefix.tahta.ssetEzilenIhaleleri, ssetEzilenKalemleri: KeyPrefix.tahta.ssetEzilenKalemleri, ssetEzilenKurumlari: KeyPrefix.tahta.ssetEzilenKurumlari, zsetAnahtarKelimeleri: KeyPrefix.tahta.zsetAnahtarKelimeleri, ssetTeklifleri: KeyPrefix.tahta.ssetTeklifleri, ssetTeklifVerilenIhaleler: KeyPrefix.tahta.ssetTeklifVerilenIhaleler, ssetOzelIhaleleri: KeyPrefix.tahta.ssetOzelIhaleleri, ssetOzelKalemleri: KeyPrefix.tahta.ssetOzelKalemleri, ssetOzelKurumlari: KeyPrefix.tahta.ssetOzelKurumlari, ssetOzelUrunleri: KeyPrefix.tahta.ssetOzelUrunleri}, temp: {zsetKullaniciDikkatTumu: KeyPrefix.temp.zsetKullaniciDikkatTumu, zsetKullaniciGorevTumu: KeyPrefix.temp.zsetKullaniciGorevTumu, ssetTahtaAnahtarIhaleleri: KeyPrefix.temp.ssetTahtaAnahtarIhaleleri, ssetTahtaIhaleTumu: KeyPrefix.temp.ssetTahtaIhaleTumu, ssetTahtaIhaleIstenmeyen: KeyPrefix.temp.ssetTahtaIhaleIstenmeyen, ssetTahtaIhale: KeyPrefix.temp.ssetTahtaIhale, ssetTahtaKalem: KeyPrefix.temp.ssetTahtaKalem, ssetTahtaKalemTumu: KeyPrefix.temp.ssetTahtaKalemTumu, ssetTahtaKalemIstenmeyen: KeyPrefix.temp.ssetTahtaKalemIstenmeyen, zsetTahtaIhaleTarihineGore: KeyPrefix.temp.zsetTahtaIhaleTarihineGore, zsetTahtaIhaleSiraliIhaleTarihineGore: KeyPrefix.temp.zsetTahtaIhaleSiraliIhaleTarihineGore, zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore: KeyPrefix.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore, ssetKurum: string, ssetTahtaKurumTumu: KeyPrefix.temp.ssetTahtaKurumTumu, ssetTahtaKurumIstenmeyen: KeyPrefix.temp.ssetTahtaKurumIstenmeyen, ssetTahtaKurum: KeyPrefix.temp.ssetTahtaKurum, ssetTahtaIhaleTeklifleri: KeyPrefix.temp.ssetTahtaIhaleTeklifleri, ssetTahtaKalemTeklifleri: KeyPrefix.temp.ssetTahtaKalemTeklifleri, ssetTahtaUrun: KeyPrefix.temp.ssetTahtaUrun, ssetTahtaKullanici: KeyPrefix.temp.ssetTahtaKullanici, ssetKullanici: string, ssetTahtaKurumTeklifleri: KeyPrefix.temp.ssetTahtaKurumTeklifleri, zsetKurumTeklifleriParaBirimli: KeyPrefix.temp.zsetKurumTeklifleriParaBirimli, zsetKurumTeklifleriOnayDurumunaGore: KeyPrefix.temp.zsetKurumTeklifleriOnayDurumunaGore, zsetUrunTeklifleriParaBirimli: KeyPrefix.temp.zsetUrunTeklifleriParaBirimli, zsetUrunTeklifleriOnayDurumunaGore: KeyPrefix.temp.zsetUrunTeklifleriOnayDurumunaGore}, yorum: {idx: string, tablo: string, ssetSilinen: string}}}
 */
var f_keyPrefixes = function (result) {

    var TAHTA = 'tahta',
        ROL = 'rol',
        SMS = 'sms',
        SONUC = 'sonuc',
        KURUM = 'kurum',
        URETICI = 'uretici',
        KALEM = 'kalem',
        URUN = 'urun',
        IHALE = 'ihale',
        IHALE_DUNYASI = 'ihaleDunyasi',
        KULLANICI = 'kullanici',
        YORUM = 'yorum',
        HABER = 'haber',
        BOLGE = 'bolge',
        SEHIR = 'sehir',
        ULKE = 'ulke',
        YETKI = 'yetki',
        TEKLIF = 'teklif',
        OLAY = 'olay',
        GERCEKLESEN_OLAY_KUYRUGU = 'kuyruk',
        UYARI = 'uyari',
        SILINEN = 'X',
        GOREV = 'gorev',
        BITTI = 'bitti',
        ILETI = 'ileti',
        DIKKAT = 'dikkat',
        DETAY = 'detay',
        SIRALI = 'S',
        GENEL = 'genel',
        ANAHTAR = 'A',
        TETIKLENECEK_OLAY = 'tetiklenecek_olay',
        OKUNAN = 'okunan',
        EZILEN = 'E', // override
        GIZLENEN = 'G',
        PASIF = 'P',
    // tahta:401:davet  cem.topa@fmc.com  [1,3,4]
        DAVET = 'davet',
    // tahta:401:uye  80  [1,3,4] > hsKey  kullanici_id  arrRoller
        UYE = 'uye',
        SAHIP = 'sahip',
        ONAY_DURUMU = 'durum',
        PROFIL = 'profil',
        IHALE_MERKEZİ = 'ihaleMerkezi',
        TAKIP = 'takip',
        TEMP = 'temp',
        TUMU = 'tumu',
        DOVIZ = 'doviz',
        KUR_TIPI = 'tipi',
        PARA_BIRIM = 'pb',
        ID = 'id',
        ADI = 'ad',
        TOKEN = 'token',
        GPLUS = 'gplus',
        FACEBOOK = 'facebook',
        TWITTER = 'twitter',
        LOCAL = 'local',
        OTURUM = 'oturum',
        ISTENMEYEN = 'istenmeyen';

    /**
     * tablo isimlendirmelerini tek yerden yönetiyoruz
     */
    var _idx = "idx";

    /**
     * @class KeyPrefix
     */
    var keyPrefixes = {
        yetki: {
            idx: _idx + ":" + YETKI,
            tablo: YETKI
        },
        rol: {
            idx: _idx + ":" + ROL,
            tablo: ROL,
            //roller ilişkili bölgeleri tutuyoruz
            ssetBolgeleri: function (_rol_id) {
                return ROL + ":" + _rol_id + ":" + BOLGE;
            }
        },
        kullanici: {
            idx: _idx + ":" + KULLANICI,
            tablo: KULLANICI,
            ssetGenel: KULLANICI + ":" + GENEL,
            ssetSilinen: KULLANICI + ":" + SILINEN,
            hsetLocalKullanicilari: KULLANICI + ":" + LOCAL,
            hsetADKullanicilari: KULLANICI + ":" + ADI,
            hsetFacebookKullanicilari: KULLANICI + ":" + FACEBOOK,
            hsetTwitterKullanicilari: KULLANICI + ":" + TWITTER,
            //google refresh token bilgilerini içerir
            hsetGPlusToken: KULLANICI + ":" + GPLUS + ":" + TOKEN,
            hsetGPlusKullanicilari: KULLANICI + ":" + GPLUS,
            hsetKullaniciProfilleri: KULLANICI + ":" + PROFIL,
            hsetKullaniciOturumDurumlari: KULLANICI + ":" + OTURUM + ":" + ONAY_DURUMU,
            ssetBolgeleri: function (_kul_id) {
                return KULLANICI + ":" + _kul_id + ":" + BOLGE
            },
            ssetYetkileri: function (_kul_id) {
                return KULLANICI + ":" + _kul_id + ":" + YETKI
            },
            zsetHaberAkisi: function (_kul_id, _eklenen, _silinen, _okunan) {
                if (_eklenen) {
                    return KULLANICI + ":" + _kul_id + ":" + HABER;
                }

                if (_silinen) {
                    return KULLANICI + ":" + _kul_id + ":" + HABER + ":" + SILINEN;
                }

                if (_okunan) {
                    return KULLANICI + ":" + _kul_id + ":" + HABER + ":" + OKUNAN;
                }
            },
            hsetHaberDetaylari: function (_kul_id) {
                return KULLANICI + ":" + _kul_id + ":" + HABER + ":" + DETAY;
            },

            zsetDikkat: function (_kul_id, _yeni, _silinen, _okunan) {

                if (_yeni === true) {
                    return KULLANICI + ":" + _kul_id + ":" + DIKKAT;
                }

                if (_silinen === true) {
                    return KULLANICI + ":" + _kul_id + ":" + DIKKAT + ":" + SILINEN;
                }

                if (_okunan === true) {
                    return KULLANICI + ":" + _kul_id + ":" + DIKKAT + ":" + OKUNAN;
                }
            },

            zsetGorev: function (_kul_id, _tumu, _biten) {

                if (_tumu === true) {
                    return KULLANICI + ":" + _kul_id + ":" + GOREV;
                }

                if (_biten === true) {
                    return KULLANICI + ":" + _kul_id + ":" + GOREV + ":" + BITTI;
                }
            },
            zsetSms: function (_kul_id) {

                return KULLANICI + ":" + _kul_id + ":" + SMS;


                /*     if (_silinen === true) {
                 return KULLANICI + ":" + _kul_id + ":" + SMS + ":" + SILINEN;
                 }

                 if (_okunan === true) {
                 return KULLANICI + ":" + _kul_id + ":" + SMS + ":" + OKUNAN;
                 }*/
            },
            zsetIleti: function (_kul_id) {

                return KULLANICI + ":" + _kul_id + ":" + ILETI;


                /* if (_silinen === true) {
                 return KULLANICI + ":" + _kul_id + ":" + ILETI + ":" + SILINEN;
                 }

                 if (_okunan === true) {
                 return KULLANICI + ":" + _kul_id + ":" + ILETI + ":" + OKUNAN;
                 }*/
            },

            ssetSahipOlduguTahtalari: function (_kul_id, _eklenen) {
                return _eklenen
                    ? KULLANICI + ":" + _kul_id + ":" + TAHTA + ":" + SAHIP
                    : KULLANICI + ":" + _kul_id + ":" + TAHTA + ":" + SILINEN + ":" + SAHIP;
            },
            ssetUyeOlduguTahtalari: function (_kul_id, _eklenen) {
                return _eklenen
                    ? KULLANICI + ":" + _kul_id + ":" + TAHTA + ":" + UYE
                    : KULLANICI + ":" + _kul_id + ":" + TAHTA + ":" + SILINEN + ":" + UYE;
            }
        },
        anahtar: {
            idx: _idx + ":" + ANAHTAR,
            tablo: ANAHTAR,
            ssetIndexIhale: function (_anahtar_id) {
                return ANAHTAR + ":" + _anahtar_id + ":" + IHALE;
            },
            ssetIndexKalem: function (_anahtar_id) {
                return ANAHTAR + ":" + _anahtar_id + ":" + KALEM;
            },
            ssetIndexUrun: function (_anahtar_id) {
                return ANAHTAR + ":" + _anahtar_id + ":" + URUN;
            }
        },
        bolge: {
            idx: _idx + ":" + BOLGE,
            tablo: BOLGE,
            ssetBolgeGenel: BOLGE + ":" + GENEL,
            ssetAdlari: BOLGE + ":" + ADI,
            ssetSehirleri: function (_bolge_id) {
                return BOLGE + ":" + _bolge_id + ":" + SEHIR;
            }
        },
        ulke: {
            idx: _idx + ":" + ULKE,
            tablo: ULKE,
            ssetAdlari: ULKE + ":" + ADI
        },
        sehir: {
            idx: _idx + ":" + SEHIR,
            tablo: SEHIR,
            ssetAdlari: SEHIR + ":" + ADI
        },
        ihale: {
            idx: _idx + ":" + IHALE,
            tablo: IHALE,
            ssetIhaleUsulAdlari: IHALE + ":usul:" + ADI,
            ssetGenel: IHALE + ":" + GENEL,
            ssetSilinen: IHALE + ":" + SILINEN,
            // Ihale Dunyasindan gelen ihalenin ihale_id değerini sistemdeki ihale.Id ile burada tutacağız.
            hsetIhale_ihaleDunyasiId: IHALE + ":ihaleDunyasi:" + ID,
            zsetSaglikbank: IHALE + ":saglikbank",
            zsetEkap: IHALE + ":ekap",
            zsetIhaleMerkezi: IHALE + ":" + IHALE_MERKEZİ + ":ihaleTarihi",
            ssetIhaleMerkezi: IHALE + ":" + IHALE_MERKEZİ,
            hsetYapanKurumlari: IHALE + ":" + KURUM,
            ssetKalemleri: function (_ihale_id) {
                return IHALE + ":" + _ihale_id + ":" + KALEM;
            },
            zsetYapilmaTarihi: IHALE + ":tarih:yapilma",
            zsetSistemeEklenmeTarihi: IHALE + ":tarih:sistemeEklenme",

            ssetTeklifleri: function (_ihale_id) {
                return IHALE + ":" + _ihale_id + ":" + TEKLIF;
            },
            ihaleDunyasi: {
                idx: _idx + ":" + IHALE_DUNYASI,
                tablo: IHALE_DUNYASI
            },
            ssetUrunleri: function (_tahta_id, _ihale_id) {
                return TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + URUN;
            }
        },
        kurum: {
            idx: _idx + ":" + KURUM,
            tablo: KURUM,
            ssetGenel: KURUM + ":" + GENEL,
            ssetKurum_id: KURUM + ":" + ID,
            ssetSilinen: KURUM + ":" + SILINEN,
            // kurum:ihaleDunyasi:id > ihaleDunyasi_id | kurum_id > ihale dünyasındaki id ile redis_kurum_id bulunacak
            hsetKurum_ihaleDunyasiId: KURUM + ":ihaleDunyasi:" + ID,
            ssetAdlari: KURUM + ":" + ADI,
            ssetUrunleri: function (_tahta_id, _kurum_id) {
                return _tahta_id && _tahta_id > 0
                    ? TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + _kurum_id + ":" + URUN
                    : KURUM + ":" + _kurum_id + ":" + URUN;
            },
            ssetIhaleleri: function (_kurum_id) {
                return KURUM + ":" + _kurum_id + ":" + IHALE;
            },
            ssetTeklifleri: function (kurum_id) {
                return KURUM + ":" + kurum_id + ":" + TEKLIF;
            }
        },
        doviz: {
            zsetKurlari: function (_para_birim_id, _kurTipi_id) {
                return DOVIZ + ":" + PARA_BIRIM + ":" + _para_birim_id + ":" + KUR_TIPI + ":" + _kurTipi_id;
            },
            idx: _idx + ":" + DOVIZ
        },
        urun: {
            idx: _idx + ":" + URUN,
            tablo: URUN,
            ssetIhaleleri: function (_tahta_id, _urun_id) {
                return TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + IHALE;
            },
            ssetKalemleri: function (_tahta_id, _urun_id) {
                return TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + KALEM;
            },
            ssetKurumlari: function (_tahta_id, _urun_id) {
                return _tahta_id && _tahta_id > 0
                    ? TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + KURUM
                    : URUN + ":" + _urun_id + ":" + KURUM;
            },
            ssetTeklifleri: function (_tahta_id, _urun_id) {
                return TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + TEKLIF;
            },
            zsetAnahtarKelimeleri: function (_tahta_id, _urun_id) {
                return TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + ANAHTAR;
            },
            hsetUreticiler: URUN + ":" + URETICI

        },
        kalem: {
            idx: _idx + ":" + KALEM,
            tablo: KALEM,
            ssetGenel: KALEM + ":" + GENEL,
            ssetTeklifleri: function (_kalem_id) {
                return KALEM + ":" + _kalem_id + ":" + TEKLIF;
            },
            ssetOnayDurumlari: function (_tahta_id, _durum_id) {
                return TAHTA + ":" + _tahta_id + ":" + KALEM + ":" + ONAY_DURUMU + ":" + _durum_id;
            },
            hsetIhaleleri: KALEM + ":" + IHALE
        },
        teklif: {
            idx: _idx + ":" + TEKLIF,
            tablo: TEKLIF,
            hsetKurumlari: TEKLIF + ":" + KURUM,
            hsetKalemleri: TEKLIF + ":" + KALEM,
            hsetUrunleri: TEKLIF + ":" + URUN,
            //teklifleri tarihe göre sıralayabilmek için gerekli
            //zsetTeklifYapilmaTarihi: TEKLIF + ":tarih:yapilma",
            //teklifleri para birimine göre ayırmamızı sağlar
            ssetTeklifParaBirimli: function (para_id) {
                return TEKLIF + ":" + PARA_BIRIM + ":" + para_id;
            },
            //teklifleri onay durumuna göre ayırmamızı sağlar
            ssetTeklifOnayDurumlari: function (durum_id) {
                return TEKLIF + ":" + ONAY_DURUMU + ":" + durum_id;
            }
        },
        olay: {
            tablo: OLAY,
            idx: _idx + ":" + OLAY
        },
        uyari: {
            idx: _idx + ":" + UYARI,
            idxUyariSonuc: _idx + ":" + UYARI + ":" + SONUC,
            tablo: UYARI,
            ssetTetiklenecekOlay: TETIKLENECEK_OLAY,
            ssetPasif: UYARI + ":" + PASIF,
            hsetUyariSonuclari: UYARI + ":" + SONUC,
            zsetGorevDetay: function (_gorev_id) {
                return GOREV + ":" + _gorev_id + ":" + DETAY;
            }
        },
        gerceklesen_olay_kuyrugu: {
            idx: _idx + ":" + GERCEKLESEN_OLAY_KUYRUGU,
            tablo: GERCEKLESEN_OLAY_KUYRUGU
        },
        tahta: {
            idx: _idx + ":" + TAHTA,
            tablo: TAHTA,
            ssetSilinen: TAHTA + ":" + SILINEN,
            ssetBolgeleri: function (_tahta_id, _eklenen) {

                return _eklenen
                    ? TAHTA + ":" + _tahta_id + ":" + BOLGE
                    : TAHTA + ":" + _tahta_id + ":" + BOLGE + ":" + SILINEN;
            },

            hsetTahtaAjanda: TAHTA + ":ajanda",
            zsetHaberAkisi: function (_tahta_id, _eklenen, _silinen, _okunan) {
                if (_eklenen) {
                    return TAHTA + ":" + _tahta_id + ":" + HABER;
                }

                if (_silinen) {
                    return TAHTA + ":" + _tahta_id + ":" + HABER + ":" + SILINEN;
                }

                if (_okunan) {
                    return TAHTA + ":" + _tahta_id + ":" + HABER + ":" + OKUNAN;
                }
            },
            hsetHaberDetaylari: function (_tahta_id) {
                return TAHTA + ":" + _tahta_id + ":" + HABER + ":" + DETAY
            },

            hsetKalemOnayDurumlari: function (_tahta_id) {
                return TAHTA + ":" + _tahta_id + ":" + KALEM + ":" + ONAY_DURUMU;
            },

            ssetOzelTahtaRolleri: function (_tahta_id, _eklenen) {
                if (_eklenen) {
                    return TAHTA + ":" + _tahta_id + ":" + ROL
                } else {
                    return TAHTA + ":" + _tahta_id + ":" + SILINEN + ":" + ROL
                }
            },
            hsDavetler: function (tahta_id) {
                // tahta:401:davet:uid  213-234-234234234-23423 cem.topa@fmc.com
                return TAHTA + ":" + tahta_id + ":" + DAVET;
            },
            /**
             * tahta:401:uye > 80 > [1,2,9] : 80 id li kullanıcının 401 numaralı tahtada 1,2 ve 9 numaralı rollere sahip olduğunu gösterir
             * @param {integer} tahta_id
             * @returns {string}
             */
            hsUyeleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + UYE;
            },

            ssetTakiptekiIhaleleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + TAKIP + ":" + IHALE;
            },
            ssetTakiptekiKalemleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + TAKIP + ":" + KALEM;
            },
            //uyarıları
            ssetUyarilari: function (tahta_id, _eklenen) {
                if (_eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + UYARI;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + SILINEN + ":" + UYARI;
                }
            },
            //GİZLENENLER
            ssetGizlenenIhaleleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + GIZLENEN + ":" + IHALE;
            },
            ssetGizlenenKalemleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + GIZLENEN + ":" + KALEM;
            },
            ssetGizlenenKurumlari: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + GIZLENEN + ":" + KURUM;
            },

            //EZİLENLER
            ssetEzilenIhaleleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + EZILEN + ":" + IHALE;
            },
            ssetEzilenKalemleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + EZILEN + ":" + KALEM;
            },
            ssetEzilenKurumlari: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + EZILEN + ":" + KURUM;
            },

            zsetAnahtarKelimeleri: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + ANAHTAR;
            },

            ssetTeklifleri: function (tahta_id, eklenen) {
                if (eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + TEKLIF;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + SILINEN + ":" + TEKLIF;
                }
            },
            ssetTeklifVerilenIhaleler: function (tahta_id) {
                return TAHTA + ":" + tahta_id + ":" + TEKLIF + ":" + IHALE;
            },

            ssetOzelIhaleleri: function (tahta_id, eklenen) {
                if (eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + IHALE;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + SILINEN + ":" + IHALE;
                }
            },
            ssetOzelKalemleri: function (tahta_id, _ihale_id, eklenen) {
                if (eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + KALEM;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + SILINEN + ":" + KALEM;
                }
            },
            ssetOzelKurumlari: function (tahta_id, eklenen) {
                if (eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + KURUM;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + SILINEN + ":" + KURUM;
                }
            },
            ssetOzelUrunleri: function (tahta_id, eklenen) {
                if (eklenen) {
                    return TAHTA + ":" + tahta_id + ":" + URUN;
                } else {
                    return TAHTA + ":" + tahta_id + ":" + SILINEN + ":" + URUN;
                }
            }
        },
        temp: {

            //KULLANICI BİLDİRİMLERİ
            zsetKullaniciDikkatTumu: function (_kul_id) {
                return TEMP + ":" + KULLANICI + ":" + _kul_id + ":" + DIKKAT + ":" + TUMU;
            },

            zsetKullaniciGorevTumu: function (_kul_id) {
                return TEMP + ":" + KULLANICI + ":" + _kul_id + ":" + GOREV + ":" + TUMU;
            },

            /**
             * Tahtanın anahtarlarına uygun bulunan kalemler
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaAnahtarKalemleri: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + ANAHTAR + ":" + KALEM;
            },

            /**
             * Tahtanın anahtarlarına uygun bulunan ihaleler
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaAnahtarIhaleleri: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + ANAHTAR + ":" + IHALE;
            },

            //ihale kalemleri
            zsetTahtaIhaleKalemleri: function (_tahta_id, _ihale_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + KALEM;
            },

            ssetTahtaIhaleTumu: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + TUMU;
            },
            ssetTahtaIhaleIstenmeyen: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + ISTENMEYEN;
            },
            /**
             * Tahtanın görebileceği tüm ihaleler
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaIhale: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE;
            },

            /**
             * Tahtanın görebileceği tüm kalemler
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaKalem: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KALEM;
            },
            ssetTahtaKalemTumu: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KALEM + ":" + TUMU;
            },
            ssetTahtaKalemIstenmeyen: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KALEM + ":" + ISTENMEYEN;
            },

            zsetTahtaIhaleTarihineGore: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":tarih:yapilma";
            },
            zsetTahtaIhaleSiraliIhaleTarihineGore: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":tarih:yapilma" + ":" + SIRALI;
            },
            zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + ANAHTAR + ":" + IHALE + ":tarih:yapilma" + ":" + SIRALI;
            },

            /**
             * Genelin görebileceği aktif kurumların tümü > kurum:genel - kurum:x
             */
            ssetKurum: TEMP + ":" + KURUM,


            ssetTahtaKurumTumu: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + TUMU;
            },

            /**
             * Tahtanın gizlediği , ezdiği ve kendi ekleyip sildiği kurumlar > tahta:401:kurum:X + tahta:401:kurum:E + tahta:401:kurum:G
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaKurumIstenmeyen: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + ISTENMEYEN;
            },

            /**
             * Tahtanın görebileceği aktif kurumlar (genel+özel aktif kurumlar) > (temp:kurum + tahta:401:kurum) - temp:tahta:401:kurum:istenmeyen
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaKurum: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM;
            },


            ssetTahtaIhaleTeklifleri: function (_tahta_id, _ihale_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + IHALE + ":" + _ihale_id + ":" + TEKLIF;
            },

            ssetTahtaKalemTeklifleri: function (_tahta_id, _kalem_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KALEM + ":" + _kalem_id + ":" + TEKLIF;
            },


            /**
             * Tahtanın görebileceği tüm aktif ürünler(tahta:401:urun)
             * @param _tahta_id
             * @returns {string}
             */
            ssetTahtaUrun: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + URUN;
            },
            ssetTahtaKullanici: function (_tahta_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KULLANICI;
            },
            ssetKullanici: TEMP + ":" + KULLANICI,

            ssetTahtaKurumTeklifleri: function (_tahta_id, _kurum_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + _kurum_id + ":" + TEKLIF;
            },
            //kurumun verdiği x para birimli teklifleri içerir
            zsetKurumTeklifleriParaBirimli: function (_tahta_id, _kurum_id, _para_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + _kurum_id + ":" + PARA_BIRIM + ":" + _para_id + ":" + TEKLIF;
            },
            //kurumun verdiği x onay durumuna göre teklifleri
            zsetKurumTeklifleriOnayDurumunaGore: function (_tahta_id, _kurum_id, _durum_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + KURUM + ":" + _kurum_id + ":" + ONAY_DURUMU + ":" + _durum_id + ":" + TEKLIF;
            },


            zsetUrunTeklifleriParaBirimli: function (_tahta_id, _urun_id, _para_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + PARA_BIRIM + ":" + _para_id + ":" + TEKLIF;
            },
            zsetUrunTeklifleriOnayDurumunaGore: function (_tahta_id, _urun_id, _durum_id) {
                return TEMP + ":" + TAHTA + ":" + _tahta_id + ":" + URUN + ":" + _urun_id + ":" + ONAY_DURUMU + ":" + _durum_id + ":" + TEKLIF;
            }
        },
        yorum: {
            idx: _idx + ":" + YORUM,
            tablo: YORUM,
            ssetSilinen: YORUM + ":" + SILINEN
        }
    };

    return keyPrefixes;
};


/**
 *
 * @param _dbNo
 * @returns {Redis}
 * @constructor
 */
function REDIS(_dbNo) {

    var redis = require('redis'),
        q = require('q'),
        dbNo = _dbNo || 0,
        /**
         *
         * @type {Redis}
         */
        result = null;

    /** @type {KeyPrefix} */
    var keyPrefixes = {},
        redisClient = {},
        /** @type {DBQ} */
        dbQ = {};


    var f_initRedisClient = function () {
        /**
         * redis client tek yerde oluşturuyoruz
         */
        var dbHost = {
            host: '127.0.0.1',
            //host: '10.130.214.126',
            port: 6379,
            options: {}
        };

        redisClient = redis.createClient(dbHost.port, dbHost.host, dbHost.options)
            .on("ready", function () {
                console.info("\n******* Redis DB Connection *****");
                console.info(dbHost.host, ":", dbHost.port, " Successfully Established");
            })
            .on("end", function () {
                l.info("Redis Connection Terminated to ", dbHost.host, dbHost.port);
            })
            .on("error", function (err) {
                l.info("Redis Error event - " + dbHost.host + ":" + dbHost.port + " - " + err);
            })
            .on("subscribe", function (channel, count) {
            })
            .on("message", function (channel, message) {
                l.info("Redis client1 channel " + channel + ": " + message);
            });


        redisClient.select(dbNo, function (err, res) {
            // you'll want to check that the select was successful here
            if (err) return err;
            console.info(dbNo + " No'lu DB seçildi...\n")
        });
    };

    function f_init_sabitler() {
        var c = redisClient;
        /**
         * @class DBQ
         */
        return {
            flushdb: q.nbind(c.flushdb, c),
            Q: q,
            exists: q.nbind(c.exists, c),
            get: q.nbind(c.get, c),
            eval: q.nbind(c.eval, c),
            set: q.nbind(c.set, c),
            del: q.nbind(c.del, c),
            keys: q.nbind(c.keys, c),
            expire: q.nbind(c.expire, c),
            rename: q.nbind(c.rename, c),
            setnx: q.nbind(c.setnx, c),
            incr: q.nbind(c.incr, c),
            incrby: q.nbind(c.incrby, c),
            hlen: q.nbind(c.hlen, c),
            hset: q.nbind(c.hset, c),
            hget: q.nbind(c.hget, c),
            hget_json_parse: function () {
                var args = Array.prototype.slice.apply(arguments);
                return q.nfapply(c.hget.bind(c), args)
                    .then(function (_dbReply) {
                        return _dbReply != null
                            ? JSON.parse(_dbReply)
                            : null;
                    });
            },
            hdel: q.nbind(c.hdel, c),
            hexists: q.nbind(c.hexists, c),
            hmset: q.nbind(c.hmset, c),
            hmset_array: function () {
                return q.nfapply(c.hmset.bind(c), arguments);
            },
            hkeys: q.nbind(c.hkeys, c),
            hmget: q.nbind(c.hmget, c),
            hmget_array: function () {
                console.log("-----------------------   ----- hmget_array");
                ssg = [{"arguments": arguments}];
                return q.nfapply(c.hmget.bind(c), arguments);
            },
            hmget_json_parse: function () {
                var args = Array.prototype.slice.apply(arguments);
                return q.nfapply(c.hmget.bind(c), args)
                    .then(function (_dbReplies) {
                        return _dbReplies.jparse();

                        /*   console.log("Burada: ", _dbReplies)
                         console.log("dizi mi: ", Array.isArray(_dbReplies));
                         console.log("A. varmi jparse: ", [].hasOwnProperty('jparse'));
                         console.log("varmi jparse: ", _dbReplies.hasOwnProperty('jparse'));
                         return Array.isArray(_dbReplies)
                         ? _dbReplies.map(function (elm) { return elm ? JSON.parse(elm) : null; })
                         : _dbReplies;*/
                    });
            },
            hvals: q.nbind(c.hvals, c),
            hvals_json_parse: function () {
                var args = Array.prototype.slice.apply(arguments);
                return q.nfapply(c.hvals.bind(c), args)
                    .then(function (_dbReplies) {
                        return _dbReplies.jparse();
                    });
            },
            hgetall: q.nbind(c.hgetall, c),
            hgetall_array: function () {
                var args = Array.prototype.slice.apply(arguments),
                    resultArr = [];
                return q.nfapply(c.hgetall.bind(c), args)
                    .then(function (_dbReplies) {
                        for (var prop in _dbReplies) {
                            resultArr.push({
                                key: prop,
                                value: _dbReplies[prop]
                            });
                        }
                        return resultArr;
                    });
            },
            hscan: q.nbind(c.hscan, c),


            select: q.nbind(c.select, c),

            // SET
            scan: q.nbind(c.scan, c),
            scard: q.nbind(c.scard, c),
            smembers: q.nbind(c.smembers, c),
            sismember: q.nbind(c.sismember, c),
            sscan: q.nbind(c.sscan, c),
            sadd: q.nbind(c.sadd, c),
            sadd_array: function () {
                return q.nfapply(c.sadd.bind(c), arguments);
            },
            srem: q.nbind(c.srem, c),
            sdiff: q.nbind(c.sdiff, c),
            sdiffstore: q.nbind(c.sdiffstore, c),
            sdiffstore_array: function () {
                return q.nfapply(c.sdiffstore.bind(c), arguments);
            },
            sinter: q.nbind(c.sinter, c),
            sinterstore: q.nbind(c.sinterstore, c),
            sinterstore_array: function () {
                return q.nfapply(c.sinterstore.bind(c), arguments);
            },
            sort: q.nbind(c.sort, c),
            sunion: q.nbind(c.sunion, c),
            sunion_array: function () {
                return q.nfapply(c.sunion.bind(c), arguments);
            },
            sunionstore: q.nbind(c.sunionstore, c),
            sunionstore_array: function () {
                return q.nfapply(c.sunionstore.bind(c), arguments);
            },

            // PUB/SUB
            publish: q.nbind(c.publish, c),
            subscribe: q.nbind(c.subscribe, c),


            // SORTED SET
            zadd: q.nbind(c.zadd, c),
            zadd_array: function () {
                return q.nfapply(c.zadd.bind(c), arguments);
            },
            zrem: q.nbind(c.zrem, c),
            zscore: q.nbind(c.zscore, c),
            zscan: q.nbind(c.zscan, c),
            zrange: q.nbind(c.zrange, c),
            zrevrange: q.nbind(c.zrevrange, c),
            zrangebyscore: q.nbind(c.zrangebyscore, c),
            zrevrangebyscore: q.nbind(c.zrevrangebyscore, c),
            zinterstore: q.nbind(c.zinterstore, c),
            zunionstore: q.nbind(c.zunionstore, c),
            zcount: q.nbind(c.zcount, c),
            zcard: q.nbind(c.zcard, c)
        };
    }

    var init = function () {

        f_initRedisClient();
        dbQ = f_init_sabitler();
        keyPrefixes = f_keyPrefixes(result);
    };
    init();

    /**
     * @class Redis
     */
    result = {
        dbQ: dbQ,
        rc: redisClient,
        kp: keyPrefixes
    };

    return result;
}


/**
 *
 * @type {Redis}
 */
var obj = REDIS();

module.exports = obj;