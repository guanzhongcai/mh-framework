let constant = {};

constant.currentcy = {}
constant.currentcy.materials = Object.freeze(410001)
constant.currentcy.jade = Object.freeze(410002)

// 筛选条件定义
// 玩法细分
constant.tricks = {};
constant.tricks.pureConversation = Object.freeze(101); // 清谈
constant.tricks.dreamTravel = Object.freeze(102); // 卧游
constant.tricks.jointPoem = Object.freeze(103);  // 联诗
constant.tricks.latticeRoom = Object.freeze(104); // 格术间
constant.tricks.oddGoodsHouse = Object.freeze(105); // 奇货居
constant.tricks.produce = Object.freeze(106); // 生产

// 功能
constant.functions = {};
constant.functions.explore = Object.freeze(201); // 探索
constant.functions.oddGoodsHouse = Object.freeze(202); // 奇货居
constant.functions.latticeRoom = Object.freeze(203); // 格术间
constant.functions.pureConversation = Object.freeze(204); // 清谈
constant.functions.dreamTravel = Object.freeze(205); // 卧游
constant.functions.jointPoem = Object.freeze(206);  // 联诗
constant.functions.produce = Object.freeze(207); // 生产
constant.functions.largeHourseSleep = Object.freeze(208); // 广厦睡眠
constant.functions.largeHourseSleepStop = Object.freeze(209); // 广厦睡眠中断
constant.functions.sendGift = Object.freeze(210);  // 墨魂送礼
constant.functions.beTacit = Object.freeze(211); // 激活默契
constant.functions.beTraceab = Object.freeze(212); // 激活溯源
constant.functions.bePractice = Object.freeze(213); // 激活巧艺修习
constant.functions.beSoul = Object.freeze(214); // 激活魂力节点
constant.functions.shop = Object.freeze(215); // 商城模块
constant.functions.checkIn = Object.freeze(216); // 签到
constant.functions.userInfo = Object.freeze(217); // 用户资料
constant.functions.house = Object.freeze(218); // 广厦
constant.functions.mail = Object.freeze(219); // 邮件
constant.functions.task = Object.freeze(220); // 任务
constant.functions.unlock = Object.freeze(221); // 功能解锁
constant.functions.store = Object.freeze(222); // 仓库

//商城购买
constant.shopType = {};
constant.shopType.recharge = Object.freeze(301); // 充值
constant.shopType.giftPack = Object.freeze(302); // 礼包
constant.shopType.item = Object.freeze(303); // 道具
constant.shopType.mood = Object.freeze(304); // 心相

//道具细分
constant.shopType.jade = Object.freeze(305); // 独玉
constant.shopType.groceries = Object.freeze(306); // 杂货
constant.shopType.gift = Object.freeze(307); // 礼物


