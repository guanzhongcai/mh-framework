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
        let app = require('../app');
        app.watchDatabase('redis', redisAccess);
        // return cb(null);

        const url = configData.mongo.uri;
        const options = configData.mongo.options;
        gameMongo.connect(url, options, gameMongo.models, function (err) {

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

function dbTest() {
    const actions = [[1, "SoulGameData:18808032", "{\"soulCount\":5,\"soulBuyCount\":0,\"soulUpTime\":0,\"themeId\":1,\"uuid\":18808032,\"themeUsed\":[1],\"costInfo\":{\"linggAp\":0,\"skillChargingPoint\":0,\"gachaCount\":0,\"items\":[],\"skinitems\":[],\"currency\":[0,0,0],\"heros\":[],\"attrs\":{\"energy\":0,\"feel\":0,\"cleany\":0,\"jiaoy\":0,\"emotion\":0,\"hungry\":0,\"lingg\":0,\"exp\":0,\"skillpoint\":0},\"buff\":[],\"activeDegreeValue\":0}}"]];
    redisAccess.multi(actions, function (err, result) {
        console.debug(`mulit_result::`, err, result);
    })
}

// setTimeout(dbTest, 3000);

exports.CloseDB = function (cb) {

    redisAccess.shutdown(function (err) {
        // return cb(err);
        gameMongo.Disconnect(cb);
    });
};

