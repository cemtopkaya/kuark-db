var elastic = require('./elastic'),
    indeksleme = require('./indeksleme'),
    schema = require('./kuark-schema'),
    db = require("../src/index")(),
    log = db.log,
    olay = db.olay,
    emitter = new (require('events').EventEmitter)();


/**
 * Yeni kayıt yapıldığında tahta_id yoksa(genelene eklenenler için) temp leri siliyoruz
 * @returns {*}
 */
function f_temp_sil() {
    return db.redis.dbQ.keys("temp:tahta:*")
        .then(function (_keys) {
            if (_keys && _keys.length > 0) {
                console.log("-----------------------------**********************----- silinecek");
                console.log("keys: ", JSON.stringify(_keys));

                return db.redis.dbQ.del(_keys);
            }
            return null;
        });
}


//region ORTAK
var lstEklenenIhaleler = [],
    lstEklenenKalemler = [],
    lstEklenenKurumlar = [],
    lstEklenenAnahtarlar = [],
    timeoutIhaleEklendi,
    timeoutKalemEklendi,
    timeoutKurumEklendi,
    timeoutAnahtarEklendi;

var wait = function (olayAdi, _condFunc, _readyFunc, _checkInterval) {

    switch (olayAdi) {

        case schema.SABIT.OLAY.KURUM_EKLENDI:
            if (!timeoutKurumEklendi) {
                var checkFunc = function (oncekiSonId) {
                    if (_condFunc(oncekiSonId)) {
                        _readyFunc();
                        clearTimeout(timeoutKurumEklendi);
                    } else {
                        timeoutKurumEklendi = setTimeout(function () {
                            var simdikiSonId = lstEklenenKurumlar.last()[0].Id;
                            checkFunc(simdikiSonId);
                        }, _checkInterval);
                    }
                };

                checkFunc();
            }
            break;

        case schema.SABIT.OLAY.IHALE_EKLENDI:
            if (!timeoutIhaleEklendi && lstEklenenIhaleler.length) {
                var checkFunc = function (oncekiSonId) {
                    if (_condFunc(oncekiSonId)) {
                        _readyFunc();
                        clearTimeout(timeoutIhaleEklendi);
                    } else {
                        timeoutIhaleEklendi = setTimeout(function () {
                            var simdikiSonId = lstEklenenIhaleler.last()[0].Id;
                            checkFunc(simdikiSonId);
                        }, _checkInterval);
                    }
                };

                checkFunc();
            }
            break;

        case schema.SABIT.OLAY.KALEM_EKLENDI:
            if (!timeoutKalemEklendi) {
                var checkFunc = function (oncekiSonId) {
                    if (_condFunc(oncekiSonId)) {
                        _readyFunc();
                        clearTimeout(timeoutKalemEklendi);
                    } else {
                        timeoutKalemEklendi = setTimeout(function () {
                            var simdikiSonId = lstEklenenKalemler.last()[0].Id;
                            checkFunc(simdikiSonId);
                        }, _checkInterval);
                    }
                };

                checkFunc();
            }
            break;

        case schema.SABIT.OLAY.TAHTA_ANAHTAR_EKLENDI:
            if (!timeoutAnahtarEklendi) {
                var checkFunc = function (oncekiSonId) {
                    if (_condFunc(oncekiSonId)) {
                        _readyFunc();
                        clearTimeout(timeoutAnahtarEklendi);
                    } else {
                        timeoutAnahtarEklendi = setTimeout(function () {
                            var simdikiSonId = lstEklenenAnahtarlar.last()[0].Id;
                            checkFunc(simdikiSonId);
                        }, _checkInterval);
                    }
                };

                checkFunc();
            }
            break;
    }
};
//endregion

//region KURUM

function f_temp_sil_kurum(_tahta_id) {
    if (_tahta_id) {
        return [
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKurum(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKurumIstenmeyen(_tahta_id))
        ].allX();
    }
    else {
        return null;
    }

}

