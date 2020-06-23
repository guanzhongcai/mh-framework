let constant = {};

constant.ERRCODES = {}
constant.ERRCODES.SUCCESS = Object.freeze(200) // 成功
constant.ERRCODES.FAILED = Object.freeze(500)  // 内部服务器错误
constant.ERRCODES.PARAMS_ERROR = Object.freeze(501) // 参数错误
constant.ERRCODES.REQUEST_INVALIDATION = Object.freeze(502) // 请求失效

// 引导赠送
constant.ERRCODES.PLAYER_IS_ALREADY_HAVE = Object.freeze(600) // 墨魂已存在
constant.ERRCODES.PLAYER_GAME_HEAD_LOCKED = Object.freeze(601) // 游戏头像未解锁

// player(700)
constant.ERRCODES.PLAYER_LEVEL_VALID_FAILED = Object.freeze(700) // 玩家等级不足
constant.ERRCODES.PLAYER_NOT_INVITED = Object.freeze(701) // 非邀请玩家

// WORKING(710)
constant.ERRCODES.WORK_ID_ERROR = Object.freeze(710) // 配方ID不正确
constant.ERRCODES.HAS_NO_HERO_WORKING = Object.freeze(711) // 没有工作墨魂

// currency(730))
constant.ERRCODES.CURRENCY_NOT_ENOUGH = Object.freeze(730) // 货币不足
constant.ERRCODES.CURRENCY_TYPE_ERROR = Object.freeze(731) // 货币类型错误
constant.ERRCODES.CURRENCY_NUM_ERROR = Object.freeze(732) // 货币数值错误

// item(740)
constant.ERRCODES.ITEM_NOT_ENOUGH = Object.freeze(740) // 物品不足
constant.ERRCODES.ITEM_NOT_CONSUME = Object.freeze(741) // 非消耗物品

// shop(750)
constant.ERRCODES.SHOP_LEVEL_NOT_ENOUGH = Object.freeze(750) // 未达到开放等级
constant.ERRCODES.SHOP_REFRESH_FAILED = Object.freeze(751) // 刷新失败
constant.ERRCODES.SHOP_SHOPPING_FAILED = Object.freeze(752) // 购买失败
constant.ERRCODES.SHOP_MENU_CONFIG_WRONG = Object.freeze(753) // 商店列表配置错误
constant.ERRCODES.SHOP_GRID_ADD_FAILED = Object.freeze(754) // 增加格子失败
constant.ERRCODES.MARKET_NO_GOODS_ITEM = Object.freeze(755) // 游戏商城没有对应物品

// order(760)
constant.ERRCODES.ORDER_REFRESH_CONF_ERROR = Object.freeze(760) // 刷新配置表错误（系无法刷新）
constant.ERRCODES.ORDER_IS_CHANNEL = Object.freeze(761) // 该订单已被取消
constant.ERRCODES.ORDER_IS_ON_GOING = Object.freeze(762) // 订单进行中

// codes(770)
constant.ERRCODES.GIFT_CODE_ERROR = Object.freeze(770) // 无效礼包码
constant.ERRCODES.INVITE_CODE_ERROR = Object.freeze(771) // 无效邀请码

// hero(780)
constant.ERRCODES.HERO_DATA_ERROR = Object.freeze(780) // 墨魂数据错误
constant.ERRCODES.HERO_IS_NOT_EXIST = Object.freeze(781) // 墨魂不存在
constant.ERRCODES.HERO_DRAW_REALLY_UNLOCK = Object.freeze(782) // 墨魂立绘已解锁
constant.ERRCODES.HERO_EATING_FULL = Object.freeze(783) // 墨魂不需要进食
constant.ERRCODES.HERO_HUNGRY_NOT_ENOUGH = Object.freeze(784) // 饱食值不足
constant.ERRCODES.HERO_CANNOT_SEND_GIFT = Object.freeze(785) // 已达上限无法送礼
constant.ERRCODES.HERO_NOT_IN_HOUSE = Object.freeze(786) // 墨魂未入住
constant.ERRCODES.HERO_CANNOT_WORK = Object.freeze(787) // 墨魂不能工作（不是空闲状态）
constant.ERRCODES.HERO_ENERGY_NOT_ENGOUTH = Object.freeze(788) // 墨魂体力不足
constant.ERRCODES.HERO_IS_WORKING = Object.freeze(789) // 墨魂已在工作
constant.ERRCODES.HERO_ATTRS_NOT_ENOUGH = Object.freeze(790) // 墨魂属性有不足

