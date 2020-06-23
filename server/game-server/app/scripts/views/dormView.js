const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const dormController = require('./../controllers/dormController');
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const taskController = require('./../controllers/taskController');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * DormGetDoorData - 获取住宅信息
 * @param {*} request {dormId, dormName}
 * @param {*} response
 */
function DormGetDoorData(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
    dorm.dormGetDormData (dormdatas => {
        respData.dorminfos = dormdatas.dorminfos;
        respData.dormLevelUpInfo = dormdatas.dormLevelUpInfo;
        respData.dormRestInfo = dormdatas.dormRestInfo;
        respData.wakeUpHeroes = dormdatas.wakeUpHeroes;
        respData.updatedAttrs = dormdatas.updatedAttrs;
        respData.updateStats = dormdatas.updateStats;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                dorm.errorHandle()
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
 * DormDoorRepaire - 住宅修复
 * @param {*} request {dormId, dormName}
 * @param {*} response
 */
function DormDoorRepaire(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.dormId == null || request.body.dormId <= 0 || request.body.dormName == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.getLevel (level => {
            let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
            dorm.dormRepaire (level, request.body.dormId, request.body.dormName,retData => {
                console.log(retData)
                if (retData.status == 1) {
                    respData.code = ERRCODES().PLAYER_LEVEL_VALID_FAILED;
                    protocol.responseSend(response, respData);
                }else if (retData.status == 2) {
                    respData.code = ERRCODES().DORM_DOOR_NOT_NEED_REPAIRE;
                    protocol.responseSend(response, respData);
                }else if (retData.status == 3) {
                    respData.code = ERRCODES().DORM_DOOR_IS_REPAIRED;
                    protocol.responseSend(response, respData);
                }else if (retData.status == 4) {
                    respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                    protocol.responseSend(response, respData);
                }else if (retData.status == 5) {
                    respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                    protocol.responseSend(response, respData);
                }else {
                    respData.dormLeveUpInfo = retData.dormLeveUpInfo;
                    respData.itemcost = retData.itemcost;
                    respData.currency = retData.currency;
                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
    
                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HaveRooms,[{params:[request.body.dormId, 1]}]);
                        // taskController.addTaskCounter(TaskData, request.body.uuid, 503, [request.body.dormId, 1], () => {
                        //     taskController.getCounterDataByTypeGroup(request.body.uuid, [503], taskEventData => {
                        //         taskController.saveTaskDataFromSource(request.body.uuid, TaskData,  () => {
                        //             respData.taskEventData = taskEventData;
                                    request.multiController.save(async function(err,data){
                                        if(err){
                                            respData.code = ERRCODES().FAILED;
                                            dorm.errorHandle()
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
                                        "item":async function (cb) {
                                            await request.logServer.itemLog([request.body.uuid, request.Const.actions.repairHouse,retData.itemcost,[], request.Const.functions.house])
                                            cb(1)
                                        },
                                        "house": async function(cb){
                                            await request.logServer.HouseLog({uuid: request.body.uuid, actionId: request.Const.actions.repairHouse, doorId:request.body.dormId,rediactLevel: 1});
                                            cb(1)
                                        }
                                    },function (err,results) {
                                    })
                                // });
                            // }, TaskData);
                        // });
                    // });
                }
            });
        });
    }
}

/**
 * DormDoorModifyName - 住宅改名
 * @param {*} request {dormId, dormName}
 * @param {*} response
 */
function DormDoorModifyName(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.dormId == null || request.body.dormId <= 0 || request.body.dormName == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
        dorm.dormModifyName (request.body.dormId, request.body.dormName, retData => {
            if (retData.status == 1) {
                respData.code = ERRCODES().DORM_DOOR_IS_NOT_REPAIRED;
                protocol.responseSend(response, respData);
            }else {
                respData.dormLeveUpInfo = retData.dormLeveUpInfo;
                respData.dormId = request.body.dormId;
                respData.dormName = request.body.dormName;
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        dorm.errorHandle()
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
    }
}

/**
 * DormDoorLevelUp - 住宅升级
 * @param {*} request {dormId}
 * @param {*} response
 */
function DormDoorLevelUp(request, response)
{
    // 任务相关（广厦升级）
    function taskCounterDorm(uuid, dormId, dormLevel, callback, taskData)
    {
        taskController.addTaskCounter(taskData, uuid, 502, [dormId], () => {
            taskController.addTaskCounter(taskData, uuid, 503, [dormId, dormLevel], () => {
                taskController.getCounterDataByTypeGroup(uuid, [502, 503], taskEventData => {
                    taskController.saveTaskDataFromSource(uuid, taskData, () => {
                        callback(taskEventData);
                    });
                }, taskData);
            });
        });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.dormId == null || request.body.dormId <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.getLevel (level => {
            // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                dorm.dormLevelUp (level, request.body.dormId, retData => {
                    if (retData.status == 1) {
                        respData.code = ERRCODES().DORM_DOOR_IS_NOT_REPAIRED;
                        protocol.responseSend(response, respData);
                    }else if (retData.status == 2) {
                        respData.code = ERRCODES().DORM_DOOR_IS_MAX_LEVEL;
                        protocol.responseSend(response, respData);
                    }else if (retData.status == 3) {
                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }else if (retData.status == 4) {
                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }else {
                        respData.dormLeveUpInfo = retData.dormLeveUpInfo;
                        respData.itemcost = retData.itemcost;
                        respData.currency = retData.currency;
    
                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.RoomUpgrade,[{params:[request.body.dormId]}]);
                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HaveRooms,[{params:[request.body.dormId, retData.dormLeveUpInfo.level]}]);
                        
                        // taskCounterDorm(request.body.uuid, request.body.dormId, retData.dormLeveUpInfo.level, taskEventData => {
                        //     respData.taskEventData = taskEventData;
                            request.multiController.save(async function(err,data){
                                if(err){
                                    respData.code = ERRCODES().FAILED;
                                    dorm.errorHandle()
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
                                "item":async function (cb) {
                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.upLevelHouse,retData.itemcost,[], request.Const.functions.house])
                                    cb(1)
                                },
                                "house": async function(cb){
                                    await request.logServer.HouseLog({uuid:request.body.uuid,actionId:request.Const.actions.upLevelHouse,doorId: request.body.dormId,rediactLevel:retData.dormLeveUpInfo.level,comfort:retData.dormLeveUpInfo.comfort})
                                    cb(1)
                                }
                            },function (err,results) {
                            })
                        // });
                    }
                });
            // });
        });
    }
}


