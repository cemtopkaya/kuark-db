'use strict';

var sql = require('mssql'),
    schema = require('kuark-schema'),
    extensions = require('kuark-extensions');

/**
 *
 * @returns {DBDoviz}
 * @constructor
 */
function DB_Doviz() {

    /** @type {DBDoviz} */
    var result = {};

    function f_db_doviz_kurlari_cek(_adet, _iKurDeger_id) {

        var defer = result.dbQ.Q.defer(),
            config = {
                user: 'sa',
                password: 'q1w2.e3r4',
                server: '10.130.214.201', // You can use 'localhost\\instance' to connect to named instance
                database: 'medula_v3'
            },
            adet = _adet ? _adet : 100,
            connection = sql.connect(config, function (err) {
                if (err) {
                    extensions.ssr = [{"Hatalı SQL bağlantısı": JSON.stringify(err, null, ' ')}];
                    defer.reject(err);

                } else {

                    // Query
                    var request = connection.request();
                    /*  var sorgu = _adet == 0
                     ? "SELECT * FROM KurDegerleri WHERE refParaBirim_id IN (1,3) ORDER BY kurdeger_id DESC"
                     //: "SELECT TOP(" + _adet + ")* FROM KurDegerleri WHERE refParaBirim_id IN (1,3) ORDER BY kurdeger_id DESC";
                     : "SELECT TOP(" + _adet + ")* FROM KurDegerleri WHERE [refParaBirim_id]=1 and refKurTipi_id=4 ORDER BY kurdeger_id DESC";*/


                    var sorgu = adet == 0
                        ? "SELECT * "
                        : "SELECT TOP(" + adet + ")* ";
                    sorgu += " FROM KurDegerleri WHERE refParaBirim_id IN (1,3) ";
                    sorgu += _iKurDeger_id && _iKurDeger_id > 0 ? " AND kurdeger_id > " + _iKurDeger_id : " ";
                    sorgu += " AND YEAR(kurTarihi)>=2015 ";//2015 ve sonrasını çekmek yeterli olacaktır
                    sorgu += " ORDER BY kurdeger_id DESC";

                    request.query(sorgu,
                        function (err, recordset) {
                            if (err) {
                                defer.reject("Kurlar çekilemedi! " + JSON.stringify(err));
                            } else {
                                defer.resolve(recordset);
                            }
                        });
                }
            });

        return defer.promise;
    }

    /**
     * Önce sistemde kayıt olup olmadığı kontrol edilir,
     * varsa son id den büyük kayıtları çekip ekler
     * yoksa tümünü çekip ekler
     * @param {int} _adet
     * @returns {*}
     */
    function f_db_doviz_kurlari_cek_ekle(_adet) {

        return f_db_son_kur_deger_id()
            .then(function (_iLast) {
                var id = _iLast && _iLast > 0 ? _iLast : 0;
                return f_db_doviz_kurlari_cek(_adet, id)
                    .then(f_db_doviz_kurlari_ekle);
            });
    }


    function f_db_doviz_kurlari_ekle(_dovizKurlari) {
        var mapDoviz = new Map();

        if (Array.isArray(_dovizKurlari) && !_dovizKurlari.length) {
            return [];
        }
        var iMaxKur_id = _dovizKurlari[0].kurDeger_id;
        _dovizKurlari.forEach(function (_elm) {

            var kur = schema.f_create_default_object(schema.SCHEMA.DOVIZ_KURU);
            kur.Id = _elm.kurDeger_id;
            kur.ParaBirim_Id = _elm.refParaBirim_id;
            kur.KurTipi_Id = _elm.refKurTipi_id;
            kur.KurTarihi = new Date(_elm.kurTarihi).getTime();
            kur.KurDegeri = _elm.kurDegeri;

            var keyKurlar = result.kp.doviz.zsetKurlari(kur.ParaBirim_Id, kur.KurTipi_Id);
            if (!mapDoviz.get(keyKurlar)) {
                mapDoviz.set(keyKurlar, [])
            }
            mapDoviz.get(keyKurlar).push(new Date(kur.KurTarihi).getTime());
            mapDoviz.get(keyKurlar).push(JSON.stringify(kur));
        });


        var arrPromise = [];
        mapDoviz.forEach(function (_arrKurlar, _keyKurlar) {
            _arrKurlar.unshift(_keyKurlar);
            arrPromise.push(result.dbQ.zadd_array(_arrKurlar));
        });

        return result.dbQ.Q.all(arrPromise)
            .then(function () {
                return result.dbQ.set(result.kp.doviz.idx, iMaxKur_id)
                    .then(function () {
                        return _dovizKurlari;
                    });
            });
    }

    /**
     * Vt de kayıtlı son kurdeger_id değerini verir.
     * @returns {*}
     */
    function f_db_son_kur_deger_id() {
        return result.dbQ.get(result.kp.doviz.idx);
    }

    function f_db_doviz_tarih_araligindaki_kurlari_getir(_paraBirim_id, _kurTipi_id, _tarih1, _tarih2) {
        return result.dbQ.zrangebyscore(result.kp.doviz.zsetKurlari(_paraBirim_id, _kurTipi_id), _tarih1, _tarih2)
            .then(function (_arrKurlar) {
                return _arrKurlar.map(function (_elm) {
                    return JSON.parse(_elm);
                });
            });
    }

    /**
     * @class DBDoviz
     */
    result = {
        f_db_son_kur_deger_id: f_db_son_kur_deger_id,
        f_db_doviz_kurlari_cek_ekle: f_db_doviz_kurlari_cek_ekle,
        f_db_doviz_kurlari_cek: f_db_doviz_kurlari_cek,
        f_db_doviz_kurlari_ekle: f_db_doviz_kurlari_ekle,
        f_db_doviz_tarih_araligindaki_kurlari_getir: f_db_doviz_tarih_araligindaki_kurlari_getir
    };

    return result;
}

/**
 *
 * @type {DBDoviz}
 */
var obj = DB_Doviz();

obj.__proto__ = require('./db_log');
module.exports = obj;