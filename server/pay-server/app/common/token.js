const jwt = require('jsonwebtoken')
const TOKEN_TABLE = 'User_Token'
const Expire_Time = 6000000000*5  // token 有效期 60秒

class Token {
    constructor(redisClient) {
        this.secret = 'mohun%%%####@@@@&&&&((()_++()&*&'
        this.redisClient = redisClient
    }

    getToken(uuid){
        return new Promise(resolve => {
            this.redisClient.getHashFieldValue(TOKEN_TABLE, uuid,function (data) {
                resolve(data)
            })
        })
    }

    existToken(uuid){
        return new Promise((resolve,reject) => {
            this.redisClient.exist(TOKEN_TABLE, uuid,function (err,data) {
                if(!err){
                    resolve(data)
                }else{
                    reject(err)
                }
            })
        })
    }

    freashToken(uuid,token){
        return new Promise(resolve => {
            this.redisClient.freshToken(TOKEN_TABLE,uuid,token,Expire_Time,function (data) {
                resolve(data)
            })
        })
    }

    verifyToken(token){
        try{
            let result = jwt.verify(token,this.secret)
            let cTime = Math.floor(new Date().getTime() / 1000)
            if(result.data && result.exp > cTime){
                return result.data
            }
            return false
        }catch (e) {
            return false
        }
    }

    signToken(uuid){
        // 生成不过期token  --2030年4月
      return jwt.sign({
          exp:1902700000,
          data:uuid
      },this.secret)
    }

    decode(token){
        return jwt.decode(token)
    }
}

module.exports = Token