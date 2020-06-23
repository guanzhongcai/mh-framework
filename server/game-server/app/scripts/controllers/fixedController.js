const utils = require('./../../common/utils');
const models = require('./../models');
const _ = require('lodash')

let FIXED_ITEMS = null
let FIXED_ITEMS_INDEXES = null

function GetMaxLevel ()
{
    return 60;
}

function item2currency(itemId, itemCount)
{
    if (itemId == 410001) { // 铜板（金币）
        return { type:1, num:itemCount };
    } else if (itemId == 410002) { // 独玉（钻石）
        return { type:2, num:itemCount };
    } else if (itemId == 410004) { // 饱食值
        return { type:3, num:itemCount };
    } else {
        return null;
    }
}

/**
 * getCurrencyToItemList - 货币转物品列表
 * @param {*} currency
 */
function getCurrencyToItemList(currency)
{
    var lis = [];
    if (currency[0] > 0) lis.push({ id: 410001, count: currency[0] });
    if (currency[1] > 0) lis.push({ id: 410002, count: currency[1] });
    if (currency[2] > 0) lis.push({ id: 410004, count: currency[2] });

    return lis;
}

function categoryFromItemList(itemLis)
{
    if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
    var linggAp = 0,
        gachaCount = 0,
        skillChargingPoint = 0,
        items = [],
        skinitems = [],
        currency = [0,0,0],
        heros = [],
        buff = []
        attrs = {
            energy: 0,  // 体力
            feel: 0,    // 魂力
            cleany: 0,  // 清洁度
            jiaoy: 0,   // 交游
            emotion: 0, // 情感
            hungry: 0,  // 饥饿度
            lingg: 0,   // 灵感
            exp: 0,     // 亲密度
            skillpoint: 0, // 技能点（熟练度）
        },
        activeDegreeValue = 0; // 活跃度

    for (let i in itemLis) {
        var itemId = itemLis[i].id,
            itemCount = itemLis[i].count;

        if (itemId === 410001) {
            // 金币
            currency[0] += itemCount;
        } else if (itemId === 410002) {
            // 独玉
            currency[1] += itemCount;
        } else if (itemId === 410004) {
            // 饱食度
            currency[2] += itemCount;
        } else if (itemId === 412065) {
            // 探索
            gachaCount += itemCount;
        } else if (itemId === 412067) {
            // 灵感
            linggAp += itemCount;
        } else if (itemId >= 310001 && itemId <= 310026) {
            // 墨魂
            heros.push({ hid: itemId, count: itemCount });
        } else if (itemId >= 410005 && itemId <= 410028) {
            // 墨魂属性
            if (itemId === 410005) {
                // 体力
                attrs.energy += itemCount;
            } else if (itemId === 410007) {
                // 亲密度
                attrs.exp += itemCount;
            } else if (itemId === 410011) {
                // 交游
                attrs.jiaoy += itemCount;
            } else if (itemId === 410013) {
                // 饥饿度
                attrs.hungry += itemCount;
            } else if (itemId === 410020) {
                // 清洁度
                attrs.cleany += itemCount;
            } else if (itemId === 410022) {
                // 情感
                attrs.emotion += itemCount;
            } else if (itemId === 410025) {
                // 魂力
                attrs.feel += itemCount;
            } else if (itemId === 410027) {
                // 灵感
                attrs.lingg += itemCount;
            }
        } else if (itemId === 410033) {
            // 天赋点
        } else if (itemId === 410034) {
            // 技能熟练度
            if (attrs.skillpoint) {
                attrs.skillpoint += itemCount;
            } else {
                attrs.skillpoint = itemCount;
            }
        }else if (itemId === 410035) {
            skillChargingPoint += itemCount;
        }else if (itemId === 412119) {
            activeDegreeValue += itemCount;
        } else if (itemId >= 1000001 && itemId <= 1100000){
            buff.push({id:itemId,count:itemCount})
        } else {
            var node = FIXED_ITEMS[itemId];
            if (node) {
                if (node.type === Items.TYPES().HERO_SKIN && node.subType === 1) {
                    // 皮肤道具
                    skinitems.push({ id: itemId, count: itemCount });
                } else {
                    // 纯道具
                    items.push({ id: itemId, count: itemCount });
                }
            } else {
                // 纯道具
                items.push({ id: itemId, count: itemCount });
            }
        }
    }

    return {
        linggAp: linggAp,
        skillChargingPoint:skillChargingPoint,
        gachaCount: gachaCount,
        items: items,
        skinitems: skinitems,
        currency: currency,
        heros: heros,
        attrs: attrs,
        buff:buff,
        activeDegreeValue: activeDegreeValue
    }
}

function categoryFromItemListEx(obj, items)
{
    if (!obj.items) obj.items = [];
    if (!obj.heros) obj.heros = [];
    if (!obj.currency) obj.currency = [0, 0, 0];
    if (!obj.exp) obj.exp = 0;
    if (!obj.skillChargingPoint) obj.skillChargingPoint = 0;
    if (!obj.activeDegreeValue) obj.activeDegreeValue = 0;
    if (!obj.attrs) {
        obj.attrs = {
            energy: 0,  // 体力
            feel: 0,    // 魂力
            cleany: 0,  // 清洁度
            jiaoy: 0,   // 交游
            emotion: 0, // 情感
            hungry: 0,  // 饥饿度
            lingg: 0,   // 灵感
            exp: 0,     // 亲密度
            skillpoint: 0, // 技能点（熟练度）
        }
    }

    for (let i = 0; i < items.length; i++) {
        var c = item2currency(items[i].id, items[i].count);
        if (c) {
            // 是货币
            obj.currency[c.type-1] += c.num;
        } else if (items[i].id >= 310001 && items[i].id <= 310026) {
            // 是墨魂
            obj.heros.push({ hid: items[i].id, count: items[i].count });
        } else if (items[i].id === 412065) {
            // 探索次数
        }else if (items[i].id === 412067) {
            // 灵感行动力
        }else if (items[i].id >= 410005 && items[i].id <= 410028){
            // 墨魂属性
            var itemId = items[i].id, itemCount = items[i].count;
            if (itemId === 410005) {
                // 体力
                obj.attrs.energy += itemCount;
            } else if (itemId === 410007) {
                // 亲密度
                obj.attrs.exp += itemCount;
            } else if (itemId === 410011) {
                // 交游
                obj.attrs.jiaoy += itemCount;
            } else if (itemId === 410013) {
                // 饥饿度
                obj.attrs.hungry += itemCount;
            } else if (itemId === 410020) {
                // 清洁度
                obj.attrs.cleany += itemCount;
            } else if (itemId === 410022) {
                // 情感
                obj.attrs.emotion += itemCount;
            } else if (itemId === 410025) {
                // 魂力
                obj.attrs.feel += itemCount;
            } else if (itemId === 410027) {
                // 灵感
                obj.attrs.lingg += itemCount;
            }
        } else if (items[i].id === 410033) {
            // 天赋点
        } else if (items[i].id === 410034) {
            // 技能熟练度
            if (obj.attrs.skillpoint) {
                obj.attrs.skillpoint += items[i].count;
            } else {
                obj.attrs.skillpoint = items[i].count;
            }
        }else if (items[i].id === 410035) {
            obj.skillChargingPoint += items[i].count;
        }else if (items[i].id === 412119) {
            obj.activeDegreeValue += items[i].count;
        } else {
            // 道具
            obj.items.push({ id: items[i].id, count: items[i].count });
        }
    }
    return obj;
}

let FIXED_BUILDINGMARKET = null
class BuildingMarket
{
    static getCostConfig(id, callback)
    {
        if(!FIXED_BUILDINGMARKET){FIXED_BUILDINGMARKET = global.FIXDB.FIXED_BUILDINGMARKET}
        var node = FIXED_BUILDINGMARKET[id];
        callback(categoryFromItemList([{ id: node.CostItemID, count: node.CostValue }]));
    }

    static getNeedLevel(id, callback)
    {
        if(!FIXED_BUILDINGMARKET){FIXED_BUILDINGMARKET = global.FIXDB.FIXED_BUILDINGMARKET}
        callback(FIXED_BUILDINGMARKET[id].NeedLevel);
    }
}

let FIXED_BUILDINGINFO = null;
class BuildingInfo
{
    // 是否可以修复
    static isRepair(id, callback)
    {
        if(!FIXED_BUILDINGINFO){FIXED_BUILDINGINFO = global.FIXDB.FIXED_BUILDINGINFO}
        callback(FIXED_BUILDINGINFO[id] ? FIXED_BUILDINGINFO[id].isRepair > 0 : false);
    }

    /**
     * getStockObject - 获取家具配置
     * @param {Array} stockIdLis
     */
    static getStockObject(stockIdLis)
    {
        if(!FIXED_BUILDINGINFO){FIXED_BUILDINGINFO = global.FIXDB.FIXED_BUILDINGINFO}
        var obj = {}, node;
        for (var stockId of stockIdLis) {
            node = FIXED_BUILDINGINFO[stockId];
            if (node) {
                obj[stockId]  = node;
            }
        }
        return obj;
    }
}

let FIXED_HEROLEVELUP = null
class HeroLevelUp
{
    static getMinExp(level, callback)
    {
        if(!FIXED_HEROLEVELUP){FIXED_HEROLEVELUP = global.FIXDB.FIXED_HEROLEVELUP}
        callback(FIXED_HEROLEVELUP[level].minExp);
    }

