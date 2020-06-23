// ==========================================================
// 答题奖励
// ==========================================================
const utils = require('./../common/utils');
let FIXED_QUZIREWARD = null

class QuizReward
{
    static getQuizRewardByTime(time, callback)
    {
        if(!FIXED_QUZIREWARD){FIXED_QUZIREWARD = global.FIXDB.FIXED_QUZIREWARD}
        var lis = FIXED_QUZIREWARD, res = [];
        for (let i in lis) {
            res.push(lis[i]);
        }

        res.sort((a, b) => { return a.Time > b.Time; });
        let targetReward = null;
        for (let j = 0; j < res.length; j++) {
            if (time <= res[j].Time) {
                targetReward = {
                    Id: res[j].Id,
                    Time: res[j].Time,
                    RewardCount: res[j].RewardCount,
                    Exp: res[j].Exp,
                    RewardItems: res[j].RewardItems,
                    RewardAttrs: res[j].RewardAttrs
                }
                break
            }
        }
        if (targetReward == null) {
            targetReward = {
                Id: res[res.length - 1].Id,
                Time: res[res.length - 1].Time,
                RewardCount: res[res.length - 1].RewardCount,
                Exp: res[res.length - 1].Exp,
                RewardItems: res[res.length - 1].RewardItems,
                RewardAttrs: res[res.length - 1].RewardAttrs
            }
        }
        targetReward.RewardItems = utils.splitItemList (targetReward.RewardItems, ',');
        targetReward.RewardAttrs = utils.splitItemList (targetReward.RewardAttrs, ',');
        callback (targetReward);
    }
}

module.exports = QuizReward;
