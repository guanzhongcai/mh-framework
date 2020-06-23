// ==========================================================
// 技能效果配置表
// ==========================================================

let FIXED_SKILLEFFECTS = null

class SkillEffects
{
    static getEffectListByGroupConfig(triggerType, effectIdGroup, callback)
    {
        if(!FIXED_SKILLEFFECTS){FIXED_SKILLEFFECTS = global.FIXDB.FIXED_SKILLEFFECTS}
        var obj = {}, node;
        for (let effNode of effectIdGroup) {
            node = FIXED_SKILLEFFECTS[effNode.EffectID];
            if (node && node.Type === triggerType) {
                obj[effNode.SkillID] = node;
            }
        }
        callback(obj);
    }

    static getEffectListByGroup(triggerType, effectIdGroup)
    {
        if(!FIXED_SKILLEFFECTS){FIXED_SKILLEFFECTS = global.FIXDB.FIXED_SKILLEFFECTS}
        var obj = {}, node;
        for (let effNode of effectIdGroup) {
            node = FIXED_SKILLEFFECTS[effNode.EffectID];
            if (node && node.Type === triggerType) {
                obj[effNode.SkillID] = node;
            }
        }
        return obj;
    }

    static getSkillEffect (effectId)
    {
        if(!FIXED_SKILLEFFECTS){FIXED_SKILLEFFECTS = global.FIXDB.FIXED_SKILLEFFECTS}
        return FIXED_SKILLEFFECTS[effectId];
    }
}

module.exports = SkillEffects;
