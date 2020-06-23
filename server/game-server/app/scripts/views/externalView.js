const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const playerController = require('./../controllers/playerController');
const externalController = require('./../controllers/externalController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const utils = require('./../../common/utils');
const categoryFromItemList = require ('./../controllers/fixedController').categoryFromItemList;
const Defaults = require('./../../designdata/Defaults');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
const models = require('./../models');

const QUIZ_ADD_EXP  = 1; //奖励亲密度
const QUIZ_ADD_FEEL = 2; //奖励魂力

/**
 * GetExternalData
 * @param {*} request {}
 * @param {*} response
 */
function GetExternalData (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let external = new externalController (request.body.uuid, request.multiController, request.taskController);
    external.getGameExternalData ( external => {
        respData.quiz = external.quiz;
        respData.helptimes = external.helptimes;
        respData.quizitem = external.quizitem;
        respData.unlockinfo = external.unlockinfo;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                external.errorHandle()
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
 * CollectQuizItem
 * @param {*} request
 * @param {*} response
 */
function CollectQuizItem (request, response)
{
    try{
        let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
        let external = new externalController (request.body.uuid,request.multiController, request.taskController);
        external.collectQuizItem (retData => {
            if (retData.status == 0) {
                respData.quizitem = retData.quizitem;
                respData.item = retData.item;
                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                let addItems = [];
                addItems.push (retData.item);
                player.addItem (addItems, async _ => {
                    request.multiController.save(async function(err,data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            external.errorHandle()
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
                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.recevie,[],addItems, request.Const.functions.jointPoem])
                    
                });
            }else{
                respData.code = ERRCODES().EXTERNAL_DATA_QUIZ_ITEM_NOTREADY;
                protocol.responseSend(response, respData);
            }
        });
    }catch (e) {
    }
}

/**
 * startQuiz
 * @param {*} request {}
 * @param {*} response
 */
function StartQuiz (request, response)
{
    function taskCounterQuiz(uuid, mode, callback)
    {
        if(mode === 0){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CompletePracticeMode,[{params:[0]}]);
        }
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.FeedTheCat,[{params:[0]}]);
        callback()
        
    
        // function doMode(tskData, iuuid, mod, callback) {
        //     if (mod === 0) {
        //         taskController.addTaskCounter(tskData, iuuid, 202, [0], () => {
        //             callback();
        //         });
        //     } else {
        //         callback();
        //     }
        // }
        //
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     doMode(TaskData, uuid, mode, () => {
        //         taskController.addTaskCounter(TaskData, uuid, 204, [0], () => {
        //             taskController.getCounterDataByTypeGroup(uuid, [204], taskEventData => {
        //                 taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                     callback(taskEventData);
        //                 });
        //             }, TaskData);
        //         });
        //     });
        // });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <= 0 || request.body.mode == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId;
        let mode = request.body.mode;
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        let hero = new heroController(request.body.uuid, heroId, request.multiController, request.taskController);
        let costitem = [];
        if (mode == 0) {
            costitem.push ({id: Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZHELPITEMID), count: Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZHELPITEMIDCOUNT)});
        }else {
            costitem.push ({id: Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMID), count: Defaults.getDefaultValueConfigAsyncType(Defaults.DEFAULTS_VALS().QUIZCOSTITEMIDCOUNT)});
        }
        player.itemValid (costitem, async isValid=> {
            if (isValid){
                let external = new externalController (request.body.uuid,request.multiController, request.taskController);
                let retData = await external.isHeroCanAttendQuiz (hero, heroId, mode);
                if (retData.status == 0) {
                    respData.code = ERRCODES().EXTERNAL_DATA_HERO_CANNOT_QUIZ;
                    protocol.responseSend(response, respData);
                }else{
                    if (retData.count <= 0) {
                        respData.code = ERRCODES().EXTERNAL_DATA_HERO_QUIZ_NOTIME;
                        protocol.responseSend(response, respData);
                    }else {
                        player.costItem (costitem, _ => {
                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                            //     respData.taskEventData = taskEventData;
                                respData.costItem = costitem;
                                taskCounterQuiz(request.body.uuid, mode,  () => {
                                    
                                    if (mode === 0) {
                                        request.multiController.save(async function(err,data){
                                            if(err){
                                                respData.code = ERRCODES().FAILED;
                                                external.errorHandle()
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
                                            "Poem":async function (cb) {
                                                await request.logServer.PoemLog({uuid: request.body.uuid,actionId:request.Const.actions.answerCat,heroId: heroId})
                                                cb(1)
                                            },
                                            "logCurrency": async function(cb){
                                                await request.logServer.itemLog([request.body.uuid, request.Const.actions.answerCat,costitem,[], request.Const.functions.jointPoem])
                                                cb(1)
                                            }
                                        },function (err,results) {
                                        })
                                    }else {
                                        external.updateQuizHelpTime (0, true, helptimes => {
                                            respData.helptimes = helptimes;
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    external.errorHandle()
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
                                                "Poem":async function (cb) {
                                                    await request.logServer.PoemLog({uuid: request.body.uuid,actionId:request.Const.actions.answerHero,heroId: heroId})
                                                    cb(1)
                                                },
                                                "Participat": async function(cb){
                                                    await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.jointPoem]);
                                                    cb(1)
                                                },
                                                "item": async function(cb){
                                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.answerHero,costitem,[], request.Const.functions.jointPoem])
                                                    cb(1)
                                                }
                                            },function (err,results) {
                                            })
                                        });
                                    }
                                });
                            // });
                        });
                    }
                }
            }else {
                respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * startQuiz
 * @param {*} request {} heroId, itemId, Time
 * @param {*} response item
 */
function GetQuizResult (request, response)
{
    // 任务相关（答题完成）
    function taskCounterQuizResult(uuid, hid, quizLevel, callback, taskData) {
        
        if (quizLevel >= 1 && quizLevel <= 3) {
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.AllGradeComplete,[{params:[0]}]);
        }
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetEvaluate_A,[{params:[hid, quizLevel ]}]);
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Complete_QA,[{params:[hid]}]);
        callback();
        
        // function doTask205(uid, tskData, qlevel, fn) {
        //     if (qlevel >= 1 && qlevel <= 3) {
        //         taskController.addTaskCounter(tskData, uid, 205, [0], () => {
        //             fn();
        //         });
        //     } else {
        //         fn();
        //     }
        // }
        //
        // doTask205(uuid, taskData, quizLevel, () => {
        //     taskController.addTaskCounter(taskData, uuid, 201, [hid, quizLevel], () => {
        //         taskController.addTaskCounter(taskData, uuid, 203, [hid], () => {
        //             taskController.getCounterDataByTypeGroup(uuid, [1, 201, 203, 205], taskEventData => {
        //                 taskController.saveTaskDataFromSource(uuid, taskData, () => {
        //                     callback(taskEventData);
        //                 });
        //             }, taskData);
        //         });
        //     });
        // });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <= 0 || request.body.time == null || request.body.itemId == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let external = new externalController (request.body.uuid,request.multiController, request.taskController);
        let heroId = request.body.heroId;
        let time = request.body.time;
        let itemId = request.body.itemId;

        external.getQuizResult (time, quizReward => {
            external.updateHeroQuizUsedCount (heroId, 1, quizData => {
                respData.quizData = quizData;
                let item = {id:itemId, count:quizReward.RewardCount};
                let rewardItems = [];
                for (let i in quizReward.RewardItems) {
                    rewardItems.push (quizReward.RewardItems[i]);
                }

                respData.item = item;
                respData.rewarditems = rewardItems;
                let totalReward = [].concat (rewardItems);
                totalReward.push (item);
                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                if (quizReward.Exp != 0) {
                    
                        player.addExp (quizReward.Exp, levelData =>{
                            respData.userLevelData = levelData;
                            if (levelData.levelUpAwardItems != null) {
                                for (let i in levelData.levelUpAwardItems) {
                                    totalReward.push (levelData.levelUpAwardItems[i]);
                                }
                            }
                            let awards = categoryFromItemList(totalReward);
                            
                                player.addItem (awards.items, itemRet => {
                                    player.addCurrencyMulti (awards.currency, currencyRet => {
                                        taskCounterQuizResult(request.body.uuid, request.body.heroId, quizReward.Id, () => {
                                            
                                            if (quizReward.RewardAttrs.length >= 1) {
                                                let addMohunAttr = models.MohunAttr();
                                                for (let i in quizReward.RewardAttrs) {
                                                    if (quizReward.RewardAttrs[i].id == QUIZ_ADD_EXP) {
                                                        addMohunAttr.exp = quizReward.RewardAttrs[i].count;
                                                    }else if (quizReward.RewardAttrs[i].id == QUIZ_ADD_FEEL) {
                                                        addMohunAttr.feel = quizReward.RewardAttrs[i].count;
                                                    }
                                                }
                                                let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
                                                hero.addAttrs (addMohunAttr,  newAttrs => {
                                                    respData.heroData = {hid:heroId, attr:newAttrs};
                                                    request.multiController.save(async function(err,data){
                                                        if(err){
                                                            respData.code = ERRCODES().FAILED;
                                                            hero.errorHandle()
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
                                                        "Poem":async function (cb) {
                                                            await request.logServer.PoemLog({uuid: request.body.uuid,actionId:request.Const.actions.answerHero,time: request.body.time,heroId: heroId})
                                                            cb(1)
                                                        },
                                                        "itemLog": async function(cb){
                                                            if(awards.items.length > 0){
                                                                await request.logServer.itemLog([request.body.uuid, request.Const.actions.openWork,[],awards.items, request.Const.functions.jointPoem])
                                                            }
                                                            cb(1)
                                                        },
                                                        "logCurrency": async function(cb){
                                                            await request.logServer.logCurrency(request.body.uuid,request.Const.actions.openWork,request.Const.functions.produce,0,awards.currency, currencyRet)
                                                            cb(1)
                                                        },
                                                        "addLevel": async function(cb){
                                                            await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.openWork,functionId: request.Const.functions.produce}))
                                                            cb(1)
                                                        }
                                                    },function (err,results) {
                                                    })
                                                });
                                            }else {
                                                request.multiController.save(async function(err,data){
                                                    if(err){
                                                        respData.code = ERRCODES().FAILED;
                                                        hero.errorHandle()
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
                                        });
                                    });
                                });
                            
                        });
                 
                }else {
                    
                        player.addItem(totalReward, _ => {
                            taskCounterQuizResult(request.body.uuid, request.body.heroId, quizReward.Id, () => {
                                if (quizReward.RewardAttrs.length >= 1) {
                                    let addMohunAttr = models.MohunAttr();
                                    for (let i in quizReward.RewardAttrs) {
                                        if (quizReward.RewardAttrs[i].id == QUIZ_ADD_EXP) {
                                            addMohunAttr.exp = quizReward.RewardAttrs[i].count;
                                        }else if (quizReward.RewardAttrs[i].id == QUIZ_ADD_FEEL) {
                                            addMohunAttr.feel = quizReward.RewardAttrs[i].count;
                                        }
                                    }
                                    let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
                                    hero.addAttrs (addMohunAttr, newAttrs => {
                                        respData.heroData = {hid:heroId, attr:newAttrs};
                                        request.multiController.save(async function(err,data){
                                            if(err){
                                                respData.code = ERRCODES().FAILED;
                                                hero.errorHandle()
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
                                }else {
                                    protocol.responseSend(response, respData);
                                }
                            });
                        });
                    
                }
            });
        });
    }
}


/**
 * ReduceItem
 * @param {*} request {} items = [id, count]
 * @param {*} response item
 */
function ReduceItem (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.items == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.itemValid (request.body.items, valid => {
            if (valid) {
                player.costItem (request.body.items, _=> {
                    taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                        respData.taskEventData = taskEventData;
                        respData.costItems = request.body.items;
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
                });
            }else {
                respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * UseQuizHelp
 * @param {*} request {}
 * @param {*} response item
 */
function UseQuizHelp (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.mode == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let external = new externalController (request.body.uuid, request.multiController, request.taskController);
        external.calcHelpUseItemData (retData => {
            if (retData.status == -1) {
                respData.code = ERRCODES().EXTERNAL_DATA_QUIZ_USE_HELP_MAXTIME;
                protocol.responseSend(response, respData);
            }else {
                let CostData = retData.CostData;
                let player = new playerController(request.body.uuid, request.multiController, request.taskController);
                player.currencyMultiValid(CostData.currency, currencyRet => {
                    if (currencyRet) {
                        player.itemValid(CostData.items, itemValid => {
                            if (itemValid) {
                                external.updateQuizHelpTime (1, false, helptimes => {
                                    respData.helptimes = helptimes;
                                    player.costCurrencyMulti(CostData.currency, newCurrency => {
                                        respData.currency = newCurrency;
                                        player.costItem (CostData.items, _=> {
                                            taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                                                respData.taskEventData = taskEventData;
                                                respData.costItems = CostData.items;
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
                                        });
                                    });
                                });
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
            }
        });
    }
}

/**
 * UnlockFunction
 * @param {*} request {} type, id, items
 * @param {*} response unlockinfo, costItems
 */
function UnlockFunction (request, response)
{
    function taskCounterBuild(uuid, type, bid, callback)
    {
        if(type === 1){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.RepairBuilding,[{params:[bid]}]);
            callback (null);
        }else {
            callback(null);
        }
        // if (type === 1) {
        //     taskController.getTaskDataFromSource(uuid, TaskData => {
        //         taskController.addTaskCounter(TaskData, uuid, 4, [bid], () => {
        //             taskController.getCounterDataByTypeGroup(uuid, [4], taskEventData => {
        //                 taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                     callback(taskEventData);
        //                 });
        //             }, TaskData);
        //         });
        //     });
        // } else {
        //     callback(null);
        // }
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.type == null || request.body.id == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        let costData = categoryFromItemList(utils.getItemArraySplitTwice(request.body.items, '|', ','));
        player.currencyMultiValid(costData.currency, currencyRet => {
            if (currencyRet) {
                player.itemValid(costData.items, itemRet => {
                    if (itemRet) {
                        let external = new externalController (request.body.uuid,request.multiController, request.taskController);
                        external.startUnlockFunction (request.body.type, request.body.id, retData => {
                            if (retData.status == 1) {
                                respData.code = ERRCODES().EXTERNAL_DATA_FUNCTION_ALREADY_UNLOCK;
                                protocol.responseSend(response, respData);
                            }else {
                                taskCounterBuild(request.body.uuid, request.body.type, request.body.id, () => {
                                    
                                    respData.unlockdata = retData.unlockdata;
                                    player.costCurrencyMulti (costData.currency, currency => {
                                        respData.currency = currency;
                                        player.costItem (costData.items,  _=> {
                                            respData.costItems = costData.items;
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
                                            async.parallel({
                                                "itemLog": async function(cb){
                                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.unlock,costData.items,[], request.Const.functions.unlock])
                                                    cb(1)
                                                },
                                                "logCurrency": async function(cb){
                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.unlock,request.Const.functions.unlock,1,costData.currency,currency)
                                                    cb(1)
                                                }
                                            },function (err,results) {
                                            })
                                        });
                                    });
                                });
                            }
                        });
                    }else {
                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            }else {
                respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    }
}


exports.GetExternalData = GetExternalData;
exports.GetQuizResult = GetQuizResult;
exports.StartQuiz = StartQuiz;
exports.CollectQuizItem = CollectQuizItem;
exports.UseQuizHelp = UseQuizHelp;
exports.ReduceItem = ReduceItem;
exports.UnlockFunction = UnlockFunction;
