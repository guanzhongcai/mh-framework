// ==========================================================
// 游戏商城配置表
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
const GiftItemConfig = require('./GiftItems');

let FIXED_GAMEMARKETLIST = null

class GameMarketListConfig
{
    static SHOP_MODE() {
        return {
            PERSIST_SHOP: 1, // 固定商店
            REFRESH_SHOP: 2, // 刷新商店
            SKIN_SHOP: 3,    // 皮肤商店
            DEPOSIT_SHOP: 4, // 充值商店
            REDEEM_SHOP: 5,  // 兑换商店
        }
    }

    // 根据商店模式获取商店ID列表
    static getShopIdListByModeType(shopModeType)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var shopIds = Object.keys(FIXED_GAMEMARKETLIST), node, lis = [];
        for (let sShopId of shopIds) {
            node = FIXED_GAMEMARKETLIST[sShopId];
            if (node != null && node.ModeType === shopModeType && GameMarketListConfig.checkOpenDate(sShopId)) {
                lis.push(node.ShopID);
            }
        }

        return lis;
    }

    // 判断商店开放时间
    static checkOpenDate(shopId)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var node = FIXED_GAMEMARKETLIST[shopId];
        if (node) {
            var now = new Date();
            var st = (node.StartDate == '' ? now : new Date(node.StartDate)),
                et = (node.EndDate == '' ? now : new Date(node.EndDate)),
                now = new Date();
            return (now >= st && now <= et);
        } else {
            console.warn("[GameMarketListConfig][checkOpenDate] Can't find shop:", shopId);
            return false;
        }
    }

    // 判断商店刷新时间点（仅刷新商店）
    static checkRefreshDatePoint(shopId)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var node = FIXED_GAMEMARKETLIST[shopId];
        if (node) {
            var valid = false, openHour = new Date().getHours().toString();

            if (node.ModeType === GameMarketListConfig.SHOP_MODE().REFRESH_SHOP &&
                    node.RefreshDatePoint.includes(',')) {
                var dateLis = node.RefreshDatePoint.split(',');
                valid = (dateLis.filter((a) => { return a === openHour; }).length > 0);
            }

            return valid;
        } else {
            console.warn("[GameMarketListConfig][checkRefreshDatePoint] Can't find shop:", shopId);
            return false;
        }
    }

    // 判断商店模式
    static checkShopMode(shopId, modeType)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var node = FIXED_GAMEMARKETLIST[shopId];
        return (node ? (node.ModeType === modeType) : false);
    }

    // 获取商店商品格数（仅刷新商店）
    static getGridCount(shopId)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var node = FIXED_GAMEMARKETLIST[shopId];
        return (node ? node.GridCount : 0);
    }

    // 获取刷新商品限制对象（仅刷新商店）
    static getRefreshGoodsLimitObject(shopId)
    {
        if(!FIXED_GAMEMARKETLIST){FIXED_GAMEMARKETLIST= global.FIXDB.FIXED_GAMEMARKETLIST}
        var node = FIXED_GAMEMARKETLIST[shopId], obj = {};
        if (node) {
            if (node.RefCateLimit.includes(',')) {
                var chunks = node.RefCateLimit.split('|'), tmps;
                for (let chunk of chunks) {
                    tmps = chunk.split(',');
                    obj[tmps[0]] = Number(tmps[1]);
                }
            }
        } else {
            console.warn("[GameMarketListConfig][getRefreshGoodsLimitObject] Can't find shop:", shopId);
        }

        return obj;
    }
}

let FIXED_GAMEMARKET = null
let FIXED_GAMEMARKET_INDEXES = null;

class GameMarketConfig
{
    // 限时类型
    static FLASHSALE_TYPES() {
        return {
            FS_BUY: 1,      // 限时购买
            FS_PAYOFF: 2    // 限时折扣
        }
    }

    // 商品限购类型
    static FLASHSALE_CYCLE_TYPES()
    {
        return {
            CYCLE_FOREVER: 1,   // 永久
            CYCLE_DAY: 2,       // 每日
            CYCLE_WEEK: 3,      // 每周
            CYCLE_MONTH: 4      // 每月
        }
    }

