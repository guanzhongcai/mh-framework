// ============================================================
// 每日活跃度配置
// ============================================================
let FIXED_ACTIVEDEGREEAWARDS = null
const utils = require('./../common/utils');

class ActiveDegreeAwardConfig
{
    static getBonus(id, actDegVal)
    {
        if(!FIXED_ACTIVEDEGREEAWARDS){
            FIXED_ACTIVEDEGREEAWARDS = global.FIXDB.FIXED_ACTIVEDEGREEAWARDS
        }
        var node = FIXED_ACTIVEDEGREEAWARDS[id];
        if (node) {
            if (actDegVal >= node.NeedValue) {
                return utils.getItemArraySplitTwice(node.Bonus, '|', ',');
            } else {
                return null;
            }
        } else {
            console.warn("[ActiveDegreeAwardConfig][getBonus] Can't find bonus:", id, actDegVal);
            return null;
        }
    }
}

module.exports = {
    ActiveDegreeAwardConfig
}
