// ==========================================================
// 礼包配置表
// ==========================================================
const utils = require('./../common/utils');
const GeneralAwardConfig = require('./../scripts/controllers/fixedController').GeneralAwards;
let FIXED_GIFTITEMS = null;

class GiftItemConfig
{
    static GIFT_TYPES()
    {
        return {
            GF_NORMAL: 1,   // 普通礼包
            GF_RANDOM: 2,   // 随机礼包
            GF_LONG: 3      // 持续礼包
        }
    }

    // 是否为礼包
    static isGift(itemId)
    {
        if(!FIXED_GIFTITEMS){FIXED_GIFTITEMS = global.FIXDB.FIXED_GIFTITEMS}
        var node = FIXED_GIFTITEMS[itemId];
        return (node ? node.Type > 0 : 0);
    }

    /**
     * getType - 获取礼包获得类型（0 直接获取 1 加入背包）
     * @param {Number} itemId
     */
    static getGetType(itemId)
    {
        if(!FIXED_GIFTITEMS){FIXED_GIFTITEMS = global.FIXDB.FIXED_GIFTITEMS}
        var node = FIXED_GIFTITEMS[itemId];
        return (node ? node.GetType : 1);
    }

    // 获取通用礼包（旧）
    static getAwards(itemId, itemCount)
    {
        if(!FIXED_GIFTITEMS){FIXED_GIFTITEMS = global.FIXDB.FIXED_GIFTITEMS}
        var node = FIXED_GIFTITEMS[itemId];
        if (node) {
            return utils.randomListByWeight(utils.getHashArraySplitTwice(node.Bonus, '|', ','), itemCount);
        } else {
            console.warn("[GiftItemConfig][getAwards] Can't find gift item:", itemId);
            return null;
        }
    }

    // 解开礼包
    static undoGift(itemId, itemCount)
    {
        if(!FIXED_GIFTITEMS){FIXED_GIFTITEMS = global.FIXDB.FIXED_GIFTITEMS}
        var node = FIXED_GIFTITEMS[itemId];
        if (node) {
            var Bonus = utils.getHashArraySplitTwice(node.Bonus, '|', ','),
                bonusItemLis = [],
                longBonusItemLis = null,
                dayCount = 0,
                bonusLis;
            if (node.Type === GiftItemConfig.GIFT_TYPES().GF_NORMAL) {
                // 普通礼包
                bonusLis = utils.randomListByWeight(Bonus, itemCount);
                for (let awardId of bonusLis) {
                    bonusItemLis = GeneralAwardConfig.getBonusItemList(awardId, bonusItemLis);
                }
            } else if (node.Type === GiftItemConfig.GIFT_TYPES().GF_RANDOM) {
                // 随机礼包
                bonusLis = utils.randomListByWeight(Bonus, itemCount * node.RdmBonusCount);
                for (let awardId of bonusLis) {
                    bonusItemLis = GeneralAwardConfig.getBonusItemList(awardId, bonusItemLis);
                }
            } else if (node.Type === GiftItemConfig.GIFT_TYPES().GF_LONG) {
                // 持续礼包
                // 立即获得物品
                bonusLis = utils.randomListByWeight(Bonus, itemCount);
                for (let awardId of bonusLis) {
                    bonusItemLis = GeneralAwardConfig.getBonusItemList(awardId, bonusItemLis);
                }
                // 持续获得物品
                bonusLis = utils.randomListByWeight(utils.getHashArraySplitTwice(node.LongBonus, '|', ','), itemCount);
                longBonusItemLis = [];
                for (let awardId of bonusLis) {
                    longBonusItemLis = GeneralAwardConfig.getBonusItemList(awardId, longBonusItemLis);
                }
            }

            return {
                bonus: bonusItemLis, // 礼包奖励
                longBonus: longBonusItemLis, // 持续礼包奖励
                longDayCount: node.DayCount // 持续礼包持续天数
            }
        } else {
            return null;
        }
    }
}

module.exports = GiftItemConfig;
