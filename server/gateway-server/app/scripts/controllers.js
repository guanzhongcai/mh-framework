const validator = require('validator');
const CacheHelper = require('./../../index.app').CacheHelper;
const GatewayConfig = require('./../../configs/gateway.cfg.json');
const ServerListConfig = require('./../../configs/serverlist.json');

/******************************************************************
 * 网关记录服务器人数计数器
 ******************************************************************/
const TBL_GW_COUNTERS = "Gateway_Counters";

/**
 * getGatewayCountList - 获得网关计数列表
 * @param {*} callback [{sid, cnt}, ...]
 */
function getGatewayCountList(callback)
{
    CacheHelper.getString(TBL_GW_COUNTERS, res => {
        callback((res && validator.isJSON(res)) ? JSON.parse(res) : null);
    });
}

/**
 * setGatewayCountList - 保存网关计数列表
 * @param {*} lis [{sid, cnt}, ...]
 * @param {*} callback
 */
function setGatewayCountList(lis, callback)
{
    CacheHelper.setString(TBL_GW_COUNTERS, JSON.stringify(lis), () => {
        callback(lis);
    });
}

/******************************************************************
 * 玩家UUID
 ******************************************************************/
const initUUID = GatewayConfig.uuid_index;

function getNewUUID(callback)
{
	CacheHelper.getString('UserCounter:UUID', uuid => {
		if (uuid === null) {
			CacheHelper.setString('UserCounter:UUID', initUUID + 1, () => {
				callback(initUUID + 1);
			});
		} else {
			CacheHelper.addCounter('UserCounter:UUID', newUUID => {
				callback(newUUID);
			});
		}
	});
}

/******************************************************************
 * 绑定用户open id和服务器server id
 ******************************************************************/
const TBL_GW_BINDAUTH = "Gateway_BindAuth";

/**
 * getBindAuthData - 获取绑定的服务器ID和uuid
 * @param {*} openId
 * @param {*} callback
 */
function getBindAuthData(openId, callback)
{
    CacheHelper.getHashFieldValue(TBL_GW_BINDAUTH, openId, bindAuthData => {
        callback(bindAuthData && validator.isJSON(bindAuthData) ? JSON.parse(bindAuthData) : null);
    });
}

/**
 * setBindAuthData - 绑定服务器ID和uuid
 * @param {*} openId
 * @param {*} bindAuthData
 * @param {*} callback
 */
function setBindAuthData(openId, bindAuthData, callback)
{
    CacheHelper.setHashFieldValue(TBL_GW_BINDAUTH, openId, JSON.stringify(bindAuthData), () => {
        callback();
    });
}

/******************************************************************
 * 服务器信息获取处理
 ******************************************************************/
/**
 * _servInfoRule - 服务器信息规则
 * @param {*} callback
 */
function _servInfoRule(callback)
{
    var _getCount = (cntLis, servId) => {
        for (let i in cntLis) {
            if (cntLis[i].sid === servId) {
                return [i, cntLis[i].cnt];
            }
        }

        return [-1, 0];
    }

    var _addCount = (cntLis, pos, sid) => {
        if (cntLis[pos]) {
            cntLis[pos].cnt += 1;
        } else {
            cntLis.push({ sid: sid, cnt: 1 });
        }
    }

    // 获取网关计数列表
    getGatewayCountList(gwCntLis => {
        var servData = null;
        if (Array.isArray(gwCntLis)) {
            // 有计数数据
            for (let i in ServerListConfig) {
                var servNode = ServerListConfig[i],
                    [pos, gwCount] = _getCount(gwCntLis, servNode.serverId);

                //console.debug("[getGatewayCountList] node: %s, count: %d", JSON.stringify(servNode), pos, gwCount);

                if ((servNode.maxNum + servNode.extNum) > gwCount) {
                    // 服务器数量未满，可以加入
                    servData = servNode;

                    // 计数器增加
                    _addCount(gwCntLis, pos, servNode.serverId);

                    break;
                }
            }

            if (servData === null) {
                // 如果未找到符合的服务器，将最少人数的服务器赋予（暂定）
                var minCount = ServerListConfig[0].maxNum + ServerListConfig[0].extNum, count = 0, idx = 0;
                for (let i = 1; i < ServerListConfig.length; i++) {
                    count = ServerListConfig[i].maxNum + ServerListConfig[i].extNum;
                    if (minCount > count) {
                        minCount = count;
                        idx = i;
                    }
                }

                servData = ServerListConfig[idx];

                // 计数器增加
                var [pos] = _getCount(gwCntLis, servData.serverId);
                _addCount(gwCntLis, pos, servData.serverId);
            }

            // 保存网关计数列表
            setGatewayCountList(gwCntLis, () => {
                callback(servData);
            });
        } else {
            // 直接获取第一台服务器信息
            servData = ServerListConfig[0];
            setGatewayCountList([{ sid: servData.serverId, cnt: 1 }], () => {
                callback(servData);
            });
        }
    });
}

/**
 * getServerInfo - 获取服务器信息
 * @param {*} openId
 * @param {*} callback
 */
function getServerInfo(openId, platform, callback)
{
    var _getServInf = (servData) => {
        return {
            loginServInfo: servData.loginServInfo[platform],
            gameServInfo: servData.gameServInfo[platform],
            payServInfo: servData.payServInfo[platform]
        }
    }

    // 获取网关计数列表
    getBindAuthData(openId, bindAuthData => {
        if (bindAuthData) {
            // 该账号已绑定服务器ID, 直接返回服务器信息
            var servInfo;
            for (let i in ServerListConfig) {
                if (ServerListConfig[i].serverId === bindAuthData.sid) {
                    servInfo = _getServInf(ServerListConfig[i]);
                }
            }
            callback(bindAuthData.uuid, servInfo);
        } else {
            // 未绑定服务器ID（新账号），按规则获取服务器信息
            _servInfoRule(servData => {
                // 对openid和serverid, uuid进行绑定
                getNewUUID(newUUID => {
                    var newBindAuthData = { sid: servData.serverId, uuid: newUUID };
                    setBindAuthData(openId, newBindAuthData, () => {
                        callback(newUUID, _getServInf(servData));
                    });
                });
            });
        }
    });
}

exports.getServerInfo = getServerInfo;
