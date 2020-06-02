const redisConfig = require('../configs/gateway.cfg').redis;
let redisAccess = require('./redisAccess');


exports.InitDB = function (cb) {

    redisAccess.Init({
        host: redisConfig.url,
        port: redisConfig.port,
        auth_pass: redisConfig.password,
        db: redisConfig.db,
        poolsize: redisConfig.poolsize || 100,
    }, function (err) {
        if (err) {
            throw err;
        }
        require('../index.app').CacheHelper.redisClient = redisAccess;

        let app = require('../app');
        app.watchDatabase('redis', redisAccess);
        cb(null);
    });
};

exports.CloseDB = function (cb) {

    redisAccess.shutdown(cb);
};