emitter.on(schema.SABIT.OLAY.KURUM_EKLENDI, function (_kurum, _kurum_id, _tahta_id, _kul_id) {
    var f_calis = function (_kurum, _kurum_id, _tahta_id) {

        l.i("--------------: ON Kurum eklendi :-------------");

        var bulk = arguments.length
            // parametre var, tek bir ihale için çalışacak
            ? false
            // parametre yok lstEklenenIhaleler için çalışacak
            : true;

        return (_tahta_id && _tahta_id > 0 // _tahta_id varsa temp alanlar silinecek
            ? f_temp_sil_kurum(_tahta_id)
            : f_temp_sil())
            .then(function () {

                if (bulk) {
                    var arrBulk = [];
                    lstEklenenKurumlar.forEach(function (_arguments) {
                        var ayar = {"index": {"_index": schema.SABIT.ELASTIC.INDEKS.APP, "_type": schema.SABIT.ELASTIC.TIP.KURUM, "_id": _arguments[0].Id}};
                        arrBulk.push(ayar);
                        arrBulk.push(_arguments[0]);
                    });

                    elastic.f_bulk({body: arrBulk})
                } else {
                    elastic.f_index.kurum(_kurum);
                }

                //kuyruga ekle
                olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KURUM_EKLENDI, _kurum.Id);

                //loglara ekle
                //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KURUM, _kurum, false, _kul_id);
            });
    };

    f_calis(_kurum, _kurum_id, _tahta_id);

    // Tahta_id varsa hemen calis yoksa "veri geliyor demektir" bekle ve bitmişse calis
    /* if (_tahta_id) {
     f_calis(_kurum, _kurum_id, _tahta_id);

     } else {
     lstEklenenKurumlar.push(arguments);
     wait(
     schema.SABIT.OLAY.KURUM_EKLENDI,
     function (oncekiSonId) {
     return lstEklenenKurumlar.last()[0].Id == oncekiSonId;
     },
     f_calis,
     2000
     );
     }*/
});
emitter.on(schema.SABIT.OLAY.KURUM_GUNCELLENDI, function (_kurum, _tahta_id, _kul_id) {
    //templeri sil
    f_temp_sil_kurum(_tahta_id);

    //elastik başla");
    elastic.f_index.kurum(_kurum);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KURUM_GUNCELLENDI, _kurum.Id);

    //loglara ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KURUM, _kurum, false, _kul_id);

});
emitter.on(schema.SABIT.OLAY.KURUM_SILINDI, function (_kurum, _tahta_id, _kul_id) {
    //templeri sil
    f_temp_sil_kurum(_tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KURUM_SILINDI, _kurum.Id);

    //loglara ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KURUM, _kurum, true, _kul_id);

    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.KURUM,
        id: _kurum.Id
    }).then(function (error, response) {
        if (error) {
            console.log("KURUM silinirken hata alındı " + error)
        }
    });

});
emitter.on(schema.SABIT.OLAY.KURUM_GIZLENDI, function (_kurum_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_kurum(_tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KURUM_GIZLENDI, _kurum_id);

});
emitter.on(schema.SABIT.OLAY.KURUM_GIZLENDI_IPTAL, function (_kurum_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_kurum(_tahta_id);

    //Olay kuyruğuna ekle
    //olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KURUM_GIZLENDI_IPTAL, _kurum_id);

});
//endregion

//region İHALE

function f_temp_sil_ihale(_tahta_id) {
    if (_tahta_id) {
        return db.redis.dbQ.Q.all([
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaIhale(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.zsetTahtaIhaleSiraliIhaleTarihineGore(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id))
        ]);
    } else {
        return null;
    }
}

