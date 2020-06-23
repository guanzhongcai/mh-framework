// ==========================================================
// 默认值
// ==========================================================
let FIXED_DEFAULTS = null

class Defaults
{
    static DEFAULTS_VALS()
    {
        return {
            SKILLEXP0: 412104,   // 上架配方技能熟练度相关
            SKILLEXP1: 412105,   // 开始生产技能熟练度相关
            SKILLEXP2: 412106,   // 使用主动技能技能熟练度相关
            HEROEXCHANGE2SKILLPOINT: 412107, //重复墨魂兑换成技能碎片数量

            QUIZCOSTITEMID: 412008,      //答题玩法消耗道具id
            QUIZCOSTITEMIDCOUNT:412001,  //答题消耗答题卷数量
            QUIZHELPITEMID: 412023,      //答题使用帮助需要的道具
            QUIZHELPITEMIDCOUNT:412003,  //练习模式下消耗小鱼干数量

            QUIZCOSTITEMCOLLECTTIME:412010, //答题每次领取奖励次数

            QUIZCOSTITEMLIMITED: 412002,  //答题卷存储上限
            QUIZHELPITEMLIMITED: 412024,    //小鱼干存储上限
            QUIZHELPITEMEXCHANGEDGOLD: 412025,   //小鱼干出售价格
        }
    }

    static getDefaultValueConfig(defaultId, callback)
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[defaultId];
        if (node) {
            callback(node.Value);
        } else {
            console.error("[Defaults][getDefaultValueConfig] null: ", defaultId);
            callback(0);
        }
    }

    static getDefaultValueConfigAsyncType (defaultId)
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[defaultId];
        if (node) {
            return node.Value;
        }else {
            console.error("[Defaults][getDefaultValueConfig] null: ", defaultId);
            return 0
        }
    }

    // 生产剔除墨魂时间
    static getWorkKickHeroTimeConfig(callback)
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412108];
        if (node) {
            callback(node.Value * 1000);
        } else {
            console.error("[Defaults][getWorkKickHeroTimeConfig] null: ", defaultId);
            callback(5 * 60 * 1000);
        }
    }

    static getWorkKickHeroTime()
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412108];
        return node ? (node.Value * 1000) : 5 * 60 * 1000;
    }

    // 获取生产根据墨魂队列人数削减所需时间的配置
    static getObjWorkCutTimeRateConfig(callback)
    {
        function getCountByDefaultId(defaultId) {
            if (defaultId === 412109) {
                return 1;
            } else if (defaultId === 412110) {
                return 2;
            } else if (defaultId === 412111) {
                return 3;
            } else {
                return 0;
            }
        }

        var node, obj = { '0': 1 };
        for (let defaultId of [412109, 412110, 412111]) {
            if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
            node = FIXED_DEFAULTS[defaultId];
            if (node) {
                obj[getCountByDefaultId(defaultId)] = node.Value / 10000;
            }
        }

        callback(obj);
    }

    static getWorkCutTimeObjectConfig()
    {
        function getCountByDefaultId(defaultId) {
            if (defaultId === 412109) {
                return 1;
            } else if (defaultId === 412110) {
                return 2;
            } else if (defaultId === 412111) {
                return 3;
            } else {
                return 0;
            }
        }

        var node, obj = { '0': 1 };
        for (let defaultId of [412109, 412110, 412111]) {
            if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
            node = FIXED_DEFAULTS[defaultId];
            if (node) {
                obj[getCountByDefaultId(defaultId)] = node.Value / 10000;
            }
        }

        return obj;
    }

    // 限时订单概率（0~100）
    static getShortTimeOrderRateConfig()
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412117];
        return (node ? node.Value : 0);
    }

    // 限时订单最大数量
    static getShortTimeOrderCountMaxConfig()
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412116];
        return (node ? node.Value : 0);
    }

    // 短订单-刷新价格
    static getShortOrderRefPrice()
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412069];
        return (node ? node.Value : 0);
    }

    // 短订单-免费刷新次数
    static getShortOrderFreeRefCount()
    {
        if(!FIXED_DEFAULTS){FIXED_DEFAULTS = global.FIXDB.FIXED_DEFAULTS}
        var node = FIXED_DEFAULTS[412068];
        return (node ? node.Value : 0);
    }
}

module.exports = Defaults;
