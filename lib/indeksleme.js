/** @type {Indeksleme} */
function indeksleme() {

    var db = require('../src/index')();

    /** @type {Indeksleme} */
    var result={};

    //region INDEX İŞLEMLERİ

    /**
     * Ihale bilgisi güncellendiğinde eski ihale bilgisi içinde konusu tahtanın anahtarına uygun anahtar kelime olup olmadığını bulmalıyız
     * Eğer varsa indexten kaldırmalıyız ve sonrasında f_db_ihale_index metoduna göndererek indexlemesini sağlamalıyız
     * @param {integer} _ihale_id
     * @param {integer} _tahta_id
     */
    var f_tahta_anahtar_indekslerinden_ihaleyi_kaldir = function (_ihale_id, _tahta_id) {

        return db.tahta.f_db_tahta_anahtar_tumu(_tahta_id)
            .then(
                /**
                 *
                 * @param {AnahtarKelime[]} _arrKelimeler
                 * @returns {*}
                 */
                function (_arrKelimeler) {

                    var arr_idler = _arrKelimeler.pluckX("Id");
                    return arr_idler.mapX(null, db.anahtar.f_db_anahtar_index_sil_ihale, _ihale_id).allX();
                });
    };

    /**
     * Kalem güncellediğinde inkdekslerden kaldırmalıyız
     * @param  {integer} _kalem_id
     * @param  {integer} _tahta_id
     * @returns {*}
     */
    var f_tahta_anahtar_indekslerinden_kalemi_kaldir = function (_kalem_id, _tahta_id) {
        return db.tahta.f_db_tahta_anahtar_tumu(_tahta_id)
            .then(
                /**
                 *
                 * @param {AnahtarKelime[]} _arrKelimeler
                 * @returns {*}
                 */
                function (_arrKelimeler) {

                    var arr_idler = _arrKelimeler.pluckX("Id");
                    return arr_idler.mapX(null, db.anahtar.f_db_anahtar_index_sil_kalem, _kalem_id).allX();
                });
    };

    /**
     * �ekilen ihale konusu i�erisinde
     * tahta i�in tan�mlanm�� anahtar kelime olup olmad��� kontrol edilir. E�er varsa ihale id leri tutulur
     * tahta_id yoksa t�m tahtalar �ekilip t�m�n�n anahtarlar�nda kontrol edilir.
     * @param {object} _ihale
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_ihaleyi_indexle = function (_ihale, _tahta_id) {
        return db.tahta.f_db_tahta_anahtar_tumu(_tahta_id)
            .then(
                /**
                 *
                 * @param {AnahtarKelime[]} _arrKelimeler
                 * @returns {Object}
                 */
                function (_arrKelimeler) {
                    if (_arrKelimeler && _arrKelimeler.length > 0) {

                        _.some(_arrKelimeler, function (_elm) {
                            return f_ihaleyi_anahtarla_indexle(_ihale, _elm.Anahtar);
                        });
                    } else {
                        return _ihale;
                    }
                })
            .then(function () {
                return _ihale;
            });
    };


    var f_anahtara_gore_indexle_elastic = function (_anahtar, _tahta_id, _anahtar_id) {

        l.i("Elasticsearch ile anahtar indeksle: " + _anahtar);
        var f_indexle_elastic = function (tipi) {
            var query = {
                "query": {
                    "filtered": {
                        "query": {
                            "query_string": {
                                "query": "*" + _anahtar + "*"
                            }
                        }
                    }
                }
            };

            l.i("Elasticsearch ile anahtar indekslenecek: " + _anahtar);
            return elastic.f_search({
                method: "POST",
                index: SABIT.ELASTIC.INDEKS.APP,
                type: tipi,
                body: query

            }).then(function (_resp) {
                l.i("Elastic Search sonucu: " + JSON.stringify(_resp));
                var bulunanlar = _resp[0].hits.hits.pluckX("_source.Id");

                return tipi == SABIT.ELASTIC.TIP.IHALE
                    ? db.anahtar.f_db_anahtar_index_ekle_ihale(_anahtar_id, bulunanlar)
                    : tipi == SABIT.ELASTIC.TIP.KALEM
                    ? db.anahtar.f_db_anahtar_index_ekle_kalem(_anahtar_id, bulunanlar)
                    : db.anahtar.f_db_anahtar_index_ekle_urun(_anahtar_id, bulunanlar);
            });
        };

        return [SABIT.ELASTIC.TIP.IHALE, SABIT.ELASTIC.TIP.KALEM].map(f_indexle_elastic);
    };

    var f_ihaleyi_anahtarla_indexle = function (_ihale, _anahtar_kelime, _anahtar_id) {

        if (JSON.stringify(_ihale).turkishToLower().indexOf(_anahtar_kelime.turkishToLower()) > -1) {

            console.log("ihale konusu:" + _ihale.Konusu);

            return db.redis.dbQ.Q.all([
                _anahtar_id
                    ? _anahtar_id
                    : db.anahtar.f_db_anahtar_key(_anahtar_kelime)
            ]).then(function (_anahtar_id) {
                // anahtalar diyaliz > 1, fx80 > 25, av-set > 145
                // a:1:ihale 101, 102
                // tahta:401:anahtar 1,25,145
                // sdiff (sunion a:1 a:25 a:145 ihale:sirala:tarihe) ihale:silinen
                return db.anahtar.f_db_anahtar_index_ekle_ihale(_anahtar_id, _ihale.Id);
            });
        }
    };

    var f_anahtara_gore_indexle = function (_tahta_id, _anahtar, _anahtar_id) {

        return db.redis.dbQ.Q.all([
            db.ihale.f_db_tahta_ihale_idler_aktif(_tahta_id),
            db.anahtar.f_db_anahtar_index_ihale(_anahtar_id)

        ]).then(function (_results) {
            console.log("ne geldi ki");
            console.log(JSON.stringify(_results));

            var indexlenmemis_ihaleler = _.difference(_results[0], _results[1]);
            console.log("indexlenmemişler");
            console.log(JSON.stringify(indexlenmemis_ihaleler));

            /** @type {OptionsIhale} */
            var opts = {};
            opts.bArrKalemleri = false;
            opts.bTakip = true;
            opts.bYapanKurum = true;

            var arr = indexlenmemis_ihaleler.map(function (_ihale_id) {
                return db.ihale.f_db_ihale_id(_ihale_id, _tahta_id,opts)
                    .then(function (_ihale) {
                        return f_ihaleyi_anahtarla_indexle(_ihale, _anahtar, _anahtar_id);
                    });
            });

            return db.redis.dbQ.Q.all(arr);
        });
    };

    /**
     * �ekilen ihale konusu i�erisinde
     * tahta i�in tan�mlanm�� anahtar kelime olup olmad��� kontrol edilir. E�er varsa ihale id leri tutulur
     * @param {object} _ihale
     * @param {integer} _tahta_id
     * @returns {*}
     */
    var f_db_ihale_index = function (_ihale, _tahta_id) {

        if (_tahta_id && _tahta_id > 0) {

            f_ihaleyi_indexle(_ihale, _tahta_id);

        } else {
            //t�m tahtalar� �ek
            return db.tahta.f_db_tahta_tumu()
                .then(function (_arrTahtalar) {

                    //her biri i�inde d�n�p �r�n�n/kurumun/tahtan�n/kullan�c�n�n anahtarlar�na ba�l� sat�rlar� varsa ihale_id yi yaz ve indexle
                    var arrPromises = _.map(_arrTahtalar, function (_dbTahta) {
                        console.log("tahtalar i�inde d�n�yoruz");

                        return f_ihaleyi_indexle(_ihale, _dbTahta.Id)
                            .then(function () {
                                return _ihale;
                            });
                    });

                    return db.redis.dbQ.Q.all(arrPromises);
                })
                .then(function () {
                    return _ihale;
                });
        }
    };

    /**
     * çekilen ihale kalemi i�erisinde
     * tahta için tanımlanmış anahtar kelime olup olmadığını kontrol edilir. E�er varsa kalem id si tutulur
     * @param {integer} _ihale_id
     * @param  {object} _kalem
     * @param  {integer} _tahta_id
     * @returns {*}
     */
    var f_db_kalem_index = function (_ihale_id, _kalem, _tahta_id) {
        console.log("f_db_kalem_index");

        function f_indexle(_tahta_id, _ihale_id, _kalem) {
            console.log(_kalem);

            return db.tahta.f_db_tahta_anahtar_tumu(_tahta_id)
                .then(
                    /**
                     *
                     * @param {AnahtarKelime[]} _arrKelimeler
                     * @returns {*}
                     */
                    function (_arrKelimeler) {
                        if (_arrKelimeler && _arrKelimeler.length > 0) {

                            _.some(_arrKelimeler, function (_elm) {
                                var anahtar = _elm.Anahtar.turkishToLower();
                                if ((_kalem.Aciklama && _kalem.Aciklama.turkishToLower().indexOf(anahtar) > -1) ||
                                    (_kalem.BransKodu && _kalem.BransKodu.turkishToLower().indexOf(anahtar) > -1)) {

                                    console.log("bulunan");
                                    console.log("açıklama:" + _kalem.Aciklama);
                                    console.log("branş:" + _kalem.BransKodu);

                                    return db.redis.dbQ.Q.all([
                                        db.anahtar.f_db_anahtar_index_ekle_kalem(_elm.Id, _kalem.Id),
                                        db.anahtar.f_db_anahtar_index_ekle_ihale(_elm.Id, _ihale_id)
                                    ]);
                                }
                            });

                        } else {
                            return _kalem;
                        }
                    })
                .then(function () {
                    return _kalem;
                });
        }

        if (_tahta_id && _tahta_id > 0) {
            //tahtaya g�re index olu�tur
            f_indexle(_tahta_id, _ihale_id, _kalem);

        } else {

            //t�m tahtalar� �ek
            return db.tahta.f_db_tahta_tumu()
                .then(function (_arrTahtalar) {
                    console.log("tahtalar");

                    //her biri i�inde d�n�p �r�n�n/kurumun/tahtan�n/kullan�c�n�n anahtarlar�na ba�l� sat�rlar� varsa ihale_id yi yaz ve indexle
                    var arrPromises = _.map(_arrTahtalar, function (_dbTahta) {
                        console.log("tahtalar i�inde d�n�yoruz");

                        console.log(_kalem);
                        return f_indexle(_dbTahta.Id, _ihale_id, _kalem)
                            .then(function () {
                                return _kalem;
                            });
                    });

                    return db.redis.db.dbQ.Q.all(arrPromises);
                })
                .then(function (_arr) {
                    console.log(_arr);
                    return _arr;
                });
        }
    };

    //endregion

    //noinspection JSValidateTypes
    /** @class Indeksleme */
    result = {
        f_anahtara_gore_indexle_elastic: f_anahtara_gore_indexle_elastic,
        f_tahta_anahtar_indekslerinden_kalemi_kaldir: f_tahta_anahtar_indekslerinden_kalemi_kaldir,
        f_anahtara_gore_indexle: f_anahtara_gore_indexle,
        f_tahta_anahtar_indekslerinden_ihaleyi_kaldir: f_tahta_anahtar_indekslerinden_ihaleyi_kaldir,
        f_db_ihale_index: f_db_ihale_index,//ihale index
        f_db_kalem_index: f_db_kalem_index //kalem index
    };

    return result;
}

/** @type {Indeksleme} */
var obj = indeksleme();

module.exports = obj;