emitter.on(schema.SABIT.OLAY.IHALE_EKLENDI, function (_ihale, _kurum_id, _tahta_id, _kul_id) {

    var f_calis = function (_ihale, _kurum_id, _tahta_id) {

        l.i("--------------: ON ihale eklendi :-------------");

        var bulk = arguments.length
            // parametre var, tek bir ihale için çalışacak
            ? false
            // parametre yok lstEklenenIhaleler için çalışacak
            : true;

        return (_tahta_id && _tahta_id > 0 // _tahta_id varsa temp alanlar silinecek
            ? f_temp_sil_ihale(_tahta_id)
            : f_temp_sil())
            .then(function () {

                // TODO: Buna gerek yok sanırım. İlk kez eklenen ihaleyi nereden kaldıracağız
                //indeksleme.f_tahta_anahtar_indekslerinden_ihaleyi_kaldir(_ihale.Id, _tahta_id);

                if (bulk) {
                    var arrBulk = [],
                        arrBulk_raw = [];

                    //ihale ekleme durumu sadece ihale dünyasından ekleme şeklinde olmayabilir.
                    //genel ihale ezildiğinde de yeni bir ihale eklenir.
                    //bu nedenle IhaleProvider olup olmama durumuna göre elastic e eklenir.

                    lstEklenenIhaleler.forEach(function (_arguments) {
                            if (_arguments[0].IhaleProviders) {
                                var ihale_dunyasi_raw = _arguments[0].IhaleProviders.IhaleDunyasi.raw;
                                delete _arguments[0].IhaleProviders.IhaleDunyasi.raw;
                            }

                            var ayar = {"index": {"_index": schema.SABIT.ELASTIC.INDEKS.APP, "_type": schema.SABIT.ELASTIC.TIP.IHALE, "_id": _arguments[0].Id}};
                            arrBulk.push(ayar);
                            arrBulk.push(_arguments[0]);

                            //ihale dünyasından çekilen raw halini başka listede tutuyoruz(http://localhost:9200/kuark/ihale_dunyasi/_search/ ile sorgulanabilir.)
                            /* if (_arguments[0].IhaleProviders) {
                             var ayar_raw = {"index": {"_index": schema.SABIT.ELASTIC.INDEKS.APP, "_type": schema.SABIT.ELASTIC.TIP.IHALE_DUNYASI, "_id": _arguments[0].Id}};
                             arrBulk_raw.push(ayar_raw);
                             arrBulk_raw.push(ihale_dunyasi_raw);
                             }*/
                        }
                    );

                    elastic.f_bulk({body: arrBulk});

                    if (arrBulk_raw.length > 0) {
                        elastic.f_bulk({body: arrBulk_raw});
                    }

                } else {
                    //ihale dünyasından çekilen raw halini başka listede tutuyoruz(http://localhost:9200/kuark/ihale_dunyasi/_search/ ile sorgulanabilir.)
                    if (_ihale.IhaleProviders) {
                        var ihale_dunyasi_raw = _ihale.IhaleProviders.IhaleDunyasi.raw;
                        delete _ihale.IhaleProviders.IhaleDunyasi.raw;
                        //elastic.f_index.ihale_with_kalem(_ihale.Id, ihale_dunyasi_raw);
                    }

                    elastic.f_index.ihale(_ihale);
                }

                if (_tahta_id && _tahta_id > 0) {
                    // TODO: Birden çok ihale girilmişse, anahtar sayısı daha az ise anahtarları ihalelerin üstünden geçirmeli
                    indeksleme.f_db_ihale_index(_ihale, _tahta_id);
                }

                //kuyruğa ekle

                olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.IHALE_EKLENDI, _ihale.Id);

                //loglara ekle
                //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.IHALE, _ihale, false, _kul_id);
            });
    };

    f_calis(_ihale, _kurum_id, _tahta_id);

    // Tahta_id varsa hemen calis yoksa "veri geliyor demektir" bekle ve bitmişse calis
    /* if (_tahta_id) {
     f_calis(_ihale, _kurum_id, _tahta_id);
     } else {
     lstEklenenIhaleler.push(arguments);
     wait(
     schema.SABIT.OLAY.IHALE_EKLENDI,
     function (oncekiSonId) {
     return lstEklenenIhaleler.length > 1000 || lstEklenenIhaleler.last()[0].Id == oncekiSonId;
     },
     f_calis,
     2000
     );
     }*/
});
emitter.on(schema.SABIT.OLAY.IHALE_GUNCELLENDI, function (_param) {
    l.i("--------------: ON IHALE_GUNCELLENDI :-------------");
    f_temp_sil_ihale(_param.tahta_id);

    //indexleme başla
    if (_param.eski_ihale.Id != _param.yeni_ihale.Id) {
        indeksleme.f_tahta_anahtar_indekslerinden_ihaleyi_kaldir(_param.eski_ihale.Id, _param.tahta_id);
    }
    indeksleme.f_db_ihale_index(_param.yeni_ihale, _param.tahta_id);

    //loglara ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.IHALE, _param.yeni_ihale, false, _param.kul_id);

    //elastik başla
    elastic.f_index.ihale(_param.yeni_ihale);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.IHALE_GUNCELLENDI, _param.yeni_ihale.Id);

});
emitter.on(schema.SABIT.OLAY.IHALE_SILINDI, function (_ihale, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_ihale(_tahta_id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.IHALE, _ihale, false, _kul_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.IHALE_SILINDI, _ihale.Id);

    //elastic ten sil
    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.IHALE,
        id: _ihale.Id
    }).then(function (error, response) {
        if (error) {
            console.log("ihale silinirken hata alındı " + error)
        }
    });

});
emitter.on(schema.SABIT.OLAY.IHALE_GIZLENDI, function (_ihale_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_ihale(_tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.IHALE_GIZLENDI, _ihale_id);

});
emitter.on(schema.SABIT.OLAY.IHALE_GIZLENDI_IPTAL, function (_ihale_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_ihale(_tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.IHALE_GIZLENDI_IPTAL, _ihale_id);

});
//endregion

