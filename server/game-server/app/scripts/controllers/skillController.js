const Skills = require('./../../designdata/Skills');
const SkillEffects = require('./../../designdata/SkillEffects');
const WorkFormulas = require('./../../designdata/WorkFormulas');
const SkillConditions = require('./../../designdata/SkillConditions');
const CONSTANTS = require('./../../common/constants');
// 技能生效类型
function EFFECTTYPES()
{
    return {
        REDUCETIME:0, //降低时间  -- 绝对值
        REDUCETIMEPERCENT:1, //降低时间 万分比
        REDUCECURRENCY:2,   //降低货币 万分比
        EXTRAPRODUCE:3, // 额外获得一个产物概率 万分比
        PRODUCELIMITED:4, //货物单次生产上限
        SPEEDPRODUCETIME:6, //加速多少时间
        REDUCEENENGY:7, //降低体力
        REDUCEENERGYPERCENT:8, //降低体力 万分比
        ADDANSWER:9,    //增加每日答题邀请次数
        ADDGUANGSHACOMFORT:10, //增加广厦房间舒适度
        ADDENERGYMAX:11, // 增加墨魂体力上限
        ADDSINGLEGACHACNT:12, //增加舒适探索次数
        ADDBASELINGGAN:13, //基础灵感增加
        ADDSHORTORDERITEM:14, //短订单获取梦的数量增加 万分比
        ADDSHORTORDERCURRENCY:15, //短订单获取资材数量增加 万分比
        ADDSUPPLYENERGY:16, //体力恢复道具恢复体力增加
        USEITEMFREE:17, //免费使用道具
        ADDACTIVESKILLTIME:18, //主动技能效果增加
        ADDKICKWRONGANSWERCNT:19, //答题使用帮助去掉错误答案的个数增加
        ADDGIFTEFFECT:20,   //礼物道具默契值增加
        REDUCEACTIVESKILLCD:21, //主动技能冷却时间增加
        ADDSLEEPRESTOREENERGY:22, //增加睡觉恢复体力
        ADDSOULGAMEPOPULARITY:23, //触碰获得人气值
        SOULGAMELOSS2DRAW:24, //魂力玩法 比牌输时有概率算平 万分比
        PRODUCEREDUCEENERGYANDTIME:25, //增加体力消耗 奖励时间 万分比
        PRODUCETYPEFORMULAEXCEPT:26, //生产某系降低体力消耗 某系除外增加体力消耗
        PRODUCEADDLIMITEDREDUCETIME:27, //降低货物单次生产上限 降低生产时间 万分比
        REDUCESLEEPTIME:28, //减少睡觉时长 万分比
        ADDCOSTCURRENCYREDUCEENERGY:29 //增加资材消耗 减少体力消耗 万分比
    }
}

function EFFECTRESULTTYPE() {
    return {
        REDUCETIME:1,  //减少生产时间
        REDUCETIMEPERCENT:2,  //减少生产时间 万分比
        REDUCECURRENCY:3, //减少资材消耗
        REDUCECURRENCYPERCENT:4, //减少资材消耗 万分比
        REDUCEENERGY:5, //减少体力
        REDUCEENERGYPERCENT:6, //减少体力消耗 万分比
        PRODUCELIMITED:7, //增长单次生产上限
        EXTRAPRODUCE:8, //有概率额外获取一个产物
        SPEEDPRODUCETIME:9, //主动技能加速效果提升
        ADDANSWERCNT:10, //增加答题邀请次数
        ADDGUANGSHACOMFORT:11, //增加广厦房间舒适度
        ADDENERGYMAX:12, //增加体力上限
        ADDSINGLEGACHACNT:13, //增加单次探索次数
        ADDBASELINGGAN:14, //增加基础灵感
        ADDSHORTORDERITEM:15, //增加短订单获取道具数量 万分比
        ADDSHORTCURRENCY:16, //增加短订单获取资材数量 万分比
        ADDSUPPLYENERGY:17, //增加补充体力
        USEITEMFREE:18, //增加免费使用道具
        ADDACTIVESKILLTIME:19, //增加主动技能时间效果时间
        ADDKICKWRONGANSWERCNT:20, //帮助使用剔除帮助个数
        ADDGIFTEFFECT:21, //增加礼物效果
        REDUCEACTIVESKILLCD:22, //减少主动技能冷却时间
        ADDSLEEPRESTOREENERGY:23, //增加睡觉恢复体力数值
        ADDSOULGAMEPOPULARITY:24, //增加魂力玩法人气值
        SOULGAMELOSS2DRAW:25, //有概率将输算平
        REDUCESLEEPTIME:26 //减少睡觉时长 万分比
    }
}

