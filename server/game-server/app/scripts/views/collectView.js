const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const collectController = require('./../controllers/collectController');
const taskController = require('./../controllers/taskController');
const CONSTANTS = require('./../../common/constants');

/**
 * GetGameCollectData
 * @param {*} request {}
 * @param {*} response
 */
function GetGameCollectData (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
    collect.getGameCollectData (collectData => {
        if (collectData.poetrys) respData.poetrys = collectData.poetrys;
        if (collectData.scenes) respData.scenes = collectData.scenes;
        if (collectData.sounds) respData.sounds = collectData.sounds;
        if (collectData.cgs) respData.cgs = collectData.cgs;
        if (collectData.backgrounds) respData.backgrounds = collectData.backgrounds;
        if (collectData.npcs) respData.npcs = collectData.npcs;
        if (collectData.words) respData.words = collectData.words;
        if (collectData.buildings) respData.buildings = collectData.buildings;
        if (collectData.formulas) respData.formulas = collectData.formulas;
        if (collectData.gifts) respData.gifts = collectData.gifts;
        
        collect.getShelfPlacementData (placement => {
            if (placement != null )  respData.placement = placement;
            request.multiController.save(async function(err,data){
                if(err){
                    respData.code = ERRCODES().FAILED;
                    return  protocol.responseSend(response, respData);
                }
                protocol.responseSend(response, respData);
            })
        });
    });
}

/**
 * AddNewPoetry
 * @param {*} request {poetryid}
 * @param {*} response
 */
