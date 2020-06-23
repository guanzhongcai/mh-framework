const utils = require('./../../common/utils');
const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const GameMarketListConfig = require('./../../designdata/GameMarket').GameMarketListConfig;
const GameMarketConfig = require('./../../designdata/GameMarket').GameMarketConfig;
const GameBuyCountConfig = require('./../../designdata/GameBuyCounts');
let m_shopData = null
const CONSTANTS = require('./../../common/constants');
const TABLE_SHOPDATA = "ShopData";

function getShopDataFromSource(uuid, callback)
{
    if(!!m_shopData){
        callback(m_shopData)
    }else{
        GameRedisHelper.getHashFieldValue(TABLE_SHOPDATA, uuid, doc => {
            if (doc && validator.isJSON(doc)) {
                m_shopData = JSON.parse(doc)
                callback(JSON.parse(doc));
            } else {
                _initShopData(1, newShopData => {
                    m_shopData = newShopData
                    callback(newShopData);
                });
            }
        });
    }
}

function getShopData(uuid, callback, shopData=null)
{
    if (shopData) {
        callback(shopData);
    } else {
        getShopDataFromSource(uuid, newShopData => {
            callback(newShopData);
        });
    }
}

function saveShopDataFromSource(uuid, shopData,multiController, callback)
{
    if (shopData) {
        if(multiController){
            multiController.push(1,TABLE_SHOPDATA+":"+uuid, JSON.stringify(shopData))
            callback(true);
        }else{
            GameRedisHelper.setHashFieldValue(TABLE_SHOPDATA, uuid, JSON.stringify(shopData), () => {
              callback(true);
            });
        }
    } else {
        callback(false);
    }
}

function setShopData(uuid, shopData,multiController, callback, save=false)
{
    if (save) {
        saveShopDataFromSource(uuid, shopData,multiController, callback);
    } else {
        callback(false);
    }
}

// 商店数据初期化
function _initShopData(playerLevel, callback)
{
    var shopObj = { currRefDatePoint: 0 /** 当前刷新的时间点 */},
        refreshShopIdLis = GameMarketListConfig.getShopIdListByModeType(GameMarketListConfig.SHOP_MODE().REFRESH_SHOP);

    // 注：固定商店类型的数据存储为客户端发送商品信息来存储，不需要服务端生成，只需要判断
    // 生成刷新商店类型数据
    for (let shopId of refreshShopIdLis) {
        shopObj[shopId] = {
            menu: GameMarketConfig.getRandGoodsMenu(shopId, playerLevel), // 菜单
            refCount: 0 // 刷新次数
        }
    }

    callback(shopObj);
}

// 处理持续礼包
function doShopLongGift(uuid, shopData, callback)
{
    const _resetShopGiftGoods = (spData, goodsId) => {
        var persistShopIdLis = GameMarketListConfig.getShopIdListByModeType(GameMarketListConfig.SHOP_MODE().PERSIST_SHOP);
        for (let shopId of persistShopIdLis) {
            if (spData[shopId]) {
                for (let i in spData[shopId].menu) {
                    if (spData[shopId].menu[i].id === goodsId) {
                        spData[shopId].menu[i].buycnt = 0;
                        break;
                    }
                }
            }
        }
    }

    if (Array.isArray(shopData.longGiftList)) {
        // 有持续礼包
        var days = 0, now = new Date(), mailLis = [];
        for (let i in shopData.longGiftList) {
            if (shopData.longGiftList[i].dayCnt > 0) {
                // 持续礼包还未送完
                days = utils.getDays(shopData.longGiftList[i].st, now.getTime()); // 获得礼包经历的天数（玩家长时间不登陆的情况）
                var dt = new Date(shopData.longGiftList[i].st);
                for (let j = 0; j < days; j++) {
                    --shopData.longGiftList[i].dayCnt;

                    dt.setDate(dt.getDate() + 1);

                    mailLis.push(mailController.getLongGiftMailModel(shopData.longGiftList[i].giftId,
                        (7 - shopData.longGiftList[i].dayCnt), shopData.longGiftList[i].bonus, dt));

                    if (shopData.longGiftList[i].dayCnt === 0) {
                        break;
                    }
                }

                shopData.longGiftList[i].st = now.getTime(); // 重设时间记录点（用于处理玩家长时间不登录的情况）
            }

            if (shopData.longGiftList[i].dayCnt === 0) {
                // 遍历商店菜单，重置对应商品
                _resetShopGiftGoods(shopData, shopData.longGiftList[i].itemId);

                // 剔除已送完的持续礼包数据
                shopData.longGiftList.splice(i, 1);
            }
        }

        // 发送持续礼包邮件（多封）
        mailController.sendMultiMail(uuid, mailLis, () => {
            callback();
        });
    } else {
        // 无持续礼包可处理
        callback();
    }
}