// 技能生效条件系统
function EFFECTSYS ()
{
    return {
        DEFAULT: 0,  //默认
        PRODUCE: 1, //生产
        GUANGSHA:2, //广厦
        INSPIRATION:3, //灵感
        SOULGAME:4, //魂力
        ANSWER:5, //答题
        GACHA:7, // 探索
        SHORTORDER:8 //短订单
    }
}

// 技能生效条件类型
function EFFECTCONDTYPE () {
    return  {
        DEFAULT:0, //无条件
        ACCOUNTLEVEL:1, //账号等级
        WORKWITH:2,      //与墨魂共同工作
        WORKFORMULABYID:3,//生产指定的配方
        WORKFORMULATYPE:4,   //生产指定类型的配方
        PRODUCEMORE:5, //单次生产超过
        RPODUCELESS:6, //单次生产小于
        ASSIGNED:7, //入住
        SLEEP:8, //睡觉
        ASSIGNEDWITHHEROES:9, //与其他墨魂一起睡觉
        HAVEHREONUM:11, //总拥有墨魂数量超过
        HAVEHEROIDS:12 //拥有指定墨魂
    }
}

/**
 * checkSkillStudyTermValid - 技能学习条件验证
 * @param {*} heroAttrs
 * @param {*} skillId
 * @param {*} callback
 */
function checkSkillStudyTermValid(heroAttrs, skillId, callback)
{
    Skills.getStudyTermsMapConfig(skillId, termMap => {
        var ret = 0;
        for ([type, value] of termMap) {
            if (type === 0) {
                // 魂力阶段（level)
                if (heroAttrs.level < value) ret = -1;
            }
        }
        callback(ret);
    });
}

/**
 * checkSkillCostValid - 技能消耗验证
 * @param {*} heroAttrs
 * @param {*} skillId
 * @param {*} callback { ret, costData }
 */
function checkSkillCostValid(heroAttrs, skillId, callback)
{
    Skills.getCostTermsMapConfig(skillId, costMap => {
        var ret = 0, costData = {};
        for ([type, value] of costMap) {
            if (type === 0) {
                // 体力
                if (heroAttrs.energy < type) ret = -1; // 体力不足
                costData.energy = value;
            } else if (type === 1) {
                // 心情
                if (heroAttrs.emotion < type) ret = -2;
                costData.emotion = value;
            }
        }
        callback({
            ret: ret,
            costData: costData
        });
    });
}

// 检测参数配置墨魂是否满足墨魂队列
function checkIsAllParamsMatched (param1, param2, param3, param4, heroIdGroup) {
    let match = true;
    if (match && param1 !== 0) {
        if (heroIdGroup.indexOf (param1) === -1) {
            match = false;
        }
    }
    if (match && param2 !== 0) {
        if (heroIdGroup.indexOf (param2) === -1) {
            match = false;
        }
    }
    if (match && param3 !== 0) {
        if (heroIdGroup.indexOf (param3) === -1) {
            match = false;
        }
    }
    if (match && param4 !== 0) {
        if (heroIdGroup.indexOf (param4) === -1) {
            match = false;
        }
    }
    return match;
}

