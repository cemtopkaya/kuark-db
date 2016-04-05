var elasticsearch = require('elasticsearch'),
    events = require('events'),
    Q = require('q');


var elasticClient = new elasticsearch.Client({
    host: 'localhost:9200'
    , log: [
        /*{
         type: 'file',
         level: 'error',
         // config option specific to stream type loggers
         path: 'node/log/elasticsearch_error.log'
         },
         {
         type: 'file',
         level: 'warning',
         // config option specific to stream type loggers
         path: 'node/log/elasticsearch_warning.log'
         },
         {
         type: 'file',
         level: 'info',
         // config option specific to stream type loggers
         path: 'node/log/elasticsearch_info.log'
         },
         {
         type: 'file',
         level: 'debug',
         // config option specific to stream type loggers
         path: 'node/log/elasticsearch_debug.log'
         },*/
        // dosyaya yazd�r
        /*{
         type: 'file',
         level: 'trace',
         // config options specific to file type loggers
         path: 'node/log/elasticsearch_trace.log'
         },*/
        // ekrana yazdır
        {
            type: 'stdio',
            level: 'es',
            color: true
        }
    ]
    , log: ['error', 'trace']
});

var elastic = {
    f_index: {
        ihale: function (_ihale) {

            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.IHALE,
                id: _ihale.Id,
                body: _ihale
            }, function (error, response) {
                console.log("Elasticsearch args: " + JSON.stringify(arguments.callee.arguments));
                if (error) {
                    l.e("hata oldu elastic ihale eklenemedi " + error);
                }
            });
        },
        ihale_with_kalem: function (_ihale_id, _row) {//ihale dünyasından çekilen hali(orjinal)

            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.IHALE_DUNYASI,
                id: _ihale_id,
                body: _row
            }, function (error, response) {
                console.log("Elasticsearch args: " + JSON.stringify(arguments.callee.arguments));
                if (error) {
                    l.e("hata oldu elastic ihale eklenemedi " + error);
                }
            });
        },
        kurum: function (_kurum) {
            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.KURUM,
                id: _kurum.Id,
                body: _kurum
            }, function (error, response) {
                if (error) {
                    l.e("hata oldu elastic kurum eklenemedi");
                }
            });
        },
        kalem: function (_kalem) {
            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.KALEM,
                id: _kalem.Id,
                body: _kalem
            }, function (error, response) {
                if (error) {
                    l.e("Elasticsearch > kalem eklerken > error >" + error);
                }
            });
        },
        urun: function (_urun) {
            var esparam = {
                type: SABIT.ELASTIC.TIP.URUN,
                index: SABIT.ELASTIC.INDEKS.APP,
                id: _urun.Id,
                body: _urun
            };
            l.i("Urun: " + JSON.stringify(esparam));
            return elasticClient.index(esparam, function (error, response) {
                if (error) {
                    l.e("Elasticsearch > �R�N eklerken > error >" + error);
                }
            });
        },
        teklif: function (_teklif) {

            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.TEKLIF,
                id: _teklif.Id,
                body: _teklif
            }, function (error, response) {
                console.log("Elasticsearch args: " + JSON.stringify(arguments.callee.arguments));
                if (error) {
                    l.e("hata oldu elastic TEKL�F eklenemedi " + error);
                }
            });
        },
        kullanici: function (_kul) {
            return elasticClient.index({
                index: SABIT.ELASTIC.INDEKS.APP,
                type: SABIT.ELASTIC.TIP.KULLANICI,
                id: _kul.Id,
                body: _kul
            }, function (error, response) {
                console.log("Elasticsearch args: " + JSON.stringify(arguments.callee.arguments));
                if (error) {
                    l.e("hata oldu elastic KULLANICI eklenemedi " + error);
                }
            });
        }
    },
    f_delete: function () {
        return Q.nfapply(elasticClient.delete.bind(elasticClient), arguments)
    },
    f_flush: function () {
        return Q.nfapply(elasticClient.indices.flush.bind(elasticClient), arguments)
    },
    f_clearCache: function () {
        return Q.nfapply(elasticClient.indices.clearCache.bind(elasticClient), arguments)
    },
    f_bulk: function () {
        return Q.nfapply(elasticClient.bulk.bind(elasticClient), arguments)
    },
    f_search: function () {
        return Q.nfapply(elasticClient.search.bind(elasticClient), arguments)
    },
    f_sort: function (_arama) {
        return _arama.Siralama.map(function (_elm) {
            var obj = {};
            obj[_elm.Alan] = {"order": _elm.Asc ? "asc" : "desc"};
            return obj;
        });
    },

    client: elasticClient,
    SABIT: {
        INDEKS: {
            APP: "kuark"
        },
        TIP: global.SABIT.TABLO_ADI
    }
};

module.exports = elastic;
