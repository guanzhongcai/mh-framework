const GameDB = require('./../../../index.app').GameDB;
const models = require('./../models');
const _ = require('lodash')
const CONSTANTS = require('./../../common/constants');
const ERRCODES = require('./../../common/error.codes');
const TaskConfig = require('./../../designdata/Tasks');
const ActiveDegreeAwardConfig = require('./../../designdata/ActiveDegreeConfig').ActiveDegreeAwardConfig;
const taskController = require('./../controllers/taskController');
const playerController = require('./../controllers/playerController');
const commonController = require('./../controllers/commonController');
const itemController = require('./../controllers/itemController');
const categoryFromItemList = require('./../controllers/fixedController').categoryFromItemList;

const heroController = require('./../controllers/heroController');
const Tasks = require('./../../designdata/Tasks');
const Achievement = require('./../../designdata/Achievement');
const async = require('async')
const protocol = require('./../../common/protocol');


function testAddItemAll(request, response)
{
    GameDB.findMany('ItemData', [], {}, docs => {
        for (let k in docs) {
            for (let itemNode of request.body.items) {
                if (itemNode.id === undefined || itemNode.id === null || itemNode.id <= 0 || itemNode.count < 1)
                    continue;

                var isFind = false;
                for (let i in docs[k].items) {
                    if (itemNode.id === docs[k].items[i].id) {
                        // 找到该物品进行叠加
                        docs[k].items[i].count += itemNode.count;
                        isFind = true;
                        break;
                    }
                }

                if (!isFind) {
                    // 未找到物品（是新物品）
                    var newItem = models.ItemModel();
                    newItem.id = itemNode.id;
                    newItem.count = itemNode.count;

                    if (JSON.stringify(docs[k].items) === '{}') {
                        docs[k].items = [];
                    }
                    docs[k].items.push(newItem);
                }
            }
        }

        GameDB.deleteMany('ItemData', {}, () => {
            GameDB.insertMany('ItemData', docs, () => {
                response.end(JSON.stringify({code: 0}));
            });
        });
    });
}
async function taskreward(request, response)
{
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
        response.end(JSON.stringify({code: 0}));
        return
    }else {
        
        if(taskNode.status === 2){
            response.end(JSON.stringify({code: 0}));
            return
        }
        
        
        request.taskController.checkMainChapter(request.body.taskId);
        let taskMainConfig = global.FIXDB.FIXED_MAINTASKS[request.body.taskId];
   
        if(taskMainConfig){
            isMainTask = true;
        }
        let taskStatus =  request.taskController.checkTaskStatValid(request.body.uuid, request.body.taskId);
        if(!taskStatus){
            respData.code = retErrCode;
            protocol.responseSend(response, respData);
        }
        
        if(taskMainConfig){
            //TODO 主线相关
        }
        else {
            //TODO 任务相关
            let taskConfigs = global.FIXDB.FIXED_MAINTASKS[request.body.taskId];
        }
        
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
                        
                        request.taskController.updateTaskStatus(request.body.taskId,2)
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
async function open(request, response){
    
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 验证任务章节
    
    let taskMainConfig = global.FIXDB.FIXED_MAINTASKS[request.body.taskId];

    if(_.isEmpty(taskMainConfig)){
        //TODO 报错
        respData.code = 101;
        protocol.responseSend(response, respData);
        return;
    }
    
    let isFirstMain = request.taskController.isFirstChapterTask(request.body.taskId)
    
    let taskNode = await request.taskController.getTaskData(request.body.uuid, request.body.taskId)
    
    if(!_.isEmpty(taskNode)){
        //TODO 已经解锁
        respData.code = 101;
        protocol.responseSend(response, respData);
        return;
    }
    
    

    let preTaskNode = {};
    console.log(isFirstMain);
    let triggerList = []
    if(isFirstMain){
        triggerList = Tasks.getSubTaskList(request.body.taskId);
        triggerList.unshift(request.body.taskId);
    }else {
        // console.log(taskMainConfig)
        // let preTask = taskMainConfig.PrevTaskID;
        // preTaskNode = await request.taskController.getTaskData(request.body.uuid, preTask);
        // if(preTaskNode.status >=2){
        //     triggerList = Tasks.getSubTaskList(request.body.taskId);
        //     triggerList.unshift(request.body.taskId);
        // }else {
        //     //TODO 前置任务未解锁
        //     // respData.code = 101;
        //     // protocol.responseSend(response, respData);
        //     // return;
        // }
        //
    
        triggerList = Tasks.getSubTaskList(request.body.taskId);
        triggerList.unshift(request.body.taskId);
        
        console.log(triggerList);
    }
    
    console.log("********************")
    console.log("********************")
    console.log(triggerList);
    
    // await request.taskController.mainTaskTrigger(request.body.uuid, triggerList);
    
    var CostData = TaskConfig.getOpenCost(request.body.taskId);
    
    
    console.log(CostData)
    if (CostData) {
        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
        console.log(CostData)
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
                                                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                        respData.taskEventData = taskEventData;
                                                        respData.taskList = taskList;
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

async function  taskTrigger(request, response){
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    
    
    let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon([])
    
    // //TODO 1
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItem, [{params:[440009,7], num:5 },{params:[440009,7], num:5 },{params:[423001,1], num:5 }])
    // //TODO 2
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CostItem, [{params:[440009,7], num:5 },{params:[440009,7], num:5 },{params:[423001,1], num:5 }])
    //
    // //TODO 3
    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.MoHenLevel,[{params:[0],num: 10, add:false}])
    //
    // //TODO 4 4-110004-1
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.RepairBuilding,[{params:[110004]}])
    //
    // //200411	逮捕小鱼干1条	TaskName_200411	TaskDesc_200411	1	0	200410	1	0	0	5	1	0	0	0	0	0	gongce_renwu_zhitiao_ziji.png	0	581-200400-1	""	""	5-0-1	600	""	0	""	0	1	""	0	0	310001
    // //TODO 5 5-0-N
    //
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CatchFish,[{params:[0], num:10}])
    // //TODO 6 6-400000-N
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CostCurrency,[{params:[410001], num:10}])
    // //TODO 7 7-0-N
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CheckInDays,[{params:[0]}])
    // //TODO 8`` 8-0-N
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Share,[{params:[0]}])
    // //TODO 101 101-0-N   310002
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetHero,[{params:[310002]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params:[310002, 1]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex,[{params:[310002, 0]}]);
    //
    // //TODO 101 101-0-N   310002
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockHeroSkin,[{params:[310002]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroQuality,[{params:[310002, 1]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSex,[{params:[310002, 0]}]);
    
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSettleIn,[{params:[333333]}]);
    //
    // //181-60000-10
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.OpenGame_lingGan,[{params:[60000, 1]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HaveRooms,[{params:[1, 1]}]);
    // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HaveRooms,[{params:[1, 1]}]);
    //
    
    
    let TasksObjCfg = Tasks.getTaskObjByGroupConfigCommon([])
    
    TasksObjCfg[100001]
    console.log(TasksObjCfg[100001])
    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Complete_QA,[{params:[310001]}]);
    
    
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

async function triggerTaskById(uuid, taskId){



}


async function achievementreward(request, response){
    

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let aId = request.body.achievementid;
    let aConfig =  Achievement.getAchievementConfigById(aId)
    if(!aConfig){
        respData.code = ERRCODES().FAILED;
        return  protocol.responseSend(response, respData);
    }
    
    
    let isExist = await request.taskController.getAchievementDataById(request.body.uuid, aId)
    console.log("1111111111111111111111")
    
    if(isExist){
        respData.code = ERRCODES().ACHIEVEMENT_REWARDED;
        return  protocol.responseSend(response, respData);
    }

    
    request.taskController.setAchievementRewardId(aConfig.Type, aConfig.AchievementId, aConfig.RewardsPoint)
    let hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
    let commonUtils = new commonController(request.body.uuid,request.multiController, request.taskController);
    let awardInfo = await commonUtils.sendReward(player, hero, aConfig.Rewards)
    
    awardInfo.currency?respData.currency = awardInfo.currency:respData.currency = [];
    awardInfo.heroSkinList?respData.heroSkinList = awardInfo.heroSkinList:respData.heroSkinList = [];
    awardInfo.addItems?respData.addItems = awardInfo.addItems:respData.addItems = [];
    awardInfo.heroList?respData.heroList = awardInfo.heroList:respData.heroList = [];
  
    request.multiController.save(async function(err, data){
        respData.taskEventData = [];
        respData.taskList = [];
        try {
            let {taskList, taskEventData, achievementScores} = await request.taskController.taskUpdate(request.body.uuid)
            respData.achievementScores = achievementScores;
            respData.taskEventData = taskEventData;
            respData.taskList = taskList;
        }catch (e) {
            respData.code = ERRCODES().FAILED;
            return  protocol.responseSend(response, respData);
        }
        return protocol.responseSend(response, respData);
    })

    
    
}


async function test(request, response){
    
    
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    
    request.taskController.updateDailyTask(request.body.uuid)
    
    request.multiController.save(async function(err, data){
        respData.taskEventData = [];
        respData.taskList = [];
        try {
            let {taskList, taskEventData, achievementScores} = await request.taskController.taskUpdate(request.body.uuid)
            respData.achievementScores = achievementScores;
            respData.taskEventData = taskEventData;
            respData.taskList = taskList;
        }catch (e) {
            respData.code = ERRCODES().FAILED;
            return  protocol.responseSend(response, respData);
        }
        return protocol.responseSend(response, respData);
    })
    
    
    
}



exports.triggerTaskById = triggerTaskById;

exports.testAddItemAll = testAddItemAll;
exports.open = open;
exports.taskTrigger = taskTrigger;
exports.achievementreward = achievementreward;
exports.test = test;