const ShortOrder = require ('./fixedController').ShortOrder;
const LongOrder = require ('./fixedController').LongOrder;
const Items = require ('./fixedController').Items;
const categoryFromItemList = require('./fixedController').categoryFromItemList;
const playerController = require('./playerController');
const taskController = require('./taskController');
const Notification = require('./notifController').Notification;
const models = require('./../models');
const utils = require('./../../common/utils');
const gamedata = require('./../../../configs/gamedata.json');
const async = require('async');
var assert = require('assert');
const GameBuyCountConfig = require('./../../designdata/GameBuyCounts');
const Defaults = require('./../../designdata/Defaults');
const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
var _ = require('lodash');
const CONSTANTS = require('./../../common/constants');
class orderController {
    constructor(uuid, multiController, taskController = null) {
        this.m_uuid = uuid ? parseInt(uuid) : 0;
        this.tblShortOrder = 'OrderData';
        this.tblLongOrder = "LongOrderData";
        this.m_ShortOrderData = null;
        this.m_RedisShortOrderString = null;
        this.m_longOrderData = null;
        this.m_RedisLongOrderString = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    static OrderType () {
        return {
            SHORTORDER:1,
            LONGORDER:2
        }
    }

    static ShortOrderType() {
        return {
            NORMAL: 1,
            TIME: 2,
        }
    }

    static LongOrderLoadStatus() {
        return {
            UNLOAD: 0,
            LOADED: 1,
        }
    }

    static ShortOrderRefreshType() {
        return {
            Free: 0,
            CostDiamond: 1,
        }
    }

    // 获取短订单数据
    async getShortOrderFromDataSource() {
        return new Promise (resolve => {
            if (!!this.m_ShortOrderData) {
                resolve (this.m_ShortOrderData);
            }else{
                GameRedisHelper.getHashFieldValue(this.tblShortOrder, this.m_uuid, sdoc => {
                    this.m_RedisShortOrderString = sdoc;
                    var doc = sdoc && validator.isJSON(sdoc) ? JSON.parse(sdoc) : null;
                    this.m_ShortOrderData = doc
                    resolve (this.m_ShortOrderData);
                });
            }
        })
    }

    // 保存短订单数据
    async saveShortOrderToDataSource (shortOrderData) {
        return new Promise (resolve => {
            if (shortOrderData != null) {
                let saveString = JSON.stringify(shortOrderData);
                let shouldSave = false;
                if (this.m_RedisShortOrderString == null || this.m_RedisShortOrderString != saveString) {
                    shouldSave = true;
                }

                if (shouldSave) {
                    this.m_ShortOrderData = shortOrderData;
                    this.multiController.uniqPush(1, this.tblShortOrder + ":" + this.m_uuid, saveString)
                    this.m_RedisShortOrderString = saveString;
                    resolve (true);
                }else {
                    resolve (true);
                }
            }else {
                resolve (true)
            }
        });
    }

    // 获取长订单数据
    async getLongOrderFromDataSource(){
        return new Promise (resolve => {
            if(!!this.m_longOrderData ) {
                resolve (this.m_longOrderData);
            }else{
                GameRedisHelper.getHashFieldValue(this.tblLongOrder, this.m_uuid, sdoc => {
                    this.m_RedisLongOrderString = sdoc;
                    var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
                    this.m_longOrderData = doc
                    resolve (this.m_longOrderData);
                });
            }
        });
    }

    // 保存长订单数据
    async saveLongOrderToDataSource (longOrderData) {
        return new Promise (resolve => {
            if (longOrderData != null) {
                let saveString = JSON.stringify(longOrderData);

                let shouldSave = false;
                if (this.m_RedisLongOrderString == null || this.m_RedisLongOrderString != saveString) {
                    saveString = JSON.stringify(longOrderData)
                    shouldSave = true;
                }
                if (shouldSave) {
                    this.m_longOrderData = longOrderData;
                    this.multiController.uniqPush(1, this.tblLongOrder + ":" + this.m_uuid, saveString)
                    this.m_RedisLongOrderString = saveString;
                    resolve (true);
                }else {
                    resolve (true);
                }
            }else {
                resolve (true);
            }
        });
    }

    //重置订单数据
    async refreshOrderDataInfo (freeRefreshCnt, sOrderCompleteCnt, sTimeOrderCompleteCnt, orderBuyCnt, sOrderCntLimited, longOrderCnt, longOrderBuyCnt)
    {
        let shortOrder = await this.getShortOrderFromDataSource ();
        if (shortOrder != null) {
            shortOrder.freeRefreshCount = freeRefreshCnt;
            shortOrder.sOrderCompleteCount = sOrderCompleteCnt;
            shortOrder.sTimeOrderCompleteCount = sTimeOrderCompleteCnt;
            shortOrder.orderBuyCount = orderBuyCnt;
            shortOrder.sOrderCountLimited = sOrderCntLimited;
            console.log("reset order data info", freeRefreshCnt, sOrderCompleteCnt, sTimeOrderCompleteCnt, orderBuyCnt, sOrderCntLimited)
            await this.saveShortOrderToDataSource(shortOrder);
        }

        let longOrder = await this.getLongOrderFromDataSource () ;
        if (longOrder != null) {
            longOrder.lorderCount  = longOrderCnt;
            longOrder.lorderBuyCount = longOrderBuyCnt;
            await this.saveLongOrderToDataSource(longOrder);
        }
        return true;
    }

    // 获取订单系统的一些数据 购买次数 订单完成上限次数等信息 限时订单生成数目 显示订单生产进度

    async getShortOrderBaseData () {
        return new Promise(async (resolve) => {
            let shortOrder = await this.getShortOrderFromDataSource ();
            if (shortOrder) {
                shortOrder.settingHeroTime = gamedata.ORDER.ShortOrderHeroSettingTime;
                resolve (shortOrder);
            }else {
                let orderModel = models.OrderModel();
                orderModel.orderBuyCount = GameBuyCountConfig.getShortOrderBuyCountMax();
                orderModel.uuid = this.m_uuid;
                orderModel.settingHeroTime = gamedata.ORDER.ShortOrderHeroSettingTime;
                await this.saveShortOrderToDataSource (orderModel);
                resolve (orderModel);
            }
        });
    }

    // 获取短订单内容
    // 判断当前等级对应的订单数
    // 如果是限时订单需要判断订单是否有效 取消过期的限时订单
    // 创建限时订单生产计数

    async getShortOrderData (level) {
        await this.createLimitedShortOrderRefreshData (false);
        let doc = await this.getShortOrderFromDataSource ();
        if (!doc) doc = {}
        let shortOrders = doc.shortOrders;
        if (shortOrders == null) shortOrders = [];
        let orderSize = ShortOrder.getShortOrderUnlockInfo(level, gamedata.ORDER.OrderTypeShortOrder);

        let curOrderSize = shortOrders.length;
        let nextCreateOrderIds = [];
        for (let i = curOrderSize + 1; i <= orderSize; i++) {
            nextCreateOrderIds.push (i);
        }

        nextCreateOrderIds.push.apply(nextCreateOrderIds, this.checkShortOrder(shortOrders));
        curOrderSize = shortOrders.length;

        if (curOrderSize < orderSize && nextCreateOrderIds.length > 0) {
            let orderType = orderController.ShortOrderType().NORMAL;
            let newCreateOrders = await this.createShortOrder (orderSize - curOrderSize, level, orderType, nextCreateOrderIds);
            if (newCreateOrders != null) {
                for (let i in newCreateOrders) {
                    shortOrders.push(newCreateOrders[i]);
                }
            }
            await this.saveShortOrderToDataSource(doc);
            return shortOrders;
        }else{
            return shortOrders;
        }
    }

    // 获取订单物品价值占比
    getContentCateProfit(size) {
        return utils.getRandomFromArray(gamedata.ORDER.OrderContentCateProfitArray[size - 1])
    }

    // 根据道具价值来计算道具数量
    getItemConfigValue(itemid, itemValues) {
        for(var key of itemValues){
            if (key != null && key.itemId != null && key.itemId == itemid) {
                return key.itemConvertValue;
            }
        }
        return gamedata.ORDER.ItemValueRateDefault;
    }

    // 获取道具的售卖价格
    getItemSellPrice(itemid, itemValues) {
        for(var key of itemValues){
            if (key != null && key.itemId != null && key.itemId == itemid) {
                return key.SellPrice;
            }
        }
        return gamedata.ORDER.ItemSellPriceDefault;
    }

    // 生产订单需求内容
    createOrderContentItems(profit, items, itemValues) {
        let profitRate = this.getContentCateProfit(items.length);
        let tempProfit = profit / 100;

        let contents = [];
        let contentAwardTotalUp = 0;
        for (let i in items) {
            let body = {}
            body.id = items[i];
            let value = this.getItemConfigValue(body.id, itemValues);
            body.count = Math.ceil((tempProfit * profitRate[i]) / value);
            contents.push(body)

            //超出价值后就不计算后面的需求道具数量
            contentAwardTotalUp += body.count * value;
            if (contentAwardTotalUp >= profit) {
                return contents;
            }
        }
        return contents;
    }

    // 生产订单奖励数据
    createOrderRewardItem(profit, profitRate, rewardItemId, itemValues, itemRate) {
        let rewards = {}
        let tempProfit = profit * profitRate;
        let goldProfit = tempProfit * itemRate.k / 10;
        let itemProfit = tempProfit * itemRate.v / 10;
        rewards.currency = [Math.ceil(goldProfit / gamedata.ORDER.GoldValueRateDefault), 0, 0];
        rewards.items = [];
        let body = {}
        body.id = rewardItemId;
        let value = this.getItemConfigValue(rewardItemId, itemValues);
        body.count = Math.ceil(itemProfit / value);
        rewards.items.push(body);
        return rewards;
    }

    // 生成一个短订单内容
    async createShortOrder(size, level, orderType, nextCreateOrderIds) {
        console.log("createShortOrder", size, nextCreateOrderIds.length)
        assert(size == nextCreateOrderIds.length, "create order should supply next create order id");
        return new Promise (resolve => {
            ShortOrder.getShortOrderByTypeAndLevel (orderType, level, retData => {
                if (retData != null) {
                    let creatOrders = [];
                    let allQueryItems = [];
                    let curTimestamps = (new Date()).getTime();
                    for (let orderindex = 0; orderindex < size; orderindex++) {
                        let order = {}
                        order.ident = utils.getGlobalUniqueId();
                        order.orderId = curTimestamps + orderindex;
                        order.orderType = orderType;
                        order.orderLevel = level;
                        order.orderIndex = nextCreateOrderIds[orderindex];

                        order.orderMessageId = utils.getRandom(gamedata.ORDER.MaxMessageLength);
                        if (orderType == orderController.ShortOrderType().TIME) {
                            order.orderStartTime = curTimestamps;
                            order.orderTime = retData.LimitedTime;
                        }

                        let cateSize = utils.randomListByWeight(retData.CateInfo, 1)[0];
                        order.items = utils.randomListByWeight(retData.Items, cateSize, true);
                        order.rewarditem = utils.randomListByWeight(retData.RewardItems, 1);
                        let orderValue = retData.ValueInterval[0] + utils.getRandom(retData.ValueInterval[1] - retData.ValueInterval[0]);
                        order.orderValue = orderValue;
                        allQueryItems = allQueryItems.concat(order.items);
                        for (let i in order.rewarditem) {
                            allQueryItems.push(order.rewarditem[i]);
                        }
                        creatOrders.push(order);
                    }
                    Items.getItemsInfoByItemIds(allQueryItems, itemValues => {
                        for (let i in creatOrders) {
                            let order = creatOrders[i];
                            order.content = this.createOrderContentItems(order.orderValue, order.items, itemValues);
                            order.reward = this.createOrderRewardItem(order.orderValue, retData.ProfitRate, order.rewarditem[0], itemValues, utils.getRandomFromArray(retData.RewardProb));
                            order.reward.exp = retData.Exp;

                            if (order.orderType == orderController.ShortOrderType().TIME) {
                                order.extBonus = {}
                                if (retData.ExtBonus.items.length > 0) {
                                    order.extBonus.items = retData.ExtBonus.items;
                                }
                                var extCurrencyFlag = false;
                                for (let n in retData.ExtBonus.currency) {
                                    if (retData.ExtBonus.currency[n] > 0) {
                                        extCurrencyFlag = true;
                                    }
                                }
                                if (extCurrencyFlag) {
                                    order.extBonus.currency = retData.ExtBonus.currency;
                                }
                            }
                            delete order.rewarditem;
                            delete order.items;
                            delete order.orderValue;
                        }
                        resolve (creatOrders);
                    });
                } else {
                    resolve (null);
                }
            });
        })
    }

    checkShortOrder(shortOrders) {
        if (shortOrders == null)
            return [];
        else {
            var curTime = (new Date()).getTime();
            let shortOrderCount = shortOrders.length;
            let nextCreateOrderIds = [];
            for (let i = shortOrderCount - 1; i >= 0; i--) {
                let orderData = shortOrders[i];
                if (orderData.orderType == orderController.ShortOrderType().TIME) {
                    if (curTime - orderData.orderStartTime >= orderData.orderTime * 1000) {
                        nextCreateOrderIds.push (orderData.orderIndex)
                        shortOrderCount--;
                        shortOrders.splice(i, 1);
                    }
                }
            }
            return nextCreateOrderIds;
        }
    }

    getShortOrderTimeType(shortOrders) {
        let shortOrderTimeTypeList = [];
        if (shortOrders != null) {
            var curTime = (new Date()).getTime();
            let shortOrderCount = shortOrders.length;
            for (let i = shortOrderCount - 1; i >= 0; i--) {
                let orderData = shortOrders[i];
                if (orderData.orderType == orderController.ShortOrderType().TIME) {
                    if (curTime - orderData.orderStartTime < orderData.orderTime * 1000) {
                        shortOrderTimeTypeList.push(orderData)
                    }
                }
            }
        }
        return shortOrderTimeTypeList;
    }

    // 更新短订单信息
    async updateShortOrderData(shortOrders) {
        let orders = await this.getShortOrderFromDataSource ()
        if(!orders) { orders = {}}
        orders.shortOrders = shortOrders;
        await this.saveShortOrderToDataSource (orders)
        return true;
    }

    // 创建限时订单刷新数据
    async createLimitedShortOrderRefreshData (refresh) {
        return new Promise ( async resolve => {
            let orders = await this.getShortOrderFromDataSource ();
            if (!orders) {orders = {}}
            let shouldSave = false
            if (orders.sLimitedOrderRefreshCount == null || refresh) {
                shouldSave = true
                let count = utils.getLimitRandom(2, gamedata.ORDER.LimitedOrderRefreshMaxCount);
                orders.sLimitedOrderRefreshCompleteCount = 0;
            }
            await this.saveShortOrderToDataSource (orders)
            resolve (true);
        })
    }

    // 判断订单是否可以购买
    async checkShortOrderHaveBuyTime() {
        let doc = await this.getShortOrderFromDataSource ();
        let canBuy = false, buyCount = 0;
        if (doc && doc.orderBuyCount > 0) {
            canBuy = true;
            buyCount = doc.orderBuyCount;
        }
        if (buyCount > GameBuyCountConfig.getShortOrderBuyCountMax()) {
            buyCount = GameBuyCountConfig.getShortOrderBuyCountMax();
        }
        return [canBuy, buyCount];
    }

    // 判断免费刷新次数
    async checkShortOrderFreeRefreshTime(type, costDiamond) {
        return new Promise( async resolve => {
            let status = 0;
            if (type == orderController.ShortOrderRefreshType().Free) {
                let doc = await this.getShortOrderFromDataSource();
                if (doc == null || doc.freeRefreshCount <= 0) {status = 1;}
                resolve (status);
            } else {
                let player = new playerController(this.m_uuid,this.multiController);
                player.currencyMultiValid([0, costDiamond, 0], diamondRet => {
                    if (!diamondRet) { status = 2;}
                    resolve (status);
                });
            }
        });
    }

    // 补充订单次数
    async supplyOrderTimes(addCount) {
        let doc = await this.getShortOrderFromDataSource ();
        assert (doc && doc.orderBuyCount && doc.sOrderCountLimited, "short order data should not be nil");
        if (doc.orderBuyCount > GameBuyCountConfig.getShortOrderBuyCountMax()) {
            doc.orderBuyCount = GameBuyCountConfig.getShortOrderBuyCountMax();
        }
        doc.orderBuyCount -= 1;
        doc.sOrderCountLimited += addCount;
        await this.saveShortOrderToDataSource (doc);
        return [doc.orderBuyCount, doc.sOrderCountLimited]
    }

    // 增加免费刷新次数
    async addShortOrderFreeRefreshCount(v) {
        let doc = await this.getShortOrderFromDataSource ();
        assert (doc && doc.freeRefreshCount, "short order data should not be nil");
        doc.freeRefreshCount += v;
        await this.saveShortOrderToDataSource (doc);
        return doc.freeRefreshCount;
    }

    // 刷新短订单
    async refreshShortOrder(level) {
        let doc = await this.getShortOrderFromDataSource();
        if (doc == null) doc = {};
        let orderSize = ShortOrder.getShortOrderUnlockInfo(level, gamedata.ORDER.OrderTypeShortOrder);
        let orderType = orderController.ShortOrderType().NORMAL;
        let nextCreateOrderIds = [];
        for (let index = 1; index <= orderSize; index++) {
            nextCreateOrderIds.push (index)
        }
        let newCreateOrders = await this.createShortOrder (orderSize, level, orderType, nextCreateOrderIds);
        await this.updateShortOrderData (newCreateOrders);
        let retData = {};
        retData.shortOrders = newCreateOrders;
        retData.freeRefreshCount = doc.freeRefreshCount;
        return retData;
    }

    // 检测配置墨魂信息
    async checkShortOrderSendStatus(heroId) {
        let status = 0;
        let doc = await this.getShortOrderFromDataSource ()
        if (doc == null || doc.heroId == 0) {
            status = 1;
        } else if (heroId != doc.heroId) {
            status = 2;
        } else {
            if (doc.sOrderCompleteCount >= doc.sOrderCountLimited) {
                status = 3;
            }
        }
        return status;
    }

    // 获取墨魂上次设置为短订单墨魂时间
    getHeroLastSettingTime(heroId, heroSettings) {
        if (heroSettings == null) {
            return 0;
        } else {
            for (let i in heroSettings) {
                if (heroSettings[i].heroId == heroId) {
                    return heroSettings[i].time;
                }
            }
            return 0;
        }
    }

    // 更新墨魂设置时间
    updateHeroLastSettingTime(heroId, heroSettings, time) {
        if (heroSettings == null) {
            heroSettings = [];
            let setting = {};
            setting.heroId = heroId;
            setting.time = time;
            heroSettings.push(setting);
        } else {
            let hasFind = false;
            for (let i in heroSettings) {
                if (heroSettings[i].heroId == heroId) {
                    heroSettings[i].time = time;
                    hasFind = true;
                    break;
                }
            }
            if (!hasFind) {
                let setting = {};
                setting.heroId = heroId;
                setting.time = time;
                heroSettings.push(setting);
            }
        }
    }

    // 设置短订单墨魂
    async shortOrderSettingHero(heroId) {
        let doc = await this.getShortOrderFromDataSource ();
        let retData = {}; retData.status = 0;
        if(!doc) {doc = {}}
        if (heroId == doc.heroId) {
            retData.preHeroId = 0;
            retData.heroId = heroId;
            retData.status = 1;
            return retData;
        } else {
            let lastSettingTime = this.getHeroLastSettingTime(heroId, doc.heroSettings);
            let curTimestamps = (new Date()).getTime();
            if (heroId === 0 || curTimestamps - lastSettingTime > gamedata.ORDER.ShortOrderHeroSettingTime) {
                let heroSettings = doc.heroSettings;
                if (heroSettings == null) heroSettings = [];
                if (doc.heroId != 0) this.updateHeroLastSettingTime(heroId, heroSettings, curTimestamps);
                retData.preHeroId = doc.heroId;
                doc.heroId = heroId;
                doc.heroSettings = heroSettings;
                await this.saveShortOrderToDataSource (doc);
                retData.heroId = heroId;
                retData.heroSettings = heroSettings;
                return retData;
            } else {
                retData.status = 2;
                return retData;
            }
        }
    }

    // 短订单发送
    async sendShortOrder(orderId)  {
        return new Promise (async resolve => {
            let doc = await this.getShortOrderFromDataSource ();
            let retData = {}
            retData.status = 0;

            if(!doc) {doc = {}}
            let shortOrders = doc.shortOrders;
            let sOrderCompleteCount = doc.sOrderCompleteCount;
            let sTimeOrderCompleteCount = doc.sTimeOrderCompleteCount;
            let sLimitedOrderRefreshCount = doc.sLimitedOrderRefreshCount;
            let sLimitedOrderRefreshCompleteCount  = doc.sLimitedOrderRefreshCompleteCount;

            if (sLimitedOrderRefreshCount == null) sLimitedOrderRefreshCount = utils.getLimitRandom(2, gamedata.ORDER.LimitedOrderRefreshMaxCount);
            if (sLimitedOrderRefreshCompleteCount == null)  sLimitedOrderRefreshCompleteCount = 0;

            let sTimeOrderCount = 0;
            let sendOrder = null;
            let orderIndex = 0;
            for (let i in shortOrders) {
                let shortOrder = shortOrders[i];
                if (shortOrder.orderId == orderId) {
                    sendOrder = shortOrder;
                    orderIndex = parseInt(i);
                    break;
                }
            }

            if (sendOrder != null) {
                var curTime = (new Date()).getTime();
                if (sendOrder.orderType == orderController.ShortOrderType().TIME && curTime - sendOrder.orderStartTime >= sendOrder.orderTime * 1000) {
                    retData.status = 3;
                    resolve (retData);
                } else {
                    let player = new playerController(this.m_uuid,this.multiController, this.taskController);
                    player.itemValid(sendOrder.content, async status => {
                        if (status) {
                            shortOrders.splice(orderIndex, 1);
                            // 订单完成次数计数
                            sOrderCompleteCount += 1;
                            // 订单完成都计数
                            sLimitedOrderRefreshCompleteCount += 1;
                            if (sendOrder.orderType == orderController.ShortOrderType().TIME) {
                                sTimeOrderCompleteCount += 1;
                            }
                            for (let j in shortOrders) {
                                if (shortOrders[j].orderType == orderController.ShortOrderType().TIME) {
                                    sTimeOrderCount += 1;
                                }
                            }
                            player.getLevel(level => {
                                let orderSize = ShortOrder.getLimitedShortOrderCount(level, gamedata.ORDER.OrderTypeShortOrder);
                                let newCreateShortType = orderController.ShortOrderType().NORMAL;
                                if (sLimitedOrderRefreshCompleteCount >= sLimitedOrderRefreshCount && sTimeOrderCount < orderSize) {
                                    newCreateShortType = orderController.ShortOrderType().TIME;
                                }

                                ShortOrder.getShortOrderByTypeAndLevel(newCreateShortType, level, async shortOrderLevelData => {
                                    if (shortOrderLevelData == null) {
                                        if (newCreateShortType == orderController.ShortOrderType().TIME) {
                                            newCreateShortType = orderController.ShortOrderType().NORMAL;
                                        }
                                    }else {
                                        if (newCreateShortType == orderController.ShortOrderType().TIME) {
                                            //重置时间
                                            sLimitedOrderRefreshCount = utils.getLimitRandom(2, gamedata.ORDER.LimitedOrderRefreshMaxCount);
                                            sLimitedOrderRefreshCompleteCount = 0;
                                        }
                                    }
                                    let nextCreateOrderIds = [];
                                    nextCreateOrderIds.push (sendOrder.orderIndex);
                                    let newCreateOrders = await this.createShortOrder(1, level, newCreateShortType, nextCreateOrderIds);
                                    assert(newCreateOrders != null, "create short order error !!! check this");
                                    shortOrders.push(newCreateOrders[0]);

                                    doc.shortOrders = shortOrders;
                                    doc.sOrderCompleteCount = sOrderCompleteCount;
                                    doc.sTimeOrderCompleteCount = sTimeOrderCompleteCount;
                                    doc.sLimitedOrderRefreshCount = sLimitedOrderRefreshCount;
                                    doc.sLimitedOrderRefreshCompleteCount = sLimitedOrderRefreshCompleteCount;
                                    await this.saveShortOrderToDataSource (doc);

                                    retData.completeorder = sendOrder;
                                    retData.shortOrders = newCreateOrders;
                                    retData.sOrderCompleteCount = sOrderCompleteCount;
                                    retData.sTimeOrderCompleteCount = sTimeOrderCompleteCount;
                                    retData.sTimeOrderCount = sTimeOrderCount;
                                    resolve (retData);
                                });
                            });
                        } else {
                            retData.status = 2;
                            resolve (retData);
                        }
                    });
                }
            } else {
                retData.status = 1;
                resolve (retData);
            }
        });
    }

    // 获取长订单内容
    async getLongOrderData(level) {
        let longOrder = await this.getLongOrderFromDataSource ()
        if (longOrder == null) {
            longOrder = models.LongOrderModel ();
            let defaultCount = LongOrder.getLongOrderDefaultUnlockCount (orderController.OrderType().LONGORDER);
            for (let index = 1; index <= defaultCount; index++) {
                let grid = models.LongOrderSingleGridModel (index, 1);
                longOrder.lorders.push (grid);
            }
            await this.saveLongOrderToDataSource (longOrder);
        }
        return longOrder;
    }

    // 长订单解锁
    async unlockLongOrder(gridIndex, unlocktype) {
        return new Promise( async resolve =>  {
            let doc = await this.getLongOrderFromDataSource ()
            if(!doc ) { doc = {}}
            var retData = {}
            let gridstatus = 0
            let _longOrdersContents = doc.lorders;
            for (let i in _longOrdersContents) {
                if (_longOrdersContents[i].gridIndex == gridIndex) {
                    gridstatus = _longOrdersContents[i].gridStatus;
                    break;
                }
            }

            if (gridstatus == 1) {
                retData.status = 1;  //订单已解锁
                resolve (retData);
            }else {
                ShortOrder.getLongOrderUnlockInfo(gamedata.ORDER.OrderTypeLongOrder, gridIndex, async unlockinfo => {
                    var player = new playerController(this.m_uuid, this.multiController, this.taskController);
                    player.getLevel(async level => {
                        let canUnlock = true;
                        if (unlocktype === 0) {
                            if (level < unlockinfo.UnlockLevel) {
                                canUnlock = false;
                            }
                        }

                        if (canUnlock) {
                            var chunks = unlockinfo.UnlockCost.split('-');
                            let costData = categoryFromItemList(utils.getItemArraySplitTwice(chunks[unlocktype], '|', ','));
                            player.currencyMultiValid(costData.currency, currencyRet => {
                                if (currencyRet) {
                                    player.itemValid(costData.items, itemRet => {
                                        if (itemRet) {
                                            player.costCurrencyMulti(costData.currency, currency => {
                                                retData.currency = currency;
                                                player.costItem(costData.items, async (_) => {
                                                    retData.itemCost = costData.items;
                                                    retData.status = 0;
                                                    let find = false;
                                                    for (let i in _longOrdersContents) {
                                                        if (_longOrdersContents[i].gridIndex == gridIndex) {
                                                            _longOrdersContents[i].gridStatus = 1;
                                                            retData.unlockGrid = _longOrdersContents[i];
                                                            find = true;
                                                        }
                                                    }
                                                    if (!find) {
                                                        let grid = models.LongOrderSingleGridModel (gridIndex, 1);
                                                        _longOrdersContents.push (grid);
                                                        retData.unlockGrid = grid;
                                                    }
                                                    await this.saveLongOrderToDataSource (doc);
                                                    resolve (retData);
                                                });
                                            });
                                        } else {
                                            retData.status = 4;
                                            resolve (retData);
                                        }
                                    });
                                } else {
                                    retData.status = 3;
                                    resolve (retData);
                                }
                            });
                        }else {
                            retData.status = 2; //订单解锁等级未达到
                            resolve (retData);
                        }
                    });
                });
            }
        });
    }

    checkLoadItemValid (item, orderContent) {
        for (let grid of orderContent) {
            if (grid.content.count != null && grid.content.id != null) {
                if (grid.content.count > 99) {
                    return false;
                }else {
                    let isExist = false
                    for (let s of item) {
                        if (s.id == grid.content.id) {
                            s.count += grid.content.count;
                            isExist = true
                        }
                    }
                    if (!isExist) {
                        item.push ({id:grid.content.id, count:grid.content.count})
                    }
                }
            }
        }
        return true
    }

    // 长订单装载
    async longOrderLoadGoods(clsPlayer, orderContent) {
        return new Promise(async resolve => {
            let doc = await this.getLongOrderFromDataSource ();
            let retData = {}; retData.status = 0;
            if (doc == null) {
                retData.status = 6;
                resolve (retData);
            }else {
                let _longOrders = doc;
                let _longOrdersContents = _longOrders.lorders;
                let curTime = (new Date()).getTime();
                if (curTime < _longOrders.lorderStartTime) {
                    retData.status = 5;  // 长订单现在不可用
                    resolve (retData);
                }else {
                    if (_longOrders.lorderCount <= 0) {
                        retData.status = 4; // 无装载次数
                        resolve (retData);
                    }else {
                        let isGridValid = true;
                        for (let content of orderContent) {
                            for (let _content of _longOrdersContents) {
                                let findGrid = false;
                                if (content.gridIndex == _content.gridIndex) {
                                    findGrid = true;
                                    if (_content.gridStatus === 0) {isGridValid = false;}
                                    break;
                                }
                                if (!findGrid || !isGridValid) {
                                    break;
                                }
                            }
                        }

                        if (!isGridValid) {
                            retData.status = 3; // 格子未解锁
                            resolve (retData);
                        }else {
                            let item = [], itemUsed = [];
                            let itemValid = this.checkLoadItemValid (item, orderContent)
                            if (!itemValid) {
                                retData.status = 2; // 单个格子装载超过上限
                                resolve (retData);
                            }else {
                                this.checkLoadItemValid (itemUsed, _longOrdersContents)
                                let costItem = _.cloneDeep(item);
                                clsPlayer.itemValidRestoreUsed (costItem, itemUsed, valid => {
                                    if (!valid) {
                                        retData.status = 1; // 道具数量不足
                                        resolve (retData);
                                    }else {
                                        let taskRecord = false;
                                        clsPlayer.addItem (itemUsed, async _ => {
                                            clsPlayer.costItem (item, async _ => {
                                                let _longOrders = doc;
                                                let _longOrdersContents = _longOrders.lorders;
                                                for (let i in _longOrdersContents) {
                                                    _longOrdersContents[i].content = {};
                                                    for (let j in orderContent) {
                                                        if (_longOrdersContents[i].gridIndex == orderContent[j].gridIndex) {
                                                            _longOrdersContents[i].content = orderContent[j].content
                                                        }
                                                    }
                                                }
                                                await this.saveLongOrderToDataSource (doc);
                                                retData.costItem = item;
                                                retData.addItem = itemUsed;
                                                resolve (retData);
                                            },taskRecord);
                                        },taskRecord);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });
    }

    async parserLongOrderContent (longOrderContent) {
        let itemIds = [];
        let totalItemsLis = {};
        let taskParams = [];
        for (let i in longOrderContent.lorders) {
            let content = longOrderContent.lorders[i].content
            if (itemIds.indexOf(content.id) === -1) {
                itemIds.push(content.id);
            }
            if (totalItemsLis[content.id] != null) {
                totalItemsLis[content.id] += content.count;
            } else {
                totalItemsLis[content.id] = content.count;
            }
            taskParams.push({params:[content.id], num : content.count})
        }
        return {itemIds:itemIds, itemsList:totalItemsLis, taskParams};
    }

    //获取当前订单档位的价值
    async getLongOrderTotalValue (itemIds, totalItemsLis) {
        return new Promise (resolve => {
            if (itemIds != null && totalItemsLis != null) {
                Items.getItemsSellPrices(itemIds, itemValues => {
                    let totalValues = 0
                    for (let id of itemIds) {
                        let value = this.getItemSellPrice(id, itemValues);
                        let count = totalItemsLis[id];
                        if (count != null) {
                            totalValues += value * count;
                        }
                    }
                    resolve (totalValues);
                });
            }else {
                resolve (0)
            }
        });
    }

    //获取当前订单奖励价值
    async getLongOrderTotalRewardValue (itemIds, totalItemsLis) {
        return new Promise (resolve => {
            if (itemIds != null && totalItemsLis != null) {
                Items.getItemsInfoByItemIds(itemIds, itemValues => {
                    let totalValues = 0
                    for (let id of itemIds) {
                        let value = this.getItemConfigValue(id, itemValues);
                        let count = totalItemsLis[id];
                        if (count != null) {
                            totalValues += value * count;
                        }
                    }
                    resolve (totalValues);
                });
            }else {
                resolve (0);
            }
        });
    }

    async createLongOrderAward (baseValue, longOrderRewardInfo) {
        return new Promise (async resolve => {
            let needTypeList = utils.splitToKVHashArray (longOrderRewardInfo.BaseTime, '|', ',');
            let maxTypeList = utils.splitToKVHashArray (longOrderRewardInfo.MaxTime, '|', ',');
            let rateProfit = utils.splitToIntArray (longOrderRewardInfo.RateProfit, ',');
            let rateProb = utils.splitToIntArray (longOrderRewardInfo.RateProb, ',');
            let baseAward = utils.splitToKVHashArray (longOrderRewardInfo.BaseCurrency, '|', ',');

            let randLis = [];
            for (let i = 0; i < rateProb.length; i++) {
                randLis.push ({k:i + 1, v:rateProb[i]});
            }
            let randLevel = utils.randomListByWeight (randLis, 1);
            let rate = parseInt(randLevel[0]), rateValue = rateProfit[rate - 1];
            let maxValue = Math.floor (baseValue * (rateValue / 100));
            let rewardPoolId = longOrderRewardInfo.RewardPool;
            let calcAwardData = await this.calcLongOrderAwardList (maxValue, needTypeList, maxTypeList, rewardPoolId);
            let awardItems = calcAwardData.awardItems;
            let leftAwardValue = calcAwardData.leftAwardValue;
            for (let i in baseAward) {awardItems.push ({id:baseAward[i].k, count:baseAward[i].v})}
            if (leftAwardValue > 0) {awardItems.push ({id:410001, count:leftAwardValue * gamedata.ORDER.ItemValueRateDefault})}

            resolve ({poolId:rewardPoolId, award:categoryFromItemList(awardItems), profileLevel:rate});
        });
    }


    async getTargetLongOrderAwardByType (rewardPoolList, type, count) {
        let array = [];
        for (let i in rewardPoolList) {
            if (type == 0 || type == null || rewardPoolList[i].RewardType == type) {
                array.push ({k:i, v:rewardPoolList[i].Prob})
            }
        }
        let random = utils.randomListByWeight (array, count);
        let resultReward = [];
        for (let i in random) {
            resultReward.push (rewardPoolList[random[i]])
        }
        return resultReward;
    }

    // 根据获取到的最大价值和需求的必须奖励类型次数 和 最大次数来生成奖励
    // 先生成基础必须的奖励 再根据剩余价值来计算余下可随机的奖励
    async calcLongOrderAwardList (maxValue, needTypeList, maxTypeList, rewardPoolId) {
        return new Promise (async resolve => {
            let rewardPoolList = LongOrder.getLongOrderRewardByLevel (rewardPoolId);
            let maxAwardTypeCount = {}
            for (let max of maxTypeList) {
                let count = max.v, type = max.k;
                if (count != 0) {
                    if (maxAwardTypeCount[type] == null) maxAwardTypeCount[type] = count;
                    else maxAwardTypeCount[type] += count;
                }
                if (maxAwardTypeCount[type] === 0) maxAwardTypeCount[type] = null;
            }

            let awardTotalValue = 0
            let awardItems = [];
            for (let need of needTypeList) {
                let count = need.v, type = need.k;
                let targetAwards = await this.getTargetLongOrderAwardByType (rewardPoolList, type, count)
                if (targetAwards != null && targetAwards.length > 0) {
                    for (let award of targetAwards) {
                        awardTotalValue += award.Value;
                        if (maxAwardTypeCount[type] != null) maxAwardTypeCount[type] -= 1;
                        awardItems.push ({id:award.Content, count:award.Count});
                        if (awardTotalValue >= maxValue) break;
                    }
                }
            }

            let leftAwardValue = maxValue - awardTotalValue;
            while (leftAwardValue) {
                let leftRewardList = LongOrder.getLongOrderRewardLTLeftRewardValue (rewardPoolId, leftAwardValue)
                for (let i = 0; i < leftRewardList.length; i++) {
                    let awardType = leftRewardList[i].RewardType;
                    if (maxAwardTypeCount[awardType] != null && maxAwardTypeCount[awardType] <= 0) {
                        leftRewardList.splice(i, 1);
                        i--;
                    }
                }

                if (leftRewardList.length <= 0) {
                    break;
                }else {
                    let randAwardList = await this.getTargetLongOrderAwardByType (leftRewardList, 0, 1);
                    let randAward = randAwardList[0];
                    if (maxAwardTypeCount[randAward.RewardType] != null) maxAwardTypeCount[randAward.RewardType] -= 1;
                    leftAwardValue -= randAward.Value;
                    awardItems.push ({id:randAward.Content, count:randAward.Count});
                }
            }
            resolve ({awardItems:awardItems,leftAwardValue:leftAwardValue});
        });
    }

    // 长订单领取奖励
    async sendLongOrder(level) {
        let doc = await this.getLongOrderFromDataSource ();
        let retData = {};
        if (doc == null) {
            retData.status = 1; //无订单信息
            return retData;
        }else {
            let curTime = (new Date()).getTime();
            if (curTime < doc.lorderStartTime) {
                retData.status = 3; //订单还未开始
                return retData;
            }else {
                let parsedContent = await this.parserLongOrderContent (doc);
                let levelPrice = await this.getLongOrderTotalValue (parsedContent.itemIds, parsedContent.itemsList);
                let rewardConfig = LongOrder.getLongOrderRewardLevelInfo (levelPrice);
                if (rewardConfig == null) {
                    retData.status = 2; //订单价值未达到最低要求
                    return retData;
                }else {
                    let rewardPrice = await this.getLongOrderTotalRewardValue(parsedContent.itemIds, parsedContent.itemsList);
                    let calcReward = await this.createLongOrderAward (rewardPrice, rewardConfig);
                    let longOrderReward = calcReward.award;
                    let _longOderReward = {}
                    // 长订单奖励经验 根据订单档位来计算
                    _longOderReward.exp  = rewardConfig.RewardExp;
                    if (longOrderReward.currency) _longOderReward.currency = longOrderReward.currency;
                    if (longOrderReward.items) _longOderReward.items = longOrderReward.items;
                    _longOderReward.level = rewardConfig.LevelId;
                    _longOderReward.profileLevel = calcReward.profileLevel;
                    doc.lorderReward = _longOderReward;
                    doc.lorderCount -= 1;
                    doc.lorderStatus = 1;
                    let curTime = (new Date()).getTime();
                    doc.lorderStartTime = curTime + gamedata.ORDER.LongOrderWaitTime;
                    retData.lorderReward = _longOderReward;
                    retData.lorderStartTime = doc.lorderStartTime;
                    retData.status = 0;
                    retData.taskParams = parsedContent.taskParams;
                    
                    await this.saveLongOrderToDataSource (doc);
                    return retData;
                }
            }
        }
    }

    // 长订单领取奖励
    async longOrderReward() {
        return new Promise( async resolve => {
            let doc = await this.getLongOrderFromDataSource ();
            let retData = {};
            if (doc == null) {
                retData.status = 1;
                resolve (retData);
            } else {
                var _longOrders = doc;
                var curTime = (new Date()).getTime();
                if (curTime < _longOrders.lorderStartTime) {
                    retData.status = 3; //订单不可用
                    resolve (retData);
                } else {
                    if (_longOrders.lorderStatus == null || _longOrders.lorderStatus === 0) {
                        retData.status = 2; //未发送
                        resolve (retData);
                    }else {
                        retData.lorderReward = Object.assign({}, _longOrders.lorderReward);
                        retData.status = 0;
                        for (let i in _longOrders.lorders) {
                            _longOrders.lorders[i].content = {};
                        }
                        _longOrders.lorderReward = {}
                        _longOrders.lorderStatus = 0;
                        await this.saveLongOrderToDataSource (_longOrders);
                        resolve (retData);
                    }
                }
            }
        });
    }

    // 长订单加速时间
    async LongOrderSpeedUp() {
        return new Promise (async resolve => {
            let doc = await this.getLongOrderFromDataSource ();
            let retData = {};
            if (doc == null) {
                retData.status = 1;
                resolve (retData);
            } else {
                var _longOrders = doc;
                var curTime = (new Date()).getTime();
                if (curTime >= _longOrders.lorderStartTime) {
                    retData.status = 2;
                    resolve (retData);
                } else {
                    let costDiamond = utils.GetSpeedUpCostByLeftTime((_longOrders.lorderStartTime - curTime) / 1000);
                    let player = new playerController(this.m_uuid, this.multiController, this.taskController);
                    player.currencyMultiValid([0, costDiamond, 0], diamondRet => {
                        if (!diamondRet) {
                            retData.status = 3;
                            resolve (retData);
                        } else {
                            _longOrders.lorderStartTime = curTime;
                            player.costCurrencyMulti([0, costDiamond, 0], async newCurrency => {
                                await this.saveLongOrderToDataSource (doc)
                                retData.lorderStartTime = curTime;
                                retData.costDiamond = costDiamond;
                                retData.status = 0;
                                retData.currency = newCurrency;
                                resolve (retData);
                            });
                        }
                    });
                }
            }
        });
    }

    // 长订单补充购买次数
    async getLongOrderBuyCount () {
        let doc = await this.getLongOrderFromDataSource();
        if (doc == null || doc.lorderBuyCount == null) {
            return 0;
        } else {
            return doc.lorderBuyCount;
        }
    }

    async setLongOrderBuyCountAndCnt (buyCnt, cnt) {
        let doc = await this.getLongOrderFromDataSource();
        if (doc == null) doc = {}
        if (doc.lorderBuyCount == null) doc.lorderBuyCount = 0;
        if (doc.lorderCount == null) doc.lorderCount = 0;
        doc.lorderBuyCount += buyCnt;
        doc.lorderCount += cnt
        await this.saveLongOrderToDataSource(doc);
        return {status:0, lorderBuyCount:doc.lorderBuyCount, lorderCount:doc.lorderCount};
    }
}

module.exports = orderController;
