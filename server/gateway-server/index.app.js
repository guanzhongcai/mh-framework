exports.startServer = function (app, cb) {

    const compression = require('compression');
    const morgan = require('morgan');
    const zlib = require('zlib');
    const config = require('./configs/gateway.cfg.json');
    const redisHelper = require('./app/com/redisHelper');

    const cacheHelper = new redisHelper(config.redis);
    exports.CacheHelper = cacheHelper;

    app.use(compression());
    if (config.debug) app.use(morgan('short'));

    app.use(function (req, res, next) {
        if (req.method == 'POST') {
            req.setEncoding('utf8');
            let data = "";
            req.on('data', function (chunk) {
                data += chunk;
            });

            req.on('end', function () {
                if (config.encrypt) {
                    var compressed = Buffer.from(data, 'base64');
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
                    if (config.debug) console.debug("\nrequest:", data);
                    try {
                        req.body = JSON.parse(data);
                        next();
                    } catch (e) {
                        console.error('Illegal json format: '+e);
                    }
                }
            });
        } else {
            next();
        }
    });

    const routeMapping = require('./app/routes');
    routeMapping(app);

    console.log(" * MH Gateway running: http://%s:%s/", config.host, config.port);
    cb(null);
};
