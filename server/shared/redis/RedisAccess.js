/**
 * redis访问类
 */
const async = require('async');

class RedisAccess {

    constructor() {
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
        })
    }

    exec(command, args, cb) {

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
        args.push(field, fieldValue[field]);
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
    this.exec('hmset', [key].concat(fields), cb)
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

/**
 * multi
 * @param actions array object [['hmset','tableName',{'key1':'value1','key2':'value2'}],['set','tableName3',JSON.stringify({'key1':'value1'})],['zadd','tableName2',[100,'value2']]]
 * @param cb
 */
RedisAccess.prototype.multi = function (actions, cb) {

    const self = this;
    const limit = 5;   //每次最多并行请求数
    let results = [];

    async.eachLimit(actions, limit, function (action, callback) {
        const [command, key] = action;
        if (command !== 'hmset') {
            const args = action.slice(1);
            self.exec(command, args, function (err, result) {
                results.push(result);
                callback(err);
            });
        } else {
            const fields = action.slice(2);
            self.hmget(key, fields, function (err, result) {
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