//region KALEM

function f_temp_sil_kalem(_tahta_id) {
    if (_tahta_id) {
        return [
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKalem(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKalemTumu(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKalemIstenmeyen(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaAnahtarKalemleri(_tahta_id))
        ].allX();
    } else {
        return null;
    }
}


emitter.on(schema.SABIT.OLAY.KALEM_EKLENDI, function (_kalemler, _ihale_id, _tahta_id, _kul_id) {

    var f_calis = function (_kalem, _ihale_id, _tahta_id) {

        l.i("--------------: ON kalem eklendi :-------------");

        var bulk = arguments.length
            // parametre var, tek bir ihale için çalışacak
            ? false
            // parametre yok lstEklenenIhaleler için çalışacak
            : true;

        return (_tahta_id && _tahta_id > 0 // _tahta_id varsa temp alanlar silinecek
            ? f_temp_sil_kalem(_tahta_id)
            : f_temp_sil())
            .then(function () {

                if (bulk) {
                    var arrBulk = [];
                    lstEklenenKalemler.forEach(function (_arguments) {
                        var ayar = {"index": {"_index": schema.SABIT.ELASTIC.INDEKS.APP, "_type": schema.SABIT.ELASTIC.TIP.KALEM, "_id": _arguments[0].Id}};
                        arrBulk.push(ayar);
                        arrBulk.push(_arguments[0]);
                    });

                    elastic.f_bulk({body: arrBulk})
                } else {
                    elastic.f_index.kalem(_kalem);
                }

                //Olay kuyruğuna ekle
                db.olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_EKLENDI, _kalem.Id);

                //log ekle
                //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KALEM, _kalem, false, _kul_id);
                if (_tahta_id && _tahta_id > 0) {
                    indeksleme.f_db_kalem_index(_ihale_id, _kalem, _tahta_id);
                }
            });
    };

    Array.isArray(_kalemler)
        ? _kalemler.mapX(null, f_calis, _ihale_id, _tahta_id).allX()
        : f_calis(_kalemler, _ihale_id, _tahta_id);

});
emitter.on(schema.SABIT.OLAY.KALEM_GUNCELLENDI, function (_params) {

    f_temp_sil_kalem(_params.tahta_id);

    //elastik başla");
    elastic.f_index.kalem(_params.yeni_kalem);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_GUNCELLENDI, _params.yeni_kalem.Id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KALEM, _params.yeni_kalem, false, _params.kul_id);

    //indexleme başla");
    if (_params.orjinal_kalem_id != _params.yeni_kalem.Id) {
        indeksleme.f_tahta_anahtar_indekslerinden_kalemi_kaldir(_params.orjinal_kalem_id, _params.tahta_id);
    }
    indeksleme.f_db_kalem_index(_params.ihale_id, _params.yeni_kalem, _params.tahta_id);

});
emitter.on(schema.SABIT.OLAY.KALEM_SILINDI, function (_kalem, _tahta_id, _kul_id) {

    f_temp_sil_kalem(_tahta_id);

    //indexleme sil
    indeksleme.f_tahta_anahtar_indekslerinden_kalemi_kaldir(_kalem.Id, _tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_SILINDI, _kalem.Id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KALEM, _kalem, true, _kul_id);

    //elastic sil
    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.KALEM,
        id: _kalem.Id
    }).then(function (error, response) {
        if (error) {
            console.log("kalem silinirken hata alındı " + error)
        }
    });

});
emitter.on(schema.SABIT.OLAY.KALEM_DURUMU_GUNCELLENDI, function (_kalem, _ihale_id, _tahta_id, _kul_id) {

    //elastik başla");
    elastic.f_index.kalem(_kalem);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_DURUMU_GUNCELLENDI, _kalem.Id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.KALEM, _kalem, false, _kul_id);
});
emitter.on(schema.SABIT.OLAY.KALEM_GIZLENDI, function (_kalem_id, _ihale_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_kalem(_tahta_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_GIZLENDI, _kalem_id);

});
emitter.on(schema.SABIT.OLAY.KALEM_GIZLENDI_IPTAL, function (_kalem_id, _ihale_id, _tahta_id, _kul_id) {
    //temp keys sil
    f_temp_sil_kalem(_tahta_id);

    //Olay kuyruğuna ekle
    //olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KALEM_GIZLENDI_IPTAL, _kalem_id);

});
//endregion

