'use strict';

var l = require('kuark-extensions').winstonConfig,
    schema=require('kuark-schema');

/**
 *
 * @returns {DBGorev}
 * @constructor
 */
function DB_Gorev() {
    /**
     *
     * @type {DBGorev}
     */
    var result = {},
        emitter = new (require('events').EventEmitter)(),
        schema = require("kuark-schema");

    function f_gorev_toplam(kul_id, _tumu, _biten) {
        return result.dbQ.zcard(result.kp.kullanici.zsetGorev(kul_id, _tumu, _biten));
    }

    function f_gorev_tumu(kul_id, _tumu, _biten, _iSayfa, _iAdet) {
        return result.dbQ.zrevrangebyscore(result.kp.kullanici.zsetGorev(kul_id, _tumu, _biten), '+inf', '-inf', "LIMIT", _iSayfa, _iAdet)
            .then(function (_idler) {
                if (_idler && _idler.length > 0) {
                    return result.dbQ.hmget_json_parse(result.kp.uyari.hsetUyariSonuclari, _idler);
                } else {
                    return [];
                }
            });
    }

    function f_gorev_son_detay_bilgisi_ile(kul_id, _tumu, _biten, _iSayfa, _iAdet) {
        return f_gorev_tumu(kul_id, _tumu, _biten, _iSayfa, _iAdet)
            .then(function (_dbGorevler) {
                if (_dbGorevler && _dbGorevler.length > 0) {
                    var arr = _dbGorevler.map(function (_elm) {
                        return f_gorev_detay_tumu(_elm.Id, 0, 1)
                            .then(function (_detay) {
                                if (_detay && _detay.length > 0) {
                                    _elm.Detay = _detay[0];
                                } else {
                                    _elm.Detay = {Aciklama: "Görev henüz başlatılmadı! Detay bilgisi bulunamadı.", Yuzde: 0, Id: 0}
                                }
                                return _elm;
                            });
                    });
                    return result.dbQ.Q.all(arr);
                } else {
                    return [];
                }
            });
    }

    function f_gorev_detay_tumu(_gorev_id, _iSayfa, _iAdet) {
        return result.dbQ.zrevrangebyscore(result.kp.uyari.zsetGorevDetay(_gorev_id), '+inf', '-inf', "LIMIT", _iSayfa, _iAdet)
            .then(function (_detaylar) {
                if (_detaylar && _detaylar.length > 0) {
                    var arr = _detaylar.map(function (_elm) {
                        return JSON.parse(_elm);
                    });
                    return result.dbQ.Q.all(arr);
                } else {
                    return [];
                }
            });
    }

    /**
     * Görevle ilgili detayların eklenmesi sağlanır
     * @param {integer} _gorev_id
     * @param {{ Yuzde:integer, Aciklama:string, Tarih:string,Saat:string, Kullanici_Id: integer,Kullanici:object }} _detay
     */
    function f_gorev_detay_ekle(_gorev_id, _detay) {
        return result.dbQ.zadd(result.kp.uyari.zsetGorevDetay(_gorev_id), new Date().getTime(), JSON.stringify(_detay));
    }


    function f_gorev_ekle(kul_id, id) {
        l.info("f_db_gorev_ekle");

        return result.dbQ.zadd(result.kp.kullanici.zsetGorev(kul_id, true, false), new Date().getTime(), id)
            .then(function () {
                emitter.emit(schema.SABIT.OLAY.GOREV_EKLENDI, kul_id);
                return id;
            });
    }

    function f_gorev_id(_id) {
        l.info("f_db_gorev_id");
        return result.dbQ.hget_json_parse(result.kp.uyari.hsetUyariSonuclari, _id);
    }

    /**
     * Görevi bitti olarak güncelliyoruz
     * @param kul_id
     * @param id
     * @returns {*}
     */
    function f_gorev_guncelle(kul_id, id) {
        return result.dbQ.zadd(result.kp.kullanici.zsetGorev(kul_id, false, true), new Date().getTime(), id);
    }

    /**
     * @class DBGorev
     */
    result = {
        f_db_gorev_id: f_gorev_id,
        f_db_gorev_toplam: f_gorev_toplam,
        f_db_gorev_son_detay_bilgisi_ile: f_gorev_son_detay_bilgisi_ile,
        f_db_gorev_detay_tumu: f_gorev_detay_tumu,
        f_db_gorev_detay_ekle: f_gorev_detay_ekle,
        f_db_gorev_tumu: f_gorev_tumu,
        f_db_gorev_ekle: f_gorev_ekle,
        f_db_gorev_guncelle: f_gorev_guncelle
    };
    return result;
}


/**
 *
 * @type {DBGorev}
 */
var obj = DB_Gorev();
obj.__proto__ = require('./db_log');

module.exports = obj;