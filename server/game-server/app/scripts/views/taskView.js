const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const TaskConfig = require('./../../designdata/Tasks');
const ActiveDegreeAwardConfig = require('./../../designdata/ActiveDegreeConfig').ActiveDegreeAwardConfig;
const taskController = require('./../controllers/taskController');
const playerController = require('./../controllers/playerController');
const itemController = require('./../controllers/itemController');
const categoryFromItemList = require('./../controllers/fixedController').categoryFromItemList;
const heroController = require('./../controllers/heroController');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * TaskList - 任务列表
 * @param {*} request { httpuuid, uuid }
 * @param {*} response
 */
async function TaskList(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    try {
        let taskList = await request.taskController.getTaskList(request.body.uuid);
        respData.taskList = request.taskController.adjustTaskList(taskList)
        protocol.responseSend(response, respData);
    }catch (e) {
    
    }
}

/**
 * TasksValid
 * @param {*} request { httpuuid, uuid }
 * @param {*} response
 */
function TasksValid(request, response)
{
    function getTaskGroup(triggerTasks, finishTasks) {
        /*
        if (JSON.stringify(triggerTasks) !== '{}') {
            return triggerTasks;
        } else if (JSON.stringify(finishTasks) !== '{}') {
            return finishTasks;
        } else {
            return [];
        }*/
        return [];
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // taskController.taskGroupValid(request.body.uuid, getTaskGroup(request.body.triggerTasks, request.body.finishTasks), (taskList, realTriggerTaskLis, realFinishTaskLis) => {
    //     respData.taskList = taskList;
    //     respData.triggerTasks = realTriggerTaskLis;
    //     respData.finishTasks = realFinishTaskLis;
    //     //taskCounter(request.body.uuid, realFinishTaskGroup, taskEventData => {
    //         //respData.taskEventData = taskEventData;
    //         protocol.responseSend(response, respData);
    //     //});
    // });
    
    respData.taskList = [];
    respData.triggerTasks = [];
    respData.finishTasks = [];
    //taskCounter(request.body.uuid, realFinishTaskGroup, taskEventData => {
    //respData.taskEventData = taskEventData;
    protocol.responseSend(response, respData);
}

/**
 * TaskGetAwards - 获取任务奖励
 * @param {*} request { taskId }
 * @param {*} response
 */
async function TaskGetAwards(request, response)
{
    /*
    function levelUpAwards(clsPlayer, awards, callback)
    {
        if (awards) {
            clsPlayer.addItem(awards.items, () => {
                callback();
            });
        } else {
            callback();
        }
    }*/

    function taskCounterTaskFinish(uuid, taskId, callback, taskData)
    {
        TaskConfig.checkMainTaskValid(taskId, mainTaskValid => {
            if (mainTaskValid) {
                // 主线
                taskController.addTaskCounter(taskData, uuid, 581, [taskId], () => {
                    taskController.addTaskCounter(taskData, uuid, 601, [taskId], () => {
                        taskController.getCounterDataByTypeGroup(uuid, [1, 3, 581, 601], taskEventData => {
                            callback(taskEventData);
                        }, taskData);
                    });
                });
            } else {
                taskController.addTaskCounter(taskData, uuid, 581, [taskId], () => {
                    taskController.getCounterDataByTypeGroup(uuid, [1, 3, 581], taskEventData => {
                        callback(taskEventData);
                    }, taskData);
                });
            }
        });
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    
    
    
    
    
    let taskNode = await request.taskController.getTaskData(request.body.uuid,request.body.taskId)
    
    console.log(taskNode)
    
    
 

        
        //TODO 判断 是否是主线章节
            taskController.checkMainChapterValid(request.body.uuid, request.body.taskId, openRet => {
                if (openRet === 0 || openRet === -1) {
                    //TODO 判断子任务状态 是否可以领奖
                    taskController.checkTaskStatValid(request.body.uuid, request.body.taskId, retErrCode => {
                        if (retErrCode === ERRCODES().SUCCESS) {
                            //TODO 验证成功可以领取  获取奖励列表
                            taskController.getTaskBonus(request.body.taskId, (BonusData, BonusExp) => {
                                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                player.addExp (BonusExp, levelData =>{
                                    respData.userLevelData = levelData;
                                    let totalReward = [];
                                    if (BonusData.items != null) {
                                        for (let i in BonusData.items) {
                                            totalReward.push (BonusData.items[i]);
                                        }
                                    }
                                    if (levelData.levelUpAwardItems != null) {
                                        for (let i in levelData.levelUpAwardItems) {
                                            totalReward.push (levelData.levelUpAwardItems[i]);
                                        }
                                    }

                                    let awards = categoryFromItemList(totalReward);
                                    player.addItem (awards.items, itemRet => {
                                        let totalCurrency = awards.currency.map(function(v, i) {return v + BonusData.currency[i];});
                                        player.addCurrencyMulti (totalCurrency, currencyRet => {
                                            respData.currency = currencyRet;
                                            respData.bonusItem = BonusData.items;
                                            player.addActiveDegreeValue(BonusData.activeDegreeValue, (newActDegValue) => {
                                                if (BonusData.activeDegreeValue > 0) respData.actDegValue = newActDegValue; // 活跃度
                                                taskController.setTaskStat(request.body.uuid, request.body.taskId, () => {
                                                    taskController.updateTaskByCycle(request.body.uuid, [request.body.taskId], retTaskLis => {
                                                        var currTaskNode = taskController.getTaskNodeByTaskId(SourceTaskData, request.body.taskId);
                                                        taskController.taskGroupValid(request.body.uuid, [], (playerTasks) => {
                                                            taskCounterTaskFinish(request.body.uuid, request.body.taskId, taskEventData => {
                                                                taskController.saveTaskDataFromSource(request.body.uuid, SourceTaskData, () => {
                                                                    respData.taskList = playerTasks;//retTaskLis;
                                                                    if (currTaskNode) {
                                                                        respData.taskList = respData.taskList.concat(currTaskNode);
                                                                    }
                                                                    respData.taskEventData = taskEventData;
                                                                    request.multiController.save(async function(err,data){
                                                                        if(err){
                                                                            respData.code = ERRCODES().FAILED;
                                                                            return  protocol.responseSend(response, respData);
                                                                        }
                                                                        protocol.responseSend(response, respData);
                                                                    })
                                                                    async.parallel({
                                                                        "itemLog":async function (cb) {
                                                                            await request.logServer.itemLog([request.body.uuid, request.Const.actions.taskRecevie,[],BonusData.items, request.Const.functions.task])

                                                                            cb(1)
                                                                        },
                                                                        "logCurrency": async function(cb){
                                                                            await request.logServer.logCurrency(request.body.uuid,request.Const.actions.taskRecevie,request.Const.functions.task,0,totalCurrency,currencyRet)

                                                                            cb(1)
                                                                        },
                                                                        "addLevel": async function(cb){
                                                                            await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.taskRecevie,functionId: request.Const.functions.task}))
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
                                });
                            });
                        } else {
                            // 任务未完成
                            respData.code = retErrCode;
                            protocol.responseSend(response, respData);
                        }
                    });
                } else {
                    // 主线任务未完成
                    respData.code = ERRCODES().TASK_CHAPTER_NOT_UNLOCK;
                    protocol.responseSend(response, respData);
                }
            });
  
 
}
// function TaskGetAwards(request, response)
// {
//     /*
//     function levelUpAwards(clsPlayer, awards, callback)
//     {
//         if (awards) {
//             clsPlayer.addItem(awards.items, () => {
//                 callback();
//             });
//         } else {
//             callback();
//         }
//     }*/
//
//     function taskCounterTaskFinish(uuid, taskId, callback, taskData)
//     {
//         TaskConfig.checkMainTaskValid(taskId, mainTaskValid => {
//             if (mainTaskValid) {
//                 // 主线
//                 taskController.addTaskCounter(taskData, uuid, 581, [taskId], () => {
//                     taskController.addTaskCounter(taskData, uuid, 601, [taskId], () => {
//                         taskController.getCounterDataByTypeGroup(uuid, [1, 3, 581, 601], taskEventData => {
//                             callback(taskEventData);
//                         }, taskData);
//                     });
//                 });
//             } else {
//                 taskController.addTaskCounter(taskData, uuid, 581, [taskId], () => {
//                     taskController.getCounterDataByTypeGroup(uuid, [1, 3, 581], taskEventData => {
//                         callback(taskEventData);
//                     }, taskData);
//                 });
//             }
//         });
//     }
//
//     var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
//     taskController.getTaskDataFromSource(request.body.uuid, SourceTaskData => {
//         // 判断是否任务是否过期
//         //var checkTaskRet = taskController.checkTaskId(SourceTaskData.taskLis, request.body.taskId);
//         //if (checkTaskRet == ERRCODES().SUCCESS) {
//         //if (!taskController.isTaskExpired(SourceTaskData.taskLis, request.body.taskId)) {
//             //taskController.checkTaskChapterOpen(request.body.uuid, request.body.taskId, openRet => {
//             //    if (openRet === 0 || openRet === -1) {
//             taskController.checkMainChapterValid(request.body.uuid, request.body.taskId, openRet => {
//                 if (openRet === 0 || openRet === -1) {
//                     taskController.checkTaskStatValid(request.body.uuid, request.body.taskId, retErrCode => {
//                         if (retErrCode === ERRCODES().SUCCESS) {
//                             // 验证成功可以领取
//                             taskController.getTaskBonus(request.body.taskId, (BonusData, BonusExp) => {
//                                 let player = new playerController(request.body.uuid,request.multiController, request.taskController);
//                                 player.addExp (BonusExp, levelData =>{
//                                     respData.userLevelData = levelData;
//                                     let totalReward = [];
//                                     if (BonusData.items != null) {
//                                         for (let i in BonusData.items) {
//                                             totalReward.push (BonusData.items[i]);
//                                         }
//                                     }
//                                     if (levelData.levelUpAwardItems != null) {
//                                         for (let i in levelData.levelUpAwardItems) {
//                                             totalReward.push (levelData.levelUpAwardItems[i]);
//                                         }
//                                     }
//
//                                     let awards = categoryFromItemList(totalReward);
//                                     player.addItem (awards.items, itemRet => {
//                                         let totalCurrency = awards.currency.map(function(v, i) {return v + BonusData.currency[i];});
//                                         player.addCurrencyMulti (totalCurrency, currencyRet => {
//                                             respData.currency = currencyRet;
//                                             respData.bonusItem = BonusData.items;
//                                             player.addActiveDegreeValue(BonusData.activeDegreeValue, (newActDegValue) => {
//                                                 if (BonusData.activeDegreeValue > 0) respData.actDegValue = newActDegValue; // 活跃度
//                                                 taskController.setTaskStat(request.body.uuid, request.body.taskId, () => {
//                                                     taskController.updateTaskByCycle(request.body.uuid, [request.body.taskId], retTaskLis => {
//                                                         var currTaskNode = taskController.getTaskNodeByTaskId(SourceTaskData, request.body.taskId);
//                                                         taskController.taskGroupValid(request.body.uuid, [], (playerTasks) => {
//                                                             taskCounterTaskFinish(request.body.uuid, request.body.taskId, taskEventData => {
//                                                                 taskController.saveTaskDataFromSource(request.body.uuid, SourceTaskData, () => {
//                                                                     respData.taskList = playerTasks;//retTaskLis;
//                                                                     if (currTaskNode) {
//                                                                         respData.taskList = respData.taskList.concat(currTaskNode);
//                                                                     }
//                                                                     respData.taskEventData = taskEventData;
//                                                                     request.multiController.save(async function(err,data){
//                                                                         if(err){
//                                                                             respData.code = ERRCODES().FAILED;
//                                                                             return  protocol.responseSend(response, respData);
//                                                                         }
//                                                                         protocol.responseSend(response, respData);
//                                                                     })
//                                                                     async.parallel({
//                                                                         "itemLog":async function (cb) {
//                                                                             await request.logServer.itemLog([request.body.uuid, request.Const.actions.taskRecevie,[],BonusData.items, request.Const.functions.task])
//
//                                                                             cb(1)
//                                                                         },
//                                                                         "logCurrency": async function(cb){
//                                                                             await request.logServer.logCurrency(request.body.uuid,request.Const.actions.taskRecevie,request.Const.functions.task,0,totalCurrency,currencyRet)
//
//                                                                             cb(1)
//                                                                         },
//                                                                         "addLevel": async function(cb){
//                                                                             await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.taskRecevie,functionId: request.Const.functions.task}))
//                                                                             cb(1)
//                                                                         }
//                                                                     },function (err,results) {
//                                                                     });
//                                                                 });
//                                                             }, SourceTaskData);
//                                                         }, SourceTaskData);
//                                                     }, SourceTaskData);
//                                                 }, SourceTaskData);
//                                             });
//                                         }, SourceTaskData);
//                                     }, SourceTaskData);
//                                 }, SourceTaskData);
//                             });
//                         } else {
//                             // 任务未完成
//                             respData.code = retErrCode;
//                             protocol.responseSend(response, respData);
//                         }
//                     }, SourceTaskData);
//                 } else {
//                     // 主线任务未完成
//                     respData.code = ERRCODES().TASK_CHAPTER_NOT_UNLOCK;
//                     protocol.responseSend(response, respData);
//                 }
//             }, SourceTaskData);
//         //} else {
//         //    respData.code = checkTaskRet;///ERRCODES().TASK_IS_EXPIRED;
//         //    protocol.responseSend(response, respData);
//         //}
//     });
// }

/**
 * TaskChapterOpen - 任务章节开启
 * @param {*} request { taskId }
 * @param {*} response { taskId }
 */
function TaskChapterOpen(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 验证任务章节
    taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
        taskController.checkTaskChapterOpen(request.body.uuid, request.body.taskId, openRet => {
            if (openRet === 0) {
                // 获取开启消耗
                var CostData = TaskConfig.getOpenCost(request.body.taskId);
                if (CostData) {
                    var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                    player.itemValid(CostData.items, itemValid => {
                        if (itemValid) {
                            player.currencyMultiValid(CostData.currency, currencyValid => {
                                if (currencyValid) {
                                    player.costItem(CostData.items, () => {
                                        player.costCurrencyMulti(CostData.currency, newCurrency => {
                                            taskController.addTaskCounter(TaskData, request.body.uuid, 602, [request.body.taskId], () => {
                                                taskController.addOpenTaskList(request.body.uuid, request.body.taskId, (openTaskNode) => {
                                                    var realCostRet = false;
                                                    if (CostData.items.length > 0) { 
                                                        realCostRet = true;
                                                        respData.items = CostData.items;
                                                    }
                                                    if (CostData.currency.filter((a) => { return a > 0; }).length > 0) {
                                                        realCostRet = true;
                                                        respData.currency = newCurrency;
                                                    }

                                                    respData.openTask = openTaskNode;

                                                    if (realCostRet) {
                                                        taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2, 602], taskEventData => {
                                                            respData.taskEventData = taskEventData;
                                                            request.multiController.save(async function(err,data){
                                                                if(err){
                                                                    respData.code = ERRCODES().FAILED;
                                                                    return  protocol.responseSend(response, respData);
                                                                }
                                                                protocol.responseSend(response, respData);
                                                            })
                                                        }, TaskData);
                                                    } else {
                                                        taskController.getCounterDataByTypeGroup(request.body.uuid, [602], taskEventData => {
                                                            respData.taskEventData = taskEventData;
                                                            request.multiController.save(async function(err,data){
                                                                if(err){
                                                                    respData.code = ERRCODES().FAILED;
                                                                    return  protocol.responseSend(response, respData);
                                                                }
                                                                protocol.responseSend(response, respData);
                                                            })
                                                        }, TaskData);
                                                    }
                                                }, TaskData, true);
                                            });
                                        }, TaskData);
                                    }, TaskData);
                                } else {
                                    // 货币不足
                                    respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
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
                    respData.code = ERRCODES().FAILED;
                    protocol.responseSend(response, respData);
                }
            } else if (openRet === -1) {
                // 任务章节已开启
                respData.code = ERRCODES().TASK_CHAPTER_IS_OPEN;
                protocol.responseSend(response, respData);
            } else if (openRet === -2) {
                // 任务章节无法开启
                respData.code = ERRCODES().TASK_CHAPTER_NOT_UNLOCK;
                protocol.responseSend(response, respData);
            } else {
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        }, TaskData);
    });
}

/**
 * ActiveDegreeTakeAward - 活跃度领奖
 * @param {*} request { id }
 * @param {*} response 
 */
function ActiveDegreeTakeAward(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!isNaN(request.body.uuid) && !isNaN(request.body.id)) {
        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
        // 判断是否已领取
        player.checkActiveDegreeTake(request.body.id, takeRwdValid => {
            if (!takeRwdValid) {
                player.getActiveDegreeValue(actDegValue => {
                    var Bonus = ActiveDegreeAwardConfig.getBonus(request.body.id, actDegValue);
                    if (Bonus != null) {
                      
                            var hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
                            // 获取奖励
                            itemController.useItemList(Bonus, retData => {
                               
                                
                                // 加入活跃度已领奖励列表
                                player.addActiveDegreeRwdList(request.body.id, (actDegNode) => {
                                    Object.assign(respData, retData);
                                    respData.actDegData = actDegNode;
                                    request.multiController.save(async function(err,data){
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
                                }, true);
                                
                             
                            }, hero, player);
                       
                    } else {
                        // 活跃度未满足条件
                        respData.code = ERRCODES().ACTIVE_DEGREE_NOT_ENOUTH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 已领取
                respData.code = ERRCODES().ACTIVE_DEGREE_AWARD_IS_TAKE;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

exports.TaskList = TaskList;
exports.TasksValid = TasksValid;
exports.TaskGetAwards = TaskGetAwards;
exports.TaskChapterOpen = TaskChapterOpen;
exports.ActiveDegreeTakeAward = ActiveDegreeTakeAward;