// building(790)
constant.ERRCODES.HAS_BUILDING = Object.freeze(791) // 已有建筑

// 探索墨魂功能
constant.ERRCODES.HERO_GACHA_TYPE_ERR = Object.freeze(800) // 探索墨魂类型错误
constant.ERRCODES.HERO_GACHA_COUNT_NONE = Object.freeze(801) // 没有探索墨魂次数
constant.ERRCODES.HERO_GACHA_GRID_IS_OPEN = Object.freeze(802) // 探索墨魂该格子已开启
constant.ERRCODES.HERO_GACHA_BUY_FULL = Object.freeze(803) // 已达购买上限
constant.ERRCODES.HERO_GACHA_NOT_OPEN = Object.freeze(804) // 探索点未开启
constant.ERRCODES.HERO_GACHA_TIME_IS_OVER = Object.freeze(805) // 探索点已结束

// 灵感玩法功能
constant.ERRCODES.INSP_COUNT_NOT_ENGOUTH = Object.freeze(810) // 灵感次数不足
constant.ERRCODES.INSP_THEME_UNLOCK = Object.freeze(811) // 灵感主题未解锁
constant.ERRCODES.INSP_THEME_IS_UNLOCK = Object.freeze(812) // 灵感主题已解锁
constant.ERRCODES.INSP_COUNT_IS_FULL = Object.freeze(813) // 灵感次数已达上限
constant.ERRCODES.INSP_NO_BUY_COUNT = Object.freeze(814) // 灵感已无购买次数
constant.ERRCODES.INSP_AP_NOT_ENGOUTH = Object.freeze(815) // 灵感掷骰子行动力不足
constant.ERRCODES.INSP_GRID_REALLY_TRIGGER = Object.freeze(816) // 灵感格子已触发
constant.ERRCODES.INSP_PLAY_HERO_NONE = Object.freeze(817) // 没有上阵墨魂
constant.ERRCODES.INSP_GAME_IS_OVER = Object.freeze(818) // 灵感已结束
constant.ERRCODES.INSP_THEME_UNLOCK_NOT_ENOUGH = Object.freeze(819) // 未达到解锁条件
constant.ERRCODES.INSP_THEME_REWARD_HAS_EECEIVE = Object.freeze(820) // 已领取
constant.ERRCODES.INSP_THEME_REWARD_NOT_ENOUGH = Object.freeze(821) // 未达到领取条件
constant.ERRCODES.INSP_THEME_BUFF_NOT_ENOUGH = Object.freeze(822) // 无此buff

//魂力玩法
constant.ERRCODES.SOULGAME_COUNT_NOT_ENGOUTH = Object.freeze(830) // 魂力玩法次数不足
constant.ERRCODES.SOULGAME_ISNOT_OVER = Object.freeze(831) // 魂力玩法未结束，不能开始新的对局
constant.ERRCODES.SOULGAME_COUNT_IS_FULL = Object.freeze(832) // 魂力玩法次数已达上限
constant.ERRCODES.SOULGAME_NO_BUY_COUNT = Object.freeze(833)  // 魂力玩法无购买上限
constant.ERRCODES.SOULGAME_GAME_IS_OVER = Object.freeze(834)  // 魂力玩法游戏已结束
constant.ERRCODES.SOULGAME_THEME_ISNOTMATCH = Object.freeze(835) //魂力玩法主题不匹配
constant.ERRCODES.SOULGAME_CARD_ISNOT_VALID = Object.freeze(836) //卡牌未找到

// 温泉
constant.ERRCODES.HOTSPRING_IS_ALREADY_BUYOUT = Object.freeze(840) //温泉已买断
constant.ERRCODES.HOTSPRING_NOT_BUY_TICKET = Object.freeze(841)  //未购买温泉卷
constant.ERRCODES.HOTSPRING_IS_ALREADY_INBATH = Object.freeze(842) // 墨魂已经是入浴状态
constant.ERRCODES.HOTSPRING_NOT_INBATH = Object.freeze(843)  // 墨魂未入浴状态
constant.ERRCODES.HOTSPRING_NOT_VALID_TIME = Object.freeze(844) //非入浴时间
constant.ERRCODES.HOTSPRING_NOT_HAVE_FEELDATA = Object.freeze(845) // 没有心情事件内容

