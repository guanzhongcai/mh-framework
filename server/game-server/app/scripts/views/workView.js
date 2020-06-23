const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const utils = require('./../../common/utils');
const gamedata = require('./../../../configs/gamedata.json');
const workController = require('../controllers/workController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const collectController = require('./../controllers/collectController');
const categoryFromItemList = require('./../controllers/fixedController').categoryFromItemList;
const Items = require('./../controllers/fixedController').Items;
const WorkAddFormulas = require('./../../designdata/WorkFormulas');
const WorkTermUpAndUnlock = require('./../../designdata/WorkTermUpAndUnlock');
const WorkBuildingExpend = require('./../../designdata/WorkBuildingExpend');
const Skills = require('./../../designdata/Skills');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * WorkBuildingRenovation - 生产建筑修复
 * @param {*} request { httpuuid, uuid, bid }
 * @param {*} response
 */
async function WorkBuildingRenovation(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let bid = request.body.bid, uuid = request.body.uuid;
    if (uuid > 0) {
        // 判断当前建筑状态是否是为未修复状态
        let work = new workController (uuid, request.multiController, request.taskController);
        let buildingStat = await work.getBuildingStatus (bid);
        if (buildingStat === workController.BUILDINGSTATS().UNREPAIRED) {
            // 未修复（可以修复）
            // 奖励经验
            let buildingLv = await work.getBuildingLevel (bid)
            let configId = WorkTermUpAndUnlock.getIdByLevelConfig(bid, buildingLv+1);
            if (configId > 0) {
                // 判断条件
                let player = new playerController(uuid, request.multiController, request.taskController);
                let selectType = 1;
                let costData = WorkTermUpAndUnlock.getBuildingLevelUpCostConfig(configId, selectType);
                if (costData != null) {
                    player.currencyMultiValid(costData.currency, currencyRet => {
                        if (currencyRet) {
                            player.itemValid(costData.items, itemRet => {
                                if (itemRet) {
                                    // 奖励经验
                                    let expBonus = WorkTermUpAndUnlock.getExpBonusConfig (configId);
                                    // taskController.getTaskDataFromSource(uuid, TaskData => {
                                        player.addExp(expBonus, levelData => {
                                            // 消耗（货币和物品）
                                            player.costCurrencyMulti(costData.currency, _ => {
                                                player.costItem(costData.items, _ => {
                                                    work.createBuildingWorkData (bid).then (_ => {
                                                        // 升级建筑等级（0->1）
                                                        work.setBuildingLevel(bid, buildingLv+1).then (_ => {
                                                            work.setBuildingRepairStat(bid, workController.BUILDINGSTATS().REPAIRING, utils.getTime()).then (status => {
                                                                // 更新建筑配方列表
                                                                work.getBuildingList (bid).then (buildings => {
                                                                    let totalReward = [];
                                                                    if (levelData.levelUpAwardItems != null) {
                                                                        for (let i in levelData.levelUpAwardItems) {
                                                                            totalReward.push (levelData.levelUpAwardItems[i]);
                                                                        }
                                                                    }
                                                                    let awards = categoryFromItemList(totalReward);
                                                                    player.addItem (awards.items, itemRet => {
                                                                        player.addCurrencyMulti (awards.currency, newCurrency => {
    
    
                                                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.ProduceBuildLevel,[{params:[bid]}]);
                                                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.RepairBuilding,[{params:[bid]}]);
                                                                            
                                                                            // taskController.addTaskCounter(TaskData, uuid, 563, [bid], () => {
                                                                            //     taskController.addTaskCounter(TaskData, uuid, 4, [bid], () => {
                                                                            //         taskController.getCounterDataByTypeGroup(uuid, [1, 2, 3, 563], taskEventData => {
                                                                            //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                                                                            //                 respData.taskEventData = taskEventData;
                                                                                            respData.userLevelData = levelData;
                                                                                            respData.currency   = newCurrency;
                                                                                            respData.costItem   = costData.items;
                                                                                            respData.addItem    = awards.items;
                                                                                            respData.buildings   = buildings;
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
                                                                                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.openWork, costData.items, [], request.Const.functions.produce])
                                                                                                    cb(1)
                                                                                                },
                                                                                                "logCurrency": async function(cb){
                                                                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.openWork,request.Const.functions.produce,0,awards.currency,newCurrency)
                                                                                                    cb(1)
                                                                                                },
                                                                                                "addLevel": async function(cb){
                                                                                                    await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.openWork,functionId: request.Const.functions.produce}))
                                                                                                    cb(1)
                                                                                                }
                                                                                            },function (err,results) {
                                                                                            });
                                                                                        // });
                                                                                    // });
                                                                                // });
                                                                            // });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    // });
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
                    respData.code = ERRCODES().FAILED;
                    protocol.responseSend(response, respData);
                }
            } else {
                // 配置错误
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        } else {
            // 重复修复
            respData.code = ERRCODES().WORK_BUILDING_REAL_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkBuildingComplete - 生产完成建筑修复
 * @param {*} request { httpuuid, uuid, bid }
 * @param {*} response
 */
async function WorkBuildingComplete(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid;
    if (uuid > 0 && bid > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        work.getBuildingStatus(bid).then (buildingStat => {
            if (buildingStat === workController.BUILDINGSTATS().REPAIRING) {
                // 是修复中
                // 判断独玉
                var player = new playerController(uuid, request.multiController, request.taskController);
                var costCurrency = [0, gamedata.WORK.RepairedCostDiamond, 0];
                player.currencyMultiValid(costCurrency, currencyRet => {
                    if (currencyRet) {
                        player.costCurrencyMulti(costCurrency, newCurrency => {
                            // 设置建筑修复完成（建筑状态,修复时间戳）
                            work.setBuildingRepairStat(bid, workController.BUILDINGSTATS().REPAIRED, 0).then (status => {
                                work.getBuildingList (bid).then (buildings => {
                                    respData.buildings   = buildings;
                                    respData.currency   = newCurrency;
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
                        // 货币不足（独玉）
                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 不是在修复中
                respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRING;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkBuildingUpgrade - 生产升级建筑
 * @param {*} request { httpuuid, uuid, bid }
 * @param {*} response
 */
async function WorkBuildingUpgrade(request, response)
{
    // 任务相关（生产）
    function taskCounterWork(typeGroup, bLv, uuid, bid, callback) {
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.ProduceBuildLevelUp,[{params:[bid]}]);
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.ProduceBuildLevel,[{params:[bid]}]);
        callback();
        // taskController.addTaskCounter(TaskData, uuid, 562, [bid], () => {
        //     taskController.addTaskCounter(TaskData, uuid, 563, [bid], () => {
        //         taskController.getCounterDataByTypeGroup(uuid, typeGroup, taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, TaskData);
        //     }, bLv, false);
        // });
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid;
    if (uuid > 0 && bid > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        work.getBuildingLevel(bid).then (buildingLv => {
            if (buildingLv === 0) {
                respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
                protocol.responseSend(response, respData);
            } else {
                let nextConfigId = WorkTermUpAndUnlock.getUpIdConfig(bid, buildingLv);
                if (nextConfigId === 0) {
                    // 建筑无法升级
                    respData.code = ERRCODES().WORK_BUILDING_LEVEL_NOT_UP;
                    protocol.responseSend(response, respData);
                } else {
                    // 条件判断
                    let player = new playerController(uuid, request.multiController, request.taskController);
                    var selectType = 1;
                    var costData = WorkTermUpAndUnlock.getBuildingLevelUpCostConfig(nextConfigId, selectType);
                    if (costData != null) {
                        player.currencyMultiValid(costData.currency, currencyRet => {
                            if (currencyRet) {
                                player.itemValid(costData.items, itemRet => {
                                    if (itemRet) {
                                        // 奖励经验
                                        let expBonus = WorkTermUpAndUnlock.getExpBonusConfig(nextConfigId);
                                        // taskController.getTaskDataFromSource(uuid, TaskData => {
                                            player.addExp(expBonus, levelData => {
                                                // 消耗（货币和物品）
                                                player.costCurrencyMulti(costData.currency, newCurrency => {
                                                    player.costItem(costData.items, _ => {
                                                        // 设置等级并获取该建筑新信息
                                                        work.setBuildingLevel(bid, buildingLv+1).then (newBuildingLv => {
                                                            work.getBuildingList(bid).then (buildings => {
                                                                respData.level    = newBuildingLv;
                                                                respData.userLevelData = levelData;
                                                                respData.buildings = buildings;
                                                                let totalReward = [];
                                                                if (levelData.levelUpAwardItems != null) {
                                                                    for (let i in levelData.levelUpAwardItems) {
                                                                        totalReward.push (levelData.levelUpAwardItems[i]);
                                                                    }
                                                                }
                                                                
                                                                let awards = categoryFromItemList(totalReward);
                                                                player.addItem (awards.items, itemRet => {
                                                                    player.addCurrencyMulti (awards.currency, newCurrency => {
                                                                        taskCounterWork([2, 3, 562, 563], newBuildingLv, uuid, bid, () => {
                                                                            respData.currency = newCurrency;
                                                                            respData.costItem = costData.items;
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
                                                                                "WorkLog":async function (cb) {
                                                                                    await request.logServer.WorkLog({uuid:request.body.uuid,actionId:request.Const.actions.upLevelWork,buildId:request.body.bid,level:newBuildingLv})

                                                                                    cb(1)
                                                                                },
                                                                                "itemLog": async function(cb){
                                                                                    if(costData.items.length > 0){await request.logServer.itemLog([request.body.uuid, request.Const.actions.upLevelWork,costData.items,awards.items, request.Const.functions.produce]);}

                                                                                    cb(1)
                                                                                },
                                                                                "logCurrency":async function (cb) {
                                                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.upLevelWork,request.Const.functions.produce,1,costData.currency,newCurrency)

                                                                                    cb(1)
                                                                                },
                                                                                "logCurrency1": async function(cb){
                                                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.upLevelWork,request.Const.functions.produce,0,awards.currency,newCurrency)
                                                                                    cb(1)
                                                                                },
                                                                                "addLevel": async function(cb){
                                                                                    await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.upLevelWork,functionId: request.Const.functions.produce}))
                                                                                    cb(1)
                                                                                }
                                                                            },function (err,results) {
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        // });
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
                        respData.code = ERRCODES().FAILED;
                        protocol.responseSend(response, respData);
                    }
                }
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkUnlockHeroList - 生产解锁墨魂队列
 * @param {*} request { httpuuid, uuid, bid, grid, unlocktype}
 * @param {*} response
 */
async function WorkUnlockHeroList(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid;
    let gridPos = request.body.grid ? request.body.grid : 0;
    let unlocktype = request.body.unlocktype ? request.body.unlocktype : 2;

    if (uuid > 0 && bid > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        work.checkBuildingValid(bid).then (buildingValid => {
            if (buildingValid) {
                work.getNeedUnlockGrid(bid, gridPos).then (needUnlockGrid => {
                    if (needUnlockGrid === -1) {
                        respData.code = ERRCODES().FAILED;
                        protocol.responseSend(response, respData);
                    } if (needUnlockGrid === -2) {
                        respData.code = ERRCODES().PARAMS_ERROR;
                        protocol.responseSend(response, respData);
                    } if (needUnlockGrid === -3) {
                        respData.code = ERRCODES().WORK_LIST_CAN_NOT_UNLOCK;
                        protocol.responseSend(response, respData);
                    } else if (needUnlockGrid === 0) {
                        respData.code = ERRCODES().WORK_LIST_UNLOCK_REAL_MAX;
                        protocol.responseSend(response, respData);
                    } else {
                        let player = new playerController(uuid, request.multiController, request.taskController);
                        work.checkConditionValid('hero', player, needUnlockGrid, bid, unlocktype).then (condRet => {
                            if (condRet === 0) {
                                var costData = WorkBuildingExpend.getHeroGridUnlockCostConfig(bid, needUnlockGrid, unlocktype);
                                if (costData != null) {
                                    // 验证货币（可能消耗）
                                    player.currencyMultiValid(costData.currency, currencyRet => {
                                        if (currencyRet) {
                                            // 验证物品（可能消耗）
                                            player.itemValid(costData.items, itemRet => {
                                                if (itemRet) {
                                                    // 解锁该格子（满足条件）
                                                    work.unlockListByGrid(bid, needUnlockGrid).then (unlockRet => {
                                                        if (unlockRet === -1) {
                                                            respData.code = ERRCODES().FAILED;
                                                            protocol.responseSend(response, respData);
                                                        } else {
                                                            // taskController.getTaskDataFromSource(uuid, TaskData => {
                                                                // 消耗货币
                                                                player.costCurrencyMulti(costData.currency, newCurrency => {
                                                                    // 消耗物品
                                                                    player.costItem(costData.items, _ => {
                                                                        // taskController.getCounterDataByTypeGroup(uuid, [2], taskEventData => {
                                                                        //     taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                                                                                work.getTargetBuildingWorkData(bid).then (workData => {
                                                                                    // 生产队列长度 workData.workList.length
                                                                                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockHeroSkin,[{params:[request.body.bid],num:workData.workList.length,add:false}])
                                                                                    
                                                                                    respData.buildings = [];
                                                                                    // respData.taskEventData = taskEventData;
                                                                                    respData.buildings.push (workData);
                                                                                    respData.currency       = newCurrency;
                                                                                    respData.costItem       = costData.items;
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
                                                                                        "WorkLog":async function (cb) {
                                                                                            await request.logServer.WorkLog({uuid:request.body.uuid,actionId:request.Const.actions.openMohun,buildId:request.body.bid,grid:needUnlockGrid})
                                                                                            cb(1)
                                                                                        },
                                                                                        "itemLog": async function(cb){
                                                                                            if(costData.items.length > 0){await request.logServer.itemLog([request.body.uuid, request.Const.actions.openMohun,costData.items,[], request.Const.functions.produce]);}

                                                                                            cb(1)
                                                                                        },
                                                                                        "logCurrency":async function (cb) {
                                                                                            await request.logServer.logCurrency(request.body.uuid,request.Const.actions.openMohun,request.Const.functions.produce,1,costData.currency,newCurrency)

                                                                                            cb(1)
                                                                                        }
                                                                                    },function (err,results) {
                                                                                    });
                                                                                });
                                                                            // });
                                                                        // });
                                                                    });
                                                                });
                                                            // });
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
                                    respData.code = ERRCODES().FAILED;
                                    protocol.responseSend(response, respData);
                                }
                            } else {
                                // 条件不满足
                                if (condRet === -1) {
                                    respData.code = ERRCODES().FAILED;
                                } else if (condRet === -2) {
                                    respData.code = ERRCODES().PLAYER_LEVEL_VALID_FAILED;
                                } else if (condRet === -3) {
                                    respData.code = ERRCODES().WORK_BUILDING_LEVEL_NOT_ENGOUTH;
                                } else {
                                    respData.code = ERRCODES().WORK_CONDITION_FAILED;
                                }
                                protocol.responseSend(response, respData);
                            }
                        });

                    }
                });
            } else {
                respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkStartProduceFormula - 开始生产配方
 * @param {*} request { httpuuid, uuid, bid, grid, heroId, formulaId, count}
 * @param {*} response
 */
async function WorkStartProduceFormula(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid, grid = request.body.grid, heroId = request.body.heroId;
    let formulaId = request.body.formulaId, count = request.body.count;
    if (uuid > 0 && bid > 0 && grid > 0 && heroId > 0 && formulaId > 0  && count > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        let buildingValid = await work.checkBuildingValid (bid);
        if (buildingValid) {
            let ret = await work.checkHeroIntoGridValid (bid, grid, heroId);
            if (ret === -1) {
                // 没有创建数据
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            } else if (ret === -2) {
                // 系客户端参数错误
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            } else if (ret === -3) {
                // 该格子未解锁
                respData.code = ERRCODES().WORK_LIST_GRID_LOCKED;
                protocol.responseSend(response, respData);
            } else if (ret === -4) {
                // 该格子已经开始生产 不能替换已经开始的生产队列
                respData.code = ERRCODES().WORK_LIST_ARELADY_IN_WORKING;
                protocol.responseSend(response, respData);
            }else if (ret === -5) {
                respData.code = ERRCODES().WORK_LIST_NOT_EMPTY;
                protocol.responseSend(response, respData);
            } else {
                // 判断墨魂：1）是否存在 2）状态是否为入住及空闲（暂空）如果之前队列上有墨魂需要替换下来 重置状态
                let hero = new heroController(uuid, heroId, request.multiController, request.taskController);
                let player = new playerController (uuid, request.multiController, request.taskController);
                let workInfo = {bid:bid, grid:grid, heroId:heroId, formula:formulaId, count:count};
                let retData = await work.startProduceFormula (player, hero, workInfo);
                if (retData.retCode === -1) {
                    respData.code = ERRCODES().WORK_LIST_HERO_NOT_INGRID;
                    protocol.responseSend(response, respData);
                }else if (retData.retCode === -2) {
                    respData.code = ERRCODES().WORK_CANNOT_USE_FORMULA_IN_BUILDING;
                    protocol.responseSend(response, respData);
                }else if (retData.retCode === -3) {
                    respData.code = ERRCODES().HERO_ENERGY_NOT_ENGOUTH;
                    protocol.responseSend(response, respData);
                }else if (retData.retCode === -4) {
                    // 货币不足
                    respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                    protocol.responseSend(response, respData);
                }else if (retData.retCode === -5) {
                    // 货币不足
                    respData.code = ERRCODES().FAILED;
                    protocol.responseSend(response, respData);
                }else {
                    // taskController.getTaskDataFromSource(uuid, TaskData => {
                        // taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                            // taskController.getCounterDataByTypeGroup(uuid, [561, 741], taskEventData => {
                                let collect = new collectController (uuid, request.multiController, request.taskController);
                                collect.addNewFormula(formulaId, addFormulaRetData => {
                                    if (addFormulaRetData.newAdd && addFormulaRetData.formulaData != null) {
                                        respData.addCollectFormula = addFormulaRetData.formulaData;
                                    }

                                    respData.attrList = retData.attrList;
                                    respData.currency = retData.currency;
                                    respData.workList = retData.workList;
                                    if (retData.deployHeroId) respData.deployHeroId = retData.deployHeroId;
                                    if (retData.unDeployHeroId) respData.unDeployHeroId = retData.unDeployHeroId;
                                    let workStats = {};
                                    if (respData.deployHeroId != 0) {
                                        workStats[respData.deployHeroId] = heroController.WORKSTATS().WORKING;
                                    }
                                    if (retData.unDeployHeroId != 0) {
                                        workStats[retData.unDeployHeroId] = heroController.WORKSTATS().IDLE;
                                    }
                                    hero.setWorkStatBatch (workStats, updateStats => {
                                        respData.updateStats = updateStats;
                                    });
                                    
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
                            // }, TaskData);
                        // });
                    // });
                }
            }
        }else {
            // 建筑未修复
            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}


/**
 * WorkAddHero - 生产队列添加墨魂
 * @param {*} request { httpuuid, uuid, bid, grid, heroId}
 * @param {*} response
 */
async function WorkAddHero(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid, grid = request.body.grid, heroId = request.body.heroId;
    if (uuid > 0 && bid > 0 && grid > 0 && heroId > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        let buildingValid = await work.checkBuildingValid (bid);
        if (buildingValid) {
            let ret = await work.checkHeroIntoGridValid (bid, grid, heroId);
            if (ret === -1) {
                // 没有创建数据
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            } else if (ret === -2) {
                // 系客户端参数错误
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            } else if (ret === -3) {
                // 该格子未解锁
                respData.code = ERRCODES().WORK_LIST_GRID_LOCKED;
                protocol.responseSend(response, respData);
            } else if (ret === -4) {
                // 该格子已经开始生产 不能替换已经开始的生产队列
                respData.code = ERRCODES().WORK_LIST_ARELADY_IN_WORKING;
                protocol.responseSend(response, respData);
            }else if (ret === -5) {
                respData.code = ERRCODES().WORK_LIST_NOT_EMPTY;
                protocol.responseSend(response, respData);
            } else {
                let retData = await work.heroAssignedIntoGrid (bid, grid, heroId);
                if (retData.retCode === -1) {
                    if (retData.statRet === heroController.CHECKSTATS ().LOSS) {
                        respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                        protocol.responseSend(response, respData);
                    }else if (retData.statRet === heroController.CHECKSTATS ().VAGRANTNESS) {
                        respData.code = ERRCODES().HERO_NOT_IN_HOUSE;
                        protocol.responseSend(response, respData);
                    }else{
                        respData.code = ERRCODES().HERO_CANNOT_WORK;
                        respData.workStat = retData.status;
                        protocol.responseSend(response, respData);
                    }
                }else {
                    respData.workList = retData.workList;
                    if (retData.deployHeroId) respData.deployHeroId = retData.deployHeroId;
                    if (retData.unDeployHeroId) respData.unDeployHeroId = retData.unDeployHeroId;
                    if (retData.updateStats) respData.updateStats = retData.updateStats;
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
                }
            }
        }else {
            // 建筑未修复
            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkRevokeProduceFormula - 撤销生产配方
 * @param {*} request { httpuuid, uuid, bid, grid, heroId}
 * @param {*} response
 */
async function WorkRevokeProduceFormula(request, response)
{
    // 任务计数相关（生产）
    function taskCounterWork(uuid, fid, callback, TaskData)
    {
        WorkAddFormulas.getItemIdAndTypeConfig(fid, FormulaItemConfig => {
            taskController.addTaskCounter(TaskData, uuid, 561, [FormulaItemConfig.ItemId, FormulaItemConfig.ItemType], () => {
                taskController.getCounterDataByTypeGroup(uuid, [561, 741], taskEventData => {
                    taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                        callback(taskEventData);
                    });
                }, TaskData);
            });
        });
    }

    let uuid = request.body.uuid, bid = request.body.bid,
        grid = request.body.grid, heroId = request.body.heroId;
    var respData = protocol.responseData(request.body.httpuuid, uuid);
    if (uuid > 0 && bid > 0 && grid > 0 && heroId > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        let buildingValid = await work.checkBuildingValid(bid);
        if (buildingValid) {
            let heroValid = await work.checkHeroIsGridList (bid, grid, heroId);
            if (heroValid) {
                var hero = new heroController(uuid, heroId, request.multiController, request.taskController);
                let revokeInfo = await work.revokeBuildingWorkGrid (hero, bid, grid, heroId);
                if (revokeInfo.status === 0) {
                    let restoreEnergy = revokeInfo.energy * revokeInfo.leftCount;
                    let restoreEnergyRate = Math.floor(restoreEnergy * 0.5);
                    console.log("restore engery when revoke produce", restoreEnergy, restoreEnergyRate)
                    hero.addAttrEnergy (restoreEnergyRate, addAttrData => {
                        if (revokeInfo.workList) respData.workList = revokeInfo.workList;
                        respData.addEnergy = restoreEnergyRate;
                        respData.heroData = { hid:heroId, attrs: addAttrData};
                        request.multiController.save(async function(err,data) {
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
                    // 无法撤销不存在的生产信息
                    respData.code = ERRCODES().WORK_LIST_WORKINFO_NOT_EXIST;
                    protocol.responseSend(response, respData);
                }
            }else {
                // 撤销信息错误
                respData.code = ERRCODES().WORK_LIST_REVOKEINFO_ERROR;
                protocol.responseSend(response, respData);
            }
        } else {
            // 建筑未修复
            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkGetItem - 生产收取物品(OK)
 * @param {*} request { httpuuid, uuid, bid, gridList }
 * @param {*} response
 */
async function WorkGetItem(request, response)
{
    // 任务相关（收取产物）
    function taskCounterWorkGetItem(uuid, items, produceList, callback) {
        let paramGroup = [];
        for (let item of items) {
            paramGroup.push({
                params: [item.id],
                num: item.count
            });
        }
        

        let typeParamGroup = [];
        let heroProduce = [];
        for (let item of produceList) {
            typeParamGroup.push(
                {
                    params: [item.itemId, Items.getItemType(item.itemId)],
                    num: item.count
                }
            )
            heroProduce.push({
                params: [item.hid, item.itemId],
                num: item.count
            });
        
            paramGroup.push({
                params: [item.hid, item.itemId],
                num: item.count
            })
        }
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.hero_produce_item_A, heroProduce);
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Produce_Item_A, typeParamGroup);
        
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Produce_A,paramGroup);
        // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Produce_A, typeParamGroup);
        callback()
        // taskController.addTaskCounterGroup(TaskData, uuid, 567, paramGroup, () => {
        //     taskController.getCounterDataByTypeGroup(uuid, [1, 567, 741], taskEventData => {
        //         taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //             callback(taskEventData);
        //         });
        //     }, TaskData);
        // });
    }
    let uuid = request.body.uuid, bid = request.body.bid;
    let respData = protocol.responseData(request.body.httpuuid, uuid);
    if (uuid > 0 && bid > 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        let buildingValid = await work.checkBuildingValid(bid);
        if (buildingValid) {
            let collectData = await work.collectItemByGridGroup(bid, request.body.gridList);
            let retCode = collectData.retCode;
            if (retCode === 0) {
                let addItems = collectData.addItems;
                if (addItems != null && addItems.length > 0) {
                    // 收取成功
                    let player = new playerController(uuid, request.multiController, request.taskController);
                    // taskController.getTaskDataFromSource(uuid, TaskData => {
                        player.addItem(addItems, _ => {
                            respData.addItems = addItems;
                            if (collectData.workList) respData.workList = collectData.workList;
                            taskCounterWorkGetItem(uuid, addItems, collectData.produceList,async () => {
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
                                await request.logServer.itemLog([uuid, request.Const.actions.workRecevie,[],request.logServer.itemSum(collectData.addItems,[]), request.Const.functions.produce])
                            });
                        });
                    // });
                }else {
                    // 没有可领取的产物
                    respData.code = ERRCODES().WORK_LIST_NOTHAVE_ITEMCOLLECT;
                    protocol.responseSend(response, respData);
                }
            }else if (retCode === -1) {
                // 数据被未创建
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            } else {
                // 系客户端参数错误
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            }
        } else {
            // 建筑未修复
            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkFastCastSkill - 生产加速（主动技能释放）(OK)
 * @param {*} request { httpuuid, uuid, bid, grid, heroId, skillId}
 * @param {*} response
 */
function WorkFastCastSkill(request, response)
{
    // 任务相关（墨魂使用主动技能）
    function taskCounterWorkFast(uuid, hid, callback, TaskData) {
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroUseSkill,[{params:[hid]}]);
        callback()
        // taskController.addTaskCounter(TaskData, uuid, 565, [hid], () => {
        //     taskController.getCounterDataByTypeGroup(uuid, [565, 741], taskEventData => {
        //         taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //             callback(taskEventData);
        //         });
        //     }, TaskData);
        // });
    }

    let uuid = request.body.uuid, bid = request.body.bid, grid = request.body.grid,
        heroId = request.body.heroId, skillId = request.body.skillId;
    var respData = protocol.responseData(request.body.httpuuid, uuid);
    if (uuid > 0 && bid > 0 && heroId > 0 && skillId > 0) {
        // 提前更新数据（全部建筑）
        let work = new workController (uuid, request.multiController, request.taskController);
        let hero = new heroController(uuid, heroId, request.multiController, request.taskController);
        hero.checkInitiativeSkillValid(skillId, skillValid => {
            if (skillValid) {
                hero.checkInitiativeSkillCastTimeValid (skillId, async skillUseValid => {
                    if (skillUseValid) {
                        let buildingValid = await work.checkBuildingValid(bid);
                        if (buildingValid) {
                            let workValid = await work.checkBuildingGridIsWorking (bid, grid);
                            if (workValid) {
                                let speedUpInfo = await work.doWorkingCastSkill(hero, bid, grid, heroId, skillId);
                                hero.castInitiativeSkillCast (skillId, speedUpInfo.reduceSkillCdTime, castInfoData => {
                                    if (castInfoData.hid)  respData.hid = castInfoData.hid;
                                    if (castInfoData.activeSkillCastTime)  respData.activeSkillCastTime = castInfoData.activeSkillCastTime;
                                    if (castInfoData.activeSkillCDTime) respData.activeSkillCDTime = castInfoData.activeSkillCDTime;
                                    respData.speedUpInfo = speedUpInfo;
                                    taskCounterWorkFast(uuid, heroId,  async () => {
                                        // respData.taskEventData = taskEventData;
                                        request.multiController.save(async function(err,data) {
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
                                        await request.logServer.WorkLog({uuid:request.body.uuid,actionId: request.Const.actions.activeSkill,buildId:request.body.bid})
                                    });
                                });
                            }else {
                                // 无法加速 (当前栏位不在生产状态)
                                respData.code = ERRCODES().WORK_CANNOT_FASTING;
                                protocol.responseSend(response, respData);
                            }
                        } else {
                            // 建筑未修复
                            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
                            protocol.responseSend(response, respData);
                        }
                    }else {
                        // 主动技能释放未冷却
                        respData.code = ERRCODES().SKILL_IS_INCDSTATUS;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 墨魂技能错误（没有或者不是主动技能）
                respData.code = ERRCODES().SKILL_IS_WRONG;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkExitProduceLayer //生产界面退出
 * @param {*} request body { httpuuid, uuid, bid, inguide}
 * @param {*} response
 */
async function WorkExitProduceLayer(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid;
    let work = new workController (uuid, request.multiController, request.taskController);
    let kickOutInfo = await work.exitWorkOutRefreshHeroList(bid);
    if (kickOutInfo.workList) respData.workList = kickOutInfo.workList;
    if (kickOutInfo.kickIdleHeroList != null && kickOutInfo.kickIdleHeroList.length > 0) {
        let workStats = {};
        for (let hid of kickOutInfo.kickIdleHeroList) {
            workStats[hid] = heroController.WORKSTATS().IDLE;
        }
        let hero = new heroController(uuid, 0, request.multiController, request.taskController);
        hero.setWorkStatBatch (workStats, updateStats => {
            respData.updateStats = updateStats;
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
    else {
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
}

/**
 * WorkSpeedUp // 使用道具或者独玉加速(OK)
 * @param {*} request body { httpuuid, uuid, bid, grid, speedtype, speedItems }
 * @param {*} response
 */
async function WorkSpeedUp(request, response)
{
    function getSpeedUpItemCount (items, itemId) {
        let count = 0;
        for (let item of items) {
            if (item.id == itemId) {
                count += item.count;
            }
        }
        return count;
    }
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let uuid = request.body.uuid, bid = request.body.bid, grid = request.body.grid,
        speedtype = request.body.speedtype, speedItems = request.body.speedItems;
    if (uuid > 0 && bid > 0 && grid > 0 && speedtype >= 0) {
        let work = new workController (uuid, request.multiController, request.taskController);
        let hero = new heroController(uuid, 0, request.multiController, request.taskController);
        let player = new playerController(uuid, request.multiController, request.taskController);
        let buildingValid = await work.checkBuildingValid(bid);
        if (buildingValid) {
            let workValid = await work.checkBuildingGridIsWorking (bid, grid);
            if (workValid) {
                // 使用独玉加速
                if (speedtype === 0) {
                    let speedUpData = await work.getWorkingGridNeedTimeToCostDiamond(bid, grid);
                    let leftTime = speedUpData.leftTime;
                    let costDiamond = speedUpData.costDiamond;
                    let costCurrency = [0, costDiamond, 0];
                    if ('inguide' in request.body && request.body.inguide === 1) {
                        costCurrency = [0, 0, 0];
                    }
                    player.currencyMultiValid(costCurrency, currencyValid => {
                        if (currencyValid) {
                            // 直接完成正在工作中的配方
                            work.speedUpBuildingWorkGrid(hero, bid, grid, leftTime).then (speedUpInfo => {
                                player.costCurrencyMulti(costCurrency, newCurrency => {
                                    respData.currency = newCurrency;
                                    respData.speedUpInfo = speedUpInfo;
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
                                        "CurrencyLog":async function (cb) {
                                            await request.logServer.logCurrency(request.body.uuid,request.Const.actions.quickProduce,request.Const.functions.produce,1,costCurrency,newCurrency)
                                            cb(1)
                                        },
                                        "WorkLog": async function(cb){
                                            await request.logServer.WorkLog({uuid:request.body.uuid,actionId: request.Const.actions.quickProduce,buildId:request.body.bid})
                                            cb(1)
                                        }
                                    },function (err,results) {
                                    });
                                });
                            });
                        } else {
                            // 货币不足
                            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    });
                }else {
                    // 使用加速道具加速
                    player.itemValid (speedItems, itemValid => {
                        if (itemValid) {
                            let itemIds = [];
                            for (let item of speedItems) {
                                itemIds.push (item.id);
                            }
                            
                            Items.getItemsInfoByItemIds(itemIds, itemInfos => {
                                // 判断是否都是冲能类型 计算当前可以充能能量
                                let speedUpType = Items.TYPES().ITEM_SPEEDUP;
                                let totalSpeedTime = 0;
                                let itemTypeMatch = true;
                                for (let item of itemInfos) {
                                    if (item.type == speedUpType) {
                                        totalSpeedTime += item.upEffectVal * getSpeedUpItemCount (speedItems, item.itemId) * 1000;
                                    }else {
                                        itemTypeMatch = false;
                                        break;
                                    }
                                }

                                if (!itemTypeMatch) {
                                    respData.code = ERRCODES().WORK_LIST_SPEEDUP_ITEMTYPE_NOTMATCH;
                                    protocol.responseSend(response, respData);
                                }else {
                                    work.speedUpBuildingWorkGrid(hero, bid, grid, totalSpeedTime).then (speedUpInfo => {
                                        player.costItem(speedItems, () => {
                                            respData.costItems = speedItems;
                                            respData.speedUpInfo = speedUpInfo;
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
                                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.quickProduce, costData.items, [], request.Const.functions.produce])
                                                    cb(1)
                                                },
                                                "WorkLog": async function(cb){
                                                    await request.logServer.WorkLog({uuid:request.body.uuid,actionId: request.Const.actions.quickProduce,buildId:request.body.bid})
                                                    cb(1)
                                                }
                                            },function (err,results) {
                                            });
                                        });
                                    });
                                }
                            });
                        }else {
                            // 物品不足
                            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    });
                }
            }else {
                respData.code = ERRCODES().WORK_CANNOT_FASTING;
                protocol.responseSend(response, respData);
            }
        } else {
            respData.code = ERRCODES().WORK_BUILDING_NOT_REPAIRED;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * WorkBuildingInfo - 生产获取建筑信息(OK)
 * @param {*} request { httpuuid, uuid, bid, layer}
 * @param {*} response
 */
async function WorkBuildingInfo(request, response)
{
    let uuid = request.body.uuid, bid = request.body.bid, layer = request.body.layer;
    let respData = protocol.responseData(request.body.httpuuid, uuid);
    if (uuid > 0 && bid >= 0) {
        // 更新建筑修复状态
        let work = new workController (uuid, request.multiController, request.taskController);
        let hero = new heroController(uuid, 0, request.multiController, request.taskController);
        let workUpdatedData = await work.doWorkProgressUpdateAll (hero, bid, layer);
        if (workUpdatedData.workCompletedFormula) respData.workCompletedFormula = workUpdatedData.workCompletedFormula;
        if (workUpdatedData.buildings) respData.buildings = workUpdatedData.buildings;
        if (workUpdatedData.kickOutHero != null && workUpdatedData.kickOutHero.length > 0) {
            let workStats = {};
            for (let kick of workUpdatedData.kickOutHero) {
                if (kick.kickHero > 0) {
                    workStats[kick.kickHero] = heroController.WORKSTATS().IDLE;
                }
            }

            hero.setWorkStatBatch (workStats, updateStats => {
                respData.updateStats = updateStats;
                request.multiController.save(async function(err,data) {
                    if (err) {
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
                    protocol.responseSend(response, respData);
                });
            });
        }else {
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
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

exports.WorkBuildingRenovation = WorkBuildingRenovation;//建筑修复
exports.WorkBuildingComplete = WorkBuildingComplete;// 建筑修复完成
exports.WorkBuildingUpgrade = WorkBuildingUpgrade;// 建筑升级
exports.WorkUnlockHeroList = WorkUnlockHeroList;// 解锁当前墨魂队列 （工作队列）
exports.WorkGetItem = WorkGetItem;// 收取完成货物
exports.WorkStartProduceFormula = WorkStartProduceFormula;// 开始生产配方
exports.WorkRevokeProduceFormula = WorkRevokeProduceFormula;// 撤销正在生产的队列信息
exports.WorkFastCastSkill = WorkFastCastSkill; //释放墨魂主动技能加速
exports.WorkSpeedUp = WorkSpeedUp; //使用道具或者独玉进行加速
exports.WorkBuildingInfo = WorkBuildingInfo; // 获取建筑的生产信息
exports.WorkExitProduceLayer = WorkExitProduceLayer;//生产界面退出
exports.WorkAddHero = WorkAddHero; //生产队列移除墨魂
