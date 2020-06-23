// ==========================================================
// 生产经营 - 建筑扩展信息
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;

let FIXED_WORKBUILDINGEXPEND = null

class WorkBuildingExpend
{
    static getHeroGridMaxConfig(callback)
    {
        return 3;
    }

    static getDefaultOpenHeroGridConfig () {
        return 1
    }

    static getWorkGridMaxConfig(callback)
    {
        callback(6);
    }

    static getItemGridMaxConfig(callback)
    {
        callback(6);
    }

    // 建筑ID列表配置
    static getBuildingIdGroupConfig(callback)
    {
        if(!FIXED_WORKBUILDINGEXPEND){FIXED_WORKBUILDINGEXPEND = global.FIXDB.FIXED_WORKBUILDINGEXPEND}
        var idxKeys = Object.keys(FIXED_WORKBUILDINGEXPEND), bidGroup = [];
        for (let sBid of idxKeys) {
            bidGroup.push(parseInt(sBid));
        }
        callback(bidGroup);
    }

    static getGridUnlockConditionConfig(modname, bid, grid)
    {
        var queryField;
        if (modname === 'hero') {
            queryField = 'HeroGridUnlockCondition'+grid;
        } else if (modname === 'work') {
            queryField = 'WorkGridUnlockCondition'+grid;
        } else if (modname === 'item') {
            queryField = 'ItemGridUnlockCondition'+grid;
        }
        if(!FIXED_WORKBUILDINGEXPEND){FIXED_WORKBUILDINGEXPEND = global.FIXDB.FIXED_WORKBUILDINGEXPEND}

        var node = FIXED_WORKBUILDINGEXPEND[bid];
        if (node) {
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


    // 墨魂格子队列解锁（条件，消耗）
    static getHeroGridUnlockCostConfig(bid, grid, selectType=1)
    {
        if(!FIXED_WORKBUILDINGEXPEND){FIXED_WORKBUILDINGEXPEND = global.FIXDB.FIXED_WORKBUILDINGEXPEND}
        var node = FIXED_WORKBUILDINGEXPEND[bid];
        if (node) {
            var chunks = node['HeroGridUnlockCost'+grid].split('-');
            if (chunks[selectType-1]) {
                return categoryFromItemList(utils.getItemArraySplitTwice(chunks[selectType-1], '|', ','));
            } else {
                console.warn("[WorkBuildingExpend][getHeroGridUnlockCostConfig]", bid, grid, selectType, node['HeroGridUnlockCost'+grid]);
                return null;
            }
        } else {
            console.warn("[WorkBuildingExpend][getHeroGridUnlockCostConfig]", bid, grid, selectType);
            return null;
        }
    }

    // 生产格子队列解锁（条件，消耗）
    static getWorkGridUnlockCostConfig(bid, grid, selectType=1)
    {
        if(!FIXED_WORKBUILDINGEXPEND){FIXED_WORKBUILDINGEXPEND = global.FIXDB.FIXED_WORKBUILDINGEXPEND}
        var node = FIXED_WORKBUILDINGEXPEND[bid];
        if (node) {
            var chunks = node['WorkGridUnlockCost'+grid].split('-');
            if (chunks[selectType-1]) {
                return categoryFromItemList(utils.getItemArraySplitTwice(chunks[selectType-1], '|', ','));
            } else {
                console.warn("[WorkBuildingExpend][getWorkGridUnlockCostConfig]", bid, grid, selectType, node['WorkGridUnlockCost'+grid]);
                return null;
            }
        } else {
            console.warn("[WorkBuildingExpend][getWorkGridUnlockCostConfig]", bid, grid, selectType);
            return null;
        }
    }

    // 产物格子队列解锁（条件，消耗）
    static getItemGridUnlockCostConfig(bid, grid, selectType=1)
    {
        if(!FIXED_WORKBUILDINGEXPEND){FIXED_WORKBUILDINGEXPEND = global.FIXDB.FIXED_WORKBUILDINGEXPEND}
        var node = FIXED_WORKBUILDINGEXPEND[bid];
        if (node) {
            var chunks = node['ItemGridUnlockCost'+grid].split('-');
            if (chunks[selectType-1]) {
                return categoryFromItemList(utils.getItemArraySplitTwice(chunks[selectType-1], '|', ','));
            } else {
                console.warn("[WorkBuildingExpend][getItemGridUnlockCostConfig]", bid, grid, selectType, node['ItemGridUnlockCost'+grid]);
                return null;
            }
        } else {
            console.warn("[WorkBuildingExpend][getItemGridUnlockCostConfig]", bid, grid, selectType);
            return null;
        }
    }
}

module.exports = WorkBuildingExpend;
