const ERRCODES = require('./../../common/error.codes');
const utils = require('./../../common/utils');
const protocol = require('./../../common/protocol');
const gameController = require('./../controllers/gameController');
const inspController = require('./../controllers/inspController');
const gachaController = require('./../controllers/gachaController');
const soulController = require ('./../controllers/soulController');
const playerController = require('./../controllers/playerController');
const hotSpringController = require ('./../controllers/hotSpringController');
const stockController = require('./../controllers/stockController');
const mapController = require('./../controllers/mapController');
const taskController = require('./../controllers/taskController');
const Notification = require('./../controllers/notifController').Notification;
const async = require('async')
const CONSTANTS = require('./../../common/constants');
function fetchServerTime(request, response)
{
    var timeStamp = (new Date()).getTime();
    var respData = {
        httpuuid: request.body.httpuuid,
        CmdId: "fetchservertime",
        TimeStamp: timeStamp.toString()
    }
    protocol.responseSend(response, respData);
}

function GameData(request, response)
{
    
    
    async function getTaskData(uuid)
    {
        try {
            let taskEventData = await request.taskController.getTaskCountData(uuid);
            let taskList = await request.taskController.getTaskList(uuid);
            return {taskList,taskEventData };
        }catch (e) {
            return {taskList:[],taskEventData:[] };
        }
    }
    
    
    
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    game.getGameData (respData, async retData => {
    
    
        /*
        * TODO task.checkTaskInit(uuid);
        *  用于用户任务数据初始化
        */
        await request.taskController.checkTaskInit(request.body.uuid, new Date().getTime());
        let  taskData  = await getTaskData(request.body.uuid)
        retData.taskEventData = taskData.taskEventData;
        retData.taskList =  request.taskController.adjustTaskList(taskData.taskList);
        retData.openTaskList = await request.taskController.getOpenTasks(request.body.uuid);
        var notif = new Notification(request.body.uuid);
        notif.load(() => {
            notif.clear(); // 登录清除通知相关数据（离线玩家使用）
            notif.save(() => {
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        return  protocol.responseSend(response, respData);
                    }
                    protocol.responseSend(response, respData);
                })
            });
        });
    });
}

function CheckViewRespects (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    game.checkViewRespect (retData => {
        respData.curRespectType = retData.curRespectType;
        respData.curRewards = retData.curRewards;
        respData.intervaldays = retData.intervaldays;
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


function ViewRespectsCheckIn (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    let respType = request.body.curRespectType;
    let curRewards = request.body.curRewards;
    game.viewRespectCheckIn (respType, curRewards, retData => {
        if (retData.status == 0) {
            // respData.taskEventData = retData.taskEventData;
            respData.addItems = retData.addItems;
            respData.currency = retData.currency;
            respData.heroList = retData.heroList;
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
        }else if (retData.status == 1) {
            respData.code = ERRCODES().VIEWRESPECT_ALREADY_GETAWARD;
            protocol.responseSend(response, respData);
        }else {
            respData.code = ERRCODES().VIEWRESPECT_PARAMS_ERROR;
            protocol.responseSend(response, respData);
        }
    });
}

// 公告列表
function NoticeList(request, response)
{
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    game.getNoticeList(noticeLis => {
        protocol.responseSend(response, {
            httpuuid: request.body.httpuuid,
            code: 200,
            noticeList: noticeLis
        })
    });
}

// 公告领取附件
// request { httpuuid, uuid, pubid }
function NoticeRewardAttch(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    // 判断是否已领取
    game.checkNoticeAttchRewardValid(request.body.uuid, request.body.pubid, valid => {
        if (valid) {
            // 获取公告附件
            game.getNoticeAttchAward(request.body.pubid, noticeAttch => {
                if (noticeAttch.length === 0) {
                    // 没有附件
                    respData.code = ERRCODES().NOTICE_NO_ATTCH;
                    protocol.responseSend(response, respData);
                } else {
                    // 加入已领取列表中
                    game.addNoticeAttchRwdList(request.body.uuid, request.body.pubid, 1, () => {
                        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                        // 加入附件获得物品
                     
                            player.addItem(noticeAttch.items, () => {
                                player.addCurrencyMulti(noticeAttch.currency, async newCurrency => {
                                    respData.currency = newCurrency;
                                    respData.addItems = noticeAttch.items;
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
                                    
                                }, TaskData);
                            }, TaskData);
                       
                    });
                }
            });
        } else {
            // 该附件已被领取
            respData.code = ERRCODES().NOTICE_ATTCH_GETED;
            protocol.responseSend(response, respData);
        }
    });
}

// 玩家心跳包（更新活跃时间）
function PlayerHeartBeat(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let game = new gameController (request.body.uuid,request.multiController, request.taskController);
    game.updateHeartBeatTime(request.body.uuid, (new Date()).getTime(), upTime => {
        respData.upTime = upTime;
        protocol.responseSend(response, respData);
    });
}

function PlayerMapAndStock(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var stock = new stockController(request.body.uuid,request.multiController, request.taskController),
        map = new mapController(request.body.uuid,request.multiController, request.taskController);
    stock.getStock(stockLis => {
        map.getMapData(mapLis => {
            respData.stocks = stockLis;
            respData.maps = mapLis;
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

exports.fetchServerTime = fetchServerTime;
exports.GameData = GameData;
exports.CheckViewRespects = CheckViewRespects;
exports.ViewRespectsCheckIn = ViewRespectsCheckIn;
exports.NoticeList = NoticeList;
exports.NoticeRewardAttch = NoticeRewardAttch;
exports.PlayerHeartBeat = PlayerHeartBeat;
exports.PlayerMapAndStock = PlayerMapAndStock;
