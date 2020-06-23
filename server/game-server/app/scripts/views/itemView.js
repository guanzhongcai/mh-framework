const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const DepotLevelUp = require('./../../designdata/DepotLevelUp');
const itemController = require('./../controllers/itemController');
const ItemConfig = require('./../controllers/fixedController').Items;
const heroController = require('./../controllers/heroController');
const playerController = require('./../controllers/playerController');
const taskController = require('./../controllers/taskController');
const shopController = require('./../controllers/shopController');
const mailController = require('./../controllers/mailController');
const GiftItemConfig = require('./../../designdata/GiftItems');
const categoryFromItemList = require('./../controllers/fixedController').categoryFromItemList;
const Defaults = require('./../../designdata/Defaults');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
// 使用礼包
function UseGiftItem(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid,0,request.multiController, request.taskController),
        player = new playerController(request.body.uuid,request.multiController, request.taskController);

    /*
    function getHeroGroup(addHeroLis) {
        var group = [];
        for(let i in addHeroLis) {
            group.push(addHeroLis[i].hid);
        }

        return group;
    }*/

    const _doLongGift = (uuid, giftId, giftBonus, callback) =>
    {
        if (giftBonus.longBonus != null) {
            // 说明是持续礼包
            shopController.getShopDataFromSource(uuid, ShopData => {
                if (!Array.isArray(ShopData.longGiftList)) ShopData.longGiftList = [];
                ShopData.longGiftList.push({
                    itemId: 0,
                    giftId: giftId,
                    bonus: giftBonus.longBonus, // 持续礼包物品
                    dayCnt: giftBonus.longDayCount-1, // 持续天数（开始就算一日）
                    st: new Date().getTime() // 刚获得时间记录
                });

                // 发送持续礼包邮件奖励（第一日）
                mailController.sendMultiMail(uuid,
                        [mailController.getLongGiftMailModel(giftId, 1, giftBonus.longBonus)], () => {
                    shopController.saveShopDataFromSource(uuid, ShopData, request.multiController,() => {
                        callback();
                    });
                });
            });
        } else {
            callback();
        }
    }

    var giftItem = [{ id: request.body.itemId, count: request.body.itemCount }];
    // 判断是否有改物品
    player.itemValid(giftItem, itemValid => {
        if (itemValid) {
            if (ItemConfig.isGiftItem(request.body.itemId)) {
                var GiftBonus = GiftItemConfig.undoGift(request.body.itemId, request.body.itemCount);
                //console.warn(">>>>", JSON.stringify(GiftBonus), giftItem);
                if (GiftBonus) {
                    // 加入物品
                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                        itemController.useItemList(GiftBonus.bonus, retData => {
                            _doLongGift(request.body.uuid, request.body.itemId, GiftBonus, () => {
                                if (retData.addItems) respData.addItems = retData.addItems;
                                if (retData.currency) respData.currency = retData.currency;
                                if (retData.heroList) respData.heroList = retData.heroList;
                                if (retData.heroSkinList) respData.heroSkinList = retData.heroSkinList;
                                respData.itemId = request.body.itemId;
                                respData.itemCount = request.body.itemCount;
                                respData.costItems = giftItem;
                                // 消耗礼包
                                player.costItem(giftItem, async() => {
                                    // taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], taskEventData => {
                                    //     respData.taskEventData = taskEventData;
                                    //     taskController.saveTaskDataFromSource(request.body.uuid, TaskData, async() => {
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
                                            await request.logServer.itemLog([request.body.uuid, request.Const.actions.openGift,giftItem,GiftBonus.bonus, request.Const.functions.shop])
                                        // });
                                    // });
                                });
                            });
                        }, hero, player);
                    // });
                } else {
                    // 非礼包物品
                    respData.code = ERRCODES().ITEM_IS_NOT_GIFT;
                    protocol.responseSend(response, respData);
                }
            } else {
                // 非礼包物品
                respData.code = ERRCODES().ITEM_IS_NOT_GIFT;
                protocol.responseSend(response, respData);
            }
        } else {
            // 物品不足
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }
    });
}

