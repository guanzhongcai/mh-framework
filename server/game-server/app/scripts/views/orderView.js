const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const GameMarketConfig = require('./../../designdata/GameMarket').GameMarketConfig;
const GameBuyCountConfig = require('./../../designdata/GameBuyCounts');
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const soulController = require('./../controllers/soulController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const orderController = require('./../controllers/orderController');
const itemController = require('./../controllers/itemController');
const taskController = require('./../controllers/taskController');
const skillController = require('./../controllers/skillController');
const DefaultConfig = require('./../../designdata/Defaults');
const utils = require('./../../common/utils');
const categoryFromItemList = require ('./../controllers/fixedController').categoryFromItemList;
const async = require('async')
var assert = require('assert');
const CONSTANTS = require('./../../common/constants');
/**
 * GetOrderInfo - 获取订单数据
 * @param {*} request {}
 * @param {*} response
 */
async function GetOrderInfo(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let order = new orderController (request.body.uuid, request.multiController, request.taskController);
    let shortOrderBaseData = await order.getShortOrderBaseData ();
    respData.freeRefreshCount = shortOrderBaseData.freeRefreshCount;
    respData.heroId = shortOrderBaseData.heroId;
    respData.sOrderCompleteCount = shortOrderBaseData.sOrderCompleteCount;
    respData.sTimeOrderCompleteCount = shortOrderBaseData.sTimeOrderCompleteCount;
    respData.orderBuyCount = shortOrderBaseData.orderBuyCount;
    respData.sOrderCountLimited = shortOrderBaseData.sOrderCountLimited;
    respData.heroSettings = shortOrderBaseData.heroSettings;
    respData.settingHeroTime = shortOrderBaseData.settingHeroTime;
    let player = new playerController(request.body.uuid, request.multiController, request.taskController);
    player.getLevel (async level => {
        respData.shortOrders = await order.getShortOrderData (level);
        respData.longOrders = await order.getLongOrderData (level);
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}

/**
 * GetShortOrderInfo - 获取短订单信息
 * @param {*} request {}
 * @param {*} response
 */

async function GetShortOrderInfo(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.getLevel (async level => {
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        let shortOrders = await order.getShortOrderData (level);
        respData.shortOrders = shortOrders;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}

/**
 * GetLongOrderInfo - 获取长订单信息
 * @param {*} request
 * @param {*} response
 */
async function GetLongOrderInfo(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
    player.getLevel (async level => {
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        respData.longOrders = await order.getLongOrderData (level);;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}
/**
 * SupplyOrderTimes - 补充订单次数 扣除固定独玉
 * @param {*} request {}
 * @param {*} response
 */
async function SupplyOrderTimes(request, response)
{
    // var COST_DIAMOND = 60;
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let order = new orderController (request.body.uuid,request.multiController, request.taskController);
    let canBuy = false, buyCount = 0;
    [canBuy, buyCount] = await order.checkShortOrderHaveBuyTime ();
    if (canBuy) {
        var GameBuyData = GameBuyCountConfig.getShortOrderBuyCostAndValue(GameBuyCountConfig.getShortOrderBuyCountMax() - buyCount + 1);
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        player.currencyMultiValid(GameBuyData.Cost.currency, async diamondRet => {
            if (diamondRet) {
                let orderBuyCount = 0, sOrderCountLimited = 0;
                [orderBuyCount, sOrderCountLimited] = await order.supplyOrderTimes (GameBuyData.Value);
                respData.costDiamond = GameBuyData.Cost.currency;
                respData.sOrderCountLimited = sOrderCountLimited;
                respData.orderBuyCount = orderBuyCount;
                player.costCurrencyMulti(GameBuyData.Cost.currency, async newCurrency => {
                    respData.currency = newCurrency;
                    request.multiController.save(async function(err,data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
                        respData.taskEventData = [];
                        respData.taskList = [];
                        try {
                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                            respData.taskEventData = taskEventData;
                            respData.taskList = taskList;
                        }catch (e) {
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
                        protocol.responseSend(response, respData);
                    })
                    request.logServer.logCurrency(request.body.uuid,request.Const.actions.addGoodsTimes,request.Const.functions.oddGoodsHouse,1,GameBuyData.Cost.currency, newCurrency)
                });
            } else {
                respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    }else {
        respData.code = ERRCODES().ORDER_CANNOT_BUY_ORDERTIME;
        protocol.responseSend(response, respData);
    }
}


/**
 * SupplyLongOrderTimes - 补充长订单次数 扣除固定独玉
 * @param {*} request {}
 * @param {*} response
 */
async function SupplyLongOrderTimes(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let order = new orderController(request.body.uuid,request.multiController, request.taskController);
    let buyCount = await order.getLongOrderBuyCount();
    GameBuyCounts.getBuyCountCostConfig(7, buyCount+1, CostData => {
        let player = new playerController(request.body.uuid, request.multiController, request.taskController);
        player.currencyMultiValid(CostData.currency, currencyRet => {
            if (currencyRet) {
                player.itemValid(CostData.items, itemValid => {
                    if (itemValid) {
                        // taskController.getTaskDataFromSource(request.body.uuid, async TaskData => {
                            player.costCurrencyMulti(CostData.currency, newCurrency => {
                                player.costItem(CostData.items, async() => {
                                    let addSuccessRet = await order.setLongOrderBuyCountAndCnt(1, 1);
                                    if (addSuccessRet.status == 0) {
                                        // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], async taskEventData => {
                                        //     respData.taskEventData = taskEventData;
                                            if (CostData.items.length > 0) {respData.costItem = CostData.items;}
                                            respData.currency = newCurrency;
                                            respData.lorderBuyCount = addSuccessRet.lorderBuyCount;
                                            respData.lorderCount = addSuccessRet.lorderCount;
                                            // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                request.multiController.save(async function(err,data){
                                                    if(err){
                                                        respData.code = ERRCODES().FAILED;
                                                        return  protocol.responseSend(response, respData);
                                                    }
                                                    respData.taskEventData = [];
                                                    respData.taskList = [];
                                                    try {
                                                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                        respData.taskEventData = taskEventData;
                                                        respData.taskList = taskList;
                                                    }catch (e) {
                                                        respData.code = ERRCODES().FAILED;
                                                        return  protocol.responseSend(response, respData);
                                                    }
                                                    protocol.responseSend(response, respData);
                                                })
                                                async.parallel({
                                                    "itemLog":async function (cb) {
                                                        if (CostData.items.length > 0) {await request.logServer.itemLog([request.body.uuid, request.Const.actions.longOrderBuyTime,CostData.items,[], request.Const.functions.pureConversation])}
                                                        cb(1)
                                                    },
                                                    "logCurrency": async function(cb){
                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.longOrderBuyTime,request.Const.functions.pureConversation,1,CostData.currency,currencyRet)
                                                        cb(1)
                                                    },
                                                    "SoulLog": async function(cb){
                                                        await request.logServer.SoulLog({uuid:request.body.uuid, actionId: request.Const.actions.soulBuy})
                                                        cb(1)
                                                    }
                                                },function (err,results) {
                                                })
                                            // });
                                        // }, TaskData);
                                    }else {
                                        respData.code = ERRCODES().FAILED;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            });

                        // });
                    } else {
                        // 道具不足
                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 货币不足
                respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    });
}

/**
 * RefreshShortOrder - 短订单刷新
 * @param {*} request {type}
 * @param {*} response
 */
async function RefreshShortOrder(request, response)
{
    var COST_DIAMOND = DefaultConfig.getShortOrderRefPrice(); //100;
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.type != 0 && request.body.type != 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else {
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        let refreshType = request.body.type;
        let status = await order.checkShortOrderFreeRefreshTime (refreshType, COST_DIAMOND);
        if (status == 0) {
            let player = new playerController(request.body.uuid,request.multiController, request.taskController);
            player.getLevel (async level => {
                let retData = await order.refreshShortOrder (level);
                respData.freeRefreshCount = retData.freeRefreshCount;
                respData.shortOrders = retData.shortOrders;
    
                //TODO 短订单刷新
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.refreshShortOrd,[{params:[0]}]);
                
                if (refreshType === 0) {
                    let freeCount = await order.addShortOrderFreeRefreshCount (-1);
                    respData.freeRefreshCount = freeCount;
                    request.multiController.save(async function(err,data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            return protocol.responseSend(response, respData);
                        }
                        respData.taskEventData = [];
                        respData.taskList = [];
                        try {
                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                            respData.taskEventData = taskEventData;
                            respData.taskList = taskList;
                        }catch (e) {
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
                        protocol.responseSend(response, respData);
                    })
                    await request.logServer.GoodsHouseLog({uuid:request.body.uuid,actionId: request.Const.actions.refreshGoods})
                }else {
                    player.costCurrencyMulti([0,COST_DIAMOND,0],  newCurrency => {
                        respData.currency = newCurrency;
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            respData.taskEventData = [];
                            respData.taskList = [];
                            try {
                                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                respData.taskEventData = taskEventData;
                                respData.taskList = taskList;
                            }catch (e) {
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            protocol.responseSend(response, respData);
                        })
                        async.parallel({
                            "GoodsHouseLog":async function (cb) {
                                await request.logServer.GoodsHouseLog({uuid:request.body.uuid,actionId: request.Const.actions.refreshGoods})
                                cb(1)
                            },
                            "logCurrency": async function(cb){
                                await request.logServer.logCurrency(request.body.uuid,request.Const.actions.refreshGoods,request.Const.functions.oddGoodsHouse,1,[0,COST_DIAMOND,0], newCurrency)
                                cb(1)
                            }
                        },function (err,results) {
                        })
                    });
                }
            });
        }else if (status == 1){
            respData.code = ERRCODES().ORDER_NOT_HAVE_FREEREFRESH_TIME;
            protocol.responseSend(response, respData);
        }else{
            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }
    }
}

/**
 * SetShortOrderHero - 设置短订单墨魂
 * @param {*} request {heroId}
 * @param {*} response
 */
async function SetShortOrderHero(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let order = new orderController (request.body.uuid,request.multiController, request.taskController);
    if (request.body.heroId < 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else{
        let checkHero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
        checkHero.checkStatValid(async (statRet, status) => {
            if (request.body.heroId == 0) statRet = heroController.CHECKSTATS ().VALID;
            if (statRet == heroController.CHECKSTATS ().VALID) {
                let retData = await order.shortOrderSettingHero (request.body.heroId);
                if (retData.status == 0 || retData.status == 1) {
                    respData.heroId = retData.heroId;
                    respData.heroSettings = retData.heroSettings;
                    let lastHeroId = retData.preHeroId;
                    respData.updateStats = [];
                    let workStats = {};
                    if (respData.heroId != 0) {
                        let newWorkStat = heroController.WORKSTATS().WORKING;
                        workStats[respData.heroId] = newWorkStat;
                    }
                    if (lastHeroId != 0) {
                        let newWorkStat = heroController.WORKSTATS().IDLE;
                        workStats[lastHeroId] = newWorkStat;
                    }
                    let hero = new heroController(request.body.uuid, lastHeroId,request.multiController, request.taskController);
                    hero.setWorkStatBatch (workStats, updateStats => {
                        respData.updateStats = updateStats;
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            respData.taskEventData = [];
                            respData.taskList = [];
                            try {
                                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                respData.taskEventData = taskEventData;
                                respData.taskList = taskList;
                            }catch (e) {
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            protocol.responseSend(response, respData);
                        })
                    });
                }else{
                    respData.code = ERRCODES().ORDER_SETHERO_TIME_INVALID;
                    protocol.responseSend(response, respData);
                }
            }else if (statRet == heroController.CHECKSTATS ().LOSS) {
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }else if (statRet == heroController.CHECKSTATS ().VAGRANTNESS) {
                respData.code = ERRCODES().HERO_NOT_IN_HOUSE;
                protocol.responseSend(response, respData);
            }else{
                respData.code = ERRCODES().HERO_CANNOT_WORK;
                respData.workStat = status;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * SendShortOrder - 发送短订单
 * @param {*} request  {heroId  orderId}
 * @param {*} response
 */

function getTaskItemParamGroup(itemLis)
{
    var paramGroup = [];
    for (let i in itemLis) {
        paramGroup.push({
            params: [itemLis[i].id],
            num: itemLis[i].count
        });
    }
    return paramGroup;
}

function getTaskParamGroup(itemLis)
{
    var paramGroup = [];
    for (let i in itemLis) {
        paramGroup.push({
            params: [itemLis[i].id],
            num: 1
        });
    }
    return paramGroup;
}




async function SendShortOrder(request, response)
{
    // 任务相关
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId <= 0 || request.body.orderId <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else{
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        let status = await order.checkShortOrderSendStatus (request.body.heroId)
        if (status == 0) {
            let retData =  await order.sendShortOrder (request.body.orderId);
            if (retData.status == 0) {
                await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.oddGoodsHouse]);
                let player = new playerController(request.body.uuid, request.multiController, request.taskController);
                let hero = new heroController(request.body.uuid, request.body.heroId, request.multiController, request.taskController);

                let completeorder = retData.completeorder;
                respData.costitems = completeorder.content;
                respData.items  = completeorder.reward.items;
                respData.shortOrders = retData.shortOrders;
                respData.sOrderCompleteCount = retData.sOrderCompleteCount;
                respData.sTimeOrderCompleteCount = retData.sTimeOrderCompleteCount;

                let skillEffectData = await skillController.calcHeroActiveSkillEffects(hero, skillController.EFFECTSYS().SHORTORDER, request.body.heroId, null);
                if (skillEffectData.effBuffData != null) {
                    let _addItemPercent = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDSHORTORDERITEM];
                    if (_addItemPercent != null && _addItemPercent.value != null) {
                        let addPercent = _addItemPercent.value / 10000;
                        for (let item of completeorder.reward.items) {
                            item.count = item.count + utils.refactorFloor(item.count * addPercent);
                        }
                        console.log("---- skill active add short order items ", request.body.heroId, addPercent)
                    }

                    _addItemPercent = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDSHORTCURRENCY];
                    if (_addItemPercent != null && _addItemPercent.value != null) {
                        let addPercent = _addItemPercent.value / 10000;
                        let rewardCurrency = completeorder.reward.currency;
                        for (let i = 0; i < 3; i++) {
                            rewardCurrency[i] = rewardCurrency[i] + utils.refactorFloor(rewardCurrency[i] * addPercent);
                        }
                        console.log("---- skill active add short order currency ", request.body.heroId, addPercent)
                    }
                }

                // 合并extBonus
                if (completeorder.extBonus) {
                    // items
                    if (completeorder.extBonus.items && completeorder.extBonus.items.length > 0) {
                        respData.items = respData.items.concat(completeorder.extBonus.items);
                    }
                    // currency
                    if (completeorder.extBonus.currency) {
                        completeorder.reward.currency.forEach((item, index, input) => { input[index] += completeorder.extBonus.currency[index]; });
                    }
                }

                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                    player.costItem (respData.costitems, _ => {
                        player.addItem (respData.items, _=> {
                            player.addCurrencyMulti (completeorder.reward.currency, newCurrency => {
                                respData.currency = newCurrency;
                                player.addExp (completeorder.reward.exp, levelData =>{
                                    respData.userLevelData = levelData;
                                    let totalReward = [];
                                    if (levelData.levelUpAwardItems != null) {
                                        for (let i in levelData.levelUpAwardItems) {
                                            totalReward.push (levelData.levelUpAwardItems[i]);
                                        }
                                    }
                                    let awards = categoryFromItemList(totalReward);
                                    player.addItem (awards.items, itemRet => {
                                        player.addCurrencyMulti (awards.currency, currencyRet => {
                                            respData.currency = currencyRet;
                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItemFromShortOrder,getTaskItemParamGroup(respData.items));
                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CompleteShortOrder,getTaskParamGroup(respData.items));
                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CompleteShortOrder_CostItem,getTaskParamGroup(respData.costitems));
                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.ShortOrder_CostItem,getTaskParamGroup(respData.costitems));
                                            if(retData.shortOrders.orderType === orderController.ShortOrderType().TIME){
                                                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Complete_Urgent_ShortOrder,[{params:[0]}]);
    
                                            }

           
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                respData.taskEventData = [];
                                                respData.taskList = [];
                                                try {
                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                    respData.taskEventData = taskEventData;
                                                    respData.taskList = taskList;
                                                }catch (e) {
                                                    respData.code = ERRCODES().FAILED;
                                                    return  protocol.responseSend(response, respData);
                                                }
                                                protocol.responseSend(response, respData);
                                            })
                                            async.parallel({
                                                "GoodsHouseLog":async function (cb) {
                                                    await request.logServer.itemLogBindMohun({uuid:request.body.uuid,
                                                        actionId: request.Const.actions.createShortOrder,
                                                        cost:respData.costitems, gain:respData.shortOrders[0].reward.items,
                                                        heroId: request.body.heroId,
                                                        functionId: request.Const.functions.oddGoodsHouse
                                                    });
                                                    cb(1)
                                                },
                                                "logCurrency": async function(cb){
                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.createShortOrder,request.Const.functions.oddGoodsHouse,0,awards.currency, newCurrency)
                                                    cb(1)
                                                },
                                                "logCurrency1": async function(cb){
                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.createShortOrder,request.Const.functions.oddGoodsHouse,1,respData.shortOrders[0].reward.currency, newCurrency)
                                                    cb(1)
                                                },
                                                "addLevel": async function(cb){
                                                    await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.createShortOrder,functionId: request.Const.functions.oddGoodsHouse}))
                                                    cb(1)
                                                }
                                            },function (err,results) {
                                            })
                  
                                        }, CONSTANTS.TASK_TRIGGER_TYPE.GetItemFromShortOrder);
                                    }, );
                                });
                            });
                        });
                    });
                // });
            }else if (retData.status == 1){
                respData.code = ERRCODES().ORDER_NOT_EXIST;
                protocol.responseSend(response, respData);
            }else if (retData.status == 2){
                respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }else if (retData.status == 3){
                respData.code = ERRCODES().ORDER_TIMELIMITED_INVALID;
                protocol.responseSend(response, respData);
            }else{
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        }else if (status == 1) {
            respData.code = ERRCODES().ORDER_NOT_SET_HERO;
            protocol.responseSend(response, respData);
        }else if (status == 2){
            respData.code = ERRCODES().ORDER_HERO_NOT_MATCH;
            protocol.responseSend(response, respData);
        }else{
            respData.code = ERRCODES().ORDER_COMPLETE_REACH_MAX;
            protocol.responseSend(response, respData);
        }
    }
}

/**
 * UnlockLongOrder - 解锁长订单
 * @param {*} request {gridIndex, unlocktype}
 * @param {*} response
 */
async function UnlockLongOrderGrid(request, response){
    function taskCounterLongOrder(uuid, callback)
    {
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Unlock_Order_grid,[{params:[0]}]);
        callback();
       
    
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     taskController.addTaskCounter(TaskData, uuid, 542, [0], () => {
        //         taskController.getCounterDataByTypeGroup(uuid, [542], taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, TaskData);
        //     });
        // });
    }
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.gridIndex <= 0 || request.body.unlocktype < 0 || request.body.unlocktype >= 2) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else {
        let order = new orderController (request.body.uuid, request.multiController, request.taskController);
        let retData = await order.unlockLongOrder (request.body.gridIndex, request.body.unlocktype);
        if (retData.status == 0) {
            if (retData.currency) respData.currency = retData.currency;
            if (retData.itemCost) respData.itemCost = retData.itemCost;
            if (retData.unlockGrid) respData.unlockGrid = retData.unlockGrid;

            taskCounterLongOrder(request.body.uuid, async () => {
                // respData.taskEventData = taskEventData;
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        return  protocol.responseSend(response, respData);
                    }
                    respData.taskEventData = [];
                    respData.taskList = [];
                    try {
                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                        respData.taskEventData = taskEventData;
                        respData.taskList = taskList;
                    }catch (e) {
                        respData.code = ERRCODES().FAILED;
                        return  protocol.responseSend(response, respData);
                    }
                    protocol.responseSend(response, respData);
                })
                request.logServer.LatticeRomeLog({uuid: request.body.uuid,actionId:request.Const.actions.openLongOrder, lorderId:request.body.gridIndex})
            });
        }else if (retData.status == 1) {
            respData.code = ERRCODES().ORDER_LONGORDER_ISUNLOCKDED;
            protocol.responseSend(response, respData);
        }else if (retData.status == 2) {
            respData.code = ERRCODES().PLAYER_LEVEL_VALID_FAILED;
            protocol.responseSend(response, respData);
        }else if (retData.status == 3) {
            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }else if (retData.status == 4) {
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }
    }
}

/**
 * LongOrderLoadGoods - 长订单单个订单装载货物
 * @param {*} request {orderContent}
 * @param {*} response
 */
async function LongOrderLoadGoods(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.orderContent === null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else {
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        let retData = await order.longOrderLoadGoods (player, request.body.orderContent);
        if (retData.status == 1) {
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }else if (retData.status == 2) {
            respData.code = ERRCODES().ORDER_LONGORDER_GIRDISREACHMAX;
            protocol.responseSend(response, respData);
        }else if (retData.status == 3) {
            respData.code = ERRCODES().ORDER_LONGORDER_GIRDISLOCKED;
            protocol.responseSend(response, respData);
        }else if (retData.status == 4) {
            // 无装载次数
            respData.code = ERRCODES().ORDER_LONGORDER_NOTIME;
            protocol.responseSend(response, respData);
        }else if (retData.status == 5) {
            // 长订单未开始
            respData.code = ERRCODES().ORDER_LONGORDER_NOTSTART;
            protocol.responseSend(response, respData);
        }else if (retData.status == 6) {
            // 订单不存在
            respData.code = ERRCODES().ORDER_NOT_EXIST;
            protocol.responseSend(response, respData);
        }else {
            // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
            //     request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.LongOrderSend,[{params:[0]}]);
            //     if (retData.costItem){
            //         respData.costItem = retData.costItem;
            //         request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItemFromShortOrder,getTaskItemParamGroup(respData.costItem));
            //     }
            //     if (retData.addItem){
            //         respData.addItem = retData.addItem;
            //     }
            //判断长订单等级
                // if(1){
                //     request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.LongOrderSend,[{params:[0]}]);
                // }
                // taskController.addTaskCounter(TaskData, request.body.uuid, 541, [0], () => {
                //     taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2, 3, 541], taskEventData => {
                //         taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
 
                            // respData.taskEventData = taskEventData;
                            request.multiController.save(async function(err,data){
                                if(err){
                                    respData.code = ERRCODES().FAILED;
                                    return  protocol.responseSend(response, respData);
                                }
                                respData.taskEventData = [];
                                respData.taskList = [];
                                try {
                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                    respData.taskEventData = taskEventData;
                                    respData.taskList = taskList;
                                }catch (e) {
                                    respData.code = ERRCODES().FAILED;
                                    return  protocol.responseSend(response, respData);
                                }
                                protocol.responseSend(response, respData);
                            })
                        // });
                    // }, TaskData);
                // });
            // });
        }
    }
}

/**
 * GetLongOrderReward - 长订单领取奖励
 * @param {*} request {}
 * @param {*} response
 */
async function GetLongOrderReward(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let player = new playerController(request.body.uuid, request.multiController, request.taskController);
    player.getLevel (async level => {
        let order = new orderController (request.body.uuid,request.multiController, request.taskController);
        let retData = await order.longOrderReward ();
        if (retData.status == 0) {
            respData.lorderReward = retData.lorderReward;
            let items = respData.lorderReward.items;
    
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetItemByLongOrder,getTaskItemParamGroup(items));
            let currency = respData.lorderReward.currency;
            let exp = respData.lorderReward.exp;
            assert (items != null && currency != null && exp != null, "should check long order reward data")
            player.addExp (exp, levelData =>{
                respData.userLevelData = levelData;
                let totalReward = [];
                if (levelData.levelUpAwardItems != null) {
                    for (let i in levelData.levelUpAwardItems) {
                        totalReward.push(levelData.levelUpAwardItems[i]);
                    }
                }
                let awards = categoryFromItemList(totalReward);
                let newAddItems = items.concat (awards.items);
                let totalCostCurrency = [];
                for (let i = 0; i < 3; i++) {
                    totalCostCurrency.push (currency[i] + awards.currency[i]);
                }
                player.addItem (newAddItems, itemRet => {
                    player.addCurrencyMulti(totalCostCurrency, newCurrency => {
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            respData.taskEventData = [];
                            respData.taskList = [];
                            try {
                                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                respData.taskEventData = taskEventData;
                                respData.taskList = taskList;
                            }catch (e) {
                                respData.code = ERRCODES().FAILED;
                                return  protocol.responseSend(response, respData);
                            }
                            protocol.responseSend(response, respData);
                        })
          
                    },CONSTANTS.TASK_TRIGGER_TYPE.GetItemByLongOrder);
                });
            });
           
        }else if (retData.status == 1) {
            respData.code = ERRCODES().ORDER_NOT_EXIST;
            protocol.responseSend(response, respData);
        }else if (retData.status == 2) {
            respData.code = ERRCODES().ORDER_LONGORDER_ISNOTCOMPLETE;
            protocol.responseSend(response, respData);
        }else if (retData.status == 3) {
            respData.code = ERRCODES().ORDER_LONGORDER_NOTSTART;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * LongOrderSpeedUp - 加速长订单时间
 * @param {*} request {}
 * @param {*} response
 */
async function LongOrderSpeedUp(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let order = new orderController (request.body.uuid,request.multiController, request.taskController);
    let retData = await order.LongOrderSpeedUp ();
    if (retData.status == 0) {
        respData.lorderStartTime = retData.lorderStartTime;
        respData.currency = retData.currency;
        respData.costDiamond = retData.costDiamond;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
        request.logServer.logCurrency(request.body.uuid,request.Const.actions.clearCD,request.Const.functions.latticeRoom,1,[0,retData.costDiamond,0], retData.currency)
    }else if (retData.status == 1) {
        respData.code = ERRCODES().ORDER_NOT_EXIST;
        protocol.responseSend(response, respData);
    }else if (retData.status == 2) {
        respData.code = ERRCODES().ORDER_LONGORDER_NOTNEEDSPEED;
        protocol.responseSend(response, respData);
    }else if (retData.status == 3) {
        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
        protocol.responseSend(response, respData);
    }
}

/**
 * LongOrderSendLongOrder - 长订单发货
 * @param {*} request {}
 * @param {*} response
 */
 async function LongOrderSendLongOrder (request, response) {
     let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
     let player = new playerController(request.body.uuid, request.multiController, request.taskController);
     player.getLevel (async level => {
         let order = new orderController (request.body.uuid,request.multiController, request.taskController);
         let retData = await order.sendLongOrder (level);
         if (retData.status == 0) {
             respData.lorderReward = retData.lorderReward;
             respData.lorderCount = retData.lorderCount;
             respData.lorderStatus = retData.lorderStatus;
             respData.lorderStartTime = retData.lorderStartTime;
             request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.LongOrderSend,[{params:[0]}]);
             //TODO 长订单档位
             request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.LongOrderQ_A,  [{params:[respData.lorderReward.level]}] );
             request.multiController.save(async function(err,data){
                 if(err){
                     respData.code = ERRCODES().FAILED;
                     return  protocol.responseSend(response, respData);
                 }
                 respData.taskEventData = [];
                 respData.taskList = [];
                 try {
                     let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                     respData.taskEventData = taskEventData;
                     respData.taskList = taskList;
                 }catch (e) {
                     respData.code = ERRCODES().FAILED;
                     return  protocol.responseSend(response, respData);
                 }
                 protocol.responseSend(response, respData);
             })

         }else if (retData.status == 1) {
             respData.code = ERRCODES().ORDER_NOT_EXIST;
             protocol.responseSend(response, respData);
         }else if (retData.status == 2) {
             respData.code = ERRCODES().ORDER_LONGORDER_VALUETOOLOW;
             protocol.responseSend(response, respData);
         }else if (retData.status == 3) {
             respData.code = ERRCODES().ORDER_LONGORDER_NOTSTART;
             protocol.responseSend(response, respData);
         }
     });
 }

exports.GetOrderInfo = GetOrderInfo;
exports.GetShortOrderInfo = GetShortOrderInfo;
exports.SupplyOrderTimes = SupplyOrderTimes;
exports.RefreshShortOrder = RefreshShortOrder;
exports.SendShortOrder = SendShortOrder;
exports.SetShortOrderHero = SetShortOrderHero;

exports.GetLongOrderInfo = GetLongOrderInfo;
exports.SupplyLongOrderTimes = SupplyLongOrderTimes;
exports.LongOrderLoadGoods = LongOrderLoadGoods;
exports.UnlockLongOrderGrid = UnlockLongOrderGrid;
exports.GetLongOrderReward = GetLongOrderReward;
exports.LongOrderSpeedUp = LongOrderSpeedUp;
exports.LongOrderSendLongOrder = LongOrderSendLongOrder;