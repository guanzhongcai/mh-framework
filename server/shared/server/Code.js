/**
 * 游戏中用到的常量枚举值
 */


module.exports = {
    OK: 200,          // 成功 HTTP CODE
    FAIL: 500,        // 错误

    ServiceType: {
        gateway: "gateway",
        login: "login",
        game: "game",
        config: "config",
        monitor: "monitor",
    }
};
