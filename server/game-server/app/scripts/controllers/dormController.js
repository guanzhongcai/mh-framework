const Heros = require ('./fixedController').Heros;
const DormDoor = require ('./fixedController').DormDoor;
const categoryFromItemList = require ('./fixedController').categoryFromItemList;
const models = require('./../models');
const utils = require('./../../common/utils');
const CONSTANTS = require('./../../common/constants');
const playerController = require('./playerController');
const heroController = require('./heroController');
const Notification = require('./notifController').Notification;
const async = require ('async');
var assert = require ('assert');

const DORM_NORMAL_MAX_HERO = 3;
const DORM_DOOR_MAX_LEVEL = 3;

const DORM_DOOR_LEVEL1_COMFORT = 20;
const DORM_DOOR_LEVEL2_COMFORT = 50;
const DORM_DOOR_LEVEL3_COMFORT = 100;

const DORM_DOOR_COMFORT_LEVEL1 = 1;
const DORM_DOOR_COMFORT_LEVEL2 = 2;
const DORM_DOOR_COMFORT_LEVEL3 = 3;

const DORM_DOOR_LEVEL1_LIMITED = 200;
const DORM_DOOR_LEVEL2_LIMITED = 500;
const DORM_DOOR_LEVEL3_LIMITED = 999;

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

class dormController
{
    constructor(uuid, multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'Dorm';
        this.dormData = null;
        this.m_RedisDormDataString = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    errorHandle(){
        this.dormData = null
        this.m_RedisDormDataString = null
    }

    getDormDataFromDataSource (callback) {
        if (this.dormData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sDormData => {
                this.m_RedisDormDataString = sDormData;
                let doc = sDormData && validator.isJSON(sDormData)? JSON.parse(sDormData) : null;
                this.dormData = doc;
                callback (doc);
            });
        }else {
            callback (this.dormData);
        }
    }

