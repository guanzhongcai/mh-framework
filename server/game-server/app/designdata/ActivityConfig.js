// ==========================================================
// 活动与触发礼包
// ==========================================================
let FIXED_ACTIVITY = null
let FIXED_ACTIVITY_INDEXES = null

let FIXED_TRIGGERPURCHASE = null

class Activity
{
    static getActivityConfigData(rid)
    {
        if(!FIXED_ACTIVITY){FIXED_ACTIVITY = global.FIXDB.FIXED_ACTIVITY}
        return FIXED_ACTIVITY[rid];
    }

    static getActivityDataByTypeAndIndex (atype, aindex) {
        if (!FIXED_ACTIVITY) {FIXED_ACTIVITY = global.FIXDB.FIXED_ACTIVITY}
        if (!FIXED_ACTIVITY_INDEXES) {FIXED_ACTIVITY_INDEXES = global.FIXDB.FIXED_ACTIVITY_INDEXES}
        let activityList = FIXED_ACTIVITY_INDEXES['Type' + atype], node;
        if (activityList != null) {
            for (let aid of activityList) {
                node = FIXED_ACTIVITY[aid]
                if (node.Param1 === aindex) {
                    return node
                }
            }
        }
        return null
    }

    static getTriggerGiftConfigData (triggerId) {
        if(!FIXED_TRIGGERPURCHASE){FIXED_TRIGGERPURCHASE = global.FIXDB.FIXED_TRIGGERPURCHASE}
        for (let trigger of FIXED_TRIGGERPURCHASE) {
            if (trigger.PurchaseId === triggerId) {
                return trigger;
            }
        }
        return null
    }

    static getTriggerGiftByGiftId (giftId) {
        if(!FIXED_TRIGGERPURCHASE){FIXED_TRIGGERPURCHASE = global.FIXDB.FIXED_TRIGGERPURCHASE}
        return FIXED_TRIGGERPURCHASE[giftId];
    }

    static getTriggerGiftIdByChargeId (rechargeId) {
        if(!FIXED_TRIGGERPURCHASE){FIXED_TRIGGERPURCHASE = global.FIXDB.FIXED_TRIGGERPURCHASE}
        for (let trigger of FIXED_TRIGGERPURCHASE) {
            if (trigger.RechargeId === rechargeId) {
                return trigger;
            }
        }
        return null
    }
}

module.exports = Activity;