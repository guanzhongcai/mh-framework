const models = require('./../models');
const fixedController = require('./fixedController');
const Skills = require('./../../designdata/Skills');
const taskController = require('./taskController');
const checkinController = require('./checkinController');
const HeroLevelUpTermAndBonus = require('./fixedController').HeroLevelUpTermAndBonus;
const HeroClassUp = require('./../../designdata/HeroClassUp');
const HeroConfig = require('./../../designdata/HeroConfig');
const utils = require('./../../common/utils');
const CONSTANTS = require('./../../common/constants');

var assert = require ('assert');

/*          属性说明
exp         亲密度
emotion     情感
jiaoy       交游
feel        魂力
energy      体力
cleany      清洁
hungry      饱食
lingg       灵感
*/

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;


// function doHeroAttrEnergyTask(uuid, heroAttrLis, callback, taskData=null)
// {
//     if ('number' == typeof uuid && Array.isArray(heroAttrLis) && heroAttrLis.length > 0) {
//         var paramLis = [];
//         for (let i in heroAttrLis) {
//             if ('number' == typeof heroAttrLis[i].hid && heroAttrLis[i].attrs && 'number' == typeof heroAttrLis[i].attrs.energy) {
//                 paramLis.push({
//                     params: [heroAttrLis[i].hid],
//                     num: heroAttrLis[i].attrs.energy
//                 });
//             }
//         }
//
//         if (paramLis.length > 0) {
//             var save = taskData ? false : true;
//             taskController.getSourceTaskData(uuid, taskData, TaskData => {
//                 taskController.addTaskCounterGroup(TaskData, uuid, 741, paramLis, () => {
//                     taskController.setSourceTaskData(uuid, TaskData, () => {
//                         if (save) {
//                             taskController.getCounterDataByTypeGroup(uuid, [741], taskEventData => {
//                                 callback(taskEventData);
//                             });
//                         } else {
//                             callback(null);
//                         }
//                     }, save);
//                 }, false);
//             });
//         } else {
//             callback(null);
//         }
//     } else {
//         callback(null);
//     }
// }


class heroController
{
    static STATS()
    {
        return {
            VAGRANTNESS: 1,     // 未分配住宅
            HOUSEHOLD: 2        // 已分配住宅
        }
    }

    static WORKSTATS()
    {
        return {
            IDLE: 1,            // 空闲
            WORKING: 2,         // 工作
            HOTSPRING: 3,        // 泡温泉
            TIED: 4,            // 疲劳
            REST: 5             // 休息
        }
    }

    static CHECKSTATS()
    {
        return {
            VALID: 1,           // 有效状态
            LOSS: 2,            // 未获得
            VAGRANTNESS : 3,    // 未分配住宅
            NOTIDLE: 4,         // 非空闲状态
        }
    }

    constructor(uuid, heroId, multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.heroId_ = heroId ? parseInt(heroId) : 0;
        this.tblname_ = 'HeroData';
        this.tblname_sendgift = "SendGiftData";
        this.heroData = null;
        this.m_RedisHeroDataString = null;
        this.sendGiftData = null;
        this.m_RedisSendGiftDataString = null;
        this.multiController = multiController;
        this.taskController = taskController;

    }

    errorHandle(){
        this.heroData = null;
        this.sendGiftData = null;
        this.m_RedisHeroDataString = null
        this.m_RedisSendGiftDataString = null;
    }

    checkHeroIdValid(callback)
    {
        callback(HeroConfig.checkHeroId(this.heroId_));
    }

