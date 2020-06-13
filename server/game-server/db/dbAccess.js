const redisConfig = require('../configs/server').gameRedis;
let redisAccess = require('./redisAccess');
let gameMongo = require('./gameMongo');
const configData = require('../../shared/data/configData');

exports.InitDB = function (cb) {

    onRedisModify();
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

        const url = configData.mongo.uri;
        const options = configData.mongo.options;
        gameMongo.connect(url, options, gameMongo.models, function (err) {

            let app = require('../app');
            app.watchDatabase('redis', redisAccess);
            app.watchDatabase('mongo', gameMongo);
            cb(null);
        });
    });
};

function onRedisModify() {

    redisAccess.on('modify', function (command, args) {
        console.debug(`redis_modify_event: command=${command}, args=%j`, args);
        switch (command.toLowerCase()) {
            case "set":
                //command=set, args=["TaskData:18808032","{\"triggerCountData\..
                const [key, dataStr] = args;
                const [table, uuid] = key.split(':');
                syncMongo(table, uuid, dataStr);
                break;

            case "hset":
                break;

            case "expire":
                break;

            case "hmset":
                break;
        }
    });
}

function syncMongo(table, uuid, dataStr) {

    if (dataStr[0] !== '{') {
        return;
    }

    try {
        const data = JSON.parse(dataStr);
        gameMongo.checkModel(table);
        const model = gameMongo.models[table];
        const condition = {uuid};
        const updateDoc = {$set: {data}};
        const option = {upsert: true};
        gameMongo.updateOne(model, condition, updateDoc, option);
    } catch (e) {
        //数据结构不是json格式，就不存盘
    }
}

exports.CloseDB = function (cb) {

    redisAccess.shutdown(function (err) {
        gameMongo.Disconnect(cb);
    });
};

