const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const shopController = require('./../controllers/shopController');
const itemController = require('./../controllers/itemController');
const mailController = require('./../controllers/mailController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const getCurrencyToItemList = require('./../controllers/fixedController').getCurrencyToItemList;
const GameMarketConfig = require('./../../designdata/GameMarket').GameMarketConfig;
const taskController = require('./../controllers/taskController');
const ItemConfig = require('./../controllers/fixedController').Items;
const GiftItemConfig = require('./../../designdata/GiftItems');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
function ShopList(request, response)
{
    function shopTask(uuid, callback)
    {
    
    
    
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetIntoShop,[{params:[0]}]);
        callback();
        // taskController.getTaskDataFromSource(uuid, TaskData => {
        //     taskController.addTaskCounter(TaskData, uuid, 723, [0], () => {
        //         taskController.getCounterDataByTypeGroup(uuid, [723], taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, TaskData);
        //     });
        // });
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    shopTask(request.body.uuid, () => {
        // respData.taskEventData = taskEventData;
        shopController.getShopDataFromSource(request.body.uuid, ShopData => {
            var player = new playerController(request.body.uuid,request.multiController, request.taskController);
            player.getLevel(playerLevel => {
                // 刷新商店菜单
                shopController.shopMenuRefersh(request.body.uuid, playerLevel, 0, request.multiController,() => {
                    shopController.saveShopDataFromSource(request.body.uuid, ShopData,request.multiController, async() => {
                        respData.shops = ShopData;
    
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
                    });
                }, ShopData, true);
            });
        });
    });
}

/**
 * ShopShopping - 商城购买
 * @param {*} request { shopId, grid, goodsId, goodsCount }
 * @param {*} response
 */
function ShopShopping(request, response)
{
    function taskCounterShopping(uuid, goodsId, costData, callback) {
        var goodsItem = GameMarketConfig.getItemGoods(goodsId);
        if (goodsItem != null) {
            var taskParams = [],
                currencyItemLis = getCurrencyToItemList(costData.currency);
            currencyItemLis.map((x) => { taskParams.push({ params: [x.id], num: x.count }); });
            
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.BuyItems_A,[{params:[ItemConfig.getItemType(goodsItem.id)]}]);
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CostItemBuy,taskParams);
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.BuyItemsTimes,[{params:[goodsItem.id]}]);
            return  callback();
            // taskController.addTaskCounter(TaskData, uuid, 724, [ItemConfig.getItemType(goodsItem.id)], () => {
            //     taskController.addTaskCounterGroup(TaskData, uuid, 722, taskParams, () => {
            //         taskController.addTaskCounter(TaskData, uuid, 721, [goodsItem.id], () => {
            //             taskController.getCounterDataByTypeGroup(uuid, [1, 2, 721, 722], taskEventData => {
            //                 taskController.saveTaskDataFromSource(uuid, TaskData, () => {
            //                     callback(taskEventData);
            //                 });
            //             }, TaskData);
            //         });
            //     });
            // });
        }else {
            callback()
        }
    }

    function doShopBuyGoods(uuid, shopData, goodsId, goodsCount, newCurrency,costData, callback, playerPtr)
    {
        var bonusType, bonusData, retData = {};
        [bonusType, bonusData] = GameMarketConfig.getGoods(goodsId, goodsCount);
        if (bonusType === 1) {
            // 礼包奖励
            if (GiftItemConfig.getGetType(bonusData.id) === 0) {
            //if (GameMarketConfig.getGiftGetType(goodsId) === 0) {
                // 立即获得
                var GiftBonus = GiftItemConfig.undoGift(bonusData.id, bonusData.count); // 解开礼包
                itemController.useItemList(GiftBonus.bonus, (retData) => { // 使用物品列表
                    if (!retData.currency) retData.currency = newCurrency;
                    if (GiftBonus.longBonus != null) {
                        // 说明是持续礼包
                        if (!Array.isArray(shopData.longGiftList)) shopData.longGiftList = [];
                        shopData.longGiftList.push({
                            itemId: goodsId,
                            giftId: bonusData.id,
                            bonus: GiftBonus.longBonus, // 持续礼包物品
                            dayCnt: GiftBonus.longDayCount-1, // 持续天数（开始就算一日）
                            st: new Date().getTime() // 刚获得时间记录
                        });

                        // 发送持续礼包邮件奖励（第一日）
                        mailController.sendMultiMail(uuid,
                                [mailController.getLongGiftMailModel(bonusData.id, 1, GiftBonus.longBonus)], () => {
                            callback(retData);
                        });
                    } else {
                        callback(retData);
                    }
                }, new heroController(uuid,0,request.multiController, request.taskController), playerPtr);
            } else {
                // 直接将礼包加入背包中
                playerPtr.addItem([bonusData], () => {
                    playerPtr.addCurrencyMulti([0,0,0], () => {
                        retData.addItems = [bonusData];
                        retData.currency = newCurrency;
                        callback(retData);
                    });
                });
            }
        } else if (bonusType === 2) {
            // 普通奖励（直接给予）
            playerPtr.addItem(bonusData.items, () => {
                playerPtr.addCurrencyMulti(bonusData.currency, async newCurrency => {
                    if (bonusData.items.length > 0) {
                        retData.addItems = bonusData.items;
                        let cost = costData.items.length > 0 ? costData.items: request.logCurrency(costData.currency)
                        await request.logServer.itemLog([request.body.uuid,
                        request.Const.actions.shopBuy, cost,
                            bonusData.items, request.Const.functions.shop
                       ]);
                        if(costData.items.length === 0){
                            // 扣钱
                            let dcurrency = request.logCurrency(newCurrency)
                            let num = dcurrency[0].id == request.Const.currentcy.materials?newCurrency[0]:newCurrency[1]
                            await request.logServer.CurrencyLog([request.body.uuid, cost[0].id,
                                request.Const.actions.shopBuy, request.Const.functions.shop,
                                1,cost[0].count, num
                            ]);
                        }
                    }else{
                        let add = request.logCurrency(bonusData.currency)
                        let subtract = request.logCurrency(costData.currency)
                        let aNum = add[0].id == request.Const.currentcy.materials?newCurrency[0]:newCurrency[1]
                        let sNum = subtract[0].id == request.Const.currentcy.materials?newCurrency[0]:newCurrency[1]
                        // 得到货币两条记录
                        async.parallel({
                            "CurrencyLog":async function (cb) {
                                await request.logServer.CurrencyLog([request.body.uuid, add[0].id,
                                    request.Const.actions.shopBuy, request.Const.functions.shop,
                                    0,add[0].count, aNum
                                ]);                                cb(1)
                            },
                            "logCurrency": async function(cb){
                                await request.logServer.CurrencyLog([request.body.uuid, subtract[0].id,
                                    request.Const.actions.shopBuy, request.Const.functions.shop,
                                    1,subtract[0].count, sNum
                                ]);                                cb(1)
                            }
                        },function (err,results) {
                        })
                    }
                    retData.currency = newCurrency;
                    callback(retData);
                });
            });
        } else {
            callback(retData);
        }
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var shopId = request.body.shopId;
    if (shopController.isPersistShop(shopId) || shopController.isRefreshShop(shopId)) {
        // 固定或刷新商店
        shopController.getShopDataFromSource(request.body.uuid, ShopData => {
            // 判断是否有该商品
            shopController.checkShopGoods(request.body.uuid, shopId, request.body.grid, request.body.goodsId, request.body.goodsCount, (goodsValid) => {
                if (goodsValid) {
                    // 获取购买消耗
                    var costData = GameMarketConfig.getCost(request.body.goodsId, request.body.goodsCount),
                        player = new playerController(request.body.uuid,request.multiController, request.taskController);
                    //console.warn(JSON.stringify(costData), request.body.goodsId, request.body.goodsCount);
                    player.itemValid(costData.items, itemValid => {
                        if (itemValid) {
                            player.currencyMultiValid(costData.currency, currencyValid => {
                                if (currencyValid) {
                                    // 消耗物品或货币
                                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                        player.costItem(costData.items, () => {
                                            player.costCurrencyMulti(costData.currency, newCurrency => {
                                                // 执行商品购买
                                                doShopBuyGoods(request.body.uuid, ShopData, request.body.goodsId, request.body.goodsCount, newCurrency,costData,retData => {
                                                    // 处理购买后的商店数据
                                                    shopController.shopBuyGoods(request.body.uuid, shopId, request.body.grid, request.body.goodsId, request.body.goodsCount, () => {
                                                        // 保存商店数据
                                                        shopController.saveShopDataFromSource(request.body.uuid, ShopData, request.multiController,() => {
                                                            if (costData.items.length > 0) {
                                                                respData.costItems = costData.items;
                                                            }

                                                            respData.shops = ShopData;

                                                            if (retData.currency) respData.currency = retData.currency;
                                                            if (retData.addItems) respData.addItems = retData.addItems;
                                                            if (retData.heroList) respData.heroList = retData.heroList;
                                                            if (retData.heroSkinList) respData.heroSkinList = retData.heroSkinList;

                                                            taskCounterShopping(request.body.uuid, request.body.goodsId, costData, async() => {
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
                                                                await request.logServer.shopLog([request.body.uuid,
                                                                    request.Const.actions.shopBuy, request.body.goodsId, shopId,
                                                                    GameMarketConfig.getShopType(request.body.goodsId),
                                                                    GameMarketConfig.getGoodsType(request.body.goodsId),request.body.goodsCount
                                                                ]);
                                                            });
                                                        });
                                                    }, ShopData);
                                                }, player);
                                            });
                                        });
                                    // });
                                } else {
                                   // 货币不足
                                    respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                                    return protocol.responseSend(response, respData);
                                }
                            });
                        } else {
                            // 道具不足
                            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                            return protocol.responseSend(response, respData);
                        }
                    });
                } else {
                    // 没有该商品
                    respData.code = ERRCODES().MARKET_NO_GOODS_ITEM;
                    return protocol.responseSend(response, respData);
                }
            }, ShopData);
        });
    } else {
        // 其他商店
        respData.code = ERRCODES().PARAMS_ERROR;
        return protocol.responseSend(response, respData);
    }
}