// 订单
constant.ERRCODES.ORDER_CANNOT_BUY_ORDERTIME = Object.freeze(850) // 订单购买次数已达上限
constant.ERRCODES.ORDER_NOT_HAVE_FREEREFRESH_TIME = Object.freeze(851) // 没有免费刷新次数
constant.ERRCODES.ORDER_NOT_SET_HERO = Object.freeze(852)    // 未配置短订单墨魂
constant.ERRCODES.ORDER_NOT_EXIST = Object.freeze(853)   // 订单不存在
constant.ERRCODES.ORDER_SETHERO_TIME_INVALID = Object.freeze(854) // 短时间不能反复设置墨魂未订单墨魂
constant.ERRCODES.ORDER_HERO_NOT_MATCH = Object.freeze(855) //墨魂不匹配
constant.ERRCODES.ORDER_COMPLETE_REACH_MAX = Object.freeze(856) // 今日完成订单数量已达上限
constant.ERRCODES.ORDER_TIMELIMITED_INVALID = Object.freeze(857) // 限时订单已失效

constant.ERRCODES.ORDER_LONGORDER_ISUNLOCKDED = Object.freeze(858) // 长订单单个格子已解锁
constant.ERRCODES.ORDER_LONGORDER_ISLOADED = Object.freeze(859) // 长订单单个需求已装载
constant.ERRCODES.ORDER_LONGORDER_ISNOTCOMPLETE = Object.freeze(860) //订单未完成
constant.ERRCODES.ORDER_LONGORDER_NOTSTART = Object.freeze(861)   // 长订单尚未开始
constant.ERRCODES.ORDER_LONGORDER_NOTNEEDSPEED = Object.freeze(862) // 长订单已开始，无需加速
constant.ERRCODES.ORDER_LONGORDER_ALREADYGETREWARD = Object.freeze(863) // 长订单单个奖励已经领取
constant.ERRCODES.ORDER_LONGORDER_REWARDNOTEXIST = Object.freeze(864) // 长订单单个奖励不存在
constant.ERRCODES.ORDER_LONGORDER_NOTIME = Object.freeze(865)          //长订单无装载次数
constant.ERRCODES.ORDER_LONGORDER_GIRDISLOCKED = Object.freeze(866)    //长订单单个格子未解锁
constant.ERRCODES.ORDER_LONGORDER_GIRDISREACHMAX = Object.freeze(867)  //长订单单个格子装载已超过上限
constant.ERRCODES.ORDER_LONGORDER_VALUETOOLOW = Object.freeze(868)    //长订单价值不足，无法发货

// 生产-经营
constant.ERRCODES.WORK_BUILDING_NOT_REPAIRED = Object.freeze(870)  // 建筑还未修复
constant.ERRCODES.WORK_BUILDING_NOT_REPAIRING = Object.freeze(871) // 建筑未在修复中
constant.ERRCODES.WORK_BUILDING_REAL_REPAIRED = Object.freeze(872) // 建筑重复修复
constant.ERRCODES.WORK_BUILDING_LEVEL_NOT_UP = Object.freeze(873)  // 建筑无法升级
constant.ERRCODES.WORK_LIST_CAN_NOT_UNLOCK = Object.freeze(874)    // 队列（墨魂、生产、产物）不可解锁
constant.ERRCODES.WORK_LIST_UNLOCK_REAL_MAX = Object.freeze(875)   // 队列已全部解锁
constant.ERRCODES.WORK_LIST_GRID_LOCKED = Object.freeze(876)       // 格子未开启
constant.ERRCODES.WORK_LIST_ARELADY_IN_WORKING = Object.freeze(877) // 该格子已经开始生产
constant.ERRCODES.WORK_LIST_NOT_EMPTY = Object.freeze(878)          // 队列有上次的产物未领取
constant.ERRCODES.WORK_CANNOT_USE_FORMULA_IN_BUILDING = Object.freeze(879) // 该建筑无法使用该配方
constant.ERRCODES.WORK_WORKING_CANNOT_TO_ITEM = Object.freeze(880) // 无法产出产物
constant.ERRCODES.WORK_HAVE_NO_ENGOUTH_ITEM_GRID = Object.freeze(881) // 没有多余的产物格子
constant.ERRCODES.WORK_CANNOT_FASTING = Object.freeze(882) // 无法被加速（无法释放主动技能）
constant.ERRCODES.WORK_CONDITION_FAILED = Object.freeze(883) // 条件未满足
constant.ERRCODES.WORK_BUILDING_LEVEL_NOT_ENGOUTH = Object.freeze(884) // 生产建筑等级未满足
constant.ERRCODES.WORK_LIST_REVOKEINFO_ERROR = Object.freeze(885)        //撤销生产信息错误，无法撤销
constant.ERRCODES.WORK_LIST_SPEEDUP_ITEMTYPE_NOTMATCH = Object.freeze(886)  //生产加速道具不匹配
constant.ERRCODES.WORK_LIST_WORKINFO_NOT_EXIST = Object.freeze(887) //生产信息不存在
constant.ERRCODES.WORK_LIST_NOTHAVE_ITEMCOLLECT = Object.freeze(888) //没有可领取的产物
constant.ERRCODES.WORK_LIST_HERO_NOT_INGRID = Object.freeze(889) //墨魂不在生产队列上

