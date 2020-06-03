const errCodes = require('./../com/errorCodes');
const servStatsCode = require('./../com/serverstatus.code').getServerStatusCode;
const manifest = require('./../../configs/manifest.json');
const bulletinLisConfig = require('./../../configs/bulletin.cfg.json');
const getServerInfo = require('./controllers').getServerInfo;
const protocol = require('./../com/protocol');

/**
 * Version - 版本检测
 * @param {*} request { platform }
 * @param {*} response 
 */
function Version(request, response)
{
    var _checkServStats = (pf) => {
        if (pf in manifest.serverStatus) {
            return manifest.serverStatus[pf].status;
        } else {
            return 400;
        }
    }

    var respData = {};
    respData.bulletinList = bulletinLisConfig;

    // 判断服务器状态
    if ('platform' in request.body) {
        var servStat = _checkServStats(request.body.platform);
        if (servStat === servStatsCode().OK) {
            respData.code = errCodes().SUCCESS;
            respData.serverstatus = servStat;
            respData.verInfo = manifest.platform[request.body.platform];
            protocol.responseSend(response, respData);
        } else if (servStat === servStatsCode().NOTOPEN) {
            respData.code = errCodes().SERVERSTATUS_NOTOPEN;
            respData.serverstatus = servStat;
            protocol.responseSend(response, respData);
        } else if (servStat === servStatsCode().CLOSED) {
            respData.code = errCodes().SERVERSTATUS_CLOSED;
            respData.serverstatus = servStat;
            protocol.responseSend(response, respData);
        } else if (servStat === servStatsCode().MAINTENANCE) {
            respData.code = errCodes().SERVERSTATUS_MAINTENANCE;
            respData.serverstatus = servStat;
            protocol.responseSend(response, respData);
        } else {
            respData.code = errCodes().SERVERSTATUS_EMERGENCYMAINTENANCE;
            respData.serverstatus = servStat;
            protocol.responseSend(response, respData);
        }
    } else {
        respData.code = errCodes().SERVERSTATUS_NOTFOUND;
        respData.serverstatus = 1;
        protocol.responseSend(response, respData);
    }
}

/**
 * Gateway - 网关（获取服务器信息及绑定用户）
 * @param {*} reuqest { openid }
 * @param {*} response
 */
function Gateway(request, response)
{
    // 获取服务器信息
    var httpuuid = request.body.httpuuid ? request.body.httpuuid : 0;
    if ('string' === typeof request.body.openid && request.body.openid !== '' &&
        'string' === typeof request.body.platform && request.body.platform !== '' ) {
        getServerInfo(request.body.openid, request.body.platform, (uuid, servInfo) => {
            const gatewayController = require('../../controller/gatewayController');
            const s = gatewayController.getServices();
            Object.assign(servInfo, s);
            servInfo.httpuuid = httpuuid;
            servInfo.uuid = uuid;
            servInfo.code = 200;
            protocol.responseSend(response, servInfo);
            //response.end(JSON.stringify(servInfo));
        });
    } else {
        protocol.responseSend(response, { code: 500, httpuuid: httpuuid });
        //response.end(JSON.stringify({ code: 500, httpuuid: httpuuid }));
    }
}

exports.Version = Version;
exports.Gateway = Gateway;
