const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const inspController = require('./../controllers/inspController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const Notification = require('./../controllers/notifController').Notification;
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const inspThemController = require('./../controllers/inspThemController')
const inspCountController = require('./../controllers/inspCountController')
const GameMarketConfig = require('./../../designdata/GameMarket').GameMarketConfig;

const CONSTANTS = require('./../../common/constants');
/**
 * InspirationStart - 解锁灵感主题
 * @param {*} request
 * @param {*} response
 */
//已改成自动解锁废弃
async function InspirationUnlockTheme(request,response)
{
    // 判断是否已经解锁
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    const {themId,uuid} = request.body
    let inspThem = new inspThemController(uuid,request.multiController, request.taskController)
    let ret = await inspThem.unlockThem(themId)
    switch (ret) {
        case -1:
            // 主题已解锁
            respData.code = ERRCODES().INSP_THEME_IS_UNLOCK;
            break;

        case -2:
            // 未达到解锁条件
            respData.code = ERRCODES().INSP_THEME_UNLOCK_NOT_ENOUGH;
            break;
    }
    await request.multiController.savesync();
    // if(!!err){
    //     inspThem.reset()
    //     respData.code = ERRCODES().FAILED;
    //     return protocol.responseSend(response, respData);
    // }
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
}


/**
 * InspirationStart - 播完灵感动画
 * @param {*} request
 * @param {*} response
 */
async function InspirationThemeVideoEnd(request,response)
{
    // 判断是否已经解锁
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    const {themId,uuid} = request.body
    let inspThem = new inspThemController(uuid,request.multiController, request.taskController)
    let code = await inspThem.videoEnd(themId)
    if(code === -1){
        return protocol.improperResponseSend(ERRCODES().INSP_THEME_UNLOCK,response, respData);
    }
    let ret = await request.multiController.savesync()
    if(ret){
        //写入数据错误
       return protocol.improperResponseSend( ERRCODES().FAILED,response, respData);
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
}

/**
 * InspirationStart - 开始灵感
 * @param {*} request
 * @param {*} response
 */
async function InspirationStart(request, response)
{
    // 任务计数相关（灵感）
    function taskCounterInsp(uuid, hid, themeId, callback)
    {
        taskController.getTaskDataFromSource(uuid, TaskData => {
            taskController.addTaskCounter(TaskData, uuid, 181, [hid, themeId], () => {
                taskController.getCounterDataByTypeGroup(uuid, [181], taskEventData => {
                    taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                        callback(taskEventData);
                    });
                }, TaskData);
            });
        });
    }
    const COST_ENERGY = 60;
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.themeId < 1 || request.body.heroId <= 0) {
        return protocol.improperResponseSend( ERRCODES().PARAMS_ERROR,response, respData);
    } else {
        //判断是否解锁
        let promises = [new inspThemController(request.body.uuid, request.multiController, request.taskController),new inspController(request.body.uuid,request.multiController, request.taskController),new inspCountController(request.body.uuid, request.multiController, request.taskController)]
        promises.push(new playerController(request.body.uuid,request.multiController, request.taskController))
        promises.push(new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController))
        let ctls = await Promise.all(promises)
        let inspTheme = ctls[0],insp = ctls[1], inspCountCtl = ctls[2],player = ctls[3],hero = ctls[4]
        if(!inspTheme.checkIsUnlock(request.body.themeId)){
            return protocol.improperResponseSend( ERRCODES().INSP_THEME_UNLOCK,response, respData);
        }

       // 已解锁
        let inspCountRet = await inspCountCtl.checkCountValid()
        if(!inspCountRet){
            return protocol.improperResponseSend( ERRCODES().INSP_COUNT_NOT_ENGOUTH,response, respData);
        }

        // 判断消耗物品（一个胡萝卜）
        // 判断墨魂状态 包含墨魂是否存在的判断
        hero.checkStatValid((statRet, status) => {
            if (statRet == heroController.CHECKSTATS ().VALID) {
                insp.getData(hero, request.body.themeId, request.body.heroId, async (userInspData, inspMapData) => {
                    // 扣除次数
                   let promises = [await inspTheme.setRecomentData(request.body.themeId,request.body.heroId,true), await inspCountCtl.subInspCount(1,true)]
                   let ret = await Promise.all(promises)
                   let inspCount = ret[1]
                   insp.checkPlayIsOverValid(request.body.themeId, isOver => {
                        insp.getExtBuffAp(request.body.themeId, async extAp => {
                            // ==========================================
                            respData.inspCount = inspCount;
                            respData.isOver = isOver;
                            respData.castAp = 60 + extAp;
                            respData.inspActionPoint = userInspData.inspActionPoint;
                            //respData.heroData = { hid: request.body.heroId, attrs: newHeroAttrs };
                            respData.currGridPos = inspMapData.currGridPos;
                            respData.mapData = inspMapData.mapData;

                            if (inspMapData.effSkillList != null) respData.effSkillList = inspMapData.effSkillList;
                            respData.freeItemCnt = inspMapData.freeItemCnt;
                            respData.freeItemId = inspMapData.freeItemId;

                            // ==========================================
    
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.OpenGame_lingGan,[{params:[request.body.heroId, request.body.themeId]}]);
                            // taskCounterInsp(request.body.uuid, request.body.heroId, request.body.themeId, async () => {
                                // respData.taskEventData = taskEventData;
                                request.multiController.save(async function(err,data){
                                    if(err){return protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
                                    
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
                                await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.dreamTravel]);
                            // });
                        });
                    });
                });
            }else if (statRet == heroController.CHECKSTATS ().LOSS) {
                return protocol.improperResponseSend(ERRCODES().HERO_IS_NOT_EXIST,response, respData);
            }else if (statRet == heroController.CHECKSTATS ().VAGRANTNESS) {
                return protocol.improperResponseSend(ERRCODES().HERO_NOT_IN_HOUSE,response, respData);
            }else{
                respData.workStat = status;
                return protocol.improperResponseSend(ERRCODES().HERO_CANNOT_WORK,response, respData);
            }
        });
    }
}

