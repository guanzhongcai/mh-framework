const validator = require('validator');
const utils = require('./../../common/utils');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CheckinConfig = require('./../../designdata/CheckinConfig');
const TBL_CHECKINDATA = "CheckinData"; // { playerCheckinTime, checkinList, checkinRwdList }
const CONSTANTS = require('./../../common/constants');

function CHECKIN_STATS() {
    return {
        NONE: 0, // 不签到
        CHECKIN: 1, // 签到
        PULL: 2, // 代签
    }
}

function checkinDataDefault()
{
    return {
        clearTime: new Date().getTime(), // 用于隔月重置
        ckRwdCount: 0, // 签到次数
        playerCheckinTime: 0,
        checkinList: [],
        checkinRwdList: [],
        todayHeroList: []
    };
}

/**
 * getCheckinData - 获取签到数据
 * @param {*} uuid
 * @param {*} callback
 * @param {*} checkinData
 */
function getCheckinData(uuid, callback, checkinData=null)
{
    if (checkinData) {
        callback(checkinData);
    } else {
        GameRedisHelper.getHashFieldValue(TBL_CHECKINDATA, uuid, res => {
            if (res && validator.isJSON(res)) {
                callback(JSON.parse(res));
            } else {
                callback(checkinDataDefault());
            }
        });
    }
}

/**
 * setCheckinData - 设置签到数据
 * @param {*} uuid
 * @param {*} checkinData
 * @param {*} callback
 * @param {*} save
 */
function setCheckinData(uuid, checkinData,multiController, callback, save=true)
{
    if (save) {
        if(multiController){
            multiController.push(1,TBL_CHECKINDATA + ":" + uuid , JSON.stringify(checkinData))
            callback(checkinData);
        }else{
            GameRedisHelper.setHashFieldValue(TBL_CHECKINDATA, uuid, JSON.stringify(checkinData), () => {
               callback(checkinData);
           });
        }
    } else {
        callback(checkinData);
    }
}

/**
 * resetCheckinData - 重置签到数据
 * @param {*} uuid
 * @param {*} callback
 */
function resetCheckinData(uuid, multiController,callback)
{
    getCheckinData(uuid, CheckinData => {
        var now = new Date(), st = new Date(CheckinData.clearTime);
        if (st.getMonth() !== now.getMonth()) {
            // 已隔月，进行重置
            CheckinData = checkinDataDefault();
        } else {
            // 隔日
            CheckinData.playerCheckinTime = 0;
            CheckinData.checkinList = []; // 用于获取签到列表时生成新的
            CheckinData.todayHeroList = [];
        }

        setCheckinData(uuid, CheckinData, multiController,() => {
            callback(CheckinData);
        });
    });
}

/**
 * createCheckinListByRule - 按规则随机出签到墨魂列表
 * @param {*} playerHeroIdLis
 */
function createCheckinListByRule(playerHeroIdLis)
{
    var lis = [], pullHeroIdLis = [], ruleObj = {}, ruleConfig, seed, RAND_BASE = 10000;
    for (let heroId of playerHeroIdLis) {
        ruleConfig = CheckinConfig.getRule(heroId);
        if (ruleConfig) {
            ruleObj[heroId] = ruleConfig; // 为了减少获取配置耗时

            // 判断是否签到（点卯）
            seed = utils.getRandom(RAND_BASE);
            if (seed <= ruleConfig.CheckinRand) {
                // 可签到
                lis.push({
                    hid: heroId,
                    st: ruleConfig.BaseTime,
                    scale: ruleConfig.SignScale,
                    pos: ruleConfig.SignPos,
                    stat: CHECKIN_STATS().CHECKIN // 签到
                });
            } else {
                // 不可签到，判断代签（带点卯）
                seed = utils.getRandom(RAND_BASE);
                if (seed <= ruleConfig.PullCheckinRand) {
                    // 可代签，加入可代签列表（只有等全部墨魂处理完后才能知道代签墨魂是否已签）
                    pullHeroIdLis.push(heroId);
                } else {
                    // 不可代签
                    // NOTHING TO DO.
                }
            }
        }
    }

    // 处理代签墨魂列表
    for (let heroId of pullHeroIdLis) {
        ruleConfig = ruleObj[heroId];
        if (lis.filter((a) => { return a.hid == ruleConfig.PullCheckinHeroId; }).length > 0) {
            // 该代签墨魂是可签到墨魂
            lis.push({
                hid: heroId,
                st: ruleObj[ruleConfig.PullCheckinHeroId].BaseTime - 5*60*1000, // 比代签墨魂晚5min
                scale: ruleConfig.SignScale,
                stat: CHECKIN_STATS().PULL // 签到
            });
        } else {
            // 不可签到
            // NOTHING TO DO.
        }
    }

    return lis;
}

/**
 * isTakeCheckinBonus - 奖励是否已领取
 * @param {*} checkinData
 * @param {*} id
 */
function isTakeCheckinBonus(checkinData, id)
{
    for (let i in checkinData.checkinRwdList) {
        if (checkinData.checkinRwdList[i].id === id) {
            return false;
        }
    }

    return true;
}

/**
 * addTodayHeroList - 加入今日获得墨魂列表
 * @param {Number} uuid
 * @param {Array} heroIdLis
 * @param {Function} callback
 */
function addTodayHeroList(uuid, heroIdLis, multiController,callback)
{
    if (Array.isArray(heroIdLis) && heroIdLis.length > 0) {
        getCheckinData(uuid, checkinData => {
            if (!Array.isArray(checkinData.todayHeroList)) {
                checkinData.todayHeroList = [];
            }
            heroIdLis.map((hid) => { checkinData.todayHeroList.push(hid); });
            setCheckinData(uuid, checkinData, multiController,() => {
                callback(true);
            }, true);
        });
    } else {
        callback(false);
    }
}

module.exports = {
    getCheckinData,
    setCheckinData,
    resetCheckinData,
    createCheckinListByRule,
    isTakeCheckinBonus,
    addTodayHeroList
}