// 检测对应系统下的条件是否满足
async function checkSkillMatchCondition (clsHero, sysType, cond, skillId, heroIdGroup, params) {
    let condition = SkillConditions.getSkillCondition(cond)
    if (condition === null) return false; // 未找到配置的条件 算不满足条件
    if (sysType === condition.SysType) {
        let conType = condition.Type;
        if (conType === EFFECTCONDTYPE ().DEFAULT)  {
            return true;
        }else if (conType === EFFECTCONDTYPE ().ACCOUNTLEVEL) {
            return true;
        }else if (conType === EFFECTCONDTYPE ().WORKWITH) {
            return heroIdGroup != null && checkIsAllParamsMatched (condition.ConditionParam1, condition.ConditionParam2, condition.ConditionParam3, condition.ConditionParam4, heroIdGroup);
        }else if (conType === EFFECTCONDTYPE ().WORKFORMULABYID) {
            return params != null && (condition.ConditionParam1 === params.formulaId || condition.ConditionParam1 === 0)
        }else if (conType === EFFECTCONDTYPE ().WORKFORMULATYPE) {
            return params != null && (condition.ConditionParam1 === params.bid || condition.ConditionParam1 === 0)
        }else if (conType === EFFECTCONDTYPE ().PRODUCEMORE) {
            if (params != null && params.effSkillList != null && params.effSkillList.indexOf (skillId) !== -1) {
                return true;
            }else {
                //if (params != null && params.workstart != null && params.workstart) {
                if (params != null && params.count != null) {
                    if (params.count >= condition.ConditionParam1) {
                            return true;
                    }
                }
                return false;
            }
        }else if (conType === EFFECTCONDTYPE ().RPODUCELESS) {
            if (params != null && params.effSkillList != null && params.effSkillList.indexOf (skillId) !== -1) {
                return true;
            }else {
                if (params != null && params.count != null) {
                    if (params.count < condition.ConditionParam1) {
                        return true;
                    }
                }
                return false;
            }
        }else if (conType === EFFECTCONDTYPE ().ASSIGNED) {
            if (params != null && params.roomlevel != null && (params.roomlevel >= condition.ConditionParam1  || condition.ConditionParam1 === 0)) {
                return true;
            }else {
                return false;
            }
        }else if (conType === EFFECTCONDTYPE ().SLEEP) {
            if (params != null && params.sleeptype != null && (condition.ConditionParam1 === params.sleeptype || condition.ConditionParam1 === 0)) {
                return true;
            }else {
                return false;
            }
        }else if (conType === EFFECTCONDTYPE ().ASSIGNEDWITHHEROES) {
            return heroIdGroup != null && checkIsAllParamsMatched (condition.ConditionParam1, condition.ConditionParam2, condition.ConditionParam3, condition.ConditionParam4, heroIdGroup);
        }else if (conType === EFFECTCONDTYPE ().HAVEHREONUM) {
            let haveCnt = await clsHero.checkHaveHeroesCnt ();
            return haveCnt >= condition.ConditionParam1;
        }else if (conType === EFFECTCONDTYPE ().HAVEHEROIDS) {
            let checkHeroIds = []
            if (condition.ConditionParam1 !== 0) checkHeroIds.push(condition.ConditionParam1)
            if (condition.ConditionParam2 !== 0) checkHeroIds.push(condition.ConditionParam2)
            if (condition.ConditionParam3 !== 0) checkHeroIds.push(condition.ConditionParam3)
            if (condition.ConditionParam4 !== 0) checkHeroIds.push(condition.ConditionParam4)
            return await clsHero.checkHaveTargetHeroes (checkHeroIds);
        }else {
            return false;
        }
    }else {
        return false;
    }
}

async function checkSkillMatchConditionBySkillId (clsHero, skillId, Condition, sys, heroIdGroup, param) {
    for (let cond of Condition) {
        let reachCond = await checkSkillMatchCondition(clsHero, sys, cond, skillId, heroIdGroup, param);
        if (!reachCond) {
            return false
        }
    }
    return true
}

function addSkillEffectByEffectType (buffData, resultType, addValue, percent){
    if (buffData == null) buffData = {}
    if (percent) { addValue = addValue;}
    if (buffData[resultType] == null) {
        buffData[resultType] = {}
        buffData[resultType].value = addValue;
    }else {
        buffData[resultType].value = buffData[resultType].value + addValue;
    }
}

