const models = require('./../models');
const utils = require('./../../common/utils');
const gamedata = require('./../../../configs/gamedata.json');
const QuizReward = require('./../../designdata/QuizReward');
const Defaults = require('./../../designdata/Defaults');
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const skillController = require('./../controllers/skillController');

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

// quzi 答题状态 与 答题次数信息  quziitem 答题道具恢复信息
class externalController
{
    constructor(uuid, multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'ExternalData';
        this.multiController = multiController;
        this.externalData = null;
        this.taskController = taskController;
    }

    errorHandle(){
        this.externalData = null
    }

    getFromDBOrCache(cb){
        if(!!this.externalData){
            cb(this.externalData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sdoc => {
                var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
                this.externalData = doc
                cb(doc)
            })
        }
    }

    // 获取游戏额外数据信息
    getGameExternalData (callback) {
        this.getFromDBOrCache (doc => {
            if (doc == null) {
                var curTime = (new Date()).getTime();
                let externalData = {};
                externalData.uuid = this.uuid_;
                externalData.helptimes = 0;
                externalData.quiz = [];
                externalData.quizitem = {};
                externalData.quizitem.starttime = curTime - gamedata.QUIZ.QuizItemCdTime - gamedata.QUIZ.QuizItemCdAdaptTime;
                externalData.quizitem.endtime = curTime;
                externalData.quizitem.id = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMID);
                externalData.quizitem.count = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMCOLLECTTIME);
                this.multiController.push(1, this.tblname_ + ":"  + this.uuid_ , JSON.stringify(externalData))
                this.externalData = externalData
                callback(externalData);
            }else {
                callback (doc);
            }
        });
    }


   getRestHourDayTime () {
        let date = new Date()
        let times = date.getTime()
        let hour = date.getHours()
        let minute = date.getMinutes()
        let second = date.getSeconds()
        let dayTime = times - hour * 3600 * 1000 - minute * 60 * 1000 - second * 1000 + 24 * 3600 * 1000
        return dayTime
    }

    // 墨魂答题信息
    getHeroQuizInfo (hid, callback) {
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.quiz == null || doc.quiz.length <= 0) {
                let quizData = models.QuizData (hid);
                callback (quizData);
            }else {
                let quizData = doc.quiz[0];
                this.externalData = doc
                callback (quizData);
            }
        });
    }

    // 判断墨魂是否可以参与答题
    async isHeroCanAttendQuiz (clsHero, hid, mode) {
        return new Promise( async resolve => {
            let retData = {};
            if (mode == 0) {
                retData.status = 1;
                retData.count = 1;
                resolve (retData);
            }else {
                if(!!this.externalData){
                    var quizData = null;
                    if (Array.isArray(this.externalData.quiz)) {
                        for (let i in this.externalData.quiz) {
                            if (this.externalData.quiz[i].hid === hid) {
                                quizData = this.externalData.quiz[i];
                                break;
                            }
                        }
                    }

                    let skillAddQuizCnt = 0
                    if (quizData === null) {
                        quizData = models.QuizData (hid);
                    }

                    let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().ANSWER, hid,null);
                    if (skillEffectData.effBuffData != null) {
                        let addCnt = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDANSWERCNT];
                        if (addCnt != null && addCnt.value != null) {
                            skillAddQuizCnt = skillAddQuizCnt + addCnt.value;
                            console.log("----skill active log .. add quiz count", hid, addCnt.value)
                        }
                    }

                    retData.status = quizData.stat
                    retData.count = quizData.count + skillAddQuizCnt - quizData.used;
                    resolve(retData);
                }else{
                    this.getFromDBOrCache (async doc => {
                        if(!doc){doc = {}}
                        var quizData = null;
                        if (Array.isArray(doc.quiz)) {
                            for (let i in doc.quiz) {
                                if (doc.quiz[i].hid === hid) {
                                    quizData = doc.quiz[i];
                                    break;
                                }
                            }
                        }
                        if (quizData === null) {
                            quizData = models.QuizData (hid);
                        }

                        let skillAddQuizCnt = 0
                        let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().ANSWER, hid,null);
                        if (skillEffectData.effBuffData != null) {
                            let addCnt = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDANSWERCNT];
                            if (addCnt != null && addCnt.value != null) {
                                skillAddQuizCnt = skillAddQuizCnt + addCnt.value;
                                console.log("----skill active log .. add quiz count", hid, addCnt.value)
                            }
                        }

                        retData.status = quizData.stat
                        retData.count = quizData.count + skillAddQuizCnt - quizData.used;
                        resolve(retData);
                    });
                }
            }
        });
    }

    // 更新墨魂是否可以答题状态
    updateHeroQuizStat (hid, stat, callback)
    {
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.quiz == null || doc.quiz.length <= 0) {
                doc.quiz = [];
                let quizData = models.QuizData (hid);
                quizData.stat = stat;
                doc.quiz.push (quizData);
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(quizData);
            }else {
                let updatedQuiz = doc.quiz;
                let targetQuiz = null;
                for (let i in updatedQuiz) {
                    if (updatedQuiz[i].hid == hid) {
                        updatedQuiz[i].stat = stat
                        targetQuiz = updatedQuiz[i];
                        break;
                    }
                }

                if (targetQuiz == null) {
                    targetQuiz = models.QuizData (hid);
                    quizData.stat = stat;
                    updatedQuiz.push (targetQuiz);
                }
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(targetQuiz);
            }
        });

    }

    // 更新墨魂可答题次数
    addHeroQuizCount (hid, count, callback){
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.quiz == null || doc.quiz.length <= 0) {
                doc.quiz = [];
                let quizData = models.QuizData (hid);
                quizData.count += count;
                doc.quiz.push (quizData);
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                callback(quizData);
            }else {
                let updatedQuiz = doc.quiz;
                let targetQuiz = null;
                for (let i in updatedQuiz) {
                    if (updatedQuiz[i].hid == hid) {
                        updatedQuiz[i].count += count
                        targetQuiz = updatedQuiz[i];
                        break;
                    }
                }
                if (targetQuiz == null) {
                    let quizData = models.QuizData (hid);
                    quizData.count += count;
                    updatedQuiz.push (quizData);
                    targetQuiz = quizData;
                }
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(targetQuiz);
            }
        });
    }

    // 更新墨魂已经使用的答题次数
    updateHeroQuizUsedCount (hid, count, callback){
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.quiz == null || doc.quiz.length <= 0) {
                doc.quiz = [];
                let quizData = models.QuizData (hid);
                quizData.used += count;
                doc.quiz.push (quizData);
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(quizData);
            }else {
                let updatedQuiz = doc.quiz;
                let targetQuiz = null;
                for (let i in updatedQuiz) {
                    if (updatedQuiz[i].hid == hid) {
                        updatedQuiz[i].used += count
                        targetQuiz = updatedQuiz[i];
                        break;
                    }
                }
                if (targetQuiz == null) {
                    targetQuiz = models.QuizData (hid);
                    targetQuiz.used += count;
                    updatedQuiz.push (targetQuiz);
                }
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(targetQuiz);
            }
        });
    }

    // 重置墨魂答题使用次数
    resetAllHeroQuizUsedCountAndQuizItem (callback) {
        this.getFromDBOrCache (doc => {
            if (doc == null || doc.quiz == null || doc.quiz.length <= 0) {
                callback(true);
            }else {
                let updatedQuiz = doc.quiz;
                for (let i in updatedQuiz) {
                    updatedQuiz[i].used = 0
                }
                var curTime = (new Date()).getTime();
                doc.quizitem = {};
                doc.quizitem.starttime = curTime - gamedata.QUIZ.QuizItemCdTime - gamedata.QUIZ.QuizItemCdAdaptTime;
                doc.quizitem.endtime = curTime;
                doc.quizitem.id = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMID);
                doc.quizitem.count = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMCOLLECTTIME);

                this.multiController.push(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(true);
            }
        });
    }

    // 重置答题次数
    updateQuizHelpTime (time, isRest, callback) {
        this.getFromDBOrCache (doc => {
            if (!doc) { doc = {} }
            if (isRest) {
                doc.helptimes = 0;
            }else {
                doc.helptimes += time;
            }
            this.multiController.push(1,this.tblname_ + ":"  + this.uuid_ , JSON.stringify(doc))
            this.externalData = doc;
            callback (doc.helptimes)
        });
    }

    // 获取下一次使用帮助的消耗数量
    calcHelpUseItemData (callback) {
        let retData = {};
        this.getFromDBOrCache (doc => {
            if (!doc) { doc = {} }
            if (doc.helptimes == null) doc.helptimes = 0;
            GameBuyCounts.getBuyCountMaxConfig(6, BuyCountMax => {
                if (doc.helptimes >= BuyCountMax)  {
                    retData.status = -1;
                    callback (retData);
                }else {
                    GameBuyCounts.getBuyCountCostConfig(6, doc.helptimes +1, CostData => {
                        retData.CostData = CostData;
                        retData.status = 0;
                        callback (retData);
                    });
                }
            });
        });
    }

    collectQuizItem (callback)
    {
        let retData = {};
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.quizitem == null) {
                let quizitem = {};
                var curTime = (new Date()).getTime();
                let endTime = this.getRestHourDayTime ();
                quizitem.starttime = curTime;
                quizitem.endtime = endTime;
                quizitem.id = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMID);
                quizitem.count = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMCOLLECTTIME);
                doc.quizitem = quizitem;
                this.multiController.push(1, this.tblname_+ ":" + this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                retData.status = 0;
                retData.quizitem = quizitem;
                retData.item = {id: quizitem.id, count: quizitem.count};
                callback(retData);
            }else {
                var curTime = (new Date()).getTime();
                let quizitem = doc.quizitem;
                if (curTime < quizitem.endtime) {
                    retData.status = 1;
                    callback(retData);
                }else {
                    let endTime = this.getRestHourDayTime ();
                    quizitem.starttime = curTime;
                    quizitem.endtime = endTime;
                    quizitem.id = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMID);
                    quizitem.count = Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMCOLLECTTIME);
                    this.multiController.push(1, this.tblname_+ ":" + this.uuid_ , JSON.stringify(doc));
                    this.externalData = doc
                    retData.status = 0;
                    retData.quizitem = quizitem;
                    retData.item = {id: quizitem.id, count: quizitem.count};
                    callback(retData);
                }
            }
        });
    }

    getQuizResult (time, callback)
    {
        QuizReward.getQuizRewardByTime (time, quizReward => {
            callback (quizReward);
        });
    }

    startUnlockFunction (type, id, callback)
    {
        let retData = {};
        this.getFromDBOrCache (doc => {
            if(!doc){doc = {}}
            if (doc.unlockinfo == null || doc.unlockinfo.length <= 0) {
                let unlockinfo = [];
                let unlockdata = models.UnlockInfoData ();
                unlockdata.type = type;
                unlockdata.id = id;
                unlockinfo.push (unlockdata);
                doc.unlockinfo = unlockinfo;

                retData.status = 0;
                retData.unlockdata = unlockdata;
                this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                this.externalData = doc
                callback(retData);
            }else {
                let unlockinfo = doc.unlockinfo;
                let foundunlock = false;
                for (let i in unlockinfo) {
                    if (unlockinfo[i].type == type && unlockinfo[i].id == id) {
                        foundunlock = true;
                        break;
                    }
                }
                if (foundunlock) {
                    retData.status = 1;
                    callback(retData);
                }else {
                    let unlockdata = models.UnlockInfoData ();
                    unlockdata.type = type;
                    unlockdata.id = id;
                    unlockinfo.push (unlockdata);
                    retData.status = 0;
                    retData.unlockdata = unlockdata;
                    this.multiController.push(1,this.tblname_+":" +this.uuid_ , JSON.stringify(doc))
                    this.externalData = doc
                    callback(retData);
                }
            }
        });
    }

}

module.exports = externalController;
