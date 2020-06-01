const config = require('../../configs/log.config')

class log {
    constructor(conn) {
        this.kafkaProducer = conn
    }

    async loginLog(message){
        let self = this
        if(config.kafkaConf.enable){
            const key = 'login'
            let insertData = {
                'uuid': message[0],
                'channel':message[1],
                'platform':message[2],
                'openid':message[3],
                'createAt':new Date().getTime()
            };
            await self.kafkaProducer.produce(Buffer.from(JSON.stringify(insertData)),key)
        }
    };
}
module.exports =  function (conn) {
    return new log(conn)
};
