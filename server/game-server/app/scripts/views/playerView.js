const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const playerController = require('./../controllers/playerController');
const pursueController = require('./../controllers/pursueTreeController');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
function PlayerSettingData(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var setData = {};
    setData.newuser = 0;
    setData.settingdata = request.body.settingdata;
    if (request.body.guideover) setData.guideover = request.body.guideover;

    pursueController.setNodeIdAboutAssistant(request.body.uuid, request.body.settingdata.viewmohun,  request.multiController,request.taskController,() => {
        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.setPlayerData(setData, () => {
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
    }, null);
}

// 设置玩家昵称
function PlayerSettingNickname(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);
    if (request.body.mode === 1) {
        // 正常设置的
        player.getNameCount(nameCount => {
            if (nameCount === 0) {
                // 免费
                player.setNameCount(nameCount + 1, () => {
                    player.setNickname(request.body.nickname, () => {
                        respData.namecount = nameCount + 1;
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
            } else {
                var costCurrency = [0, 100, 0];
                // 验证货币
                player.currencyMultiValid(costCurrency, currencyValid => {
                    if (currencyValid) {
                        // 消耗货币
                        player.costCurrencyMulti(costCurrency, newCurrency => {
                            player.setNickname(request.body.nickname, async() => {
                                respData.currency = newCurrency;
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
                                await request.logServer.logCurrency(request.body.uuid,request.Const.actions.setNickName,request.Const.functions.userInfo,1,costCurrency,newCurrency)
                            });
                        });
                    } else {
                        // 货币不足
                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            }
        });
    } else {
        // 引导中设置的
        player.setNickname(request.body.nickname, () => {
            player.setNewUser(0, () => {
                respData.newuser = 0;
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
}

// 设置玩家生日
function PlayerSettingBirth(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);

    player.setBirth(request.body.birth, birthTime => {
        respData.birthtime = birthTime;
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

// 设置玩家头像
function PlayerSettingHead(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);

    player.checkGameHeadValid(request.body.headId, valid => {
        if (valid) {
            player.setHeadId(request.body.headId, () => {
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
        } else {
            // 头像未解锁
            respData.code = ERRCODES().PLAYER_GAME_HEAD_LOCKED;
            protocol.responseSend(response, respData);
        }
    });
}

// 设置看板墨魂
function PlayerSettingViewMohun(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);

    player.setViewMohun(request.body.viewmohun, () => {
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

// 设置新手引导数据
function UpdateGuideInfo(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.setGuideInfo(request.body.guideinfo, () => {
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

/**
 * PlayerNotifSetting - 设置推送通知状态
 * @param {Array} notifSetting
 */
function PlayerNotifSetting(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.setNotifSetting(request.body.notifSetting, (nowNotifSetting) => {
        if (nowNotifSetting == null) {
            respData.code = ERRCODES().PARAMS_ERROR;
        }
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}


/**
 * 更新触发礼包数据 -
 * @param {Array} notifSetting
 */
function setPlayerTriggerGift(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);
    if (request.body.TiggerGift == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        player.setTriggerGift(request.body.TiggerGift, (status) => {
            if (status) {
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        return protocol.responseSend(response, respData);
                    }
                    protocol.responseSend(response, respData);
                })
            }else {
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        });
    }
}


exports.PlayerSettingData = PlayerSettingData;
exports.PlayerSettingNickname = PlayerSettingNickname;
exports.PlayerSettingBirth = PlayerSettingBirth;
exports.PlayerSettingHead = PlayerSettingHead;
exports.PlayerSettingViewMohun = PlayerSettingViewMohun;
exports.UpdateGuideInfo = UpdateGuideInfo;
exports.PlayerNotifSetting = PlayerNotifSetting;
exports.SetPlayerTriggerGift = setPlayerTriggerGift
