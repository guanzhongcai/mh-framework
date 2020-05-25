const configData = require('../../shared/data/configData');
let gameRedis = require('./gameRedis');
let gameMongo = require('./gameMongo');


exports.InitDB = function (cb) {

    gameRedis.Init(configData.redis, function (err) {
        if (err) {
            throw err;
        }

        const {uri, options} = configData.mongo;
        gameMongo.connect(uri, options, gameMongo.models, function (err) {
            if (err) {
                throw err;
            }

            let app = require('../app');
            app.watchDatabase('redis', gameRedis);
            app.watchDatabase('mongo', gameMongo);
            cb(null);
        })
    });
};

exports.Close = function (cb) {

    gameRedis.shutdown(function (err) {
        gameMongo.Disconnect(function (err) {

            cb(null);
        })
    });
};

