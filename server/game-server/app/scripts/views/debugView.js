const server = require('./../../../configs/server.json');
const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const debugController = require('./../controllers/debugController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const categoryFromItemList = require ('./../controllers/fixedController').categoryFromItemList;
const CONSTANTS = require('./../../common/constants');
const models = require('./../models');

//清除仓库
function debugClearDepot(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController,  request.taskController);
        debug.debugClearDepot (retData => {
            respData.optstatus = retData.optstatus;
            respData.items = retData.items;
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

//刷新系统 （灵感 魂力 探索 答题 订单 商店）
function debugResetRefreshTimes (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        debug.debugResetRefreshTimes (retData => {
            respData.optstatus = retData.optstatus;
            respData.inspData = retData.inspData;
            respData.soulGameData = retData.soulGameData;
            respData.gachaData = retData.gachaData;
            respData.restQuiz = retData.restQuiz;
            respData.orderData = retData.orderData;
            respData.shopData = retData.shopData;
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

//添加道具
function debugUpdateItemCount(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let items = request.body.items;
        debug.debugUpdateItemCount (items, retData => {
            respData.optstatus = retData.optstatus;
            respData.items = retData.items;
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

//增加道具个数
function debugAddItemCount (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let count = request.body.count;
        debug.debugAddItemCount (count, retData => {
            respData.optstatus = retData.optstatus;
            respData.items = retData.items;
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

//添加货币
function debugUpdateUserCurrency(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let currency = request.body.currency;
        debug.debugUpdateUserCurrency (currency, retData => {
            respData.optstatus = retData.optstatus;
            respData.currency = retData.currency;
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

//添加经验
function debugAddExp(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let exp = request.body.exp;
        let player = new playerController (request.body.uuid, request.multiController, request.taskController);
        debug.debugAddExp (player, exp, retData => {
            respData.optstatus = retData.optstatus;
            let levelData = retData.userLevelData;
            respData.userLevelData = levelData;
            let totalReward = [];
            if (levelData.levelUpAwardItems != null) {
                for (let i in levelData.levelUpAwardItems) {
                    totalReward.push (levelData.levelUpAwardItems[i]);
                }
            }
            let awards = categoryFromItemList(totalReward);
            player.addItem (awards.items, itemRet => {
                player.addCurrencyMulti (awards.currency, currencyRet => {
                    respData.currency = currencyRet;
                    respData.addItems = itemRet;
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
    }
}

//添加墨魂
function debugAddMohun(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let heroId = request.body.heroId;
        debug.debugAddMohun (heroId, retData => {
            respData.optstatus = retData.optstatus;
            respData.mhdata = retData.mhdata;
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

//添加墨魂属性
function debugAddMohunAttrs (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    }else {
        let debug = new debugController (request.body.uuid,request.multiController, request.taskController);
        let heroId = request.body.heroId;
        let attrs = request.body.attrs;
        debug.debugAddMohunAttrs (heroId, attrs, retData => {
            respData.optstatus = retData.optstatus;
            respData.attrs = retData.attrs;
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



// 开启追求树
async function debugOpenPursueTree(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (!server.enableClientDebug) {
        respData.optstatus = false;
        protocol.responseSend(response, respData);
    } else {
        let debug = new debugController(request.body.uuid, request.multiController, request.taskController);
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        let hero = new heroController(request.body.uuid, request.body.heroId, request.multiController, request.taskController);
        
            let retData = await debug.openPursueTreeAllByHeroId(player, hero, request.body.heroId, request.multiController, request.taskController);
            respData.optstatus = retData.optstatus;
            respData.pursueTreeList = retData.pursueTreeList;
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

exports.debugClearDepot = debugClearDepot;
exports.debugResetRefreshTimes = debugResetRefreshTimes;
exports.debugUpdateItemCount = debugUpdateItemCount;
exports.debugAddItemCount = debugAddItemCount;
exports.debugUpdateUserCurrency = debugUpdateUserCurrency;
exports.debugAddExp = debugAddExp;
exports.debugAddMohun = debugAddMohun;
exports.debugAddMohunAttrs = debugAddMohunAttrs;
exports.debugOpenPursueTree = debugOpenPursueTree;