    static getMaxExp(level, callback)
    {
        if(!FIXED_HEROLEVELUP){FIXED_HEROLEVELUP = global.FIXDB.FIXED_HEROLEVELUP}
        callback(FIXED_HEROLEVELUP[level].maxExp);
    }
}

let FIXED_HEROLEVELUPTERMANDBONUS = null
class HeroLevelUpTermAndBonus
{
    static ATTRTYPES()
    {
       return {
           EXP: 1,      // 亲密度
           EMOTION: 2,  // 情感
           JIAOY: 3,    // 交游
           FEEL: 4,     // 魂力
           ENERGY: 5,   // 体力
           CLEANY: 6,   // 清洁度
           HUNGRY: 7,   // 饥饿度
           LINGG: 8     // 灵感
       }
    }

    static getHeroAttrConfig(heroLevel, callback)
    {
        if(!FIXED_HEROLEVELUPTERMANDBONUS){FIXED_HEROLEVELUPTERMANDBONUS = global.FIXDB.FIXED_HEROLEVELUPTERMANDBONUS}
        var idxKeyLis = Object.keys(FIXED_HEROLEVELUPTERMANDBONUS),
            field = 'bonusLv' + heroLevel,
            heroMap = new Map();
        for (let sHeroId of idxKeyLis) {
            var chunks = utils.splitToIntArray(FIXED_HEROLEVELUPTERMANDBONUS[sHeroId][field], ',');
            var heroAttrDefault = models.HeroAttrModel();
            heroAttrDefault.level       = 1;
            heroAttrDefault.feel        = chunks[0];
            heroAttrDefault.exp         = chunks[1];
            heroAttrDefault.lingg       = chunks[2];
            heroAttrDefault.skillpoint  = chunks[3];
            heroAttrDefault.energy      = chunks[4];
            heroAttrDefault.emotion     = chunks[5];
            heroMap.set(parseInt(sHeroId), heroAttrDefault);
        }

        callback(heroMap);
    }

    // 默认属性区间配置
    static getHeroAttrLimitsDefaultConfig(heroId, heroLevel, callback)
    {
        /*
            魂力
            亲密
            灵感
            技能熟练度
            体力
            心情
        */
        if(!FIXED_HEROLEVELUPTERMANDBONUS){FIXED_HEROLEVELUPTERMANDBONUS = global.FIXDB.FIXED_HEROLEVELUPTERMANDBONUS}
        var heroAttrDefault = models.HeroAttrModel(),
            keys = Object.keys(heroAttrDefault);

        for (let field of keys) {
            heroAttrDefault[field] = [0,0]; // [min,max]
        }

        var chunks = utils.getHashArraySplitTwice(FIXED_HEROLEVELUPTERMANDBONUS[heroId]['termLv' + heroLevel], '|', ',');
        heroAttrDefault.feel        = [chunks[0].k, chunks[0].v];
        heroAttrDefault.exp         = [chunks[1].k, chunks[1].v];
        heroAttrDefault.lingg       = [chunks[2].k, chunks[2].v];
        heroAttrDefault.skillpoint  = [chunks[3].k, chunks[3].v];
        heroAttrDefault.energy      = [chunks[4].k, chunks[4].v];
        heroAttrDefault.emotion     = [chunks[5].k, chunks[5].v];
        callback(heroAttrDefault);
    }

    /**
     * getHeroAttrLimitObject - 获取墨魂属性限制
     * @param {Number} heroId
     * @param {Number} heroLevel
     */
    static getHeroAttrLimitObject(heroId, heroLevel)
    {
        if(!FIXED_HEROLEVELUPTERMANDBONUS){FIXED_HEROLEVELUPTERMANDBONUS = global.FIXDB.FIXED_HEROLEVELUPTERMANDBONUS}
        var heroAttrDefault = models.HeroAttrModel(),
            chunks = utils.getHashArraySplitTwice(FIXED_HEROLEVELUPTERMANDBONUS[heroId]['termLv' + heroLevel], '|', ',');
        if (chunks.length >= 6) {

            heroAttrDefault.feel        = { min: chunks[0].k, max: chunks[0].v }; // 魂力
            heroAttrDefault.exp         = { min: chunks[1].k, max: chunks[1].v }; // 亲密
            heroAttrDefault.lingg       = { min: chunks[2].k, max: chunks[2].v }; // 灵感
            heroAttrDefault.skillpoint  = { min: chunks[3].k, max: chunks[3].v }; // 技能熟练度
            heroAttrDefault.energy      = { min: chunks[4].k, max: chunks[4].v }; // 体力
            heroAttrDefault.emotion     = { min: chunks[5].k, max: chunks[5].v }; // 心情
        } else {
            Object.keys(heroAttrDefault).map((k) => { heroAttrDefault[k] = { min: 0, max: 0 } });
        }

        return heroAttrDefault;
    }

    static getObjHeroAttrLimitsListByHeroAttrListConfig(heroAttrLis, callback)
    {
        function queryTermLvField(lv) {
            return 'termLv' + lv;
        }

        function getHeroAttrLimitDefault(termLv) {
            var chunks = utils.getHashArraySplitTwice(termLv, '|', ','),
                heroAttrDefault = models.HeroAttrModel(),
                keys = Object.keys(heroAttrDefault);

            for (let field of keys) {
                heroAttrDefault[field] = [0,0]; // [min,max]
            }

            heroAttrDefault.feel        = [chunks[0].k, chunks[0].v];
            heroAttrDefault.exp         = [chunks[1].k, chunks[1].v];
            heroAttrDefault.lingg       = [chunks[2].k, chunks[2].v];
            heroAttrDefault.skillpoint  = [chunks[3].k, chunks[3].v];
            heroAttrDefault.energy      = [chunks[4].k, chunks[4].v];
            heroAttrDefault.emotion     = [chunks[5].k, chunks[5].v];

            return heroAttrDefault;
        }

        if(!FIXED_HEROLEVELUPTERMANDBONUS){FIXED_HEROLEVELUPTERMANDBONUS = global.FIXDB.FIXED_HEROLEVELUPTERMANDBONUS}
        var obj = {};
        for (let i in heroAttrLis) {
            var heroNode = FIXED_HEROLEVELUPTERMANDBONUS[heroAttrLis[i].hid];
            obj[heroAttrLis[i].hid] = getHeroAttrLimitDefault(heroNode[queryTermLvField(heroAttrLis[i].attrs.level)]);
        }

        callback(obj);
    }

    // 默认属性值配置
    static getHeroAttrValsDefaultConfig(heroId, heroLevel, callback) {
        var heroAttrDefault = models.HeroAttrModel(),
            queryField = 'bonusLv' + heroLevel;
        if(!FIXED_HEROLEVELUPTERMANDBONUS){FIXED_HEROLEVELUPTERMANDBONUS = global.FIXDB.FIXED_HEROLEVELUPTERMANDBONUS}
        var chunks = utils.splitToIntArray(FIXED_HEROLEVELUPTERMANDBONUS[heroId][queryField], ',');
        heroAttrDefault.feel        = chunks[0];
        heroAttrDefault.exp         = chunks[1];
        heroAttrDefault.lingg       = chunks[2];
        heroAttrDefault.skillpoint  = chunks[3];
        heroAttrDefault.energy      = chunks[4];
        heroAttrDefault.emotion     = chunks[5];

        callback(heroAttrDefault);
    }
}

class Items
{
    static TYPES()
    {
        return {
            CONSUME: 1,         // 消耗类型
            HERO_SKIN: 5,       // 皮肤道具
            HERO_PIECE: 6,      // 碎片
            ITEM_GIFT: 9,       // 礼包
            ITEM_SPEEDUP:11     //加速道具
        }
    }

    static getItemNode(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        callback(FIXED_ITEMS[itemId]);
    }