async function calcActiveSkillEffect (skillEffectId, effBuffData, param) {
    return new Promise(resolve => {
        let effConfig = SkillEffects.getSkillEffect(skillEffectId);
        if (effConfig != null) {
            let effType = effConfig.EffectType
            if (effType === EFFECTTYPES().REDUCETIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCETIME, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().REDUCETIMEPERCENT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCETIMEPERCENT, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().REDUCECURRENCY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCECURRENCYPERCENT, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().EXTRAPRODUCE) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().EXTRAPRODUCE, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().PRODUCELIMITED) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().PRODUCELIMITED, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().SPEEDPRODUCETIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().SPEEDPRODUCETIME, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().REDUCEENENGY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGY, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().REDUCEENERGYPERCENT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().ADDANSWER) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDANSWERCNT, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDGUANGSHACOMFORT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDGUANGSHACOMFORT, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDENERGYMAX) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDENERGYMAX, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDSINGLEGACHACNT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSINGLEGACHACNT, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDBASELINGGAN) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDBASELINGGAN, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDSHORTORDERITEM) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSHORTORDERITEM, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().ADDSHORTORDERCURRENCY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSHORTCURRENCY, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().ADDSUPPLYENERGY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSUPPLYENERGY, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().USEITEMFREE) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().USEITEMFREE, effConfig.EffectParam1, false);
                effBuffData[EFFECTRESULTTYPE().USEITEMFREE].extra = effConfig.EffectParam2
            } else if (effType === EFFECTTYPES().ADDACTIVESKILLTIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDACTIVESKILLTIME, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDKICKWRONGANSWERCNT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDKICKWRONGANSWERCNT, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDGIFTEFFECT) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDGIFTEFFECT, effConfig.EffectParam1, true);
                effBuffData[EFFECTRESULTTYPE().ADDGIFTEFFECT].extra = effConfig.EffectParam2
            } else if (effType === EFFECTTYPES().REDUCEACTIVESKILLCD) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEACTIVESKILLCD, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDSLEEPRESTOREENERGY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSLEEPRESTOREENERGY, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().ADDSOULGAMEPOPULARITY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().ADDSOULGAMEPOPULARITY, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().SOULGAMELOSS2DRAW) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().SOULGAMELOSS2DRAW, effConfig.EffectParam1, false);
            } else if (effType === EFFECTTYPES().PRODUCEREDUCEENERGYANDTIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam1, true);
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCETIMEPERCENT, effConfig.EffectParam2, true);
            } else if (effType === EFFECTTYPES().PRODUCETYPEFORMULAEXCEPT) {
                if (effConfig.EffectParam1 === 0 || effConfig.EffectParam1 === param.bid) {
                    addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam2, true);
                } else {
                    addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam3, true);
                }
            } else if (effType === EFFECTTYPES().PRODUCEADDLIMITEDREDUCETIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().PRODUCELIMITED, effConfig.EffectParam1, false);
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam2, true);
            } else if (effType === EFFECTTYPES().REDUCESLEEPTIME) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCESLEEPTIME, effConfig.EffectParam1, true);
            } else if (effType === EFFECTTYPES().ADDCOSTCURRENCYREDUCEENERGY) {
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCECURRENCYPERCENT, effConfig.EffectParam1, true);
                addSkillEffectByEffectType(effBuffData, EFFECTRESULTTYPE().REDUCEENERGYPERCENT, effConfig.EffectParam2, true);
            }
            resolve(0);
        } else {
            resolve(0);
        }
    });
}

async function checkHeroActiveSkillEffectBySkillId (clsHero, sys, skillId, heroIdGroup, param)
{
    return new Promise( async resolve =>  {
        let skillConfigData = Skills.getSkillCheckConfigData (skillId);
        let isMatchCondition = false
        let effBuffData = {}
        let effSkillList = [];
        if (skillConfigData != null && skillConfigData.Level >= 1 && skillConfigData.Type === Skills.SkillType().ACTIVE) {
            if (skillConfigData.Condition == null || skillConfigData.Condition.length <= 0) {
                isMatchCondition = true;
            } else {
                isMatchCondition = await checkSkillMatchConditionBySkillId(clsHero, skillId, skillConfigData.Condition, sys, heroIdGroup, param);
            }
        }
        if (isMatchCondition) {
            effSkillList.push(skillId);
            await calcActiveSkillEffect (skillConfigData.EffectID, effBuffData, param)
        }
        resolve ({effSkillList:effSkillList, effBuffData:effBuffData});
    });
}

