exports.getServerStatusCode = () =>
{
    return {
        OK: 0,      //正常
        NOTOPEN: 1, //未找到服务器
        CLOSED:2,   //服务器关闭
        MAINTENANCE:3, //服务器维护中
        EMERGENCYMAINTENANCE:4 //紧急维护中
    }
}