function ShopRefreshMenu(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    // 判断是否为刷新商店
    var shopId = request.body.shopId;
    if (shopController.isRefreshShop(shopId)) {
        shopController.getShopDataFromSource(request.body.uuid, ShopData => {
            if (ShopData[shopId]) {
                var currRefCount = ShopData[shopId].refCount + 1; // 当前刷新次数
                if (!shopController.isRefCountMax(shopId, currRefCount)) {
                    var costData = shopController.getRefreshCost(shopId, currRefCount);
                    if (costData) {
                        var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                        player.itemValid(costData.items, itemValid => {
                            if (itemValid) {
                                player.currencyMultiValid(costData.currency, currencyValid => {
                                    if (currencyValid) {
                                        // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                            // 消耗物品
                                            player.costItem(costData.items, () => {
                                                // 消耗货币
                                                player.costCurrencyMulti(costData.currency, newCurrency => {
                                                    
                                                        player.getLevel(playerLevel => {
                                                            // 刷新商店菜单
                                                            shopController.shopMenuRefersh(request.body.uuid, playerLevel, shopId, request.multiController,() => {
                                                                ShopData[shopId].refCount = currRefCount; // 增加刷新次数
                                                                shopController.saveShopDataFromSource(request.body.uuid, ShopData,request.multiController, () => {
                                                                    if (costData.items.length > 0)
                                                                        respData.costItems = costData.items;
                                                                    if (costData.currency.filter((a) => { return a > 0; }).length > 0){
                                                                        respData.currency = newCurrency;
                                                                    }

                                                                    respData.shops = ShopData;
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
                                                                        "CurrencyLog":async function (cb) {
                                                                            if (costData.currency.filter((a) => { return a > 0; }).length > 0){
                                                                                let cost = request.logCurrency(costData.currency)
                                                                                let num = cost[0].id == request.Const.currentcy.materials?newCurrency[0]:newCurrency[1]
                                                                                await request.logServer.CurrencyLog([request.body.uuid, cost[0].id,
                                                                                    request.Const.actions.shopRefresh, request.Const.functions.shop,
                                                                                    1,cost[0].count, num
                                                                                ]);
                                                                            }
                                                                            cb(1)
                                                                        },
                                                                        "shopLog": async function(cb){
                                                                            await request.logServer.shopLog([request.body.uuid,
                                                                                request.Const.actions.shopRefresh, 0, shopId,
                                                                                0, 0,0
                                                                            ]);
                                                                            cb(1)
                                                                        }
                                                                    },function (err,results) {
                                                                    });
                                                                });
                                                            }, ShopData, false);
                                                        });
                                                  
                                                });
                                            });
                                        // });
                                    } else {
                                        // 货币不足
                                        respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            } else {
                                // 物品不足
                                respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                protocol.responseSend(response, respData);
                            }
                        });
                    } else {
                        // 配置数据错误
                        respData.code = ERRCODES().FAILED;
                        protocol.responseSend(response, respData);
                    }
                } else {
                    // 刷新次数达到上限
                    respData.code = ERRCODES().SHOP_REFRESH_FAILED;
                    protocol.responseSend(response, respData);
                }
            } else {
                // 无该商店数据
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        // 非刷新商店
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

exports.ShopList = ShopList;
exports.ShopShopping = ShopShopping;
exports.ShopRefreshMenu = ShopRefreshMenu;