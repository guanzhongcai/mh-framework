// ===================================================
// filename: awaitController.js
// desc: 玩家排队
// ===================================================
const cacheHelper = require('../../app.init').LoginRedisHelper;
const playerAwaitConfig = require('./../../../configs/player.await.json');
const validator = require('validator');

/**
 * getOnlinePlayerCount - 获取在线人数
 * @param {Function} callback 
 */
function getOnlinePlayerCount(callback)
{
    cacheHelper.getHashFieldValueInt("GlobalData", "ONLINE_PLAYER_COUNT", onlineCount => {
        callback(onlineCount);
    });
}

function addOnlinePlayerCount(count, callback)
{
    getOnlinePlayerCount(onlineCount => {
        cacheHelper.setHashFieldValue("GlobalData", "ONLINE_PLAYER_COUNT", onlineCount+count, () => {
            callback();
        });
    });
}

class AwaitQueue
{
    constructor()
    {
        this.tblname_                  = "GlobalData";
        this.fieldGameAwaitQueueData_  = "GAME_AWAIT_QUEUE_DATA";
        //this.fieldGamePriorSignInData_ = "GAME_PRIOR_SIGNIN_DATA"; // 优先登录数据（此玩家为等待结束移入的玩家，享有优先登录权）
        this.data_                     = null;
        //this.priorSignInData_          = null;
        this.currOnlineCount_          = 0; // 当前在线人数
        this.save_                     = false;
    }

    static WAIT_STATS() {
        return {
            PASS: 1,    // 通过
            WAITING: 2, // 等待中
            UNABLE: 3,  // 无法登录
        }
    }

    model()
    {
        return {
            uid: 0,
            st: new Date().getTime(),
            stat: 0 // 0 排队 1 已排队完成
        }
    }

    isEnabled()
    {
        return playerAwaitConfig.awaitQueueEnable;
    }

    load(callback)
    {
        if (this.isEnabled()) {
            if (this.data_) {
                callback(false);
            } else {
                // 获取当前在线人数
                getOnlinePlayerCount(onlineCount => {
                    this.currOnlineCount_ = onlineCount;
                    // 获取排队列表
                    cacheHelper.getHashFieldValue(this.tblname_, this.fieldGameAwaitQueueData_, res => {
                        this.data_ = (res && validator.isJSON(res)) ? JSON.parse(res) : [];
                        callback(true);
                    });
                });
            }
        } else {
            callback(null);
        }
    }

    save(callback)
    {
        if (this.isEnabled()) {
            if (this.save_) {
                if (Array.isArray(this.data_)) {
                    // 保存等待队列数据
                    cacheHelper.setHashFieldValue(this.tblname_, this.fieldGameAwaitQueueData_, JSON.stringify(this.data_), () => {
                        // 保存优先登录数据
                        callback();
                    });
                } else {
                    console.warn("[AwaitQueue] Data is not type of array:", this.data_);
                    callback();
                }
            } else {
                callback();
            }
        } else {
            callback();
        }
    }

    /**
     * isOnlineMax - 是否在线人数已达到上限
     */
    isOnlineMax()
    {
        // 注：在线人数是独立进程（更新器）定时更新，所以逻辑上只需要获取判断即可
        // onlineCountMax==0说明不设上限
        return (playerAwaitConfig.onlineCountMax > 0 && 
            this.currOnlineCount_ >= playerAwaitConfig.onlineCountMax);
    }

    /**
     * isWaiting - 是否在等待
     * @param {Number} uuid 
     */
    isWaiting(uuid)
    {
        return (this.data_.filter((a) => { return a.uid === uuid; }).length > 0);
    }

