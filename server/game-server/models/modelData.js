/* 
* GZC created on 2020/5/25
*  
* */
const Code = require('../../shared/server/Code');
const gameModel = require('../db/gameMongo');
const async = require('async');

let modelData = module.exports;

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

modelData.Table = Table;

const getData = function (args, cb) {

    const [command, key] = args;
    const [table, uid] = key.split("_");
    if (!Table[table]) {
        return cb(null, {code: Code.FAIL, msg: `undefined table=${table}`});
    }

    //find in redis first

    //load from mongo

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
