const GameDB = require('./../../app.init').GameDB;

const PLAYER_ACTIVE_COUNT = 10000;
const PLAYER_WAIT_COUNT = 500;
const PLAYER_ACTIVE_OUTLINE_CD = 60*1000;

const TBL_PLAYERACTIVELIST = 'PlayerActiveList';
const TBL_GLOBAL = 'Global';

function PLAYERSTATS() {
    return {
        ACTIVE: 0,  // 活跃玩家
        WAIT: 1,    // 等待玩家
        NEW: 2      // 新玩家
    }
}

function dealActiveOutline(callback)
{
    GameDB.deleteMany(TBL_PLAYERACTIVELIST, { st: { $lte: ((new Date()).getTime()-PLAYER_ACTIVE_OUTLINE_CD) } }, () => {
        callback();
    });
}

function updateActiveTime(uuid, callback)
{
    GameDB.updateOne(TBL_PLAYERACTIVELIST, { $set: { st: (new Date()).getTime() } }, { uuid: uuid }, () => {
        callback();
    });
}

function getActiveCount(callback)
{
    GameDB.count(TBL_PLAYERACTIVELIST, {}, count => {
        callback(count);
    });
}

function addActivePlayer(uuid, callback)
{
    GameDB.insertOne(TBL_PLAYERACTIVELIST, { uuid: uuid, st: (new Date()).getTime() }, () => {
        callback();
    });
}

function isActiving(uuid, callback)
{
    GameDB.findOne(TBL_PLAYERACTIVELIST, ['uuid'], { uuid: uuid }, doc => {
        callback(doc != null);
    });
}

function removeActivePlayer(uuid, callback)
{
    GameDB.deleteOne(TBL_PLAYERACTIVELIST, { uuid: uuid }, () => {
        callback();
    });
}

function getWaitCount(callback)
{
    GameDB.findOne(TBL_GLOBAL, ['waitLis'], { name: 'PlayerWaitList' }, doc => {
        callback((doc && doc.waitLis) ? doc.waitLis.length : 0);
    });
}

function getWaitInfo(uuid, callback)
{
    GameDB.findOne(TBL_GLOBAL, ['waitLis'], { name: 'PlayerWaitList' }, doc => {
        var waitLis = (doc && doc.waitLis) ? doc.waitLis : [],
            waitPos = 0;
        for (let i = 0; i < waitLis.length; i++) {
            if (waitLis[i].uuid === uuid) {
                waitPos = i + 1;
                break;
            }
        }

        callback(waitLis.length, waitPos);
    });
}

function pushWaitPlayer(uuid, callback)
{
    GameDB.updateOne(TBL_GLOBAL, { $push: { waitLis: { uuid: uuid, st: (new Date()).getTime() } } }, { name: 'PlayerWaitList' }, () => {
        callback();
    }, { 'upsert': true });
}

function isWaiting(uuid, callback)
{
    GameDB.findOne(TBL_GLOBAL, ['waitLis'], { name: 'PlayerWaitList' }, doc => {
        var waitLis = (doc && doc.waitLis) ? doc.waitLis : [];
        var valid = false, waitCount = waitLis.length, waitPos = 0;
        for (let i in waitLis) {
            if (waitLis[i].uuid === uuid) {
                valid = true;
                waitPos = parseInt(i) + 1;
                break;
            }
        }

        callback(valid, waitCount, waitPos);
    });
}

function moveWaitToActive(moveCount, callback)
{
    if (moveCount <= 0) {
        // 活跃列表满
        callback();
    } else {
        GameDB.findOne(TBL_GLOBAL, ['waitLis'], { name: 'PlayerWaitList' }, doc => {
            var waitLis = (doc && doc.waitLis) ? doc.waitLis : [],
                moveLis = waitLis.splice(0, moveCount),
                now = (new Date()).getTime();

            if (moveLis.length === 0) {
                callback();
            } else {

                for (let i in moveLis) {
                    moveLis[i].st = now;
                }

                // 更新等待列表
                GameDB.updateOne(TBL_GLOBAL, { $set: { waitLis: waitLis } }, { name: 'PlayerWaitList' }, () => {
                    // 更新活跃列表
                    GameDB.insertMany(TBL_PLAYERACTIVELIST, moveLis, () => {
                        callback();
                    });
                }, { 'upsert': true });
            }
        });
    }
}

function getPlayerStatInfo(uuid, callback, isNew=false)
{
    // 剔除自身的活跃列表（如果有）
    function doTickActive(playerId, newPlayerFlag, cb) {
        if (newPlayerFlag) {
            // 新建玩家
            cb();
        } else {
            removeActivePlayer(playerId, () => {
                cb();
            });
        }
    }
    dealActiveOutline(() => {
        doTickActive(uuid, isNew, () => {
            // 获取活跃数量
            getActiveCount(activeCount => {
                // 先移动等待列表到活跃列表
                moveWaitToActive(PLAYER_ACTIVE_COUNT-activeCount, () => {
                    getActiveCount(activeCount => {
                        if (activeCount >= PLAYER_ACTIVE_COUNT) {
                            isActiving(uuid, activeValid => {
                                if (activeValid) {
                                    // 已经活跃
                                    callback(PLAYERSTATS().ACTIVE);
                                } else {
                                    // 获取排队数量
                                    getWaitCount(waitCount => {
                                        if (waitCount >= PLAYER_WAIT_COUNT) {
                                            // 排队队列已满（无法登录）
                                            callback(PLAYERSTATS().NEW)
                                        } else {
                                            // 加入排队列表
                                            isWaiting(uuid, (waitValid, waitCount, waitPos) => {
                                                if (waitValid) {
                                                    callback(PLAYERSTATS().WAIT, waitCount, waitPos);
                                                } else {
                                                    pushWaitPlayer(uuid, () => {
                                                        callback(PLAYERSTATS().WAIT, waitCount+1, waitCount+1);
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            // 新的活跃用户（活跃玩家列表未满）
                            addActivePlayer(uuid, () => {
                                callback(PLAYERSTATS().ACTIVE);
                            });
                        }
                    });
                });
            });
        });
    });
}

function dealWaiting(uuid, callback)
{
    function doTickActive(playerId, newPlayerFlag, cb) {
        if (newPlayerFlag) {
            // 新建玩家
            cb();
        } else {
            removeActivePlayer(playerId, () => {
                cb();
            });
        }
    }
    dealActiveOutline(() => {
        //doTickActive(uuid, true, () => {
            // 获取活跃数量
            getActiveCount(activeCount => {
                // 先移动等待列表到活跃列表
                moveWaitToActive(PLAYER_ACTIVE_COUNT-activeCount, () => {
                    isActiving(uuid, activeValid => {
                        if (activeValid) {
                            callback(PLAYERSTATS().ACTIVE);
                        } else {
                            isWaiting(uuid, (waitValid, waitCount, waitPos) => {
                                callback(PLAYERSTATS().WAIT, waitCount, waitPos);
                            });
                        }
                    });
                });
            });
        //});
    });
}

exports.updateActiveTime = updateActiveTime;
exports.getWaitInfo = getWaitInfo;
exports.getPlayerStatInfo = getPlayerStatInfo;
exports.PLAYERSTATS = PLAYERSTATS;
exports.dealWaiting = dealWaiting;
