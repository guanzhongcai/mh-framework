const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const validator = require('validator');
const util = require('util');
const CONSTANTS = require('./../../common/constants');
const notifEnabled = false;

class Notification
{
    constructor(uuid)
    {
        this.uuid_      = uuid;
        this.tblname_   = "Notifications";
        this.data_      = null;
        this.save_      = false;
    }

    model()
    {
        return {
            works: [], // 生产相关 { bid, workLis, itemLis, wlck, ilck }
            lOrderCd: 0, // 长订单
            shopHour: -1, // 商店定点刷新
            heroWakeUps: [], // 墨魂睡觉
            playSoul: { st: 0, cnt: 0 }, // 玩法次数（魂力）
            playInsp: { st: 0, cnt: 0 } // 玩法次数（灵感）
        }
    }

    load(callback)
    {
        if (notifEnabled) {
            if (this.data_ != null) {
                callback(false);
            } else {
                GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, res => {
                    this.data_ = ('string'==typeof res && validator.isJSON(res)) ? JSON.parse(res) : this.model();
                    callback(true);
                });
            }
        } else {
            callback(false);
        }
    }

    save(callback)
    {
        if (notifEnabled) {
            if (this.save_) {
                GameRedisHelper.setHashFieldValue(this.tblname_, this.uuid_, JSON.stringify(this.data_), () => {
                    callback(true);
                });
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    }

    clear()
    {
        if (this.data_) {
            this.data_ = this.model();
            this.save_ = true;
        }
    }

    updateWork(bid, workLis, itemLis)
    {
        if (notifEnabled) {
            if (this.data_) {
                var works = this.data_.works, isFind = false;
                for (let i in works) {
                    if (works[i].bid == bid) {
                        works[i].workLis = workLis;
                        works[i].itemLis = itemLis;
                        isFind = true;
                        this.save_ = true;
                        break;
                    }
                }

                if (!isFind) {
                    works.push({ bid: bid, workLis: workLis, itemLis: itemLis, wlck: 0 /**生产队列通知锁 */, ilck: 0 /**产物队列通知锁 */ });
                    this.save_ = true;
                }

                this.data_.works = works;
            }
        }
    }

    updateHeroWakeUp(heroId, sleepTime, durationTime)
    {
        if (notifEnabled) {
            if (this.data_) {
                var heroWakeUps = this.data_.heroWakeUps, isFind = false;
                for (let i in heroWakeUps) {
                    if (heroWakeUps[i].hid == heroId) {
                        heroWakeUps[i].st = sleepTime;
                        heroWakeUps[i].dt = durationTime;
                        isFind = true;
                        this.save_ = true;
                        break;
                    }
                }

                if (!isFind) {
                    heroWakeUps.push({ hid: heroId, st: sleepTime, dt: durationTime, lck: 0 /** 墨魂唤醒通知锁 */ });
                    this.save_ = true;
                }

                this.data_.heroWakeUps = heroWakeUps;
            }
        }
    }

    updateLongOrder(cd)
    {
        if (notifEnabled) {
            if (this.data_) {
                this.data_.lOrderCd = cd;
                this.save_ = true;
            }
        }
    }

    updatePlaySoul(count) {
        if (notifEnabled) {
            if (this.data_) {
                if (this.data_.playSoul.st == 0) {
                    this.data_.playSoul.st = new Date().getTime();
                }
                this.data_.playSoul.cnt = count;
                this.save_ = true;
            }
        }
    }

    updatePlayInsp(sTime, count)
    {
        if (notifEnabled) {
            if (this.data_) {
                if (sTime != null) {
                    this.data_.playInsp.st = sTime;
                }
                this.data_.playInsp.cnt = count;
                this.save_ = true;
            }
        }
    }
}

module.exports = {
    Notification
}