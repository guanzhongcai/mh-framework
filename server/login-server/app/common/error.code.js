
exports.getCode = () =>
{
    return {
        SUCCESS: 200, // 成功
        SERVERSTATUS_NOTFOUND:400,  // 未找到服务器
        SERVERSTATUS_NOTOPEN:401,   //服务器未开放
        SERVERSTATUS_CLOSED:402,    //服务器已关闭
        SERVERSTATUS_MAINTENANCE:403,   //服务器维护中  例行维护
        SERVERSTATUS_EMERGENCYMAINTENANCE:404, //服务器紧急维护中

        FAILED: 500,  // 内部服务器错误
        PARAMS_ERROR: 501, // 参数错误
        PLAYER_NOT_INVITED: 701, // 非邀请玩家
        GIFT_CODE_ERROR: 770, // 无效礼包码
        INVITE_CODE_ERROR: 771, // 无效邀请码
        INVITE_CODE_USED: 772, // 邀请码已被使用
        INVITE_CODE_EXPIRE: 773, // 邀请码过期
        ACCOUNT_BIND_INVITE_CODE: 774 // 账号已绑定邀请码
    }
}
