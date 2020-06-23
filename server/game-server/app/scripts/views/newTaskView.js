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
const _ = require('lodash')
const CONSTANTS = require('./../../common/constants');
const Tasks = require('./../../designdata/Tasks');
/**
 * TaskList - 任务列表
 * @param {*} request { httpuuid, uuid }
 * @param {*} response
 */
async function TaskList(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    
    //TODO 任务列表获取
    // let taskList = await request.task.hgetAll(request.body.uuid)
    
    let taskList = await request.taskController.getTaskListData(request.body.uuid)
    let eventData = await request.taskController.getTaskCountData(request.body.uuid)
    // taskController.getTaskList(request.body.uuid, taskList => {
    respData.taskList = request.taskController.adjustTaskList(taskList);
    respData.taskEventData = eventData;
    protocol.responseSend(response, respData);
    // });
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
    taskController.taskGroupValid(request.body.uuid, getTaskGroup(request.body.triggerTasks, request.body.finishTasks), (taskList, realTriggerTaskLis, realFinishTaskLis) => {
        respData.taskList = [];
        respData.taskEventData = [];
        respData.triggerTasks = [];
        respData.finishTasks = [];
        //taskCounter(request.body.uuid, realFinishTaskGroup, taskEventData => {
            //respData.taskEventData = taskEventData;
            protocol.responseSend(response, respData);
        //});
    });
}

/**
 * TaskGetAwards - 获取任务奖励
 * @param {*} request { taskId }
 * @param {*} response
 */
async function TaskGetAwards(request, response)
{
    //TODO  更新周期奖励 领取奖励， 和任务周期任务重置
    function taskCounterTaskFinish(uuid, taskId, mainTaskValid, cb)
    {
        request.taskController.addPointObj( CONSTANTS.TASK_TRIGGER_TYPE.CompleteTasks, [{params:[taskId]}]);
        if (mainTaskValid) {
            request.taskController.addPointObj( CONSTANTS.TASK_TRIGGER_TYPE.CompleteMainTasks, [{params:[taskId]}]);
        }
        cb()
    }
    
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let isMainTask  = false;
    let taskNode = await request.taskController.getTaskData(request.body.uuid,request.body.taskId)
    
    
    if(_.isEmpty(taskNode)){
        respData.code = ERRCODES().TASK_CHAPTER_NOT_UNLOCK;
        protocol.responseSend(response, respData);
        return
    }else {
        
        if(taskNode.status === 2){
            respData.code = ERRCODES().TASK_AWARD_GETED;
            protocol.responseSend(response, respData);
            return ;
        }

        let taskMainConfig = global.FIXDB.FIXED_MAINTASKS[request.body.taskId];
        if(taskMainConfig){
            isMainTask = true;
        }
        let {taskStatus, taskGroup} =  await request.taskController.checkTaskStatValid(request.body.uuid, request.body.taskId);
        if(!taskStatus){
            respData.code = ERRCODES().TASK_NOT_COMPLETE;
            protocol.responseSend(response, respData);
            return ;
        }
        
        if(isMainTask){
            //TODO 主线相关
        }
        else {
            //TODO 任务相关
        }
        
        request.taskController.updateTaskStatus(request.body.taskId,taskGroup)
        let {BonusData, BonusExp} = await request.taskController.getTaskBonus(request.body.taskId);
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
                        
                       
                        //TODO 更新周期任务
                        // taskController.updateTaskByCycle(request.body.uuid, [request.body.taskId], retTaskLis => {
                        taskCounterTaskFinish(request.body.uuid, request.body.taskId, isMainTask, () => {
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
                        // });
                    });
                });
            });
        });
    }
}


/**
 * TaskChapterOpen - 任务章节开启
 * @param {*} request { taskId }
 * @param {*} response { taskId }
 */
