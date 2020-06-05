exports.startServer = function (server, cb) {

    //const cookieParser = require('cookie-parser');
    //const bodyParser = require('body-parser');
    //const methodOverride = require('method-override');
    const compression = require('compression');
    const morgan = require('morgan');
    const config = require('./../configs/server.config');
    const routes = require('./mapping/route.mapping');
    const token = require('./common/token')

    /*
    const Database = require('./common/database');
    const GameDB = new Database(config.gamedb.url, config.gamedb.dbname, config.gamedb.opts);
    exports.GameDB = GameDB;*/

    const mongoHelper = require('./common/mongoHelper');
    const GameDBHelper = new mongoHelper(config.gamedb);
    exports.GameDBHelper = GameDBHelper;

    // REDIS CACHE
    const redisHelper = require('./common/redisHelper');
    const LoginRedisHelper = new redisHelper(config.loginRedis);
    exports.LoginRedisHelper = LoginRedisHelper;

    let conn = require('./common/KafkaProducer')
    const logUtil = require('./common/logUtils')(conn)

    const zlib = require('zlib');
    // app = express();
    /*
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        res.header('Content-Type', 'application/json;charset=utf-8');
        next();
    });
    */

    let app = server.app;
    app.set('host', config.host);
    app.set('port', config.port);

    app.set('version', config.version);

    app.use(function (req, res, next) {
        let data = "";
        req.on('data', function (chunk) {
            data += chunk;
        });

        req.on('end', function () {
            if (config.encrypt) {
                var compressed = Buffer.from(data, 'base64');
                //console.debug(data, compressed);
                zlib.inflate(compressed, (err, buffer) => {
                    if (err) {
                        console.error(err);
                    } else {
                        try {
                            req.body = JSON.parse(buffer.toString());
                            if (config.debug) console.debug("\nrequest:", buffer.toString());
                            next();
                        } catch (e) {
                            console.error('Encrypt illegal json format: '+e);
                        }
                    }
                });
            } else {
                if (config.debug) console.debug("request:", data);
                try {
                    req.body = JSON.parse(data);
                    next();
                } catch (e) {
                    console.error('Illegal json format: ', e);
                }
            }
        });
    });

    //app.use(bodyParser.json());
    //app.use(bodyParser.urlencoded({ extended: false }));
    //app.use(methodOverride());
    //app.use(cookieParser());
    let tokenUtil = new token(LoginRedisHelper)

    app.use(compression());
    app.use(require('../app/common/midderware')(logUtil,tokenUtil))

    /*
    app.use(function (req, res, next) {
        console.debug("\nrequest:", JSON.stringify(req.body));
        next();
    });
    */

    // slog
    if (config.debug)
        app.use(morgan('short'));

    server.loadResponseTime();
    // router
    routes.mapping(app);

    // MONGODB CREATE INDEXS
    function createGameDBIndexes()
    {
        GameDBHelper.connectDB(db => {
            const gameIndexTables = config.gameIndexTables;
            for (let i = 0; i < gameIndexTables.length; i++) {
                if (config.debug) console.log("create table index:", gameIndexTables[i]);
                GameDBHelper.createIndex(db, gameIndexTables[i].tblname, gameIndexTables[i].index, () => {
                    if ((i+1) === gameIndexTables.length) {
                        db.close();
                    }
                });
            }
        });
    }

    //createGameDBIndexes();

    exports.app = app;
    cb(null);
};
