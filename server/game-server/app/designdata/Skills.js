// ==========================================================
// 技能.xlsx
// ==========================================================
const utils = require('./../common/utils');
const SkillEffects = require('./SkillEffects');
const categoryFromItemListEx = require('./../scripts/controllers/fixedController').categoryFromItemListEx;

let FIXED_SKILLS = null
let FIXED_SKILLS_INDEXES = null

class Skills
{
    static SkillType () {
        return {
            PRODUCE:0,  //生产技能 被动技能
            TALENT:1,   //天赋技能
            ACTIVE:2,   //主动技能 生产中可以使用 有cd时间
            YOKE:3      //羁绊技能 和其他墨魂有关联关系 需要根据对应的列表来判断是否触发
        }
    }

    // 是否有该技能
    static checkSkillConfigValid(skillId, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        return FIXED_SKILLS[skillId] ? true : false
    }

    // 获取指定技能配置
    static getSkillConfig (skillId) {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        return FIXED_SKILLS[skillId];
    }

    // 获取技能父技能
    static getParentSkillId(skillId)
    {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return skillConfig.ParentSkillID }else { return 0 }
    }

    // 获取技能等级
    static getSkillLevelById(skillId)
    {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return skillConfig.Level }else { return 0}
    }

    // 获取技能类型
    static getSkillTypeConfig(skillId)
    {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return skillConfig.Type }else { return null}
    }


    // 获取技能冷却时间
    static getSkillCoolDownTime (skillId) {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return skillConfig.CoolDownTime }else { return 0}
    }

    // 效果ID（关联SkillEffects表）
    static getEffectIdConfig(skillId)
    {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return skillConfig.EffectID }else { return 0}
    }

    // 获取当前技能条件
    static getSkillConditionArray (skillId)
    {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) { return utils.splitToIntArray(skillConfig.Condition, ',') }else {return []}
    }

    // 获取指定技能数据
    static getSkillCheckConfigData (skillId) {
        let skillConfig = this.getSkillConfig(skillId);
        if (skillConfig != null) {
            return {Type:skillConfig.Type, Level:skillConfig.Level, EffectID:skillConfig.EffectID, Condition:utils.splitToIntArray(skillConfig.Condition, ',')}
        }else {
            return null
        }
    }

    static getSkillObjBySkillGroupConfig(skillGroup, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var obj = {}, node;
        for (let skillId of skillGroup) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                obj[node.SkillID] = {
                    SkillID: node.SkillID,
                    Type: node.Type,
                    Condition: utils.splitToIntArray(node.Condition, ',')
                }
            }
        }
        callback(obj);
    }

    static getSkillObjectBySkillList(skillLis)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var obj = {}, node;
        for (let skillId of skillLis) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                obj[node.SkillID] = {
                    SkillID: node.SkillID,
                    Type: node.Type
                }
            }
        }
        return obj;
    }

    // 获取当前技能可以升级的最大等级
    static getMaxLevelSkillLevel (skillId, callback) {
        let parentSkillId = Skills.getParentSkillId (skillId);
        if(!FIXED_SKILLS_INDEXES){FIXED_SKILLS_INDEXES = global.FIXDB.FIXED_SKILLS_INDEXES}
        var skillLis = FIXED_SKILLS_INDEXES['ParentSkillID' + parentSkillId];
        if (skillLis && skillLis.length > 0) {
            callback (skillLis.length - 1);
        }else {
            callback (0)
        }
    }

    // 根据父技能ID获取该组的最大等级技能ID
    static getMaxSkillIdConfig(parentSkillId, callback)
    {
        if(!FIXED_SKILLS_INDEXES){FIXED_SKILLS_INDEXES = global.FIXDB.FIXED_SKILLS_INDEXES}
        var skillLis = FIXED_SKILLS_INDEXES['ParentSkillID' + parentSkillId];
        if (skillLis) {
            callback(skillLis[skillLis.length-1]);
        } else {
            console.error("[Skills][getMaxSkillIdConfig] null: ", parentSkillId);
            callback(null);
        }
    }

    // 获取技能信息列表（by技能父ID）
    static getSkillListByParentIdConfig(parentId, callback)
    {
        if(!FIXED_SKILLS_INDEXES){FIXED_SKILLS_INDEXES = global.FIXDB.FIXED_SKILLS_INDEXES}
        var SkillIdLis = FIXED_SKILLS_INDEXES['ParentSkillID' + parentId], lis = [], node;
        for (let skillId of SkillIdLis) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                lis.push({
                    id: node.SkillID,
                    level: node.Level
                });
            }
        }
        callback(lis);
    }

    // 技能角色限制（这些角色无法使用该技能）
    static isRoleSkillLimited(heroId, skillId, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node = FIXED_SKILLS[skillId];
        if (node) {
            var lmtHeroList = (node.RoleLimit !== '') ? node.RoleLimit.split(',') : [];
            var isLimited = false;
            for (let i in lmtHeroList) {
                if (parseInt(lmtHeroList[i]) === heroId) {
                    isLimited = true;
                    break;
                }
            }
            callback(isLimited);
        } else {
            console.error("[Skills][isRoleSkillLimited] null: ", skillId);
            callback(null);
        }
    }

    // 学习条件
    static getStudyTermsMapConfig(skillId, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node = FIXED_SKILLS[skillId];
        if (node) {
            var studyTermMap = new Map(),
                tmps = utils.getItemArraySplitTwice(node.StudyTerms, '|', ',');
            for (let i in tmps)
                studyTermMap.set(tmps[i].id, tmps[i].count);
            callback(studyTermMap);
        } else {
            console.error("[Skills][getStudyTermsMapConfig] null: ", skillId);
            callback(null);
        }
    }

    // 学习消耗
    static getStudyCostConfig(skillId, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node = FIXED_SKILLS[skillId];
        if (node) {
            var costData = {};
            costData = categoryFromItemListEx(costData, utils.getItemArraySplitTwice(node.StudyCost, '|', ','));
            callback(costData);
        } else {
            console.error("[Skills][getStudyCostConfig] null: ", skillId);
            callback(null);
        }
    }

    // 消耗条件
    static getCostTermsMapConfig(skillId, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node = FIXED_SKILLS[skillId];
        if (node) {
            var costTermMap = new Map(),
                tmps = utils.getItemArraySplitTwice(node.CostTerms, '|', ',');
            for (let i in tmps)
                costTermMap.set(tmps[i].id, tmps[i].count);
        } else {
            console.error("[Skills][getCostTermsMapConfig] null: ", skillId);
            callback(null);
        }
    }

    static getCostMapByGroupConfig(skillGroup, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node, chunks, costLis, costMap = new Map();
        for (let skillId of skillGroup) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                costLis = [];
                chunks = utils.getItemArraySplitTwice(node.CostTerms, '|', ',');
                for (let chunk of chunks) {
                    costLis.push({
                        type: chunk.id,
                        costval: chunk.count
                    });
                }
                costMap.set(node.SkillID, costLis);
            }
        }
        callback(costMap);
    }

    /**
     *
     * @param {*} unlockSkillIdGroup 解锁的墨魂技能组
     * @param {*} callback
     */
    static getSkillEffectObjByGroupConfig(triggerType, unlockSkillIdGroup, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var skillEffLis = [], node;
        for (let skillId of unlockSkillIdGroup) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                skillEffLis.push({ SkillID: node.SkillID , EffectID: node.EffectID});
            }
        }
        SkillEffects.getEffectListByGroupConfig(triggerType, skillEffLis, EffectObjConfig => {
            callback(EffectObjConfig);
        });
    }

    static getSkillEffectObjectByList(triggerType, unlockSkillIdGroup)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var skillEffLis = [], node;
        for (let skillId of unlockSkillIdGroup) {
            node = FIXED_SKILLS[skillId];
            if (node) {
                skillEffLis.push({ SkillID: node.SkillID , EffectID: node.EffectID});
            }
        }
        return SkillEffects.getEffectListByGroup(triggerType, skillEffLis);
    }

    // type: 0 体力
    static getSkillCostValByTypeConfig(skillId, type, callback)
    {
        if(!FIXED_SKILLS){FIXED_SKILLS = global.FIXDB.FIXED_SKILLS}
        var node = FIXED_SKILLS[skillId];
        if (node) {
            var chunks = utils.getItemArraySplitTwice(node.CostTerms, '|', ','),
                vals = 0;
            for (let i in chunks) {
                if (chunks[i].id === type) {
                    vals = chunks[i].count;
                }
            }
            callback(vals);
        } else {
            console.error("[Skills][getSkillCostValByTypeConfig] null: ", skillId);
            callback(null);
        }
    }
}

module.exports = Skills;