//region ÜRÜN
function f_temp_sil_urun(_tahta_id) {
    if (_tahta_id) {
        return db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaUrun(_tahta_id));
    } else {
        return null;
    }
}

emitter.on(schema.SABIT.OLAY.URUN_EKLENDI, function (_urun, _tahta_id, _kul_id) {
    f_temp_sil_urun(_tahta_id);

    //elastic ekle
    elastic.f_index.urun(_urun);

    //loglara ekle");
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.URUN, _urun, false, _kul_id);

    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.URUN_EKLENDI, _urun.Id);

});
emitter.on(schema.SABIT.OLAY.URUN_GUNCELLENDI, function (_urun, _tahta_id, _kul_id) {
    //temp key sil
    f_temp_sil_urun(_tahta_id);

    //elastic ekle
    elastic.f_index.urun(_urun);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.URUN_GUNCELLENDI, _urun.Id);

    //loglara ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.URUN, _urun, false, _kul_id);

});
emitter.on(schema.SABIT.OLAY.URUN_SILINDI, function (_urun, _tahta_id, _kul_id) {
    //temp key sil
    f_temp_sil_urun(_tahta_id);

    //log sil
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.URUN, _urun, true, _kul_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.URUN_SILINDI, _urun.Id);

    //elastic sil
    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.URUN,
        id: _urun.Id
    }).then(function (error, response) {
        if (error) {
            console.log("ürün silinirken hata alındı " + error)
        }
    });
});

