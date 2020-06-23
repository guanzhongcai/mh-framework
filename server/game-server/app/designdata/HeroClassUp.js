// ==========================================================
// 墨魂突破条件.xlsx
// ==========================================================
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
const utils = require('./../common/utils');

// ============================================================= NEW
let FIXED_HEROCLASSUP = null
let FIXED_HEROCLASSUP_INDEXES = null
// ============================================================= NEW

class HeroClassUp
{
    static getNeedClassUpConfig(heroId, level, callback)
    {
        if(!FIXED_HEROCLASSUP){FIXED_HEROCLASSUP = global.FIXDB.FIXED_HEROCLASSUP}
        if(!FIXED_HEROCLASSUP_INDEXES){FIXED_HEROCLASSUP_INDEXES = global.FIXDB.FIXED_HEROCLASSUP_INDEXES}
        var idxLis = FIXED_HEROCLASSUP_INDEXES['HeroID' + heroId],
            node, needCost, needFeel;
        for(let heroClassUpId of idxLis) {
            node = FIXED_HEROCLASSUP[heroClassUpId];
            if (node.Level === level) {
                needFeel = node.NeedFeel;
                needCost =  categoryFromItemList(utils.getItemArraySplitTwice(node.NeedCost, '|', ','));
                break;
            }
        }

        callback({ NeedCost: needCost, NeedFeel: needFeel });
    }

    static getObjUnlockSkillConfig(heroId, level, callback)
    {
        if(!FIXED_HEROCLASSUP){FIXED_HEROCLASSUP = global.FIXDB.FIXED_HEROCLASSUP}
        if(!FIXED_HEROCLASSUP_INDEXES){FIXED_HEROCLASSUP_INDEXES = global.FIXDB.FIXED_HEROCLASSUP_INDEXES}
        var idxLis = FIXED_HEROCLASSUP_INDEXES['HeroID' + heroId],
        node, unlockSKill = '', strengthSkill = '';
        for(let heroClassUpId of idxLis) {
            node = FIXED_HEROCLASSUP[heroClassUpId];
            if (node.Level === level) {
                unlockSKill = node.UnlockSkill;
                strengthSkill = node.StrengthenSkills;
                break;
            }
        }
        var skillUnlockInfo = {};
        var obj = {};
        var chunks = utils.splitToIntArray(unlockSKill, ',');
        for (let i in chunks) {
            obj[chunks[i]] = true;
        }

        var strengths = {};
        var schunks = utils.splitToIntArray(strengthSkill, ',');
        for (let i in schunks) {
            strengths[schunks[i]] = true;
        }

        skillUnlockInfo.unlockSKill = obj;
        skillUnlockInfo.strengthSkill = strengths;
        callback(skillUnlockInfo);
    }

    static getUnlockSkillListByGroupConfig(heroGroup, callback)
    {
        if(!FIXED_HEROCLASSUP){FIXED_HEROCLASSUP = global.FIXDB.FIXED_HEROCLASSUP}
        if(!FIXED_HEROCLASSUP_INDEXES){FIXED_HEROCLASSUP_INDEXES = global.FIXDB.FIXED_HEROCLASSUP_INDEXES}
        var idxLis = [], heroLis;
        for (let heroId of heroGroup) {
            heroLis = FIXED_HEROCLASSUP_INDEXES['HeroID' + heroId];
            if (heroLis) {
                idxLis = idxLis.concat(heroLis);
            }
        }

        var lis = [];
        for (let heroClassUpId of idxLis) {
            var obj = {};
            var strengths = {}
            var node = FIXED_HEROCLASSUP[heroClassUpId];
            var chunks = utils.splitToIntArray(node.UnlockSkill, ',');
            for (let i in chunks) {
                obj[chunks[i]] = true;
            }
            var schunks = utils.splitToIntArray(node.StrengthenSkills, ',');
            for (let i in schunks) {
                strengths[schunks[i]] = true;
            }
            lis.push({
                HeroID: node.HeroID,
                Level: node.Level,
                UnlockSkill: obj,
                StrengthenSkills:strengths
            });
        }

        callback(lis);
    }
}

module.exports = HeroClassUp;