function AddNewPoetry (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.poetryid == null || request.body.poetryid <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        
        collect.addNewPoetry (request.body.poetryid, poetryData=> {
            
             // TODO  收集诗集 参数缺少heroid 表问题或者前端传
            
            if(request.body.heroid){
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CollectNotes,[{params:[request.body.heroid]}]);
            }
    
            respData.poetryData = poetryData;
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
}

/**
 * AddNewScene
 * @param {*} request {sceneid, backgrounds, npcs, words, poetry, gifts}
 * @param {*} response
 */
function AddNewScene (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.sceneid == null || request.body.sceneid <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid, request.multiController, request.taskController);
        let unlockItem = {}
        if (request.body.backgrounds) unlockItem.backgrounds = request.body.backgrounds;
        if (request.body.npcs) unlockItem.npcs = request.body.npcs || [];
        if (request.body.words) unlockItem.words = request.body.words;
        if (request.body.poetry) unlockItem.poetry = request.body.poetry;
        if (request.body.gifts) unlockItem.gifts = request.body.gifts;
        collect.addNewScene (request.body.sceneid, unlockItem, async (addStatus, unlockData)=> {
            if (addStatus) {
                //TODO 收集场景
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Collect_Scene, [{params: [0]}])
                //任务数据处
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.WatchPlot, [{params: [request.body.sceneid]}]);
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroAppointNode, [{params: [request.body.sceneid]}]);

                if (unlockData.gifts != null && unlockData.gifts.length){
                    request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Collect_Gifts, [{params: [0]}])
                }

                respData.unlockData = unlockData;
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
         

    
                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                //     taskController.addTaskCounter(TaskData, request.body.uuid, 743, [request.body.sceneid], () => {
                //         taskController.addTaskCounter(TaskData, request.body.uuid, 123, [request.body.sceneid], () => {
                //             taskController.getCounterDataByTypeGroup(request.body.uuid, [123, 743], taskEventData => {
                //                 taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                //                     respData.taskEventData = taskEventData;
                //                     respData.unlockData = unlockData;
                //                     request.multiController.save(async function(err,data){
                //                         if(err){
                //                             respData.code = ERRCODES().FAILED;
                //                             return  protocol.responseSend(response, respData);
                //                         }
                //                         protocol.responseSend(response, respData);
                //                     })
                //                 });
                //             }, TaskData);
                //         });
                //     });
                // });
            }else {
                respData.code = ERRCODES().COLLECT_ALREADY_GOT;
                return  protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * AddNewHeroSound
 * @param {*} request {soundid}
 * @param {*} response
 */
function AddNewHeroSound (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.soundid == null || request.body.soundid <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        collect.addNewHeroSound (request.body.soundid, soundData=> {
            respData.soundData = soundData;
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
}

/**
 * AddNewCG
 * @param {*} request {cgid}
 * @param {*} response
 */
function AddNewCG (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.cgid == null || request.body.cgid <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        collect.addNewCG (request.body.cgid, cgData=> {
            
            //TODO 获取CG
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Collect_CG,[{params:[0]}])
            
            respData.cgData = cgData;
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
}


/**
 * UpdatePoetrysNewStatus
 * @param {*} request {poetryids, status}
 * @param {*} response
 */
function UpdatePoetrysNewStatus (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.poetryids == null || request.body.status == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        let poetryids = request.body.poetryids;
        let status = request.body.status
        collect.updatePoetrysNewStatus (poetryids, status, updateIds=> {
            respData.poetryids = updateIds;
            respData.new = status;
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
}

/**
 * UpdatePoetrysCreatedStatus
 * @param {*} request {poetryids, status}
 * @param {*} response
 */
function UpdatePoetrysCreatedStatus (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.poetryids == null || request.body.status == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        let poetryids = request.body.poetryids;
        let status = request.body.status
        collect.updatePoetrysCreatedStatus (poetryids, status, updateIds=> {
            respData.poetryids = updateIds;
            respData.created = status;
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
}

/**
 * UpdateScenesNewStatus
 * @param {*} request {sceneids, status}
 * @param {*} response
 */
function UpdateScenesNewStatus (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.sceneids == null || request.body.status == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        let sceneids = request.body.sceneids;
        let status = request.body.status
        collect.updateScenesNewStatus (sceneids, status, updateIds=> {
            respData.sceneids = updateIds;
            respData.new = status;
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
}

/**
 * UpdateHeroesSoundStatus
 * @param {*} request {soundids, status}
 * @param {*} response
 */
function UpdateHeroesSoundStatus (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.soundids == null || request.body.status == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        let soundids = request.body.soundids;
        let status = request.body.status
        collect.updateHeroesSoundStatus (soundids, status, updateIds=> {
            respData.soundids = updateIds;
            respData.new = status;
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
}

/**
 * UpdateCGsStatus
 * @param {*} request {cgids, status}
 * @param {*} response
 */
function UpdateCGsStatus (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.cgids == null || request.body.status == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid,request.multiController, request.taskController);
        let cgids = request.body.cgids;
        let status = request.body.status
        collect.updateScenesNewStatus (cgids, status, updateIds=> {
            respData.cgids = updateIds;
            respData.new = status;
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
}

/**
 * UploadUserShelfPlacement
 * @param {*} request {cgids, status}
 * @param {*} response
 */
function UploadUserShelfPlacement (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.placement == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let collect = new collectController (request.body.uuid, request.multiController, request.taskController);
        collect.setShelfPlacementData(request.body.placement,_=> {
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
}

exports.GetGameCollectData = GetGameCollectData;
exports.AddNewCG = AddNewCG;
exports.AddNewScene = AddNewScene;
exports.AddNewHeroSound = AddNewHeroSound;
exports.AddNewPoetry = AddNewPoetry;
exports.UpdatePoetrysNewStatus = UpdatePoetrysNewStatus;
exports.UpdatePoetrysCreatedStatus = UpdatePoetrysCreatedStatus;
exports.UpdateScenesNewStatus = UpdateScenesNewStatus;
exports.UpdateHeroesSoundStatus = UpdateHeroesSoundStatus;
exports.UpdateCGsStatus = UpdateCGsStatus;
exports.UploadUserShelfPlacement = UploadUserShelfPlacement;
