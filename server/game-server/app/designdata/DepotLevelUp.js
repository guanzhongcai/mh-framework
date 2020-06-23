// ==========================================================
// 仓库升级
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
let FIXED_DEPOTLEVELUP = null
let FIXED_DEPOTLEVELUP_INDEXES = null

class DepotLevelUp
{
    static getDepotListByTypeConfig(depotType, callback)
    {
        if(!FIXED_DEPOTLEVELUP){FIXED_DEPOTLEVELUP = global.FIXDB.FIXED_DEPOTLEVELUP}
        if(!FIXED_DEPOTLEVELUP_INDEXES){FIXED_DEPOTLEVELUP_INDEXES = global.FIXDB.FIXED_DEPOTLEVELUP_INDEXES}
        var lis = [], idLis, node;
        idLis = FIXED_DEPOTLEVELUP_INDEXES['Type' + depotType];
        for (let id of idLis) {
            node = FIXED_DEPOTLEVELUP[id];
            if (node) {
                lis.push({
                    DepotID: node.DepotID,
                    Level: node.Level,
                    NeedCost: categoryFromItemList(utils.getItemArraySplitTwice(node.NeedCost, '|', ',')),
                    BonusExp: node.BonusExp
                })
            }
        }

        callback(lis);
    }
}

module.exports = DepotLevelUp;