// 效验系统的技能是否生效 需要判断对应的技能对应的条件来判断
// 判断后如果技能生效
async function checkHeroActiveSkillEffects (clsHero, sys, skillList, heroIdGroup, param) {
    return new Promise(async resolve => {
        let effSkillList = [];
        let effBuffData = {};
        for (let skillId of skillList) {
            let isMatchCondition = false
            let skillConfigData = Skills.getSkillCheckConfigData (skillId);
            if (skillConfigData != null && skillConfigData.Level >= 1 && skillConfigData.Type !== Skills.SkillType().ACTIVE) {
                if (skillConfigData.Condition == null || skillConfigData.Condition.length <= 0) {
                    isMatchCondition = true
                } else {
                    isMatchCondition = await checkSkillMatchConditionBySkillId(clsHero, skillId, skillConfigData.Condition, sys, heroIdGroup, param);
                }
            }
            if (isMatchCondition) {
                effSkillList.push(skillId);
                await calcActiveSkillEffect (skillConfigData.EffectID, effBuffData, param)
            }
        }
        resolve ({effSkillList:effSkillList, effBuffData:effBuffData});
    });
}

// 计算传入列表中 所有墨魂的生效技能有技能效果信息
async function calcHeroesActiveSkillEffects(clsHero, sys, heroIdGroup, heroSkillGroup, params) {
    function getHeroList (hid, skillGroup) {
        for (let i in skillGroup) {
            if (skillGroup[i].hid === hid) {
                return skillGroup[i].skillList
            }
        }
        return null
    }

    return new Promise( async resolve => {
        let heroSkillGroupResult = [];
        let heroBuffGroupResult = [];
        for (let heroId of heroIdGroup) {
            let skillList = getHeroList(heroId, heroSkillGroup);
            if (skillList != null) {
                let retData = await checkHeroActiveSkillEffects(clsHero, sys, skillList, heroIdGroup, params[heroId]);
                heroSkillGroupResult.push({hid: heroId, effSkillList: retData.effSkillList})
                heroBuffGroupResult.push({hid: heroId, effBuffData: retData.effBuffData})
            }
        }
        resolve ({heroSkillGroup:heroSkillGroupResult, heroBuffGroup:heroBuffGroupResult})
    });
}


// 单个系统针对单个墨魂做技能生效判定
async function calcHeroActiveSkillEffects(clsHero, sys, heroId, params) {
    return new Promise( async resolve => {
        let heroIdGroup = []; heroIdGroup.push(heroId);
        clsHero.getSkillListByGroup (heroIdGroup, async skillList => {
            if (skillList != null && skillList.length >= 1) {
                let effectData = await checkHeroActiveSkillEffects(clsHero, sys, skillList, heroIdGroup, params);
                resolve ({effSkillList:effectData.effSkillList, effBuffData:effectData.effBuffData})
            }
        });
    });
}

// 验证技能最大等级 根据配置父技能 关联的所有技能项来计算
function checkSkillLevelMaxValid(skillId, callback)
{
    var skillLevel = Skills.getSkillLevelById(skillId);
    Skills.getMaxLevelSkillLevel (skillId, maxLevel => {
        callback (skillLevel < maxLevel);
    });
}

exports.EFFECTSYS = EFFECTSYS;
exports.EFFECTTYPES = EFFECTTYPES;
exports.EFFECTCONDTYPE = EFFECTCONDTYPE;
exports.EFFECTRESULTTYPE = EFFECTRESULTTYPE;
exports.checkSkillLevelMaxValid = checkSkillLevelMaxValid;
exports.checkSkillCostValid = checkSkillCostValid;
exports.checkSkillStudyTermValid = checkSkillStudyTermValid;
exports.calcHeroesActiveSkillEffects = calcHeroesActiveSkillEffects;
exports.checkHeroActiveSkillEffectBySkillId = checkHeroActiveSkillEffectBySkillId;
exports.calcHeroActiveSkillEffects = calcHeroActiveSkillEffects; //单墨魂技能生效判断