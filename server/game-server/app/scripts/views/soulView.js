const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const soulController = require('./../controllers/soulController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const taskController = require('./../controllers/taskController');
const Notification = require('./../controllers/notifController').Notification;
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * SoulGameStart - 开始魂力玩法
 * @param {*} request {themeId, viewpoint, heroId}
 * @param {*} response
 */
function SoulGameStart(request, response)
{
    // 任务计数相关（魂力玩法）
    function taskCounterSoulGame(uuid, hid, callback)
    {
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.OpenHunGame,[{params:[hid]}]);
        callback()
        
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     taskController.addTaskCounter(TaskData, uuid, 161, [hid], () => {
        //         taskController.getCounterDataByTypeGroup(uuid, [161], taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, TaskData);
        //     });
        // });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.themeId < 1 || request.body.heroId <= 0 || request.body.viewpoint <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let soul = new soulController (request.body.uuid,request.multiController, request.taskController)
        soul.checkSoulGameIsAlreadyEnd (endstatus =>{
            if (endstatus){
                soul.checkSoulGameCountValid (1, soulGameCount => {
                    if (soulGameCount) {
                        soul.checkThemeIsValid (request.body.themeId, isValidTheme => {
                            if (isValidTheme){
                                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                let hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                                hero.checkStatValid((statRet, status) => {
                                    if (statRet == heroController.CHECKSTATS ().VALID) {
                                        //soul.getSoulGameCostInfo (costEnergy => {
                                            //hero.checkAttrEnergyValid(costEnergy, energyRet => {
                                                //if (energyRet) {
                                                    soul.startNewSoulGame (request.body.heroId, request.body.viewpoint,  soulData => {

                                                        respData.soulCount = soulData.soulCount;
                                                        respData.heroId = soulData.heroId;
                                                        respData.viewpoint = soulData.viewpoint;
                                                        respData.themeId = soulData.themeId;
                                                        respData.gameData = soulData.gameData;
                                                        respData.soulUpTime = soulData.soulUpTime;
                                                        //hero.costAttrEnergy(costEnergy, newHeroAttrs => {
                                                            //respData.heroData = { hid: request.body.heroId, attrs: newHeroAttrs };
                                                            taskCounterSoulGame(request.body.uuid, request.body.heroId,  async() => {
                                                                // respData.taskEventData = taskEventData;
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
                                                                await request.logServer.ParticipatLog([request.body.uuid,
                                                                    request.Const.functions.pureConversation
                                                                ]);
                                                            });
                                                        //});
                                                    });
                                                //}else {
                                                    // 墨魂体力不足
                                                //    respData.code = ERRCODES().HERO_ENERGY_NOT_ENGOUTH;
                                                //    protocol.responseSend(response, respData);
                                                //}
                                            //});
                                        //});
                                    }else if (statRet == heroController.CHECKSTATS ().LOSS) {
                                        respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                                        protocol.responseSend(response, respData);
                                    }else if (statRet == heroController.CHECKSTATS ().VAGRANTNESS) {
                                        respData.code = ERRCODES().HERO_NOT_IN_HOUSE;
                                        protocol.responseSend(response, respData);
                                    }else{
                                        respData.code = ERRCODES().HERO_CANNOT_WORK;
                                        respData.workStat = status;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            }else {
                                // 主题不匹配
                                respData.code = ERRCODES().SOULGAME_THEME_ISNOTMATCH;
                                protocol.responseSend(response, respData);
                            }
                        });
                    }else {
                        // 次数不足
                        respData.code = ERRCODES().SOULGAME_COUNT_NOT_ENGOUTH;
                        protocol.responseSend(response, respData);
                    }
                });
            }else{
                // 游戏未结束
                respData.code = ERRCODES().SOULGAME_ISNOT_OVER;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * SoulGamePlayCard - 魂力玩法打牌
 * @param {*} request {cardId, heroId}
 * @param {*} response
 */
function SoulGamePlayCard(request, response)
{
    // 任务计数相关（魂力玩法）
    function taskCounterSoulGame(addTotal, finishFlag, winFlag, uuid, hid, callback)
    {
        if(finishFlag){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CompleteHunGame,[{params:[hid]}]);
        }
        if(winFlag){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.WinHunGame,[{params:[hid]}]);
        }
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.energyLg,[{params:[hid, addTotal]}]);
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.energyIn,[{params:[0]}]);
        callback();
        // function doFinish(tskData, flag, iuuid, ihid, callback)
        // {
        //     if (flag) {
        //         taskController.addTaskCounter(tskData, iuuid, 163, [ihid], () => {
        //             callback();
        //         });
        //     } else {
        //         callback();
        //     }
        // }
        //
        // function doWin(tskData, flag, iuuid, ihid, callback)
        // {
        //     if (flag) {
        //         taskController.addTaskCounter(tskData, iuuid, 162, [ihid], () => {
        //             callback();
        //         });
        //     } else {
        //         callback();
        //     }
        // }
        //
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     doFinish(TaskData, finishFlag, uuid, hid, () => {
        //         doWin(TaskData, winFlag, uuid, hid, () => {
        //             var typeGroup = [164, 165];
        //             if (finishFlag) typeGroup.push(163);
        //             if (winFlag) typeGroup.push(162);
        //             taskController.addTaskCounter(TaskData, uuid, 165, [hid, addTotal], () => {
        //                 taskController.addTaskCounter(TaskData, uuid, 164, [0], () => {
        //                     taskController.getCounterDataByTypeGroup(uuid, typeGroup, taskEventData => {
        //                         taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                             callback(taskEventData);
        //                         });
        //                     }, TaskData);
        //                 }, addTotal);
        //             });
        //         });
        //     });
        // });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.cardId <= 0 ) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let soul = new soulController (request.body.uuid, request.multiController, request.taskController)
        soul.checkSoulGameIsValidCard (request.body.cardId, validstatus =>{
            if (validstatus == 0){
                let hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                soul.soulGamePlayCard (hero, request.body.heroId, request.body.cardId, async doc => {
                    respData.gameData = doc.gameData;
                    respData.themeId = doc.themeId;
                    respData.costInfo = doc.costInfo;
                    if (doc.gameData.resultInfo != null){
                        // 结算
                        //魂力胜利
                        hero.addAttrFeel(doc.gameData.resultInfo.addTotal, newHeroAttrs => {
                            respData.gameData.resultInfo.heroData = { hid: request.body.heroId, attrs: newHeroAttrs };
                            taskCounterSoulGame(doc.gameData.resultInfo.addTotal, true, doc.gameData.resultInfo.winAdd > 0, request.body.uuid, request.body.heroId, async () => {
                                // respData.taskEventData = taskEventData;
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
                                await request.logServer.SoulLog({uuid:request.body.uuid, actionId: request.Const.actions.pureConversation,soul: doc.gameData.resultInfo.addTotal,heroId:request.body.heroId})
                            });
                        });
                    }else{
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
                }, true);
            }else if (validstatus == 1){
                // 游戏未结束
                respData.code = ERRCODES().SOULGAME_CARD_ISNOT_VALID;
                protocol.responseSend(response, respData);
            }else if (validstatus == -1){
                // 游戏未结束
                respData.code = ERRCODES().SOULGAME_GAME_IS_OVER;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * SoulGameManualExit - 主动退出
 * @param {*} request
 * @param {*} response
 */
function SoulGameManualExit(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let soul = new soulController(request.body.uuid,request.multiController, request.taskController);
    soul.checkSoulGameIsAlreadyEnd (endstatus =>{
        if (!endstatus){
            soul.setGameOver(doc => {
                let hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                respData.gameData = doc.gameData;
                respData.themeId = doc.themeId;
                respData.costInfo = doc.costInfo;
                if (doc.gameData.resultInfo != null){
                    hero.addAttrFeel(doc.gameData.resultInfo.addTotal, newHeroAttrs => {
                        respData.gameData.resultInfo.heroData = { hid: request.body.heroId, attrs: newHeroAttrs };
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
                }else{
                    protocol.responseSend(response, respData);
                }
            });
        }else{
            // 游戏已结束
            respData.code = ERRCODES().SOULGAME_GAME_IS_OVER;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * SoulGameBuyCount - 魂力次数购买
 * @param {*} request
 * @param {*} response
 */
function SoulGameBuyCount(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let soulGame = new soulController(request.body.uuid,request.multiController, request.taskController);
    // 判断灵感次数已达上限
    soulGame.isSoulGameCountFull(soulGameCntRet => {
        if (!soulGameCntRet) {
            // 判断购买次数
            GameBuyCounts.getBuyCountMaxConfig(2, BuyCountMax => {
                soulGame.getSoulGameBuyCount(buyCount => {
                    if (true) {
                    //if (buyCount+1 <= BuyCountMax) {
                        GameBuyCounts.getBuyCountCostConfig(2, buyCount+1, CostData => {
                            let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                            player.currencyMultiValid(CostData.currency, currencyRet => {
                                if (currencyRet) {
                                    player.itemValid(CostData.items, itemValid => {
                                        if (itemValid) {
                                            // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                                soulGame.addSoulGameBuyCount(1, _ => {
                                                    soulGame.addSoulGameCount(1, addCountData => {
                                                        player.costCurrencyMulti(CostData.currency, newCurrency => {
                                                            player.costItem(CostData.items, () => {
                                                                // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], async taskEventData => {
                                                                //     respData.taskEventData = taskEventData;
                                                                    if (CostData.items.length > 0) {
                                                                        respData.costitems = CostData.items;
                                                                    }
                                                                    respData.currency = newCurrency;
                                                                    respData.soulCount = addCountData.soulCount;
                                                                    respData.soulUpTime = addCountData.soulUpTime;
                                                                    respData.soulBuyCount = buyCount + 1;
                                                                    // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                                        var notif = new Notification(request.body.uuid);
                                                                        notif.load(() => {
                                                                            notif.updatePlaySoul(addCountData.soulCount);
                                                                            notif.save( () => {
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
                                                                                    "itemLog":async function (cb) {
                                                                                        if (CostData.items.length > 0) {await request.logServer.itemLog([request.body.uuid, request.Const.actions.soulBuy,CostData.items,[], request.Const.functions.pureConversation])}
                                                                                        cb(1)
                                                                                    },
                                                                                    "logCurrency": async function(cb){
                                                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.soulBuy,request.Const.functions.pureConversation,1,CostData.currency,currencyRet)
                                                                                        cb(1)
                                                                                    },
                                                                                    "SoulLog": async function(cb){
                                                                                        await request.logServer.SoulLog({uuid:request.body.uuid, actionId: request.Const.actions.soulBuy})
                                                                                        cb(1)
                                                                                    }
                                                                                },function (err,results) {
                                                                                })
                                                                            });
                                                                        });
                                                                    // });
                                                                // }, TaskData);
                                                            });
                                                        });
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
                    } else {
                        // 已无购买次数
                        respData.code = ERRCODES().SOULGAME_NO_BUY_COUNT;
                        protocol.responseSend(response, respData);
                    }
                });
            });
        } else {
            // 灵感次数已达上限
            respData.code = ERRCODES().SOULGAME_COUNT_IS_FULL;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * SoulGameCountInfo - 魂力次数查询
 * @param {*} request body { httpuuid, uuid }
 * @param {*} response
 */
function SoulGameCountInfo(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let soulGame = new soulController(request.body.uuid,request.multiController, request.taskController);
    soulGame.updateSoulGameCount (false, _ => {
        soulGame.getSoulGameCountInfo(doc => {
            respData.soulCount = doc.soulCount;
            respData.soulBuyCount = doc.soulBuyCount;
            respData.soulUpTime = doc.soulUpTime;
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

exports.SoulGameStart = SoulGameStart;
exports.SoulGamePlayCard = SoulGamePlayCard;
exports.SoulGameManualExit = SoulGameManualExit;
exports.SoulGameBuyCount = SoulGameBuyCount;
exports.SoulGameCountInfo = SoulGameCountInfo;