// 广厦
constant.ERRCODES.DORM_DOOR_NOT_NEED_REPAIRE = Object.freeze(890)  // 住宅无需修复
constant.ERRCODES.DORM_DOOR_IS_REPAIRED = Object.freeze(891)   // 住宅已修复
constant.ERRCODES.DORM_DOOR_IS_NOT_REPAIRED = Object.freeze(892) // 住宅还未修复
constant.ERRCODES.DORM_DOOR_IS_MAX_LEVEL = Object.freeze(893)   // 住宅等级已达上限
constant.ERRCODES.DORM_DOOR_ALREADY_IN_TARGET_DOOR = Object.freeze(894) // 墨魂已在当前住宅
constant.ERRCODES.DORM_DOOR_NOT_SAME_GENDER = Object.freeze(895) // 房间内性别不相同
constant.ERRCODES.DORM_DOOR_REACH_CAPACITY = Object.freeze(896) // 已达房间墨魂上限
constant.ERRCODES.DORM_DOOR_HERO_NOT_IDLE = Object.freeze(897) // 墨魂处于非空闲状态
constant.ERRCODES.DORM_DOOR_HERO_ALREADY_REST = Object.freeze(898) // 墨魂已是休息状态
constant.ERRCODES.DORM_DOOR_RESTINFO_NOT_RIGHT = Object.freeze(899) // 墨魂入住信息不正常
constant.ERRCODES.DORM_DOOR_HERO_NOT_REST = Object.freeze(900) // 墨魂非休息状态

constant.ERRCODES.HERO_NO_SKIN = Object.freeze(903) // 墨魂没有该皮肤
constant.ERRCODES.HERO_SKIN_OWN = Object.freeze(904) // 墨魂已有该皮肤
constant.ERRCODES.HERO_SKIN_ITEM_OWN = Object.freeze(905) // 墨魂已有该皮肤道具
constant.ERRCODES.TASK_AWARD_GETED = Object.freeze(906) // 任务奖励已领取
constant.ERRCODES.TASK_NOT_COMPLETE = Object.freeze(907) // 任务未完成

// 墨魂等级
constant.ERRCODES.HERO_LEVELUP_MAX = Object.freeze(908) // 墨魂等级达到最大
constant.ERRCODES.HERO_CANNOT_LEVELUP = Object.freeze(909) // 墨魂无法升级

// 追求树
constant.ERRCODES.PURSUETREE_NODE_UNLOCKED = Object.freeze(910) // 追求树节点已解锁
constant.ERRCODES.PURSUETREE_NODE_PREVNODE_LOCKED = Object.freeze(911) // 追求树节点未解锁
constant.ERRCODES.HERO_SKILL_REAL_UNLOCK = Object.freeze(912) // 墨魂技能已被解锁
constant.ERRCODES.HERO_SKILL_NOT_LEVELUP = Object.freeze(913) // 墨魂技能无法升级

constant.ERRCODES.NOTICE_ATTCH_GETED = Object.freeze(914) // 公告附件已领取
constant.ERRCODES.NOTICE_NO_ATTCH = Object.freeze(915) // 公告没有附件
constant.ERRCODES.SKILL_LEVEL_IS_MAX = Object.freeze(916) // 技能达到最大等级
constant.ERRCODES.SKILL_IS_WRONG = Object.freeze(917) // 技能错误
constant.ERRCODES.TASK_CHAPTER_NOT_UNLOCK = Object.freeze(918) // 前置章节未开启
constant.ERRCODES.ITEM_IS_NOT_GIFT = Object.freeze(919) // 非礼包物品
constant.ERRCODES.DEPOT_LEVEL_IS_MAX = Object.freeze(920) // 仓库等级已最大
constant.ERRCODES.HERO_IS_EXIST = Object.freeze(921) // 墨魂已存在
constant.ERRCODES.HERO_ENTERMOHUN_IS_EXIST = Object.freeze(922) // 设置墨魂已存在（4in1）
constant.ERRCODES.TASK_CHAPTER_IS_OPEN = Object.freeze(930) // 任务章节已开启
constant.ERRCODES.SKILL_LEVELUP_ITEMTYPE_ERROR = Object.freeze(950) //技能充能道具类型错误
constant.ERRCODES.SKILL_IS_INCDSTATUS = Object.freeze(951)         //主动技能还在冷却中