// 仓库升级
function DepotToLevelUp(request, response)
{
    function getNeedCostAndBonusExp(DepotLis, bagLevel, callback) {
        var NeedCost = null, BonusExp = null;
        for (let i in DepotLis) {
            if (DepotLis[i].Level === bagLevel) {
                NeedCost = DepotLis[i].NeedCost;
                BonusExp = DepotLis[i].BonusExp;
                break;
            }
        }

        callback(NeedCost, BonusExp);
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.pos === 2 || request.body.pos === 3) {
        DepotLevelUp.getDepotListByTypeConfig(request.body.pos, DepotLisConfig => {
            var player = new playerController(request.body.uuid,request.multiController, request.taskController);
            player.getBagLevelByDepotType(request.body.pos, playerBagLevel => {
                if (playerBagLevel === DepotLisConfig.length) {
                    // 已达最大等级
                    respData.code = ERRCODES().DEPOT_LEVEL_IS_MAX;
                    protocol.responseSend(response, respData);
                } else {
                    getNeedCostAndBonusExp(DepotLisConfig, playerBagLevel, (NeedCost, BonusExp) => {
                        if (NeedCost) {
                            // 判断物品
                            player.itemValid(NeedCost.items, itemValid => {
                                if (itemValid) {
                                    // 判断货币
                                    player.currencyMultiValid(NeedCost.currency, currencyValid => {
                                        if (currencyValid) {
                                            // 增加背包等级
                                            player.setBagLevelByDepotType(request.body.pos, playerBagLevel + 1, () => {
                                                // 消耗物品
                                                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                                                    player.costItem(NeedCost.items, () => {
                                                        // 消耗货币
                                                        player.costCurrencyMulti(NeedCost.currency, newCurrency => {
                                                            // 增加经验
                                                            player.addExp(BonusExp, levelData => {
                                                                respData.userLevelData = levelData;
                                                                let totalReward = [];
                                                                if (levelData.levelUpAwardItems != null) {
                                                                    for (let i in levelData.levelUpAwardItems) {
                                                                        totalReward.push (levelData.levelUpAwardItems[i]);
                                                                    }
                                                                }

                                                                let awards = categoryFromItemList(totalReward);
                                                                player.addItem(awards.items, () => { // 加入升级物品奖励
                                                                    player.addCurrencyMulti(awards.currency, newCurrency => { // 加入升级货币奖励
                                                                        respData.addItems = awards.items;
                                                                        respData.costItems = NeedCost.items;
                                                                        respData.currency = newCurrency;
    
                                                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.WareHouseUpgrade,[{params:[0]}]);
                                                                        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.WareHouseUpgrade,[{params:[request.body.pos]}]);
                                                                        // taskController.addTaskCounter(TaskData, request.body.uuid, 731, [0], () => {/
                                                                        //     taskController.addTaskCounter(TaskData, request.body.uuid, 731, [request.body.pos], () => {
                                                                        //         taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 2], taskEventData => {
                                                                        //             taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                                                                       
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
                                                                                                await request.logServer.itemLog([request.body.uuid, request.Const.actions.storelevelUp, NeedCost.items,awards.items, request.Const.functions.shop])
                                                                                                cb(1)
                                                                                            },
                                                                                            "logCurrency": async function(cb){
                                                                                                await request.logServer.logCurrency(request.body.uuid,request.Const.actions.storelevelUp,request.Const.functions.shop,0,awards.currency,newCurrency)
                                                                                                cb(1)
                                                                                            },
                                                                                            "logCurrency1": async function(cb){
                                                                                                await request.logServer.logCurrency(request.body.uuid,request.Const.actions.storelevelUp,request.Const.functions.shop,1,NeedCost.currency,newCurrency)
                                                                                                cb(1)
                                                                                            },
                                                                                            "addLevel": async function(cb){
                                                                                                await request.logServer.ExpLog(Object.assign(levelData, {uuid: request.body.uuid,actionId: request.Const.actions.storelevelUp,functionId: request.Const.functions.store}))
                                                                                                cb(1)
                                                                                            }
                                                                                        },function (err,results) {
                                                                                        })
                                                                                    // });
                                                                                // });
                                                                            // });
                                                                        // });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                // });
                                            });
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
                            // 找不到相应数据（可能系配表问题）
                            respData.code = ERRCODES().FAILED;
                            protocol.responseSend(response, respData);
                        }
                    });
                }
            });
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

// 捉鱼
// { itemId, itemCount }
function CatchFish(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var player = new playerController(request.body.uuid,request.multiController, request.taskController);
    Defaults.getDefaultValueConfig(Defaults.DEFAULTS_VALS().QUIZHELPITEMID, itemId => {
        player.getItemCount (itemId, itemCount => {
            Defaults.getDefaultValueConfig(Defaults.DEFAULTS_VALS().QUIZHELPITEMLIMITED, itemLimited => {
                if (itemCount < itemLimited)  {
                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                        player.addItem([{ id: itemId, count: 1 }], () => {
                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CatchFish,[{params:[0]}]);
                            
                            // taskController.addTaskCounter(TaskData, request.body.uuid, 5, [0], () => {
                            //     taskController.getCounterDataByTypeGroup(request.body.uuid, [1, 5], taskEventData => {
                            //         taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                            //             respData.taskEventData = taskEventData;
                                        respData.addItems = { id: itemId, count: 1 };
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
                            // }, 1);
                        });
                    // });
                }else {
                    Defaults.getDefaultValueConfig(Defaults.DEFAULTS_VALS().QUIZHELPITEMEXCHANGEDGOLD, exchangeCount => {
                        player.addCurrencyMulti([exchangeCount,0,0], newCurrency => {
                            respData.currency = newCurrency;
                            respData.addGold = exchangeCount;
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
                    });
                }
            });
        });
    });
}

exports.UseGiftItem = UseGiftItem;
exports.DepotToLevelUp = DepotToLevelUp;
exports.CatchFish = CatchFish;