async function TaskChapterOpen(request, response)
{
    
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 验证任务章节
    let taskMainConfig = global.FIXDB.FIXED_MAINTASKS[request.body.taskId];
    if(_.isEmpty(taskMainConfig)){
        //TODO 报错
        respData.code = ERRCODES().PARAMS_ERROR;
        return  protocol.responseSend(response, respData);
    }
    
    let isFirstMain = request.taskController.isFirstChapterTask(request.body.taskId)

    
    let isOpenTask = await request.taskController.isOpenTasks(request.body.uuid, request.body.taskId)
    if(isOpenTask){
        // //TODO 已经解锁
        respData.code = ERRCODES().CHAPTER_ALREADY_UNLOCK;
        return  protocol.responseSend(response, respData);
    }
    
    // let taskNode = await request.taskController.getTaskData(request.body.uuid, request.body.taskId)
    // if(!_.isEmpty(taskNode)){
    //     // //TODO 已经解锁
    //     respData.code = ERRCODES().CHAPTER_ALREADY_UNLOCK;
    //     return  protocol.responseSend(response, respData);
    // }

    let preTaskNode = {};
    let triggerList = []
    if(isFirstMain){
        triggerList = Tasks.getSubTaskList(request.body.taskId);
        triggerList.unshift(request.body.taskId);
    }else {

        // let preTask = taskMainConfig.PrevTaskID;
        // preTaskNode = await request.taskController.getTaskData(request.body.uuid, preTask);
        // if(_.isEmpty(preTaskNode)){
        //     // //TODO 前置未解锁
        //     respData.code = ERRCODES().PRE_CHAPTER_LOCKED;
        //     return  protocol.responseSend(response, respData);
        // }
        
        // TODO 判断前置任务状态 是否验证
        // if(preTaskNode.status === 0){
        //     respData.code = ERRCODES().PRE_TASK_NOT_COMPLETE;
        //     return  protocol.responseSend(response, respData);
        // }
        triggerList = Tasks.getSubTaskList(request.body.taskId);
        triggerList.unshift(request.body.taskId);
        
    }
    
    // let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon([])
    
    request.taskController.addChapter(triggerList)
    var CostData = TaskConfig.getOpenCost(request.body.taskId);
    if (CostData) {
        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.itemValid(CostData.items, itemValid => {
            if (itemValid) {
                player.currencyMultiValid(CostData.currency, currencyValid => {
                    if (currencyValid) {
                        player.costItem(CostData.items, () => {
                            player.costCurrencyMulti(CostData.currency, newCurrency => {
                                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockMainTask, [{params:[request.body.taskId]}])
                                var realCostRet = false;
                                if (CostData.items.length > 0) {
                                    realCostRet = true;
                                    respData.items = CostData.items;
                                }
                                if (CostData.currency.filter((a) => { return a > 0; }).length > 0) {
                                    realCostRet = true;
                                    respData.currency = newCurrency;
                                }
                                
                                if (realCostRet) {
                                    
                                    request.multiController.save(async function(err,data){
                                        if(err){
                                            respData.code = ERRCODES().FAILED;
                                            return  protocol.responseSend(response, respData);
                                        }
                                        respData.taskEventData = [];
                                        respData.taskList = [];
                                        try {
                                            let {taskList, taskEventData, openTask} = await request.taskController.taskUpdate(request.body.uuid)
                                            respData.taskEventData = taskEventData;
                                            respData.taskList = taskList;
                                            respData.openTask = openTask;
                                        }catch (e) {
                                            respData.code = ERRCODES().FAILED;
                                            return  protocol.responseSend(response, respData);
                                        }
                                        protocol.responseSend(response, respData);
                                    })
                                    
                                } else {
                                    
                                    request.multiController.save(async function(err,data){
                                        if(err){
                                            respData.code = ERRCODES().FAILED;
                                            return  protocol.responseSend(response, respData);
                                        }
                                        respData.taskList = [];
                                        respData.taskEventData = [];
                                        protocol.responseSend(response, respData);
                                    })
                                    
                                }
                            });
                        });
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