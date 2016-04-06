var chai = require('chai'),
    chaiHttp = require('chai-http'),
    should = chai.should(),
    defaults = require('json-schema-defaults'),
    es = require('elasticsearch'),
    extensions = require('kuark-extensions');

chai.use(chaiHttp);

describe("Elastcisearch işlemleri", function (done) {
    var client;
    before(function (done) {

        client = new es.Client({
            host: 'localhost:9200',
            log: 'trace'
        });

        chai.request('http://localhost:9200')
            .get('/')
            .end(function (err, res) {
                if (err) done(new Error("ElasticSearch ÇALIŞMIYOR!"));
                done();
            });
    });

    it('Index yaratma, çekme, güncelleme ve silme', function (done) {
        // aynı indexi test etmeyelim diye random olacak
        var indexName = 'yeni_index_' + Math.round(Math.random(100) * 100);
        client.indices.create({index: indexName}, function (err, body, code) {

            if (err) return done(err);

            client.indices.putMapping({
                index: indexName,
                type: 'indexType',
                body: {
                    'indexType': {
                        properties: {
                            message: {type: 'string', store: true}
                        }
                    }
                }
            }, function (err, body, code) {

                if (err) return done(err);

                client.indices.getMapping({index: indexName}, function (err, body, code) {

                    if (err) return done(err);

                    client.indices.delete({index: indexName}, function (err, body, code) {

                        if (err) return done(err);

                        done()
                    });
                });
            });
        });
    });

});