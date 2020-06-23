const HotSpring = require ('./fixedController').HotSpring;
const models = require('./../models');
const utils = require('./../../common/utils');
const CONSTANTS = require('./../../common/constants');
const async = require ('async');
var assert = require ('assert');

const HOTSPRING_MAX_SUPPLY_ENERGY = 200;

const HOTSPRING_ADD_MOOD = 5;
const HOTSPRING_MAX_HOURS = 23;
const HOTSPRING_MIN_HOURS = 4;
const HOTSPRING_CHECK_NOTSAMEDAY = 18000000;

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;


class hotSpringController
{
    constructor(uuid, multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'HotSpring';
        this.multiController = multiController;
        this.hotSpringData = null;
        this.taskController = taskController;
    }

    errorHandle(){
        // todo 内存数据清空
        this.hotSpringData = null
    }

    static FeelEventType (){
        return {
            ADDMODE:1,
            DECMODE:2,
        }
    }

    // 判断是否是有效的时间段
    checkIsValidTime (data)
    {
        var hours = data.getHours();
        if (hours >= HOTSPRING_MAX_HOURS || hours < HOTSPRING_MIN_HOURS)
            return false;
        else
            return true;
    }

    getFromDBOrCache(callback){
        if(!!this.hotSpringData){
            callback(this.hotSpringData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sHotSpringData => {
                var doc = sHotSpringData && validator.isJSON(sHotSpringData)? JSON.parse(sHotSpringData) : null;
                this.hotSpringData = doc
                callback(doc)
            })
        }
    }