//region ANAHTAR
emitter.on(schema.SABIT.OLAY.URUN_ANAHTAR_EKLENDI, function (_tahta_id, _anahtarObjesi, _kul_id) {

    l.i("__function: " + arguments);
    l.i("__function: " + JSON.stringify(_anahtarObjesi));
    indeksleme.f_anahtara_gore_indexle_elastic(_anahtarObjesi.Anahtar, _tahta_id, _anahtarObjesi.Id);

});
//endregion


//endregion

//region TEKLIF

/**
 * Teklif ekleme-güncelleme-silme durumunda ürünle ilgili oluşturulan temp ler siliniyor
 * @param {object} _teklif
 * @param {int} _tahta_id
 */
function f_urunle_iliskili_teklif_templeri_sil(_teklif, _tahta_id) {

    if (_teklif.Urun_Idler && _teklif.Urun_Idler.length > 0) {
        _teklif.Urun_Idler.forEach(function (_urun_id) {

            return [
                db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun_id, _teklif.ParaBirim_Id)),
                db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _teklif.TeklifDurumu_Id))
            ].allX();

            /*db.redis.dbQ.Q.all([
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun.Id, schema.SABIT.PARA_BIRIM.EUR)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun.Id, schema.SABIT.PARA_BIRIM.TRY)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriParaBirimli(_tahta_id, _urun.Id, schema.SABIT.PARA_BIRIM.USD)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.ILK_KAYIT)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.IHALEDEN_ATILDI)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.IPTAL)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.KAZANDI)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.URUN_RED)),
             db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun.Id, schema.SABIT.ONAY_DURUM.teklif.URUN_BELGESI_EKSIK))
             ]);*/
        });
    }
}

/**
 * Teklif ekleme-güncelleme-silme durumunda kurumla ilgili oluşturulan temp ler siliniyor
 * @param {object} _teklif
 * @param {int} _tahta_id
 */
function f_kurumla_iliskili_teklif_templerini_sil(_teklif, _tahta_id) {
    return [
        db.redis.dbQ.del(db.redis.kp.temp.zsetKurumTeklifleriParaBirimli(_tahta_id, _teklif.Kurum_Id, _teklif.ParaBirim_Id)),
        db.redis.dbQ.del(db.redis.kp.temp.zsetKurumTeklifleriOnayDurumunaGore(_tahta_id, _teklif.Kurum_Id, _teklif.TeklifDurumu_Id)),
        db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKurumTeklifleri(_tahta_id, _teklif.Kurum_Id))
    ].allX();
}

function f_temp_sil_teklif(_tahta_id, _teklif) {
    if (_tahta_id) {
        return [
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaIhaleTeklifleri(_tahta_id, _teklif.Ihale_Id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKalemTeklifleri(_tahta_id, _teklif.Kalem_Id)),
            f_urunle_iliskili_teklif_templeri_sil(_teklif, _tahta_id),//ürünle ilişkili temp i sil
            f_kurumla_iliskili_teklif_templerini_sil(_teklif, _tahta_id)//kurumla ilişkili templeri sil
        ].allX();
    } else {
        return null;
    }
}

