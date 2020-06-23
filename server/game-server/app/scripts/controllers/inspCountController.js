const GameBuyCounts = require('./fixedController').GameBuyCounts;
const INSP_COUNT_MAX = 4;
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const playerController = require('./playerController')
const utils = require('../../common/utils')
const CONSTANTS = require('./../../common/constants');
class inspCountController{
    constructor(uuid, multiController, taskController = null) {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'InspCountData';
        this.inspCountData = null;
        this.fixData = null;
        this.heroData = null;
        this.newPlayer = false;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getFromRedis(){
        let self = this;
        return new Promise(resolve => {
            GameRedisHelper.getHash(this.tblname_+":"+this.uuid_ ,function (data) {
                let doc = data
                if(!doc){
                    // 新用户
                    self.newPlayer = true
                    let hashData = {
                        count: 4,
                        reset: new Date().getTime(),
                        buycnt: 0
                    }
                    self.inspCountData = hashData
                    self.multiController.push(3, self.tblname_ +":"+ self.uuid_ , hashData)
                }else{
                    Object.keys(doc).map(element =>{doc[element]  = JSON.parse(doc[element])})
                    self.inspCountData = doc
                }
                resolve(self.inspCountData)
            })
        })
    }

    async getDBorCache(){
        if(!!this.inspCountData){
            return this.inspCountData
        }
        return await this.getFromRedis()
    }

    async dayReset(reset)
    {
        await this.getInspCountInfo()
        if(this.inspCountData && !this.newPlayer){
            if(reset || !utils.isSameDay(this.inspCountData.reset, new Date().getTime())){
                this.inspCountData.count = 4
                this.inspCountData.buycnt = 0
                this.inspCountData.reset = new Date().getTime()
                this.multiController.push(3,this.tblname_+":"+this.uuid_,this.inspCountData)
            }
            return this.inspCountData
        }else{
            return this.inspCountData
        }
    }

    reset()
    {
        this.inspCountData = null
    }

    saveBuyCount()
    {
        this.inspCountData.buycnt ++
        this.multiController.push(3,this.tblname_+":"+this.uuid_, {'buycnt': this.inspCountData.buycnt} )
    }

    async getInspCountInfo()
    {
        // 获取主题信息
        let ret = await this.getDBorCache()
        return ret
    }

    async checkCountValid()
    {
        await this.getInspCountInfo()
        return this.inspCountData.count > 0
    }

    async isFull()
    {
        await this.getInspCountInfo()
        return this.inspCountData.count === INSP_COUNT_MAX
    }

    async subInspCount(cnt,save = false)
    {
        await this.getInspCountInfo()
        this.inspCountData.count -= cnt
        if(save){
            this.multiController.push(3, this.tblname_ +":" + this.uuid_, {count: this.inspCountData.count})
        }
        return this.inspCountData.count
    }

    async buyCountCtl(save= false)
    {
        await this.getInspCountInfo();
        this.inspCountData.count ++
        this.inspCountData.buycnt ++
        if(save){this.multiController.push(3,this.tblname_ +":" + this.uuid_ , this.inspCountData)}
        return this.inspCountData.count
    }

    async addCount()
    {
        // 增加次数 业务逻辑
        let ret = 0
        let self = this
        return new Promise(async resolve => {
            let inspCount = await this.getInspCountInfo()
            let CostData = GameBuyCounts.getBuyCountCostConfigSync(1,inspCount.buycnt)
            // 扣东西
            if(CostData.items && CostData.items.length > 0){
                let player = new playerController(this.uuid_, this.multiController, this.taskController)
                player.itemValid(CostData.items,valid=>{
                    if(!valid){
                        // 东西不够扣
                        ret = 1
                        resolve(ret)
                    }else{
                        player.costItem(CostData.items,function (data) {
                            self.saveBuyCount()
                            // 扣完以后 返回
                            ret = 2
                            resolve(ret)
                        })
                    }
                })
            }
        })
    }
}

module.exports = inspCountController;