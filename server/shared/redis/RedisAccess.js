/**
 * redis访问类
 */
const async = require('async');
const debug = require('debug')("RedisAccess");
const EventEmitter = require('events').EventEmitter;

class RedisAccess extends EventEmitter {

    constructor() {
        super();
        this._execOK = 0;
        this._execFail = 0;
    }

    Init({host, port, auth_pass, db, poolsize}, cb) {
        const redisConfig = {host, port, auth_pass, db, poolsize};
        console.debug(`redisConfig=%j`, redisConfig);
        this._pool = require('./rdb-pool').createRedisPool(redisConfig);

        this.exec('PING', [], function (err, PONG) {
            if (cb && typeof (cb) === "function") {
                cb(err);
            }
        });
    }

    exec(command, args, cb) {

        debug(`command=${command}, args=%j`, args);
        let self = this;
        const _pool = this._pool;

        _pool.acquire(function (err, client) {
            if (err) {
                self._execFail++;
                return cb && cb(err);
            }

            client.send_command(command, args, function (err, res) {
                _pool.release(client);
                if (err) {
                    self._execFail++;
                    console.warn("RedisAccess_error::", err, res, command, args);
                    _pool.destroy(client);
                } else {
                    self._execOK += 1;
                }

                debug(`command=${command}, args=%j, err=%j, res=%j`, args, err, res);
                return cb && cb(err, res);
            });
        });
    }

    shutdown(cb) {
        this._pool.destroyAllNow(function (err) {
            if (err) {
                console.debug(err);
            }
            console.debug(`close redis pool ok`);
            return cb && cb(err);
        });
    };

    getProfile() {

        return {
            poolSize: this._pool.getPoolSize(),
            execOK: this._execOK,
            execFail: this._execFail,
        }
    }
}

RedisAccess.prototype.set = function (key, value, cb) {
    this.exec('set', [key, value], cb);
};

RedisAccess.prototype.get = function (key, cb) {
    this.exec('get', [key], cb);
};

RedisAccess.prototype.incr = function (key, cb) {
    this.exec('incr', [key], cb);
};

RedisAccess.prototype.hset = function (key, field, value, cb) {
    this.exec('hset', [key, field, value], cb)
};

RedisAccess.prototype.hget = function (key, field, cb) {
    this.exec('hget', [key, field], cb)
};

RedisAccess.prototype.expire = function (key, expire, cb) {
    this.exec('expire', [key, expire], cb)
};

RedisAccess.prototype.exists = function (key, cb) {
    this.exec('exists', [key], cb)
};

RedisAccess.prototype.hexists = function (key, field, cb) {
    this.exec('hexists', [key, field], cb)
};

RedisAccess.prototype.hincrby = function (key, field, value, cb) {
    this.exec('hincrby', [key, field, value], cb)
};

RedisAccess.prototype.del = function (key, cb) {
    this.exec('del', [key], cb)
};

/**
 *
 * @param key string
 * @param fieldValue object {field: value}
 * @param cb
 */
RedisAccess.prototype.hmset = function (key, fieldValue, cb) {

    let args = [key];
    for (const field in fieldValue) {
        let value = fieldValue[field];
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        args.push(field, value);
    }
    this.exec('hmset', args, cb);
};

/**
 *
 * @param key string
 * @param fields array object
 * @param cb
 */
RedisAccess.prototype.hmget = function (key, fields, cb) {
    this.exec('hmget', [key].concat(fields), cb)
};

RedisAccess.prototype.hgetall = function (key, cb) {
    this.exec('hgetall', [key], cb)
};

/**
 *
 * @param key
 * @param values array object
 * @param cb
 */
RedisAccess.prototype.sadd = function (key, values, cb) {
    this.exec('sadd', [key].concat(values), cb);
};

RedisAccess.prototype.srem = function (key, value, cb) {
    this.exec('srem', [key, value], cb);
};

RedisAccess.prototype.smembers = function (key, cb) {
    this.exec('smembers', [key], cb);
};

const cmd = {
    1: "set",
    2: "hset",
    3: "hmset",
    4: "zadd",
    5: "hdel"
};
/**
 * multi
 * @param actions array object [['hmset','tableName',{'key1':'value1','key2':'value2'}],['set','tableName3',JSON.stringify({'key1':'value1'})],['zadd','tableName2',[100,'value2']]]
 *
 * [[1,"SoulGameData:18808032","{\"soulCount\":5,\"soulBuyCount\":0,\"soulUpTime\":0,\"themeId\":1,\"uuid\":18808032,\"themeUsed\":[1],\"costInfo\":{\"linggAp\":0,\"skillChargingPoint\":0,\"gachaCount\":0,\"items\":[],\"skinitems\":[],\"currency\":[0,0,0],\"heros\":[],\"attrs\":{\"energy\":0,\"feel\":0,\"cleany\":0,\"jiaoy\":0,\"emotion\":0,\"hungry\":0,\"lingg\":0,\"exp\":0,\"skillpoint\":0},\"buff\":[],\"activeDegreeValue\":0}}"]]
 * @param cb
 */
RedisAccess.prototype.multi = function (actions, cb) {

    const self = this;
    let results = [];

    debug('multi: %j', actions);
    async.eachLimit(actions, 1, function (action, callback) {
        const [commandID, key] = action;
        const command = cmd[commandID];
        if (command !== 'hmset') {
            const args = action.slice(1);
            self.exec(command, args, function (err, result) {
                results.push(result);
                callback(err);
                if (!err) {
                    self.emit('modify', command, args);
                }
            });
        } else {
            const fields = action.slice(2);
            // self.emit('modify', command, fields);
            self.hmset(key, fields, function (err, result) {
                results.push(result);
                callback(err);
            });
        }
    }, function (err) {
        if (typeof cb === 'function') {
            cb(err, results);
        }
    })
};

/**
 *
 * @param key string
 * @param cursor string
 * @param cb
 */
RedisAccess.prototype.hscan = function (key, cursor, cb) {
    this.exec('hscan', [key, cursor], cb);
};

module.exports = RedisAccess;
