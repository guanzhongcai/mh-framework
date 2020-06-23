const AccountLevel = require ('./fixedController').AccountLevel;
const models = require('./../models');
const inspController = require('./inspController');
const ItemsConfig = require('./fixedController').Items;
const taskController = require('./taskController');
const utils = require('./../../common/utils');
const validator = require('validator');
const categoryFromItemList = require ('./fixedController').categoryFromItemList;
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CONSTANTS = require('./../../common/constants');
var assert = require ('assert');

class PlayerController
{
    static CURRENCYTYPES()
    {
        return {
            GOLD: 1,    // 金币
            DIAMOND: 2, // 钻石（独玉）
            HUNGRY: 3   // 饱食值
        }
    }

    // 推送通知类型
    static NOTIF_TYPES()
    {
        return {
            PRODUCING: 1, // 生产完成
            SHOP_REFRESH: 2, // 商店刷新
            LONGORDER_REFRESH: 3, // 长订单刷新
            HERO_WEEKUP: 4, // 墨魂睡醒
            PLAY_NUMS: 5, // 玩法次数
        }
    }

    constructor(uuid,multiController, taskController = null)
    {
        this.m_uuid = uuid ? parseInt(uuid) : 0;
        this.m_tblName = 'UserData';
        this.m_itemTblName = 'ItemData';
        this.m_UserData = null;
        this.m_ItemData = null;
        this.m_RedisUserDataString = null;
        this.m_RedisItemDataString = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getUUID()
    {
        return this.m_uuid;
    }

    resetCaChe()
    {
        this.m_RedisItemDataString = null;
        this.m_RedisUserDataString = null;
        this.m_UserData = null;
        this.m_ItemData= null;
    }

    errorHandle()
    {
        this.resetCaChe()
    }

    getUserDataFromDataSource (callback) {
        if (this.m_UserData == null) {
            GameRedisHelper.getHashFieldValue(this.m_tblName, this.m_uuid, sUserData => {
                this.m_RedisUserDataString = sUserData;
                let doc = sUserData && validator.isJSON(sUserData)? JSON.parse(sUserData) : null;
                this.m_UserData = doc;
                callback (doc);
            });
        }else {
            callback (this.m_UserData);
        }
    }

    saveUserDataToDataSource (userData, callback) {
        if (userData != null) {
            let saveString = JSON.stringify(userData);
            let shouldSave = false;
            if (this.m_RedisUserDataString == null || this.m_RedisUserDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.m_UserData = userData;
                this.multiController.uniqPush(1, this.m_tblName + ":" + this.m_uuid, saveString)
                this.m_RedisUserDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    getItemDataFromDataSource (callback) {
        if (this.m_ItemData == null) {
            GameRedisHelper.getHashFieldValue(this.m_itemTblName, this.m_uuid, sItemData => {
                this.m_RedisItemDataString = sItemData;
                let doc = sItemData && validator.isJSON(sItemData)? JSON.parse(sItemData) : null;
                this.m_ItemData = doc;
                callback (doc);
            });
        }else {
            callback (this.m_ItemData);
        }
    }

    saveItemDataToDataSource (itemData, callback) {
        if (itemData != null) {
            let saveString = JSON.stringify(itemData);
            let shouldSave = false;
            if (this.m_RedisItemDataString == null || this.m_RedisItemDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.m_ItemData = itemData;
                this.multiController.uniqPush(1, this.m_itemTblName+":" + this.m_uuid, saveString)
                this.m_RedisItemDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    getLevel(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (playerData) {
                callback(playerData.userlevel ? playerData.userlevel : 1);
            } else {
                callback(1);
            }
        });
    }

    async getRechargeTime () {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    if (playerData.rechargeTime == null) {
                        resolve(0);
                    } else {
                        resolve(playerData.rechargeTime);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }


    async updateRechargeTime (cnt) {
        return new Promise( resolve => {
            this.getUserDataFromDataSource (playerData => {
                if (playerData) {
                    if (playerData.rechargeTime == null){
                        playerData.rechargeTime = cnt;
                    }else {
                        playerData.rechargeTime += cnt;
                    }
                    this.saveUserDataToDataSource (playerData, () => {
                        resolve (true);
                    });
                } else {
                    resolve(true);
                }
            });
        });
    }

    async updateRechargeMoneyCnt (cnt) {
        return new Promise( resolve => {
            this.getUserDataFromDataSource (playerData => {
                if (playerData) {
                    if (playerData.rechargeMoney == null){
                        playerData.rechargeMoney = cnt;
                    }else {
                        playerData.rechargeMoney += cnt;
                    }
                    this.saveUserDataToDataSource (playerData, () => {
                        resolve (playerData.rechargeMoney);
                    });
                } else {
                    resolve(0);
                }
            });
        });
    }

    // 检测是满足首冲领取奖励状态
    async checkFirstRechargeCondition () {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    if (playerData.rechargeTime == null || playerData.rechargeTime <= 0) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                } else {
                    resolve(false);
                }
            });
        });
    }

    // 检测首充领取奖励状态
    async getFirstRechargeGetAwardStatus () {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    if (playerData.firstRechargeReward == null) {
                        resolve(false);
                    } else {
                        resolve(playerData.firstRechargeReward);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    }


    // 更新首充领取奖励状态
    async updateFirstRechargeRewardStatus () {
        return new Promise( resolve => {
            this.getUserDataFromDataSource (playerData => {
                if (playerData) {
                    playerData.firstRechargeReward = true;
                    this.saveUserDataToDataSource (playerData, () => {
                        resolve (playerData.firstRechargeReward);
                    });
                } else {
                    resolve(true);
                }
            });
        });
    }

    // 检测活动领奖状态
    async checkActivityAwardStatis (activityType, index) {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    if (playerData.DailyLoginInfo == null || playerData.DailyLoginInfo.loginReward == null) {
                        resolve(true);
                    } else {
                        let rewardStatus = 0
                        for (let reward of playerData.DailyLoginInfo.loginReward) {
                            if (reward.atype === activityType && reward.index === index) {
                                rewardStatus = reward.status
                                break;
                            }
                        }
                        resolve(rewardStatus === 1);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    }

    // 设置活动领奖状态
    async setActivityAwardStatus (atype, index) {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                assert (playerData != null && playerData.DailyLoginInfo != null);
                if (playerData.DailyLoginInfo.loginReward == null) playerData.DailyLoginInfo.loginReward = [];
                let alreadyExist = false
                for (let reward of playerData.DailyLoginInfo.loginReward) {
                    if (reward.atype === atype && reward.index === index) {
                        alreadyExist = true
                        reward.status = 1
                    }
                }

                if (!alreadyExist) {
                    playerData.DailyLoginInfo.loginReward.push({atype:atype, index:index, status:1});
                }
                this.saveUserDataToDataSource (playerData, () => {
                    resolve (playerData.DailyLoginInfo);
                });
            });
        });
    }

    // 检测是满足首冲领取奖励状态
    async checkActiveRewardStatusCondition (dayCnt) {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    if (playerData.DailyLoginInfo == null || playerData.DailyLoginInfo.loginDayCnt == null || playerData.DailyLoginInfo.loginDayCnt < dayCnt) {
                        resolve (false);
                    }else {
                        resolve (true);
                    }
                } else {
                    resolve(false);
                }
            });
        });
    }


    setPlayerData(data, callback)
    {
        this.saveUserDataToDataSource (data, () => {
            callback();
        });
    }

    // todo: 添加升级奖励
    addExp(v, callback, taskData = null)
    {
        this.getUserDataFromDataSource (res => {
            if (res != null && res.exp != null && res.userlevel != null) {
                res.exp += v;
                let userLevel = res.userlevel;
                let exp = res.exp;
                let retData = {};
                let awardItems = [];
                var userLevelUpFlag = false;
                let addLevelCount = 0;
                AccountLevel.getAccountLevelData (res.userlevel, async levelDatas => {
                    if (levelDatas != null) {
                        for (let i in levelDatas) {
                            if (levelDatas[i].LevelId >= userLevel) {
                                if (exp >= levelDatas[i].Max) {
                                    exp = exp - levelDatas[i].Max;
                                    userLevelUpFlag = true;
                                    addLevelCount += 1;
                                    awardItems = awardItems.concat (utils.getItemArraySplitTwice (levelDatas[i].AwardItems, '|', ','));
                                    userLevel += 1;
                                } else {
                                    break;
                                }
                            }
                        }
                    }

                    retData.exp = exp;
                    retData.addExp = v;
                    retData.userLevel = userLevel;
                    retData.addLevelCount = addLevelCount;
                    if (userLevelUpFlag) {
                        retData.levelUpAwardItems = awardItems;
                    }
                    res.userlevel = userLevel;
                    res.exp = exp;
                    this.saveUserDataToDataSource (res, () => {
                        if (userLevelUpFlag) {
                            var insp = new inspController(this.m_uuid,this.multiController, this.taskController);

               
                            if(this.taskController){
                                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.MoHenLevel,[{params:[0],num:userLevel,add:false}]);
                                callback(retData)
                                
                            }else {
    
                                var tskSave = taskData ? false : true;
                                taskController.getSourceTaskData(this.m_uuid, taskData, TaskData => {
                                    taskController.addTaskCounter(TaskData, this.m_uuid, 3, [{params:[0]}], () => {
                                        taskController.setSourceTaskData(this.m_uuid, TaskData, async() => {
                                            callback(retData);
                                        }, tskSave);
                                    }, userLevel, false);
                                });
                            }
                        }else{
                            callback(retData);
                        }
                    });
                });
            } else {
                callback({});
            }
        });
    }

    getCurrency(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (playerData && playerData.currency) {
                callback(playerData.currency);
            } else {
                console.error("[PlayerController][getCurrency] null: ", this.m_uuid);
                callback([0,0,0]);
            }
        });
    }

    setCurrency(currency, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (playerData && playerData.currency) {
                playerData.currency = currency;
                this.saveUserDataToDataSource (playerData, () => {
                    callback();
                });
            }else {
                console.error("[PlayerController][getCurrency] null: ", this.m_uuid);
                callback();
            }
        });
    }

    getCurrencyByType(currencyType, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (playerData && playerData.currency) {
                var playerData = JSON.parse(sPlayerData);
                callback(playerData.currency[currencyType-1]);
            }else {
                console.error("[PlayerController][getCurrencyByType] null: ", this.m_uuid);
                callback (0);
            }
        });
    }

    currencyMultiValid(currency, callback)
    {
        var valid = true, zeroCounter = 0;

        if (currency === null) {
            valid = false;
        } else {
            if (currency.length !== 3) valid = false;

            for (let i in currency) {
                if (currency[i] < 0) {
                    valid = false;
                    break;
                }

                if (currency[i] === 0) {
                    ++zeroCounter;
                }
            }
        }

        if (valid) {
            // 说明数值全为正
            if (zeroCounter === 3) {
                // currency === [0,0,0] // 说明数值全部为零，但可以继续执行
                callback(valid);
            } else {
                this.getUserDataFromDataSource (doc => {
                    var nowCurrency = (doc && doc.currency) ? doc.currency : [0, 0, 0];
                    for (let i in nowCurrency) {
                        if (nowCurrency[i] < currency[i]) {
                            valid = false;
                            break;
                        }
                    }
                    callback(valid);
                });
            }
        } else {
            callback(valid);
        }
    }

    static getItemFromCurrency(currency) {
        var items = [];
        if (currency[0] > 0) {
            items.push({ id: 410001, count: currency[0] });
        }

        if (currency[1] > 0) {
            items.push({ id: 410002, count: currency[1] });
        }

        if (currency[2] > 0) {
            items.push({ id: 410003, count: currency[2] });
        }

        return items;
    }

    addCurrencyMulti(currency, callback, taskData= null)
    {
        var currItem = PlayerController.getItemFromCurrency(currency),
            paramGroup = [];
        for (let i in currItem) {
            paramGroup.push({
                params: [currItem[i].id],
                num: currItem[i].count
            })
        }

        this.getUserDataFromDataSource (res => {
            if (res && res.currency) {
                for (let i = 0; i < res.currency.length; i++) {
                    res.currency[i] += currency[i];
                }
                this.saveUserDataToDataSource (res, async () => {
                    if(this.taskController){
                        //TODO 增加货币
                        this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItem, paramGroup);
                        callback(res.currency)
                    }else {
    
                        var tskSave = taskData ? false : true;
                        taskController.getSourceTaskData(this.m_uuid, taskData, TaskData => {
                            taskController.addTaskCounterGroup(TaskData, this.m_uuid, 1, paramGroup, () => {
                                taskController.setSourceTaskData(this.m_uuid, TaskData, () => {
                                    callback(res.currency);
                                }, tskSave);
                            });
                        });
                    }
                });
            } else {
                callback(null);
            }
        });
    }

    costCurrencyMulti(currency, callback, taskData)
    {
        var currItem = PlayerController.getItemFromCurrency(currency),
        paramGroup = [];
        for (let i in currItem) {
            paramGroup.push({
                params: [currItem[i].id],
                num: currItem[i].count
            })
        }
        
        if (!currency) currency = [0,0,0];
        this.getUserDataFromDataSource (res => {
            if (res && res.currency) {
                for (let i = 0; i < res.currency.length; i++) {
                    res.currency[i] -= currency[i];
                }
                this.saveUserDataToDataSource (res, () => {
                    
                    if(this.taskController){
                        //TODO 消耗货币
                        this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CostCurrency, paramGroup);
                        callback(res.currency);
                    }else {
                        var tskSave = taskData ? false : true;
                        taskController.getSourceTaskData(this.m_uuid, taskData, TaskData => {
                            taskController.addTaskCounterGroup(TaskData, this.m_uuid, 2, paramGroup, () => {
                                taskController.setSourceTaskData(this.m_uuid, TaskData, () => {
                                    callback(res.currency);
                                }, tskSave);
                            });
                        });
                    }
                });
            } else {
                callback(null);
            }
        });
    }

    itemValid(items, callback)
    {
        var valid = true;
        if (items.length === 0) {
            callback(valid);
        } else {
            this.getItemDataFromDataSource (playerItemLis => {
                if (playerItemLis) {
                    for (let item of items) {
                        var isFind = false;
                        for (let i in playerItemLis) {
                            if (playerItemLis[i].id === item.id) {
                                isFind = true;

                                if (playerItemLis[i].count < item.count) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                        if (!isFind) {
                            valid = false;
                            break;
                        }
                        if (!valid)
                            break;
                    }
                } else {
                    valid = false;
                }

                callback(valid);
            });
        }
    }

    restoreUsedItem (items, itemUsed) {
        for (let i in itemUsed) {
            let find = false
            for (let item of items) {
                if (item.id === itemUsed[i].id) {
                    item.count -= itemUsed[i].count;
                    find = true;
                    break;
                }
            }
            if (!find) {
                items.push ({id: itemUsed[i].id, count:-itemUsed[i].count})
            }
        }
    }

    itemValidRestoreUsed (items, itemUsed, callback) {
        let valid = true;
        this.getItemDataFromDataSource (playerItemLis => {
            this.restoreUsedItem (items, itemUsed)
            if (playerItemLis) {
                for (let item of items) {
                    var isFind = false;
                    for (let i in playerItemLis) {
                        if (playerItemLis[i].id === item.id) {
                            isFind = true;
                            if (playerItemLis[i].count < item.count) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if (!isFind && item.count > 0) {
                        valid = false;
                        break;
                    }
                    if (!valid)
                        break;
                }
            } else {
                valid = false;
            }
            callback(valid);
        });
    }

    getItemCount (itemId, callback)
    {
        this.getItemDataFromDataSource (playerItemLis => {
            var itemCount = 0;
            if (playerItemLis) {
                for (let i in playerItemLis) {
                    if (playerItemLis[i].id === itemId) {
                        itemCount = playerItemLis[i].count;
                        break;
                    }
                }
            }
            callback(itemCount);
        });
    }

    getItemList(callback)
    {
        this.getItemDataFromDataSource (res => {
            callback (res ? res : []);
        });
    }

    setItemList(items, callback)
    {
        if (items && items.length > 0) {
            this.saveItemDataToDataSource (items, ()=> {
                callback();
            });
        } else {
            callback();
        }
    }

    /**
     * getRemainNeedItemList - 获取剩余所需物品列表（所需列表-背包列表）
     * @param {Object} needItemObj
     * @param {Function} callback
     */
    getRemainNeedItemList(needItemObj, callback)
    {
        if ('object' === typeof needItemObj) {
            this.getItemDataFromDataSource (itemLis => {
                var itemCount, needItemLis = [], needCostItemLis = [];
                if (Array.isArray(itemLis)) {
                    for (let i in itemLis) {
                        if (needItemObj[itemLis[i].id]) {
                            itemCount = needItemObj[itemLis[i].id] - itemLis[i].count;
                            if (itemCount <= 0) {
                                // 背包物品足够
                                needCostItemLis.push({ id: itemLis[i].id, count: needItemObj[itemLis[i].id] });

                                delete needItemObj[itemLis[i].id];
                            } else {
                                // 背包物品不足（剩余所需）
                                needItemObj[itemLis[i].id] = itemCount;

                                needCostItemLis.push({ id: itemLis[i].id, count: itemLis[i].count });
                            }
                        }
                    }
                    // item object => item array
                    Object.keys(needItemObj).map((id) => { needItemLis.push({ id: Number(id), count: needItemObj[id] }); });
                    callback(needItemLis, needCostItemLis);
                } else {
                    callback(null, null);
                }
            });
        } else {
            callback(null, null);
        }
    }

    addItem(items, callback, isRecord = true)
    {
        if (items.length === 0) {
            callback(items);
        } else {
            this.getItemDataFromDataSource (newItemLis => {
                if (newItemLis) {
                    //newItemLis = JSON.parse(res);
                    for (let item of items) {
                        if (item.id === undefined || item.id === null || item.id <= 0 || item.count < 1)
                            continue;

                        var isFind = false;
                        for (let i in newItemLis) {
                            if (item.id === newItemLis[i].id) {
                                newItemLis[i].count += item.count;
                                isFind = true;
                                break;
                            }
                        }

                        if (!isFind) {
                            // 新物品
                            var newItem = models.ItemModel();
                            newItem.id      = item.id;
                            newItem.count   = item.count;
                            newItemLis.push(newItem);
                        }
                    }
                } else {
                    // 全部为新物品
                    newItemLis = [];
                    for (let i in items) {
                        if (items[i].id === undefined || items[i].id === null || items[i].id <= 0 || items[i].count < 1)
                            continue;

                        var newItem = models.ItemModel();
                        newItem.id      = items[i].id;
                        newItem.count   = items[i].count;
                        newItemLis.push(newItem);
                    }
                }

                this.saveItemDataToDataSource (newItemLis, async ()=> {
                    if(this.taskController){
                        
                        
                        ItemsConfig.getParamGroupByItemListConfig(items, async paramGroup => {
                            // 任务-获得物品
                            
                            if(isRecord){
                                this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItem,paramGroup);
                            }
                            // this.taskController.addPointObj(1,paramGroup);
                            callback(items)
                        });
                        
                    }else {
    
                        var tskSave = taskData ? false : true;
                        taskController.getSourceTaskData(this.m_uuid, taskData, TaskData => {
                            ItemsConfig.getParamGroupByItemListConfig(items, paramGroup => {
                                // 任务-获得物品
                                taskController.addTaskCounterGroup(taskData, this.m_uuid, 1, paramGroup, () => {
                                    taskController.setSourceTaskData(this.m_uuid, TaskData, () => {
                                        callback(items);
                                    }, tskSave);
                                });
                            });
                        });
                    }
                });
            });
        }
    }

    costItem(items, callback, isRecord= true)
    {
        if (items.length === 0) {
            callback(items);
        } else {
            this.getItemDataFromDataSource (itemLis => {
                if (itemLis) {
                    //var itemLis = JSON.parse(res);
                    for (let item of items) {
                        for (let i in itemLis) {
                            if (item.id === itemLis[i].id) {
                                itemLis[i].count -= item.count;
                                if (itemLis[i].count <= 0) {
                                    itemLis.splice(i, 1); // 物品为0，删除改物品
                                }
                                break;
                            }
                        }
                    }

                    this.saveItemDataToDataSource (itemLis,  ()=> {
                        if(this.taskController){
                            ItemsConfig.getParamGroupByItemListConfig(items,  paramGroup => {
                                // 任务-消耗物品
                                if(isRecord){
                                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CostItem,paramGroup);
                                }
                                // this.taskController.addPointObj(2,paramGroup);
                                callback(items)
                            });
                        }else {
    
                            var tskSave = taskData ? false : true;
                            taskController.getSourceTaskData(this.m_uuid, taskData, TaskData => {
                                ItemsConfig.getParamGroupByItemListConfig(items, paramGroup => {
                                    // 任务-消耗物品
                                    taskController.addTaskCounterGroup(TaskData, this.m_uuid, 2, paramGroup, () => {
                                        taskController.setSourceTaskData(this.m_uuid, TaskData, () => {
                                            callback(items);
                                        }, tskSave);
                                    });
                                });
                            });
                        }
                    });
                } else {
                    callback(items);
                }
            });
        }
    }

    // 更新设置设置墨魂
    setEnterMohun (heroId, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.entermohun = heroId;
            this.saveUserDataToDataSource (playerData, ()=> {
                callback(heroId);
            });
        });
    }

    getEnterMohun(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            callback(playerData && playerData.settingdata && playerData.settingdata.entermohun ? playerData.settingdata.entermohun : 0);
        });
    }

    // 更新初次是否探索
    setAlreadyGachaStatus (firstGacha, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (firstGacha) {
                playerData.gacha = firstGacha;
                this.saveUserDataToDataSource (playerData, ()=> {
                    callback(firstGacha);
                });
            } else {
                callback(true);
            }
        });
    }

    // 获取是否是初次探索
    getAlreadyGachaStatus(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            callback(playerData && playerData.gacha ? true : false);
        });
    }

    getGachaFirstFlag(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            callback(playerData && playerData.firstFlag === undefined ? 0 : playerData.firstFlag);
        });
    }

    setGachaFirstFlag(v, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            if (playerData) {
                playerData.firstFlag = v;
                this.saveUserDataToDataSource (playerData, ()=> {
                    callback(v);
                });
            }else {
                callback (false);
            }
        });
    }

    /**
     * getMultiGachaFirstFlag - 获取探索十连首次标记（状态）
     * @param {Fucntion} callback
     */
    getMultiGachaFirstFlag(callback) {
        this.getUserDataFromDataSource(playerData => {
            callback(playerData && 'multiGachaFirstFlag' in playerData ? playerData.multiGachaFirstFlag : 0);
        });
    }

    /**
     * setMultiGachaFirstFlag - 设置探索十连首次标记（状态）
     * @param {Number} v
     * @param {Function} callback
     * @param {Boolean} save
     */
    setMultiGachaFirstFlag(v, callback) {
        this.getUserDataFromDataSource(playerData => {
            if (playerData) {
                playerData.multiGachaFirstFlag = v;
                this.saveUserDataToDataSource(playerData, () => {
                    callback(v);
                });
            } else {
                callback(false);
            }
        });
    }

    getBagLevelByDepotType(depotType, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            var bagLevel = 1;
            if (playerData && playerData.bagInfo) {
                for (let i in playerData.bagInfo) {
                    if (playerData.bagInfo[i].pos === depotType) {
                        bagLevel = playerData.bagInfo[i].baglevel;
                        break;
                    }
                }
            }
            callback(bagLevel);
        });
    }

    setBagLevelByDepotType(depotType, bagLevel, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            var bagInfo = (playerData == null || playerData.bagInfo === undefined ) ? [{pos: 2, baglevel: 1}, {pos: 3, baglevel: 1}] : playerData.bagInfo;
            for (let i in bagInfo) {
                if (bagInfo[i].pos === depotType) {
                    bagInfo[i].baglevel = bagLevel;
                    break;
                }
            }

            playerData.bagInfo = bagInfo;
            this.saveUserDataToDataSource (playerData, ()=> {
                callback(bagInfo);
            });
        });
    }

    // 设置昵称
    getNameCount(callback)
    {
        this.getUserDataFromDataSource (playerData => {
            callback(playerData && playerData.settingdata && playerData.settingdata.namecount ? playerData.settingdata.namecount : 0);
        });
    }

    setNameCount(v, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.namecount = v;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    setNickname(nickName, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.nickname = nickName;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    setNewUser(v, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.newuser = v;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    // 设置生日
    setBirth(birth, callback)
    {
        var now = (new Date()).getTime();
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.birth = birth;
            playerData.settingdata.birthtime = now;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    setHeadId(headId, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.headid = headId;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    // 获取首次设置墨魂头像状态
    getFirstViewMHFlag(callback)
    {
        var firstViewMHFlag = 0;
        this.getUserDataFromDataSource (playerData => {
            if (playerData && 'number' == typeof playerData.firstViewMHFlag) {
                firstViewMHFlag = playerData.firstViewMHFlag;
            }
            callback(firstViewMHFlag);
        });
    }

    // 设置首次设置墨魂头像状态
    setFirstViewMHFlag(v, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.firstViewMHFlag = v;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback();
            });
        });
    }

    setViewMohun(viewMohun, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.settingdata.viewmohun = viewMohun;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback(viewMohun);
            });
        });
    }

    setGuideInfo(v, callback)
    {
        this.getUserDataFromDataSource (playerData => {
            playerData.guideinfo = v;
            this.saveUserDataToDataSource (playerData, ()=>{
                callback(v);
            });
        });
    }

    // 增加游戏头像
    addGameHeadList(v, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            if (Array.isArray(playerData.gameHeadList)) {
                var isNew = true;
                for (let i in playerData.gameHeadList) {
                    if (playerData.gameHeadList[i] == v) {
                        isNew = false;
                        break;
                    }
                }
                if (isNew) {
                    playerData.gameHeadList.push(v);
                }
            } else {
                playerData.gameHeadList = [v];
            }

            this.saveUserDataToDataSource(playerData, () => {
                callback(playerData.gameHeadList);
            });
        });
    }

    // 验证游戏头像
    checkGameHeadValid(gameHeadId, callback)
    {
        callback(true);
    }

    // ==================================================================
    // 活跃度相关
    // ==================================================================

    /**
     * getActiveDegreeRwdList - 获取活跃度领取数据列表
     * @param {*} callback
     */
    getActiveDegreeRwdList(callback)
    {
        this.getUserDataFromDataSource(playerData => {
            callback('activeDegreeRwdList' in playerData ? playerData.activeDegreeRwdList : []);
        });
    }

    /**
     * checkActiveDegreeTake - 判断活跃度奖励是否已领取
     * @param {Function} callback
     */
    checkActiveDegreeTake(id, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            var valid = false;
            if ('activeDegreeRwdList' in playerData &&
                    Array.isArray(playerData.activeDegreeRwdList)) {
                valid = (playerData.activeDegreeRwdList.filter((a) => { return a.id === id; }).length > 0);
            }

            callback(valid);
        });
    }

    /**
     * addActiveDegreeRwdList - 加入领取ID
     * @param {Number} id
     * @param {Function} callback
     * @param {Boolean} save
     */
    addActiveDegreeRwdList(id, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            var actDegNode = { id: id, st: new Date().getTime() };
            if ('activeDegreeRwdList' in playerData &&
                    Array.isArray(playerData.activeDegreeRwdList)) {
                playerData.activeDegreeRwdList.push(actDegNode);
            } else {
                playerData.activeDegreeRwdList = [actDegNode];
            }
            this.saveUserDataToDataSource(playerData, () => {
                callback(actDegNode);
            });
        });
    }

    /**
     * getActiveDegreeValue - 增加活跃度值
     * @param {*} callback
     */
    getActiveDegreeValue(callback)
    {
        this.getUserDataFromDataSource(playerData => {
            callback('activeDegreeValue' in playerData ? playerData.activeDegreeValue : 0);
        });
    }

    /**
     * addActiveDegreeValue - 增加活跃度值
     * @param {Number} v
     * @param {Function} callback
     * @param {Boolean} save
     */
    addActiveDegreeValue(v, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            if ('activeDegreeValue' in playerData &&
                    !isNaN(playerData.activeDegreeValue)) {
                playerData.activeDegreeValue += v;
            } else {
                playerData.activeDegreeValue = v;
            }
            this.saveUserDataToDataSource(playerData, () => {
                callback(playerData.activeDegreeValue);
            });
        });
    }

    /**
     * resetActiveDegreeData - 重置活跃度数据
     * @param {Function} callback
     * @param {Boolean} save
     */
    /*
    resetActiveDegreeData(callback, save=false)
    {
        this.getUserDataFromDataSource(playerData => {
            playerData.activeDegreeValue = 0;
            playerData.activeDegreeRwdList = [];

            this.saveUserDataToDataSource(playerData, () => {
                callback();
            }, save);
        });
    }*/


    /**
     * getNotifSetting - 获取推送通知设置（默认开启）
     * @param {Function} callback
     */
    getNotifSetting(callback)
    {
        this.getUserDataFromDataSource(playerData => {
            callback(playerData && Array.isArray(playerData.notifSetting) ? playerData.notifSetting : [1,1,1,1,1]);
        });
    }

    /**
     * getNotifSettingByType - 根据通知类型获取推送状态
     * @param {Number} notifType
     * @param {Function} callback
     */
    getNotifSettingByType(notifType, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            var notifSetting = [1,1,1,1,1];
            if (playerData && Array.isArray(playerData.notifSetting)) {
                notifSetting = playerData.notifSetting;
            }
            callback(notifSetting[notifType - 1] ? notifSetting[notifType - 1] : 0);
        });
    }

    /**
     *
     * @param {Array} notifSetting
     * @param {Function} callback
     * @param {Boolean} save
     */
    setNotifSetting(notifSetting, callback)
    {
        if (Array.isArray(notifSetting)) {
            this.getUserDataFromDataSource(playerData => {
                if (playerData) {
                    playerData.notifSetting = notifSetting;
                    this.saveUserDataToDataSource(playerData, () => {
                        callback(notifSetting);
                    });
                } else {
                    console.warn("[PlayerController][setNotifSetting] Can't find this player's data:", this.m_uuid);
                    callback(null);
                }
            });
        } else {
            console.warn("[PlayerController][setNotifSetting] Function parameter notifSetting err:", this.m_uuid, notifSetting);
            callback(null);
        }
    }


    /**
     * setTriggerGift - 更新触发礼包数据
     * @param {Number} v
     * @param {Function} callback
     * @param {Boolean} save
     */
    setTriggerGift(TiggerGift, callback)
    {
        this.getUserDataFromDataSource(playerData => {
            if (playerData) {
                playerData.TiggerGift = TiggerGift;
                this.saveUserDataToDataSource(playerData, () => {
                    callback(true);
                });
            }else{
                callback (true);
            }
        });
    }

    /**
     * updateTriggerGiftBuyCnt - 更新触发礼包数据
     * @param {Number} v
     * @param {Function} callback
     * @param {Boolean} save
     */
    async updateTriggerGiftBuyCnt(giftId, buyCnt)
    {
        return new Promise(resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData && playerData.TiggerGift) {
                    for (let trigger of playerData.TiggerGift) {
                        if (trigger.giftId == giftId) {
                            if (trigger.buyCnt == null) trigger.buyCnt = 0
                            trigger.buyCnt += buyCnt;
                        }
                    }
                    this.saveUserDataToDataSource(playerData, () => {
                        resolve (playerData.TiggerGift)
                    });
                }else{
                    resolve (playerData.TiggerGift)
                }
            });
        })
    }


    /**
     * check - 判断触发礼包是否可以购买
     * @param {Number} v
     * @param {Function} callback
     * @param {Boolean} save
     */
    checkTriggerGiftCanBuy(giftId, callback)
    {
        return new Promise( resolve => {
            this.getUserDataFromDataSource(playerData => {
                if (playerData && playerData.TiggerGift) {
                    let canBuy = false
                    for (let trigger of playerData.TiggerGift) {
                        if (trigger.giftId == giftId) {
                            if (trigger.buyCnt != null && trigger.buyCnt >= 1) {
                                canBuy = false
                            }else {
                                if (trigger.time && trigger.endTime) {
                                    if (utils.getTime() / 1000 >= trigger.endTime) {
                                        canBuy = false
                                    }else {
                                        canBuy = true
                                    }
                                }
                            }
                            break;
                        }
                    }
                    resolve (canBuy)
                }else{
                    resolve (false)
                }
            });
        });
    }


}

module.exports = PlayerController;
