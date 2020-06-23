const gamedata = require('./../../../configs/gamedata.json');
const externalController = require('./externalController');
const inspController = require('./inspController');
const gachaController = require('./gachaController');
const soulController = require('./soulController');
const orderController = require ('./orderController')
const shopController = require('./shopController');
const checkinController = require('./checkinController');
const fixedController = require('./fixedController');
const taskController = require('./../controllers/taskController');
const heroController = require('./heroController');
const playerController = require('./playerController');
const utils = require('./../../common/utils');
const validator = require('validator');
const DefaultConfig = require('./../../designdata/Defaults');
const GameBuyCountConfig = require('./../../designdata/GameBuyCounts');
const inspTheme = require('../controllers/inspThemController')
const inspCount = require('../controllers/inspCountController')

const categoryFromItemList = fixedController.categoryFromItemList;
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const globalController = require('./globalController');

const FixedViewRespects = require('./../../datas/Fixed_ViewRespects');
const FIXED_VIEWRESPECTSDATA = FixedViewRespects.ViewRespectsData();
const FIXED_VIEWRESPECTSDATA_INDEXES = FixedViewRespects.ViewRespectsIndexes;
const CONSTANTS = require('./../../common/constants');
function isNow(tim)
{
    var ndate = new Date().toLocaleDateString(),
        tdate = new Date(tim).toLocaleDateString();
    return (ndate == tdate);
}