// 其他数据
constant.ERRCODES.EXTERNAL_DATA_QUIZ_ITEM_NOTREADY = Object.freeze(1000) // 答题道具还未准备好
constant.ERRCODES.EXTERNAL_DATA_HERO_CANNOT_QUIZ = Object.freeze(1001) // 墨魂还不能参加答题
constant.ERRCODES.EXTERNAL_DATA_HERO_QUIZ_NOTIME = Object.freeze(1002) // 墨魂答题次数已耗尽
constant.ERRCODES.EXTERNAL_DATA_FUNCTION_ALREADY_UNLOCK = Object.freeze(1003) //功能已经解锁
constant.ERRCODES.EXTERNAL_DATA_QUIZ_USE_HELP_MAXTIME = Object.freeze(1004) //答题单次使用帮助已达上限

// 看板问候
constant.ERRCODES.VIEWRESPECT_ALREADY_GETAWARD = Object.freeze(1010)  //已经领取过看板问候奖励
constant.ERRCODES.VIEWRESPECT_PARAMS_ERROR = Object.freeze(1011)  //看板问候信息错误

// 签到
constant.ERRCODES.CHECKIN_IS_TAKE_AWARDS = Object.freeze(1100) // 已领取奖励
constant.ERRCODES.CHECKIN_CANNOT_FIND_BONUS = Object.freeze(1101) // 未找到对应奖励
constant.ERRCODES.CHECKIN_CANNOT_TAKE_TOTAL_AWARDS = Object.freeze(1102) // 不能领取累计奖励

constant.ERRCODES.TASK_IS_EXPIRED = Object.freeze(1200) // 任务已过期
// 活跃度
constant.ERRCODES.ACTIVE_DEGREE_AWARD_IS_TAKE = Object.freeze(1210) // 奖励已领
constant.ERRCODES.ACTIVE_DEGREE_NOT_ENOUTH = Object.freeze(1211) // 活跃度未满足条件

constant.ERRCODES.PURSUETREE_CURRENT_STEP_UNLOCK = Object.freeze(1212) // 追求树当前阶段节点未解锁
// 邮件
constant.ERRCODES.MAIL_NO_ENCLOSURE = Object.freeze(1300) // 没有附件奖励
// 收集
constant.ERRCODES.COLLECT_ALREADY_GOT = Object.freeze(1310)  //收集项之前已经添加

// 订单系统相关错误码
constant.ERRCODES.RORDER_NOT_EXIST = Object.freeze(1401)       // 订单不存在
constant.ERRCODES.RORDER_CANNOT_BUY = Object.freeze(1402)       // 订单现在不能购买
constant.ERRCODES.RORDER_CONFIG_NOTMATCH = Object.freeze(1403) // 订单提交信息不匹配 做订单金额与信息验证
constant.ERRCODES.RORDER_FREQUENTLY = Object.freeze(1404)       // 创建订单过于频繁
constant.ERRCODES.RORDER_INVALIDSTATUS = Object.freeze(1405)       // 无效的订单状态
constant.ERRCODES.RORDER_STATUSHANDLED = Object.freeze(1406)       // 订单状态已经处理过

// 充值订单状态
constant.RORDERSTATUS = {}
constant.RORDERSTATUS.PaySuccess = Object.freeze(0)           //订单完成
constant.RORDERSTATUS.PayWaiting = Object.freeze(1)           //订单还在等待支付回调返回
constant.RORDERSTATUS.PayCancel = Object.freeze(2)            //订单已经取消
constant.RORDERSTATUS.PayFailed = Object.freeze(3)            //订单支付失败

constant.RORDERSTATUS.ContentSendSuccess = Object.freeze(0)   //订单发送奖励成功
constant.RORDERSTATUS.ContentUndo = Object.freeze(1)          //订单未处理
constant.RORDERSTATUS.ContentSendFaild = Object.freeze(2)     //订单发送奖励失败


module.exports = Object.freeze(constant);