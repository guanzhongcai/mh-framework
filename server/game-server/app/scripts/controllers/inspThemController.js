const InspirationTheme = require('./fixedController').InspirationTheme;
const heroController = require('./heroController');
const _  = require('lodash');
const HeroConfig = require('../../designdata/HeroConfig');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const utils = require('../../common/utils')
const playerController = require('./playerController');
const CONSTANTS = require('./../../common/constants');
class inspThemController{
    constructor(uuid, multiController, taskController = null) {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'InspThemData';
        this.inspThemData = null;
        this.fixData = null;
        this.heroData = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getFromRedis(){
        let self = this;
        return new Promise(resolve => {
            GameRedisHelper.getHash(this.tblname_+":"+this.uuid_ ,async function (data) {
                let doc = data
                if(!doc){
                    self.inspThemData = {}
                }else{
                    Object.keys(doc).map(element =>{doc[element]  = JSON.parse(doc[element])})
                    self.inspThemData = doc
                }
                resolve(self.inspThemData)
            })
        })
    }

    async checkThemeUnlockStatus () {
        return new Promise( resolve => {
            let player = new playerController(this.uuid_, this.multiController, this.taskController);
            player.getLevel(level => {
                if (this.fixData == null) {
                   let config = InspirationTheme.getThemeListConfig()
                    this.fixData = config
                }

                Object.keys(this.fixData).map(element =>{
                    if (this.inspThemData[element] == null || this.inspThemData[element].unlock !== 1) {
                        let field = this.fixData[element].unlockTerm.split(',');
                        let valid = false;
                        if (field.length === 3 && level >= field[1]) {
                            valid = true;
                        }
                        if (valid) this.inspThemData[element] = {id:element, unlock:1, isAllComplete:0, receive:0}
                    }
                })
                resolve (0);
            });
        });
    }

    async checkIsUnlock(themeID)
    {
        let themeData = await this.getInspInfo()
        let check = themeData[themeID].unlock > 0 ? true: false
        return check
    }

    async getDBorCache(){
        if(!!this.inspThemData){
            return this.inspThemData
        }
        return await this.getFromRedis()
    }

    reset()
    {
        this.inspThemData = null
    }

    async getInspInfo()
    {
        // 获取主题信息
        let ret = await this.getDBorCache()
        await this.checkThemeUnlockStatus ();
        return ret
    }

    async getInspirationInfo()
    {
        let baseData = await this.getInspInfo()
        let unlocks = 0
        Object.keys(baseData).map(element =>{
           if(baseData[element].unlock > 0) {
               unlocks ++
           }
        })
        let bindRecoment = await this.getRecommendHero(unlocks,baseData)
        return bindRecoment
    }

    async fillHeros(omit,fill_nums)
    {
        return new Promise(resolve => {
            let Heros = HeroConfig.getHeroIdList()
            if(!!omit && omit.length > 0){
                Heros = _.without(Heros,...omit)
            }
            resolve(_.sampleSize(Heros,fill_nums))
        })
    }

    getRecommendHero(unlocks,baseData){
        let self = this
        let should_save = false
        return new Promise(resolve => {
            let heros = new heroController(this.uuid_, 0, this.multiController, this.taskController)
            heros.getHeroDataFromDataSource(async (herodata)=> {
                self.heroData = herodata
                let heroIds = []
                self.heroData.mhdatas.map(element =>{heroIds.push(element.hid)})
                // 个人英雄足够用来随机
                let data = _.sampleSize(heroIds, unlocks)
                let without = []
                without.push(...data)
                for(let ele of Object.keys(baseData)) {
                    if (baseData[ele].unlock > 0) {
                        if (utils.isSameDay(new Date().getTime(), baseData[ele].reset) && !!baseData[ele].reset) {
                            should_save = false
                        } else {
                            baseData[ele].reset = new Date().getTime()
                            baseData[ele].award = InspirationTheme.getThemeAwardsConfig(ele)
                            baseData[ele].recoment = []
                            baseData[ele].isAllComplete = 0
                            baseData[ele].receive = 0
                            if (data[ele - 1]) {
                                baseData[ele].recoment.push(data[ele - 1])
                            }
                            let fillNum = 3 - baseData[ele].recoment.length
                            let fills = await self.fillHeros(without, fillNum)
                            without.push(...fills)
                            should_save = true
                            baseData[ele].recoment.push(...fills)
                        }
                    }
                }

                if(!!should_save){
                    self.multiController.push(3, self.tblname_ +":"+ self.uuid_ , baseData)
                    self.inspThemData =  baseData
                }

                resolve(baseData)
            })
        })
    }

    async videoEnd(themeId)
    {
        let ret = await this.getInspInfo()
        if(ret[themeId].unlock == 0){
            return -1
        }else{
            ret[themeId].unlock = 2
            this.multiController.push(2,this.tblname_+":" + this.uuid_ , {[themeId]:ret[themeId]})
            return 0
        }
    }

    async setRecomentData(themeId,heroId,save)
    {
        let ret = await this.getInspInfo()
        let rows = ret[themeId]

        if(rows.recoment.includes(heroId) && rows.isAllComplete === 0){
            // 第一次完成 且 使用了墨魂
            rows.isAllComplete = 1;
            if(save){this.multiController.push(2,this.tblname_+":" + this.uuid_ , {[themeId]:ret[themeId]})}
        }
    }

    async receiveReward(themeId,save)
    {
        let ret = await this.getInspInfo()
        let rows = ret[themeId]
        if(rows.isAllComplete === 1 && rows.receive === 0){
            // 第一次完成 且 使用了墨魂
            rows.receive = 1;
            if(save){
                this.multiController.push(2,this.tblname_+":" + this.uuid_ , {[themeId]:ret[themeId]})
            }
            return 1
        }else if(rows.isAllComplete === 1 && rows.receive === 1){
            // 已领取
            return -1
        }else if(rows.isAllComplete === 0){
            // 未达到领取条件
            return -2
        }
    }

    async loadReward(themeId)
    {
        let ret = await this.getInspInfo()
        let row = ret[themeId]
        return row.award
    }
}

module.exports = inspThemController;