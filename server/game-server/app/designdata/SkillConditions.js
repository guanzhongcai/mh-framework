// ==========================================================
// 技能条件配置表
// ==========================================================

let FIXED_SKILLCONDITION = null

class SkillConditions
{
    static async getSkillConditionGroup(confiditonIdGroup)
    {
        if(!FIXED_SKILLCONDITION){FIXED_SKILLCONDITION = global.FIXDB.FIXED_SKILLCONDITION}
        var obj = {}, node;
        for (let confNode of confiditonIdGroup) {
            node = FIXED_SKILLCONDITION[confNode];
            if (node) {
                obj[confNode] = node;
            }
        }
        return obj;
    }

    static getSkillCondition (cond) {
        if(!FIXED_SKILLCONDITION){FIXED_SKILLCONDITION = global.FIXDB.FIXED_SKILLCONDITION}
        return FIXED_SKILLCONDITION[cond];
    }
}

module.exports = SkillConditions;
