const GameDB = require('./../../app.init').GameDB;
/**
 * name
 * value
 */
//const TBL_COUNTERS = "Counters";
/**
 * serverId 服务器ID
 * ip 网络地址
 * port 端口
 * status 状态
 * active 是否激活
 */
const LBTBL_SERVERLIST = "LB_ServerList"; // 服务器列表

/**
 * uuid 玩家UID
 * serverId 当前服务器ID
 * upTime 活跃时间
 */
const LBTBL_PLAYERHEARTBEATS = "LB_PlayerHeartBeats"; // 服务器活跃玩家表

const PLAYER_ACTIVE_TIME = 30*60*1000; // 活跃时间

// 获取服务器信息列表
function getServerList(callback)
{
    GameDB.findMany(LBTBL_SERVERLIST, ['serverId', 'ip', 'port'], { active: true }, docs => {
        callback(docs ? docs : []);
    });
}

// 获取服务器玩家活跃数
function getServerActiveCount(serverId, callback)
{
    var cdtime = (new Date()).getTime() - PLAYER_ACTIVE_TIME;
    GameDB.count(LBTBL_PLAYERHEARTBEATS, { serverId: serverId, upTime: { $gte: cdtime } }, activeCount => {
        callback(activeCount);
    });
}


// 处理负载均衡
function doLoadBalance(callback)
{
    // 获取服务器列表
    getServerList(serverLis => {
        var servInfo, currActiveCount = 0;
        serverLis.forEach((serv, index) => {
            if (index === 0) servInfo = serv;

            getServerActiveCount(serv.serverId, activeCount => {
                if (index === 0) currActiveCount = activeCount;

                if (currActiveCount > activeCount) {
                    currActiveCount = activeCount;
                    servInfo = serv;
                }
                if ((index+1) === serverLis.length) {
                    callback(servInfo);
                }
            });
        });
    });
}

exports.doLoadBalance = doLoadBalance;