    /**
     * getOriginCostByItemList - 根据物品列表获取消耗（原生）
     * @param {*} itemLis
     */
    static getOriginCostByItemList(itemLis)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        if(!FIXED_GAMEMARKET_INDEXES){FIXED_GAMEMARKET_INDEXES= global.FIXDB.FIXED_GAMEMARKET_INDEXES}
        if (Array.isArray(itemLis)) {
            var goodsIdLis = [], goodsId;
            for (let item of itemLis) {
                goodsId = FIXED_GAMEMARKET_INDEXES['ItemID' + item.id.toString()];
                if (Array.isArray(goodsId) && goodsId.length > 0) {
                    goodsId = goodsId[0]; // 第一个元素为商品ID
                    goodsIdLis.push({
                        goodsId: goodsId,
                        goodsCount: item.count
                    });
                }
            }

            var node, costLis = [];
            for (let goods of goodsIdLis) {
                node = FIXED_GAMEMARKET[goods.goodsId];
                if (node) {
                    costLis.push({
                        id: node.CostID,
                        count: node.CostValue * goods.goodsCount
                    });
                } else {
                    costLis = null;
                    console.warn("[GameMarketConfig][getOriginCostByItemList] Can't find goods data:", goods);
                    break;
                }
            }

            if (costLis === null) {
                return null;
            } else {
                return categoryFromItemList(costLis);
            }
        } else {
            console.warn("[GameMarketConfig][getOriginCostByItemList] Parameter item list is not an array type:", itemLis);
            return null;
        }

    }

    // 获取购买消耗
    static getCost(goodsId, goodsCount)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            var newCostCount = 0;
            if (GameMarketConfig.isFlashSalePayOff(goodsId)) {
                // 限时商品有折扣且在打折期间
                newCostCount = node.PayOffCostValue * goodsCount;
            } else {
                newCostCount = node.CostValue * goodsCount;
            }
            return categoryFromItemList([ { id: node.CostID, count: newCostCount } ]);
        } else {
            console.warn("[GameMarketConfig][getCost] Can't find goods:", goodsId, goodsCount);
            return null;
        }
    }

    // 获取商品关联的物品ID和消耗ID
    static getGoodsItemIdAndCostId(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            return [node.ItemID, node.CostID];
        } else {
            console.warn("[GameMarketConfig][getGoodsItemIdAndCostId] Can't find goods:", goodsId);
            return [null, null];
        }
    }

    // 商品类型
    static getGoodsType(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        return (node ? node.GoodsType : 0);
    }

    // 商店类型
    static getShopType(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        return (node ? node.ShopType : 0);
    }

    // 礼包获得类型(0 直接获得 1 加入背包)
    /*
    static getGiftGetType(goodsId)
    {
        var node = FIXED_GAMEMARKET[goodsId];
        return (node ? node.GiftGetType : 0);
    }*/

    // 获取皮肤商品
    static getSkinGoods(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            return [node.ItemValue, node.ItemID];
        } else {
            console.warn("[GameMarketConfig][getSkinGoods] Can't find goods:", goodsId);
            return [0, 0];
        }
    }

    static getItemGoods(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            return { id: node.ItemID, count: node.ItemCount };
        } else {
            console.warn("[GameMarketConfig][getItemGoods] Can't find goods:", goodsId);
            return { id: 0, count: 0 };
        }
    }

    static getGoods(goodsId, goodsCount)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            if (GiftItemConfig.isGift(node.ItemID)) {
                // 是礼包
                return [1, { id: node.ItemID, count: node.ItemCount*goodsCount }];
            } else {
                return [2, categoryFromItemList([{ id: node.ItemID, count: node.ItemCount*goodsCount }])];
            }
        } else {
            console.warn("[GameMarketConfig][getGoods] Can't find goods:", goodsId);
            return [0, null];
        }
    }

    // 是否是限时打折
    static isFlashSalePayOff(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            if (node.PayOffCostValue > 0) {
                if (node.FlashSaleType === GameMarketConfig.FLASHSALE_TYPES().FS_PAYOFF) {
                    // 是限时的折扣
                    var now = new Date(),
                        st = (node.FlashSaleStartDate === '' ? now : new Date(node.FlashSaleStartDate)),
                        et = (node.FlashSaleEndDate === '' ? now : new Date(node.FlashSaleEndDate));
                    return (now >= st && now <= et);
                } else {
                    // 非限时折扣
                    return true;
                }
            } else {
                return false;
            }
        } else {
            console.warn("[GameMarketConfig][isFlashSalePayOff] Can't find goods:", goodsId);
            return false;
        }
    }

    // 是否为限购商品
    static isFlashSaleCycle(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        return (node.FlashSaleType === GameMarketConfig.FLASHSALE_TYPES().FS_BUY);
    }

    // 判断限购
    static checkFlashSaleCycle(goodsId, buyCount)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        // [限购判断标记（1 是 0 否）, 判断状态]
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            var FS_Cycle = GameMarketConfig.getFlashSaleCycleObject(goodsId);
            if (node.FlashSaleType === GameMarketConfig.FLASHSALE_TYPES().FS_BUY) {
                // 配置了限时类型和配置了商品限购
                var now = new Date(),
                    st = (node.FlashSaleStartDate === '' ? now : new Date(node.FlashSaleStartDate)),
                    et = (node.FlashSaleEndDate === '' ? now : new Date(node.FlashSaleEndDate));
                if (now >= st && now <= et) {
                    // 在限购期间
                    if (FS_Cycle && FS_Cycle.type != 0) {
                        return [1, (buyCount <= FS_Cycle.value)];
                    } else {
                        return [1, true];
                    }
                } else {
                    // 非限购期间，下架
                    return [1, false];
                }
            } else {
                if (FS_Cycle && FS_Cycle.type != 0) {
                    // 只配置了商品限购
                    return [1, (buyCount <= FS_Cycle.value)];
                } else {
                    // 非限购类直接pass
                    return [0, true];
                }
            }
        } else {
            return [0, false];
        }
    }

    // 获取商品限购对象
    static getFlashSaleCycleObject(goodsId)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        var node = FIXED_GAMEMARKET[goodsId];
        if (node) {
            if (node.FlashSaleCountCycle === '') {
                return { type: 0, value: 0 };
            } else {
                var tmps = node.FlashSaleCountCycle.split(',');
                return { type: Number(tmps[0]), value: Number(tmps[1]) };
            }
        } else {
            console.warn("[GameMarketConfig][getFlashSaleCycleObject] Can't find goods", goodsId);
            return null;
        }
    }

    // 获取随机商品菜单
    static getRandGoodsMenu(shopId, playerLevel)
    {
        if(!FIXED_GAMEMARKET){FIXED_GAMEMARKET= global.FIXDB.FIXED_GAMEMARKET}
        if(!FIXED_GAMEMARKET_INDEXES){FIXED_GAMEMARKET_INDEXES= global.FIXDB.FIXED_GAMEMARKET_INDEXES}
        // 判断等级区间
        function _checkPlayerLevel(lvLimit, lv) {
            if (lvLimit.includes(',')) {
                var lmt = lvLimit.split(',');
            return (lv >= Number(lmt[0]) && lv <= Number(lmt[1]));
            } else {
                return true;
            }
        }

        // 获取商品随机池
        function _getRandGoodsPool(goodsIdLis, plrLv)
        {
            var lis = [], node;
            if (goodsIdLis) {
                for (let goodsId of goodsIdLis) {
                    node = FIXED_GAMEMARKET[goodsId];
                    if (node) {
                        if (_checkPlayerLevel(node.LevelLimit, plrLv)) {
                            lis.push({
                                k: node.GoodsID,
                                v: node.RandWeight
                            });
                        }
                    }
                }
            }

            return lis;
        }

        // 判断商品商品分类限制
        function _checkGoodsCateLimit(obj, cateType) {
            if (cateType === 0) {
                return true;
            } else {
                if ('number' === typeof obj[cateType]) {
                    var valid = (obj[cateType] > 0);
                    obj[cateType] -= 1; // 削减限制剩余次数
                    return valid;
                } else {
                    return true;
                }
            }
        }

        function _clearRandGoodsPoolByCateType(rdmGoodsPool, cateType)
        {
            var node;
            for (let i in rdmGoodsPool) {
                node = FIXED_GAMEMARKET[rdmGoodsPool[i].k];
                if (node && node.ShopRefCateType === cateType) {
                    rdmGoodsPool.splice(i, 1);
                }
            }
        }

        // menu = [{id, buycnt}, ...]
        var menu = [],
            randGoodsPool = _getRandGoodsPool(FIXED_GAMEMARKET_INDEXES['ShopType' + shopId], playerLevel),
            GridCount = GameMarketListConfig.getGridCount(shopId),
            cateType,
            GoodsCateLimitObj = GameMarketListConfig.getRefreshGoodsLimitObject(shopId),
            goodsId,
            safeCounter = 99999,
            counter = 0;

        while (GridCount) {
            goodsId = utils.randomListByWeight(randGoodsPool, 1)[0];
            if (FIXED_GAMEMARKET[goodsId]) {
                cateType = FIXED_GAMEMARKET[goodsId].ShopRefCateType;
                if (_checkGoodsCateLimit(GoodsCateLimitObj, cateType)) {
                    --GridCount;

                    menu.push({
                        id: goodsId, // 商品ID
                        buycnt: 0, // 购买次数
                        grid: counter + 1 // 格子ID
                    });

                    if ('number' === GoodsCateLimitObj[cateType] && GoodsCateLimitObj[cateType] === 0) {
                        // 说明没有限制的剩余的次数，清除随机池中对应商品分类类型的商品ID
                        _clearRandGoodsPoolByCateType(randGoodsPool, cateType);
                    }
                }
            } else {
                console.warn("[GameMarket][getRandGoodsMenu] Goods is not find:", shopId, goodsId, randGoodsPool);
                break;
            }

            if (++counter > safeCounter) {
                break;
            }
        }

        return menu;
    }
}

exports.GameMarketListConfig = GameMarketListConfig;
exports.GameMarketConfig = GameMarketConfig;