    static getType(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            callback(node.type);
        } else {
            console.error("[Items][getType] null: ", itemId);
            callback(null);
        }
    }

    static getItemType(itemId)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            return node.type;
        } else {
            return 0;
        }
    }

    static getValue(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}

        var node = FIXED_ITEMS[itemId];
        if (node) {
            callback(node.value);
        } else {
            console.error("[Items][getValue] null: ", itemId);
            callback(null);
        }
    }

    static getItemSkinConfig(itemId)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        if(!FIXED_ITEMS_INDEXES){FIXED_ITEMS_INDEXES = global.FIXDB.FIXED_ITEMS_INDEXES}

        var node = FIXED_ITEMS[itemId];
        if (node) {
            // itemId 必定为皮肤道具
            function getSkinPieceId(heroId) {
                var itemIdLis = FIXED_ITEMS_INDEXES['type' + Items.TYPES().HERO_SKIN], dat, piece_id = 0;
                for (let item_id of itemIdLis) {
                    dat = FIXED_ITEMS[item_id];
                    if (dat && dat.value === heroId) {
                        piece_id = item_id;
                        break;
                    }
                }
                return piece_id;
            }

            var hid = parseInt(node.value.toString().substr(0, 6));
            return {
                skinItemId: itemId,
                skinId: node.value,
                skinPieceId: getSkinPieceId(hid),
                heroId: hid
            };
        } else {
            console.warn("[Items][getItemSkinConfig] null: ", itemId);
            return null;
        }
    }

    static isGiftItem(itemId)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            return (node.type === Items.TYPES().ITEM_GIFT);
        } else {
            console.warn("[Items][isGiftItem] Can't find item:", itemId);
            return false;
        }
    }

    static getSkinItemId(skinId)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        if(!FIXED_ITEMS_INDEXES){FIXED_ITEMS_INDEXES= global.FIXDB.FIXED_ITEMS_INDEXES}
        var lis = FIXED_ITEMS_INDEXES['type' + Items.TYPES().HERO_SKIN], node = null;
        for (let itemId of lis) {
            node = FIXED_ITEMS[itemId];
            if (node && node.subType === 1 && node.value === skinId) {
                break;
            } else {
                node = null;
            }
        }

        return (node ? node.itemId : 0);
    }

    static getSubType(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            callback(node.subType);
        } else {
            console.error("[Items][getSubType] null: ", itemId);
            callback(null);
        }
    }

    static getUpEffectVal(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            callback(node.upEffectVal);
        } else {
            console.error("[Items][getUpEffectVal] null: ", itemId);
            callback(null);
        }
    }

    static getLikeUpEffectVal(itemId, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            callback(node.likeUpEffectVal);
        } else {
            console.error("[Items][getLikeUpEffectVal] null: ", itemId);
            callback(null);
        }
    }

    static getItemsInfoByItemIds (itemIds, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var lis = [];
        for (let itemId of itemIds) {
            lis.push(FIXED_ITEMS[itemId]);
        }
        callback(lis);
    }

    static getItemsSellPrices (itemIds, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var lis = [];
        for (let itemId of itemIds) {
            let node = FIXED_ITEMS[itemId];
            if (node != null)  {
                if (node.SellPrice.includes(',')) {
                    let incomeData = utils.getItemArraySplitTwice(node.SellPrice, '|', ',');
                    lis.push({itemId:itemId, SellPrice:incomeData[0].count});
                }else {
                    lis.push({itemId:itemId, SellPrice:parseInt(node.SellPrice)});
                }
            }
        }
        callback(lis);
    }

    static getSellPriceConfig(itemId, itemCount, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var node = FIXED_ITEMS[itemId];
        if (node) {
            if (node.SellPrice.includes(',')) {
                var incomeData = utils.getItemArraySplitTwice(node.SellPrice, '|', ',');
                incomeData = categoryFromItemList(incomeData);

                for (let i in incomeData.currency) {
                    incomeData.currency[i] *= itemCount;
                }

                for (let i in incomeData.items) {
                    incomeData.items[i].count *= itemCount;
                }

                callback(true, incomeData);
            } else {
                callback(true, { items: [], currency: [0,0,0] });
            }
        } else {
            callback(false);
        }
    }

    // 用于辅助任务相关[{params:[itemId, itemType], num }]
    static getParamGroupByItemListConfig(itemLis, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        var paramGroup = [], node;
        for (let i in itemLis) {
            node = FIXED_ITEMS[itemLis[i].id];
            if (node) {
                paramGroup.push({
                    params: [node.itemId, node.type],
                    num: itemLis[i].count
                });
            }
        }
        callback(paramGroup);
    }
    
    // static getItemType(item)
    // {
    //     if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
    //     return FIXED_ITEMS[item].type;
    // }
    
    // 获取道具（墨魂碎片）
    static getItemListByHeroIdGroupConfig(heroGroup, callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        if(!FIXED_ITEMS_INDEXES){FIXED_ITEMS_INDEXES= global.FIXDB.FIXED_ITEMS_INDEXES}
        var IdxLis = FIXED_ITEMS_INDEXES['type' + Items.TYPES().HERO_PIECE], node, lis = [];
        for (let heroId of heroGroup) {
            for (let itemId of IdxLis) {
                node = FIXED_ITEMS[itemId];
                if (heroId === node.value) {
                    lis.push({ id: node.itemId, count: 3 });
                    break;
                }
            }
        }
        callback(lis);
    }

    static getObjItemAboutHeroPieceConfig(callback)
    {
        if(!FIXED_ITEMS){FIXED_ITEMS= global.FIXDB.FIXED_ITEMS}
        if(!FIXED_ITEMS_INDEXES){FIXED_ITEMS_INDEXES= global.FIXDB.FIXED_ITEMS_INDEXES}
        var itemIdLis = FIXED_ITEMS_INDEXES['type' + Items.TYPES().HERO_PIECE], obj = {}, node;
        for (let itemId of itemIdLis) {
            node = FIXED_ITEMS[itemId];
            obj[node.value] = node.itemId;
        }
        callback(obj);
    }
}

let FIXED_HEROS = null;
class Heros
{
    static getPreferItems(heroId, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node = FIXED_HEROS[heroId];
        if (node) {
            callback(node.loveItems.split(','),  node.hateItems.split (','));
        } else {
            console.error("[Heros][getPreferItems] null: ", heroId);
            callback([], []);
        }
    }

    static getSkillListDefaultConfig(heroId, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node = FIXED_HEROS[heroId];
        if (node) {
            callback(utils.splitToIntArray(node.SkillListDefault, ','));
        } else {
            console.error("[Heros][getSkillListDefaultConfig] null: ", heroId);
            callback([]);
        }
    }

    static getObjSkillDefaultByGroupConfig(heroGroup, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var obj = {}, node;
        for (let heroId of heroGroup) {
            node = FIXED_HEROS[heroId];
            if (node) {
                obj[node.heroId] = utils.splitToIntArray(node.SkillListDefault, ',');
            }
        }
        callback(obj);
    }

    static getHeroGender (heroId, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node = FIXED_HEROS[heroId];
        if (node) {
            callback(node.sex);
        } else {
            console.error("[Heros][getHeroGender] null: ", heroId);
            callback(null);
        }
    }

    static getObjHeroSexByGroup(heroGroup, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node, obj = {};
        for (let heroId of heroGroup) {
            node = FIXED_HEROS[heroId];
            if (node) {
                obj[node.heroId] = node.sex;
            }
        }

        callback(obj);
    }

    static checkHeroIdValidConfig(heroId, callback)
    {
        if(!FIXED_HEROS) { FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node = FIXED_HEROS[heroId];
        callback(node ? true : false);
    }
}

let FIXED_HEROGACHAAREAS = null;
class HeroGachaAreas
{
    // 探索点是否启用
    static getCanUseConfig(areaId, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            callback(node.canUse);
        } else {
            console.error("[HeroGachaAreas][getCanUseConfig] null: ", areaId);
            callback(0);
        }
    }

