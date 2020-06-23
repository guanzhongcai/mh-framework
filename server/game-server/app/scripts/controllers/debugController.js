const inspController = require('./inspController');
const gachaController = require('./gachaController');
const soulController = require('./soulController');
const heroController = require('./heroController');
const orderController = require ('./orderController')
const externalController = require('./externalController');
const shopController = require('./shopController');
const playerController = require('./playerController');
const PursueTreeHeroConfig = require('./../../designdata/PursueTreeHeros');
const gameConfigData = require('./../../../configs/gamedata.json');
const models = require('./../models');
const validator = require('validator');
const DefaultConfig = require('./../../designdata/Defaults');
const GameBuyCountConfig = require('./../../designdata/GameBuyCounts');
const pursueTreeController = require('./../controllers/pursueTreeController');
const ERRCODES = require('./../../common/error.codes');
const inspCount = require('../controllers/inspCountController')
const CONSTANTS = require('./../../common/constants');

const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

class debugController
{
    constructor(uuid,multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.itemtable_ = "ItemData";
        this.userdatatable_ = "UserData";
        this.shoptable = "ShopData";
        this.multiController = multiController;
        this.taskController = taskController;
    }

    //仓库清空
    debugClearDepot (callback) {
        GameRedisHelper.getHashFieldValue(this.itemtable_, this.uuid_, sItemData => {
            let newItemLis = [];
            GameRedisHelper.setHashFieldValue(this.itemtable_, this.uuid_, JSON.stringify(newItemLis), () => {
                let retData = {};
                retData.optstatus = true;
                retData.items = newItemLis;
                callback(retData);
            });
        });
    }

    //商店刷新时间重置
    debugResetShopRefreshTimes (uuid, callback) {
        GameRedisHelper.getHashFieldValue(this.shoptable, uuid, sdoc => {
            let doc = sdoc && validator.isJSON(sdoc) ? JSON.parse(sdoc) : null;
            let retData = {};
            if (doc) {
                doc.refUpTime = new Date().getTime();
                // for (let shopType of [shopController.SHOP_TYPES().ITEM_SHOP, shopController.SHOP_TYPES().GIFT_SHOP]) {
                //     doc[shopController.getQueryFieldByType(shopType)].refFreeCount = gameConfigData.SHOP.RefreshFreeCount;
                // }
                retData.shopData = doc;
                retData.optstatus = true;
                GameRedisHelper.setHashFieldValue(this.shoptable, uuid, JSON.stringify(doc), () => {
                    callback(retData);
                });
            } else {
                retData.optstatus = false;
                callback(retData);
            }
        });
    }

