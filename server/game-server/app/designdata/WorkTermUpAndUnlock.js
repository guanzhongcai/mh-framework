// ==========================================================
// 生产经营 - 建筑等级与解锁配方
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;

let FIXED_WORKTERMUPANDUNLOCK = null;
let FIXED_WORKTERMUPANDUNLOCK_INDEXES = null

class WorkTermUpAndUnlock
{
    static getBuildingLevelUpListConfig()
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node, idxKeys = Object.keys(FIXED_WORKTERMUPANDUNLOCK), lis = [];
        for (let sId of idxKeys) {
            node = FIXED_WORKTERMUPANDUNLOCK[sId];
            if (node) {
                lis.push({
                    Id: node.Id,
                    BuildingId: node.BuildingId,
                    Level: node.Level,
                    RepairCd: node.RepairCd * 1000
                });
            }
        }
        return lis;
    }

    // 根据建筑等级获取ID
    static getIdByLevelConfig(bid, currLevel)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        if(!FIXED_WORKTERMUPANDUNLOCK_INDEXES){FIXED_WORKTERMUPANDUNLOCK_INDEXES = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK_INDEXES}
        var idLis = FIXED_WORKTERMUPANDUNLOCK_INDEXES['BuildingId' + bid], node, Id = 0;
        if (idLis) {
            for (let id of idLis) {
                node = FIXED_WORKTERMUPANDUNLOCK[id];
                if (node && node.Level === currLevel) {
                    Id = id;
                    break;
                }
            }
        }
        return Id;
    }

    // 升级的ID配置
    static getUpIdConfig(bid, currLevel)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        if(!FIXED_WORKTERMUPANDUNLOCK_INDEXES){FIXED_WORKTERMUPANDUNLOCK_INDEXES = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK_INDEXES}
        var idLis = FIXED_WORKTERMUPANDUNLOCK_INDEXES['BuildingId' + bid], node, Id = 0;
        for (let id of idLis) {
            node = FIXED_WORKTERMUPANDUNLOCK[id];
            if (node && node.Level === (currLevel + 1)) {
                Id = id;
                break;
            }
        }
        return Id;
    }

    // 获取判断条件
    static getBuildingLevelUpConditionConfig(configId)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[configId];
        if (node) {
            var chunks = node.UpCondition.split('|'), valid = true, lis = [];
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
                console.warn("[WorkTermUpAndUnlock][getBuildingLevelUpConditionConfig]", configId, node.UpCondition);
                return null;
            }
        } else {
            console.warn("[WorkTermUpAndUnlock][getBuildingLevelUpConditionConfig]", configId);
            return null;
        }
    }

    // 根据选项获取消耗
    static getBuildingLevelUpCostConfig(configId, selectType=1)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[configId];
        if (node) {
            var chunks = node.UpCost.split('-');
            if (chunks[selectType-1]) {
                return categoryFromItemList(utils.getItemArraySplitTwice(chunks[selectType-1], '|', ','));
            } else {
                console.warn("[WorkTermUpAndUnlock][getBuildingLevelUpCostConfig]", configId, selectType, node.UpCost);
                return null;
            }
        } else {
            console.warn("[WorkTermUpAndUnlock][getBuildingLevelUpCostConfig]", configId, selectType);
            return null;
        }
    }

    // 升级条件配置
    static getUpConditionConfig(id)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[id];
        if (node) {
            var terms = [], tmps = utils.getItemArraySplitTwice(node.UpCondition, '|', ',');
            for (let i in tmps) {
                terms.push({
                    type: tmps[i].id,
                    value: tmps[i].count
                });
            }
            return terms;
        } else {
            console.error("[WorkTermUpAndUnlock][getUpConditionConfig] null: ", id);
            return null;
        }
    }

    // 升级消耗配置
    static getUpCostConfig(id)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[id];
        if (node) {
            return categoryFromItemList(utils.getItemArraySplitTwice(node.UpCost, '|', ','));
        } else {
            console.error("[WorkTermUpAndUnlock][getUpCostConfig] null: ", id);
            return null;
        }
    }

    // 修复时间配置
    static getRepairCdConfig(id, callback)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[id];
        if (node) {
            return node.RepairCd * 1000;
            callback();
        } else {
            console.error("[WorkTermUpAndUnlock][getRepairCdConfig] null: ", id);
            return null;
        }
    }

    // 奖励经验配置
    static getExpBonusConfig(id, callback)
    {
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[id];
        if (node) {
            return node.ExpBonus;
        } else {
            console.error("[WorkTermUpAndUnlock][getExpBonusConfig] null: ", id);
            return 0;
        }
    }

    // 开启配方列表配置
    static getOpenFormulaListConfig(id, callback)
    {
        const FIELD_MAX = 3;
        var query = [];
        for (let i = 1; i <= FIELD_MAX; i++) {
            query.push('FormulaId'+i);
            query.push('FormulaStartedDate'+i);
            query.push('FormulaExpiredDate'+i);
        }

        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var node = FIXED_WORKTERMUPANDUNLOCK[id];
        if (node) {
            var formulaIdList = [];
            var now = utils.getTime();
            for (let i = 1; i <= FIELD_MAX; i++) {
                var formulaId = node['FormulaId'+i],
                    formulaStartedDate = node['FormulaStartedDate'+i],
                    formulaExpiredDate = node['FormulaExpiredDate'+i];

                if (formulaId > 0) {
                    // 判断起止日期
                    var started = (formulaStartedDate === '') ? now : utils.getTime(formulaStartedDate);
                    var expired = (formulaExpiredDate === '') ? now : utils.getTime(formulaExpiredDate);
                    if (now >= started && now <= expired) {
                        formulaIdList.push(formulaId);
                    }
                }
            }
            return formulaIdList;
        } else {
            console.error("[WorkTermUpAndUnlock][getOpenFormulaListConfig] null: ", id);
            return [];
        }
    }

    // 全部开启配方列表（map类型）
    static getOpenFormulaMapConfig(callback)
    {
        const FIELD_MAX = 3;
        var openFormulaMap = new Map();
        if(!FIXED_WORKTERMUPANDUNLOCK){FIXED_WORKTERMUPANDUNLOCK = global.FIXDB.FIXED_WORKTERMUPANDUNLOCK}
        var idxKeys = Object.keys(FIXED_WORKTERMUPANDUNLOCK), node, now = (new Date()).getTime();
        for (let sId of idxKeys) {
            node = FIXED_WORKTERMUPANDUNLOCK[sId];
            if (node) {
                var formulaIdList = [];
                for (let i = 1; i <= FIELD_MAX; i++) {
                    var formulaId = node['FormulaId' + i],
                        formulaStartedDate = node['FormulaStartedDate' + i],
                        formulaExpiredDate = node['FormulaExpiredDate' + i];
                    if (formulaId > 0) {
                        // 判断起止日期
                        var started = (formulaStartedDate === '') ? now : utils.getTime(formulaStartedDate);
                        var expired = (formulaExpiredDate === '') ? now : utils.getTime(formulaExpiredDate);
                        if (now >= started && now <= expired) {
                            formulaIdList.push(formulaId);
                        }
                    }
                }
                openFormulaMap.set(node.Id, {
                    id: node.Id,
                    buildingId: node.BuildingId,
                    level: node.Level,
                    formulaList: formulaIdList
                });
            }
        }
        callback(openFormulaMap);
    }
}

module.exports = WorkTermUpAndUnlock;