    // 探索结束时间
    static getEndTimeConfig(areaId, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            callback(node.endTime);
        } else {
            console.error("[HeroGachaAreas][getEndTimeConfig] null: ", areaId);
            callback(null);
        }
    }

    // 概率提升
    static getUpRateObjectConfig(areaId)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId], obj = null, chunks, sub_chunks;
        if (node && node.upRate !== '') {
            obj = {};
            chunks = node.upRate.split('|');
            for (let chunk of chunks) {
                sub_chunks = chunk.split(',');
                if (sub_chunks.length === 3) {
                    if (!obj[sub_chunks[0]]) obj[sub_chunks[0]] = {};
                    obj[sub_chunks[0]][sub_chunks[1]] = parseInt(sub_chunks[2]);
                } else {
                    obj = {};
                    console.warn("[HeroGachaAreas][getUpRateObjectConfig] upRate format: ", areaId, node.upRate);
                    break;
                }
            }
        }

        return obj;
    }

    static getEventWeightConfig(areaId, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            var lmtmap = new Map(),
                tmps = utils.getHashArraySplitTwice(node.eventActionLimit);

            for (let i = 0; i < tmps.length; i++) {
                lmtmap.set(tmps[i].k, tmps[i].v);
            }

            callback({
                addCountNum: node.addCountNum,
                addRewardNum: node.addRewardNum,
                seekPoint: utils.splitToIntArray (node.seekPoint, ","),
                awdEvTable: utils.getHashArraySplitTwice(node.awardEventList, '|', ','),
                baseAwdTable: utils.getHashArraySplitTwice(node.baseAwards, '|', ','),
                lmtEvMap: lmtmap
            });
        } else {
            console.error("[HeroGachaAreas][getEventWeightConfig] null: ", areaId);
            callback(null);
        }
    }

    /**
     * getRandomAwardListByEventType - 根据事件类型获取事件及奖励列表
     * @param {*} eventType 事件类型
     * @param {*} areaId 区域ID
     * @param {*} exceptHeroId 被排除墨魂ID
     * @param {*} callback
     * @param {*} count 随机个数（默认1个）
     */
    static getRandomAwardListByEventType(eventType, areaId, exceptHeroId, callback, count=1)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        HeroGahcaEvents.getEventListByExceptHero(eventType, exceptHeroId, eventList => {
            var node = FIXED_HEROGACHAAREAS[areaId];
            if (node) {
                let newEventList = [];
                let eventTmps = utils.getHashArraySplitTwice(node.addCountEventList, '|', ',');
                for (let i = 0; i < eventList.length; i++) {
                    for (let j = 0; j < eventTmps.length; j++) {
                        if (eventList[i] === eventTmps[j].k) {
                            newEventList.push(eventTmps[j]);
                            break;
                        }
                    }
                }
                let evList = utils.randomListByWeight(newEventList, count);
                HeroGahcaEvents.getBonusListByGroup(evList, awardList => {
                    callback(awardList);
                });
            } else {
                console.error("[HeroGachaAreas][getRdmAddCountEventList] null: ", areaId);
                callback(null);
            }
        });
    }

    static UPRATE_TYPES()
    {
        return {
            HERO: 1,
            SKIN: 2
        }
    }

    static getUpRateRandomList(type, areaId, randomLis)
    {
        let UpRateObjectConfig = HeroGachaAreas.getUpRateObjectConfig(areaId);
        if (UpRateObjectConfig && UpRateObjectConfig[type]) {
            for (let i in randomLis) {
                var upVal = UpRateObjectConfig[type][randomLis[i].k];
                if (upVal) {
                    randomLis[i].v += upVal; // 有改id概率提升值，概率提升
                }
            }
        }
        //console.debug("---------------------->>> after:", randomLis);
        return randomLis;
    }

    /**
     * getRandomHeroId - 获取随机（权重）墨魂
     * @param {*} areaId 区域ID
     * @param {*} exceptHeroId 被排除墨魂ID（用于不能抽派遣墨魂自己）
     * @param {*} callback
     */
    static getRandomHeroId(areaId, exceptHeroId, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            var randomList = utils.getHashArraySplitTwice(node.heroList, '|', ',');
            randomList = HeroGachaAreas.getUpRateRandomList(HeroGachaAreas.UPRATE_TYPES().HERO, areaId, randomList);
            for (let i = 0; i < randomList.length; i++) {
                if (randomList[i].k === exceptHeroId) {
                    randomList.splice(i, 1);
                    break;
                }
            }
            HeroGachaRateUp.getUpHeroListConfig(exceptHeroId, RateUpData => {
                for (let i in RateUpData) {
                    for (let j in randomList) {
                        if (randomList[j].k === RateUpData[i].UpHeroID) {
                            randomList[j].v += RateUpData[i].UpValue; // 增加权重提升
                        }
                    }
                }
                callback(utils.randomListByWeight(randomList)[0]);
            });
        } else {
            console.error("[HeroGachaAreas][getRandomHeroId] null: ", areaId, exceptHeroId);
            callback(0);
        }
    }


    /**
     * getRandomHeroIdUsingProbs - 获取随机（权重）墨魂
     * @param {*} areaId 区域ID
     * @param {*} exceptHeroId 被排除墨魂ID（用于不能抽派遣墨魂自己）
     * @param {*} callback
     */
    static getRandomHeroIdUsingProbs(areaId, exceptHeroId, maxRandom, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            if (utils.getRandom (maxRandom) <= node.extraHeroProbs) {
                var randomList = utils.getHashArraySplitTwice(node.heroList, '|', ',');
                for (let i = 0; i < randomList.length; i++) {
                    if (randomList[i].k === exceptHeroId) {
                        randomList.splice(i, 1);
                        break;
                    }
                }
                callback(utils.randomListByWeight(randomList)[0]);
            }else {
                callback(0);
            }
        } else {
            console.error("[HeroGachaAreas][getRandomHeroId] null: ", areaId, exceptHeroId);
            callback(0);
        }
    }

    /**
    * 获取随机的皮肤事件Id  返回0 代表不生产奖励皮肤
    */
    static getRandomSkinEventId(areaId, maxRandom, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        var node = FIXED_HEROGACHAAREAS[areaId];
        if (node) {
            if (utils.getRandom (maxRandom) <= node.skinProbs) {
                var randomList = utils.getHashArraySplitTwice(node.skins, '|', ',');
                randomList = HeroGachaAreas.getUpRateRandomList(HeroGachaAreas.UPRATE_TYPES().SKIN, areaId, randomList);
                callback(utils.randomListByWeight(randomList)[0]);
            }else {
                callback (0);
            }
        } else {
            console.error("[HeroGachaAreas][getRandomHeroId] null: ", areaId, exceptHeroId);
            callback(0);
        }
    }


    static getRandomBaseAwardId(areaId, callback)
    {
        if(!FIXED_HEROGACHAAREAS) { FIXED_HEROGACHAAREAS = global.FIXDB.FIXED_HEROGACHAAREAS}
        if (areaId === 0) {
            callback(0);
        } else {
            var node = FIXED_HEROGACHAAREAS[areaId];
            if (node) {
                callback(utils.randomListByWeight(utils.getHashArraySplitTwice(node.baseAwards, '|', ','))[0]);
            } else {
                console.error("[HeroGachaAreas][getRandomBaseAwardId] null: ", areaId);
                callback(0);
            }
        }
    }
}

let FIXED_HEROGACHAEVENTS = null
let FIXED_HEROGACHAEVENTS_INDEXES = null

class HeroGahcaEvents
{
    static TYPES()
    {
        return {
            EV_ADDCOUNT: 1, // 次数增加事件
            EV_BONUS: 2 // 奖励事件
        }
    }

    static getEventListConfig(exceptHeroId, callback)
    {
        if(!FIXED_HEROGACHAEVENTS) { FIXED_HEROGACHAEVENTS = global.FIXDB.FIXED_HEROGACHAEVENTS}
        var eventIdLis = Object.keys(FIXED_HEROGACHAEVENTS), node, map = new Map();
        for (let sEventId of eventIdLis) {
            node = FIXED_HEROGACHAEVENTS[sEventId];
            if (node) {
                var isFind = false;
                var exceptHeroList = (node.exceptHeroList == '' || node.exceptHeroList == '0') ? 0 : parseInt(node.exceptHeroList);
                if (exceptHeroId === exceptHeroList) {
                    isFind = true;
                }

                if (!isFind) {
                    map.set(node.eventId, {
                        eventType: node.eventType,
                        awardId: utils.getHashArraySplitTwice(node.bonusList, '|', ',')
                    });
                }
            }
        }
        callback(map);
    }

    static getEventListByExceptHero(eventType, exceptHeroId, callback)
    {
        if(!FIXED_HEROGACHAEVENTS) { FIXED_HEROGACHAEVENTS = global.FIXDB.FIXED_HEROGACHAEVENTS}
        if(!FIXED_HEROGACHAEVENTS_INDEXES) { FIXED_HEROGACHAEVENTS_INDEXES = global.FIXDB.FIXED_HEROGACHAEVENTS_INDEXES}
        var eventIdxLis = FIXED_HEROGACHAEVENTS_INDEXES['eventType' + eventType], node, isFind, newEventList = [];
        for (let eventId of eventIdxLis) {
            node = FIXED_HEROGACHAEVENTS[eventId];
            if (node) {
                isFind = false;
                var exceptHeroList = utils.splitToIntArray(node.exceptHeroList, ',');
                for (let i in exceptHeroList) {
                    if (exceptHeroList[i] === exceptHeroId) {
                        isFind = true;
                        break;
                    }
                }
                if (!isFind) {
                    newEventList.push(node.eventId);
                }
            }
        }
        callback(newEventList);
    }

    static getBonusByEventId(eventId, callback)
    {
        if(!FIXED_HEROGACHAEVENTS) { FIXED_HEROGACHAEVENTS = global.FIXDB.FIXED_HEROGACHAEVENTS}
        var node = FIXED_HEROGACHAEVENTS[eventId];
        if (node) {
            callback(utils.randomListByWeight(utils.getHashArraySplitTwice(node.bonusList, '|', ','), 1)[0]);
        } else {
            console.error("[HeroGachaEvents][getBonusByEventId] null: ", eventId);
            callback(null);
        }
    }

    static getBonusListByGroup(eventGroup, callback)
    {
        if(!FIXED_HEROGACHAEVENTS) { FIXED_HEROGACHAEVENTS = global.FIXDB.FIXED_HEROGACHAEVENTS}
        var node, awardLis = [];
        for (let eventId of eventGroup) {
            node = FIXED_HEROGACHAEVENTS[eventId];
            if (node) {
                awardLis.push({
                    eventId: eventId,
                    awardId: utils.randomListByWeight(utils.getHashArraySplitTwice(node.bonusList, '|', ','), 1)[0]
                })
            }
        }
        callback(awardLis);
    }
}

let FIXED_HEROGACHA_RATEUP = null
class HeroGachaRateUp
{
    static getUpHeroListConfig(playHeroId, callback)
    {
        if(!FIXED_HEROGACHA_RATEUP) { FIXED_HEROGACHA_RATEUP = global.FIXDB.FIXED_HEROGACHA_RATEUP}
        var Lis = FIXED_HEROGACHA_RATEUP, newLis = [];
        for (let i in Lis) {
            if (Lis[i].PlayHeroID !== playHeroId) {
                newLis.push(Lis[i]);
            }
        }
        callback(newLis);
    }
}