// 重置固定商店（隔日）
function resetPersistShop(shopData)
{
    // 根据商品限购类型设置重置（buycnt）
    var persistShopIdLis = GameMarketListConfig.getShopIdListByModeType(GameMarketListConfig.SHOP_MODE().PERSIST_SHOP);
    for (let shopId of persistShopIdLis) {
        if (shopData[shopId]) {
            for (let i in shopData[shopId].menu) {
                // 限购处理（）
                var FS_Cycle = GameMarketConfig.getFlashSaleCycleObject(shopData[shopId].menu[i].id),
                    st = new Date(shopData[shopId].menu[i].st),
                    now = new Date(),
                    fsFlag, fsRet;

                [fsFlag, fsRet] = GameMarketConfig.checkFlashSaleCycle(shopData[shopId].menu[i].id, shopData[shopId].menu[i].buycnt);
                // console.warn("----------------------->>>", shopId, JSON.stringify(FS_Cycle), fsFlag, fsRet);
                if (fsFlag === 1) {
                    // 说明是判断限购标记
                    if (fsRet) {
                        // 需要判断周期（永久除外）
                        if (FS_Cycle.type === GameMarketConfig.FLASHSALE_CYCLE_TYPES().CYCLE_DAY) {
                            // 隔日（该接口隔日调用，直接重置）
                            shopData[shopId].menu[i].buycnt = 0;
                            shopData[shopId].menu[i].st = now.getTime();
                        } else if (FS_Cycle.type === GameMarketConfig.FLASHSALE_CYCLE_TYPES().CYCLE_WEEK) {
                            // 隔周
                            if (!utils.isSameWeek(st, now)) {
                                shopData[shopId].menu[i].buycnt = 0;
                                shopData[shopId].menu[i].st = now.getTime();
                            }
                        } else if (FS_Cycle.type === GameMarketConfig.FLASHSALE_CYCLE_TYPES().CYCLE_MONTH) {
                            // 隔月（判断月份）
                            if (now.getMonth() != new Date(st).getMonth()) {
                                shopData[shopId].menu[i].buycnt = 0;
                                shopData[shopId].menu[i].st = now.getTime();
                            }
                        }
                    } else {
                        // 限购且过时间的商品下架
                        shopData[shopId].menu.splice(i, 1);
                    }
                }
            }
        }
    }
}

// 重置刷新商店（隔日）
function resetRefershShop(shopData)
{
    var refreshShopIdLis = GameMarketListConfig.getShopIdListByModeType(GameMarketListConfig.SHOP_MODE().REFRESH_SHOP);
    for (let shopId of refreshShopIdLis) {
        if (shopData[shopId]) {
            shopData[shopId].refCount = 0; // 重置刷新次数
        }
    }
}

// 商店隔日重置
function shopDayReset(uuid,multiController, callback, save=false)
{
    getShopData(uuid, shopData => {
        resetPersistShop(shopData);
        resetRefershShop(shopData);
        doShopLongGift(uuid, shopData, () => {
            setShopData(uuid, shopData, multiController,() => {
                callback(shopData);
            }, save);
        });
    });
}

// 是否为固定商店
function isPersistShop(shopId)
{
    return GameMarketListConfig.checkShopMode(shopId, GameMarketListConfig.SHOP_MODE().PERSIST_SHOP);
}

// 是否为刷新商店
function isRefreshShop(shopId)
{
    return GameMarketListConfig.checkShopMode(shopId, GameMarketListConfig.SHOP_MODE().REFRESH_SHOP);
}

// 刷新次数是否达到上限
function isRefCountMax(shopId, refCount)
{
    var sysId;
    if (shopId === 2) {
        sysId = GameBuyCountConfig.SYSID().REFRESH_SHOP1;
    } else if (shopId === 3) {
        sysId = GameBuyCountConfig.SYSID().REFRESH_SHOP2;
    } else {
        sysId = 0;
    }

    return (refCount > GameBuyCountConfig.getCountMax(sysId));
}

// 获取刷新消耗（手动）
function getRefreshCost(shopId, refCount)
{
    var sysId;
    if (shopId === 2) {
        sysId = GameBuyCountConfig.SYSID().REFRESH_SHOP1;
    } else if (shopId === 3) {
        sysId = GameBuyCountConfig.SYSID().REFRESH_SHOP2;
    } else {
        sysId = 0;
    }

    return GameBuyCountConfig.getCost(sysId, refCount);
}

