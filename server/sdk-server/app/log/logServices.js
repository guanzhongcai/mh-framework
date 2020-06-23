const {LogRedisHelper} = require('../../index.app')
const constants = require('../log/constants/index')

class LogServices{
    constructor() {
      this.LogRedisHelper = LogRedisHelper
      this.logsTableName = constants.tables
    }

    currentSuffix(){
        let data = new Date();
        let month = data.getMonth() + 1
        month = month.toString().length === 1 ? '0' + month : month
        return data.getFullYear() + '' + month
    }

    currentPrefix(){
        let data = new Date();
        return data.getTime() + '_';
    }

    // 所有记录绑定生成日期
    assignCreateAt(obj){
        return JSON.stringify( Object.assign(obj, {createAt: new Date().getTime()}) )
    }

    // 功能参与记录
    logParticipat(uuid, object, callback){
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue(constant.tables.shop + this.currentSuffix , this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }

    // 物品变动记录 获得和消耗
    logItem( uuid, object,callback){
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue(constant.tables.shop + this.currentSuffix , this.currentPrefix() + uuid, value, function (err,data) {
             callback(data)
        })
    }

    // 商城购买记录
    logShopBuy( uuid, goodId,costData,object,callback){
        //存储字段 商城类型 商品id
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue( constant.tables.shop,this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }

    // 商城手动刷新记录
    logShopRefresh( uuid, goodId,costData,object,callback){
        //存储字段 商城类型 商品id 刷新时间
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue( constant.tables.shop,this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }


    // 玩法细分表
    logTricksDetails( uuid, object,callback){
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue(constants.tricks.tableName + this.currentSuffix,this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }

    // 广厦生态
    logHouse( uuid, object,callback){
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue(constants.house.tableName + this.currentSuffix, this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }

    // 工坊生态
    logWork( uuid, object,callback){
        let value = this.assignCreateAt(object)
        this.LogRedisHelper.setHashFieldValue(constants.work.tableName + this.currentSuffix, this.currentPrefix() + uuid, value, function (err,data) {
            callback(data)
        })
    }

    // 保留近三个月记录
    delete(callback){
        // 获取所有的表名字
        let self = this
        Object.keys(this.logsTableName).map(element =>{
           let tableName = element + self.currentSuffix()
            console.log(tableName)
        })
        // this.logsTableName.forEach(tableName =>{
        //     this.LogRedisHelper.delHash(tableName + this.currentSuffix, field, value, function (err,data) {
        //         callback(data)
        //     })
        // })
    }
}

module.exports = new LogServices()