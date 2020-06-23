// ==========================================================
// 充值购买项
// ==========================================================

let FIXED_RECHARGE = null

class Recharge
{
    static getRechargeConfigData(rid)
    {
        if(!FIXED_RECHARGE){FIXED_RECHARGE = global.FIXDB.FIXED_RECHARGE}
        return FIXED_RECHARGE[rid];
    }
}

module.exports = Recharge;