/**
 * DormDoorAssingedHero - 住宅分配墨魂
 * @param {*} request {heroId, dormId}
 * @param {*} response
 */
function DormDoorAssingedHero(request, response)
{
    // 任务相关（广厦）
    function taskCounterDorm(uuid, hid, callback)
    {
    
    
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSettleIn,[{params:[hid]}]);
        callback();
        
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     taskController.addTaskCounter(TaskData, uuid, 501, [hid], () => {
        //         taskController.getCounterDataByTypeGroup(uuid, [501], taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, TaskData);
        //     });
        // });
    }

    function firstSetViewMohun(uid, heroId, fn)
    {
        var player = new playerController(uid,request.multiController, request.taskController);
        player.getFirstViewMHFlag(firstViewMHFlag => {
            if (firstViewMHFlag == 0 && heroId == 310001) {
                player.setViewMohun(heroId, (viewmohun) => {
                    player.setFirstViewMHFlag(1, () => {
                        fn(viewmohun);
                    });
                });
            } else {
                fn(null);
            }
        });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.dormId == null || request.body.dormId <= 0 || request.body.heroId == null || request.body.heroId <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId;
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
                let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
                let newStat = heroController.STATS().HOUSEHOLD;
                hero.setStat (newStat, _ => {
                    respData.updateStat = { hid: heroId, stat: newStat};
                    firstSetViewMohun(request.body.uuid, heroId, (viewmohun) => {
                        if (viewmohun) respData.viewmohun = viewmohun;
                        // taskCounterDorm(request.body.uuid, request.body.heroId, () => {
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSettleIn,[{params:[request.body.heroId]}]);
                            request.multiController.save(async function(err,data){
                                if(err){
                                    respData.code = ERRCODES().FAILED;
                                    dorm.errorHandle()
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
                });
            }
        });
    }
}

/**
 * DormDoorKickout - 住宅退宿
 * @param {*} request {heroId}
 * @param {*} response
 */
function DormDoorKickout(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId
        let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
        hero.isIdle (isIdle => {
            if (isIdle) {
                let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                dorm.dormKickout (heroId, retData => {
                    respData.heroId = heroId;
                    let newStat = heroController.STATS().VAGRANTNESS;
                    hero.setStat (newStat, _ => {
                        respData.updateStat = { hid: heroId, stat: newStat};
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                dorm.errorHandle()
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
                });
            }else {
                respData.code = ERRCODES().DORM_DOOR_HERO_NOT_IDLE;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * DormSetHeroRest - 墨魂睡觉
 * @param {*} request {heroId, dormId, buildingId, tag, index, restData}
 * @param {*} response
 */
function DormHeroRest(request, response)
{
    // 任务相关（墨魂休息）
    function taskCounterDorm(uuid, hid, resttype, callback) {
        // duration 为秒
        taskController.getTaskDataFromSource(uuid, TaskData => {
            taskController.addTaskCounter(TaskData, uuid, 501, [hid], () => {
                taskController.addTaskCounter(TaskData, uuid, 510, [hid], () => {
                    taskController.addTaskCounter(TaskData, uuid, 511, [hid, resttype], () => {
                        taskController.getCounterDataByTypeGroup(uuid, [501, 510, 511], taskEventData => {
                            taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                                callback(taskEventData);
                            });
                        }, TaskData);
                    });
                });
            });
        });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <= 0 ||
        request.body.dormId == null || request.body.dormId < 0 ||
        request.body.buildingId == null || request.body.buildingId <= 0 ||
        request.body.tag == null || request.body.tag < 0 ||
        request.body.index == null || request.body.index < 0 ) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId
        let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
        hero.checkStatValid((statRet, status) => {
            if (statRet == heroController.CHECKSTATS ().VALID) {
                let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                let dormId = request.body.dormId;
                let buildingId = request.body.buildingId;
                let tag = request.body.tag;
                let restData = request.body.restData;

                let index = request.body.index;
                dorm.setDormHeroRest (heroId, dormId, buildingId, tag, index, restData, retData => {
                    if (retData.status == 0) {
                        respData.restInfo = retData.restInfo;
                        let newWorkStat = heroController.WORKSTATS().REST;
                        hero.setWorkStat (newWorkStat,  setStat => {
                            respData.updateStat = { hid:heroId, workStat: newWorkStat};
    
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroSettleIn,[{params:[heroId]}]);
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroRest,[{params:[heroId]}]);
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroRestTimes,[{params:[heroId,restData.resttype]}]);
                            //[501, 510, 511]
                            // taskCounterDorm(request.body.uuid, heroId, restData.resttype,  taskEventData => {
                            //     respData.taskEventData = taskEventData;
                                request.multiController.save(async function(err,data){
                                    if(err){
                                        respData.code = ERRCODES().FAILED;
                                        dorm.errorHandle()
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
                                    "participat":async function (cb) {
                                        await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.largeHourseSleep]);
                                        cb(1)
                                    },
                                    "house": async function(cb){
                                        await request.logServer.HouseLog({uuid:request.body.uuid,actionId:request.Const.actions.sleep, doorId:dormId,heroId:heroId,duration: restData.duration})
                                        cb(1)
                                    }
                                },function (err,results) {
                                })
                            // });
                        });
                    }else if (retData.status == 1) {
                        respData.code = ERRCODES().DORM_DOOR_HERO_ALREADY_REST;
                        protocol.responseSend(response, respData);
                    }
                });
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
    }
}

/**
 * DormHeroWakeUp - 墨魂叫醒
 * @param {*} request {heroId, dormId, comfortLevel, addEnergy}
 * @param {*} response
 */
function DormHeroWakeUp (request, response)
{
    // 任务相关（墨魂叫醒）
    function taskCounterDorm(uuid, hid, callback)
    {
        taskController.getTaskDataFromSource(uuid, TaskData => {
            taskController.addTaskCounter(TaskData, uuid, 512, [hid], () => {
                taskController.getCounterDataByTypeGroup(uuid, [512], taskEventData => {
                    taskController.saveTaskDataFromSource(uuid, TaskData, () => {
                        callback(taskEventData);
                    });
                }, TaskData);
            });
        });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null || request.body.heroId <= 0 ||
        request.body.dormId == null || request.body.dormId < 0 || request.body.comfortLevel < 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId;
        let dormId = request.body.dormId;
        let comfortLevel = request.body.comfortLevel;
        let addEnergy = request.body.addEnergy;

        let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
        hero.checkStatValid((statRet, status) => {
            if (statRet == heroController.CHECKSTATS ().VALID) {
                respData.code = ERRCODES().DORM_DOOR_HERO_NOT_REST;
                protocol.responseSend(response, respData);
            }else if (statRet == heroController.CHECKSTATS ().LOSS) {
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }else if (statRet == heroController.CHECKSTATS ().VAGRANTNESS) {
                respData.code = ERRCODES().HERO_NOT_IN_HOUSE;
                protocol.responseSend(response, respData);
            }else{
                if (status != heroController.WORKSTATS().REST) {
                    respData.code = ERRCODES().DORM_DOOR_HERO_NOT_REST;
                    protocol.responseSend(response, respData);
                }else {
                    let dorm = new dormController (request.body.uuid,request.multiController, request.taskController);
                    dorm.setDormHeroWakeUp (heroId, dormId, addEnergy, comfortLevel,  retData => {
                        if (retData.status == 0) {
                            respData.restTime = retData.restTime;
                            respData.heroId = heroId;
                            respData.comfortLevel = comfortLevel;

                            hero.addAttrEnergyCheckLimited (addEnergy, addAttrData => {
                                respData.addEnergy = addAttrData.realAdd;
                                respData.heroData = { hid:heroId, attrs: addAttrData.attrs};
                                let newWorkStat = heroController.WORKSTATS().IDLE;
                                hero.setWorkStat (newWorkStat, setStat => {
                                    respData.updateStat = { hid:heroId, workStat: newWorkStat};
                                    // taskCounterDorm(request.body.uuid, heroId,  taskEventData => {
                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroWeakUp,[{params:[heroId]}]);
                                        request.multiController.save(async function(err,data){
                                            if(err){
                                                respData.code = ERRCODES().FAILED;
                                                dorm.errorHandle()
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
                                            "item":async function (cb) {
                                                await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.largeHourseSleepStop]);
                                                cb(1)
                                            },
                                            "logCurrency": async function(cb){
                                                await request.logServer.HouseLog({uuid:request.body.uuid,actionId:request.Const.actions.sleepStop, doorId:dormId,heroId:heroId})
                                                cb(1)
                                            }
                                        },function (err,results) {
                                        })
                                    // });
                                });
                            });
                        }else if (retData.status == 1) {
                            respData.code = ERRCODES().DORM_DOOR_HERO_NOT_REST;
                            protocol.responseSend(response, respData);
                        }
                    });
                }
            }
        });
    }
}

exports.DormGetDoorData = DormGetDoorData;
exports.DormDoorRepaire = DormDoorRepaire;
exports.DormDoorModifyName = DormDoorModifyName;
exports.DormDoorLevelUp = DormDoorLevelUp;
exports.DormDoorAssingedHero = DormDoorAssingedHero;
exports.DormDoorKickout = DormDoorKickout;
exports.DormHeroRest = DormHeroRest;
exports.DormHeroWakeUp = DormHeroWakeUp;