emitter.on(schema.SABIT.OLAY.TEKLIF_EKLENDI, function (_teklif, _tahta_id, _kul_id) {

    //delete temp keys
    f_temp_sil_teklif(_tahta_id, _teklif);

    elastic.f_index.teklif(_teklif);
    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.TEKLIF, _teklif, false, _kul_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.TEKLIF_EKLENDI, _teklif.Id);

});
emitter.on(schema.SABIT.OLAY.TEKLIF_GUNCELLENDI, function (_eski_teklif, _yeni_teklif, _tahta_id, _kul_id) {

    //delete temp keys
    f_temp_sil_teklif(_tahta_id, _yeni_teklif);

    elastic.f_index.teklif(_yeni_teklif);
    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.TEKLIF, _yeni_teklif, false, _kul_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.TEKLIF_GUNCELLENDI, _yeni_teklif.Id);

});
emitter.on(schema.SABIT.OLAY.TEKLIF_SILINDI, function (_teklif, _tahta_id, _kul_id) {

    //delete temp keys
    f_temp_sil_teklif(_tahta_id, _teklif);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.TEKLIF, _teklif, true, _kul_id);

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.TEKLIF_SILINDI, _teklif.Id);

    //elastic sil
    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.TEKLIF,
        id: _teklif.Id

    }).then(function (error, response) {
        if (error) {
            console.log("teklif silinirken hata alındı " + JSON.stringify(error))
        }
    });
});
emitter.on(schema.SABIT.OLAY.TEKLIF_DURUMU_GUNCELLENDI, function (_teklif, _tahta_id, _kurum_id, _kul_id) {

    elastic.f_index.teklif(_teklif);
    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.ANAHTAR, _teklif, false, _kul_id);

    //kurumla ilişkili templeri sil
    db.redis.dbQ.del(db.redis.kp.temp.zsetKurumTeklifleriOnayDurumunaGore(_tahta_id, _teklif.Kurum_Id, _teklif.TeklifDurumu_Id));

    //ürünle ilişkili templeri sil
    if (_teklif.Urun_Idler && _teklif.Urun_Idler.length > 0) {
        _teklif.Urun_Idler.forEach(function (_urun_id) {
            db.redis.dbQ.del(db.redis.kp.temp.zsetUrunTeklifleriOnayDurumunaGore(_tahta_id, _urun_id, _teklif.TeklifDurumu_Id));
        });
    }

    //Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.TEKLIF_DURUMU_GUNCELLENDI, _teklif.Id);
});
//endregion

//region TAHTA ANAHTAR

function f_temp_sil_anahtar(_tahta_id) {
    if (_tahta_id) {
        return [
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaIhale(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaAnahtarIhaleleri(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.zsetTahtaIhaleSiraliIhaleTarihineGore(_tahta_id)),
            db.redis.dbQ.del(db.redis.kp.temp.zsetTahtaAnahtaraGoreSiraliIhaleTarihineGore(_tahta_id))
        ].allX();
    } else {
        return null;
    }
}

emitter.on(schema.SABIT.OLAY.TAHTA_ANAHTAR_EKLENDI, function (_tahta_id, _anahtarObjesi, _kul_id) {

    l.i("__function: " + arguments);
    l.i("__function: " + JSON.stringify(_anahtarObjesi));

    f_temp_sil_anahtar(_tahta_id);

    indeksleme.f_anahtara_gore_indexle_elastic(_anahtarObjesi.Anahtar, _tahta_id, _anahtarObjesi.Id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.ANAHTAR, _anahtarObjesi, false, _kul_id);

    // Olay kuyruğuna ekle
    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.TAHTA_ANAHTAR_EKLENDI, _anahtarObjesi.Id);

});
emitter.on(schema.SABIT.OLAY.TAHTA_ANAHTAR_SILINDI, function (_tahta_id, _anahtarKelime, _kul_id) {
    f_temp_sil_anahtar(_tahta_id);

    //log ekle
    //log.f_db_log_ekle(schema.SABIT.TABLO_ADI.ANAHTAR, _anahtarKelime, true, _kul_id);

});
//endregion

//region KULLANICI
function f_provider_raw_sil(_kullanici) {
    //hata almamak için elastic e eklemeden önce providers içindeki raw bilgisi siliniyor
    if (_kullanici.Providers.GP) {
        delete _kullanici.Providers.GP.raw;
    } else if (_kullanici.Providers.TW) {
        delete _kullanici.Providers.TW.raw;
    } else if (_kullanici.Providers.FB) {
        delete _kullanici.Providers.FB.raw;
    }
}

function f_temp_sil_kullanici() {
    return db.redis.dbQ.del(db.redis.kp.temp.ssetKullanici);
}

