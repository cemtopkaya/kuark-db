var winston = require('winston'),
    winstonRedis = require('winston-redis').Redis,
    Elasticsearch = require('winston-elasticsearch');

// console'da sadece hepsi tutuluyor olacak çünkü info log seviyesinden sonra diğer tüm log seviyeleri sıralanmış
var transportConsole = new winston.transports.Console({ json: false, timestamp: true, prettyPrint: true, colorize: true, level: 'info' }),
// File'da sadece i ve db tutuluyor olacak çünkü i den sonra db log seviyesi sıralanmış
    transportFileDebug = new winston.transports.File({ filename: __dirname + '/debug.log', json: false, level: 'info'  }),

// EXCEPTIPONs
    transportFileException = new winston.transports.File({ filename: __dirname + '/exceptions.log', json: false }),
// rediste sadece db tutuluyor olacak çünkü db den sonra bir log seviyesi yok
    transportRedis = new (winstonRedis)({host: '127.0.0.1', port: 6379, level: 'info'}),
    transportElasticsearch = new Elasticsearch({ level: 'es' });

var logger = new (winston.Logger)({
    levels: {
        es: -1,
        info: 0,
        warn: 1,
        e: 2,
        verbose: 3,
        debug: 4,
        i: 5,
        db: 6
    },
    transports: [
        //,transportFileDebug
        //,transportRedis
        //,
        transportElasticsearch
        ,transportConsole
    ],
    exceptionHandlers: [
        transportConsole,
        transportFileException
    ],
    exitOnError: false
});

winston.addColors({
    info: 'green',
    warn: 'cyan',
    e: 'red',
    verbose: 'blue',
    debug: 'yellow',
    i: 'gray',
    db: 'magenta',
    es: 'magenta'
});

/*logger.i('iiiii foobar level-ed message');
logger.db('dbbbbb foobar level-ed message');
logger.info('infoo foobar level-ed message');
logger.warn('warnnnn foobar level-ed message');
logger.error('errroor foobar level-ed message');*/

module.exports = logger;