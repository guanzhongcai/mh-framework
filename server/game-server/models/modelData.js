/* 
* GZC created on 2020/5/25
*  
* */
const Code = require('../../shared/server/Code');
const gameRedis = require('../db/gameRedis');
const gameMongo = require('../db/gameMongo');
const async = require('async');


let modelData = module.exports;

const TTL = 2 * 24 * 3600;
const Table = {
    user: "user",
    hero: "hero",
    item: "item",
};

const redisCommand = {
    hset: 'hset',
    hget: 'hget',
    set: 'set',
    get: 'get',
    //...
};

const readCommands = [
    redisCommand.get,
    redisCommand.hget,
];

const updateCommands = [
    redisCommand.set,
    redisCommand.hset,
];

modelData.Table = Table;

const getData = function (args, cb) {

    const [command, key] = args;
    const [table, uid] = key.split("_");

    //find in redis first
    const arguments = args.slice(1, args.length);
    gameRedis.exec(command, arguments, function (err, result) {
        if (result === null) {
            //load from mongo
            const model = gameMongo.models[table];
            if (!model) {
                cb(null, null);
                return
            }

            const condition = {uid};
            const projection = {_id: 0, __v: 0, data: 1};
            gameMongo.findOne(model, condition, projection, function (err, doc) {
                if (!doc) {
                    cb(null, null);
                } else {
                    gameRedis.exec('', [key])
                }
            });
        } else {
            cb(null, JSON.parse(result));
        }
    })
};

modelData.loadUser = function (uid, cb) {

    const tables = [];
    let i = 0;
    async.whilst(
        function () {
            return i < tables.length;
        },
        function (callback) {
            const table = tables[i];
            i++;
            const model = gameMongo.models[table];
            gameMongo.findOne(model, {uid}, {data: 1}, function (err, doc) {
                if (!doc) {
                    callback(null);
                } else {
                    const key = table + '_' + uid;
                    gameRedis.exec(redisCommand.set, [key, JSON.stringify(doc)], function (err) {
                        callback(null);
                    })
                }
            })
        },
        function (err) {
            cb(null);
        }
    );
};

modelData.multiHandler = function (multiArgs, cb) {

    let commandArray = [];
    let command = [];
    for (let param of multiArgs) {
        if (!redisCommand[param]) {
            command.push(param);
        } else {
            commandArray.push(command);
            command = [];
        }
    }

    let results = [];
    async.eachLimit(commandArray, 10, function (command, callback) {
        getData(command, function (err, result) {
            result.push(result);
            callback(null);
        })
    }, function (err) {
        cb(null, results);
    })
};
