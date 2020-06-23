const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const models = require('./../models');
const fixedController = require('./../controllers/fixedController');
const ItemConfig = fixedController.Items;
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const itemController = require('./../controllers/itemController');
const dormController = require('./../controllers/dormController');
const taskController = require('./../controllers/taskController');
const pursueTreeController = require('./../controllers/pursueTreeController');
const HeroClassUp = require('./../../designdata/HeroClassUp');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * HeroEating - 墨魂进食
 * @param {*} request body { httpuuid, uuid, hid }
 * @param {*} response { httpuuid, uuid, hid, addHungry, currency }
 */
function HeroEating(request, response)
{
    // 判断是否有该墨魂
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.httpuuid && request.body.uuid && request.body.hid) {
        let hero = new heroController(request.body.uuid, request.body.hid,request.multiController, request.taskController);
        hero.checkHero(function (stat) {
            if (stat) {
                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                // 获取饱食值
                player.getCurrencyByType(playerController.CURRENCYTYPES().HUNGRY, function (currencyHungry) {
                    if (currencyHungry > 0) {
                        // 判断墨魂饱食度是否达到上限
                        hero.getLevel(function (heroLevel) {
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(request.body.hid, heroLevel, HeroAttrDefault => {
                                var minHungry, maxHungry;
                                [minHungry, maxHungry] = HeroAttrDefault.hungry;
                                if (minHungry && maxHungry) {
                                    hero.getAttrHungry(function (valHungry) {
                                        let diffHungry = maxHungry - valHungry;
                                        if (diffHungry > 0) {
                                            let addHungry = ((valHungry-diffHungry) <= 0) ? valHungry : diffHungry;
                                            // 增加属性饱食度
                                            hero.addAttrHungry(addHungry, function (v) {
                                                // 扣除货币饱食值
                                                player.costCurrencyMulti([0,0,addHungry], function (newCurrency) {
                                                    respData.hid = request.body.hid;
                                                    respData.addHungry = addHungry;
                                                    respData.currency = newCurrency;
                                                    request.multiController.save(async function(err,data){
                                                        if(err){
                                                            respData.code = ERRCODES().FAILED;
                                                            player.errorHandle()
                                                            return  protocol.responseSend(response, respData);
                                                        }
    
                                                        respData.taskEventData = [];
                                                        respData.taskList = [];
                                                        try {
                                                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                            respData.taskEventData = taskEventData;
                                                            respData.taskList = taskList;
                                                        }catch (e) {
                                                            respData.code = ERRCODES().FAILED;
                                                            return  protocol.responseSend(response, respData);
                                                        }
                                                        protocol.responseSend(response, respData);
                                                    })
                                                });
                                            }, true);
                                        } else {
                                            // 不需要进食
                                            respData.code = ERRCODES().HERO_EATING_FULL;
                                            protocol.responseSend(response, respData);
                                        }
                                    });
                                } else {
                                    // 策划数据异常
                                    respData.code = ERRCODES().FAILED;
                                    protocol.responseSend(response, respData);
                                }
                            });
                        });
                    } else {
                        // 饱食值不足
                        respData.code = ERRCODES().HERO_HUNGRY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 没有该墨魂
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * HeroSendGift - 墨魂送礼
 * @param {*} request body { httpuuid, uuid, hid, itemId, itemCount }
 * @param {*} response {httpuuid, uuid, hid, itemId, itemCount, addVal, attrs}
 */
function HeroSendGift(request, response)
{
    // 任务相关（送礼）
    function taskCounterSendGift(uuid, hid, itemId, callback) {
        taskController.getTaskDataFromSource(uuid, TaskData => {
            taskController.addTaskCounter(TaskData, uuid, 701, [hid, itemId], () => {
                taskController.addTaskCounter(TaskData, uuid, 703, [hid], () => {
                    taskController.getCounterDataByTypeGroup(uuid, [701, 702, 703], taskEventData => {
                        taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                            callback(taskEventData);
                        });
                    }, TaskData);
                }, 1, false);
            });
        });
    }

    // 判断是否有该墨魂
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.httpuuid && request.body.uuid && request.body.hid &&
            request.body.itemId && request.body.itemCount) {
        let hero = new heroController(request.body.uuid, request.body.hid,request.multiController, request.taskController);
        // 判断墨魂
        hero.checkHero(function (heroStat) {
            if (heroStat) {
                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                let costItems = [{id:request.body.itemId, count:request.body.itemCount}];
                // 判断背包道具
                player.itemValid(costItems, function (itemStat) {
                    if (itemStat) {
                        // 使用道具
                        hero.getAttrLevel(function (heroLevel) {
                            itemController.useItem(request.body.uuid, request.body.hid, heroLevel,
                                    request.body.itemId, request.body.itemCount, request.multiController, request.taskController, function (data) {
                                if (data.ret >= 0) {
                                    // 消耗道具
                                    player.costItem(costItems, function (items) {
                                        respData.hid        = request.body.hid;
                                        respData.itemId     = request.body.itemId;
                                        respData.itemCount  = request.body.itemCount;
                                        respData.addVal     = data.addVal;
                                        respData.attrs      = data.newAttrs;
                                        if (data.newSendGift) respData.newSendGift = data.newSendGift;
    
                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GiftSend,[{params:[request.body.hid, request.body.itemId]}]);
                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GiftSendTimes,[{params:[request.body.hid]}]);

                                        // [701, 702, 703]
                                        // taskCounterSendGift(request.body.uuid, request.body.hid, request.body.itemId,   taskEventData => {
                                        //     respData.taskEventData = taskEventData;
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                respData.taskEventData = [];
                                                respData.taskList = [];
                                                try {
                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                    respData.taskEventData = taskEventData;
                                                    respData.taskList = taskList;
                                                }catch (e) {
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                protocol.responseSend(response, respData);
                                            })
                                            async.parallel({
                                                "itemLogBindMohun":async function (cb) {
                                                    await request.logServer.itemLogBindMohun({uuid:request.body.uuid,
                                                        actionId: request.Const.actions.gift,
                                                        cost:costItems, gain:[],
                                                        heroId: request.body.hid,
                                                        functionId: request.Const.functions.sendGift
                                                    });                                                        cb(1)
                                                },
                                                "ParticipatLog": async function(cb){
                                                    await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.sendGift]);
                                                    cb(1)
                                                }
                                            },function (err,results) {
                                            })
                                        // });
                                    });
                                } else if (data.ret == -5) {
                                    // 达到上限（正常扣除消耗）
                                    player.costItem(costItems, () => {
                                        respData.hid = request.body.hid;
                                        respData.itemId = request.body.itemId;
                                        respData.itemCount = request.body.itemCount;
                                        respData.addVal = 0;
                                        respData.attrs = data.newAttrs;
                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GiftSend,[{params:[request.body.hid, request.body.itemId]}]);
                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GiftSendTimes,[{params:[request.body.hid]}]);
                                        
                                        // taskCounterSendGift(request.body.uuid, request.body.hid, request.body.itemId, taskEventData => {
                                        //     respData.taskEventData = taskEventData;
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                respData.taskEventData = [];
                                                respData.taskList = [];
                                                try {
                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                    respData.taskEventData = taskEventData;
                                                    respData.taskList = taskList;
                                                }catch (e) {
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                
                                                protocol.responseSend(response, respData);
                                            })
                                        // });
                                    });
                                } else {
                                    // 不是消耗道具
                                    respData.code = ERRCODES().ITEM_NOT_CONSUME;
                                    protocol.responseSend(response, respData);
                                }
                            });
                        });
                    } else {
                        // 道具不足
                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 没有该墨魂
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        // 客户端参数错误
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * GuideSendHero - 新手引导赠送墨魂
 * @param {*} request body {httpuuid, uuid, heroId, bonusattrs, dormId}
 * @param {*} response {httpuuid, uuid, heroId, mhdata, dormdatas}
 */
function GuideSendHero (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <=  0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else {
        let heroId = request.body.heroId;
        let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
        hero.checkHero (heroStat => {
            if (heroStat) {
                respData.code = ERRCODES().PLAYER_IS_ALREADY_HAVE;
                protocol.responseSend(response, respData);
            }else {
                hero.createHeroWithBonusAttrs (request.body.bonusattrs, mhdata => {
                    // taskController.getCounterDataByTypeGroup(request.body.uuid, [101, 102], taskEventData => {
                    //     respData.taskEventData = taskEventData;
                        respData.mhdata = mhdata;
                        respData.heroId = heroId;
                        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                        player.setEnterMohun (heroId, _ => {
                            if (request.body.dormId != null && request.body.dormId > 0) {
                                let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                                dorm.setCheckinInfo (heroId, request.body.dormId, retData => {
                                    if (retData.status == 1) {
                                        respData.code = ERRCODES().DORM_DOOR_IS_NOT_REPAIRED;
                                        protocol.responseSend(response, respData);
                                    }else if (retData.status == 2) {
                                        respData.code = ERRCODES().DORM_DOOR_ALREADY_IN_TARGET_DOOR;
                                        protocol.responseSend(response, respData);
                                    }else if (retData.status == 3) {
                                        respData.code = ERRCODES().DORM_DOOR_NOT_SAME_GENDER;
                                        protocol.responseSend(response, respData);
                                    }else if (retData.status == 4) {
                                        respData.code = ERRCODES().DORM_DOOR_REACH_CAPACITY;
                                        protocol.responseSend(response, respData);
                                    }else {
                                        respData.dorminfo = retData.dorminfo;
                                        let newStat = heroController.STATS().HOUSEHOLD;
                                        hero.setStat (newStat, _ => {
                                            respData.updateStat = { hid: heroId, stat: newStat};
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
    
                                                respData.taskEventData = [];
                                                respData.taskList = [];
                                                try {
                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                    respData.taskEventData = taskEventData;
                                                    respData.taskList = taskList;
                                                }catch (e) {
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                protocol.responseSend(response, respData);
                                            })
                                        });
                                    }
                                });
                            }else{
                                protocol.responseSend(response, respData);
                            }
                        });
                    // });
                });
            }
        });
    }
}

// 设置墨魂皮肤
// request { httpuuid, uuid, heroId, skinId }
function HeroSettingSkin(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);

    var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
    // 验证墨魂皮肤
    hero.checkSkinValid(request.body.skinId, skinValid => {
        if (skinValid) {
            // 设置墨魂皮肤
            hero.setSkinDefault(request.body.skinId, () => {
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        return  protocol.responseSend(response, respData);
                    }
                    respData.taskEventData = [];
                    respData.taskList = [];
                    try {
                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                        respData.taskEventData = taskEventData;
                        respData.taskList = taskList;
                    }catch (e) {
                        respData.code = ERRCODES().FAILED;
                        return  protocol.responseSend(response, respData);
                    }
                    protocol.responseSend(response, respData);
                })
            });
        } else {
            // 该墨魂没有此皮肤
            respData.code = ERRCODES().HERO_NO_SKIN;
            protocol.responseSend(response, respData);
        }
    });
}

