const serverConfig = require('../configs/server');
let gameRedis = require('./gameRedis');
let gameMongo = require('./gameMongo');


exports.InitDB = function (cb) {

    const redisConfig = {
        host: serverConfig.gameRedis.url,
        port: serverConfig.gameRedis.port,
        password: serverConfig.gameRedis.port,
        auth_pass: serverConfig.gameRedis.password,
        poolsize: serverConfig.gameRedis.poolsize || 100,
    };
    gameRedis.Init(redisConfig, function (err) {
        if (err) {
            throw err;
        }
        let app = require('../app');
        app.watchDatabase('redis', gameRedis);
        cb(null);
    });
};

exports.CloseDB = function (cb) {

    gameRedis.shutdown(cb);
};