    // 获取温泉数据 如果处于温泉休息时间段 对温泉数据进行结算
    getHotSpringData (callback)
    {
        this.getFromDBOrCache( doc => {
            if (doc) {
                let kickoutArray = null;
                let heroSpringDataArray = null;
                let curData = new Date();
                let showUpdateDb = false;
                let heroDatas = doc.heroDatas;
                for (var i = heroDatas.length - 1; i >= 0; i-- ){
                    let kickoutInfo = this.calcIsShouldAutoKickOut (curData, heroDatas[i].activeTime, heroDatas[i].lastBathTime);
                    let heroSpringData = {}
                    if (kickoutInfo.isAutoKick){
                        showUpdateDb = true;
                        if (kickoutArray == null) {
                            kickoutArray = [];
                        }
                        if (heroSpringDataArray == null){
                            heroSpringDataArray = [];
                        }
                        this.calcHotspringResultInfo (kickoutInfo.endtimestamp, heroDatas[i], heroDatas[i].restoreConfigInfo, heroSpringData);
                        heroDatas.splice (i, 1);
                        let kick = {};
                        kick.heroId = heroSpringData.heroId;
                        kick.addEnergy = heroSpringData.addEnergyThisTime;
                        kick.endtimestamp = kickoutInfo.endtimestamp;
                        kickoutArray.push (kick);
                        heroSpringDataArray.push (heroSpringData);
                    }
                }

                let retData = {}
                retData.buyout = doc.buyout;
                retData.heroDatas = heroDatas;
                retData.kickOutInfo = kickoutArray;
                retData.kickOutHeroDatas = heroSpringDataArray;

                if (showUpdateDb){
                    this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
                    this.hotSpringData = doc
                    callback(retData);
                }else{
                    callback(retData);
                }
            } else {
                // 新建温泉数据
                let hotSpringModel = models.HotspringModel ();
                hotSpringModel.uuid = this.uuid_;
                this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(hotSpringModel))
                this.hotSpringData = hotSpringModel
                callback(hotSpringModel);
            }
        });
    }

    // 判断温泉是否已经买断
    isHotSpringBuyOut (callback)
    {
        this.getFromDBOrCache( doc => {
            if (doc){
                callback (doc.buyout == 0 ? false : true);
            }else{
                callback (false);
            }
        });
    }

    // 温泉买断操作
    buyOut (callback)
    {
        let buyout = 1;
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            doc.buyout = buyout;
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
            this.hotSpringData = doc
            callback(buyout);
        });
    }

    // 判断墨魂是否已经使用了温泉券
    IsHeroAlreadyBuyTicket (heroId, callback)
    {
        this.getFromDBOrCache( doc => {
            if (doc == null || doc.heroDatas == null || doc.heroDatas.length <= 0) {
                callback (false);
            }else{
                let searchedHeroData = null;
                for (let index in doc.heroDatas) {
                    if (doc.heroDatas[index].heroId == heroId) {
                        searchedHeroData = doc.heroDatas[index];
                        break;
                    }
                }
                if (searchedHeroData != null) {
                    var now = (new Date()).getTime();
                    if (searchedHeroData.activeTime != null && searchedHeroData.activeTime != 0) {
                        if (!utils.isSameDay (searchedHeroData.activeTime, now)) {
                            callback (false);
                        }else{
                            callback (true);
                        }
                    }else{
                        callback (false);
                    }
                }else {
                    callback (false);
                }
            }
        });
    }

    // 判断墨魂是否处于入浴状态
    IsHeroAleadyInBathStatus (heroId, callback)
    {
        this.getFromDBOrCache( doc => {
            if (doc == null || doc.heroDatas == null || doc.heroDatas.length <= 0) {
                callback (false);
            }else{
                let searchedHeroData = null;
                for (let index in doc.heroDatas) {
                    if (doc.heroDatas[index].heroId == heroId) {
                        searchedHeroData = doc.heroDatas[index];
                        break;
                    }
                }
                if (searchedHeroData != null) {
                    callback (searchedHeroData.lastBathTime != 0);
                }else {
                    callback (false);
                }
            }
        });
    }

    // 添加墨魂的墨魂配置数据
    setUpHotspringRestoreConfig (restoreData)
    {
        let restoreConfigInfo = {}
        restoreConfigInfo.MaxEnergy = restoreData.MaxEnergy;
        restoreConfigInfo.ComfortTime = restoreData.ComfortTime;
        restoreConfigInfo.Rate = restoreData.Rate;
        restoreConfigInfo.IntervalTime = restoreData.IntervalTime;
        restoreConfigInfo.MaxTime = restoreData.MaxTime;
        return restoreConfigInfo;
    }

    // 入浴
    startHotSpring (heroId, buyTicket, callback)
    {
        this.getFromDBOrCache( doc => {
            assert (doc != null && doc.heroDatas != null, "hero datas should not be null");
            HotSpring.getHotSpringConfig(heroId, restoreData => {
                if (restoreData == null) {
                    restoreData = models.HotspringRestoreModel ()
                }
                var now = (new Date()).getTime();
                var heroSpringData = {};
                let findMohunData = false;
                for (let i in doc.heroDatas) {
                    if (doc.heroDatas[i].heroId == heroId) {
                        heroSpringData = doc.heroDatas[i];
                        findMohunData = true;
                        break;
                    }
                }

                if (findMohunData) {
                    if (!utils.isSameDay (heroSpringData.activeTime, now)) {
                        heroSpringData.activeTime = now;
                        heroSpringData.addEnergy = 0;
                    }
                    heroSpringData.lastBathTime = now;
                    heroSpringData.restoreConfigInfo = this.setUpHotspringRestoreConfig (restoreData)
                }else{
                    let heroData = models.HotspringHeroDataModel ();
                    heroData.heroId = heroId;
                    heroData.lastBathTime = now;
                    heroData.energyCanSupply = restoreData.MaxEnergy;
                    heroData.activeTime = now;
                    heroSpringData = heroData;
                    heroData.restoreConfigInfo = this.setUpHotspringRestoreConfig (restoreData)
                    doc.heroDatas.push (heroData);
                }

                this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
                this.hotSpringData = doc
                callback(heroSpringData);
            });
        });
    }

    calcIsShouldAutoKickOut (curData, activeTime, lastBathTime)
    {
        let showKickout = false;
        let showCalcRestoreTime = false;
        let curTimeStamp = curData.getTime ();
        if (utils.isSameDay (curTimeStamp, activeTime)){
            if (!this.checkIsValidTime (curData)){
                showKickout = true;
                showCalcRestoreTime = true;
            }
        }else {
            showCalcRestoreTime = true;
            if (curTimeStamp - activeTime >= HOTSPRING_CHECK_NOTSAMEDAY) {
                showKickout = true;
            }
        }

        let restoreEndTimeStamp = curTimeStamp;
        if (showCalcRestoreTime) {
            let dateA = new Date(lastBathTime);
            dateA.setHours(HOTSPRING_MAX_HOURS, 0, 0, 0);
            restoreEndTimeStamp = dateA.getTime ();
        }

        let kickOUTInfo = {}
        kickOUTInfo.isAutoKick = showKickout;
        kickOUTInfo.endtimestamp = restoreEndTimeStamp
        return kickOUTInfo;
    }

    // 计算温泉结算信息 单个玩家结算处理 需要考虑当前时间信息
    // 判断当前时间和上次入浴时间间隔
    // 是不是同一天
    // 若不是同一天判断时间是否超过5小时
    calcHotspringResultInfo (restoreEndTimeStamp, springData, restoreData, heroSpringData)
    {
        let springTime = restoreEndTimeStamp - springData.lastBathTime;
        let restoreEnergy = Math.round ((springTime / 60000) * restoreData.Rate);
        if (restoreEnergy + springData.addEnergy >= springData.energyCanSupply)
            restoreEnergy = springData.energyCanSupply - springData.addEnergy;
        springData.addEnergy += restoreEnergy;
        springData.lastBathTime = 0;

        heroSpringData.lastBathTime = springData.lastBathTime;
        heroSpringData.activeTime = springData.activeTime;
        heroSpringData.addEnergy = springData.addEnergy;
        heroSpringData.energyCanSupply = springData.energyCanSupply;
        heroSpringData.heroId = springData.heroId;
        heroSpringData.addEnergyThisTime = restoreEnergy;
        heroSpringData.addFeel = 0;

        if (springData.feelData != null)
        {
            heroSpringData.addFeel = springData.feelData.addFeel;
            delete springData.feelData;
        }
    }

    // 出浴
    getOutOfHotSpring (heroId, callback)
    {
        this.getFromDBOrCache( doc => {
            assert (doc != null && doc.heroDatas != null, "hero datas should not be null");
            HotSpring.getHotSpringConfig(heroId, restoreData => {
                if (restoreData == null)
                    restoreData = models.HotspringRestoreModel ();

                var heroSpringData = {};
                let curData = new Date();
                for (let i in doc.heroDatas) {
                    if (doc.heroDatas[i].heroId == heroId) {
                        let springData = doc.heroDatas[i];
                        let kickoutInfo = this.calcIsShouldAutoKickOut (curData, springData.activeTime, springData.lastBathTime);
                        this.calcHotspringResultInfo (kickoutInfo.endtimestamp, springData, restoreData, heroSpringData);
                        break;
                    }
                }
                this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
                this.hotSpringData = doc
                callback(heroSpringData);
            });
        });
    }

    // 超过墨魂恢复上限处理
    updateHotspringSupplyInfo (hid, deleteCount, callback) {
        this.getFromDBOrCache( doc => {
            assert (doc != null && doc.heroDatas != null && doc.heroDatas[0] != null, "hero spring data should not be null");
            let springData = null;
            for (let index in doc.heroDatas) {
                if (doc.heroDatas[index].heroId == heroId) {
                    springData = doc.heroDatas[index];
                    break;
                }
            }
            if (springData != null) {
                springData.addEnergy += deleteCount;
                this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
                this.hotSpringData = doc
                callback(springData.addEnergy);
            }else {
                callback(0);
            }
        });
    }

    // 处理温泉心情事件信息
    handleFeelEvent (heroId, feelData, callback)
    {
        this.getFromDBOrCache( doc => {
            assert (doc != null && doc.heroDatas != null, "hero datas should not be null");
            let retData = {}
            for (let i in doc.heroDatas) {
                if (doc.heroDatas[i].heroId == heroId) {
                    let heroFeelData = doc.heroDatas[i].feelData;
                    if (heroFeelData == null){
                        retData.status = 1;
                    }else{
                        if (heroFeelData.addFeel != feelData.addFeel || heroFeelData.eventType != feelData.eventType) {
                            retData.status = 2;
                        }else {
                            retData.status = 0;
                            retData.addFeel = heroFeelData.addFeel;
                            delete heroFeelData.addFeel;
                            delete heroFeelData.eventType;
                        }
                    }
                    break;
                }
            }

            if (retData.status == 0) {
                this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
                this.hotSpringData = doc
                callback(retData);
            }else{
                callback (retData);
            }
        });
    }

    // 获取温泉心情事件信息
    getHotSpringFeelEvent (callback)
    {
        this.getFromDBOrCache( doc => {
            assert (doc != null && doc.heroDatas != null, "hero datas should not be null");
            var now = (new Date()).getTime();
            let heroData = [];
            for (let i in doc.heroDatas) {
                let heroSpringData = doc.heroDatas[i]
                if (heroSpringData.lastBathTime != 0 && heroSpringData.restoreConfigInfo != null){
                    let pastTime = (now - heroSpringData.lastBathTime) / 1000;
                    if (heroSpringData.feelData == null) {
                        if (pastTime >= heroSpringData.restoreConfigInfo.IntervalTime) {
                            let feelData = {}
                            feelData.lastFeelTime = now;
                            if (pastTime >= heroSpringData.restoreConfigInfo.ComfortTime) {
                                feelData.eventType = hotSpringController.FeelEventType ().DECMODE;
                                feelData.addFeel = -HOTSPRING_ADD_MOOD;
                            }else{
                                feelData.eventType = hotSpringController.FeelEventType ().ADDMODE;
                                feelData.addFeel = HOTSPRING_ADD_MOOD;
                            }
                            heroSpringData.feelData = feelData;
                        }
                    }else{
                        if (heroSpringData.feelData.lastFeelTime != null) {
                            let lastFeelPastTime = (now - heroSpringData.feelData.lastFeelTime) / 1000;
                            if (lastFeelPastTime >= heroSpringData.restoreConfigInfo.IntervalTime) {
                                if (pastTime >= heroSpringData.restoreConfigInfo.ComfortTime) {
                                    heroSpringData.feelData.eventType = hotSpringController.FeelEventType ().DECMODE;
                                    heroSpringData.feelData.addFeel = -HOTSPRING_ADD_MOOD;
                                    heroSpringData.feelData.lastFeelTime = now;
                                }else{
                                    heroSpringData.feelData.eventType = 1;
                                    heroSpringData.feelData.addFeel = HOTSPRING_ADD_MOOD;
                                    heroSpringData.feelData.lastFeelTime = now;
                                }
                            }
                        }else {
                            if (pastTime >= heroSpringData.restoreConfigInfo.IntervalTime) {
                                if (pastTime >= heroSpringData.restoreConfigInfo.ComfortTime) {
                                    heroSpringData.feelData.eventType = hotSpringController.FeelEventType ().DECMODE;
                                    heroSpringData.feelData.addFeel = -HOTSPRING_ADD_MOOD;
                                    heroSpringData.feelData.lastFeelTime = now;
                                }else{
                                    heroSpringData.feelData.eventType = hotSpringController.FeelEventType ().ADDMODE;
                                    heroSpringData.feelData.addFeel = HOTSPRING_ADD_MOOD;
                                    heroSpringData.feelData.lastFeelTime = now;
                                }
                            }
                        }
                    }
                }
                if (heroSpringData.feelData != null && heroSpringData.feelData.eventType != null){
                    let heroFeelData = {}
                    heroFeelData.heroId = heroSpringData.heroId;
                    heroFeelData.feelData = heroSpringData.feelData;
                    heroData.push (heroFeelData);
                }
            }

            this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(doc))
            this.hotSpringData = doc
            callback(heroData);
        });
    }
}

module.exports = hotSpringController;
