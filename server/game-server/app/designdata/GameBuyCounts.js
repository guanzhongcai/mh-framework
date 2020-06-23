// ==========================================================
// 游戏次数购买配置表
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
let FIXED_GAMEBUYCOUNTS = null
let FIXED_GAMEBUYCOUNTS_INDEXES = null

class GameBuyCountConfig
{
    static SYSID() {
        return {
            SHORT_ORDER: 3,
            REFRESH_SHOP1: 4,
            REFRESH_SHOP2: 5,
            LONG_ORDER:7
        }
    }

    // 获得消耗
    static getCost(sysId, count)
    {
        if (sysId === 0)
            return null;
        if(!FIXED_GAMEBUYCOUNTS){FIXED_GAMEBUYCOUNTS = global.FIXDB.FIXED_GAMEBUYCOUNTS}
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var idLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + sysId],
            node,
            costData = null;
        for (let id of idLis) {
            node = FIXED_GAMEBUYCOUNTS[id];
            if (node && node.BuyCount === count) {
                costData = categoryFromItemList(utils.getItemArraySplitTwice(node.Cost, '|', ','));
                break;
            }
        }

        return costData;
    }

    // 获得最大次数
    static getCountMax(sysId)
    {
        if(!FIXED_GAMEBUYCOUNTS){FIXED_GAMEBUYCOUNTS = global.FIXDB.FIXED_GAMEBUYCOUNTS}
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var idLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + sysId], node = null;
        if (idLis) {
            node = FIXED_GAMEBUYCOUNTS[idLis[idLis.length - 1]];
        }

        return (node ? node.BuyCount : 0);
    }

    static getShortOrderBuyCountMax()
    {
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var lis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + GameBuyCountConfig.SYSID().SHORT_ORDER];
        return lis ? lis.length : 0;
    }

    static getLongOrderBuyCountMax()
    {
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var lis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + GameBuyCountConfig.SYSID().LONG_ORDER];
        return lis ? lis.length : 0;
    }

    static getShortOrderBuyCostAndValue(count)
    {
        if(!FIXED_GAMEBUYCOUNTS){FIXED_GAMEBUYCOUNTS = global.FIXDB.FIXED_GAMEBUYCOUNTS}
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var idLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + GameBuyCountConfig.SYSID().SHORT_ORDER],
            node,
            costData = null,
            valParam = 0;
        for (let id of idLis) {
            node = FIXED_GAMEBUYCOUNTS[id];
            if (node && node.BuyCount === count) {
                costData = categoryFromItemList(utils.getItemArraySplitTwice(node.Cost, '|', ','));
                valParam = node.Param ? node.Param : 0;
                break;
            }
        }

        return { Cost: costData, Value: valParam };
    }
}

module.exports = GameBuyCountConfig;