    saveDormDataToDataSource (dormData, callback) {
        if (dormData != null) {
            let saveString = JSON.stringify(dormData);
            let shouldSave = true;
            if (this.m_RedisDormDataString == null || this.m_RedisDormDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.dormData = dormData;
                this.multiController.uniqPush(1, this.tblname_ + ":" + this.uuid_, saveString)
                this.m_RedisDormDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    dormGetDormData (callback) {
        this.getDormDataFromDataSource (doc => {
            if (doc == null) {
                let dormData = models.DormData ()
                dormData.uuid = this.uuid_;
                this.saveDormDataToDataSource (dormData, () => {
                    callback(dormData);
                });
            }else {
                let retData = {};
                retData.dorminfos = doc.dorminfos;
                retData.dormLevelUpInfo = doc.dormLevelUpInfo;
                let dormRestInfo = doc.dormRestInfo;
                if (dormRestInfo == null) dormRestInfo = [];

                let wakeUpHeroes = [];
                let workStats = [];
                let newWorkStat = heroController.WORKSTATS().IDLE;
                var curTime = (new Date()).getTime();
                for (var i = dormRestInfo.length - 1; i >= 0; i--){
                    if (curTime - dormRestInfo[i].sleepTime >= dormRestInfo[i].restData.duration * 1000) {
                        let wakeUpInfo = {}
                        wakeUpInfo.heroId = dormRestInfo[i].heroId;
                        wakeUpInfo.restTime = dormRestInfo[i].restData.duration;
                        wakeUpInfo.addEnergy = dormRestInfo[i].restData.addEnergy;
                        wakeUpHeroes.push (wakeUpInfo);
                        workStats[dormRestInfo[i].heroId] = newWorkStat;
                        dormRestInfo.splice (i, 1);
                    }
                }

                retData.dormRestInfo = dormRestInfo;
                if (wakeUpHeroes.length > 0) {
                    retData.wakeUpHeroes = wakeUpHeroes;
                    this.addBatchAttrEnergy (this.uuid_, wakeUpHeroes, (attrs, updateStats) => {
                        retData.updatedAttrs = attrs;
                        retData.updateStats = updateStats;
                        this.saveDormDataToDataSource (doc, () => {
                            callback(retData);
                        });
                    });
                }else {
                    callback(retData);
                }
            }
        });
    }

    // 获取基础等级舒适度
    getBaseComfort (level)
    {
        if (level == DORM_DOOR_COMFORT_LEVEL1) {
            return DORM_DOOR_LEVEL1_COMFORT;
        }else if (level == DORM_DOOR_COMFORT_LEVEL2) {
            return DORM_DOOR_LEVEL2_COMFORT;
        }else {
            return DORM_DOOR_LEVEL3_COMFORT;
        }
    }

    // 升级获取基础等级舒适度加成
    getLevelUpAddComfort (level)
    {
        if (level == DORM_DOOR_COMFORT_LEVEL2) {
            return DORM_DOOR_LEVEL2_COMFORT - DORM_DOOR_LEVEL1_COMFORT;
        }else if (level == DORM_DOOR_COMFORT_LEVEL3){
            return DORM_DOOR_LEVEL3_COMFORT - DORM_DOOR_LEVEL2_COMFORT;
        }else{
            return DORM_DOOR_LEVEL1_COMFORT;
        }
    }

    // 根据舒适度来获取舒适度等级
    getComfortLevelByComf (comf)
    {
        if (comf <= DORM_DOOR_LEVEL1_LIMITED) {
            return DORM_DOOR_COMFORT_LEVEL1;
        }else if (comf <= DORM_DOOR_LEVEL2_LIMITED) {
            return DORM_DOOR_COMFORT_LEVEL2;
        }else {
            return DORM_DOOR_COMFORT_LEVEL3;
        }
    }

    getRecoverEngergyPerMin (level) {
        if (level == DORM_DOOR_COMFORT_LEVEL2) {
            return 1.2;
        }else if (level == DORM_DOOR_COMFORT_LEVEL3){
            return 1.5;
        }else{
            return 1;
        }
    }

    // 住宅修复
    dormRepaire (level, dormId, doorName, callback)
    {
        let retData = {};
        DormDoor.getDormDoorData (dormId, doorData => {
            if (doorData.DoorUnlockLevel > level) {
                retData.status = 1;
                callback (retData);
            }else if (doorData.isNeedRepaire == 0) {
                retData.status = 2;
                callback (retData);
            }else {
                this.getDormDataFromDataSource (doc => {
                    if (doc == null) doc = {};
                    let dormLevelUpInfo = doc.dormLevelUpInfo;
                    if (dormLevelUpInfo == null) dormLevelUpInfo = [];
                    let hasAreadyRepaire = false;
                    for (let i in dormLevelUpInfo) {
                        if (dormLevelUpInfo[i].dormId == dormId) {
                            hasAreadyRepaire = true
                            break
                        }
                    }

                    if (hasAreadyRepaire) {
                        retData.status = 3;
                        callback (retData);
                    }else{
                        let costinfo = utils.getItemArraySplitTwice (doorData.RepaireCost, '|', ',');
                        let costData = categoryFromItemList (costinfo);
                        let player = new playerController (this.uuid_,this.multiController, this.taskController);
                        player.currencyMultiValid(costData.currency, currencyRet => {
                            if (currencyRet) {
                                player.itemValid(costData.items, itemRet => {
                                    if (itemRet) {
                                        let dormInfo = models.DormLevelUpInfo ();
                                        dormInfo.dormId = dormId;
                                        dormInfo.name = doorName;
                                        dormInfo.level = doorData.DoorLevel;
                                        dormInfo.comfort = this.getBaseComfort (doorData.DoorLevel);
                                        dormLevelUpInfo.push (dormInfo);
                                        retData.dormLeveUpInfo = dormInfo;
                                        doc.dormLevelUpInfo = dormLevelUpInfo;
                                        this.saveDormDataToDataSource (doc, () => {
                                            player.costCurrencyMulti (costData.currency, currency => {
                                                retData.currency = currency;
                                                player.costItem (costData.items, _=> {
                                                    retData.itemcost = costData.items;
                                                    retData.state = 0;
                                                    callback(retData);
                                                });
                                            });
                                        });
                                    } else {
                                        retData.status = 5;
                                        callback (retData);
                                    }
                                });
                            } else {
                                retData.status = 4;
                                callback (retData);
                            }
                        });
                    }
                });
            }
        });
    }

    // 住宅改名
    dormModifyName (dormId, doorName, callback)
    {
        let retData = {};
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dormLevelUpInfo = doc.dormLevelUpInfo;
            if (dormLevelUpInfo == null) dormLevelUpInfo = [];
            DormDoor.getDormDoorData (dormId, doorData => {
                let hasAreadyRepaire = false;
                let targetDoorData = null;
                for (let i in dormLevelUpInfo) {
                    if (dormLevelUpInfo[i].dormId == dormId) {
                        hasAreadyRepaire = true
                        targetDoorData = dormLevelUpInfo[i];
                        break
                    }
                }
                if (!hasAreadyRepaire && doorData.isNeedRepaire == 1) {
                    retData.status = 1;
                    callback (retData);
                }else{
                    if (hasAreadyRepaire) {
                        targetDoorData.name = doorName;
                    }else {
                        targetDoorData = models.DormLevelUpInfo ();
                        targetDoorData.dormId = dormId;
                        targetDoorData.name = doorName;
                        targetDoorData.level = doorData.DoorLevel;
                        targetDoorData.comfort = this.getBaseComfort (doorData.DoorLevel);
                        dormLevelUpInfo.push (targetDoorData);
                    }
                    doc.dormLevelUpInfo = dormLevelUpInfo;
                    this.saveDormDataToDataSource (doc, () => {
                        retData.status = 0;
                        retData.dormLevelInfo = targetDoorData;
                        callback (retData);
                    });
                }
            });
        });
    }

    // 住宅升级
    dormLevelUp (level, dormId, callback, taskData=null)
    {
        let retData = {};
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dormLevelUpInfo = doc.dormLevelUpInfo;
            if (dormLevelUpInfo == null) dormLevelUpInfo = [];
            DormDoor.getDormDoorData (dormId, doorData => {
                let hasAreadyRepaire = false;
                let targetDoorData = null;
                for (let i in dormLevelUpInfo) {
                    if (dormLevelUpInfo[i].dormId == dormId) {
                        hasAreadyRepaire = true
                        targetDoorData = dormLevelUpInfo[i];
                        break
                    }
                }

                if (!hasAreadyRepaire && doorData.isNeedRepaire == 1) {
                    retData.status = 1;
                    callback (retData);
                }else{
                    let nextLevel = 2;
                    if (hasAreadyRepaire) {
                        nextLevel = targetDoorData.level + 1;
                    }

                    if (nextLevel > DORM_DOOR_MAX_LEVEL) {
                        retData.status = 2;
                        callback (retData);
                    }else {
                        let coststring = doorData.LeveUp2Cost;
                        if (nextLevel == DORM_DOOR_MAX_LEVEL) {
                            coststring = doorData.LeveUp3Cost;
                        }

                        let costData = categoryFromItemList (utils.getItemArraySplitTwice (coststring, '|', ','));
                        let player = new playerController (this.uuid_,this.multiController, this.taskController);
                        player.currencyMultiValid(costData.currency, currencyRet => {
                            if (currencyRet) {
                                player.itemValid(costData.items, itemRet => {
                                    if (itemRet) {
                                        if (hasAreadyRepaire) {
                                            targetDoorData.level = nextLevel;
                                            targetDoorData.comfort += this.getLevelUpAddComfort (nextLevel);
                                        }else {
                                            targetDoorData = models.DormLevelUpInfo ();
                                            targetDoorData.dormId = dormId;
                                            targetDoorData.level = nextLevel;
                                            targetDoorData.comfort = this.getBaseComfort (nextLevel);
                                            dormLevelUpInfo.push (targetDoorData);
                                        }
                                        retData.dormLeveUpInfo = targetDoorData;
                                        doc.dormLevelUpInfo = dormLevelUpInfo;
                                        this.saveDormDataToDataSource (doc, () => {
                                            player.costCurrencyMulti (costData.currency, currency => {
                                                retData.currency = currency;
                                                player.costItem (costData.items, _=> {
                                                    retData.itemcost = costData.items;
                                                    retData.status = 0;
                                                    callback(retData);
                                                }, taskData);
                                            }, taskData);
                                        });
                                    } else {
                                        retData.status = 4;
                                        callback (retData);
                                    }
                                });
                            } else {
                                retData.status = 3;
                                callback (retData);
                            }
                        });
                    }
                }
            });
        });
    }

    // 更新广厦舒适度
    dormUpdateComfort (dormId, addComf, callback)
    {
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dormLevelUpInfo = doc.dormLevelUpInfo;
            if (dormLevelUpInfo == null) dormLevelUpInfo = [];
            DormDoor.getDormDoorData (dormId, doorData => {
                let hasFoundDormInfo = false;
                let targetDoorData = null;
                for (let i in dormLevelUpInfo) {
                    if (dormLevelUpInfo[i].dormId == dormId) {
                        hasFoundDormInfo = true
                        targetDoorData = dormLevelUpInfo[i];
                        break
                    }
                }
                if (hasFoundDormInfo) {
                    targetDoorData.comfort += addComf;
                }else {
                    targetDoorData = models.DormLevelUpInfo ();
                    targetDoorData.dormId = dormId;
                    targetDoorData.name = doorData.DoorName;
                    targetDoorData.level = doorData.DoorLevel;
                    targetDoorData.comfort = this.getBaseComfort (doorData.DoorLevel) + addComf;
                    dormLevelUpInfo.push (targetDoorData);
                }
                doc.dormLevelUpInfo = dormLevelUpInfo;
                this.saveDormDataToDataSource (doc, () => {
                    callback (targetDoorData)
                });
            });
        });
    }

    dormKickout (heroId, callback)
    {
        let retData = {}
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dorminfos = doc.dorminfos;
            if (dorminfos == null) dorminfos = [];
            for (var i = dorminfos.length - 1; i >= 0; i-- ){
                if (dorminfos[i].heroId == heroId) {
                    dorminfos.splice (i, 1);
                }
            }
            this.saveDormDataToDataSource (doc, () => {
                callback(dorminfos);
            });
        });
    }

    // 入住
    setCheckinInfo (heroId, dormId, callback)
    {
        let retData = {}
        Heros.getHeroGender (heroId, gender => {
            this.getDormDataFromDataSource (doc => {
                if (doc == null) doc = {};
                let dorminfos = doc.dorminfos;
                let dormLevelUpInfo = doc.dormLevelUpInfo;
                if (dorminfos == null) dorminfos = [];
                if (dormLevelUpInfo == null) dormLevelUpInfo = [];

                DormDoor.getDormDoorData (dormId, doorData => {
                    let hasAreadyRepaire = false;
                    let maxRoomHeroLimited = DORM_NORMAL_MAX_HERO;
                    for (let i in dormLevelUpInfo) {
                        if (dormLevelUpInfo[i].dormId == dormId) {
                            hasAreadyRepaire = true
                            maxRoomHeroLimited += (dormLevelUpInfo[i].level - 1);
                            break
                        }
                    }
                    if (!hasAreadyRepaire && doorData.isNeedRepaire == 1) {
                        retData.status = 1;
                        callback (retData);
                    }else{
                        let targetHeroDormInfo = null;
                        let sameDormHeroCount = 0;
                        let isAllSameGender = true;
                        for (let i in dorminfos) {
                            if (dorminfos[i].dormId == dormId) {
                                sameDormHeroCount += 1;
                                if (dorminfos[i].gender != gender) {
                                    isAllSameGender = false
                                }
                            }
                            if (dorminfos[i].heroId == heroId) {
                                targetHeroDormInfo = dorminfos[i];
                            }
                        }
                        if (targetHeroDormInfo != null && targetHeroDormInfo.dormId == dormId){
                            retData.status = 2;
                            callback (retData);
                        }else{
                            if (!isAllSameGender) {
                                retData.status = 3;
                                callback (retData);
                            }else {
                                if (sameDormHeroCount >= maxRoomHeroLimited) {
                                    retData.status = 4;
                                    callback (retData);
                                }else {

                                    if (targetHeroDormInfo == null) {
                                        targetHeroDormInfo = models.HeroDormData (heroId, dormId, gender);
                                        dorminfos.push (targetHeroDormInfo);
                                    }else {
                                        targetHeroDormInfo.dormId = dormId;
                                        targetHeroDormInfo.time = (new Date()).getTime();
                                    }

                                    doc.dorminfos = dorminfos;
                                    this.saveDormDataToDataSource (doc, () => {
                                        retData.status = 0;
                                        retData.dorminfo = targetHeroDormInfo;
                                        callback(retData);
                                    });
                                }
                            }
                        }
                    }
                });
            });
        });
    }

    // 安排墨魂休息
    setDormHeroRest (heroId, dormId, buildingId, tag, index, restData, callback)
    {
        let retData = {}
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dormRestInfo = doc.dormRestInfo;
            if (dormRestInfo == null) dormRestInfo = [];

            let findMohun = false;
            var curTime = (new Date()).getTime();
            for (let i in dormRestInfo) {
                if (dormRestInfo[i].heroId == heroId) {
                    findMohun = true;
                    break;
                }
            }
            if (findMohun) {
                retData.status = 1;
                callback (retData);
            }else {
                retData.status = 0;
                let restInfo = models.DormRestInfoData (heroId, dormId, buildingId, tag, restData);
                restInfo.index = index;
                retData.restInfo = restInfo
                dormRestInfo.push (restInfo);
                doc.dormRestInfo = dormRestInfo;
                this.saveDormDataToDataSource (doc, () => {
                    var notif = new Notification(this.uuid);
                    notif.load(() => {
                        notif.updateHeroWakeUp(heroId, restInfo.sleepTime, restData.duration * 1000);
                        notif.save(() => {
                            callback(retData);
                        });
                    });
                });
            }
        });
    }

    // 获取指定住宅信息
    searchTargetDormLevelUpInfo (dormLevelUpInfo, dormId)
    {
        if (dormLevelUpInfo != null) {
            for (let i in dormLevelUpInfo) {
                if (dormLevelUpInfo[i].dormId == dormId) {
                    if (dormLevelUpInfo[i].comfort == null) {
                        dormLevelUpInfo[i].comfort = DORM_DOOR_LEVEL1_COMFORT;
                    }
                    return dormLevelUpInfo[i];
                }
            }
        }

        var levelUpInfo = {};
        levelUpInfo.comfort = DORM_DOOR_LEVEL1_COMFORT;
        return levelUpInfo;
    }

    // 手动叫醒墨魂
    setDormHeroWakeUp (heroId, dormId, addEnergy, comfortLevel, callback)
    {
        let retData = {}
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            let dormRestInfo = doc.dormRestInfo;
            if (dormRestInfo == null) dormRestInfo = [];
            let findMohun = false;
            var curTime = (new Date()).getTime();
            for (let i in dormRestInfo) {
                if (dormRestInfo[i].heroId == heroId) {
                    let restTime = (curTime - dormRestInfo[i].sleepTime) / 1000;
                    if (restTime >= dormRestInfo[i].restData.duration) {
                        restTime = dormRestInfo[i].restData.duration;
                    }
                    retData.restTime = restTime;
                    findMohun = true;
                    dormRestInfo.splice (i, 1);
                    break;
                }
            }

            if (findMohun) {
                retData.status = 0;
                this.saveDormDataToDataSource (doc, () => {
                    callback(retData);
                });
            }else {
                retData.status = 1;
                callback(retData);
            }
        });
    }

    // -- 获取睡眠时间达到的墨魂数据
    getTargetHeroAttrInfo (v, id)
    {
        for (let i in v) {
            if (v[i].heroId == id) {
                return v[i]
            }
        }
        return null
    }

    updateHeroDataByCheckLimitedData (heroDatas, heroId, addAttr)
    {
        for (let i in heroDatas) {
            if (heroDatas[i].heroId == heroId) {
                heroDatas[i].addEnergy = addAttr;
                break;
            }
        }
    }

    checkBatchAttrEnergy (heroDatas, checkHeroList, callback)
    {
        if (checkHeroList.length <= 0) {
            callback (true);
        }else {
            let heroData = checkHeroList[0];
            let heroId = heroData.heroId;
            let hero = new heroController(this.uuid_, heroId,this.multiController, this.taskController);
            hero.addAttrEnergyCheckLimitedByHID (heroId, heroData.addEnergy, addAttrData => {
                this.updateHeroDataByCheckLimitedData (heroDatas, heroId, addAttrData.realAdd);
                checkHeroList.splice (0, 1);
                this.checkBatchAttrEnergy (heroDatas, checkHeroList, callback);
            });
        }
    }

    addBatchAttrEnergy (uuid, wakeUpHeroes, callback)
    {
        let hero = new heroController(uuid, 0,this.multiController, this.taskController);
        hero.getHeroDataFromDataSource (doc => {
            let updatedAttrs = [];
            let updateStats = [];
            if (doc && doc.mhdatas) {
                let shouldUpdateAttrs = false;
                let checkList = [].concat (wakeUpHeroes);
                this.checkBatchAttrEnergy (wakeUpHeroes, checkList, status => {
                    for (let i in doc.mhdatas) {
                        let addAttrsData = this.getTargetHeroAttrInfo (wakeUpHeroes, doc.mhdatas[i].hid);
                        if (addAttrsData != null) {
                            shouldUpdateAttrs = true;
                            doc.mhdatas[i].attrs.energy += addAttrsData.addEnergy;
                            if (doc.mhdatas[i].attrs.energy < 0) doc.mhdatas[i].attrs.energy = 0;
                            updatedAttrs.push ({ hid: doc.mhdatas[i].hid, attrs: doc.mhdatas[i].attrs});
                            doc.mhdatas[i].workStat = heroController.WORKSTATS().IDLE;
                            updateStats.push ({ hid: doc.mhdatas[i].hid, workStat: doc.mhdatas[i].workStat});
                        }
                    }
                    if (shouldUpdateAttrs){
                        hero.saveHeroDataToDataSource (doc, () =>{
                            callback(updatedAttrs, updateStats);
                        });
                    }else{
                        callback(updatedAttrs, updateStats);
                    }
                });
            }else {
                callback(updatedAttrs, updateStats);
            }
        });
    }

    addHeroDormInfo(uuid, heroId, callback)
    {
        var newDorm = { heroId: heroId, dormId: 1, time: (new Date()).getTime(), gender: 0 };
        this.getDormDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.dorminfos == null) doc.dorminfos = [];
            var isFind = false;
            for (let i in doc.dorminfos) {
                if (doc.dorminfos[i].heroId === heroId) {
                    doc.dorminfos[i] = newDorm;
                    isFind = true;
                    break;
                }
            }

            if (!isFind) {
                doc.dorminfos.push(newDorm);
            }
            this.saveDormDataToDataSource (doc, () => {
                 callback(newDorm);
            });
        });
    }
}

module.exports = dormController;
