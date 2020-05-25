/* 
* GZC created on 2020/5/25
*  
* */
const gameRedis = require('../db/gameRedis');
const gameMongo = require('../db/gameMongo');
const async = require('async');


let modelData = module.exports;

const TTL = 2 * 24 * 3600;
const separator = "_";

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

const updateCommands = [
    redisCommand.set,
    redisCommand.hset,
];

modelData.Table = Table;

/**
 *
 * @param args array 元素都是字符串类型 不可为对象
 * @param cb
 */
function handleCommand(args, cb) {

    const [command, key] = args;

    const arguments = args.slice(1, args.length);
    gameRedis.exec(command, arguments, function (err, result) {
        if (updateCommands.includes(command)) {
            const [table, uid] = key.split(separator);
            updateMongo(uid, table, args[0], function (err) {
                cb(err, result);
            });
        } else {
            cb(null, result);
        }
    })
}

function updateMongo(uid, table, data, cb) {

    const model = gameMongo.models[table];
    if (!model) {
        cb(null, null);
        return
    }

    const condition = {uid};
    const updateDoc = {data: JSON.parse(data)};
    const options = {upsert: true};
    gameMongo.updateOne(model, condition, updateDoc, options, function (err) {
        cb(err);
    });
}

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
                    const key = table + separator + uid;
                    gameRedis.exec(redisCommand.set, [key, JSON.stringify(doc), TTL], function (err) {
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

modelData.multi = function (multiArgs, cb) {

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
        handleCommand(command, function (err, result) {
            result.push(result);
            callback(null);
        })
    }, function (err) {
        cb(null, results);
    })
};