// 行为操作枚举
constant.actions = {}
constant.actions.repairHouse = Object.freeze(401)  // 住宅修复
constant.actions.upLevelHouse = Object.freeze(402) // 住宅升级
constant.actions.sleep = Object.freeze(403)  // 墨魂休息
constant.actions.sleepStop = Object.freeze(404) // 墨魂休息中断
constant.actions.openWork = Object.freeze(405) // 工坊解锁
constant.actions.upLevelWork = Object.freeze(406) // 工坊升级
constant.actions.openMohun = Object.freeze(407) // 墨魂位解锁
constant.actions.openWorkPostion = Object.freeze(408) // 生产位解锁
constant.actions.pureConversation = Object.freeze(409) // 清谈行为
constant.actions.remoteControlDice = Object.freeze(410) // 使用遥控骰子
constant.actions.rejuvenationPotions = Object.freeze(411) // 使用恢复药剂
constant.actions.doubleDice = Object.freeze(412)  // 双份骰子
constant.actions.clearCD = Object.freeze(413) // 长订单清除CD
constant.actions.fillJade = Object.freeze(414)  // 长订单独玉补充
constant.actions.quickProduce = Object.freeze(415)  // 加速生产
constant.actions.activeSkill = Object.freeze(416)  // 主动技能
constant.actions.shopBuy = Object.freeze(417) // 商城购买
constant.actions.shopRefresh = Object.freeze(418) // 商城刷新
constant.actions.workRecevie = Object.freeze(419) // 工坊领取
constant.actions.taskRecevie = Object.freeze(420) // 任务领取
constant.actions.search = Object.freeze(421) // 探索
constant.actions.compose = Object.freeze(422) // 探索十连抽
constant.actions.gift = Object.freeze(423) // 赠礼
constant.actions.heroExchange = Object.freeze(424) // 墨魂兑换
constant.actions.mail = Object.freeze(425) // 邮件签收
constant.actions.openGift = Object.freeze(426) // 打开礼包
constant.actions.smart = Object.freeze(427) // 领悟
constant.actions.removeConstruction = Object.freeze(428) // 装修清除
constant.actions.saveConstruction = Object.freeze(429) // 装修保存
constant.actions.addGoodsTimes = Object.freeze(430) // 短订单加次数
constant.actions.refreshGoods = Object.freeze(431) // 刷新短订单
constant.actions.createShortOrder = Object.freeze(432) // 生成短订单
constant.actions.answerCat = Object.freeze(433) // 与猫联诗
constant.actions.answerHero = Object.freeze(434) // 与墨魂联诗
constant.actions.recevieLongOrder = Object.freeze(435) // 长订单领取
constant.actions.openLongOrder = Object.freeze(436) // 长订单解锁
constant.actions.sell = Object.freeze(437) // 仓库货物出售
constant.actions.addElectric = Object.freeze(438) // 增加电量
constant.actions.singleEntry = Object.freeze(439) // 单抽进入
constant.actions.addTime = Object.freeze(440) // 单抽增加购买次数
constant.actions.checkIn = Object.freeze(441)  // 签到
constant.actions.setNickName = Object.freeze(442)  // 修改昵称
constant.actions.buildBuy = Object.freeze(443); // 家具购买
constant.actions.recevie = Object.freeze(444); // 猫食领取
constant.actions.soulBuy = Object.freeze(445); // 魂力购买
constant.actions.dreamEnd = Object.freeze(446); // 卧游结算
constant.actions.shortOrderfill = Object.freeze(447) // 短订单独玉补充
constant.actions.sellItem = Object.freeze(448) // 短订单独玉补充
constant.actions.unlock = Object.freeze(449) // 解锁模式
constant.actions.levelUp = Object.freeze(450) // 等级提升
constant.actions.storelevelUp = Object.freeze(451) // 仓库升级
constant.actions.limitOrder = Object.freeze(452) // 限时订单
constant.actions.longOrderBuyTime = Object.freeze(453) // 长订单购买次数




//定义表名字
constant.tables = {};
constant.tables.item = Object.freeze('ItemLog') // 物品流向表
constant.tables.currency = Object.freeze('CurrencyLog') // 货币流向表
constant.tables.shop = Object.freeze('ShopLog') // 商店购买刷新记录
constant.tables.functions = Object.freeze('ParticipatLog') // 功能参与记录
constant.tables.house = Object.freeze('HouseLog') // 广厦
constant.tables.work = Object.freeze('WorkLog') // 工坊生态
constant.tables.gift = Object.freeze('GiftLog') // 赠礼记录
constant.tables.pureConversation = Object.freeze('ConversationLog') //清谈记录
constant.tables.dreamTravel = Object.freeze('TravelLog'); // 卧游记录
constant.tables.jointPoem = Object.freeze('PoemLog');  // 联诗记录
constant.tables.latticeRoom = Object.freeze('LatticeRomeLog'); // 格术间记录
constant.tables.oddGoodsHouse = Object.freeze('GoodsHouseLog'); // 奇货居记录
constant.tables.produce = Object.freeze('ProduceLog'); // 生产记录
constant.tables.guide = Object.freeze('GuideLog'); // 新手引导
constant.tables.task = Object.freeze('TaskLog'); // 新手任务


// constant.tables.tricks = Object.freeze('TricksDetailLog') // 玩法详细各个点击操作统计
// constant.gain = {};
// constant.gain.tableName = Object.freeze('GainLog');  // 物品获得记录
// constant.consume = {};
// constant.consume.tableName = Object.freeze('ConsumeLog'); // 物品消耗记录

//数据库索引部分
constant.indexs = {};
constant.indexs.gift = Object.freeze('gift')




module.exports = Object.freeze(constant);







