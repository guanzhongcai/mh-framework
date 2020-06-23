//const redis = require('redis');
const validator = require('validator');
var assert = require ('assert');
const utils = require('./utils')

class RedisHelper
{
	constructor(redisCfg)
	{
		this.redisClient = require('redis').createClient({
			host:redisCfg.url,
			port:redisCfg.port,
			db:redisCfg.db ? redisCfg.db : 0,
			password:redisCfg.password
		})

		this.cmd =
			{
				1: "set",
				2: "hset",
				3: "hmset",
				4: "zadd",
				5: "hdel"
			}

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
				//if (tblname != this.redisSyncTableName && 'number' == typeof field && field > 18808029) {
				//	this.updateUserSyncData (tblname, field);
				//}
				callback(result);
			});
		}
	}

	freshToken(tblname,field,token,exp,callback){
		const key = this.getKey(tblname,field)
		this.redisClient.set(key,token,(err,result) =>{
			this.redisClient.expire(key, exp,(err,data)=>{
				callback(result)
			})
		})
	}

	exist(tblname,field,callback){
		 this.redisClient.exists(this.getKey(tblname,field),function (err,data) {
		 	callback(err,data)
		 })
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
		/*this.getHashFieldValue2 (this.redisSyncTableName, field, sSyncData => {
			let doc = ('string' == typeof sSyncData && validator.isJSON(sSyncData)) ? JSON.parse(sSyncData) : {};
			doc[tblname] = 1;
			this.setHashFieldValue2 (this.redisSyncTableName, field, JSON.stringify(doc), () => {
			});
		});*/
	}

	replaceCMD(number)
	{
		// 只定義輸入性指令
		return this.cmd[number]
	}

	multi(actions,callback){
		// 示例: 支持格式 hmset hset set zadd ...
		// actions = [['hmset','tableName',{'key1':'value1','key2':'value2'}],['set','tableName3',JSON.stringify({'key1':'value1'})],['zadd','tableName2',[100,'value2']]]
		let str = `this.redisClient.multi()`
		for (let action of actions){
			str +=`.`
			str += typeof action[0] === 'number' ? this.replaceCMD(action[0]):action[0]
			if(Array.isArray(action[2])){
				if(action[2].length > 1){
					str += `('${action[1]}',`
					for(let param of action[2]){
						if(typeof param === 'number'){
							str += `${param},`
						}else{
							str += `'${param}',`
						}
					}
					str = str.substr(0,str.length -1)
					str += `)`
				}else{
					str += `('${action[1]}','${action[2]}')`
				}
			}else if(typeof action[2] === 'string' && str.constructor === String){
				str += `('${action[1]}','${action[2]}')`
			} else if(typeof action[2] === 'object' && Array.isArray(action[2]) === false){
				// json 格式
				str += `('${action[1]}',`
				Object.keys(action[2]).map(element =>{
					let value = JSON.stringify(action[2][element])
					str += `'${element}'` +","+ `'${value}'` + ','
				})
				str = str.substr(0,str.length -1)
				str += ')'
			}
		}
		str += `.exec(function(err,data){
		  callback(err,data)
	  })`
		eval(str)
	}

	async taskSet(uuid,tableName,data)
	{
		let  redis_key = tableName+':' + uuid
		return new Promise(resolve => {
			this.setHash(redis_key,data,function (data) {
				resolve(data)
			})
		})
	}

	async singleGet(uuid,tblName,action)
	{
		let  redis_key = tblName + ":" + uuid
		return new Promise(resolve => {
			this.getHashFieldValue2(redis_key,action,function (data) {
				resolve(data)
			})
		})
	}

	async taskGetData(...actions)
	{
		// 示例：[18808031, 12,13,14]
		let uuid = actions.shift()
		let tblName = actions.shift()
		let backObj = {}
		await Promise.all(actions.map(async action =>{
			let redisData_ = await this.singleGet(uuid,tblName,action)
			if(redisData_){backObj[action] = JSON.parse(redisData_)}
		}))
		return backObj
	}

	hscansync(key,cursor)
	{
		return new Promise((resolve,reject) => {
			this.redisClient.hscan(key,cursor,function (err,data) {
				if(err){
					reject(err)
				}else{
					resolve(data)
				}
			})
		})
	}

	async loopGet(key,cursor = 0, backObj = {})
	{
		let ret = await this.hscansync(key,cursor)
		if(ret[0] === '0'){
			backObj = Object.assign(backObj,utils.hscanBackArrToObj(ret[1]))
			return backObj
		}else{
			backObj = Object.assign(backObj,utils.hscanBackArrToObj(ret[1]))
			return await this.loopGet(key,ret[0],backObj)
		}
	}

	async hgetall(...data)
	{
		let self = this
		// 示例：[18808031, tblname]
		let uuid = data.shift()
		let tblName = data.shift()
		let redis_data = await self.loopGet(tblName+":"+uuid)
		return redis_data
	}
}

module.exports = RedisHelper;
