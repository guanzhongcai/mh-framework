function ERRCODES()
{
    return {
        SUCCESS: 200, // 成功
        FAILED: 500,  // 内部服务器错误
        PARAMS_ERROR: 501, // 参数错误

        // 引导赠送
        PLAYER_IS_ALREADY_HAVE: 600, // 墨魂已存在
        PLAYER_GAME_HEAD_LOCKED: 601, // 游戏头像未解锁

        // player(700)
        PLAYER_LEVEL_VALID_FAILED: 700, // 玩家等级不足
        PLAYER_NOT_INVITED: 701, // 非邀请玩家

        // WORKING(710)
        WORK_ID_ERROR: 710, // 配方ID不正确
        HAS_NO_HERO_WORKING: 711, // 没有工作墨魂

        // currency(730),
        CURRENCY_NOT_ENOUGH: 730, // 货币不足
        CURRENCY_TYPE_ERROR: 731, // 货币类型错误
        CURRENCY_NUM_ERROR: 732, // 货币数值错误

        // item(740)
        ITEM_NOT_ENOUGH: 740, // 物品不足
        ITEM_NOT_CONSUME: 741, // 非消耗物品

        // shop(750)
        SHOP_LEVEL_NOT_ENOUGH: 750, // 未达到开放等级
        SHOP_REFRESH_FAILED: 751, // 刷新失败
        SHOP_SHOPPING_FAILED: 752, // 购买失败
        SHOP_MENU_CONFIG_WRONG: 753, // 商店列表配置错误
        SHOP_GRID_ADD_FAILED: 754, // 增加格子失败
        MARKET_NO_GOODS_ITEM: 755, // 游戏商城没有对应物品

        // order(760)
        ORDER_REFRESH_CONF_ERROR: 760, // 刷新配置表错误（系无法刷新）
        ORDER_IS_CHANNEL: 761, // 该订单已被取消
        ORDER_IS_ON_GOING: 762, // 订单进行中

        // codes(770)
        GIFT_CODE_ERROR: 770, // 无效礼包码
        INVITE_CODE_ERROR: 771, // 无效邀请码

        // hero(780)
        HERO_DATA_ERROR: 780, // 墨魂数据错误
        HERO_IS_NOT_EXIST: 781, // 墨魂不存在
        HERO_DRAW_REALLY_UNLOCK: 782, // 墨魂立绘已解锁
        HERO_EATING_FULL: 783, // 墨魂不需要进食
        HERO_HUNGRY_NOT_ENOUGH: 784, // 饱食值不足
        HERO_CANNOT_SEND_GIFT: 785, // 已达上限无法送礼
        HERO_NOT_IN_HOUSE: 786, // 墨魂未入住
        HERO_CANNOT_WORK: 787, // 墨魂不能工作（不是空闲状态）
        HERO_ENERGY_NOT_ENGOUTH: 788, // 墨魂体力不足
        HERO_IS_WORKING: 789, // 墨魂已在工作
        HERO_ATTRS_NOT_ENOUGH: 790, // 墨魂属性有不足

        // building(790)
        HAS_BUILDING: 791, // 已有建筑

        // 探索墨魂功能
        HERO_GACHA_TYPE_ERR: 800, // 探索墨魂类型错误
        HERO_GACHA_COUNT_NONE: 801, // 没有探索墨魂次数
        HERO_GACHA_GRID_IS_OPEN: 802, // 探索墨魂该格子已开启
        HERO_GACHA_BUY_FULL: 803, // 已达购买上限
        HERO_GACHA_NOT_OPEN: 804, // 探索点未开启
        HERO_GACHA_TIME_IS_OVER: 805, // 探索点已结束

        // 灵感玩法功能
        INSP_COUNT_NOT_ENGOUTH: 810, // 灵感次数不足
        INSP_THEME_UNLOCK: 811, // 灵感主题未解锁
        INSP_THEME_IS_UNLOCK: 812, // 灵感主题已解锁
        INSP_COUNT_IS_FULL: 813, // 灵感次数已达上限
        INSP_NO_BUY_COUNT: 814, // 灵感已无购买次数
        INSP_AP_NOT_ENGOUTH: 815, // 灵感掷骰子行动力不足
        INSP_GRID_REALLY_TRIGGER: 816, // 灵感格子已触发
        INSP_PLAY_HERO_NONE: 817, // 没有上阵墨魂
        INSP_GAME_IS_OVER: 818, // 灵感已结束
        INSP_THEME_UNLOCK_NOT_ENOUGH: 819, // 未达到解锁条件
        INSP_THEME_REWARD_HAS_EECEIVE: 820, // 已领取
        INSP_THEME_REWARD_NOT_ENOUGH: 821, // 未达到领取条件
        INSP_THEME_BUFF_NOT_ENOUGH: 822, // 无此buff

        //魂力玩法
        SOULGAME_COUNT_NOT_ENGOUTH: 830, // 魂力玩法次数不足
        SOULGAME_ISNOT_OVER: 831, // 魂力玩法未结束，不能开始新的对局
        SOULGAME_COUNT_IS_FULL: 832, // 魂力玩法次数已达上限
        SOULGAME_NO_BUY_COUNT: 833,  // 魂力玩法无购买上限
        SOULGAME_GAME_IS_OVER: 834,  // 魂力玩法游戏已结束
        SOULGAME_THEME_ISNOTMATCH : 835, //魂力玩法主题不匹配
        SOULGAME_CARD_ISNOT_VALID : 836, //卡牌未找到

        // 温泉
        HOTSPRING_IS_ALREADY_BUYOUT: 840, //温泉已买断
        HOTSPRING_NOT_BUY_TICKET: 841,  //未购买温泉卷
        HOTSPRING_IS_ALREADY_INBATH: 842, // 墨魂已经是入浴状态
        HOTSPRING_NOT_INBATH: 843,  // 墨魂未入浴状态
        HOTSPRING_NOT_VALID_TIME: 844, //非入浴时间
        HOTSPRING_NOT_HAVE_FEELDATA: 845, // 没有心情事件内容

        // 订单
        ORDER_CANNOT_BUY_ORDERTIME: 850, // 订单购买次数已达上限
        ORDER_NOT_HAVE_FREEREFRESH_TIME: 851, // 没有免费刷新次数
        ORDER_NOT_SET_HERO: 852,    // 未配置短订单墨魂
        ORDER_NOT_EXIST: 853,   // 订单不存在
        ORDER_SETHERO_TIME_INVALID: 854, // 短时间不能反复设置墨魂未订单墨魂
        ORDER_HERO_NOT_MATCH: 855, //墨魂不匹配
        ORDER_COMPLETE_REACH_MAX: 856, // 今日完成订单数量已达上限
        ORDER_TIMELIMITED_INVALID: 857, // 限时订单已失效

        ORDER_LONGORDER_ISUNLOCKDED: 858, // 长订单单个格子已解锁
        ORDER_LONGORDER_ISLOADED: 859, // 长订单单个需求已装载
        ORDER_LONGORDER_ISNOTCOMPLETE: 860, //订单未完成
        ORDER_LONGORDER_NOTSTART:861,   // 长订单尚未开始
        ORDER_LONGORDER_NOTNEEDSPEED: 862, // 长订单已开始，无需加速
        ORDER_LONGORDER_ALREADYGETREWARD: 863, // 长订单单个奖励已经领取
        ORDER_LONGORDER_REWARDNOTEXIST: 864, // 长订单单个奖励不存在
        ORDER_LONGORDER_NOTIME:865,          //长订单无装载次数
        ORDER_LONGORDER_GIRDISLOCKED:866,    //长订单单个格子未解锁
        ORDER_LONGORDER_GIRDISREACHMAX:867,  //长订单单个格子装载已超过上限
        ORDER_LONGORDER_VALUETOOLOW:868,    //长订单价值不足，无法发货

        // 生产-经营
        WORK_BUILDING_NOT_REPAIRED: 870,  // 建筑还未修复
        WORK_BUILDING_NOT_REPAIRING: 871, // 建筑未在修复中
        WORK_BUILDING_REAL_REPAIRED: 872, // 建筑重复修复
        WORK_BUILDING_LEVEL_NOT_UP: 873,  // 建筑无法升级
        WORK_LIST_CAN_NOT_UNLOCK: 874,    // 队列（墨魂、生产、产物）不可解锁
        WORK_LIST_UNLOCK_REAL_MAX: 875,   // 队列已全部解锁
        WORK_LIST_GRID_LOCKED: 876,       // 格子未开启
        WORK_LIST_ARELADY_IN_WORKING: 877, // 该格子已经开始生产
        WORK_LIST_NOT_EMPTY: 878,          // 队列有上次的产物未领取
        WORK_CANNOT_USE_FORMULA_IN_BUILDING: 879, // 该建筑无法使用该配方
        WORK_WORKING_CANNOT_TO_ITEM: 880, // 无法产出产物
        WORK_HAVE_NO_ENGOUTH_ITEM_GRID: 881, // 没有多余的产物格子
        WORK_CANNOT_FASTING: 882, // 无法被加速（无法释放主动技能）
        WORK_CONDITION_FAILED: 883, // 条件未满足
        WORK_BUILDING_LEVEL_NOT_ENGOUTH: 884, // 生产建筑等级未满足
        WORK_LIST_REVOKEINFO_ERROR:885,        //撤销生产信息错误，无法撤销
        WORK_LIST_SPEEDUP_ITEMTYPE_NOTMATCH:886,  //生产加速道具不匹配
        WORK_LIST_WORKINFO_NOT_EXIST:887, //生产信息不存在
        WORK_LIST_NOTHAVE_ITEMCOLLECT:888, //没有可领取的产物
        WORK_LIST_HERO_NOT_INGRID:889, //墨魂不在生产队列上

        // 广厦
        DORM_DOOR_NOT_NEED_REPAIRE : 890,  // 住宅无需修复
        DORM_DOOR_IS_REPAIRED: 891,   // 住宅已修复
        DORM_DOOR_IS_NOT_REPAIRED: 892, // 住宅还未修复
        DORM_DOOR_IS_MAX_LEVEL: 893,   // 住宅等级已达上限
        DORM_DOOR_ALREADY_IN_TARGET_DOOR: 894, // 墨魂已在当前住宅
        DORM_DOOR_NOT_SAME_GENDER: 895, // 房间内性别不相同
        DORM_DOOR_REACH_CAPACITY: 896, // 已达房间墨魂上限
        DORM_DOOR_HERO_NOT_IDLE: 897, // 墨魂处于非空闲状态
        DORM_DOOR_HERO_ALREADY_REST: 898, // 墨魂已是休息状态
        DORM_DOOR_RESTINFO_NOT_RIGHT: 899, // 墨魂入住信息不正常
        DORM_DOOR_HERO_NOT_REST: 900, // 墨魂非休息状态


        HERO_NO_SKIN: 903, // 墨魂没有该皮肤
        HERO_SKIN_OWN: 904, // 墨魂已有该皮肤
        HERO_SKIN_ITEM_OWN: 905, // 墨魂已有该皮肤道具
        TASK_AWARD_GETED: 906, // 任务奖励已领取
        TASK_NOT_COMPLETE: 907, // 任务未完成

        // 墨魂等级
        HERO_LEVELUP_MAX: 908, // 墨魂等级达到最大
        HERO_CANNOT_LEVELUP: 909, // 墨魂无法升级

        // 追求树
        PURSUETREE_NODE_UNLOCKED: 910, // 追求树节点已解锁
        PURSUETREE_NODE_PREVNODE_LOCKED: 911, // 追求树节点未解锁
        HERO_SKILL_REAL_UNLOCK: 912, // 墨魂技能已被解锁
        HERO_SKILL_NOT_LEVELUP: 913, // 墨魂技能无法升级

        NOTICE_ATTCH_GETED: 914, // 公告附件已领取
        NOTICE_NO_ATTCH: 915, // 公告没有附件

        SKILL_LEVEL_IS_MAX: 916, // 技能达到最大等级
        SKILL_IS_WRONG: 917, // 技能错误

        TASK_CHAPTER_NOT_UNLOCK: 918, // 前置章节未开启
        ITEM_IS_NOT_GIFT: 919, // 非礼包物品

        DEPOT_LEVEL_IS_MAX: 920, // 仓库等级已最大

        HERO_IS_EXIST: 921, // 墨魂已存在

        HERO_ENTERMOHUN_IS_EXIST: 922, // 设置墨魂已存在（4in1）


        TASK_CHAPTER_IS_OPEN: 930, // 任务章节已开启


        SKILL_LEVELUP_ITEMTYPE_ERROR: 950, //技能充能道具类型错误
        SKILL_IS_INCDSTATUS: 951,         //主动技能还在冷却中


        // 其他数据
        EXTERNAL_DATA_QUIZ_ITEM_NOTREADY: 1000, // 答题道具还未准备好
        EXTERNAL_DATA_HERO_CANNOT_QUIZ: 1001, // 墨魂还不能参加答题
        EXTERNAL_DATA_HERO_QUIZ_NOTIME: 1002, // 墨魂答题次数已耗尽
        EXTERNAL_DATA_FUNCTION_ALREADY_UNLOCK: 1003, //功能已经解锁
        EXTERNAL_DATA_QUIZ_USE_HELP_MAXTIME: 1004, //答题单次使用帮助已达上限

        // 看板问候
        VIEWRESPECT_ALREADY_GETAWARD:1010,  //已经领取过看板问候奖励
        VIEWRESPECT_PARAMS_ERROR:1011,  //看板问候信息错误

        // 签到
        CHECKIN_IS_TAKE_AWARDS: 1100, // 已领取奖励
        CHECKIN_CANNOT_FIND_BONUS: 1101, // 未找到对应奖励
        CHECKIN_CANNOT_TAKE_TOTAL_AWARDS: 1102, // 不能领取累计奖励

        TASK_IS_EXPIRED: 1200, // 任务已过期
        // 活跃度
        ACTIVE_DEGREE_AWARD_IS_TAKE: 1210, // 奖励已领
        ACTIVE_DEGREE_NOT_ENOUTH: 1211, // 活跃度未满足条件

        PURSUETREE_CURRENT_STEP_UNLOCK: 1212, // 追求树当前阶段节点未解锁

        // 邮件
        MAIL_NO_ENCLOSURE: 1300, // 没有附件奖励

        // 收集
        COLLECT_ALREADY_GOT: 1310,  //收集项之前已经添加

        // 订单系统相关错误码
        RORDER_NOT_EXIST:1401,              // 订单不存在
        RORDER_CANNOT_BUY:1402,             // 订单现在不能购买
        RORDER_CONFIG_NOTMATCH:1403,        // 订单提交信息不匹配 做订单金额与信息验证
        RORDER_FREQUENTLY:1404,             // 创建订单过于频繁
        RORDER_INVALIDSTATUS:1405,          // 无效的订单状态
        RORDER_STATUSHANDLED:1406,          // 订单状态已经处理过

        // 互动
        ACTIVITY_REWARD_GETED:1451,         // 活动奖励已领取
        ACTIVITY_REWARD_NOTMATCHCONDITION:1452, //未达到领取条件
        ACTIVITY_REWARD_CANNOTGET:1453, //活动奖励暂时不同领取
        ACTIVITY_REWARD_NOTFOUNDACTIVITY:1455, //活动未找到
        ACTIVITY_REWARD_NOTFOUNDREWARD:1456, //未找到指定奖励

        ACTIVITY_TRIGGER_NOTFOUND:1457,     //未找到触发礼包
        ACTIVITY_TRIGGER_CANNOTBUY:1458,    //触发礼包不能购买
        ACTIVITY_TRIGGER_PRICENOTFOUND:1459,    //礼包购买价格无效

        //任务
        CHAPTER_ALREADY_UNLOCK:1500,           // 章节已解锁
        PRE_CHAPTER_LOCKED:1501,           // 前置章节未解锁
        PRE_TASK_NOT_COMPLETE:1502,           // 前置章节任务未完成
    
    
    
        //任务
        ACHIEVEMENT_REWARDED:1600,           // 章节已解锁

    }
}

module.exports = ERRCODES;