// 墨魂升级（突破）
// request { httpuuid, uuid, heroId }
function HeroToLevelUp(request, response)
{
    var heroLevelMax = 5;

    // 根据魂力升级
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
    // 获取当前的等级
    hero.getAttrLevel(currHeroLevel => {
        if (currHeroLevel < heroLevelMax) {
            // 获取属性值区间数据（配置）
            HeroClassUp.getNeedClassUpConfig(request.body.heroId, currHeroLevel+1, HeroClassConfig => {
                var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                player.currencyMultiValid(HeroClassConfig.NeedCost.currency, currencyValid  => {
                    if (currencyValid) {
                        player.itemValid(HeroClassConfig.NeedCost.items, itemValid => {
                            if (itemValid) {
                                // 获取当前魂力
                                hero.getAttrFeel(currHeroFeel => {
                                    if (currHeroFeel >= HeroClassConfig.NeedFeel) {
                                        // 可以升级1级
                                        currHeroLevel += 1; // 等级上升
                                        // 设置墨魂魂力（先设置，之后会有奖励属性值）
                                        hero.setAttrFeel(currHeroFeel, () => {
                                            // 设置墨魂等级
                                            hero.setAttrLevel(currHeroLevel, () => {
                                                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                                    player.costCurrencyMulti(HeroClassConfig.NeedCost.currency, newCurrency => {
                                                        respData.currency = newCurrency;
                                                        player.costItem(HeroClassConfig.NeedCost.items, () => {
                                                            respData.costItems = HeroClassConfig.NeedCost.items;
                                                            // 升级后的奖励属性数值
                                                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrValsDefaultConfig(request.body.heroId, currHeroLevel, HeroAttrValsDefault => {
                                                                hero.addAttrs(HeroAttrValsDefault, newHeroAttrs => {
                                                                    respData.attrs = newHeroAttrs;
                                                                    hero.autoUnlockSkill(currHeroLevel, skillList => {
                                                                        respData.skillList = skillList;
    
                                                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params:[request.body.heroId, currHeroLevel]}]);
                                                                        // taskController.addTaskCounter(TaskData, request.body.uuid, 102, [request.body.heroId, currHeroLevel], () => {
                                                                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [2, 102], taskEventData => {
                                                                                // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                                                //     respData.taskEventData = taskEventData;
                                                                                    request.multiController.save(async function(err,data){
                                                                                        if(err){
                                                                                            respData.code = ERRCODES().FAILED;
                                                                                            return  protocol.responseSend(response, respData);
                                                                                        }
                                                                                        respData.taskEventData = [];
                                                                                        respData.taskList = [];
                                                                                        try {
                                                                                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                                                            respData.taskEventData = taskEventData;
                                                                                            respData.taskList = taskList;
                                                                                        }catch (e) {
                                                                                            respData.code = ERRCODES().FAILED;
                                                                                            return  protocol.responseSend(response, respData);
                                                                                        }
                                                                                        protocol.responseSend(response, respData);
                                                                                    })
                                                                                // });
                                                                            // });
                                                                        // });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                // });
                                            });
                                        });
                                    } else {
                                        // 墨魂无法升级
                                        respData.code = ERRCODES().HERO_CANNOT_LEVELUP;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            } else {
                                // 物品不足
                                respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                protocol.responseSend(response, respData);
                            }
                        });
                    } else {
                        // 货币不足
                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            });
        } else {
            // 已达墨魂最大等级
            respData.code = ERRCODES().HERO_LEVELUP_MAX;
            protocol.responseSend(response, respData);
        }
    });
}

// 墨魂4in1
function HeroFourInOne(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.getEnterMohun(nowEnterMohun => {
        if (nowEnterMohun > 0) {
            // 已设置
            respData.code = ERRCODES().HERO_ENTERMOHUN_IS_EXIST;
            protocol.responseSend(response, respData);
        } else {
            fixedController.Heros.checkHeroIdValidConfig(request.body.heroId, heroIdValid => {
                if (heroIdValid) {
                    var hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
                    // 需要判断是否已存在该墨魂
                    hero.checkHeroById(request.body.heroId, heroValid => {
                        if (heroValid) {
                            // 已存在该墨魂
                            respData.code = ERRCODES().HERO_IS_EXIST;
                            protocol.responseSend(response, respData);
                        } else {
                            // 设置4in1头像
                            player.setEnterMohun(request.body.heroId, enterMohun => {
                                respData.entermohun = enterMohun;
                                request.multiController.save(async function(err,data) {
                                    if (err) {
                                        respData.code = ERRCODES().FAILED;
                                        return protocol.responseSend(response, respData);
                                    }
                                    protocol.responseSend(response, respData);
                                });
                                // 4in1奖励墨魂流程调整 4选1只设置当前选择墨魂 后续奖励选择墨魂
                                /*player.setViewMohun(request.body.heroId, viewMohun => {
                                    fixedController.HeroLevelUpTermAndBonus.getHeroAttrConfig(1, heroAttrMap => {
                                        // 加入墨魂（新建墨魂）
                                        var newHero = models.HeroModel(request.body.heroId);
                                        newHero.hid = request.body.heroId;
                                        newHero.stat = heroController.STATS().HOUSEHOLD;
                                        if (heroAttrMap.get(newHero.hid))
                                            newHero.attrs = heroAttrMap.get(newHero.hid);
                                        pursueTreeController.setNodeIdAboutAssistant(request.body.uuid, request.body.heroId, request.multiController, request.taskController,() => {
                                            hero.addHeroGroup([newHero], newAddHeroLis => {
                                                let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                                                dorm.addHeroDormInfo(request.body.uuid, request.body.heroId, newDorm => {
                                                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSettleIn,[{params:[request.body.heroId]}]);
                                                    respData.dorminfo = newDorm;
                                                    respData.viewmohun = viewMohun;
                                                    respData.entermohun = enterMohun;
                                                    respData.heroList = newAddHeroLis;
                                                    request.multiController.save(async function(err,data){
                                                        if(err){
                                                            respData.code = ERRCODES().FAILED;
                                                            return  protocol.responseSend(response, respData);
                                                        }

                                                        try {
                                                            respData.taskEventData = [];
                                                            respData.taskList = [];
                                                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                            respData.taskEventData = taskEventData;
                                                            respData.taskList = taskList;
                                                        }catch (e) {

                                                            console.log(e)
                                                            respData.code = ERRCODES().FAILED;
                                                            return  protocol.responseSend(response, respData);
                                                        }
                                                        protocol.responseSend(response, respData);
                                                    })
                                                });
                                            });
                                        }, hero);
                                    });
                                });;*/
                            })
                        }
                    });
                } else {
                    // 没有该墨魂ID
                    respData.code = ERRCODES().PARAMS_ERROR;
                    protocol.responseSend(response, respData);
                }
            });
        }
    });
}

// 墨魂摸鱼
function HeroGoofOff(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
    hero.checkHero(heroValid => {
        if (heroValid) {
            hero.getHeroGoofOffCount(goofOffCount => {
                hero.setHeroGoofOffCount(goofOffCount + 1, () => {
                    hero.setHeroGoofOffTime((new Date()).getTime(), goofOffTime => {
                        respData.goofOffCount = goofOffCount + 1;
                        respData.goofOffTime = goofOffTime;
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            respData.taskEventData = [];
                            respData.taskList = [];
                            try {
                                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                respData.taskEventData = taskEventData;
                                respData.taskList = taskList;
                            }catch (e) {
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            protocol.responseSend(response, respData);
                        })
                    });
                });
            });
        } else {
            // 墨魂不存在
            respData.code = ERRCODES().HERO_IS_NOT_EXIST;
            protocol.responseSend(response, respData);
        }
    });
}

// 设置墨魂属性
// request { httpuuid, uuid, heroId, attrs }
function HeroSettingAttrs(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
    hero.setHeroAttrs(request.body.attrs, () => {
        respData.heroList = [{hid: request.body.heroId, attrs: request.body.attrs }];
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}


//添加墨魂属性
function addMohunAttrs (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
    hero.addAttrs (request.body.attrs, newAttrs => {
        respData.heroList = [{hid: request.body.heroId, attrs: newAttrs }];
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
    
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}

//获取当前赠送礼物记录
function GetHeroSendGiftRecord (request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid, request.body.heroId, request.multiController, request.taskController);
    hero.getSendGiftDataFromDataSource (sendRecords => {
        respData.sendRecords = sendRecords;
        protocol.responseSend(response, respData);
    });
}

/**
 * HeroUnlockSkin - 墨魂解锁皮肤
 * @param {*} request { heroId, skinId }
 * @param {*} response { costItems, skinData }
 */
function HeroUnlockSkin(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('uuid' in request.body && 'heroId' in request.body && 'skinId' in request.body &&
        'number' === typeof request.body.uuid &&
            'number' === typeof request.body.heroId && 'number' === typeof request.body.skinId) {
        var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
        // 判断墨魂
        hero.checkHero(heroValid => {
            if (heroValid) {
                hero.checkSkinValid(request.body.skinId, skinValid => {
                    if (!skinValid) {
                        var skinItemId = ItemConfig.getSkinItemId(request.body.skinId);
                        if (skinItemId > 0) {
                            // 判断皮肤道具
                            var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                            var costItems = [{ id: skinItemId, count: 1 }];
                            player.itemValid(costItems, itemValid => {
                                if (itemValid) {
                                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                        // 消耗皮肤道具
                                        player.costItem(costItems, () => {
                                            // 加入皮肤
                                            hero.addSkin(request.body.skinId, newSkinData => {
                                                // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                                                //     taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                        respData.costItems = costItems;
                                                        respData.skinData = newSkinData;
                                                        request.multiController.save(async function(err,data){
                                                            if(err){
                                                                respData.code = ERRCODES().FAILED;
                                                                return  protocol.responseSend(response, respData);
                                                            }
    
                                                            respData.taskEventData = [];
                                                            respData.taskList = [];
                                                            try {
                                                                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                                respData.taskEventData = taskEventData;
                                                                respData.taskList = taskList;
                                                            }catch (e) {
                                                                respData.code = ERRCODES().FAILED;
                                                                return  protocol.responseSend(response, respData);
                                                            }
                                                            protocol.responseSend(response, respData);
                                                        })
                                                    // });
                                                // });
                                            });
                                        });
                                    // });
                                } else {
                                    // 道具不足
                                    respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                    protocol.responseSend(response, respData);
                                }
                            });
                        } else {
                            // 皮肤道具不存在
                            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    } else {
                        // 皮肤已解锁
                        respData.code = ERRCODES().HERO_SKIN_OWN;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 没有该墨魂
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * UnlockPursueTreeLevel - 追求树阶段动画展示
 * @param {*} request { heroId, pursueShowLevel }
 * @param {*} response {pursueShowLevel}
 */
function UnlockPursueTreeLevel(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('uuid' in request.body && 'number' === typeof request.body.uuid
    && 'heroId' in request.body && 'number' === typeof request.body.heroId
    && 'pursueShowLevel' in request.body && 'number' === typeof request.body.pursueShowLevel) {
        let pursueTreeLevel = request.body.pursueShowLevel;
        var hero = new heroController(request.body.uuid, request.body.heroId, request.multiController, request.taskController);
        hero.checkHero (heroValid => {
            if (heroValid) {
                hero.unlockPursueTreeLevel(pursueTreeLevel,  _ => {
                    respData.pursueShowLevel = pursueTreeLevel;
                    request.multiController.save(async function(err, data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
    
                        respData.taskEventData = [];
                        respData.taskList = [];
                        try {
                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                            respData.taskEventData = taskEventData;
                            respData.taskList = taskList;
                        }catch (e) {
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
                        
                        protocol.responseSend(response, respData);
                    })
                });
            } else {
                // 没有该墨魂
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }
        });
    }
    else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

exports.HeroEating = HeroEating;
exports.HeroSendGift = HeroSendGift;
exports.GetHeroSendGiftRecord = GetHeroSendGiftRecord;
exports.GuideSendHero = GuideSendHero;
exports.HeroSettingSkin = HeroSettingSkin;
exports.HeroToLevelUp = HeroToLevelUp;
exports.HeroFourInOne = HeroFourInOne;
exports.HeroGoofOff = HeroGoofOff;
exports.HeroSettingAttrs = HeroSettingAttrs;
exports.addMohunAttrs = addMohunAttrs;
exports.HeroUnlockSkin = HeroUnlockSkin;
exports.UnlockPursueTreeLevel = UnlockPursueTreeLevel;