emitter.on(schema.SABIT.OLAY.KULLANICI_EKLENDI, function (_kullanici) {
    l.info("-------schema.SABIT.OLAY.KULLANICI_EKLENDI-----------------" + JSON.stringify(_kullanici));
    //yeni kayıt eklendi temp i silmeliyiz
    f_temp_sil_kullanici();

    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KULLANICI_EKLENDI, _kullanici.Id);

    //kullanıcıyı elastic e ekle
    //hata almamak için elastic e eklemeden önce providers içindeki raw bilgisi siliniyor
    f_provider_raw_sil(_kullanici);
    elastic.f_index.kullanici(_kullanici);

});
emitter.on(schema.SABIT.OLAY.KULLANICI_GUNCELLENDI, function (_kullanici) {
    //kullanıcıyı elastic e ekle
    //hata almamak için elastic e eklemeden önce providers içindeki raw bilgisi siliniyor
    f_provider_raw_sil(_kullanici);

    elastic.f_index.kullanici(_kullanici);

    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KULLANICI_EKLENDI, _kullanici.Id);

});
emitter.on(schema.SABIT.OLAY.KULLANICI_SILINDI, function (_kullanici_id) {
    //kullanıcı silindi temp i silmeliyiz
    f_temp_sil_kullanici();

    olay.f_db_olay_kuyruguna_ekle(schema.SABIT.OLAY.KULLANICI_EKLENDI, _kullanici_id);

    //kullanıcıyı elastic ten sil
    elastic.f_delete({
        method: "DELETE",
        index: schema.SABIT.ELASTIC.INDEKS.APP,
        type: schema.SABIT.ELASTIC.TIP.KULLANICI,
        id: _kullanici_id
    }).then(function (error, response) {
        if (error) {
            console.log("KULLANICI silinirken hata alındı " + error)
        }
    });
});


emitter.on(schema.SABIT.OLAY.DIKKAT_EKLENDI, function (_kullanici_id) {
    //db.redis.dbQ.del(db.redis.kp.temp.zsetKullaniciDikkatTumu(_kullanici_id));
});
emitter.on(schema.SABIT.OLAY.DIKKAT_SILINDI, function (_kullanici_id) {
    // db.redis.dbQ.del(db.redis.kp.temp.zsetKullaniciDikkatTumu(_kullanici_id));
});

emitter.on(schema.SABIT.OLAY.ILETI_EKLENDI, function (_kullanici_id) {

});
emitter.on(schema.SABIT.OLAY.ILETI_SILINDI, function (_kullanici_id) {

});

emitter.on(schema.SABIT.OLAY.GOREV_EKLENDI, function (_kullanici_id) {
    //db.redis.dbQ.del(db.redis.kp.temp.zsetKullaniciGorevTumu(_kullanici_id));
});
emitter.on(schema.SABIT.OLAY.GOREV_SILINDI, function (_kullanici_id) {
    //db.redis.dbQ.del(db.redis.kp.temp.zsetKullaniciGorevTumu(_kullanici_id));
});

//endregion

//region TAHTA
function f_temp_sil_tahta(_tahta_id) {
    return db.redis.dbQ.del(db.redis.kp.temp.ssetTahtaKullanici(_tahta_id));
}

emitter.on(schema.SABIT.OLAY.TAHTA_EKLENDI, function (_tahta, _kul_id) {


});
emitter.on(schema.SABIT.OLAY.TAHTA_GUNCELLENDI, function (_tahta, _kul_id) {

});
emitter.on(schema.SABIT.OLAY.TAHTA_SILINDI, function (_tahta_id, _kul_id) {

});
emitter.on(schema.SABIT.OLAY.TAHTA_AYRIL, function (_tahta_id, _kul_id) {
    //tahta ile ilgili templeri sil
    f_temp_sil_tahta(_tahta_id);
});
//endregion

exports = {};