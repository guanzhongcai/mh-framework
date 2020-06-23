//const redis = require('redis');
const validator = require('validator');
var assert = require ('assert');

class RedisHelper
{
	constructor(redisCfg)
	{
        this.redisClient = require('redis-connection-pool')('myRedisPool', {
            host: redisCfg.url, // default
            port: redisCfg.port, //default
            // optionally specify full redis url, overrides host + port properties
            // url: "redis://username:password@host:port"
            max_clients: 30, // defalut
            perform_checks: false, // checks for needed push/pop functionality
            database: redisCfg.db ? redisCfg.db : 0, // database number to use
            options: {
              auth_pass: redisCfg.password
            } //options for createClient of node-redis, optional
          });
        /*redis.createClient(redisCfg.port, redisCfg.url);
		this.redisClient.auth(redisCfg.password);*/
		this.redisSyncTableName = redisCfg.syncdata;

        /*
		this.redisClient.on("error", err => {
			console.error("redis connect failed: ", err);
			process.exit(-1);
		});

		this.redisClient.on("connect", () => {
			console.log("redis connect success: %s:%s", redisCfg.url, redisCfg.port);
		});*/
	}

	getKey(tblname, field)
	{
		return tblname + ":" + field.toString();
	}

	addCounter(key, callback)
	{
		this.redisClient.incr(key, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	// string
	getString(key, callback)
	{
		this.redisClient.get(key, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	setString(key, value, callback)
	{
		this.redisClient.set(key, value, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	// hash
	setHashFieldValue(tblname, field, value, callback)
	{
		if (tblname == 'GlobalData') {
			this.redisClient.hset(tblname, field, value, (err, result) => {
				if (err) { console.error(err); }
				callback(result);
			});
		} else {
			this.redisClient.set(this.getKey(tblname, field), value, (err, result) => {
				if (err) { console.error(err); }
				if (tblname != this.redisSyncTableName && 'number' == typeof field && field > 18808029) {
					this.updateUserSyncData (tblname, field);
				}
				callback(result);
			});
		}
	}

	setHashFieldValue2(tblname, field, value, callback)
	{
		this.redisClient.hset(tblname, field, value, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	getHashFieldValue2 (tblname, field, callback)
	{
		this.redisClient.hget(tblname, field, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	getHashFieldValue(tblname, field, callback)
	{
		if (tblname == 'GlobalData') {
		this.redisClient.hget(tblname, field, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
		} else {
			this.redisClient.get(this.getKey(tblname, field), (err, result) => {
				if (err) { console.error(err); }
				callback(result);
			});
		}
	}

	getHashFieldValueInt(tblname, field, callback)
	{
		if (tblname == 'GlobalData') {
		this.redisClient.hget(tblname, field, (err, result) => {
			if (err) { console.error(err); }
			callback(result ? parseInt(result) : 0);
		});
		} else {
			this.redisClient.get(this.getKey(tblname, field), (err, result) => {
				if (err) { console.error(err); }
				callback(result);
			});
		}
	}

	addHashFieldValue(tblname, field, value, callback)
	{
		this.redisClient.hincrby(tblname, field, value, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	delHash(tblname, callback)
	{
		this.redisClient.del(tblname, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	setHash(tblname, data, callback)
	{
		this.redisClient.hmset(tblname, data, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	getHash(tblname, callback)
	{
		this.redisClient.hgetall(tblname, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	// sets
	addSetValues(tblname, values, callback)
	{
		this.redisClient.sadd(tblname, values, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	delSetValue(tblname, value, callback)
	{
		this.redisClient.srem(tblname, value, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	getSetMembers(tblname, callback)
	{
		this.redisClient.smembers(tblname, (err, result) => {
			if (err) { console.error(err); }
			callback(result);
		});
	}

	//update user sync data..
	updateUserSyncData (tblname, field)
	{
		this.getHashFieldValue2 (this.redisSyncTableName, field, sSyncData => {
			let doc = ('string' == typeof sSyncData && validator.isJSON(sSyncData)) ? JSON.parse(sSyncData) : {};
			doc[tblname] = 1;
			this.setHashFieldValue2 (this.redisSyncTableName, field, JSON.stringify(doc), () => {
			});
		});
	}

	// 获取所有key
	keys (callback)
	{
		// this.redisClient.keys('*', (err, result) => {
		// 	if (err) { console.error(err); }
		// 	callback(result);
		// });
	}

}

module.exports = RedisHelper;