/**
 * InspirationPlayDice - 灵感掷骰子
 * @param {*} request
 * @param {*} response
 */
function InspirationPlayDice(request, response)
{
    // 任务相关（灵感）
    function taskCounterInsp(isOver, uuid, hid, themeId, linggVal, walkList, callback, taskData)
    {
        
        //TODO   request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroCompleteGame_Ins,[{params:[hid, addTotal]}]);
    
    
    
    
        if(isOver){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroCompleteGame_Ins,[{params:[hid, themeId]}]);
        }
    
    
        var evCount = 0;
        for (let i in walkList) {
            if (walkList[i].eventId > 0) {
                ++evCount;
            }
        }
    
        if (evCount > 0) {
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.TriggerStory, [{params:[0],num:evCount,add:false}]);
        }
    
        callback();
    
        // function doCntEvent(tskData, iuuid, walkLis, callback)
        // {
        //     var evCount = 0;
        //     for (let i in walkLis) {
        //         if (walkLis[i].eventId > 0) {
        //             ++evCount;
        //         }
        //     }
        //
        //     if (evCount > 0) {
        //         taskController.addTaskCounter(tskData, iuuid, 183, [0], () => {
        //             callback(183);
        //         }, evCount);
        //     } else {
        //         callback(0);
        //     }
        // }
        //
        // function doOver(tskData, flag, iuuid, ihid, ithemeId, callback)
        // {
        //     if (flag) {
        //         taskController.addTaskCounter(tskData, iuuid, 182, [ihid, ithemeId], () => {
        //             callback();
        //         });
        //     } else {
        //         callback();
        //     }
        // }
        //
        // //taskController.getTaskDataFromSource(uuid, TaskData => {
        //     doOver(taskData, isOver, uuid, hid, themeId, () => {
        //         //taskController.addTaskCounter(taskData, uuid, 184, [0], () => {
        //             doCntEvent(taskData, uuid, walkList, (id) => {
        //                 var paramGroup = [1, 182];
        //                 if (id > 0) paramGroup.push(id);
        //                 taskController.getCounterDataByTypeGroup(uuid, paramGroup, taskEventData => {
        //                     taskController.saveTaskDataFromSource(uuid, taskData, () => {
        //                         callback(taskEventData);
        //                     });
        //                 }, taskData);
        //             });
        //         //}, linggVal, false);
        //     });
        // //});
    }

    let COST_AP = 60; // 需要和默认值表校对

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);

    let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
    insp.checkPlayHeroValid(request.body.themeId, playHeroId => {
        if (playHeroId > 0) {
            insp.checkPlayIsOverValid(request.body.themeId, isOver => {
                if (isOver) {
                    // 游戏已结束
                    // respData.code = ERRCODES().INSP_GAME_IS_OVER;
                    protocol.responseSend(response, respData);
                } else {
                    insp.getExtBuffAp(request.body.themeId, extAp => {
                        insp.isUseItemSomeDice(diceRet => {
                            COST_AP += extAp;
                            if (diceRet) COST_AP = 0; // 如果是任意骰子无需消耗行动力

                            COST_AP = COST_AP < 0 ? 0 : COST_AP;

                            insp.isControlDice(diceTypValid => {
                                //COST_AP = diceTypValid ? 0 : COST_AP;

                                insp.checkInspActionPointValid(COST_AP, apRet => {
                                    if (apRet) {
                                        // 扣除行动力
                                        insp.costInspActionPoint(COST_AP, oldAp => { // 行动力这边有buff
                                            insp.toPlayDice(request.body.themeId, retData => {
                                                let hero = new heroController(request.body.uuid, playHeroId,request.multiController, request.taskController);
                                                // 奖励灵感（灵感奖励+基础灵感奖励）
                                                hero.addAttrLingg(retData.awardData.lingg+retData.awardData.baselingg, _ => {
                                                    // 奖励心情
                                                    hero.addAttrEmotion(retData.awardData.emotion, newAttrs => {
                                                        // 奖励AP
                                                        insp.addLinggTotal(request.body.themeId, retData.awardData.lingg+retData.awardData.baselingg, linggTotal => {
                                                            insp.addInspActionPoint(retData.awardData.ap, newAP => {
                                                                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                                                // 奖励物品
                                                                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                                                    player.addItem(retData.awardData.items, _ => {
                                                                        // 奖励货币
                                                                        player.addCurrencyMulti(retData.awardData.currency, newCurrency => {
                                                                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [1], taskEventData => {
                                                                            //     respData.taskEventData = taskEventData;
                                                                                insp.checkPlayIsOverValid(request.body.themeId, isOver => {
                                                                                    taskCounterInsp(isOver, request.body.uuid, playHeroId, request.body.themeId,
                                                                                        retData.awardData.lingg+retData.awardData.baselingg, retData.walkData, () => {
                                                                                            // respData.taskEventData = taskEventData;
                                                                                            respData.isOver = isOver;
                                                                                            respData.castAp = COST_AP;
                                                                                            respData.inspActionPoint    = oldAp;
                                                                                            respData.diceNum            = retData.diceData;
                                                                                            respData.currGridPos        = retData.currGridPos;
                                                                                            respData.walkGridData       = retData.walkData;
                                                                                            respData.attrs              = newAttrs;
                                                                                            respData.currency           = newCurrency;
                                                                                            respData.addItems           = retData.awardData.items;
                                                                                            respData.linggTotal         = linggTotal; // 总灵感
                                                                                            if (respData.isOver) {
                                                                                                // 需要全部奖励信息
                                                                                                insp.getAwardAll(request.body.themeId, async (allAwardData, overAwardData) => {
                                                                                                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetIns,[{params:[0],num:linggTotal,add:false}]);
                                                                                                    // taskController.addTaskCounter(TaskData, request.body.uuid, 184, [0], () => {
                                                                                                    //     taskController.getCounterDataByTypeGroup(request.body.uuid, [184], taskEventData => {
                                                                                                    //         respData.taskEventData = taskEventData;
                                                                                                    //         taskController.saveTaskDataFromSource(request.body.uuid, TaskData, async() => {
                                                                                                                respData.allAwardData = allAwardData;
                                                                                                                respData.overAwardData = overAwardData;
                                                                                                                request.multiController.save(async function(err,data){
                                                                                                                    if(err){
                                                                                                                        return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);
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
                                                                                                                await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.dreamEnd,themeId:request.body.themeId,insp:respData.linggTotal,heroId:playHeroId})
                                                                                                            // });
                                                                                                        // }, TaskData);
                                                                                                    // }, linggTotal, false);
                                                                                                });
                                                                                            } else {
                                                                                                request.multiController.save(async function(err,data){
                                                                                                    if(err){
                                                                                                        return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);
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
                                                                                            }
                                                                                        });
                                                                                });
                                                                            // });
                                                                        });
                                                                    });
                                                                // });
                                                            });
                                                        });
                                                    });
                                                });

                                                /*
                                                insp.doDice(request.body.themeId, (diceData, walkGridList) => {
                                                    insp.getCurrGridPos(request.body.themeId, currGridPos => {
                                                        respData.inspActionPoint = newAP;
                                                        respData.diceNum = diceData;
                                                        respData.currGridPos = currGridPos;
                                                        respData.walkGridData = walkGridList;
                                                        protocol.responseSend(response, respData);
                                                    });
                                                });*/
                                            });
                                        });
                                    } else {
                                        // 行动力不足
                                        return  protocol.improperResponseSend(ERRCODES().INSP_AP_NOT_ENGOUTH,response, respData);
                                    }
                                });
                            });
                        });
                    });
                }
            });
        } else {
            // 没有上阵墨魂
            return  protocol.improperResponseSend(ERRCODES().INSP_PLAY_HERO_NONE,response, respData);
        }
    });
}

/**
 * InspirationUnlockTheme - 灵感解锁主题
 * @param {*} request body { themeId }
 * @param {*} response
 */
/*
function InspirationUnlockTheme(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.themeId < 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        // 获取消耗
        let insp = new inspController(request.body.uuid);
        // 是否已解锁
        insp.checkThemeUnlockValid(request.body.themeId, themeRet => {
            if (!themeRet) {
                insp.getUnlockThemeCost(request.body.themeId, costData => {
                    let player = new playerController(request.body.uuid);
                    // 判断货币
                    player.currencyMultiValid(costData.currency, currencyRet => {
                        if (currencyRet) {
                            // 判断物品
                            //player.itemValid(costData.items, itemRet => {
                            //    if (itemRet) {
                                    insp.unlockTheme(request.body.themeId, themeList => {
                                        // 消耗货币
                                        player.costCurrencyMulti(costData.currency, newCurrency => {
                                            // 消耗物品
                                            //player.costItem(costData.items, _ => {
                                                respData.themeList = themeList;
                                                respData.currency = newCurrency;
                                                //respData.costItems = costData.items;
                                                protocol.responseSend(response, respData);
                                            //});
                                        });
                                    }, true);
                            //    } else {
                            //        // 物品不足
                            //        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                            //        protocol.responseSend(response, respData);
                            //    }
                            //});
                        } else {
                            // 货币不足
                            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    });
                });
            } else {
                // 该主题已被解锁过
                respData.code = ERRCODES().INSP_THEME_IS_UNLOCK;
                protocol.responseSend(response, respData);
            }
        });
    }
}*/

/**
 * InspirationUseItem - 灵感使用道具
 * @param {*} request body { httpuuid, uuid, themeId, itemId, itemCount }
 * @param {*} response
 */
function InspirationUseItem(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let ADD_AP = 100; // 需要和道具表校对
    if (request.body.themeId < 1 || request.body.itemId <= 0 || request.body.itemCount <= 0) {
        // 参数错误
        return  protocol.improperResponseSend(ERRCODES().PARAMS_ERROR,response, respData);
    } else {
        let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
        insp.getThemeDataUsingThemeId (request.body.themeId, async (themeDatas, inspData) => {
            if (themeDatas && inspData) {
                let isOver = (inspData.currGridPos === inspData.mapData.length);
                if (!isOver) {
                    let freeItemCnt = inspData.freeItemCnt;
                    let freeItemId = inspData.freeItemId;
                    let canUseItemFree = freeItemCnt != null && freeItemId != null && freeItemCnt >= 1 && (freeItemId === 0 || freeItemId === request.body.itemId);
                    if (canUseItemFree) {
                        freeItemCnt -= 1; inspData.freeItemCnt = freeItemCnt;
                        await insp.setThemeData (request.body.themeId, inspData);
                        // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], async taskEventData => {
                        //     respData.taskEventData = taskEventData;
                            var useItem = { id: request.body.itemId, count: request.body.itemCount };
                            if (useItem.id === 440003) { // 说明是行动力药水
                                await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.rejuvenationPotions,themeId:request.body.themeId})
                                insp.addInspActionPoint(ADD_AP, newAP => {
                                    respData.inspActionPoint    = newAP;
                                    respData.itemId             = request.body.itemId;
                                    respData.itemCount          = 0;
                                    respData.freeItemCnt        = freeItemCnt;
                                    respData.freeItemId         = freeItemId;
                                    request.multiController.save(async function(err,data){
                                        if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                                // 加入使用物品列表中（在掷骰子中去真正触发效果）
                                if (useItem.id === 440004) {useItem.count = request.body.diceNum;
                                    await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.remoteControlDice,themeId:request.body.themeId})
                                }
                                if (useItem.id === 440005) {
                                    insp.setEffItemId(useItem.id, _ => { // 只记录双倍骰子
                                        insp.addUseEffectItem(useItem, _ => {
                                            respData.itemId = request.body.itemId;
                                            respData.itemCount = 0;
                                            respData.freeItemCnt        = freeItemCnt;
                                            respData.freeItemId         = freeItemId;
                                            request.multiController.save(async function(err,data){
                                                if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                                    await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.doubleDice,themeId:request.body.themeId})
                                } else {
                                    insp.addUseEffectItem(useItem, _ => {
                                        respData.itemId = request.body.itemId;
                                        respData.itemCount = 0;
                                        respData.freeItemCnt        = freeItemCnt;
                                        respData.freeItemId         = freeItemId;
                                        request.multiController.save(async function(err,data){
                                            if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                            }
                        // });
                    }else {
                        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                        var useItem = { id: request.body.itemId, count: request.body.itemCount };
                        player.itemValid([useItem], itemRet => {
                            if (itemRet) {
                                // 消耗道具
                                player.costItem([useItem], async _ => {
                                    // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], async taskEventData => {
                                    //     respData.taskEventData = taskEventData;
                                        let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
                                        if (useItem.id === 440003) { // 说明是行动力药水
                                            await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.rejuvenationPotions,themeId:request.body.themeId})
                                            insp.addInspActionPoint(ADD_AP, newAP => {
                                                respData.inspActionPoint    = newAP;
                                                respData.itemId             = request.body.itemId;
                                                respData.itemCount          = request.body.itemCount;
                                                request.multiController.save(async function(err,data){
                                                    if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                                            // 加入使用物品列表中（在掷骰子中去真正触发效果）
                                            if (useItem.id === 440004) {useItem.count = request.body.diceNum;
                                                await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.remoteControlDice,themeId:request.body.themeId})
                                            }
                                            if (useItem.id === 440005) {
                                                insp.setEffItemId(useItem.id, _ => { // 只记录双倍骰子
                                                    insp.addUseEffectItem(useItem, _ => {
                                                        respData.itemId = request.body.itemId;
                                                        respData.itemCount = request.body.itemCount;
                                                        request.multiController.save(async function(err,data){
                                                            if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                                                await request.logServer.DreamLog({uuid: request.body.uuid,actionId:request.Const.actions.doubleDice,themeId:request.body.themeId})
                                            } else {
                                                insp.addUseEffectItem(useItem, _ => {
                                                    respData.itemId = request.body.itemId;
                                                    respData.itemCount = request.body.itemCount;
                                                    request.multiController.save(async function(err,data){
                                                        if(err){return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
                                        }
                                    // });
                                });
                            } else {
                                // 消耗道具不足
                                return  protocol.improperResponseSend(ERRCODES().ITEM_NOT_ENOUGH,response, respData);
                            }
                        });
                    }
                }else {
                    return  protocol.improperResponseSend(ERRCODES().INSP_GAME_IS_OVER,response, respData);
                }
            }
        });
    }
}

/**
 * InspirationBuyCount - 灵感购买次数
 * @param {*} request
 * @param {*} response
 */
async function InspirationBuyCount(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 判断灵感次数已达上限
    let promises = [new inspCountController(request.body.uuid, request.multiController, request.taskController),new playerController(request.body.uuid,request.multiController, request.taskController)]
    let ctls = await Promise.all(promises)
    let inspCountCtl = ctls[0],player = ctls[1];
    let inspCntRet = await inspCountCtl.isFull()
    if(inspCntRet){return  protocol.improperResponseSend(ERRCODES().INSP_COUNT_IS_FULL,response, respData);}
    // 判断购买次数
    // GameBuyCounts.getBuyCountMaxConfig(1, async BuyCountMax => {
// 购买次数限制去掉
        // console.log('buyCountMax:',BuyCountMax)
        let inspCountData_ = await inspCountCtl.getInspCountInfo()
        let buyCount = inspCountData_.buycnt
        // if (true) {
        //if (buyCount+1 <= BuyCountMax) {
            GameBuyCounts.getBuyCountCostConfig(1, buyCount+1, CostData => {
                player.currencyMultiValid(CostData.currency, currencyRet => {
                    if (currencyRet) {
                        player.itemValid(CostData.items, async itemValid => {
                            if (itemValid) {
                                // taskController.getTaskDataFromSource(request.body.uuid, async TaskData => {
                                    let newInspCount = await inspCountCtl.buyCountCtl(true)
                                    player.costCurrencyMulti(CostData.currency, newCurrency => {
                                        player.costItem(CostData.items, () => {
                                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], taskEventData => {
                                            //     respData.taskEventData = taskEventData;
                                                respData.currency = newCurrency;
                                                respData.inspCount = newInspCount;
                                                respData.buyCount = buyCount + 1;
                                                respData.costitems = CostData.items;
                                                // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                    var notif = new Notification(request.body.uuid);
                                                    notif.load(() => {
                                                        notif.updatePlayInsp(null, newInspCount);
                                                        notif.save(() => {
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
                        // 货币不足
                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            });
        // } else {
        //     // 已无购买次数
        //     respData.code = ERRCODES().INSP_NO_BUY_COUNT;
        //     protocol.responseSend(response, respData);
        // }
    // });
}

/**
 * InspirationBuyActionPoint - 灵感购买行动力
 * @param {*} request
 * @param {*} response
 */
function InspirationBuyActionPoint(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);

    var COST_DIAMOND = 10;
    var ADD_AP = 100;

    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.currencyMultiValid([0, COST_DIAMOND, 0], diamondRet => {
        if (diamondRet) {
            let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
            // 增加行动力
            insp.addInspActionPoint(ADD_AP, newInspAP => {
                // 扣除货币
                player.costCurrencyMulti([0, COST_DIAMOND, 0], newCurrency => {
                    respData.currency = newCurrency;
                    respData.inspActionPoint = newInspAP;
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
        } else {
            // 货币不足
            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }
    });
}

// 商人事件 物品生成
function InspirationShop(request,response) {
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
    // 获取事件ID
    if(!request.body.themeId|| !request.body.gridPos){
        return  protocol.improperResponseSend(ERRCODES().PARAMS_ERROR,response, respData);
    }
    insp.getEventIdByGridPos(request.body.themeId, request.body.gridPos, eventId => {
        let shopData = insp.getRandomGoods(eventId)
        respData.shopData = shopData
        if(shopData.length === 0){
            return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);
        }
        return protocol.responseSend(response, respData)
    })
}


// 商人事件 物品购买
function InspirationShopBuy(request,response) {
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 获取事件ID
    if(!request.body.goodsId){
        return  protocol.improperResponseSend(ERRCODES().PARAMS_ERROR,response, respData);
    }
    function doShopBuyGoods(uuid, goodsId, goodsCount, newCurrency,costData, callback, playerPtr)
    {
        var bonusType, bonusData, retData = {};
        [bonusType, bonusData] = GameMarketConfig.getGoods(goodsId, goodsCount);
       if (bonusType === 2) {
            // 普通奖励（直接给予）
            playerPtr.addItem(bonusData.items, () => {
                playerPtr.addCurrencyMulti(bonusData.currency, async newCurrency => {
                    retData.currency = newCurrency;
                    retData.addItem = bonusData.items
                    callback(retData);
                });
            });
        } else {
            callback(retData);
        }
    }
    var costData = GameMarketConfig.getCost(request.body.goodsId, request.body.goodsCount),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.itemValid(costData.items, itemValid => {
        if (itemValid) {
            player.currencyMultiValid(costData.currency, currencyValid => {
                if (currencyValid) {
                    // 消耗物品或货币
                    player.costItem(costData.items, () => {
                        player.costCurrencyMulti(costData.currency, newCurrency => {
                            // 执行商品购买
                            doShopBuyGoods(request.body.uuid, request.body.goodsId, request.body.goodsCount, newCurrency,costData,async retData => {
                                // 处理购买后的商店数据
                                let ret = await request.multiController.savesync()
                                if(ret){
                                    return  protocol.improperResponseSend(ERRCODES().FAILED,response, respData);
                                }
                                respData.addItem = retData.addItem;
                                respData.currency = retData.currency;
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
                                return protocol.responseSend(response, respData)
                            }, player);
                        });
                    });
                } else {
                    // 货币不足
                    respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                    protocol.responseSend(response, respData);
                }
            });
        } else {
            // 道具不足
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * InspirationEventSelect - 灵感事件选择
 * @param {*} request
 * @param {*} response
 */
function InspirationEventSelect(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);

    if (request.body.themeId <= 0 || request.body.gridPos < 1 || request.body.selectId < 1) {
        // 参数错误
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
        // 获取事件ID
        insp.getEventIdByGridPos(request.body.themeId, request.body.gridPos, eventId => {
            if (eventId > 0) {
                // 判断是否已选择
                // 获取消耗（主要是行动力、货币、墨魂属性点、道具等）
                insp.getSelectOptionCost(eventId, request.body.selectId, costData => {
                    insp.checkInspActionPointValid(costData.linggAp, async apRet => {
                        if (apRet) {
                            let ret = await insp.costBuff(request.body.themeId,costData.buff)
                            if(ret < 0){
                                return protocol.improperResponseSend(ERRCODES().INSP_THEME_BUFF_NOT_ENOUGH,response, respData);
                            }
                            let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                            // 判断货币消耗
                            player.currencyMultiValid(costData.currency, currencyRet => {
                                if (currencyRet) {
                                    // 判断物品消耗
                                    player.itemValid(costData.items, itemRet => {
                                        if (itemRet) {
                                            insp.checkInspActionPointValid(costData.linggAp, apRet => {
                                                if (apRet) {
                                                    // 消耗货币
                                                    player.costCurrencyMulti(costData.currency, newCurrency => {
                                                        player.costItem(costData.items, _ => {
                                                            insp.doSelectEvent(request.body.themeId, eventId, request.body.selectId, (retData) => {
                                                                if (retData) {
                                                                let hero = new heroController(request.body.uuid, retData.playHeroId,request.multiController, request.taskController);
                                                                // 奖励灵感（灵感奖励+基础灵感奖励）
                                                                hero.addAttrLingg(retData.awardData.lingg+retData.awardData.baselingg, _ => {
                                                                    // 奖励心情
                                                                    hero.addAttrEmotion(retData.awardData.emotion, newAttrs => {
                                                                        // 奖励AP（扣除消耗的，节省调用扣行动力的接口调用）
                                                                        insp.addLinggTotal(request.body.themeId, retData.awardData.lingg+retData.awardData.baselingg, linggTotal => {
                                                                            insp.addInspActionPoint(retData.awardData.ap-costData.linggAp, newAP => {
                                                                                // 奖励物品
                                                                                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                                                                    player.addItem(retData.awardData.items, _ => {
                                                                                        // 奖励货币
                                                                                        player.addCurrencyMulti(retData.awardData.currency, newCurrency => {
                                                                                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], taskEventData => {
                                                                                            //     respData.taskEventData = taskEventData;
                                                                                                insp.checkPlayIsOverValid(request.body.themeId, isOver => {
                                                                                                    respData.isOver             = isOver;
                                                                                                    respData.inspActionPoint    = newAP;
                                                                                                    respData.currGridPos        = retData.currGridPos;
                                                                                                    respData.walkGridData       = retData.walkData;
                                                                                                    respData.attrs              = newAttrs;
                                                                                                    respData.currency           = newCurrency;
                                                                                                    respData.linggTotal         = linggTotal;

                                                                                                    // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                                                                        if (respData.isOver) {
                                                                                                            // 需要全部奖励信息
                                                                                                            insp.getAwardAll(request.body.themeId, (allAwardData, overAwardData) => {
                                                                                                                respData.allAwardData = allAwardData;
                                                                                                                respData.overAwardData = overAwardData;
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
                                                                                                        }
                                                                                                    // });
                                                                                                });
                                                                                            // });
                                                                                        });
                                                                                    });
                                                                                // });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                                } else {
                                                                    respData.code = ERRCODES().FAILED;
                                                                    protocol.responseSend(response, respData);
                                                                }
                                                            });
                                                        });
                                                    });
                                                } else {
                                                    // 行动力
                                                    respData.code = ERRCODES().INSP_AP_NOT_ENGOUTH;
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
                        } else {
                            // 行动力不足
                            respData.code = ERRCODES().INSP_AP_NOT_ENGOUTH;
                            protocol.responseSend(response, respData);
                        }
                    });
                });
            } else {
                // 没有事件ID（系参数错误）
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * InspirationResult - 灵感手动结算
 * @param {*} request body { httpuuid, uuid, themeId }
 * @param {*} response
 */
function InspirationResult(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.themeId < 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let insp = new inspController(request.body.uuid,request.multiController, request.taskController);
        insp.setGameOver(request.body.themeId, _ => {
            insp.getAwardAll(request.body.themeId, (totalAwardData, overAwardData) => {
                respData.isOver = true;
                respData.allAwardData = totalAwardData;
                respData.overAwardData = overAwardData;

                var totalLinggVal = 0;
                if ('number' == typeof totalAwardData.baselingg) totalLinggVal += totalAwardData.baselingg;
                if ('number' == typeof totalAwardData.lingg) totalLinggVal += totalAwardData.lingg;
                if ('number' == typeof overAwardData.baselingg) totalLinggVal += overAwardData.baselingg;
                if ('number' == typeof overAwardData.lingg) totalLinggVal += overAwardData.lingg;

                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                    var player = new playerController(request.body.uuid,request.multiController, request.taskController)
                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetIns,[{params:[0]}]);
                        // taskController.addTaskCounter(TaskData, request.body.uuid, 184, [0], () => {
                        //     taskController.getCounterDataByTypeGroup(request.body.uuid, [184], taskEventData => {
                        //         taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                        //             respData.taskEventData = taskEventData;
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
                            // }, TaskData);
                        // }, totalLinggVal, false);
                // });
            });
        });
    }
}

//购买次数消耗
async function buyCount(request,response)
{
    // 购买次数
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let init = await Promise.all([new inspCountController(request.body.uuid,request.multiController, request.taskController)])
    const insp_count = init[0]
    let inspCountData = await insp_count.getInspCountInfo()
    if(!inspCountData && inspCountData.count === 4){
        respData.code = ERRCODES().INSP_COUNT_IS_FULL;
        return  protocol.responseSend(response, respData);
    }
    // 增加购买物品
    let ret = await insp_count.addCount()
    switch (ret) {
        case 2:
            // 正常返回
            break;
        case 1:
            //道具不够扣
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            break;
        case 0:
            break

    }
    var notif = new Notification(request.body.uuid);
    notif.load(() => {
        notif.updatePlayInsp(null, newInspCount);
        notif.save(() => {
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
}
// 推荐奖励领取
async function InspirationRecomentAwardReceive(request, response)
{
    const {themeId, uuid, httpuuid} = request.body
    let respData = protocol.responseData(httpuuid, uuid);
    let insp_them = new inspThemController(request.body.uuid, request.multiController, request.taskController)
    let player = new playerController(request.body.uuid,request.multiController, request.taskController)
    let code = await insp_them.receiveReward(themeId,true)
    switch (code) {
        case 1:
            let items = await insp_them.loadReward(themeId)
            player.addItem(items,async _=>{
                let ret = await request.multiController.savesync()
                if(ret){return protocol.improperResponseSend(ERRCODES().FAILED,response, respData);}
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
            break;
        case -2:
            return protocol.improperResponseSend(ERRCODES().INSP_THEME_REWARD_NOT_ENOUGH,response,respData)
            break;
        case -1:
            return  protocol.improperResponseSend(ERRCODES().INSP_THEME_REWARD_HAS_EECEIVE,response,respData)
            break;
    }
}

// 获取主题信息
async function getInspirationInfo(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let insp_them = new inspThemController(request.body.uuid, request.multiController, request.taskController)
    let insp_count = new inspCountController(request.body.uuid,request.multiController, request.taskController)
    let respObj = await Promise.all([insp_them.getInspirationInfo(), insp_count.getInspCountInfo()])
    respData.themeData = respObj[0]
    respData.countData = respObj[1]
    let ret = await request.multiController.savesync()
    if(ret){
        respData.code = ERRCODES().FAILED;
        return protocol.responseSend(response, respData);
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
    
    protocol.responseSend(response,respData)
}

function InspirationInfo(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let insp = new inspController(request.body.uuid,request.multiController, request.taskController);

    insp.getBaseInfo(baseInfo => {
        respData.inspUpTime = insp.getInspCountCd(baseInfo.inspCountUpStartTime);
        respData.inspCount = baseInfo.inspCount;
        respData.buyCount = baseInfo.inspBuyCount;
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

/**
 * InspirationBuffInfo - 获取灵感buff信息
 * @param {*} request { themeId }
 * @param {*} response
 */
async function InspirationBuffInfo(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.themeId > 0) {
        var insp = new inspController(request.body.uuid,request.multiController, request.taskController);
        insp.getLinggTotal(request.body.themeId, linggTotal => {
            insp.getBuffList(request.body.themeId, (buffLis,eventList) => {
                respData.themeId  = request.body.themeId;
                respData.buffList = buffLis;
                respData.eventBuff = eventList;
                respData.linggTotal = linggTotal;
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
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

//exports.InspirationData = InspirationData;
exports.InspirationStart = InspirationStart;
exports.InspirationPlayDice = InspirationPlayDice;
exports.InspirationUnlockTheme = InspirationUnlockTheme;
exports.InspirationUseItem = InspirationUseItem;
exports.InspirationBuyCount = InspirationBuyCount;
exports.InspirationBuyActionPoint = InspirationBuyActionPoint;
exports.InspirationEventSelect = InspirationEventSelect;
exports.InspirationResult = InspirationResult;
exports.InspirationInfo = InspirationInfo;
exports.getInspirationInfo = getInspirationInfo;
exports.InspirationBuffInfo = InspirationBuffInfo;
exports.InspirationThemeVideoEnd = InspirationThemeVideoEnd;
exports.InspirationRecomentAwardReceive = InspirationRecomentAwardReceive;
exports.buyCount= buyCount
exports.InspirationShop= InspirationShop
exports.InspirationShopBuy= InspirationShopBuy
