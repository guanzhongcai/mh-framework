const redisConfig = require('../configs/server').gameRedis;
let gameRedis = require('./gameRedis');
let gameMongo = require('./gameMongo');


exports.InitDB = function (cb) {

    gameRedis.Init({
        host: redisConfig.url,
        port: redisConfig.port,
        auth_pass: redisConfig.password,
        db: redisConfig.db,
        poolsize: redisConfig.poolsize || 100,
    }, function (err) {
        if (err) {
            throw err;
        }
        require('../index.app').GameRedisHelper.redisClient = gameRedis;

        let app = require('../app');
        app.watchDatabase('redis', gameRedis);
        cb(null);
    });
};

exports.CloseDB = function (cb) {

    gameRedis.shutdown(cb);
};