let FIXED_GENERALAWARDS = null
class GeneralAwards
{
    static getBonusItemList(awardId, itemLis)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var node = FIXED_GENERALAWARDS[awardId];
        if (node) {
            var lis = utils.getItemArraySplitTwice(node.awardBonus, '|', ',');
            for (let i in lis) {
                var isFind = false;
                for (let j in itemLis) {
                    if (lis[i].id === itemLis[j].id) {
                        isFind = true;
                        itemLis[j].count += lis[i].count; // 相同物品ID合并
                        break;
                    }
                }
                if (!isFind) {
                    itemLis.push(lis[i]); // 新物品
                }
            }
        }
        return itemLis;
    }

    static getBonus(awardId, callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var node = FIXED_GENERALAWARDS[awardId];
        if (node) {
            var bonusData = categoryFromItemList(utils.getItemArraySplitTwice(node.awardBonus, '|', ','));
            callback(bonusData.items, bonusData.currency, bonusData.heros);
        } else {
            console.error("[][getBonus] null: ", awardId);
            callback(null);
        }
    }

    static getBonusConfig(awardLis, callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var node, BonusData = {};
        for (let awardId of awardLis) {
            node = FIXED_GENERALAWARDS[awardId];
            if (node) {
                BonusData = categoryFromItemListEx(BonusData, utils.getItemArraySplitTwice(node.awardBonus, '|', ','));
            }
        }
        callback(BonusData);
    }

    static getAwardAll(callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var awardIdKeys = Object.keys(FIXED_GENERALAWARDS), bonusMap = new Map(), node;
        for (let sAwardId of awardIdKeys) {
            node = FIXED_GENERALAWARDS[sAwardId];
            bonusMap.set(node.awardId, categoryFromItemList(utils.getItemArraySplitTwice(node.awardBonus, '|', ',')));
        }
        callback(bonusMap);
    }

    static getAward(awardId, callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var node = FIXED_GENERALAWARDS[awardId];
        if (node) {
            callback(categoryFromItemList(utils.getItemArraySplitTwice(node.awardBonus, '|', ',')));
        } else {
            console.error("[GeneralAwards][getAward] null: ", awardId);
            callback(null);
        }
    }

    static getBonusByGroup(awardGroup, callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var node, bonusData = {};
        for (let awardId of awardGroup) {
            node = FIXED_GENERALAWARDS[awardId];
            if (node) {
                bonusData = categoryFromItemListEx(bonusData, utils.getItemArraySplitTwice(node.awardBonus, '|', ','));
            }
        }
        callback(bonusData.items, bonusData.currency, bonusData.heros);
    }

    static getAwardMapConfig(callback)
    {
        if(!FIXED_GENERALAWARDS) { FIXED_GENERALAWARDS = global.FIXDB.FIXED_GENERALAWARDS}
        var awardIdKeys = Object.keys(FIXED_GENERALAWARDS), bonusMap = new Map(), node;
        for (let sAwardId of awardIdKeys) {
            node = FIXED_GENERALAWARDS[sAwardId];
            bonusMap.set(node.awardId, categoryFromItemList(utils.getItemArraySplitTwice(node.awardBonus, '|', ',')));
        }
        callback(bonusMap);
    }
}

let FIXED_HEROGACHACOUNTPR = null;
class HeroGachaCountPR
{
    static triggerCountPR(count, callback)
    {
        if(!FIXED_HEROGACHACOUNTPR) { FIXED_HEROGACHACOUNTPR = global.FIXDB.FIXED_HEROGACHACOUNTPR}
        var prLis = FIXED_HEROGACHACOUNTPR,
            EXTR_RATE = 10,
            probTotal = 0;

        for (let i = 0; i < prLis.length; i++) {
            if (prLis[i].count <= count) {
                probTotal += prLis[i].probVal;
            }
        }

        probTotal *= EXTR_RATE; // 扩大10倍
        // 计算概率
        var seed = utils.getRandom(100*EXTR_RATE);
        callback(seed <= probTotal);
    }
}

let FIXED_HEROGACHABUYCOUNTCOST = null
class HeroGachaBuyCountCost
{
    static getNeedDiamond(count, callback)
    {
        if(!FIXED_HEROGACHABUYCOUNTCOST) { FIXED_HEROGACHABUYCOUNTCOST = global.FIXDB.FIXED_HEROGACHABUYCOUNTCOST}
        var node = FIXED_HEROGACHABUYCOUNTCOST[count];
        if (node) {
            var costData = categoryFromItemList([{ id: node.CostType, count: node.CostValue }]);
            callback(costData);
        } else {
            console.error("[HeroGachaBuyCountCost][getNeedDiamond] null: ", count);
            callback(null);
        }
    }
}

let FIXED_INSPIRATIONEVENT = null
let FIXED_INSPIRATIONEVENTLINK = null
class InspirationEvent
{
    // 获取主题事件数据
    static getThemeEventDataConfig(themeId, eventId, heroId)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var node = FIXED_INSPIRATIONEVENT[eventId], themeEvData = null;
        if (node) {
            // if (node.type === 2) {
            //     // 是主题事件
            //     var selectId = InspirationTheme.isLinkHeroConfig(themeId, heroId) ? 1 : 2;
            //     themeEvData = {}
            //     themeEvData.type = node['OptEffType' + selectId];
            //     themeEvData.value = node['OptEffVal' + selectId];
            // }
        } else {
            console.warn("[InspirationEvent][getThemeEventDataConfig]", eventId, heroId);
        }

        return themeEvData;
    }

    static getEventEffTypeMapConfigByType(type)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var LisKeys = Object.keys(FIXED_INSPIRATIONEVENT), node, evMap = new Map();
        for (let sEventId of LisKeys) {
            if (sEventId !== '0') {
                node = FIXED_INSPIRATIONEVENT[sEventId];
                if (node) {
                    evMap.set(node.id, node.effectType);
                }
            }
        }
        return evMap;
    }

    static getOptCost(eventId, selectId, callback)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var queryField = 'OptCost'+selectId;
        var node = FIXED_INSPIRATIONEVENT[eventId];
        if (node) {
            callback(categoryFromItemList(utils.getItemArraySplitTwice(node[queryField], '|', ',')));
        } else {
            console.error("[InspirationEvent][getOptCost] null: ", eventId, selectId);
            callback(null);
        }
    }

    static getRandomByConfig(eventId)
    {
        if(!FIXED_INSPIRATIONEVENTLINK){FIXED_INSPIRATIONEVENTLINK = global.FIXDB.FIXED_INSPIRATIONEVENTLINK}
        let node = FIXED_INSPIRATIONEVENTLINK.filter(element =>{ return element.eventId == eventId})
        let FIX_GAMEMARKET = global.FIXDB.FIXED_GAMEMARKET
        if(node && node.length > 0){
            let goods = []
            let base_data = node[0].linkInfo.split('|')
            if(!base_data || base_data.length === 0){
                return []
            }
            base_data.map(element =>{
                let [k,v] =  element.split(',')
                let randomList = []
                Object.keys(FIX_GAMEMARKET).map(ele =>{
                    if(FIX_GAMEMARKET[ele].ShopType == k){
                        randomList.push(FIX_GAMEMARKET[ele].GoodsID)
                    }
                })
                 goods.push(..._.sampleSize(randomList,v))
            })
            return goods
        }else{
            return  []
        }
    }

    static goodsBuy(goodsId)
    {
    }

    static getEffect(eventId, callback)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var node = FIXED_INSPIRATIONEVENT[eventId];
        if (node) {
            callback({ type: node.effectType, value: node.effectVal });
        } else {
            console.error("[InspirationEvent][getEffect] null: ", eventId);
            callback(null);
        }
    }

    // 获取全部事件数据
    static getEventMapConfig(callback)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var LisKeys = Object.keys(FIXED_INSPIRATIONEVENT), node, evMap = new Map();
        for (let sEventId of LisKeys) {
            if (sEventId !== '0') {
                node = FIXED_INSPIRATIONEVENT[sEventId];
                if (node) {
                    evMap.set(node.id, {
                        optFlag: node.optFlag,
                        passFlag: node.passFlag,
                        eventId: node.id,
                        type: node.effectType,
                        value: node.effectVal
                    });
                }
            }
        }
        callback(evMap);
    }

    static getOptionEffectConfig(eventId, selectId, callback)
    {
        if(!FIXED_INSPIRATIONEVENT) { FIXED_INSPIRATIONEVENT = global.FIXDB.FIXED_INSPIRATIONEVENT}
        var node = FIXED_INSPIRATIONEVENT[eventId];
        if (node) {
            callback({
                eventId: node.id,
                type: node['OptEffType'+selectId],
                value: node['OptEffVal'+selectId]
            })
        } else {
            console.warn("[InspirationEvent][getOptionEffectConfig] null: ", eventId, selectId);
            callback(null);
        }
    }
}

