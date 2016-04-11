'use strict';

var
    extensions = require('kuark-extensions'),
    l = extensions.winstonConfig,
    schema = require("kuark-schema"),
    emitter = new (require('events').EventEmitter)();

/**
 *
 * @returns {DBDikkat}
 * @constructor
 */
function DB_Dikkat() {
    /** @type {DBDikkat} */
    var result = {};

    function f_dikkat_toplam(_kul_id, _yeni, _silinen, _okunan) {
        if (_yeni == true && _silinen == true && _okunan == true) {
            var anahtar = result.kp.temp.zsetKullaniciDikkatTumu(_kul_id);
            result.dbQ.exists(anahtar)
                .then(function (_iExists) {
                    if (_iExists == true) {
                        return 1;

                    } else {
                        //yok yarat
                        return result.dbQ.zunionstore(anahtar, 2, result.kp.kullanici.zsetDikkat(_kul_id, true, false, false), result.kp.kullanici.zsetDikkat(_kul_id, false, true, false))
                            .then(function () {
                                return result.dbQ.zunionstore(anahtar, 2, anahtar, result.kp.kullanici.zsetDikkat(_kul_id, false, false, true))
                            });
                    }
                })
                .then(function () {
                    return result.dbQ.zcard(anahtar);
                });
        } else {
            return result.dbQ.zcard(result.kp.kullanici.zsetDikkat(_kul_id, _yeni, _silinen, _okunan));
        }
    }

    function f_dikkat_tumu(_kul_id, _yeni, _silinen, _okunan, _iSayfa, _iAdet) {
        l.info("f_db_dikkat_tumu")
        extensions.ssg = [{"f_db_dikkat_tumu": arguments}];

        if (_yeni == true && _silinen == true && _okunan == true) {

            //tüm okunan,silinen,yeni bilgileri görmek istiyor
            //hepsini birleştirip göndermeliyiz

            //temp var mı yok mu diye kontrol et varsa devam et yoksa oluştur ve sonuçlarını göster
            var anahtar = result.kp.temp.zsetKullaniciDikkatTumu(_kul_id);
            result.dbQ.exists(anahtar)
                .then(function (_iExists) {
                    if (_iExists == 1) {
                        return 1;

                    } else {
                        //yok yarat
                        return result.dbQ.zunionstore(anahtar, 2, result.kp.kullanici.zsetDikkat(_kul_id, true, false, false), result.kp.kullanici.zsetDikkat(_kul_id, false, true, false))
                            .then(function () {
                                return result.dbQ.zunionstore(anahtar, 2, anahtar, result.kp.kullanici.zsetDikkat(_kul_id, false, false, true))
                            });
                    }
                })
                .then(function () {
                    return result.dbQ.zrevrangebyscore(anahtar, '+inf', '-inf', "LIMIT", _iSayfa, _iAdet)
                        .then(function (_idler) {
                            if (_idler && _idler.length > 0) {
                                return result.dbQ.hmget_json_parse(result.kp.uyari.hsetUyariSonuclari, _idler);
                            } else {
                                return [];
                            }
                        });
                });

        } else {
            return result.dbQ.zrevrangebyscore(result.kp.kullanici.zsetDikkat(_kul_id, _yeni, _silinen, _okunan), '+inf', '-inf', "LIMIT", _iSayfa, _iAdet)
                .then(function (_idler) {
                    console.log("_idler>" + _idler);
                    if (Array.isArray(_idler) && _idler.length > 0) {
                        return result.dbQ.hmget_json_parse(result.kp.uyari.hsetUyariSonuclari, _idler);
                    } else {
                        return [];
                    }
                });
        }
    }

    function f_dikkat_ekle(kul_id, id) {
        l.info("f_db_dikkat_ekle");

        return result.dbQ.zadd(result.kp.kullanici.zsetDikkat(kul_id, true, false, false), new Date().getTime(), id)
            .then(function () {
                emitter.emit(schema.SABIT.OLAY.DIKKAT_EKLENDI, kul_id);
                return id;
            });
    }

    function f_dikkat_guncelle(kul_id, id, yeni, silinen, okunan) {
        return result.dbQ.Q.all([
            result.dbQ.zrem(result.kp.kullanici.zsetDikkat(kul_id, true, false, false), id),
            result.dbQ.zadd(result.kp.kullanici.zsetDikkat(kul_id, yeni, silinen, okunan), new Date().getTime(), id)
        ]);
    }

    function f_dikkat_sil(kul_id, id) {
        //okunan ve eklenenden silip
        //silinene ekliyoruz

        return result.dbQ.Q.all([
                result.dbQ.zrem(result.kp.kullanici.zsetDikkat(kul_id, true, false, false), id),
                result.dbQ.zrem(result.kp.kullanici.zsetDikkat(kul_id, false, false, true), id),
                result.dbQ.zadd(result.kp.kullanici.zsetDikkat(kul_id, false, true, false), new Date().getTime(), id)])
            .then(function () {
                emitter.emit(schema.SABIT.OLAY.DIKKAT_SILINDI, kul_id);
                return id;
            });
    }

    /**
     * @class DBDikkat
     */
    result = {
        f_db_dikkat_toplam: f_dikkat_toplam,
        f_db_dikkat_tumu: f_dikkat_tumu,
        f_db_dikkat_ekle: f_dikkat_ekle,
        f_db_dikkat_guncelle: f_dikkat_guncelle,
        f_db_dikkat_sil: f_dikkat_sil
    };
    return result;
}


/**
 *
 * @type {DBDikkat}
 */
var obj = DB_Dikkat();
obj.__proto__ = require('./db_log');

module.exports = obj;