const config = require('../../configs/log.json')

// 重写
class log {
    constructor(conn) {
        this.kafkaProducer = conn
    }

    async shopLog(message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'shop'
        let insertData = {
            'uuid': message[0],
            'actionId':message[1],
            'goodsId':message[2],
            'shopId':message[3],
            'shopType':message[4],
            'goodsType'	:message[5],
            'goodsCount':message[6],
            'createAt':new Date().getTime()
        };
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async itemLog(message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'item'
        if(message[2].length === 0 && message[3].length === 0){
            return
        }
        let insertData = {
            'uuid': message[0],
            'actionId':message[1],
            'cost':message[2],
            'gain':message[3],
            'functionId':message[4],
            'createAt':new Date().getTime()
        };
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async itemLogBindMohun (message) {
        let self = this
    if(config.kafkaConf.enable){
        const key = 'item'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async CurrencyLog (message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'currency'
        let insertData = {
            'uuid': message[0],
            'itemId':message[1],
            'actionId':message[2],
            'functionId':message[3],
            'direct':message[4],
            'cnt':message[5],
            'current':message[6],
            'createAt':new Date().getTime()
        };
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async ParticipatLog(message) {
        let self = this
    if(config.kafkaConf.enable){
        const key = 'participat'
        let insertData = {
            'uuid': message[0],
            'functionId':message[1],
            'createAt':new Date().getTime()
        };
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async HouseLog(message) {
        let self = this
    if(config.kafkaConf.enable){
        const key = 'house'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async WorkLog (message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'work'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async PoemLog(message) {
        let self = this
    if(config.kafkaConf.enable){
        const key = 'poem'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async SoulLog(message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'pureConversation'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async DreamLog (message) {
        let self = this
    if(config.kafkaConf.enable){
        const key = 'travel'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async GoodsHouseLog(message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'goodshouse'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async LatticeRomeLog (message){
        let self = this
    if(config.kafkaConf.enable){
        const key = 'latticerome'
        let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
    }
    };

    async ExpLog(message){
        let self = this
        if(config.kafkaConf.enable){
            const key = 'exp'
            let insertData = Object.assign(message, {'createAt':new Date().getTime()})
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
        }
    };

    itemSum(items,heros){
    let resObj = {};
    if(items.length === 0 && hero.length === 0){ return [] }

    items.map(item =>{
        if(!resObj[item.id]){
            resObj[item.id] = item.count
        }else{
            resObj[item.id] += item.count
        }
    });
    let backArr = [];
    Object.keys(resObj).map(one =>{
        backArr.push({id: one, count:resObj[one]})
    });

    heros.map(hero =>{
        backArr.push({
            id: hero.hid,
            count: 1
        })
    });
    return backArr
    };

    async logCurrency(uuid,actionId,functionId,direct,currency,newCurrency){
        let self = this
    if(config.kafkaConf.enable) {
            let bonus = this.log_currency(currency)
        const key = 'currency'
        await Promise.all(bonus.map(async bn =>{
            let log = {
                'uuid': uuid,
                'itemId': bn.id,
                'actionId': actionId,
                'functionId': functionId,
                'direct': direct,
                'cnt': bn.count,
                'current':  bn.id == '410001'? newCurrency[0]: newCurrency[1],
                'createAt': new Date().getTime()
            }
                await self.kafkaProducer.produce(Buffer.from(JSON.stringify(log)), key)
        }))
    }
    };

    log_currency(currency){
    let currencyObj =[ {id:410001,count:currency[0]},{id:410002,count:currency[1]}]
    return currencyObj.filter(v => {return v.count > 0})
    }

}
module.exports =  function (conn) {
    return new log(conn)
};