let FIXED_INSPIRATION_THEME = null
class InspirationTheme
{
    static getThemeListConfig()
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        return FIXED_INSPIRATION_THEME
    }

    static getThemeAwardsConfig(themeId)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        let node = FIXED_INSPIRATION_THEME[themeId]
        if(node){
           return utils.getItemArraySplitTwice(node.recomendAward, '|', ',');
        }else{
           return  null
        }
    }

    static loadRandomList (themeId, heroId)
    {
        if(!FIXED_INSPIRATIONEVENTLINK){FIXED_INSPIRATIONEVENTLINK = global.FIXDB.FIXED_INSPIRATIONEVENTLINK}
        let nodes = FIXED_INSPIRATIONEVENTLINK.filter(element =>{ return element.linkInfo == heroId})
        let eventIds = []
        if(nodes.length > 0)
        {
         nodes.map(element =>{
             eventIds.push(element.eventId)
         })
        }
        return eventIds
    }

    static getThemeListConfigBYNODE(node)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        return FIXED_INSPIRATION_THEME[node]
    }

    static getThemeUnlockConfig(themeId)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        let node = FIXED_INSPIRATION_THEME[themeId]
        if (node) {
            let queryField = 'unlockTerm'
            var chunks = node[queryField].split('|'), valid = true, lis = [];
            for (let chunk of chunks) {
                var field = chunk.split(',');
                if (field.length < 3) {
                    valid = false;
                    break;
                }
                lis.push({
                    type: Number(field[0]),
                    value1: Number(field[1]),
                    value2: Number(field[2])
                });
            }
            if (valid) {
                return lis;
            } else {
                console.warn("[WorkBuildingExpend][getGridUnlockConditionConfig]", modname, bid, grid, node[queryField]);
                return null;
            }
        } else {
            console.warn("[WorkBuildingExpend][getGridUnlockConditionConfig]", modname, bid, grid);
            return null;
        }
    }

    static checkThemeUnlockConfig(config,player)
    {
        let check = true
        for (let i of config){
            if(i.type === 1){
                if(i.value1 > player.userlevel){
                    check = false
                }
            }
        }
        return check
    }

    // 获取当日星期限制开启主题列表
    static getOpenWeekThemeListConfig()
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        function getWeek() {
            var week = new Date().getDay();
            return (week === 0 ? 7 : week);
        }
        var themeIdKeys = Object.keys(FIXED_INSPIRATION_THEME),
            node,
            week = getWeek(),
            openThemeLis = [];

        for (let sThemeId of themeIdKeys) {
            node = FIXED_INSPIRATION_THEME[sThemeId];
            if (node) {
                var openWeekList = utils.splitToIntArray(node.openWeek, ',');
                if (openWeekList.filter((a) => { return a === week; }).length > 0) {
                    openThemeLis.push(node.id); // 可以开放
                }
            }
        }
        return openThemeLis;
    }

    // 判断是否为主题关联墨魂
    static isLinkHeroConfig(themeId, heroId)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId], valid = false;
        if (node) {
            var tmps = utils.splitToIntArray(node.linkHeroList, ',');
            if (tmps.filter((a) => { return a === heroId; }).length > 0) {
                valid = true;
            }
        }

        return valid;
    }

    // 获取墨魂关联事件数量
    static getHeroLinkEventCountConfig(themeId)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        return (node ? node.heroLinkEventNum : 0);
    }

    // 随机墨魂专属事件
    static getRandHeroOwnEventListConfig(themeId, heroId,count = 1)
    {
        var lis = [];
        if (themeId > 0 && heroId > 0) {
          let randomList = InspirationTheme.loadRandomList(themeId , heroId)
          return _.sampleSize(randomList,count)
        }

        return lis;
    }

    static unlockTerm(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            let conditions = [];
            var chunks = utils.getHashArraySplitTwice(node.unlockTerm, '|', ',');
            for (let chunk of chunks) {
                conditions.push({ type: chunk.k, value: chunk.v });
            }
            callback(conditions);
        } else {
            console.error("[InspirationTheme][unlockTerm] null: ", themeId);
            callback(null);
        }
    }

    static getCostCurrency(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var costData = categoryFromItemList(utils.getItemArraySplitTwice(node.costCurrency, '|', ','));
            callback(costData.currency);
        } else {
            console.error("[InspirationTheme][unlockTerm] null: ", themeId);
            callback(null);
        }
    }

    static getCostItem(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var costData = categoryFromItemList(utils.getItemArraySplitTwice(node.costItem, '|', ','));
            callback(costData.items);
        } else {
            console.error("[InspirationTheme][getCostItem] null: ", themeId);
            callback(null);
        }
    }

    // 固定事件
    static getRandomPersistEvent(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            let persistEvList = utils.getHashArraySplitTwice(node.persistEvent, '|', ',');
            callback(utils.randomListByWeight(persistEvList, node.persistEventNum));
        } else {
            console.error("[InspirationTheme][getRandomPersistEvent] null: ", themeId);
            callback(null);
        }

    }

    // 随机事件
    static getRandomRandEvent(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            let randEvList =  utils.getHashArraySplitTwice(node.randEvent, '|', ',');
            callback(utils.randomListByWeight(randEvList, node.randEventNum));
        } else {
            console.error("[InspirationTheme][getRandomRandEvent] null: ", themeId);
            callback(null);
        }
    }

    // 地图大小（格子数）
    static getMapNum(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            callback(node.mapNum);
        } else {
            console.error("[InspirationTheme][getMapNum] null: ", themeId);
            callback(null);
        }
    }

    // 最终宝箱
    static getRandomAward(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var awardId = utils.randomListByWeight(utils.getHashArraySplitTwice(node.randAward, '|', ','), 1);
            awardId = awardId.length === 0 ? 0 : awardId[0];
            GeneralAwards.getAward(awardId, callback);
        } else {
            console.error("[InspirationTheme][getRandomRandEvent] null: ", themeId);
            callback(null);
        }
    }

    /////////////////////////////////////
    // 获取解锁主题货币消耗
    static getCostCurrencyConfig(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var costData = categoryFromItemList(utils.getItemArraySplitTwice(node.costCurrency, '|', ','));
            callback(costData.currency);
        } else {
            console.error("[InspirationTheme][getCostCurrencyConfig] null: ", themeId);
            callback(null);
        }
    }

    // 获取解锁主题物品消耗
    static getCostItemConfig(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var costData = categoryFromItemList(utils.getItemArraySplitTwice(node.costCurrency, '|', ','));
            callback(costData.items);
        } else {
            console.error("[InspirationTheme][getCostItemConfig] null: ", themeId);
            callback(null);
        }
    }

    // 获取数量配置（地图格子数、固定事件数、随机事件数）
    static getEventCountConfig(themeId)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            return {
                mapCount: node.mapNum,
                persistEventCount: node.persistEventNum,
                randEventCount: node.randEventNum,
                heroLinkEventNum: node.heroLinkEventNum,
                themeEventNum:node.themeEventNum,
                linkEventNum:node.linkEventNum,
                merchantEventNum:node.merchantEventNum
            }
        } else {
            console.error("[InspirationTheme][getEventCountConfig] null: ", themeId);
            return null;
        }
    }

    // 获取固定事件配置（有上限限制）
    static getPersistEventConfig(themeId, count=1)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
                let eventEffTypeMap = InspirationEvent.getEventEffTypeMapConfigByType(0)
                var tmps = utils.getHashArraySplitTwice(node.PersistLimit, '|', ',');
                var limitMap = new Map();
                for (let i in tmps)
                        limitMap.set(tmps[i].k, tmps[i].v); // effectType => counter

                tmps = utils.getHashArraySplitTwice(node.persistEvent, '|', ',');

                var persistEventList = [];

                while (count--) {
                    var eventId = utils.randomListByWeight(tmps, 1)[0];
                        var effectType = eventEffTypeMap.get(eventId); // 如果effectType为null说明配置表错误（注：effectType大于0）
                        var limitCounter = limitMap.get(effectType);

                        if (limitCounter === null) {
                            persistEventList.push(eventId);
                        } else {
                            if (limitCounter > 0) {
                                persistEventList.push(eventId);
                                limitMap.set(effectType, limitCounter-1);
                            } else {
                                ++count;
                            }
                        }
                }
                return persistEventList;
        } else {
            console.error("[InspirationTheme][getPersistEventConfig] null: ", themeId);
            return null;
        }
    }

    // 获取随机事件配置
    static getRandEventConfig(themeId,  count=1)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var tmps = utils.getHashArraySplitTwice(node.randEvent, '|', ',');
            return utils.randomListByWeight(tmps, count);
        } else {
            console.error("[InspirationTheme][getRandEventConfig] null: ", themeId);
            return null;
        }
    }

    // 获取 关联事件
    static getLinkEventConfig(themeId, type, count=1)
    {
        if(!FIXED_INSPIRATIONEVENTLINK){FIXED_INSPIRATIONEVENTLINK = global.FIXDB.FIXED_INSPIRATIONEVENTLINK}
        var node = FIXED_INSPIRATIONEVENTLINK;
        if (global.themeData_ && global.themeData_[type] && global.themeData_[type].length > 0 && !!global.themeData_.map &&Object.keys(global.themeData_.map)> 0){
            //  缓存有
            let randomList = global.themeData_[type];
            let randomData = _.sampleSize(randomList,count)
            return [randomData,global.themeData_.map]
        }else{
            if(!global.themeData_){global.themeData_ = {}}
            let themeData = _.filter(node , (ele)=>{return ele.eventType == type && ele.themeId == themeId})
            let randomList = []
            let map = {}
            themeData.map(element=>{
                map[element.eventId] = element.linkInfo
                randomList.push(..._.times(element.prob, _.constant(element.eventId)))
            })
            global.themeData_[type] = randomList
            global.themeData_.map = map
            let randomData = _.sampleSize(randomList,count)
            return [randomData,map]
        }
    }
    
    // 获取 类型事件
    static getTypeEventConfig(themeId, type, count=1)
    {
        if(!FIXED_INSPIRATIONEVENTLINK){FIXED_INSPIRATIONEVENTLINK = global.FIXDB.FIXED_INSPIRATIONEVENTLINK}
        var node = FIXED_INSPIRATIONEVENTLINK;
        if (global.themeData_ && global.themeData_[type] && global.themeData_[type].length > 0){
           //  缓存有
            let randomList = global.themeData_[type];
            return _.sampleSize(randomList,count)
        }else{
            if(!global.themeData_){global.themeData_ = {}}
            let themeData = _.filter(node , (ele)=>{return ele.eventType == type && ele.themeId == themeId})
            let randomList = []
            themeData.map(element=>{
                randomList.push(..._.times(element.prob, _.constant(element.eventId)))
            })
            global.themeData_[type] = randomList
            return _.sampleSize(randomList,count)
        }
    }

    // 获取基础灵感配置
    static getBaseLinggConfig(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            callback('number' == typeof node.baseLingg ? node.baseLingg : 4);
        } else {
            console.error("[InspirationTheme][getBaseLinggConfig] null: ", themeId);
            callback(0);
        }
    }

    // 获得最终宝箱奖励配置
    static getOverAwardBonusConfig(themeId, callback)
    {
        if(!FIXED_INSPIRATION_THEME){FIXED_INSPIRATION_THEME = global.FIXDB.FIXED_INSPIRATIONTHEME}
        var node = FIXED_INSPIRATION_THEME[themeId];
        if (node) {
            var awardId = utils.randomListByWeight(utils.getHashArraySplitTwice(node.randAward, '|', ','), 1);
            awardId = awardId.length === 0 ? 0 : awardId[0];
            GeneralAwards.getAward(awardId, bonusData => {
                callback(awardId, bonusData);
            });
        } else {
            console.error("[InspirationTheme][getOverAwardBonusConfig] null: ", themeId);
            callback(null);
        }
    }
}