    //重置刷新时间
    debugResetRefreshTimes (callback) {
        async function doInspData(inspPtr)
        {
            let backData_ = await inspPtr.dayReset(true)
            return backData_;
        }
        GameRedisHelper.getHashFieldValue(this.userdatatable_, this.uuid_, sPlayerData => {
            let playerData = sPlayerData && validator.isJSON(sPlayerData) ? JSON.parse(sPlayerData) : null, et = new Date();
            let retData = {};
            if (playerData) {
                playerData.resetTime = et.getTime();
                var hero = new heroController(this.uuid_, 0, this.multiController, this.taskController)
                //update inspiration
                var insp = new inspController (this.uuid_,this.multiController, this.taskController);
                var insp_count = new inspCount (this.uuid_, this.multiController, this.taskController);
                doInspData(insp_count).then(data => {
                    insp.getData(hero, 0, 0, (insData, insMapData) => {
                        var insNode = {};
                        insNode.inspCount = data.count;
                        insNode.buyCount = data.buycnt;
                        insNode.inspUpTime = insp.getInspCountCd(insData.inspCountUpStartTime);
                        insNode.inspActionPoint = insData.inspActionPoint;
                        insNode.effItemId = insData.effItemId; // 效果道具使用保存值
                        insNode.themeList = insData.themeList;
                        //insNode.themeData = insData.themeData;
                        if (insMapData.themeData) {
                            insNode.themeData = insMapData.themeData;
                            if (insMapData.themeData.extBuff != null) {
                                insNode.castAp = 50 + insMapData.themeData.extBuff.ap;
                                insNode.castAp = insNode.castAp < 0 ? 0 : insNode.castAp;
                            } else {
                                insNode.castAp = 0;
                            }
                        }
                        retData.inspData = insNode;
                        //update soul
                        let soul = new soulController(this.uuid_, this.multiController, this.taskController);
                        soul.resetSoulGameData(true, _ => {
                            soul.getSoulGameData(soulDataUpdated => {
                                retData.soulGameData = soulDataUpdated;

                                //update gacha
                                let gacha = new gachaController(this.uuid_, this.multiController, this.taskController);
                                gacha.updateAreaFreeData(true, areaFreeList => {
                                    let gachaNode = {};
                                    gachaNode.areaFreeList = areaFreeList;
                                    retData.gachaData = gachaNode;
                                    //update quiz and order
                                    let quiz = new externalController(this.uuid_, this.multiController, this.taskController);
                                    quiz.resetAllHeroQuizUsedCountAndQuizItem(async _ => {
                                        retData.restQuiz = true;
                                        let order = new orderController(this.uuid_, this.multiController, this.taskController);
                                        let freeRefreshCount = DefaultConfig.getShortOrderFreeRefCount(); // gameConfigData.ORDER.ShortOrderMaxRefreshTime;
                                        let sOrderCompleteCount = 0;
                                        let sTimeOrderCompleteCount = 0;
                                        let orderBuyCount = GameBuyCountConfig.getShortOrderBuyCountMax(); // gameConfigData.ORDER.ShortOrderBuyMax;
                                        let sOrderCountLimited = gameConfigData.ORDER.ShortOrderCountLimited;
                                        let longOrderCount = gameConfigData.ORDER.LongOrderMaxCount;
                                        let longOrderBuyCount = 0;
                                        await order.refreshOrderDataInfo(freeRefreshCount, sOrderCompleteCount, sTimeOrderCompleteCount, orderBuyCount, sOrderCountLimited, longOrderCount, longOrderBuyCount);
                                        let orderData = {}
                                        orderData.freeRefreshCount = freeRefreshCount;
                                        orderData.sOrderCompleteCount = sOrderCompleteCount;
                                        orderData.sTimeOrderCompleteCount = sTimeOrderCompleteCount;
                                        orderData.orderBuyCount = orderBuyCount;
                                        orderData.sOrderCountLimited = sOrderCountLimited;
                                        retData.orderData = orderData;

                                        //update shop refresh time
                                        this.debugResetShopRefreshTimes(this.uuid_, shopRetData => {
                                            retData.shopData = shopRetData.shopData;
                                            GameRedisHelper.setHashFieldValue(this.userdatatable_, this.uuid_, JSON.stringify(playerData), () => {
                                                retData.optstatus = true;
                                                callback(retData);
                                            });
                                        });
                                    });
                                })
                            });
                        });
                    });
                });
            }else {
                retData.optstatus = false;
                callback (retData);
            }
        });
    }

    //新增道具
    debugUpdateItemCount (items, callback) {
        let retData = {};
        if (items.length === 0) {
            retData.optstatus = false;
            callback (retData);
        }else {
            GameRedisHelper.getHashFieldValue(this.itemtable_, this.uuid_, sItemData => {
                let newItemLis = sItemData && validator.isJSON(sItemData)? JSON.parse(sItemData) : null;
                if (newItemLis) {
                    for (let item of items) {
                        if (item.id === undefined || item.id === null || item.id <= 0 || item.count < 1)
                            continue;
                        let isFind = false;
                        for (let i in newItemLis) {
                            if (item.id === newItemLis[i].id) {
                                newItemLis[i].count += item.count;
                                isFind = true;
                                break;
                            }
                        }

                        if (!isFind) {
                            let newItem = models.ItemModel();
                            newItem.id      = item.id;
                            newItem.count   = item.count;
                            newItemLis.push(newItem);
                        }
                    }
                } else {
                    newItemLis = [];
                    for (let i in items) {
                        if (items[i].id === undefined || items[i].id === null || items[i].id <= 0 || items[i].count < 1)
                            continue;
                        let newItem = models.ItemModel();
                        newItem.id      = items[i].id;
                        newItem.count   = items[i].count;
                        newItemLis.push(newItem);
                    }
                }
                this.multiController.push(1,this.itemtable_ + ":" + this.uuid_,JSON.stringify(newItemLis))
                retData.optstatus = true;
                retData.items = newItemLis;
                callback(retData);
            });
        }
    }

