function ErrorCodes()
{
    return {
        SUCCESS: 200, // 成功
        SERVERSTATUS_NOTFOUND:400,  // 未找到服务器
        SERVERSTATUS_NOTOPEN:401,   //服务器未开放
        SERVERSTATUS_CLOSED:402,    //服务器已关闭
        SERVERSTATUS_MAINTENANCE:403,   //服务器维护中  例行维护
        SERVERSTATUS_EMERGENCYMAINTENANCE:404, //服务器紧急维护中
    }
}

module.exports = ErrorCodes;