let FIXED_GAMEBUYCOUNTS = null
let FIXED_GAMEBUYCOUNTS_INDEXES = null

class GameBuyCounts
{
    static getBuyCountCostConfig(sysId, count, callback)
    {
        if(!FIXED_GAMEBUYCOUNTS){FIXED_GAMEBUYCOUNTS = global.FIXDB.FIXED_GAMEBUYCOUNTS}
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}

        function checkNoneConter(lis) {
            if (lis.length === 1 &&
                    FIXED_GAMEBUYCOUNTS[lis[0]] && FIXED_GAMEBUYCOUNTS[lis[0]].BuyCount === 0) {
                return true;
            } else {
                return false;
            }
        }

        var idLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + sysId], node, costData = null;
        if (idLis) {
            if (checkNoneConter(idLis)) {
                // 不计数获取
                node = FIXED_GAMEBUYCOUNTS[idLis[0]];
                costData = categoryFromItemList(utils.splitItemList(node.Cost, ','));
            } else {
                for (let id of idLis) {
                    node = FIXED_GAMEBUYCOUNTS[id];
                    if (node) {
                        if (node.BuyCount === count) {
                            costData = categoryFromItemList(utils.splitItemList(node.Cost, ','));
                            break;
                        }
                    }
                }
            }
            callback(costData);
        } else {
            console.error("[GameBuyCounts][getBuyCountCostConfig] null: ", sysId);
            callback(null);
        }
    }

    static getBuyCountCostConfigSync(sysId, count)
    {
        if(!FIXED_GAMEBUYCOUNTS){FIXED_GAMEBUYCOUNTS = global.FIXDB.FIXED_GAMEBUYCOUNTS}
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}

        function checkNoneConter(lis) {
            if (lis.length === 1 &&
                FIXED_GAMEBUYCOUNTS[lis[0]] && FIXED_GAMEBUYCOUNTS[lis[0]].BuyCount === 0) {
                return true;
            } else {
                return false;
            }
        }
        var idLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + sysId], node, costData = null;
        if (idLis) {
            if (checkNoneConter(idLis)) {
                // 不计数获取
                node = FIXED_GAMEBUYCOUNTS[idLis[0]];
                costData = categoryFromItemList(utils.splitItemList(node.Cost, ','));
            } else {
                for (let id of idLis) {
                    node = FIXED_GAMEBUYCOUNTS[id];
                    if (node) {
                        if (node.BuyCount === count) {
                            costData = categoryFromItemList(utils.splitItemList(node.Cost, ','));
                            break;
                        }
                    }
                }
            }
            return costData;
        } else {
            console.error("[GameBuyCounts][getBuyCountCostConfig] null: ", sysId);
            return null;
        }
    }

    static getBuyCountMaxConfig(sysId, callback)
    {
        if(!FIXED_GAMEBUYCOUNTS_INDEXES){FIXED_GAMEBUYCOUNTS_INDEXES = global.FIXDB.FIXED_GAMEBUYCOUNTS_INDEXES}
        var idxKeyLis = FIXED_GAMEBUYCOUNTS_INDEXES['SysID' + sysId];
        callback(idxKeyLis.length);
    }
}

let FIXED_SOULGAMETHEME = null
class SoulGameTheme
{
    //  获取每个主题的消耗情况
    static getThemeIdCostConfig(themeId, callback)
    {
        if(!FIXED_SOULGAMETHEME){FIXED_SOULGAMETHEME = global.FIXDB.FIXED_SOULGAMETHEME}
        var node = FIXED_SOULGAMETHEME[themeId];
        if (node) {
            callback(categoryFromItemList(utils.splitItemList(node.ThemeCost, ',')));
        } else {
            console.error("[SoulGameThemes][getThemeIdCostConfig] null: ", themeId);
            callback(-1);
        }
    }

    //  获取主题的结算信息
    static getThemeIdResultConfig(themeId, callback)
    {
        if(!FIXED_SOULGAMETHEME){FIXED_SOULGAMETHEME = global.FIXDB.FIXED_SOULGAMETHEME}
        var node = FIXED_SOULGAMETHEME[themeId];
        if (node) {
            callback({
                BaseAdd: node.BaseAdd,
                WinAdd: node.WinAdd,
                PopularityAdd: utils.splitToIntHash(node.PopularityAdd, '|', ','),
            });
        } else {
            console.error("[SoulGameThemes][getThemeIdResultConfig] null: ", themeId);
            callback(null);
        }
    }

    //  获取所有的主题列表
    static  getAllThemesIdConfig (callback)
    {
        if(!FIXED_SOULGAMETHEME){FIXED_SOULGAMETHEME = global.FIXDB.FIXED_SOULGAMETHEME}
        var lis = [], node, idxKeyLis = Object.keys(FIXED_SOULGAMETHEME);
        for (let sThemeId of idxKeyLis) {
            node = FIXED_SOULGAMETHEME[sThemeId];
            if (node) {
                lis.push({
                    ThemeId: node.ThemeId
                });
            }
        }

        callback(lis);
    }
}

let FIXED_SOULGAMECARD = null
class SoulGameCard
{
    // 获取卡牌配置信息
    static getSoulGameCardConfig(cardId, callback)
    {
        if(!FIXED_SOULGAMECARD){FIXED_SOULGAMECARD = global.FIXDB.FIXED_SOULGAMECARD}
        var doc = FIXED_SOULGAMECARD[cardId];
        if (doc) {
            callback({
                CardType: doc.CardType,
                WinCards: doc.WinCards,
                DrawCards: doc.DrawCards,
                LoseCards: doc.LoseCards,
                WinPopularity: doc.WinPopularity,
                DrawPopularity: doc.DrawPopularity,
                LosePopularity: doc.LosePopularity
            })
        } else {
            console.error("[SoulGameCard][getSoulGameCardConfig] null: ", cardId);
            callback(null);
        }
    }

    // 查询指定卡牌信息
    static getSoulGameTargetCardsConfig (cardIds, callback)
    {
        if(!FIXED_SOULGAMECARD){FIXED_SOULGAMECARD = global.FIXDB.FIXED_SOULGAMECARD}
        var node, lis = [];
        for (let cardId of cardIds) {
            node = FIXED_SOULGAMECARD[cardId];
            if (node) {
                lis.push({
                    CardId: node.CardId,
                    CardType: node.CardType,
                    WinCards: utils.splitToIntArray (node.WinCards, ','),
                    DrawCards: utils.splitToIntArray (node.DrawCards, ','),
                    LoseCards: utils.splitToIntArray (node.LoseCards, ','),
                    WinPopularity: node.WinPopularity,
                    DrawPopularity: node.DrawPopularity,
                    LosePopularity: node.LosePopularity
                });
            }
        }
        callback(lis);
    }
}

let FIXED_SOULGAMEVIEWPOINT = null
let FIXED_SOULGAMEVIEWPOINT_INDEXES = null

class SoulGameViewPoint
{
    //  获取每个主题的手牌数据
    static getSoulGameViewPointConfig(themeId, mid, callback)
    {
        if(!FIXED_SOULGAMEVIEWPOINT){FIXED_SOULGAMEVIEWPOINT = global.FIXDB.FIXED_SOULGAMEVIEWPOINT}
        if(!FIXED_SOULGAMEVIEWPOINT_INDEXES){FIXED_SOULGAMEVIEWPOINT_INDEXES = global.FIXDB.FIXED_SOULGAMEVIEWPOINT_INDEXES}

        var idLis = FIXED_SOULGAMEVIEWPOINT_INDEXES['HeroId' + mid], node, cardInfo = {};
        if (idLis) {
            for (let id of idLis) {
                node = FIXED_SOULGAMEVIEWPOINT[id];
                if (node && node.HeroId === mid) {
                    cardInfo.ViewPoint1Cards = utils.splitToIntArray (node.ViewPoint1Cards, ',');
                    cardInfo.ViewPoint2Cards = utils.splitToIntArray (node.ViewPoint2Cards, ',');
                    break;
                }
            }
            callback(cardInfo);
        } else {
            console.error("[SoulGameViewPoint][getSoulGameViewPointConfig] null: ", themeId, mid);
            callback(null);
        }
    }
}


let FIXED_HOTSPRING = null
class HotSpring
{
    static getHotSpringConfig(heroId, callback)
    {
        if(!FIXED_HOTSPRING){FIXED_HOTSPRING = global.FIXDB.FIXED_HOTSPRING}
        var node = FIXED_HOTSPRING[heroId];
        if (node) {
            callback(node);
        } else {
            console.error("[HotSpring][getHotSpringConfig] null: ", heroId);
            callback(null);
        }
    }
}

let FIXED_SHORTORDER = null
let FIXED_SHORTORDER_INDEXES = null

let FIXED_SHORTORDERUNLOCKINFO = null
let FIXED_SHORTORDERUNLOCKINFO_INDEXES = null

