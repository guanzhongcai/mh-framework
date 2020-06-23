const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const GameMarketConfig = require('./../../designdata/GameMarket').GameMarketConfig;
const Items = require('./../controllers/fixedController').Items;
const categoryFromItemList = require('./../controllers/fixedController').categoryFromItemList;
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * BuyGoods - 购买商品
 * @param {*} request body { httpuuid, goodsId, itemId, itemCount }
 * @param {*} response
 */
function BuyItems(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.uuid < 0 || request.body.goodsId < 1 ||
            request.body.itemId <= 0 || request.body.itemCount < 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        function skinValid(clsPlayer, goodsId, callback)
        {
            var GoodsType = GameMarketConfig.getGoodsType(goodsId);
            if (GoodsType === 2) { // 是皮肤购买
                var HeroID, SkinItemID;
                [HeroID, SkinItemID] = GameMarketConfig.getSkinGoods(goodsId);
                Items.getValue(SkinItemID, SkinID => {
                    var hero = new heroController(clsPlayer.getUUID(), HeroID,request.multiController, request.taskController);
                    // 判断是否存在改墨魂
                    hero.checkHero(heroValid => {
                        if (heroValid) {
                            // 存在该墨魂
                            hero.checkSkinValid(SkinID, skinValid => {
                                if (skinValid) {
                                    // 已有该皮肤
                                    callback(false, ERRCODES().HERO_SKIN_OWN);
                                } else {                                    
                                    // 根据皮肤道具ID获取相应的皮肤ID
                                    // 直接解锁墨魂皮肤
                                    hero.addSkin(SkinID, (newSkinData, skinLis) => {
                                        callback(true, [{ hid: HeroID, skins: skinLis }]);
                                    });
                                }
                            });
                        } else {
                            // 不存在该墨魂直接加入皮肤道具
                            clsPlayer.itemValid([{ id: SkinItemID, count: 1 }], itemValid => {
                                if (itemValid) {
                                    callback(false, ERRCODES().HERO_SKIN_ITEM_OWN);
                                } else {
                                    callback(true);
                                }
                            });
                        }
                    });
                });
            } else {
                callback(true);
            }
        }

        let player = new playerController(request.body.uuid,request.multiController, request.taskController);
        skinValid(player, request.body.goodsId, (ret, code) => {
            if (ret) {
                // 获取购买消耗
                var itemData = GameMarketConfig.getItemGoods(request.body.goodsId);
                if (itemData.id === request.body.itemId) {
                    var costData = GameMarketConfig.getCost(request.body.goodsId, request.body.itemCount);
                    if (costData) {
                        player.currencyMultiValid(costData.currency, currencyValid => {
                            if (currencyValid) {
                                player.itemValid(costData.items, itemValid => {
                                    if (itemValid) {
                                        // 消耗货币
                                        // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                            player.costCurrencyMulti(costData.currency, _ => {
                                                // 消耗物品
                                                player.costItem(costData.items, () => {
                                                    let buyData = categoryFromItemList([{id:request.body.itemId, count:request.body.itemCount*itemData.count}]);
                                                    buyData.items = buyData.items.concat(buyData.skinitems); // 合并皮肤道具（之前把道具和皮肤道具分开了）
                                                    if (code) buyData.items = []; // 该code存在说明是解锁皮肤的不加入到背包中去
                                                    player.addItem(buyData.items, _ => {
                                                        player.addCurrencyMulti(buyData.currency, newCurrency => {
                                                            // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2],  taskEventData => {
                                                                if (buyData.items.length > 0) respData.items = buyData.items;
                                                                if (costData.items.length > 0) respData.costItem = costData.items;
                                                                respData.currency = newCurrency;
                                                                if (code) respData.heroSkinList = code;
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
                                                                        await request.logServer.itemLog([request.body.uuid, request.Const.actions.shortOrderfill,costData.items,buyData.items, request.Const.functions.oddGoodsHouse])
                                                                        cb(1)
                                                                    },
                                                                    "logCurrency": async function(cb){
                                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.shortOrderfill,request.Const.functions.oddGoodsHouse,0,buyData.currency, newCurrency)
                                                                        cb(1)
                                                                    },
                                                                    "logCurrency1": async function(cb){
                                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.shortOrderfill,request.Const.functions.oddGoodsHouse,1,costData.currency, newCurrency)
                                                                        cb(1)
                                                                    }
                                                                },function (err,results) {
                                                                })
                                                            // });
                                                        });
                                                    });
                                                });
                                            });
                                        // });
                                    } else {
                                        // 物品不足
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
                    } else {
                        respData.code = ERRCODES().PARAMS_ERROR;
                        protocol.responseSend(response, respData);
                    }
                } else {
                    // 没有该对应物品
                    respData.code = ERRCODES().MARKET_NO_GOODS_ITEM;
                    protocol.responseSend(response, respData);
                }
            } else {
                // 皮肤购买相关错误
                respData.code = code;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * SellItems - 贩卖道具
 * @param {*} request { httpuuid, uuid, itemId, itemCount }
 * @param {*} response
 */
function SellItems(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.itemId < 1 || request.body.itemCount < 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        Items.getSellPriceConfig(request.body.itemId, request.body.itemCount, (ret, incomeData) => {
            if (ret) {
                var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                // 判断物品
                var costItem = [{id: request.body.itemId, count: request.body.itemCount }];
                player.itemValid(costItem, itemValid => {
                    if (itemValid) {
                        // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                            player.costItem([{id:request.body.itemId, count:request.body.itemCount}], sellItem => {
                                respData.sellItem = costItem;
                                // 增加货币
                                player.addCurrencyMulti(incomeData.currency, newCurrency => {
                                    player.addItem(incomeData.items, () => {
                                        // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                                        //     taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                        //         respData.taskEventData = taskEventData;
                                                respData.addItems = incomeData.items;
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
                                                    "itemLog":async function (cb) {
                                                        await request.logServer.itemLog([request.body.uuid, request.Const.actions.sellItem,costItem,[], request.Const.functions.shop])
                                                        cb(1)
                                                    },
                                                    "logCurrency": async function(cb){
                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.sellItem,request.Const.functions.shop,0,incomeData.currency, newCurrency)
                                                        cb(1)
                                                    }
                                                },function (err,results) {
                                                })
                                            // });
                                        // });
                                    });
                                });
                            });
                        // });
                    } else {
                        // 贩卖的物品不足
                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 没有该物品配置信息
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        });
    }
}

exports.BuyItems = BuyItems;
exports.SellItems = SellItems;
