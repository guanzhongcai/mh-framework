const redisConfig = require('../configs/server').gameRedis;
let redisAccess = require('./redisAccess');


exports.InitDB = function (cb) {

    redisAccess.on('modify', function (command, args) {
        console.debug(`redis_modify_event: command=${command}, args=%j`, args);
        //todo mongo update
    });

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
        require('../index.app').GameRedisHelper.redisClient = redisAccess;

        let app = require('../app');
        app.watchDatabase('redis', redisAccess);
        cb(null);
    });
};

exports.CloseDB = function (cb) {

    redisAccess.shutdown(cb);
};