class ShortOrder
{
    static getShortOrderByTypeAndLevel(OrderType, level, callback)
    {
        if(!FIXED_SHORTORDER){FIXED_SHORTORDER = global.FIXDB.FIXED_SHORTORDER}
        if(!FIXED_SHORTORDER_INDEXES){FIXED_SHORTORDER_INDEXES = global.FIXDB.FIXED_SHORTORDER_INDEXES}
        if (level > GetMaxLevel ()) {
            level = GetMaxLevel ()
        }

        var idLis = FIXED_SHORTORDER_INDEXES['OrderType' + OrderType], node, doc = null;
        for (let orderId of idLis) {
            node = FIXED_SHORTORDER[orderId];
            if (node && node.MinLevel <= level && node.MaxLevel >= level) {
                doc = node;
                break;
            }
        }

        if (doc) {
            let retData = {};
            retData.OrderId = doc.OrderId;
            retData.ValueInterval = utils.splitToIntArray (doc.ValueInterval, ',');
            retData.CateInfo = utils.splitToKVHashArray (doc.CateInfo, '|', ',');
            retData.Items = utils.splitToKVHashArray (doc.Items, '|', ',');
            retData.Exp = doc.Exp;
            retData.ProfitRate = doc.ProfitRate;
            retData.RewardItems = utils.splitToKVHashArray (doc.RewardItems, '|', ',');
            retData.RewardProb = utils.getHashArraySplitTwice (doc.RewardProb, '|', ',');
            retData.LimitedTime = doc.LimitedTime;
            retData.ExtBonus = categoryFromItemList(utils.getItemArraySplitTwice(doc.ExtBonus, '|', ','));
            callback(retData);
        } else {
            callback(null);
        }
    }

    static getShortOrderUnlockInfo (level, ordertype)
    {
        if(!FIXED_SHORTORDERUNLOCKINFO){FIXED_SHORTORDERUNLOCKINFO = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO}
        if(!FIXED_SHORTORDERUNLOCKINFO_INDEXES){FIXED_SHORTORDERUNLOCKINFO_INDEXES = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO_INDEXES}
        var idLis = FIXED_SHORTORDERUNLOCKINFO_INDEXES['OrderType' + ordertype], node, counter = 0;
        for (let id of idLis) {
            node = FIXED_SHORTORDERUNLOCKINFO[id];
            if (node && node.UnlockLevel <= level) {
                ++counter;
            }
        }
        return counter;
    }

    static getLimitedShortOrderCount (level, ordertype)
    {
        if(!FIXED_SHORTORDERUNLOCKINFO){FIXED_SHORTORDERUNLOCKINFO = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO}
        if(!FIXED_SHORTORDERUNLOCKINFO_INDEXES){FIXED_SHORTORDERUNLOCKINFO_INDEXES = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO_INDEXES}
        var idLis = FIXED_SHORTORDERUNLOCKINFO_INDEXES['OrderType' + ordertype], node, counter = 0;
        for (let id of idLis) {
            node = FIXED_SHORTORDERUNLOCKINFO[id];
            if (node && node.LimitedTimeUnlockLevel <= level && node.LimitedTimeUnlockLevel != 0) {
                ++counter;
            }
        }
        return counter
    }

    static getLongOrderUnlockInfo (ordertype, orderindex, callback)
    {
        if(!FIXED_SHORTORDERUNLOCKINFO){FIXED_SHORTORDERUNLOCKINFO = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO}
        if(!FIXED_SHORTORDERUNLOCKINFO_INDEXES){FIXED_SHORTORDERUNLOCKINFO_INDEXES = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO_INDEXES}
        var idLis = FIXED_SHORTORDERUNLOCKINFO_INDEXES['OrderType' + ordertype], node, doc = null;
        for (let id of idLis) {
            node = FIXED_SHORTORDERUNLOCKINFO[id];
            if (node && node.GridId === orderindex) {
                doc = node;
                break;
            }
        }

        if (doc) {
            callback(doc);
        } else {
            console.error("[ShortOrder][getLongOrderUnlockInfo] null: ", ordertype, orderindex);
            callback(null);
        }
    }
}

let FIXED_LONGORDER = null;
let FIXED_LONGORDERREWARD = null;
let FIXED_LONGORDERREWARD_INDEXES = null;

class LongOrder
{
    // 获取最初解锁的长订单格子
    static getLongOrderDefaultUnlockCount (ordertype) {
        if(!FIXED_SHORTORDERUNLOCKINFO){FIXED_SHORTORDERUNLOCKINFO = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO}
        if(!FIXED_SHORTORDERUNLOCKINFO_INDEXES){FIXED_SHORTORDERUNLOCKINFO_INDEXES = global.FIXDB.FIXED_SHORTORDERUNLOCKINFO_INDEXES}
        var idLis = FIXED_SHORTORDERUNLOCKINFO_INDEXES['OrderType' + ordertype], node;
        let count = 0;
        for (let id of idLis) {
            node = FIXED_SHORTORDERUNLOCKINFO[id];
            if (node && node.UnlockLevel === 0) {
                count += 1;
            }
        }
        return count;
    }

    // 获取长订单价值档位
    static getLongOrderRewardLevelInfo (totalValue)
    {
        if(!FIXED_LONGORDER){FIXED_LONGORDER = global.FIXDB.FIXED_LONGORDER}
        var Lis = FIXED_LONGORDER, doc = null;
        let levelInfo = null;
        for (let index = Lis.length - 1; index >= 0; index --) {
            if (Lis[index].NeedValue <= totalValue) {
                levelInfo = Lis[index];
                break;
            }
        }
        return levelInfo;
    }

    // 获取指定类型的长订单奖励池
    static getLongOrderRewardByLevel (level) {
        if(!FIXED_LONGORDERREWARD){FIXED_LONGORDERREWARD = global.FIXDB.FIXED_LONGORDERREWARD}
        if(!FIXED_LONGORDERREWARD_INDEXES){FIXED_LONGORDERREWARD_INDEXES = global.FIXDB.FIXED_LONGORDERREWARD_INDEXES}
        var idLis = FIXED_LONGORDERREWARD_INDEXES['RewardPoolId' + level], node;
        var rewardList = [];
        for (let id of idLis) {
            node = FIXED_LONGORDERREWARD[id];
            rewardList.push (node);
        }
        return rewardList;
    }

    // 获取指定奖励池下面小于指定价值的奖励池数据
    static getLongOrderRewardLTLeftRewardValue (level, value) {
        if(!FIXED_LONGORDERREWARD){FIXED_LONGORDERREWARD = global.FIXDB.FIXED_LONGORDERREWARD}
        if(!FIXED_LONGORDERREWARD_INDEXES){FIXED_LONGORDERREWARD_INDEXES = global.FIXDB.FIXED_LONGORDERREWARD_INDEXES}
        let idLis = FIXED_LONGORDERREWARD_INDEXES['RewardPoolId' + level], node;
        let rewardList = [];
        for (let id of idLis) {
            node = FIXED_LONGORDERREWARD[id];
            if (node.Value <= value) {
                rewardList.push (node);
            }
        }
        return rewardList;
    }
}

let FIXED_ACCOUNTLEVEL = null
class AccountLevel
{
    static getAccountLevelData (userlevel, callback)
    {
        if(!FIXED_ACCOUNTLEVEL){FIXED_ACCOUNTLEVEL = global.FIXDB.FIXED_ACCOUNTLEVEL}
        let retData = {}
        if (userlevel >= GetMaxLevel ()) {
            callback (null);
        }else{
            callback(FIXED_ACCOUNTLEVEL);
        }
    }
}

let FIXED_DORMDOORDATA = null
class DormDoor
{
    static getDormDoorData (doomId, callback)
    {
        if(!FIXED_DORMDOORDATA){FIXED_DORMDOORDATA = global.FIXDB.FIXED_DORMDOORDATA}
        var node = FIXED_DORMDOORDATA[doomId];
        if (node) {
            callback(node);
        } else {
            console.error("[DormDoor][getDormDoorData] null: ", doomId);
            callback(-1);
        }
    }
}

exports.getCurrencyToItemList = getCurrencyToItemList;
exports.categoryFromItemList = categoryFromItemList;
exports.categoryFromItemListEx = categoryFromItemListEx;
exports.BuildingMarket = BuildingMarket;
exports.BuildingInfo = BuildingInfo;
exports.HeroLevelUp = HeroLevelUp;
exports.HeroLevelUpTermAndBonus = HeroLevelUpTermAndBonus;
exports.Items = Items;
exports.Heros = Heros;
exports.HeroGachaAreas = HeroGachaAreas;
exports.HeroGahcaEvents = HeroGahcaEvents;
exports.HeroGachaRateUp = HeroGachaRateUp;
exports.GeneralAwards = GeneralAwards;
exports.HeroGachaCountPR = HeroGachaCountPR;
exports.HeroGachaBuyCountCost = HeroGachaBuyCountCost;
exports.InspirationEvent = InspirationEvent;
exports.InspirationTheme = InspirationTheme;
exports.SoulGameTheme = SoulGameTheme;
exports.SoulGameCard = SoulGameCard;
exports.SoulGameViewPoint = SoulGameViewPoint;
exports.HotSpring = HotSpring;
exports.ShortOrder = ShortOrder;
exports.LongOrder = LongOrder;
exports.AccountLevel = AccountLevel;
exports.DormDoor = DormDoor;
// 游戏购买次数
exports.GameBuyCounts = GameBuyCounts;