    getHeroDataFromDataSource (callback) {
        if (this.heroData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sHeroData => {
                this.m_RedisHeroDataString = sHeroData;
                let doc = sHeroData && validator.isJSON(sHeroData)? JSON.parse(sHeroData) : null;
                this.heroData = doc;
                callback (doc);
            });
        }else {
            callback (this.heroData);
        }
    }

    saveHeroDataToDataSource (heroData, callback) {
        if (heroData != null) {
            let saveString = JSON.stringify(heroData);
            let shouldSave = true;
            if (this.m_RedisHeroDataString == null || this.m_RedisHeroDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.heroData = heroData;
                this.m_RedisHeroDataString = saveString;
                this.multiController.uniqPush(1,this.tblname_+":"+ this.uuid_, saveString)
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    getSendGiftDataFromDataSource (callback) {
        if (this.sendGiftData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_sendgift, this.uuid_, sSendGiftData => {
                this.m_RedisSendGiftDataString = sSendGiftData;
                let doc = sSendGiftData && validator.isJSON(sSendGiftData)? JSON.parse(sSendGiftData) : [];
                this.sendGiftData = doc;
                callback (doc);
            });
        }else {
            callback (this.sendGiftData);
        }
    }

    saveSendGiftDataToDataSource (sendData, callback) {
        if (sendData != null) {
            let saveString = JSON.stringify(sendData);
            let shouldSave = true;
            if (this.m_RedisSendGiftDataString == null || this.m_RedisSendGiftDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.sendGiftData = sendData;
                this.m_RedisSendGiftDataString = saveString;
                this.multiController.uniqPush(1, this.tblname_sendgift+":"+ this.uuid_, saveString)
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    getHeroId()
    {
        return this.heroId_;
    }

    // 墨魂灵感委托状态
    setLinggDepositStat(v, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc) {
                for (let i in doc.mhdatas) {
                    if (doc.mhdatas[i].hid === this.heroId_) {
                        doc.mhdatas[i].linggDepositStat = v;
                        break;
                    }
                }
                this.saveHeroDataToDataSource (doc, () =>{
                    callback(v);
                });
            }else {
                callback (0);
            }
        });
    }

    // 墨魂魂力委托状态
    setSoulDepositStat(v, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc) {
                for (let i in doc.mhdatas) {
                    if (doc.mhdatas[i].hid === this.heroId_) {
                        doc.mhdatas[i].soulDepositStat = v;
                        break;
                    }
                }
                this.saveHeroDataToDataSource (doc, () =>{
                    callback(v);
                });
            }else {
                callback (0);
            }
        });
    }

    // 墨魂增加档案
    addHeroFileList(fileId, callback)
    {
        this.getHeroDataFromDataSource(doc => {
            if (doc) {
                var fileLis = [];
                for (let i in doc.mhdatas) {
                    if (doc.mhdatas[i].hid === this.heroId_) {
                        if (Array.isArray(doc.mhdatas[i].fileList)) {
                            var isNew = true;
                            for (let j in doc.mhdatas[i].fileList) {
                                if (doc.mhdatas[i].fileList[j] == fileId) {
                                    isNew = false;
                                    break;
                                }
                            }
                            if (isNew) {
                                doc.mhdatas[i].fileList.push(fileId);
                            }
                        } else {
                            doc.mhdatas[i].fileList = [fileId];
                        }

                        fileLis = doc.mhdatas[i].fileList;
                        break;
                    }
                }
                
                //
                //TODO 106,// 解锁N个墨魂档案	106	106-X-N
                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockHeroArchives,[{params:[this.heroId_]}]);
                
                this.saveHeroDataToDataSource (doc, () =>{
                    callback(fileLis);
                });
            } else {
                callback([]);
            }
        });
    }

    //获取指定墨魂的信息
    getHeroDataUsingHeroId (heroId, callback)
    {
        this.getHeroDataFromDataSource (res => {
            let mhdata = null;
            if (res != null && res.mhdatas != null) {
                for (let index in res.mhdatas) {
                    if (heroId == res.mhdatas[index].hid) {
                        mhdata = res.mhdatas[index]
                        break
                    }
                }
            }
            callback (res, mhdata)
        });
    }

    isHouseHold(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(heroData == null || mhdata == null || mhdata.stat == null || mhdata.stat ===heroController.STATS().HOUSEHOLD);
        });
    }

    isIdle(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(heroData == null || mhdata == null || mhdata.workStat == null || mhdata.workStat === heroController.WORKSTATS().IDLE);
        });
    }

    // 状态
    setStat(stat, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData == null || mhdata == null) {
                callback (false);
            }else {
                mhdata.stat = stat;
                this.multiController.push(1,this.tblname_+":"+ this.uuid_, JSON.stringify(heroData))
                callback(true);
            }
        });
    }

    getStat (heroId, callback)
    {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            if (heroData == null || mhdata == null || mhdata.stat == null) {
                callback (heroController.STATS().VAGRANTNESS);
            }else {
                callback (mhdata.stat);
            }
        });
    }

    setWorkStat(wstat, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData == null || mhdata == null) {
                callback (false);
            }else {
                mhdata.workStat = wstat;
                this.multiController.push(1,this.tblname_+":"+ this.uuid_, JSON.stringify(heroData))
                callback(true);
            }
        });
    }

    getWorkStat (heroId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData == null || mhdata == null || mhdata.workStat == null) {
                callback (heroController.WORKSTATS().IDLE);
            }else {
                callback (mhdata.workStat);
            }
        });
    }

    async checkHaveHeroesCnt () {
        return new Promise( resolve => {
            this.getHeroDataFromDataSource (res => {
                let haveCnt = 0
                if (res != null && res.mhdatas != null) {
                    haveCnt = res.mhdatas.length;
                }
                resolve (haveCnt);
            });
        });
    }

    async checkHaveTargetHeroes (heroIds) {
        return new Promise( resolve => {
            this.getHeroDataFromDataSource (res => {
                let contains = true;
                if (res != null && res.mhdatas != null && heroIds != null) {
                    if (heroIds.length > 0) {
                        let haveCount = 0
                        for (let hid of heroIds) {
                            for (let index in res.mhdatas) {
                                if (hid === res.mhdatas[index].hid) {
                                    haveCount += 1;
                                    break;
                                }
                            }
                        }
                        contains = heroIds.length == haveCount;
                    }
                }
                resolve (contains);
            });
        });
    }

    setWorkStatBatch (wstats, callback)
    {
        let updateStats = [];
        this.getHeroDataFromDataSource (doc => {
            if (doc && doc.mhdatas) {
                for (let i = 0; i < doc.mhdatas.length; i++){
                    let workStat = wstats[doc.mhdatas[i].hid];
                    if (workStat != null) {
                        doc.mhdatas[i].workStat = workStat;
                        updateStats.push ({ hid:doc.mhdatas[i].hid, workStat: workStat})
                    }
                }
                this.saveHeroDataToDataSource (doc, () => {
                    callback(updateStats);
                });
            } else {
                callback(updateStats);
            }
        });
    }

    // 配置墨魂前的状态判断 需要返回给客户单对应的状态信息
    checkStatValid(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData == null || mhdata == null)
                callback (heroController.CHECKSTATS ().LOSS, null);
            else {
                if (mhdata.stat == null ||mhdata.stat != heroController.STATS ().HOUSEHOLD)
                    callback (heroController.CHECKSTATS ().VAGRANTNESS, mhdata.stat);
                else{
                    if (mhdata.workStat == null || mhdata.workStat == heroController.WORKSTATS().IDLE) {
                        callback (heroController.CHECKSTATS ().VALID, null);
                    }else {
                        callback (heroController.CHECKSTATS ().NOTIDLE, mhdata.workStat);
                    }
                }
            }
        });
    }

    heroCheckList(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            var checkList = {};
            if (doc == null || doc.mhdatas == null) {
                callback(checkList);
            }else {
                for (let i = 0; i < doc.mhdatas.length; i++)
                    checkList[doc.mhdatas[i].hid] = true;
                callback(checkList);
            }
        });
    }

    getHeroMap(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            var heroMap = new Map();
            if (doc == null || doc.mhdatas == null) {
                callback(heroMap);
            }else {
                for (let k in doc.mhdatas)
                    heroMap.set(doc.mhdatas[k].hid, doc.mhdatas[k]);
                callback(heroMap);
            }
        });
    }

    setHeroMap(heroMap, callback)
    {
        var heroList = [];
        for (let [heroId, heroData] of heroMap)
            heroList.push(heroData);

        this.getHeroDataFromDataSource (doc => {
            if (doc) {
                doc.mhdatas = heroList;
                this.saveHeroDataToDataSource (doc, () =>{
                    callback();
                });
            }else {
                callback ();
            }
        });
    }

    getLevel(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata && mhdata.attrs.level ? mhdata.attrs.level : 1);
        });
    }
    
    async getHeroLevel()
    {
        return new Promise(function (resolve,reject) {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                resolve(mhdata && mhdata.attrs.level ? mhdata.attrs.level : 1);
                
            });
            
        });
    }
    
    setSkinDefault(skinId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData != null && mhdata != null) {
                mhdata.skinDefault = skinId;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback (true);
                });
            }else{
                callback (false);
            }
        });
    }

    addSkin(skinId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                var isFind = false;
                if (!mhdata.skins) mhdata.skins = [];
                for (let i in mhdata.skins) {
                    if (mhdata.skins[i].id === skinId) {
                        isFind = true;
                        break;
                    }
                }
    
                
                if (!isFind) {
                    let newSkinData = { id: skinId, new: 1, st: (new Date()).getTime() };
                    mhdata.skins.push(newSkinData);
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        if(this.taskController){
                            //TODO 104-X-N  X为墨魂ID，任意墨魂配置为0
                            this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockHeroSkin,[{params:[this.heroId_]}]);
                        }
                        callback(newSkinData, mhdata.skins);
                    });
                } else {
                    callback(null, null);
                }
            } else {
                callback(null, null);
            }
        });
    }

    getSkinHeroMap(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            var skinHeroMap = new Map();
            if (doc && doc.mhdatas) {
                for (let i in doc.mhdatas) {
                    skinHeroMap.set(doc.mhdatas[i].hid, doc.mhdatas[i].skins);
                }
            }

            callback(skinHeroMap);
        });
    }

    setUpSkinHeroGroup(skinHeroGroup, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc && doc.mhdatas) {
                if (skinHeroGroup.length > 0) {
                    for (let skn of skinHeroGroup) {
                        for (let i in doc.mhdatas) {
                            if (doc.mhdatas[i].hid === skn.hid) {
                                doc.mhdatas[i].skins = skn.skins;
                                break;
                            }
                        }
                    }
                }

                this.saveHeroDataToDataSource (doc, () =>{
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    checkSkinValid(skinId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            var isFind = false;
            if (heroData && mhdata) {
                if (!mhdata.skins) mhdata.skins = [];
                for (let i in mhdata.skins) {
                    if (mhdata.skins[i].id === skinId) {
                        isFind = true;
                        break;
                    }
                }
                callback(isFind);
            } else {
                callback(isFind);
            }
        });
    }

    unlockPursueTreeLevel (level, callback) {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                mhdata.pursueShowLevel = level;
            }
            this.saveHeroDataToDataSource (heroData, ()=> {
                callback(true);
            });
        });
    }

    // 判断是否可以设置为助手
    getAssistantStat (heroId, callback)
    {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            if (heroData == null || mhdata == null || mhdata.assistant == null) {
                callback (false);
            }else {
                callback (mhdata.assistant);
            }
        });
    }

    // 更新是否可以设置为助手状态
    setAssistantStat (heroId, astats, callback)
    {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            if (heroData != null && mhdata != null) {
                mhdata.assistant = astats;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(true);
                });
            }else {
                callback(false);
            }
        });
    }

    checkHero(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata != null);
        });
    }

    checkHeroById(heroId, callback)
    {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            callback(mhdata != null);
        });
    }

    addHeroGroup(group, callback, taskData=null)
    {
        function getHeroGroup(grp) {
            var lis = [];
            for (let i in grp) {
                lis.push(grp[i].hid);
            }

            return lis;
        }

        var newHeroLis = group,
            heroGroup = getHeroGroup(group);

        // 获取墨魂对应技能列表
        fixedController.Heros.getObjSkillDefaultByGroupConfig(heroGroup, ObjHeroSkillDefault => { // { 'hero id': skillList }
            HeroClassUp.getUnlockSkillListByGroupConfig(heroGroup, UnlockSkillList => { // [{HeroID, Level, UnlockSkill}]
                fixedController.Heros.getObjHeroSexByGroup(heroGroup, ObjHeroSexConfig => {
                    // ===================================
                    for (let i in newHeroLis) {
                        var skillList = ObjHeroSkillDefault[newHeroLis[i].hid];
                        for (let unlockSkillNode of UnlockSkillList) {
                            if (newHeroLis[i].hid === unlockSkillNode.HeroID && newHeroLis[i].attrs.level === unlockSkillNode.Level) {
                                for (let i in skillList) {
                                    if (unlockSkillNode.UnlockSkill[skillList[i]]) {
                                        // 可以解锁
                                        skillList[i] += 1;
                                    }
                                    if (unlockSkillNode.StrengthenSkills[skillList[i]]) {
                                        // 可以进行强化
                                        skillList[i] += 1;
                                    }
                                }
                            }
                        }
                        newHeroLis[i].skillList = skillList;
                    }
                    // ===================================
                    this.getHeroDataFromDataSource (doc => {
                        if (doc == null) doc = {};
                        if (doc.mhdatas == null) doc.mhdatas = [];

                        var newMHDataLis = (doc && doc.mhdatas) ? doc.mhdatas : [];
                        var param101Group = [],
                            param102Group = [],
                            param103Group = [];

                        for (let i = 0; i < newHeroLis.length; i++) {
                            newMHDataLis.push(newHeroLis[i]);

                            param101Group.push({
                                params:[newHeroLis[i].hid],
                                num: 1
                            });

                            param102Group.push({
                                params: [newHeroLis[i].hid, newHeroLis[i].attrs.level],
                                num: 1
                            });

                            param103Group.push({
                                params: [newHeroLis[i].hid, ObjHeroSexConfig[newHeroLis[i].hid]],
                                num: 1
                            })
                        }
                        doc.mhdatas = newMHDataLis;

                        this.saveHeroDataToDataSource (doc, () => {
                            if(this.taskController){

                                if(param101Group.length){
    
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetHero, param101Group);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality, param102Group);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex, param103Group);
                                    // 今日获得墨魂列表（签到用）
                                    checkinController.addTodayHeroList(this.uuid_, heroGroup, this.multiController,() => {
                                        callback(newHeroLis);
                                    });
                                }else {
                                    checkinController.addTodayHeroList(this.uuid_, heroGroup, this.multiController,() => {
                                        callback(newHeroLis);
                                    });
                                }
                            }
                            else{
                                var tskSave = taskData ? false : true;
                                taskController.getSourceTaskData(this.uuid_, taskData, TaskData => {
                                    taskController.addTaskCounterGroup(TaskData, this.uuid_, 101, param101Group, () => {
                                        taskController.addTaskCounterGroup(TaskData, this.uuid_, 102, param102Group, () => {
                                            taskController.addTaskCounterGroup(TaskData, this.uuid_, 103, param103Group, () => {
                                                taskController.setSourceTaskData(this.uuid_, TaskData, () => {
                                                    // 今日获得墨魂列表（签到用）
                                                    checkinController.addTodayHeroList(this.uuid_, heroGroup, this.multiController,() => {
                                                        callback(newHeroLis);
                                                    });
                                                }, tskSave);
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    }
    
    
    async doHeroAttrEnergyTask(uuid, heroAttrLis)
{
    
    if ('number' == typeof uuid && Array.isArray(heroAttrLis) && heroAttrLis.length > 0) {
        var paramLis = [];
        for (let i in heroAttrLis) {
            if ('number' == typeof heroAttrLis[i].hid && heroAttrLis[i].attrs && 'number' == typeof heroAttrLis[i].attrs.energy) {
                paramLis.push({
                    params: [heroAttrLis[i].hid],
                    num: heroAttrLis[i].attrs.energy
                });
            }
        }
        
        if (paramLis.length > 0) {
            if(this.taskController){
                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroEnergy, paramLis);
            }
        }
    }
    //
    // if ('number' == typeof uuid && Array.isArray(heroAttrLis) && heroAttrLis.length > 0) {
    //     var paramLis = [];
    //     for (let i in heroAttrLis) {
    //         if ('number' == typeof heroAttrLis[i].hid && heroAttrLis[i].attrs && 'number' == typeof heroAttrLis[i].attrs.energy) {
    //             paramLis.push({
    //                 params: [heroAttrLis[i].hid],
    //                 num: heroAttrLis[i].attrs.energy
    //             });
    //         }
    //     }
    //
    //     if (paramLis.length > 0) {
    //         var save = taskData ? false : true;
    //         taskController.getSourceTaskData(uuid, taskData, TaskData => {
    //             taskController.addTaskCounterGroup(TaskData, uuid, 741, paramLis, () => {
    //                 taskController.setSourceTaskData(uuid, TaskData, () => {
    //                     if (save) {
    //                         taskController.getCounterDataByTypeGroup(uuid, [741], taskEventData => {
    //                             callback(taskEventData);
    //                         });
    //                     } else {
    //                         callback(null);
    //                     }
    //                 }, save);
    //             }, false);
    //         });
    //     } else {
    //         callback(null);
    //     }
    // } else {
    //     callback(null);
    // }
}
    
    
    createHeroByHeroId(heroId, callback)
    {
        if (heroId <= 0) {
            callback(null);
        } else {
            this.checkHeroById(heroId, heroValid => {
                if (heroValid) {
                    // 或变成技能点（暂空）
                    callback(null);
                } else {
                    let heroModel = models.HeroModel(heroId);
                    heroModel.hid = heroId;
                    // 获取墨魂初始配置表信息
                    fixedController.HeroLevelUpTermAndBonus.getHeroAttrValsDefaultConfig(heroId, 1, HeroAttrDefault => {
                        fixedController.Heros.getObjHeroSexByGroup([this.heroId_], ObjHeroSexConfig => {
                            heroModel.attrs.feel        = HeroAttrDefault.feel;
                            heroModel.attrs.exp         = HeroAttrDefault.exp;
                            heroModel.attrs.lingg       = HeroAttrDefault.lingg;
                            heroModel.attrs.skillpoint  = HeroAttrDefault.skillpoint;
                            heroModel.attrs.energy      = HeroAttrDefault.energy;
                            heroModel.attrs.emotion     = HeroAttrDefault.emotion;

                            // 默认技能列表
                            fixedController.Heros.getSkillListDefaultConfig(heroModel.hid, SkillListDefault => {
                                heroModel.skillList = SkillListDefault;
                                HeroClassUp.getObjUnlockSkillConfig(heroModel.hid, heroModel.attrs.level, ObjUnlockSkillConfig => {
                                    let unlockSkill = ObjUnlockSkillConfig.unlockSKill;
                                    let strengthSkill = ObjUnlockSkillConfig.strengthSkill;
                                    for (let i in heroModel.skillList) {
                                        if (unlockSkill != null && unlockSkill[heroModel.skillList[i]]) {
                                            heroModel.skillList[i] += 1;
                                        }
                                        if (strengthSkill != null && strengthSkill[heroModel.skillList[i]]) {
                                            heroModel.skillList[i] += 1;
                                        }
                                    }

                                    this.getHeroDataFromDataSource (doc => {
                                        if (doc == null) doc = {};
                                        if (doc.mhdatas == null) doc.mhdatas = [];
                                        doc.mhdatas.push (heroModel);

                                        this.saveHeroDataToDataSource (doc, ()=> {
    
    
                                            if(this.taskController){
                                          
                                                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetHero,[{params : [heroModel.hid]}]);
                                                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params : [heroModel.hid, heroModel.attrs.level]}]);
                                                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex,[{params : [heroModel.hid, ObjHeroSexConfig[heroModel.hid]]}]);
                                                // 今日获得墨魂列表（签到用）
                                                checkinController.addTodayHeroList(this.uuid_, heroGroup, this.multiController,() => {
                                                    callback(newHeroLis);
                                                });
                                            }
                                            else{
                                                // 任务-获得墨魂个数
                                                taskController.getTaskDataFromSource(this.uuid_, TaskData => {
                                                    taskController.addTaskCounter(TaskData, this.uuid_, 101, [heroModel.hid], () => {
                                                        taskController.addTaskCounter(TaskData, this.uuid_, 102, [heroModel.hid, heroModel.attrs.level], () => {
                                                            taskController.addTaskCounter(TaskData, this.uuid_, 103, [heroModel.hid, ObjHeroSexConfig[heroModel.hid]], () => {
                                                                taskController.saveTaskDataFromSource(this.uuid, TaskData, () => {
                                                                    // 今日获得墨魂列表（签到用）
                                                                    checkinController.addTodayHeroList(this.uuid_, [heroModel.hid], this.multiController,() => {
                                                                        callback(heroModel);
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            });
        }
    }

    createHero(callback)
    {
        let heroModel = models.HeroModel(this.heroId_);
        heroModel.hid = this.heroId_;
        // 获取墨魂初始配置表信息
        fixedController.HeroLevelUpTermAndBonus.getHeroAttrValsDefaultConfig(this.heroId_, 1, HeroAttrDefault => {
            fixedController.Heros.getObjHeroSexByGroup([this.heroId_], ObjHeroSexConfig => {
                heroModel.attrs.feel        = HeroAttrDefault.feel;
                heroModel.attrs.exp         = HeroAttrDefault.exp;
                heroModel.attrs.lingg       = HeroAttrDefault.lingg;
                heroModel.attrs.skillpoint  = HeroAttrDefault.skillpoint;
                heroModel.attrs.energy      = HeroAttrDefault.energy;
                heroModel.attrs.emotion     = HeroAttrDefault.emotion;

                fixedController.Heros.getSkillListDefaultConfig(heroModel.hid, SkillListDefault => {
                    heroModel.skillList = SkillListDefault;
                    HeroClassUp.getObjUnlockSkillConfig(heroModel.hid, heroModel.attrs.level, ObjUnlockSkillConfig => {
                        let unlockSkill = ObjUnlockSkillConfig.unlockSKill;
                        let strengthSkill = ObjUnlockSkillConfig.strengthSkill;
                        for (let i in heroModel.skillList) {
                            if (unlockSkill != null && unlockSkill[heroModel.skillList[i]]) {
                                heroModel.skillList[i] += 1;
                            }
                            if (strengthSkill != null && strengthSkill[heroModel.skillList[i]]) {
                                heroModel.skillList[i] += 1;
                            }
                        }

                        this.getHeroDataFromDataSource (doc => {
                            if (doc == null) doc = {};
                            if (doc.mhdatas == null) doc.mhdatas = [];
                            doc.mhdatas.push (heroModel);
                            this.saveHeroDataToDataSource (doc, async ()=> {
                                // 任务-获得墨魂
                                
                                if(this.taskController){
    
                               
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetHero,[{params:[heroModel.hid]}]);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params:[heroModel.hid, heroModel.attrs.level]}]);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex,[{params:[heroModel.hid, ObjHeroSexConfig[heroModel.hid]]}]);
                                    checkinController.addTodayHeroList(this.uuid_, [heroModel.hid], this.multiController,() => {
                                        callback(heroModel);
                                    });
                                }else {
                                    taskController.getTaskDataFromSource(this.uuid_, TaskData => {
                                        taskController.addTaskCounter(TaskData, this.uuid_, 101, [heroModel.hid], () => {
                                            taskController.addTaskCounter(TaskData, this.uuid_, 102, [heroModel.hid, heroModel.attrs.level], () => {
                                                taskController.addTaskCounter(TaskData, this.uuid_, 103, [heroModel.hid, ObjHeroSexConfig[heroModel.hid]], () => {
                                                    taskController.saveTaskDataFromSource(this.uuid_, TaskData, () => {
                                                        // 今日获得墨魂列表（签到用）
                                                        checkinController.addTodayHeroList(this.uuid_, [heroModel.hid], this.multiController,() => {
                                                            callback(heroModel);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    }

    createHeroWithBonusAttrs (bonusattrs, callback)
    {
        let heroModel = models.HeroModel(this.heroId_);
        heroModel.hid = this.heroId_;
        // 获取墨魂初始配置表信息
        fixedController.HeroLevelUpTermAndBonus.getHeroAttrValsDefaultConfig(this.heroId_, 1, HeroAttrDefault => {
            fixedController.Heros.getObjHeroSexByGroup([this.heroId_], ObjHeroSexConfig => {
                heroModel.attrs.feel        = HeroAttrDefault.feel;
                heroModel.attrs.exp         = HeroAttrDefault.exp;
                heroModel.attrs.lingg       = HeroAttrDefault.lingg;
                heroModel.attrs.skillpoint  = HeroAttrDefault.skillpoint;
                heroModel.attrs.energy      = HeroAttrDefault.energy;
                heroModel.attrs.emotion     = HeroAttrDefault.emotion;

                if (bonusattrs != null) {
                    if (bonusattrs.exp != null) heroModel.attrs.exp += bonusattrs.exp;
                    if (bonusattrs.emotion != null) heroModel.attrs.emotion += bonusattrs.emotion;
                    if (bonusattrs.jiaoy != null) heroModel.attrs.jiaoy += bonusattrs.jiaoy;
                    if (bonusattrs.feel != null) heroModel.attrs.feel += bonusattrs.feel;
                    if (bonusattrs.energy != null) heroModel.attrs.energy += bonusattrs.energy;
                    if (bonusattrs.cleany != null) heroModel.attrs.cleany += bonusattrs.cleany;
                    if (bonusattrs.hungry != null) heroModel.attrs.hungry += bonusattrs.hungry;
                    if (bonusattrs.lingg != null) heroModel.attrs.lingg += bonusattrs.lingg;
                }

                fixedController.Heros.getSkillListDefaultConfig(heroModel.hid, SkillListDefault => {
                    heroModel.skillList = SkillListDefault;
                    HeroClassUp.getObjUnlockSkillConfig(heroModel.hid, heroModel.attrs.level, ObjUnlockSkillConfig => {
                        let unlockSkill = ObjUnlockSkillConfig.unlockSKill;
                        let strengthSkill = ObjUnlockSkillConfig.strengthSkill;
                        for (let i in heroModel.skillList) {
                            if (unlockSkill != null && unlockSkill[heroModel.skillList[i]]) {
                                heroModel.skillList[i] += 1;
                            }
                            if (strengthSkill != null && strengthSkill[heroModel.skillList[i]]) {
                                heroModel.skillList[i] += 1;
                            }
                        }
                        this.getHeroDataFromDataSource (doc => {
                            if (doc == null) doc = {};
                            if (doc.mhdatas == null) doc.mhdatas = [];
                            doc.mhdatas.push (heroModel);
                            this.saveHeroDataToDataSource (doc, () => {
                                // 任务-获得墨魂
                                if(this.taskController){
    
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetHero,[{params:[heroModel.hid]}]);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params:[heroModel.hid, heroModel.attrs.level]}]);
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex,[{params:[heroModel.hid, ObjHeroSexConfig[heroModel.hid]]}]);
                                    checkinController.addTodayHeroList(this.uuid_, [heroModel.hid], this.multiController,() => {
                                        callback(heroModel);
                                    });
                                }else {
                                    taskController.getTaskDataFromSource(this.uuid_, TaskData => {
                                        taskController.addTaskCounter(TaskData, this.uuid_, 101, [heroModel.hid], () => {
                                            taskController.addTaskCounter(TaskData, this.uuid_, 102, [heroModel.hid, heroModel.attrs.level], () => {
                                                taskController.addTaskCounter(TaskData, this.uuid_, 103, [heroModel.hid, ObjHeroSexConfig[heroModel.hid]], () => {
                                                    taskController.saveTaskDataFromSource(this.uuid_, TaskData, () => {
                                                        // 今日获得墨魂列表（签到用）
                                                        checkinController.addTodayHeroList(this.uuid_, [heroModel.hid], this.multiController,() => {
                                                            callback(heroModel);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    }


    // 获取属性集合
    getAttrs(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(heroData && mhdata ? mhdata.attrs : null);
        });
    }

    setAttrs(attrs, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            for (let i = 0; i < doc.mhdatas.length; i++) {
                if (doc.mhdatas[i].hid === this.heroId_) {
                    doc.mhdatas[i].attrs = attrs;
                    break;
                }
            }
            this.saveHeroDataToDataSource (doc, () => {
                callback();
            });
        });
    }

    addAttrs (attrs, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            let fAtts = null;
            for (let i = 0; i < doc.mhdatas.length; i++) {
                if (doc.mhdatas[i].hid === this.heroId_) {
                    fAtts = doc.mhdatas[i].attrs;
                    fAtts.exp = fAtts.exp + attrs.exp;
                    fAtts.emotion = fAtts.emotion + attrs.emotion;
                    fAtts.jiaoy = fAtts.jiaoy + attrs.jiaoy;
                    fAtts.feel = fAtts.feel + attrs.feel;
                    fAtts.energy = fAtts.energy + attrs.energy;
                    fAtts.cleany = fAtts.cleany + attrs.cleany;
                    fAtts.hungry = fAtts.hungry + attrs.hungry;
                    fAtts.lingg = fAtts.lingg + attrs.lingg;
                    fAtts.skillpoint = fAtts.skillpoint +  (attrs && attrs.skillpoint ? attrs.skillpoint : 0);

                    // 属性限制
                    doc.mhdatas[i].attrs = this.heroAttrLimitMax(doc.mhdatas[i].hid, doc.mhdatas[i].attrs);
                    break;
                }
            }
            this.saveHeroDataToDataSource (doc, ()=> {
                callback(fAtts);
            });
        });
    }

    // 体力
    attrEnergyValidByGroup(heroGroup, costVal, callback)
    {
        this.getHeroDataFromDataSource (res => {
            if (res == null) res = {};
            if (res.mhdatas == null) res.mhdatas = [];
            let stat = true;
            if (res) {
                for (let i = 0; i < heroGroup.length; i++) {
                    let isFind = false;
                    for (let j = 0; j < res.mhdatas.length; j++) {
                        if (heroGroup[i] == res.mhdatas[j].hid) {
                            isFind = true;
                            if (res.mhdatas[j].attrs.energy < costVal)
                                stat = false;
                            break;
                        }
                    }

                    if (!stat || !isFind) {
                        stat = false;
                        break;
                    }
                }
            }
            callback(stat);
        });
    }

    getCostEnergyAccordWithHeroIdByGroup(heroIdGroup, costVal, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            var heroId = 0;
            if (doc) {
                for (let i in heroIdGroup) {
                    for (let j in doc.mhdatas) {
                        if (heroIdGroup[i] === doc.mhdatas[j].hid) {
                            if (doc.mhdatas[j].attrs.energy >= costVal) {
                                heroId = doc.mhdatas[j].hid;
                                break;
                            }
                        }
                    }
                }
            }
            callback({ hid: heroId, cost: costVal });
        });
    }

    getAttrSkillPoint(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            var skillPoint = 0;
            if (heroData && mhdata && mhdata.skillpoint) {
                skillPoint = mhdata.skillpoint;
            }
            callback(skillPoint);
        });
    }

    // 增加墨魂技能熟练度（单个）
    addAttrSkillPoint(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata != null && mhdata.attrs != null) {
                if (!('skillpoint' in mhdata.attrs)) mhdata.attrs.skillpoint = 0;
                mhdata.attrs.skillpoint += v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    getHeroAttrGroup(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            var heroAttrGroup = [];
            if (doc) {
                for (let i in doc.mhdatas) {
                    heroAttrGroup.push({
                        hid: doc.mhdatas[i].hid,
                        attrs: doc.mhdatas[i].attrs
                    });
                }
            }

            callback(heroAttrGroup);
        });
    }

    // 根据墨魂ID组（[hid1, hid2, ...]）获取墨魂属性列表[{hid, attrs}]
    getHeroAttrListByHeroIdGroup(heroIdGroup, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            if (doc) {
                var heroDataLis = doc.mhdatas,
                    heroAttrLis = [];
                for (let heroId of heroIdGroup) {
                    for (let i in heroDataLis) {
                        if (heroDataLis[i].hid === heroId) {
                            heroAttrLis.push({ hid: heroId, attrs: heroDataLis[i].attrs });
                            break;
                        }
                    }
                }
                callback(heroAttrLis);
            } else {
                callback([]);
            }
        });
    }

    /**
     * heroAttrLimitMax - 墨魂属性限制
     * @param {Number} hid
     * @param {Object} attrs
     */
    heroAttrLimitMax(hid, attrs)
    {
        var attrLimitDefault = HeroLevelUpTermAndBonus.getHeroAttrLimitObject(hid, attrs.level);
        // 魂力
        if  (attrs.feel > attrLimitDefault.feel.max) {
            attrs.feel = attrLimitDefault.feel.max;
        } else if (attrs.feel < attrLimitDefault.feel.min) {
            attrs.feel = attrLimitDefault.feel.min;
        }
        // 亲密
        if  (attrs.exp > attrLimitDefault.exp.max) {
            attrs.exp = attrLimitDefault.exp.max;
        } else if (attrs.exp < attrLimitDefault.exp.min) {
            attrs.exp = attrLimitDefault.exp.min;
        }
        // 灵感
        if  (attrs.lingg > attrLimitDefault.lingg.max) {
            attrs.lingg = attrLimitDefault.lingg.max;
        } else if (attrs.lingg < attrLimitDefault.lingg.min) {
            attrs.lingg = attrLimitDefault.lingg.min;
        }
        // 技能熟练度
        if  (attrs.skillpoint > attrLimitDefault.skillpoint.max) {
            attrs.skillpoint = attrLimitDefault.skillpoint.max;
        } else if (attrs.skillpoint < attrLimitDefault.skillpoint.min) {
            attrs.skillpoint = attrLimitDefault.skillpoint.min;
        }
        // 体力
        if  (attrs.energy > attrLimitDefault.energy.max) {
            attrs.energy = attrLimitDefault.energy.max;
        } else if (attrs.energy < attrLimitDefault.energy.min) {
            attrs.energy = attrLimitDefault.energy.min;
        }
        // 心情
        if  (attrs.emotion > attrLimitDefault.emotion.max) {
            attrs.emotion = attrLimitDefault.emotion.max;
        } else if (attrs.emotion < attrLimitDefault.emotion.min) {
            attrs.emotion = attrLimitDefault.emotion.min;
        }

        return attrs;
    }

    addHeroAttrs(attrs, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                var heroData = doc.mhdatas[0];
                mhdata.attrs.energy += attrs.energy;
                mhdata.attrs.feel += attrs.feel;
                mhdata.attrs.cleany += attrs.cleany;
                mhdata.attrs.jiaoy += attrs.jiaoy;
                mhdata.attrs.emotion += attrs.emotion;
                mhdata.attrs.hungry += attrs.hungry;
                mhdata.attrs.lingg += attrs.lingg;
                mhdata.attrs.exp += attrs.exp;
                mhdata.attrs.skillpoint += attrs.skillpoint;

                // 判断墨魂属性上限
                mhdata.attrs = this.heroAttrLimitMax(this.heroId_, mhdata.attrs);

                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(heroData.attrs);
                });
            } else {
                callback(null);
            }
        });
    }

    addHeroAttrsAll(attrs, callback)
    {
        if (attrs.energy === 0 && attrs.feel === 0 &&
                attrs.cleany === 0 && attrs.jiaoy === 0 &&
                    attrs.emotion === 0 && attrs.hungry === 0 &&
                        attrs.lingg === 0 && attrs.exp === 0 && attrs.skillpoint === 0) {
            callback(null);
        } else {
            this.getHeroDataFromDataSource (doc => {
                if (doc == null) doc = {};
                if (doc.mhdatas == null) doc.mhdatas = [];
                if (doc && doc.mhdatas) {
                    for (let i in doc.mhdatas) {
                        doc.mhdatas[i].attrs.energy += attrs.energy;
                        doc.mhdatas[i].attrs.feel += attrs.feel;
                        doc.mhdatas[i].attrs.cleany += attrs.cleany;
                        doc.mhdatas[i].attrs.jiaoy += attrs.jiaoy;
                        doc.mhdatas[i].attrs.emotion += attrs.emotion;
                        doc.mhdatas[i].attrs.hungry += attrs.hungry;
                        doc.mhdatas[i].attrs.lingg += attrs.lingg;
                        doc.mhdatas[i].attrs.exp += attrs.exp;
                        doc.mhdatas[i].attrs.skillpoint += attrs.skillpoint;
                        // 判断墨魂属性上限
                        doc.mhdatas[i].attrs = this.heroAttrLimitMax(doc.mhdatas[i].hid, doc.mhdatas[i].attrs);
                    }
                    this.saveHeroDataToDataSource (doc, ()=> {
                        var heroAttrList = [];
                        for (let i in doc.mhdatas) {
                            heroAttrList.push({
                                hid: doc.mhdatas[i].hid,
                                attrs: doc.mhdatas[i].attrs
                            });
                        }
                        callback(heroAttrList);
                    });
                } else {
                    callback(null);
                }
            });
        }
    }

    setHeroAttrGroup(heroAttrGroup, callback, taskData=null)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            if (doc && doc.mhdatas) {
                for (let i in heroAttrGroup) {
                    for (let j in doc.mhdatas) {
                        if (heroAttrGroup[i].hid === doc.mhdatas[j].hid) {
                            if (heroAttrGroup[i].attrs) {
                                doc.mhdatas[j].attrs = heroAttrGroup[i].attrs;
                                // 判断墨魂属性上限
                                doc.mhdatas[j].attrs = this.heroAttrLimitMax(doc.mhdatas[j].hid, doc.mhdatas[j].attrs);
                            }
                        }
                    }
                }

                this.saveHeroDataToDataSource (doc, async ()=> {
                    await this.doHeroAttrEnergyTask(this.uuid_, heroAttrGroup);
                    callback();
                    // doHeroAttrEnergyTask(this.uuid_, heroAttrGroup, () => {
                    //     callback();
                    // }, taskData);
                });
            } else {
                callback();
            }
        });
    }

    costAttrEnergyByGroup(heroGroup, costVal, callback)
    {
        this.getHeroDataFromDataSource (res => {
            if (res == null) res = {};
            if (res.mhdatas == null) res.mhdatas = [];
            if (res && res.mhdatas) {
                let attrGroup = [];
                for (let i = 0; i < heroGroup.length; i++) {
                    for (let j = 0; j < res.mhdatas.length; j++) {
                        if (heroGroup[i] == res.mhdatas[j].hid) {
                            res.mhdatas[j].attrs.energy -= costVal;
                            if (res.mhdatas[j].attrs.energy < 0) res.mhdatas[j].attrs.energy = 0;
                            attrGroup.push({
                                hid: heroGroup[i],
                                attrs: res.mhdatas[j].attrs
                            })
                            break;
                        }
                    }
                }
                this.saveHeroDataToDataSource (res, ()=> {
                    callback(attrGroup);
                });
            } else {
                callback([]);
            }
        });
    }

    checkAttrEnergyValid(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            let energy = mhdata ? mhdata.attrs.energy : 0;
            callback(energy >= v);
        });
    }

    getAttrEnergy(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.energy : 0);
        });
    }

    setAttrEnergy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.energy = v;
                // 判断墨魂属性上限
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrEnergyCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.energy;
                if (mhdata.attrs.energy == null) mhdata.attrs.energy = min;
                let result = mhdata.attrs.energy + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.energy;
                    mhdata.attrs.energy = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.energy;
                    mhdata.attrs.energy = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.energy = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    addAttrEnergyCheckLimitedByHID (heroId, v, callback)
    {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.energy;
                if (mhdata.attrs.energy == null) mhdata.attrs.energy = min;
                let result = mhdata.attrs.energy + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.energy;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.energy;
                }else {
                    retData.realAdd = v;
                }
                callback(retData);
            });
        });
    }

    addAttrEnergy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata != null && mhdata.attrs != null) {
                mhdata.attrs.energy += v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    costAttrEnergy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if  (heroData && mhdata) {
                mhdata.attrs.energy -= v;
                if (mhdata.attrs.energy < 0) mhdata.attrs.energy = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback([{ hid: mhdata.hid, attrs: mhdata.attrs }]);
                });
            } else {
                callback([]);
            }
        });
    }

    // 清洁度
    getAttrCleany(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.cleany : 0);
        });
    }

    setAttrCleany(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.cleany = v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else{
                callback(0);
            }
        });
    }

    addAttrCleany(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.cleany += v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, () => {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    addAttrCleanyCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.cleany;
                if (mhdata.attrs.cleany == null) mhdata.attrs.cleany = min;
                let result = mhdata.attrs.cleany + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.cleany;
                    mhdata.attrs.cleany = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.cleany;
                    mhdata.attrs.cleany = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.cleany = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    costAttrCleany(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.cleany -= v;
                if (mhdata.attrs.cleany < 0) mhdata.attrs.cleany = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // 魂力
    getAttrFeel(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.feel : 0);
        });
    }

    setAttrFeel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.feel = v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrFeel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.feel += v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    addAttrFeelCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.feel;
                if (mhdata.attrs.feel == null) mhdata.attrs.feel = min;
                let result = mhdata.attrs.feel + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.feel;
                    mhdata.attrs.feel = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.feel;
                    mhdata.attrs.feel = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.feel = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    costAttrFeel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.feel -= v;
                if (mhdata.attrs.feel < 0) mhdata.attrs.feel = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // 灵气
    getAttrLingg(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(heroData && mhdata ? mhdata.attrs.lingg : 0);
        });
    }

    setAttrLingg(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.lingg = v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrLingg(v, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            let pos = -1;
            for (let i in doc.mhdatas) {
                if (doc.mhdatas[i].hid === this.heroId_) {
                    doc.mhdatas[i].attrs.lingg += v;
                    if (doc.mhdatas[i].attrs.lingg < 0) doc.mhdatas[i].attrs.lingg = 0;
                    doc.mhdatas[i].attrs = this.heroAttrLimitMax(doc.mhdatas[i].hid, doc.mhdatas[i].attrs);
                    pos = i;
                    break;
                }
            }

            // TODO灵感 任务
            this.saveHeroDataToDataSource (doc, ()=> {
                callback(doc.mhdatas[pos].attrs);
            });
        });
    }

    addAttrLinggCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.lingg;
                if (mhdata.attrs.lingg == null) mhdata.attrs.lingg = min;
                let result = mhdata.attrs.lingg + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.lingg;
                    mhdata.attrs.lingg = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.lingg;
                    mhdata.attrs.lingg = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.lingg = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    costAttrLingg(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.lingg -= v;
                if (mhdata.attrs.lingg < 0) mhdata.attrs.lingg = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // 交游
    getAttrJiaoy(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.jiaoy : 0);
        });
    }

    setAttrJiaoy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.jiaoy = v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else{
                callback(0);
            }
        });
    }

    addAttrJiaoyCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.jiaoy;
                if (mhdata.attrs.jiaoy == null) mhdata.attrs.jiaoy = min;
                let result = mhdata.attrs.jiaoy + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.jiaoy;
                    mhdata.attrs.jiaoy = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.jiaoy;
                    mhdata.attrs.jiaoy = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.jiaoy = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    addAttrJiaoy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.jiaoy += v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            } else {
                callback(null);
            }
        })
    }

    costAttrJiaoy(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.jiaoy -= v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            } else {
                callback(null);
            }
        })
    }

    // 情感
    getAttrEmotion(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.emotion : 0);
        });
    }

    setAttrEmotion(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.emotion = v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            } else {
                callback(0);
            }
        });
    }

    addAttrEmotionCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.emotion;
                if (mhdata.attrs.emotion == null) mhdata.attrs.emotion = min;
                let result = mhdata.attrs.emotion + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.emotion;
                    mhdata.attrs.emotion = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.emotion;
                    mhdata.attrs.emotion = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.emotion = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    addAttrEmotion(v, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];

            var pos = -1;
            for (let i in doc.mhdatas) {
                if (doc.mhdatas[i].hid === this.heroId_) {
                    doc.mhdatas[i].attrs.emotion += v;
                    if (doc.mhdatas[i].attrs.emotion < 0) doc.mhdatas[i].attrs.emotion = 0;
                    doc.mhdatas[i].attrs = this.heroAttrLimitMax(doc.mhdatas[i].hid, doc.mhdatas[i].attrs);
                    pos = i;
                    break;
                }
            }

            if (pos != -1) {
                this.saveHeroDataToDataSource (doc, ()=> {
                    callback(doc.mhdatas[pos].attrs);
                });
            }else {
                callback (null);
            }
        });
    }

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
                heroDatas[i].addEnergyThisTime = addAttr;
                break;
            }
        }
    }

    checkBatchAttrEmotion (heroDatas, checkHeroList, callback)
    {
        if (checkHeroList.length <= 0) {
            callback (true);
        }else {
            let heroData = checkHeroList[0];
            let heroId = heroData.heroId;
            this.addAttrEnergyCheckLimitedByHID (heroId, heroData.addEnergyThisTime, addAttrData => {
                this.updateHeroDataByCheckLimitedData (heroDatas, heroId, addAttrData.realAdd);
                checkHeroList.splice (0, 1);
                this.checkBatchAttrEmotion (heroDatas, checkHeroList, callback);
            });
        }
    }

    addBatchAttrEmotion (v, workStat, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];

            let retData = {};
            let updatedAttrs = [];
            let shouldUpdateAttrs = false;
            let checkList = [].concat (v);
            let updateStats = [];

            this.checkBatchAttrEmotion (v, checkList, _ => {
                for (let i in doc.mhdatas) {
                    let addAttrsData = this.getTargetHeroAttrInfo (v, doc.mhdatas[i].hid);
                    if (addAttrsData != null) {
                        shouldUpdateAttrs = true;
                        doc.mhdatas[i].workStat = workStat;
                        doc.mhdatas[i].attrs.energy += addAttrsData.addEnergyThisTime;
                        if (doc.mhdatas[i].attrs.energy < 0) doc.mhdatas[i].attrs.energy = 0;
                        if (addAttrsData.addFeel != null){
                            doc.mhdatas[i].attrs.emotion += addAttrsData.addFeel;
                            if (doc.mhdatas[i].attrs.emotion < 0) doc.mhdatas[i].attrs.emotion = 0;
                        }
                        updatedAttrs.push ({ hid: doc.mhdatas[i].hid, attrs: doc.mhdatas[i].attrs});
                        updateStats.push ({ hid:doc.mhdatas[i].hid, workStat: workStat})
                    }
                }
                retData.updatedAttrs = updatedAttrs;
                retData.updateStats = updateStats;
                if (shouldUpdateAttrs){
                    this.saveHeroDataToDataSource (doc, ()=> {
                        callback(retData);
                    });
                }else{
                    callback(retData);
                }
            });
        });
    }

    costAttrEmotion(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.emotion -= v;
                if (mhdata.attrs.emotion < 0) mhdata.attrs.emotion = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // 饥饿度
    getAttrHungry(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.hungry : 0);
        });
    }

    setAttrHungry(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.hungry = v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback (v);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrHungry(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.hungry += v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback (mhdata.attrs);
                });
            } else {
                callback(null);
            }
        })
    }

    addAttrHungryCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.hungry;
                if (mhdata.attrs.hungry == null) mhdata.attrs.hungry = min;
                let result = mhdata.attrs.hungry + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.hungry;
                    mhdata.attrs.hungry = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.hungry;
                    mhdata.attrs.hungry = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.hungry = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    costAttrHungry(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.hungry -= v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // 等级
    getAttrLevel(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata && mhdata.attrs.level ? mhdata.attrs.level : 1);
        });
    }

    setAttrLevel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.level = v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrLevel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.level += v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    costAttrLevel(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.level -= v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        });
    }

    // 亲密度
    getAttrExp(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            callback(mhdata ? mhdata.attrs.exp : 0);
        });
    }

    setAttrExp(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.exp = v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(0);
            }
        });
    }

    addAttrExp(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.exp += v;
                mhdata.attrs = this.heroAttrLimitMax(mhdata.hid, mhdata.attrs);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        });
    }

    addAttrExpCheckLimited (v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            assert (heroData != null && mhdata != null, "hero attr should not be null");
            let retData = {}
            if (mhdata.attrs.level == null) mhdata.attrs.level = 1;
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(mhdata.hid, mhdata.attrs.level, HeroAttrDefault => {
                var min, max;
                [min, max] = HeroAttrDefault.exp;
                if (mhdata.attrs.exp == null) mhdata.attrs.exp = min;
                let result = mhdata.attrs.exp + v;
                if (result > max) {
                    retData.realAdd = max - mhdata.attrs.exp;
                    mhdata.attrs.exp = max;
                }else if (result < min) {
                    retData.realAdd = min - mhdata.attrs.exp;
                    mhdata.attrs.exp = min;
                }else {
                    retData.realAdd = v;
                    mhdata.attrs.exp = result;
                }
                retData.attrs = mhdata.attrs;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(retData);
                });
            });
        });
    }

    costAttrExp(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata && mhdata.attrs) {
                mhdata.attrs.exp -= v;
                if (mhdata.attrs.exp < 0) mhdata.attrs.exp = 0;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            }else {
                callback(null);
            }
        })
    }

    // ================================================ SKILL
    autoUnlockSkill(heroLevel, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata && mhdata.skillList) {
                var skillLis = mhdata.skillList;
                HeroClassUp.getObjUnlockSkillConfig(this.heroId_, heroLevel, ObjUnlockSkillConfig => {
                    let unlockSkill = ObjUnlockSkillConfig.unlockSKill;
                    let strengthSkill = ObjUnlockSkillConfig.strengthSkill;
                    for (let i in skillLis) {
                        if (unlockSkill != null && unlockSkill[skillLis[i]]) {
                            skillLis[i] += 1;
                        }
                        if (strengthSkill != null && strengthSkill[skillLis[i]]) {
                            skillLis[i] += 1;
                        }
                    }
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        callback(skillLis);
                    });
                });
            } else {
                callback([]);
            }
        });
    }

    getSkillList(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata && mhdata.skillList) {
                callback(mhdata.skillList);
            } else {
                callback([]);
            }
        });
    }

    setSkillList(list, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata) {
                mhdata.skillList = list;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(true);
                });
            }else {
                callback (false)
            }
        });
    }

    checkSkillGroupValid(parentSkillId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            var valid = false;
            if (heroData && mhdata && mhdata.skillList) {
                var skillList = mhdata.skillList;
                for (let skillId of skillList) {
                    if (Skills.getParentSkillId(skillId) === parentSkillId) {
                        // 说明存在这一类型的技能组
                        valid = true;
                        break;
                    }
                }
            }
            callback(valid);
        });
    }

    // 技能升级
    skillLevelUp(parentSkillId, v, callback)
    {
        Skills.getMaxSkillIdConfig(parentSkillId, MaxSkillId => {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                if (heroData && mhdata && mhdata.skillList) {
                    var skillList = mhdata.skillList, isUpdated = false;
                    for (let i in skillList) {
                        if (Skills.getParentSkillId(skillList[i]) === parentSkillId) {
                            // 找到相应父节点的技能
                            if ((skillList[i] + v) <= MaxSkillId) {
                                skillList[i] += v;
                                isUpdated = true;
                                break;
                            }
                        }
                    }

                    if (isUpdated) {
                        // 升级技能成功
                        this.saveHeroDataToDataSource (heroData, ()=> {
                            callback(skillList);
                        });
                    } else {
                        callback(skillList);
                    }
                } else {
                    callback([]);
                }
            });
        });
    }

    // 主动技能充能升级
    skillChargingLevelUp(parentSkillId, needPower, addPower, callback)
    {
        Skills.getMaxSkillIdConfig(parentSkillId, MaxSkillId => {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                if (heroData && mhdata && mhdata.skillList) {
                    var skillList = mhdata.skillList, isUpdated = false, retData = {};
                    if (mhdata.skillChargingPoint == null) {
                        mhdata.skillChargingPoint = addPower;
                    }else {
                        mhdata.skillChargingPoint += addPower;
                    }

                    if (mhdata.skillChargingPoint >= needPower) {
                        mhdata.skillChargingPoint = 0;
                        for (let i in skillList) {
                            if (Skills.getParentSkillId(skillList[i]) === parentSkillId) {
                                if ((skillList[i] + 1) <= MaxSkillId) {
                                    skillList[i] += 1;
                                    break;
                                }
                            }
                        }
                        retData.isSkillLevelUp = true;
                    }else {
                        retData.isSkillLevelUp = false;
                    }

                    retData.skillChargingPoint = mhdata.skillChargingPoint;
                    if (retData.isSkillLevelUp) {
                        retData.skillList = skillList;
                    }
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        callback(retData);
                    });
                } else {
                    callback({});
                }
            });
        });
    }


    addSkill(skillId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                if (mhdata.skillList === null) mhdata.skillList = [];
                mhdata.skillList.push(skillId);
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.skillList);
                });
            } else {
                callback();
            }
        });
    }

    checkSkillValid(skillId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            var valid = false;
            if (heroData && mhdata && mhdata.skillList) {
                for (let sid of mhdata.skillList) {
                    if (sid === skillId) {
                        valid = true;
                        break;
                    }
                }
            }
            callback(valid);
        });
    }

    // 检查主动技能是否可以使用
    checkInitiativeSkillCastTimeValid (skillId, callback) {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            let valid = false;
            if (heroData && mhdata) {
                let skillCDTime = mhdata.activeSkillCDTime;
                if (skillCDTime == null) skillCDTime = 0;
                if (utils.getTime () >= skillCDTime) {
                    valid = true;
                }
            }
            callback(valid);
        });
    }
    
    // 主动技能释放
    castInitiativeSkillCast(skillId, reduceCDTime, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                let castTime = utils.getTime ();
                let coolDownTime = Skills.getSkillCoolDownTime(skillId);
                mhdata.activeSkillCastTime = castTime;
                let cdTime = castTime + coolDownTime - reduceCDTime;
                mhdata.activeSkillCDTime = cdTime;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback({activeSkillCastTime:castTime, activeSkillCDTime:cdTime, hid:this.heroId_});
                });
            } else {
                callback({});
            }
        });
    }

    checkInitiativeSkillValid(skillId, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            let SkillType = Skills.getSkillTypeConfig(skillId);
            let valid = false;
            let activeSkillType = Skills.SkillType().ACTIVE;
            if (heroData && mhdata && mhdata.skillList) {
                for (let sid of mhdata.skillList) {
                    if (sid === skillId && SkillType === activeSkillType) {
                        valid = true;
                        break;
                    }
                }
            }
            callback(valid);
        });
    }

    getHeroIdList(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            var lis = [];
            if (doc && 'mhdatas' in doc) {
                for (let i in doc.mhdatas) {
                    lis.push(doc.mhdatas[i].hid);
                }
            }

            callback(lis);
        });
    }

    getSkillListByGroup(heroIdGroup, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            var skillList = [];
            if (doc && doc.mhdatas) {
                for (let i in doc.mhdatas) {
                    if (heroIdGroup.indexOf(doc.mhdatas[i].hid) === 0) {
                        if (doc.mhdatas[i].skillList) {
                            skillList = skillList.concat(doc.mhdatas[i].skillList);
                        }
                    }
                }
            }
            callback(skillList);
        });
    }

    getHeroSkillGroup(heroIdGroup, callback)
    {
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            var hsGroup = [];
            if (doc && doc.mhdatas) {
                for (let heroId of heroIdGroup) {
                    for (let i in doc.mhdatas) {
                        if (heroId === doc.mhdatas[i].hid) {
                            hsGroup.push({
                                hid: heroId,
                                skillList: doc.mhdatas[i].skillList ? doc.mhdatas[i].skillList : []
                            });
                        }
                    }
                }
            }
            callback(hsGroup);
        });
    }

    getSkillHeroObjectAll(callback)
    {
        this.getHeroDataFromDataSource (doc => {
            var obj = {};
            if (doc != null && Array.isArray(doc.mhdatas)) {
                for (let i in doc.mhdatas) {
                    obj[doc.mhdatas[i].hid] = {
                        hid: doc.mhdatas[i].hid,
                        skillList: Array.isArray(doc.mhdatas[i].skillList) ? doc.mhdatas[i].skillList : []
                    };
                }
            }

            callback(obj);
        });
    }

    checkAttrsValid(attrs, callback)
    {
        if (attrs) {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                var valid = true;
                if (heroData && mhdata) {
                    var heroAttrs = mhdata.attrs;
                    if (heroAttrs.energy < attrs.energy ||
                            heroAttrs.feel < attrs.feel ||
                            heroAttrs.cleany < attrs.cleany ||
                            heroAttrs.jiaoy < attrs.jiaoy ||
                            heroAttrs.emotion < attrs.emotion ||
                            heroAttrs.hungry < attrs.hungry ||
                            heroAttrs.lingg < attrs.lingg ||
                            heroAttrs.exp < attrs.exp ||
                            heroAttrs.skillpoint  < attrs.skillpoint) {
                        valid = false;
                    }
                }
                callback(valid);
            });
        } else {
            callback(true);
        }
    }

    costAttrs(attrs, callback)
    {
        if (!attrs) {
            attrs = {
                energy: 0,  // 体力
                feel: 0,    // 魂力
                cleany: 0,  // 清洁度
                jiaoy: 0,   // 交游
                emotion: 0, // 情感
                hungry: 0,  // 饥饿度
                lingg: 0,   // 灵感
                exp: 0,      // 默契
                skillpoint:0 // 熟练
            }
        }

        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            var valid = true;
            if (heroData && mhdata) {
                mhdata.attrs.energy   -= attrs.energy;
                mhdata.attrs.feel     -= attrs.feel;
                mhdata.attrs.cleany   -= attrs.cleany;
                mhdata.attrs.jiaoy    -= attrs.jiaoy;
                mhdata.attrs.emotion  -= attrs.emotion;
                mhdata.attrs.hungry   -= attrs.hungry;
                mhdata.attrs.lingg    -= attrs.lingg;
                mhdata.attrs.exp      -= attrs.exp;
                mhdata.attrs.skillpoint  -= attrs.skillpoint;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.attrs);
                });
            } else {
                callback(null);
            }
        });
    }

    // ================================================ PURSUE-TREE
    /**
     * getPursueTreeList - 获取追求树解锁列表
     * @param {*} callback
     */
    getPursueTreeList(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                if (mhdata.pursueTreeList) {
                    callback(mhdata.pursueTreeList);
                } else {
                    mhdata.pursueTreeList = [];//[{ nodeId: 1, status: 1 }];
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        callback(mhdata.pursueTreeList);
                    });
                }
            } else {
                callback(null);
            }
        });
    }

    getPursueTreeListByHeroId(heroId, callback)
    {
        if (heroId === 0) {
            // 全部墨魂追求树
            this.getHeroDataFromDataSource (doc => {
                if (doc == null) doc = {};
                if (doc.mhdatas == null) doc.mhdatas = [];
                let heroTreeGroup = [];
                if (doc && doc.mhdatas) {
                    let isUpdated = false;
                    for (let i in doc.mhdatas) {
                        if (!doc.mhdatas[i].pursueTreeList) {
                            isUpdated = true;
                            doc.mhdatas[i].pursueTreeList = [];
                        }
                        heroTreeGroup.push({
                            hid: doc.mhdatas[i].hid,
                            treeList: doc.mhdatas[i].pursueTreeList
                        });
                    }

                    if (isUpdated) {
                        this.saveHeroDataToDataSource (doc, ()=> {
                            callback(heroTreeGroup);
                        });
                    } else {
                        callback(heroTreeGroup);
                    }
                } else {
                    callback(heroTreeGroup);
                }
            });
        } else {
            // 指定墨魂追求树
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                if (heroData && mhdata) {
                    if (mhdata.pursueTreeList) {
                        callback([{ hid: heroId, treeList: mhdata.pursueTreeList }]);
                    } else {
                        mhdata.pursueTreeList = [];
                        this.saveHeroDataToDataSource (heroData, ()=> {
                            callback([{ hid: heroId, treeList: mhdata.pursueTreeList }]);
                        });
                    }
                } else {
                    callback(null);
                }
            });
        }
    }

    /**
     * checkPursueTreeNodeIsExist - 该追求树节点是否已存在 追求树节点数据中存在当前节点的数据 且status为1
     * @param {*} nodeId
     * @param {*} callback
     */
    checkPursueTreeNodeIsExist(nodeId, callback)
    {
        if (nodeId === 0) {
            callback(true);
        } else {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                let valid = false;
                if (heroData && mhdata) {
                    if (mhdata.pursueTreeList) {
                        let pursueTreeList = mhdata.pursueTreeList;
                        for (let i in pursueTreeList) {
                            if (pursueTreeList[i].nodeId === nodeId && pursueTreeList[i].status === 1) {
                                valid = true;
                                break;
                            }
                        }
                    }
                }
                callback(valid);
            });
        }
    }

    /**
     * addPursueTreeNode - 将解锁节点加入追求树列表中
     * @param {*} nodeId
     * @param {*} callback
     */
    async addPursueTreeNode(nodeId)
    {
        return new Promise( resolve => {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                if (heroData && mhdata) {
                    if (!mhdata.pursueTreeList || JSON.stringify(mhdata.pursueTreeList) === '{}') {
                        mhdata.pursueTreeList = [];
                    }
                    mhdata.pursueTreeList.push({
                        nodeId: nodeId,
                        status: 1
                    });
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        resolve(mhdata.pursueTreeList);
                    })
                } else {
                    resolve(null);
                }
            });
        });
    }

    addPursueTreeNodeByHeroId (heroId,  nodeId, callback) {
        this.getHeroDataUsingHeroId (heroId, (heroData, mhdata) => {
            if (heroData && mhdata) {
                if (!mhdata.pursueTreeList || JSON.stringify(mhdata.pursueTreeList) === '{}') {
                    mhdata.pursueTreeList = [];
                }
                mhdata.pursueTreeList.push({
                    nodeId: nodeId,
                    status: 1
                });
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.pursueTreeList);
                })
            } else {
                callback(null);
            }
        });
    }

    /**
     * setPursueTreeList - 设置追求树列表
     * @param {Array} lis
     * @param {Function} callback
     * @param {Boolean} save
     */
    setPursueTreeList(lis, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (heroData && mhdata) {
                mhdata.pursueTreeList = lis;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.pursueTreeList);
                })
            } else {
                callback(null);
            }
        });
    }
    // ================================================ PURSUE-TREE

    // BonusHerosLis = [{hid, count}]
    getConvertNewHeroAndPieceItem(BonusHerosLis, callback)
    {
        function checkHeroValid(mhs, hid) {
            for (let heroData of mhs) {
                if (hid === heroData.hid) {
                    return true;
                }
            }
            return false;
        }
        this.getHeroDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.mhdatas == null) doc.mhdatas = [];
            fixedController.HeroLevelUpTermAndBonus.getHeroAttrConfig(1, HeroAttrMap => {
                var pieceHeroGroup = [], newHeroGroup = [];
                if (doc && doc.mhdatas) {
                    for (let heroNode of BonusHerosLis) {
                        if (checkHeroValid(doc.mhdatas, heroNode.hid)) {
                            // 墨魂已存在（进入碎片(是道具)列表）
                            pieceHeroGroup.push(heroNode.hid);
                        } else {
                            // 是新墨魂（进入新墨魂列表）
                            let OneHero = models.HeroModel(heroNode.hid);
                            OneHero.hid = heroNode.hid;
                            if (HeroAttrMap.get(OneHero.hid)) {
                                OneHero.attrs = HeroAttrMap.get(OneHero.hid);
                                newHeroGroup.push(OneHero);
                            }
                        }
                    }
                }
                callback(newHeroGroup, pieceHeroGroup);
            });
        });
    }

    // 摸鱼次数
    getHeroGoofOffCount(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            let goofOffCount = (heroData && mhdata && mhdata.goofOffCount) ? mhdata.goofOffCount : 0;
            callback(goofOffCount);
        });
    }

    setHeroGoofOffCount(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata) {
                mhdata.goofOffCount = v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(mhdata.pursueTreeList);
                })
            }else{
                callback(0);
            }
        });
    }

    // 摸鱼时间
    getHeroGoofOffTime(callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            let goofOffTime = (heroData && mhdata && mhdata.goofOffTime) ? mhdata.goofOffTime : 0;
            callback(goofOffTime);
        });
    }

    setHeroGoofOffTime(v, callback)
    {
        this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
            if (mhdata) {
                mhdata.goofOffTime = v;
                this.saveHeroDataToDataSource (heroData, ()=> {
                    callback(v);
                });
            }else {
                callback(0);
            }
        });
    }

    setHeroAttrs(attrs, callback)
    {
        if (attrs === undefined || attrs === null) {
            callback(null);
        } else {
            this.getHeroDataUsingHeroId (this.heroId_, (heroData, mhdata) => {
                if (mhdata) {
                    mhdata.attrs = attrs
                    this.saveHeroDataToDataSource (heroData, ()=> {
                        callback(attrs);
                    });
                }else {
                    callback(null);
                }
            });
        }
    }

    addSendGiftRecord (heroId, itemId, callback) {
        this.getSendGiftDataFromDataSource (sendRecords => {
            if (sendRecords) {
                let sendSuccess = false
                let newSendStatus = false
                for (let record of sendRecords) {
                    if (record.hid != null && record.hid == heroId) {
                        if (!record.sendRecords.includes (itemId)) {
                            newSendStatus = true;
                            record.sendRecords.push (itemId);
                        }
                        sendSuccess = true;
                    }
                }
                if (!sendSuccess) {
                    newSendStatus = true;
                    sendRecords.push ({hid:heroId, sendRecords:[itemId]});
                }
                this.saveSendGiftDataToDataSource (sendRecords, _ => {
                    callback(newSendStatus);
                });
            }
        });
    }
}

module.exports = heroController;