    /**
     * add - 加入排队队列
     * @param {Number} uuid 
     */
    add(uuid)
    {
        if (this.isEnabled()) {
            // 更新等待队列
            this.updateAwaitQueue();
            
            if (this.checkFastPass(uuid)) {
                // 说明是这是已排队完成可以优先登录的玩家
                return { 
                    waitStat: AwaitQueue.WAIT_STATS().PASS
                };
            } else {
                if (this.isOnlineMax()) {
                    // 在线人数达到上限，需要等待
                    this.remove(uuid); // 如有在之前等待队列，需要删除并排到队尾
                    if (playerAwaitConfig.awaitQueueMax > 0 && 
                            this.size() === playerAwaitConfig.awaitQueueMax) {
                        // 排队队列已满，玩家无法再登入
                        return { 
                            waitStat: AwaitQueue.WAIT_STATS().UNABLE 
                        };
                    } else {
                        // 加入等待队列对尾
                        this.data_.push((() => { var tmps = this.model(); tmps.uid = uuid; return tmps; })());
                        this.save_ = true;
                        return { 
                            waitStat: AwaitQueue.WAIT_STATS().WAITING,
                            waitNo: this.size()//this.data_.length
                        };
                    }
                } else {
                    // 在线人数未满，但需要判断是否还在等待队列中
                    var waitNo = this.getCurrWaitNo(uuid);
                    if (waitNo > 0) {
                        // 还在排队中
                        return { 
                            waitStat: AwaitQueue.WAIT_STATS().WAITING,
                            waitNo: waitNo
                        };
                    } else {
                        return { 
                            waitStat: AwaitQueue.WAIT_STATS().PASS
                        };
                    }
                }
            }
        } else {
            return { 
                waitStat: AwaitQueue.WAIT_STATS().PASS 
            };
        }
    }

    /**
     * del - 从等待队列移除
     * @param {Number} uuid 
     */
    remove(uuid)
    {
        var valid = false;
        for (let i in this.data_) {
            if (this.data_[i].uid === uuid) {
                this.data_.splice(i, 1);
                valid = true;
                this.save_ = true;
                break;
            }
        }

        return valid;
    }

    /**
     * getCurrWaitNo - 获取当前所在等待列表位置
     * @param {Number} uuid 
     */
    getCurrWaitNo(uuid)
    {
        // 需要过滤掉可登录状态的排队玩家
        var waitLis = this.data_.filter((a) => { return a.stat == 0 });
        for (let i in waitLis) {
            if (waitLis[i].uid == uuid) {
                return (Number(i) + 1);
            }
        }

        return 0;
    }

    /**
     * size - 等待队列人数
     */
    size()
    {
        return this.data_.filter((a) => { return a.stat == 0; }).length; // 需要过滤掉可登录状态的排队玩家
        //return this.data_.length;
    }

    /**
     * checkFastPass - 是否优先登录
     * @param {Number} uuid 
     */
    checkFastPass(uuid)
    {
        for (let i in this.data_) {
            if (this.data_[i].uid == uuid && this.data_[i].stat == 1) { // 说明是排队完成优先登录的玩家
                this.data_.splice(i, 1);
                this.save_ = true;
                return true;
            }
        }

        return false;
    }

    /**
     * updateAwaitUpTime - 更新等待玩家更新时间
     * @param {Number} uuid 
     */
    updateAwaitUpTime(uuid)
    {
        for (let i in this.data_) {
            if (this.data_[i].uid === uuid) {
                this.data_[i].st = new Date().getTime();
                this.save_ = true;
                break;
            }
        }
    }

    /**
     * clearAwaitQueueByUpTime - 根据更新时间清理等待队列
     */
    clearAwaitQueueByUpTime()
    {
        var nt = new Date().getTime(), newData = [];
        for (let i in this.data_) {
            if (nt - this.data_[i].st < playerAwaitConfig.awaitUpTime*1000) {
                // 该等待玩家算作离线
                newData.push(this.data_[i]);
            }
        }

        this.data_ = newData;
        this.save_ = true;
    }

    /**
     * updateAwaitQueue - 更新等待队列
     */
    updateAwaitQueue()
    {
        if (this.isEnabled()) {
            // 剔除在等待队列中的离线玩家
            this.clearAwaitQueueByUpTime();
            if (this.size() > 0 && !this.isOnlineMax()) {
                // 有玩家在等待且上线人数未达到最大
                // 根据可登人数移除队前玩家
                var passCount = playerAwaitConfig.onlineCountMax - this.currOnlineCount_;
                if (passCount > 0) {
                    // 将这些排队的玩家设置成可以优先登录
                    var s = this.data_.length - this.size() - 1, e = this.data_.length;
                    if (s < 0) s = 0;
                    var safeCounter = 0;
                    while (passCount--) {
                        if (s < e) {
                            if (this.data_[s]) {
                                this.data_[s].stat = 1; // 通过(用于优先进入)
                            }
                            ++s;
                        }
                        if (++safeCounter > 9999) {
                            break;
                        }
                    }
                    this.save_ = true;
                }
            }
        }
    }
}

module.exports = {
    addOnlinePlayerCount,
    AwaitQueue
}