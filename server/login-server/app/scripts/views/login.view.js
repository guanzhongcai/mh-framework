const errcode = require('./../../common/error.code')
const serverstatus = require ('./../../common/serverstatus.code.js')

const protocol = require('./../../common/protocol');
const manifest = require('./../../../configs/manifest.json');
const AwaitQueue = require('./../controllers/awaitController').AwaitQueue;
const addOnlinePlayerCount = require('./../controllers/awaitController').addOnlinePlayerCount;
const loginLimitController = require('./../controllers/loginLimitController');
const loginController = require('./../controllers/loginController');
const playerController = require('./../controllers/playerController');


// 版本检测
function Version(request, response)
{
    if (manifest.platform[request.body.platform]) {
        protocol.responseSend(response, {
            code: 200,
            verInfo: manifest.platform[request.body.platform]
        })
    } else {
        protocol.responseSend(response, { code: 404 });
    }
}

// 登录
function Login(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, 0);
    respData.playerStats    = loginLimitController.PLAYERSTATS().ACTIVE;
    respData.newUser        = 0;
    respData.serverstatus   = 0;
    respData.userdata       = {};

    loginController.checkServStatValid(request.body.platform, statValid => {
        if (statValid != null) {
            if (statValid == serverstatus.getServerStatusCode().OK) {
                loginController.getOuthUUID(request.body.openid, uuid => {
                    if (uuid > 0) {
                        // This is a old player.
                        // 排队相关处理
                        var awaitQueue = new AwaitQueue();
                        awaitQueue.load(() => {
                            var waitInfo = awaitQueue.add(uuid);
                            awaitQueue.save(() => {
                                respData.waitStat = waitInfo.waitStat;
                                if ('waitNo' in waitInfo) {
                                    respData.waitNo = waitInfo.waitNo;
                                    respData.waitCount = awaitQueue.size();
                                }

                                if (waitInfo.waitStat === AwaitQueue.WAIT_STATS().PASS) {
                                    // 正常可以登录
                                    playerController.getPlayerData(uuid, playerData => {
                                        addOnlinePlayerCount(1, async() => {
                                            respData.uuid       = playerData.uuid;
                                            respData.userdata   = playerData;
                                            respData.userdata.token = request.tokenUtil.signToken(uuid);
                                            await request.tokenUtil.freashToken(playerData.uuid,respData.userdata.token)
                                            protocol.responseSend(response, respData);
                                        await request.logServer.loginLog([respData.uuid,request.body.channel,request.body.platform,request.body.openid])
                                        });
                                    });
                                } else {
                                    // 需要排队或者压根不能登入
                                    protocol.responseSend(response, respData);
                                }
                            });
                        });
                    } else {
                        // This is a new player.
                        var gwUuid = 'uuid' in request.body && 'number' === typeof request.body.uuid ? request.body.uuid : 0;
                        if (gwUuid > 0) {
                            // 排队相关处理
                            var awaitQueue = new AwaitQueue();
                            awaitQueue.load(() => {
                                var waitInfo = awaitQueue.add(gwUuid);
                                awaitQueue.save(() => {
                                    respData.waitStat = waitInfo.waitStat;
                                    if ('waitNo' in waitInfo) {
                                        respData.waitNo = waitInfo.waitNo;
                                        respData.waitCount = awaitQueue.size();
                                    }

                                    if (waitInfo.waitStat === AwaitQueue.WAIT_STATS().PASS) {
                                        // 正常可以登录
                                        playerController.newPlayer(request.body.deviceid, playerDefault => {
                                            var outhDefault = {};
                                            outhDefault.uuid        = playerDefault.uuid;
                                            outhDefault.openid      = request.body.openid;
                                            outhDefault.logintype   = request.body.logintype;
                                            outhDefault.platform    = request.body.platform;
                                            outhDefault.channel     = request.body.channel;
                                            outhDefault.version     = request.body.version;
                                            outhDefault.createtime  = (new Date()).getTime();
                                            loginController.createOuth(outhDefault, () => {
                                                respData.uuid           = playerDefault.uuid;
                                                respData.newUser        = 1;
                                                respData.userdata       = playerDefault;
                                                respData.userdata.token = request.tokenUtil.signToken(respData.uuid);
                                                addOnlinePlayerCount(1, async () => {
                                                    await request.tokenUtil.freashToken(playerDefault.uuid,respData.userdata.token)
                                                    protocol.responseSend(response, respData);
                                    await request.logServer.loginLog([respData.uuid,request.body.channel,request.body.platform,request.body.openid])
                                                });
                                            });
                                        }, null, gwUuid);
                                    } else {
                                        // 需要排队或者压根不能登入
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            });
                        } else {
                            // 传入的网关UUID错误
                            respData.code = errcode.getCode().PARAMS_ERROR;
                            protocol.responseSend(response, respData);
                        }
                    }
                });
            }else if (statValid == serverstatus.getServerStatusCode().NOTOPEN) {
                respData.code = errcode.getCode().SERVERSTATUS_NOTOPEN;
                respData.serverstatus = statValid;
                protocol.responseSend(response, respData);
            }else if (statValid == serverstatus.getServerStatusCode().CLOSED) {
                respData.code = errcode.getCode().SERVERSTATUS_CLOSED;
                respData.serverstatus = statValid;
                protocol.responseSend(response, respData);
            }else if (statValid == serverstatus.getServerStatusCode().MAINTENANCE) {
                respData.code = errcode.getCode().SERVERSTATUS_MAINTENANCE;
                respData.serverstatus = statValid;
                protocol.responseSend(response, respData);
            }else {
                respData.code = errcode.getCode().SERVERSTATUS_EMERGENCYMAINTENANCE;
                respData.serverstatus = statValid;
                protocol.responseSend(response, respData);
            }
        } else {
            // 没有对应平台
            respData.code = errcode.getCode().SERVERSTATUS_NOTFOUND;
            respData.serverstatus = 1;
            protocol.responseSend(response, respData);
        }
    });
}

// 获取服务器列表
/*
function ServerList(request, response)
{
    var respData = { httpuuid: request.body.httpuuid ? request.body.httpuuid : 0, code: 200 };
    loadBalanceController.doLoadBalance(servInfo => {
        respData.servInfo = servInfo;
        console.error("[ServerList] ", servInfo);
        protocol.responseSend(response, respData);
    });
}

// 获取等待信息
function PlayerWaitInfo(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    loginLimitController.updateActiveTime(request.body.uuid, () => {
        loginLimitController.dealWaiting(request.body.uuid, (playerStats, waitCount, waitPos) => {
            respData.playerStats = loginLimitController.PLAYERSTATS().ACTIVE;//playerStats;
            if (waitCount) respData.waitCount = waitCount;
            if (waitPos) respData.waitPos = waitPos;
            protocol.responseSend(response, respData);
        });
    });
}
*/
//exports.Version = Version;
//exports.Login = Login;
//exports.ServerList = ServerList;
//exports.PlayerWaitInfo = PlayerWaitInfo;

/**
 * PlayerAwaitBeat - 玩家等待信息
 * @param {Object} request { httpuuid, uuid }
 * @param {Object} response { httpuuid, uuid, waitStat, waitNo, waitCount }
 */
function PlayerAwaitBeat(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('number' === typeof request.body.uuid && request.body.uuid > 0) {
        var awaitQueue = new AwaitQueue();
        awaitQueue.load(() => {
            awaitQueue.updateAwaitUpTime(request.body.uuid);
            awaitQueue.updateAwaitQueue();
            var waitNo = awaitQueue.getCurrWaitNo(request.body.uuid);
            if (waitNo > 0) {
                respData.waitStat = AwaitQueue.WAIT_STATS().WAITING;
            } else {
                respData.waitStat = AwaitQueue.WAIT_STATS().PASS;
            }
            respData.waitNo = waitNo;
            respData.waitCount = awaitQueue.size();

            awaitQueue.save(() => {
                protocol.responseSend(response, respData);
            });
        });
    } else {
        respData.code = errcode.getCode().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

module.exports = {
    Version,
    Login,
    PlayerAwaitBeat
}