// 商店菜单刷新
function shopMenuRefersh(uuid, playerLevel, shopId,multiController, callback, shopData=null, auto=false)
{
    // 判断是否刷新
    function _checkRefresh(sdata, sid, isAuto)
    {
        if (isAuto) {
            // 自动刷新（需要判断时间点）
            var openHour = new Date().getHours();
            if (sdata.currRefDatePoint === openHour) {
                // 说明当前时间点已经刷新过了
                return false;
            } else {
                var valid = GameMarketListConfig.checkRefreshDatePoint(sid);
                /*
                if (valid) {
                    sdata.currRefDatePoint = openHour; // 记录可刷新的时间点
                }*/

                return valid;
            }
        } else {
            // 手动刷新（直接刷新列表）
            return true;
        }
    }

    var save = shopData ? false : true,
        shopIdLis = (shopId === 0 ? GameMarketListConfig.getShopIdListByModeType(GameMarketListConfig.SHOP_MODE().REFRESH_SHOP) : [shopId]);
    getShopData(uuid, shopData => {
        for (let iShopId of shopIdLis) {
            if (shopData[iShopId]) {
                if (_checkRefresh(shopData, iShopId, auto)) {
                    shopData[iShopId] = {
                        menu: GameMarketConfig.getRandGoodsMenu(iShopId, playerLevel), // 菜单
                        refCount: 0 // 刷新次数
                    }
                }
            }
        }

        shopData.currRefDatePoint = new Date().getHours();

        setShopData(uuid, shopData, multiController,() => {
            callback(shopData);
        }, save);
    }, shopData);
}

// 验证商品
function checkShopGoods(uuid, shopId, grid, goodsId, goodsCount, callback, shopData=null)
{
    getShopData(uuid, shopData => {
        var valid = false;
        if (shopData[shopId]) {
            var fsFlag, fsRet;
            if (isRefreshShop(shopId)) {
                // 刷新商店
                for (let i in shopData[shopId].menu) {
                    [fsFlag, fsRet] = GameMarketConfig.checkFlashSaleCycle(shopData[shopId].menu[i].id, shopData[shopId].menu[i].buycnt+goodsCount);
                    if (shopData[shopId].menu[i].grid === grid && fsRet) {
                        valid = true; // 找到该商品
                        break;
                    }
                }
            } else {
                // 固定商店
                var isFind = false;
                for (let i in shopData[shopId].menu) {
                    if (shopData[shopId].menu[i].id === goodsId) {
                        isFind = true;
                        [fsFlag, fsRet] = GameMarketConfig.checkFlashSaleCycle(shopData[shopId].menu[i].id, shopData[shopId].menu[i].buycnt+goodsCount);
                        if (fsRet) {
                            valid = true; // 可继续购买
                            break;
                        }
                    }
                }

                if (!isFind) {
                    // 未在存储列表中找到相关商品ID，需要对其进行合法性验证
                    valid = (GameMarketConfig.getGoodsType(goodsId) > 0);
                }
            }

            callback(valid);
        } else {
            if (isPersistShop(shopId)) {
                // 是固定商店需要验证商品ID的合法性
                valid = (GameMarketConfig.getGoodsType(goodsId) > 0);
            }

            callback(valid);
        }
    }, shopData);
}

// 商店购买
function shopBuyGoods(uuid, shopId, grid, goodsId, goodsCount, callback, shopData=null)
{
    getShopData(uuid, shopData => {
        if (isPersistShop(shopId)) {
            // 固定商店
            var menuNode = { id: goodsId, buycnt: goodsCount, grid: 0, st: new Date().getTime() /** st 用于隔日商店限购刷新判断 */ };
            if (shopData[shopId]) {
                var isFind = false;
                for (let i in shopData[shopId].menu) {
                    if (shopData[shopId].menu[i].id === goodsId) {
                        shopData[shopId].menu[i].buycnt += goodsCount;
                        isFind = true;
                        break;
                    }
                }

                if (!isFind) {
                    shopData[shopId].menu.push(menuNode);
                }
            } else {
                shopData[shopId] = {
                    menu: [menuNode],
                    refCount: 0
                }
            }
        } else if (isRefreshShop(shopId)) {
            // 刷新商店
            if (shopData[shopId]) {
                for (let i in shopData[shopId].menu) {
                    if (shopData[shopId].menu[i].grid === grid) {
                        shopData[shopId].menu[i].buycnt += goodsCount;
                        break;
                    }
                }
            }
        } else {
            // 其他商店
            // NOTHING TO DO.
        }

        callback(shopData);
    }, shopData);
}

exports.getShopDataFromSource = getShopDataFromSource;
exports.saveShopDataFromSource = saveShopDataFromSource;
exports.shopDayReset = shopDayReset;
exports.isPersistShop = isPersistShop;
exports.isRefreshShop = isRefreshShop;
exports.isRefCountMax = isRefCountMax;
exports.getRefreshCost = getRefreshCost;
exports.shopMenuRefersh = shopMenuRefersh;
exports.checkShopGoods = checkShopGoods;
exports.shopBuyGoods = shopBuyGoods;
