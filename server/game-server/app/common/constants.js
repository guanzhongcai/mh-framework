const TASK_TRIGGER_TYPE = {
	
	GetItem                 :1,        // 获得N个A类道具	1	1-0,A-N
	CostItem                :2,// 消耗N个道具（ID）	2	2-310000-N	// 消耗N个A类道具	2	2-0,A-N
	MoHenLevel              :3,// 达到N墨痕斋等级	3	3-0-N		——
	RepairBuilding          :4,// 修复A建筑	4	4-XXXXXX-1
	CatchFish               :5,// 在池塘抓到N条鱼	5	5-0-N
	CostCurrency            :6,// 累计消耗N货币（ID）	6	6-410001-N
	CheckInDays             :7,// 累计签到天数	7	7-0-N
	Share                   :8,// 累计分享N次	8	8-0-1
	GetHero                 :101,// 获得A墨魂（ID）	101	101-610000-1 获得N个墨魂	101	101-0-N
	HeroQuality             :102,// 拥有N个A阶墨魂	102	102-0,A-N// 拥有1个A阶指定墨魂（ID）	102	102-610000,A-1	生效
	HeroSex                 :103,// 获得某性别的墨魂N个	103	103-X-N
	UnlockHeroSkin        :104,// 解锁N个墨魂心相	104	104-X-N
	CollectNotes            :105,// 收集N篇墨魂诗集	105	105-X-N
	UnlockHeroArchives      :106,// 解锁N个墨魂档案	106	106-X-N
//
//
//
	Unlock_Node_A:121,
// 解锁N个A类节点	121	121-0,A-N
// 解锁指定墨魂指定节点（墨魂ID·节点ID）	121	121-610000,210000-1
// 解锁指定墨魂N个A类节点	121	121-610000,A-N
	Unlock_Complete_Hero:122,
// 完整解锁A墨魂	122	122-610000-1
// 完整解锁N个墨魂	122	122-0-N
	HeroAppointNode             :123,
// 完成指定墨魂的指定溯缘节点	123	123-610000,210000-1
	UnlockAppointNode:124,
// 解锁N个任意墨魂任意节点	124	124-0-N
//
	
	GachaHero               :141,// 探索获得墨魂N个	141	141-0-N// 探索获得墨魂墨魂（ID）	141	141-610000-1
	GachaHeroTimes               :142,// // 单次探索N次	142	142-1-N	生效// 十连探索N次	142	142-10-N	生效
	HeroGachaClickGrid               :143,
// 探索遇到N次A类事件	143	143-0,A-N


	QA_Hero_Gacha :144,
// 使用A墨魂进行探索N次	144	144-A-N
	Gacha_2_Hero : 145,
// 在N次探索中一次获得2名墨魂	145	145-0-N
	Gacha_skin:146,
// 在探索中抽到N次心相	146	146-0-N
//
	HeroSettleIn:501,
// 入住N个墨魂	501	501-0-N
// 入住指定墨魂	501	501-610000-1
	RoomUpgrade:502,
// 提升N次广厦房间等级	502	502-0-N
// 提升指定广厦房间等级N次	502	502-XXXXXXX-N	生效
	HaveRooms : 503,
// 拥有n级广厦房间N间	503	503-0,n-N	生效
// 拥有任意等级的广厦房间N间	503	503-0,0-N
	GetFurnitureQ_A:504,
// 获得N个A类家具	504	504-0，A-N
// 获得N个家具（ID）	504	504-XXXXXX-N	生效
	FurnitureAll: 505,
// 获得N套家具	505	505-0-N
// 获得N套指定家具套装	505	505-XXXXXX-N
	
	Furniture               :506,
// 拥有N个A类家具	506	506-0，A-N
// 拥有N个家具(ID）	506	506-XXXXXX-N
// 拥有N套家具	507	507-0-N
// 拥有N套指定家具套装	507	507-XXXXXX-N
	SetFurniture:508,
// 摆放N个家具	508	508-0-N
// 抓到指定墨魂摸鱼N次	509	509-XXXXXX-N
// 抓到墨魂摸鱼N次	509	509-0-N
	HeroRest:510,
	
// 安排指定墨魂休息N次	510	510-XXXXXX-N
// 安排墨魂休息N次	510	510-0-N
	HeroRestTimes:511,
// 安排N次指定长度的休息时间	511	511-A-N
	HeroWeakUp :512,
// 提前叫醒A墨魂N次	512	512-6100000-N
// 提前叫醒墨魂N次	512	512-0-N
// 在广厦拍照N次	513	513-0-N
// 拥有舒适度到n的房间N个	514	514-0,n-N
// 墨魂谁和谁住一个房间	515	515-310004,310005-1
//
//
//
	OpenHunGame:161,
// A墨魂开启魂力玩法N次	161	161-6100000-N	生效
// 开启魂力玩法N次	161	161-0-N	生效
	WinHunGame:162,
// A墨魂赢得魂力玩法N次	162	162-6100000-N	生效
// 赢得魂力玩法N次	162	162-0-N	生效
	CompleteHunGame:163,
// A墨魂完成魂力玩法N次	163	163-6100000-N	生效
// 完成魂力玩法N次	163	163-0-N
	energyIn:164,
// 人气介于N（大于，小于）	164	164-min,max-0
	energyLg:165,
// 人气大于多少的清谈N次	165	165-XXXX-N
//
//
	OpenGame_lingGan:181,
// A墨魂开启灵感玩法N次A主题	181	181-6100000，A-N
// 开启灵感玩法N次A主题	181	181-0，A-N
// A墨魂开启灵感玩法N次	181	181-610000-N
// 开启灵感玩法N次	181	181-0-N
	HeroCompleteGame_Ins:182,
	
// A墨魂完成灵感玩法N次A主题	182	182-6100000，A-N
// 完成灵感玩法N次A主题	182	182-0，A-N
// A墨魂完成灵感玩法N次	182	182-610000-N	生效
// 完成灵感玩法N次	182	182-0-N	生效
	TriggerStory:183,
// 触发事件N个	183	183-0-N
	GetIns:184,
// 一次性获得N灵感	184	184-0-N	生效
//
	
	GetEvaluate_A :201,
// 获得A等（甲乙丙丁)评价N次。	201	201-A—N	生效	A枚举：1,2,3,4,5
	CompletePracticeMode :      202,
// 完成练习模式N次。	202	202-0-N	生效
// 指定墨魂（ID）完成答题N次	203	203-610000-N	生效
	Complete_QA:203,
// 完成答题N次	203	203-0-N	生效
	FeedTheCat  :    204,
// 喂猫N次。	204	204-0-N
	AllGradeComplete :205,
// 123档都算完成N次的枚举	205	205-0-N
//
//
	
	CompleteShortOrder:521,
	
// 完成N次短订单	521	521-0-N
// 完成N次包含A产品的短订单	521	521-XXXXXX-N
// 限时内完成N次短订单	522	522-时间-N
	refreshShortOrd:523,
// 刷新短订单N次	523	523-0-N
	GetItemFromShortOrder:524,
// 从短订单中获得N个某道具	524	524-XXXXXX-N
	Complete_Urgent_ShortOrder:525,
// 完成N次紧急订单	525	525-0-N
	CompleteShortOrder_CostItem:526,
// 完成消耗N个包含XXXXXX产品的短订单	526	526-XXXXXX-N
	ShortOrder_CostItem:527,
// 在短订单中消耗了N个XXXXXX货物	527	527-XXXXXX-N
//
	LongOrderSend:541,
// 发送N次长订单	541	541-0-N
// 完成消耗道具XXXXXX的长订单N次	541	541-XXXXXX-N

	Unlock_Order_grid:542,
// 解锁第N个货箱	542	542-0-N
	GetItemByLongOrder:543,
// 从长订单获得道具N个	543	543-XXXXXX-N
	LongOrderQ_A:544,
// 发送N次档位为A的长订单	544	544-A-N
//
//

	Produce_Item_A :561,
// 生产了N个A类产品（开启而非获得）	561	561-0,A-N
// 生产了N个A产品（ID）	561	561-XXXXXXX-N
	ProduceBuildLevelUp:562,
// 升级A生产建筑N次	562	562-XXXXXX-N
// 升级生产建筑N次	562	562-0-N
	ProduceBuildLevel:563,
// A生产建筑达到N级	563	563-XXXXXX-N
// A墨魂获得了N技能熟练度	564	564-XXXXXX—N
	HeroUseSkill:565,
// A墨魂使用N次主动技能	565	565-XXXXXX-N
// A墨魂使用n次主动技能生产B产品N个（ID）	565	565-AXXXXX-n,B-N
	Produce_A:567,
// 通过生产收取N个A类产品（ID）	567	567-XXXXXX-N
	Produce_pos:568,
// 扩增A生产建筑的生产队列达到N个	568	568-XXXXXX-N
	HeroProd_Skill_Level:569,
	
// A墨魂生产技能提升到N级	569	569-墨魂ID,父技能ID-N
	
	hero_produce_item_A:570,
// A墨魂生产N个A产物（ID）	570	570-墨魂ID,产物ID-N
	PrantSkill_Level :571,
// 拥有N名，主动技能达到A等级的墨魂	571	571-A-N
//
//
	CompleteTasks:581,
// 完成任务N个	581	581-0-N
// 完成指定任务	581	581-XXXXXX-1
//
	CompleteMainTasks:601,
// 完成主线章节N章	601	601-0-N
// 完成A主线章节	601	601-XXXXXX-1
	UnlockMainTask:602,
// 解锁N个主线章节	602	602-0-N
//
	GiftSend:701,
// 给A墨魂送礼物N次	701	701-XXXXX-N
// 给任意墨魂送礼物N次	701	701-0-N
	HeroTacitAgreement :702,
// 任意墨魂默契达到N	702	702-0-N
	GiftSendTimes:703,
// 给N个墨魂送礼，各自至少一次	703	703-0-N



// 任意墨魂默契等级达到N级	704	704-0-N
// 拥有N个A默契等级的墨魂	705	705-0,A-N
//
//
	BuyItemsTimes:721,
// 在商城购买A物品N次	721	721-XXXXXX-N
// 在商城购买任意物品N次	721	721-0-N
	CostItemBuy:722,
// 在商城消费A资源N个	722	722-XXXXXX-N
	GetIntoShop:723,
// 进入商城N次	723	723-0-N
	BuyItems_A:724,
// 在商城购买某类道具N次	724	724-X-N
//
	WareHouseUpgrade:731,
// 材料仓库升级N次	731	731-2-N
// 货物仓库升级N次	731	731-3-N
// 任意仓库升级N次	731	731-0-N
// 仓库容量达到N	732	732-0-N
//
//
	HeroEnergy :     741,
// 墨魂id体力低于N	741	741-Min,Max,MHid-0		741-0,49,0-0
// 任意墨魂体力低于N	741	741-Min,Max,0-0
	HeroHelper:742,
// 墨魂担任一次助手	742	742-XXXXXX-1
	WatchPlot :     743,
// 看剧情ID多少次	743	743-剧情ID段-N
//
//
	Collect_CG :801,
// 收集N张CG	801	801-0-N
	Collect_Scene :802,
// 收集N张场景	802	802-0-N
	Collect_Gifts:803
// 储物柜收集N个特殊道具	803	803-0-N

};


//刷新相关枚举
const REFRESH_TYPE = {
	RefreshData : "RefreshData",
	TaskDailyRefresh : "TaskDailyRefresh",
}

//任务状态枚举
const TASK_STATUS = {
	NORMAL: 0,      // 未完成
	COMPLETE: 1,    // 已完成
	REWARDED: 2,    // 已领取
	EXPIRED: 3,     // 已过期
}

//任务周期相关
const TASK_CYCLE_TYPES = {
	NONE: 0,        // 没有周期
	DAY: 1,         // 每天
	WEEK: 2,        // 每周
	MONTH: 3,       // 每月
	YEAR: 4,        // 每年
	FOREVER: 5,     // 永久
}



const CONSTANTS = {};

//任务相关
CONSTANTS.TASK_TRIGGER_TYPE = TASK_TRIGGER_TYPE;
CONSTANTS.TASK_STATUS = TASK_STATUS;
CONSTANTS.TASK_CYCLE_TYPES = TASK_CYCLE_TYPES;
CONSTANTS.REFRESH_TYPE = REFRESH_TYPE;


module.exports = CONSTANTS;