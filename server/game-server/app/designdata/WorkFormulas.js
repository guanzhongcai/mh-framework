// ==========================================================
// 生产经营 - 配方
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;

let FIXED_WORKFORMULAS = null

class WorkFormula
{
    // 产物类型和等级配置
    static getItemTypeAndLevelConfig(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback({ type: node.ItemType, level: node.ItemLevel });
        } else {
            console.error("[WorkFormula][getItemTypeAndLevelConfig] null: ", formulaId);
            callback(null);
        }
    }
    //异步获取配方产物的类型
    static async getWorkFormulaType (formulaId) {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            return node.ItemType;
        } else {
            console.error("[WorkFormula][getWorkFormulaType] null: ", formulaId);
            return 0;
        }
    }

    static getItemIdAndTypeConfig(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback({ ItemType: node.ItemType, ItemId: node.ItemId });
        } else {
            console.error("[WorkFormula][getItemIdAndTypeConfig] null: ", formulaId);
            callback(null);
        }
    }

    // 配方列表配置（map类型）
    static getFormulaMapConfig(callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var idxKeys = Object.keys(FIXED_WORKFORMULAS), node, formulaMap = new Map();
        for (let sFid of idxKeys) {
            node = FIXED_WORKFORMULAS[sFid];
            if (node) {
                formulaMap.set(node.FormulaId, {
                    ItemId: node.ItemId,
                    NeedTime: node.NeedTime,
                    DefaultCostEnergy: node.DefaultCostEnergy
                });
            }
        }

        callback(formulaMap);
    }

    // 产物ID配置
    static getItemIdConfig(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback(node.ItemId);
        } else {
            console.error("[WorkFormula][getItemIdConfig] null: ", formulaId);
            callback(0);
        }
    }

    // 默认消耗的体力配置
    static getDefaultCostEnergyConfig(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback(node.DefaultCostEnergy);
        } else {
            console.error("[WorkFormula][getDefaultCostEnergyConfig] null: ", formulaId);
            callback(0);
        }
    }

    // 默认消耗原材料配置
    static getDefaultCostConfig(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback(categoryFromItemList(utils.getItemArraySplitTwice(node.DefaultCost, '|', ',')));
        } else {
            console.error("[WorkFormula][getItemIdAndTypeConfig] null: ", formulaId);
            callback(0);
        }
    }

    // 所需时间配置（ms）
    static getNeedTime(formulaId, callback)
    {
        if(!FIXED_WORKFORMULAS){FIXED_WORKFORMULAS = global.FIXDB.FIXED_WORKFORMULAS}
        var node = FIXED_WORKFORMULAS[formulaId];
        if (node) {
            callback(node.NeedTime*1000);
        } else {
            console.error("[WorkFormula][getNeedTime] null: ", formulaId);
            callback(0);
        }
    }
}

module.exports = WorkFormula;
