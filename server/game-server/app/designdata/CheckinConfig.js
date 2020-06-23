// ============================================================
// 签到
// ============================================================

const utils = require('./../common/utils');
const categoryFromItemList = require("./../scripts/controllers/fixedController").categoryFromItemList;
let FIXED_CHECKINREWARDS = null
let FIXED_CHECKINRULE = null

class CheckinConfig
{
    // 签到奖励
    static getBonus(id)
    {
        if(!FIXED_CHECKINREWARDS){
            FIXED_CHECKINREWARDS = global.FIXDB.FIXED_CHECKINREWARDS
        }
        var node = FIXED_CHECKINREWARDS[id];
        if (node) {
            return categoryFromItemList(utils.getItemArraySplitTwice(node.Bonus, '|', ','));
        } else {
            console.warn("[CheckinConfig][getBonus] Can't find bonus:", id);
            return null;
        }
    }

    // 获取规则
    static getRule(heroId)
    {
        const _getBaseTimestamp = (bTim, timLmts) => {
            var now = new Date(),
                nowDate = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(),
                baseSt = new Date(nowDate + ' ' + bTim).getTime(),
                minBaseSt = baseSt - utils.getMSByTime(timLmts[0]),
                maxBaseSt = baseSt + utils.getMSByTime(timLmts[1]);

            // 范围内获取随机时间戳
            return utils.getLimitRandom(minBaseSt, maxBaseSt);
        }

        if(!FIXED_CHECKINRULE){
            FIXED_CHECKINRULE = global.FIXDB.FIXED_CHECKINRULE
        }

        var node = FIXED_CHECKINRULE[heroId];
        if (node) {
            var baseTime = utils.randomListByWeight(utils.getHashArraySplitTwice(node.BaseTimeWeights, ';', '|', true))[0],
                timeLimits = node.TimeFluctuateLimits.split('|'),
                signLimits = utils.splitToIntArray(node.SignScaleLimits, ':'),
                signScale = utils.getLimitRandom(Number(signLimits[0]), Number(signLimits[1])),
                signPosLimits = utils.splitToIntArray(node.SignPosLimits, ':'),
                signPos = utils.getLimitRandom(Number(signPosLimits[0]), Number(signPosLimits[1])),
                pullCheckinHeroId = utils.randomListByWeight(utils.getHashArraySplitTwice(node.PullCheckinWeights, ';', '|', true))[0];

            return {
                BaseTime: _getBaseTimestamp(baseTime, timeLimits),
                SignScale: signScale,
                SignPos: signPos,
                CheckinRand: node.CheckinRand,
                PullCheckinRand: node.PullCheckinRand,
                PullCheckinHeroId: Number(pullCheckinHeroId)
            };
        } else {
            console.warn("[CheckinConfig][getRule] Can't find hero check-in rule:", heroId);
            return null;
        }
    }
}

module.exports = CheckinConfig;