class gameController
{
    constructor(uuid, multiController, taskController = null){
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getGameData (respData, callback) {
        let self = this;
        globalController.updateGlobalData(() => {
            GameRedisHelper.getHashFieldValue('UserData', this.uuid_, async sPlayerData => {
                var playerData = JSON.parse(sPlayerData), et = new Date();
                if (playerData) {
                    let shouldRestData = true;
                    if (playerData.resetTime) {
                        var st = new Date(playerData.resetTime);
                        /*
                        if (et.getFullYear() === st.getFullYear() && et.getMonth() === st.getMonth() &&
                                et.getDate() === st.getDate()) {*/
                        if (isNow(st)) {
                            shouldRestData = false;
                        }
                    }

                    if (shouldRestData) {
                        playerData.resetTime = et.getTime();
                    }

                    // =====================================
                    // 每日活跃度
                    if (shouldRestData) {
                        playerData.activeDegreeValue = 0;
                        playerData.activeDegreeRwdList = [];
                    } else {
                        if (!playerData.activeDegreeValue) playerData.activeDegreeValue = 0;
                        if (!playerData.activeDegreeRwdList) playerData.activeDegreeRwdList = [];
                    }
                    respData.actDegValue = playerData.activeDegreeValue;
                    respData.actDegRwdList = playerData.activeDegreeRwdList;
                    // =====================================
                    async function doInspData(inspPtr)
                    {
                        let backData_ = await inspPtr.dayReset(false)
                        return backData_;
                    }

                    // 商城重置
                    function DayResetAbout_Shop(resetFlag, uuid, callback)
                    {
                        if (resetFlag) {
                            shopController.shopDayReset(uuid, self.multiController,() => {
                                callback();
                            }, true);
                        } else {
                            callback();
                        }
                    }

                    // 签到重置
                    function DayResetAbout_DailyCheckIn(resetFlag, uuid, callback)
                    {
                        if (resetFlag) {
                            checkinController.resetCheckinData(uuid, self.multiController,(checkinData) => {
                                callback();
                            });
                        } else {
                            callback();
                        }
                    }

         
                    DayResetAbout_Shop(shouldRestData, this.uuid_, () => {
                        DayResetAbout_DailyCheckIn(shouldRestData, this.uuid_, () => {
                            var insp_count = new inspCount (this.uuid_, self.multiController, self.taskController)
                            var insp = new inspController(this.uuid_, self.multiController, self.taskController)
                            var hero = new heroController(this.uuid_, 0, self.multiController, self.taskController)

                            doInspData(insp_count).then(data => {
                                insp.getData(hero,0, 0, (insData, insMapData) => {
                                    var insNode = {};
                                    insNode.inspCount          = data.count;
                                    insNode.buyCount           = data.buycnt;
                                    insNode.inspActionPoint    = insData.inspActionPoint;
                                    insNode.effItemId          = insData.effItemId; // 效果道具使用保存值

                                    if (insMapData.effSkillList != null) insNode.effSkillList = insMapData.effSkillList;
                                    insNode.addSkillBaselinggan = insMapData.addSkillBaselinggan;
                                    insNode.freeItemCnt = insMapData.freeItemCnt;
                                    insNode.freeItemId = insMapData.freeItemId;
                                    if (insMapData.themeData) {
                                        insNode.themeData = insMapData.themeData;
                                        if (insMapData.themeData.extBuff != null) {
                                            insNode.castAp = 50 + insMapData.themeData.extBuff.ap;
                                            insNode.castAp = insNode.castAp < 0 ? 0 : insNode.castAp;
                                        } else {
                                            insNode.castAp = 0;
                                        }
                                    }

                                    respData.inspData = insNode;
                                    let soul = new soulController (this.uuid_,this.multiController, this.taskController);
                                    soul.resetSoulGameData (shouldRestData, _ => {
                                        soul.getSoulGameData (soulDataUpdated => {
                                            respData.soulGameData = soulDataUpdated;
                                            var gacha = new gachaController(this.uuid_, self.multiController, self.taskController);
                                            gacha.updateAreaFreeData(shouldRestData, () => {
                                                gacha.getGachaDataByUuid((gachaData, areaFreeLis) => {
                                                    respData.areaFreeList = areaFreeLis;
                                                    gacha.checkGachaDataIsAllOver(isOver => {
                                                        if (isOver === 0) {
                                                            respData.gachaData = {};
                                                            respData.gachaData.buyCount   = gachaData.buyCount;
                                                            respData.gachaData.gachaCount = gachaData.gachaCount;
                                                            respData.gachaData.areaId     = gachaData.areaId;
                                                            respData.gachaData.playHeroId = gachaData.playHeroId;
                                                            respData.gachaData.mapData    = gachaData.mapInfo;
                                                            respData.gachaData.isAllOver  = gachaData.isAllOver;
                                                            respData.gachaData.gachaType  = gachaData.gachaType;
                                                        }

                                                        if (shouldRestData) {
                                                            let quiz = new externalController(this.uuid_,self.multiController, self.taskController);
                                                            quiz.resetAllHeroQuizUsedCountAndQuizItem ( async _ => {
                                                                let order = new orderController (this.uuid_, self.multiController, self.taskController);
                                                                let freeRefreshCount = DefaultConfig.getShortOrderFreeRefCount();//gamedata.ORDER.ShortOrderMaxRefreshTime;
                                                                let sOrderCompleteCount = 0;
                                                                let sTimeOrderCompleteCount = 0;
                                                                let orderBuyCount = GameBuyCountConfig.getShortOrderBuyCountMax(); //gamedata.ORDER.ShortOrderBuyMax;
                                                                let sOrderCountLimited = gamedata.ORDER.ShortOrderCountLimited;
                                                                let longOrderCount = gamedata.ORDER.LongOrderMaxCount;
                                                                let longOrderBuyCont = 0;
                                                                await order.refreshOrderDataInfo (freeRefreshCount, sOrderCompleteCount, sTimeOrderCompleteCount, orderBuyCount, sOrderCountLimited, longOrderCount, longOrderBuyCont);
                                                                self.multiController.push(1,'UserData' + ":" + this.uuid_,JSON.stringify(playerData))
                                                                callback (respData);
                                                            });
                                                        }else {
                                                            callback (respData);
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }else {
                    callback ({});
                }
            });
        });
    }

    // 是否可以重置时间
    needResetDataByTimeStamps (timestamp1, timestamp2, resethour){
        var days = parseInt ((timestamp1 - timestamp2) / (1000 * 60 * 60 * 24));
        if (Math.abs (days) >= 1) {
            return true
        }else {
            let st = new Date(timestamp1), et = new Date(timestamp2);
            if (st.getFullYear() != et.getFullYear() || st.getMonth() != et.getMonth()) {
                return true
            }else {
                let stHour = st.getHours (), etHour = et.getHours ()
                let stDays = st.getDate (),  etDays = et.getDate ()
                if (stDays == etDays) {
                    if (stHour < resethour && etHour >= resethour) {
                        return true;
                    }else {
                        return false;
                    }
                }else {
                    if (etHour >= resethour) {
                        return true;
                    }else {
                        return false;
                    }
                }
            }
        }
    }

    // 检测看板显示信息
    checkViewRespect (callback){
        GameRedisHelper.getHashFieldValue('ViewRespects', this.uuid_, sCheckRespects => {
            var checkRespectData = sCheckRespects ? JSON.parse(sCheckRespects) : {};
            let notRespected = true, et = new Date();
            let curTimestamps = et.getTime ();
            if (checkRespectData.lastRespTime) {
                if (this.needResetDataByTimeStamps (checkRespectData.lastRespTime, curTimestamps, 7)) {
                    notRespected = true;
                }else {
                    if (checkRespectData.curRespectType == null || checkRespectData.curRewards == null) {
                        notRespected = true;
                    }else {
                        notRespected = false;
                    }
                }
            }

            GameRedisHelper.getHashFieldValue('UserData', this.uuid_, sPlayerData => {
                var playerData = JSON.parse(sPlayerData);
                let lastlogintime = playerData.lastlogintime;
                let retData = {};
                if (notRespected) {
                    let hasCreatedRespectData = false;
                    /*
                    //暂时屏蔽生日 纪念日 回归对话
                    if (playerData.settingdata.birth != null) {
                        var checkTime = playerData.settingdata.birth
                        var monthandday = checkTime.split("-");
                        if ((et.getMonth() + 1) === parseInt (monthandday[0]) && et.getDate() === parseInt(monthandday[1])) {
                            let resptype = gamedata.VIEWRESPECTS.RespType_Birthday
                            var idLis = FIXED_VIEWRESPECTSDATA_INDEXES['RespectType' + resptype], respData = null;
                            respData = FIXED_VIEWRESPECTSDATA[idLis[0]];
                            if (respData != null) {
                                checkRespectData.curRespectType = resptype;
                                checkRespectData.lastRespTime = curTimestamps;
                                checkRespectData.curRewards = utils.randomListByWeight(utils.getHashArraySplitTwice(respData.Rewards, '|', ','))[0];
                                hasCreatedRespectData = true;
                            }
                        }
                    }

                    if (!hasCreatedRespectData) {
                        let resptype = gamedata.VIEWRESPECTS.RespType_Anniversary
                        var idLis = FIXED_VIEWRESPECTSDATA_INDEXES['RespectType' + resptype], respData = null;
                        var checkTime = playerData.createtime;
                        var days = parseInt ((curTimestamps - checkTime) / (1000 * 60 * 60 * 24));
                        for (let respId of idLis) {
                            let checkedRespData = FIXED_VIEWRESPECTSDATA[respId];
                            if (checkedRespData != null && days >= checkedRespData.IntervalDays) {
                                respData = checkedRespData
                            }
                        }

                        if (respData != null) {
                            var isAlreadyHasAnniversary = false;
                            if (checkRespectData.anniversary == null) {
                                checkRespectData.anniversary = [];
                            }else {
                                if (utils.isArrayContains (checkRespectData.anniversary, respData.IntervalDays)) {
                                    isAlreadyHasAnniversary = true;
                                }
                            }
                            if (!isAlreadyHasAnniversary) {
                                checkRespectData.curRespectType = resptype;
                                checkRespectData.lastRespTime = curTimestamps;
                                checkRespectData.intervaldays = respData.IntervalDays;
                                checkRespectData.anniversary.push (respData.IntervalDays);
                                checkRespectData.curRewards = utils.randomListByWeight(utils.getHashArraySplitTwice(respData.Rewards, '|', ','))[0];
                                hasCreatedRespectData = true;
                            }
                        }
                    }

                    if (!hasCreatedRespectData) {
                        let resptype = gamedata.VIEWRESPECTS.RespType_Return;
                        var idLis = FIXED_VIEWRESPECTSDATA_INDEXES['RespectType' + resptype], respData = null;
                        var checkTime = lastlogintime;
                        var days = parseInt ((curTimestamps - checkTime) / (1000 * 60 * 60 * 24));

                        for (let respId of idLis) {
                            let checkedRespData = FIXED_VIEWRESPECTSDATA[respId];
                            if (checkedRespData != null && days >= checkedRespData.IntervalDays) {
                                respData = checkedRespData
                            }
                        }
                        if (respData != null) {
                            checkRespectData.curRespectType = resptype;
                            checkRespectData.lastRespTime = curTimestamps;
                            checkRespectData.intervaldays = respData.IntervalDays;
                            checkRespectData.curRewards = utils.randomListByWeight(utils.getHashArraySplitTwice(respData.Rewards, '|', ','))[0];
                            hasCreatedRespectData = true;
                        }
                    }*/
                    if (!hasCreatedRespectData) {
                        let resptype = gamedata.VIEWRESPECTS.RespType_Login
                        var idLis = FIXED_VIEWRESPECTSDATA_INDEXES['RespectType' + resptype], respData = null;
                        respData = FIXED_VIEWRESPECTSDATA[idLis[0]];
                        if (respData != null) {
                            checkRespectData.curRespectType = resptype;
                            checkRespectData.lastRespTime = curTimestamps;
                            checkRespectData.curRewards = utils.randomListByWeight(utils.getHashArraySplitTwice(respData.Rewards, '|', ','))[0];
                            hasCreatedRespectData = true;
                        }
                    }
                    if (hasCreatedRespectData) {
                        retData.curRespectType = checkRespectData.curRespectType;
                        retData.curRewards = checkRespectData.curRewards;
                        retData.intervaldays = checkRespectData.intervaldays;
                        checkRespectData.respRewardStatus = 0;
                        this.multiController.push(1,'ViewRespects' + ":" + this.uuid_,JSON.stringify(checkRespectData))
                        callback(retData);
                    }else{
                        retData.respType = gamedata.VIEWRESPECTS.RespType_Normal;
                        callback (retData);
                    }
                }else {
                    if (checkRespectData.respRewardStatus && checkRespectData.respRewardStatus == 1) {
                        retData.respType = gamedata.VIEWRESPECTS.RespType_None;
                        callback (retData);
                    }else {
                        retData.curRespectType = checkRespectData.curRespectType;
                        retData.curRewards = checkRespectData.curRewards;
                        retData.intervaldays = checkRespectData.intervaldays;
                        callback (retData);
                    }
                }
            });
        });
    }

    // 看板问候提交
    viewRespectCheckIn (respType, curRewards, callback) {
        let retData = {};
        function getHeroGroup(addHeroLis) {
            var group = [];
            for(let i in addHeroLis) {
                group.push(addHeroLis[i].hid);
            }
            return group;
        }

        GameRedisHelper.getHashFieldValue('ViewRespects', this.uuid_, sCheckRespects => {
            var checkRespectData = sCheckRespects ? JSON.parse(sCheckRespects) : {};
            if (checkRespectData.respRewardStatus == 1) {
                retData.status = 1;
                callback(retData);
            }else if (checkRespectData.curRespectType != respType || checkRespectData.curRewards != curRewards) {
                retData.status = 2;
                callback(retData);
            }else {
                var hero = new heroController(this.uuid_,0,this.multiController, this.taskController);
                var player = new playerController(this.uuid_,this.multiController, this.taskController);

                let AwardLis = [];
                AwardLis.push (curRewards);
                fixedController.GeneralAwards.getBonusConfig(AwardLis, BonusConfig => {
                    hero.getConvertNewHeroAndPieceItem(BonusConfig.heros, (newAddHeroLis, pieceHeroGroup) => {
                        fixedController.Items.getItemListByHeroIdGroupConfig(pieceHeroGroup, pieceItemLis => {
                            BonusConfig.items = BonusConfig.items.concat(pieceItemLis); // 将物品和墨魂碎片物品合并
                            BonusConfig.heros = newAddHeroLis;
                            // taskController.getTaskDataFromSource(this.uuid_, TaskData => {
                                player.addItem(BonusConfig.items, () => {
                                    // 加入货币
                                    player.addCurrencyMulti(BonusConfig.currency, newCurrency => {
                                        // 加入新墨魂
                                        hero.addHeroGroup(BonusConfig.heros, (newAddHeroLis) => {
                                            // taskController.getCounterDataByTypeGroup(this.uuid_, [1, 2], taskEventData => {
                                               
                                                    checkRespectData.respRewardStatus = 1;
                                                    this.multiController.push(1,'ViewRespects' + ":" + this.uuid_,JSON.stringify(checkRespectData))
                                                    retData.status = 0;
                                                    // retData.taskEventData = taskEventData;
                                                    retData.addItems = BonusConfig.items;
                                                    retData.currency = newCurrency;
                                                    retData.heroList = getHeroGroup(newAddHeroLis);
                                                    callback(retData);
                                          
                                            // }, TaskData);
                                        });
                                    });
                                });
                            // });
                        });
                    });
                });
            }
        });
    }

    // 获取公告列表
    getNoticeList(callback)
    {
        GameRedisHelper.getString("NoticeData", res => {
            if (res !== null && validator.isJSON(res)) {
                callback(JSON.parse(res));
            } else {
                callback([]);
            }
        });
    }

    // 验证公告附件是否领取
    checkNoticeAttchRewardValid(pubId, callback) {
        GameRedisHelper.getHashFieldValue('UserData', this.uuid_, sPlayerData => {
            var playerData = JSON.parse(sPlayerData);
            var valid = true;
            for (let i in playerData.NoticeRwdList) {
                if (playerData.NoticeRwdList[i].pubid === pubId && playerData.NoticeRwdList[i].status === 1) {
                    // 已领取
                    valid = false;
                    break;
                }
            }

            callback(valid);
        });
    }

    // 获取公告附件
    getNoticeAttchAward(pubId, callback) {
        GameRedisHelper.getHashFieldValue('PubNotices', pubId, sdoc => {
            var doc = sdoc ? JSON.parse(sdoc) : null;
            var attch = [];
            if (doc && doc.attch) {
                attch = doc.attch;
            }
            callback(categoryFromItemList(attch));
        });
    }

    // 加入公告附件领取信息
    addNoticeAttchRwdList(pubId, stat, callback) {
        GameRedisHelper.getHashFieldValue('UserData', this.uuid_, sPlayerData => {
            var playerData = JSON.parse(sPlayerData);
            if (playerData.NoticeRwdList) {
                playerData.NoticeRwdList.push({pubid: pubId, status: stat});
            } else {
                playerData.NoticeRwdList = [{pubid: pubId, status: stat}];
            }
            this.multiController.push(1,'UserData' + ":" + this.uuid_,JSON.stringify(playerData))
            callback();
        });
    }

    /**
     * updateHeartBeatTime - 更新心跳包
     * @param {Number} uuid
     * @param {Number} st
     * @param {Function} callback
     */
    updateHeartBeatTime(uuid, st, callback) {
        if ('number' === typeof uuid && uuid > 0) {
        GameRedisHelper.setHashFieldValue("HeartBeats", uuid, st, () => {
                    callback(st);
                });

        } else {
            callback(st);
        }
    }
}

module.exports = gameController;