    //增加所有的道具个数
    debugAddItemCount (count, callback) {
        let retData = {};
        if (count === 0) {
            retData.optstatus = false;
            callback (retData);
        }else {
            GameRedisHelper.getHashFieldValue(this.itemtable_, this.uuid_, sItemData => {
                let newItemLis = sItemData && validator.isJSON(sItemData)? JSON.parse(sItemData) : null;
                if (newItemLis) {
                    for (let i in newItemLis) {
                        newItemLis[i].count += count;
                    }
                } else {
                    newItemLis = [];
                }
                GameRedisHelper.setHashFieldValue(this.itemtable_, this.uuid_, JSON.stringify(newItemLis), () => {
                    retData.optstatus = true;
                    retData.items = newItemLis;
                    callback(retData);
                });
            });
        }
    }

    //添加货币
    debugUpdateUserCurrency (currency, callback) {
        let player = new playerController (this.uuid_,this.multiController, this.taskController);
        player.addCurrencyMulti (currency, newcurrency => {
            let retData = {};
            retData.optstatus = true;
            retData.currency = newcurrency;
            callback (retData);
        });
    }

    //添加经验
    debugAddExp (clsPlayer, exp, callback) {
        clsPlayer.addExp (exp, levelData => {
            let retData = {};
            retData.optstatus = true;
            retData.userLevelData = levelData;
            callback (retData);
        });
    }

    //添加墨魂
    debugAddMohun (heroId, callback) {
        let hero = new heroController(this.uuid_, heroId,this.multiController, this.taskController);
        hero.checkHeroIdValid(valid => {
            hero.checkHeroById(heroId, heroRet => {
                if (valid && !heroRet) {
                    hero.createHero (mhdata => {
                        let retData = {};
                        retData.optstatus = true;
                        retData.mhdata = mhdata;
                        callback (retData)
                    });
                } else {
                    callback({ optstatus: false, mhdata: null });
                }
            });
        });
    }

    //添加墨魂属性
    debugAddMohunAttrs (heroId, attrs, callback) {
        let hero = new heroController(this.uuid_, heroId,this.multiController, this.taskController);
        hero.checkHeroIdValid(valid => {
            if (valid) {
                hero.addAttrs (attrs, newAttrs => {
                    let retData = {};
                    retData.optstatus = true;
                    retData.attrs = newAttrs;
                    callback (retData)
                });
            } else {
                callback({ optstatus: false, attrs: null });
            }
        });
    }

    // 开启墨魂全部追求树节点
    async openPursueTreeAllByHeroId(clsPlayer, clsHero, heroId, multiController, taskController) {
        return new Promise( async resolve => {
            let pursueTreeLis = PursueTreeHeroConfig.getHeroNodeAll(heroId);
            console.log("openPursueTreeAllByHeroId", pursueTreeLis)
            for (let nId of pursueTreeLis) {
                let unlockRetData = await pursueTreeController.doUnlock(clsPlayer, clsHero, nId, multiController, taskController);
                let retData = unlockRetData.retData, NodeType = unlockRetData.NodeType;
                if (retData.code === ERRCODES().SUCCESS) {
                    await clsHero.addPursueTreeNode(nId);
                }
            }

            await pursueTreeController.autoUnlockNodeId(clsHero, 1000);
            clsHero.getPursueTreeList (pursueTreeList => {
                let retData = {};
                retData.optstatus = true;
                retData.pursueTreeList = pursueTreeList;
                resolve (retData);
            });
        });
    }
}

module.exports = debugController;
