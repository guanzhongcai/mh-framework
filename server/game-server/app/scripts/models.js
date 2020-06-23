// 墨魂属性
function HeroAttrModel()
{
    return {
        energy: 0,  // 体力
        feel: 0,    // 魂力
        cleany: 0,  // 清洁度
        jiaoy: 0,   // 交游
        emotion: 0, // 情感
        hungry: 0,  // 饥饿度
        lingg: 0,   // 灵感
        exp: 0,     // 亲密度
        skillpoint: 0, // 技能点（生产消耗体力会获得一定的技能点）
    }
}

function HeroModel(hid)
{
    return {
        skins: [{id: parseInt(hid + '01'), new: 1, st: (new Date()).getTime() }],
        skinDefault: parseInt(hid + '01'),
        goofOffCount: 0, // 摸鱼次数
        goofOffTime: 0, // 摸鱼时间
        createdTime: (new Date()).getTime(),
        skillChargingPoint:0, //主动技能充能进度 使用墨魂印章充能
        attrs: {
            level: 1,   // 等级
            energy: 0,  // 体力
            feel: 0,    // 魂力
            cleany: 0,  // 清洁度
            jiaoy: 0,   // 交游
            emotion: 0, // 情感
            hungry: 0,  // 饥饿度
            lingg: 0,   // 灵感
            exp: 0,     // 亲密度
            skillpoint: 0, // 技能点（生产消耗体力会获得一定的技能点）
        },
        pursueTreeList: [
            {
                nodeId: 1,
                status: 1
            }
        ],
        usedraw: 1,
        unlockdraw: [
            {
                level: 1,
                isunlock: 1
            }
        ],
        hid: 0,
        stat: 1,     // 住宅状态为 未分配住宅状态
        workStat: 1  // 工作状态为 空闲状态
    }
}

function ItemModel()
{
    return {
        id: 0,
        count: 0,
        time:(new Date()).getTime(),
        new: 1
    }
}

function BuildingModel()
{
    return {
        id: 0,
        deco: {},
        tag: 0,
        type: 0,
        pexpand: [],
        building: [],
        mexpand: {}
    }
}

function HeroGachaModel()
{
    return {
        uuid: 0,
        buyCount: 0,    // 仅用于单抽
        gachaCount: 3,  // 仅用于单抽
        prCount: 0,     // 累计次数（用于抽墨魂概率）
        awardHeroId: 0,
        areaId: 0,
        playHeroId: 0,
        mapInfo: [],
        isAllOver: 0,
        gachaType: 0,
        areaFreeList: [], // 每日免费次数格式：[{区域ID, 次数}]
        dayFreeSelect: 1, // 每日免费记录值（为表中排序值，隔天变换）
    }
}

function HeroGachaGridModel()
{
    return {
        gridPos: 0,
        type: 0, // 类型（0 空格子 1 奖励事件 2 事件）
        isOpen: 0,
        awardRes: {
            eventId: 0,
            awardId: 0,
            baseAwardId: 0
        }
    }
}

// ============================================================= 灵感
function InspModel()
{
    return {
        uuid: 0,
        inspBuyCount: 0, // 每日购买次数
        inspCountUpStartTime: 0,
        inspCount: 0,
        inspActionPoint: 0,
        effItemId: 0, // 存储之前使用过的效果道具ID
        themeList: [1],
        useEffectItem:[], // 使用道具列表（用于掷骰子效果）
        inspData: [
            /*
            {
                themeId: 1,
                playHeroId: 0,
                currGridPos: 0,
                extBuff: {
                    lingg: 0,
                    ap: 0
                },
                mapData: []
            }*/
        ]
    }
}

function InspThemeModel()
{
    return {
        themeId: 0,
        playHeroId: 0,
        currGridPos: 0,
        extBuff: {
            lingg: 0,
            ap: 0,
            diceCount: 0 // 额外的骰子数
        },
        mapData: []
    }
}

function InspGridModel()
{
    return {
        gridPos: 0,
        eventId: 0,
        triggerStat: 0, // 0 未触发 1 触发
        status: 0 // 0 未触发 1 已触发
    }
}

function InspAwardModel()
{
    return {
        baselingg: 0, // 基础灵感
        lingg: 0, // 灵感
        emotion: 0, // 心情
        ap: 0, // 行动力
        items: [], // 物品
        currency: [0,0,0] // 货币
    }
}

function SGRoundInfoModel ()
{
    return {
        round:0, // 当前回合
        oppCard:0, // 对手出牌
        ownCard:0, // 自己出牌
        popularity:[0,0], // 人气情况
        roundEnd:false //  轮次是否结束
    }
}

function SGGameDataModel ()
{
    return {
        gameStatus:0, // 游戏状态
        round:0, // 当前回合
        oppCards:[], // 对手手牌
        ownCards:[], // 自己手牌
        roundInfo:[], // 轮次信息
    }
}

function SGDataModel ()
{
    return {
        soulCount:0, // 剩余次数
        soulBuyCount:0, // 购买次数
        soulUpTime:0, // 恢复时间
        themeId:0, // 主题ID
    }
}

function skillBuffModel()
{
    return {
        value0: 0,
        value1: 0,
        value2: 0,
        value3: 0
    };
}

function WorkBuildingModel(bid)
{
    return {
        bid: bid,           // 建筑ID
        level: 0,           // 建筑等级
        status: 0,          // 建筑状态
        repairTime: 0,      // 修复时间戳（ms）
        heroGridList: [],   // 墨魂队列（默认解锁1个）
        workGridList: [],   // 生产队列（默认解锁3个：2个空格子+1个正在生产格子）
        itemGridList: [],    // 产物队列（默认解锁3个）
        effSkillList: [],
        skillBuff: skillBuffModel(),
        kickTime: 0         // 剔除墨魂队列时间存储（默认5分钟）
    }
}

function newWorkBuildingModel (bid) {
    return {
        bid:bid,                //建筑id
        status:0,               //建筑状态
        repairTime:0,           //建筑开始修复时间
        repaireNeedTime:0,      //修复需要时间
        level:0,                //建筑当前等级
        formulaList:[],         //解锁配方列表
        workList:[]             //工作队列
    }
}

function newWorkDataModel (){
    return {
        grid:0,                 //建筑的栏位
        status:0,               //建筑工作栏位状态
        hid:0,                  //建筑工作栏位上配置的墨魂
        fid:0,                  //建筑工作栏位上配置的配方
        st:0,                   //建筑工作栏位上正在生产的开始时间
        nt:0,                   //正在生产的需要时间
        wcount:0,               //等待队列上的数量
        wt:0,                   //等待队列上的配方生产时间
        wenergy:0,              //等待队列上的配方消耗体力
        effSkillList:[],        //当前队列上生效的技能列表
        skillBuff:[],            //当前队列上的效果列表
        itemId:0,               //当前队列上的道具ID
        itemCount:0             //当前队列上的道具数量
    }
}

function WorkHeroGridModel()
{
    return {
        grid: 0,    // 格子ID
        hid: 0,     // 墨魂ID
        unlock: 0   // 0 未解锁 1 已解锁
    }
}

function WorkWorkGridModel()
{
    return {
        grid: 0,        // 格子ID
        fid: 0,         // 配方ID
        ident: 0,       // 唯一识别码（推送用）
        startTime: 0,   // 开始时间戳（ms）
        needTime: 0,    // 所需时间（ms）
        unlock: 0,      // 0 未解锁 1 已解锁
    }
}

function WorkItemGridModel()
{
    return {
        grid: 0,        // 格子ID
        itemId: 0,      // 产物ID
        itemCount: 0,   // 产物数量
        unlock: 0       // 0 未解锁 1 已解锁
    }
}

function HotspringModel ()
{
    return {
        buyout:0,   // 是否买断
        heroDatas:[], //恢复的体力数据
    }
}

function HotspringHeroDataModel ()
{
    return {
        heroId: 0,  // 墨魂ID
        activeTime: 0, // 温泉卷激活时间
        lastBathTime: 0, // 上次入浴时间
        addEnergy: 0,   // 已补充的体力
        energyCanSupply: 0, // 每天可以补充体力的最大上限
    }
}

function HotspringFeelEventData ()
{
    return {
        lastFeelTime:0, //上次触发心情事件时间
        eventType:0,   // 心情事件类型
        addFeel:0,  // 心情事件添加的心情值
    }
}

function HotspringRestoreModel ()
{
    return {
        MaxEnergy: 200, //组大恢复体力上限
        ComfortTime: 3600,  //舒适时间
        Rate: 1,   // 恢复速率
        IntervalTime : 900, // 心情事件触发间隔
        MaxTime: 5,   // 心情事件触发上限
    }
}

function OrderModel ()
{
    return {
        heroId: 0, // 短订单配置的墨魂
        freeRefreshCount: 2, // 免费刷新次数
        sOrderCompleteCount: 0, // 短订单完成次数
        sTimeOrderCompleteCount: 0, // 限时订单完成次数
        orderBuyCount: 0, // 订单购买次数
        sOrderCountLimited: 20, // 订单完成上限
        shortOrders: [], // 短订单信息
        heroSettings:[], // 墨魂设置信息
    }
}

function ShortOrderModel ()
{
    return {
        orderIndex: 0, // 订单索引
        orderId: 0, // 订单ID
        orderType: 0, // 订单类型
        orderStartTime: 0, // 限时订单开始时间
        orderTime: 0, // 订单有效时间
        orderMessageId: 0, // 订单留言ID
        content: [], // 订单内容
        reward: {}, // 订单奖励信息
    }
}

function LongOrderModel ()
{
    return {
        lorders: [],  // 长订单
        lorderReward: {
        }, // 长订单完成奖励
        lorderStartTime: 0, // 长订单开始生效时间
        lorderBuyCount:0, // 长订单购买次数
        lorderCount:2,  // 长订单剩余发送次数
        lorderStatus:0  // 未发送
    }
}

function LongOrderSingleGridModel (grid, status)
{
    return {
        gridIndex: grid, // 长订单索引
        content: {}, // 长订单内容
        gridStatus:status,  //单个订单奖励
    }
}

function DormData ()
{
    return {
        dorminfos:[],       // 分配住宅信息
        dormLevelUpInfo:[], // 建筑升级信息
        dormRestInfo: [],   // 广厦休息信息
    }
}

function HeroDormData (hid, did, sex)
{
    return {
        heroId: hid, // 墨魂ID
        dormId: did, // 住宅ID
        time: (new Date()).getTime(),   // 入住时间
        gender: sex, // 性别
    }
}

function DormLevelUpInfo ()
{
    return {
        dormId:0,   // 住宅ID
        name: "",   // 住宅名称
        level:1,    // 住宅等级
        comfort: 1,  // 舒适度
    }
}

function DormRestInfoData (heroId, dormId, buildingId, tag, restData)
{
    return {
        dormId:dormId,     // 住宅ID
        buildingId:buildingId, // 建筑ID
        tag:tag,        // 建筑索引
        heroId:heroId,     // 休息墨魂
        restData:restData,   // 睡眠持续时间
        sleepTime:(new Date()).getTime(),  // 开始休息时间
    }
}

// ============================================= achievement
// 任务节点结构
function achievementModel(aid)
{
    return {
        AchievementId: aid,
        Type: 0,
        CompleteCondition: [],
        ItemRewards:[],
        CurrencyRewards:[],
        RewardsPoint: 0,
        PreAchivement: 0,
        StartCntCondition: '',
        IsHideType: 0
    }
}





// ============================================= Tasks
// 任务节点结构
function TaskNodeModel(taskId)
{
    return {
        taskId: taskId, // 任务ID
        progress: [], // 任务进度列表
        cycleCount: 0, // 周期计数器（type===2 循环任务）
        st: (new Date()).getTime(), // 触发时间
        status: 0, // 0 未完成 1 已完成 2 已获取奖励
        finCntObj: {}, // 需要刷新计数的完成计数器存储
        // tgIdxLis: [], // 触发条件索引列表（验证过的条件编号(1~3)进入列表, 节省判断逻辑处理）
        cntFlag: false // 是否重新计数的（配置表保存用，在处理时不用再次读取配置）
    }
}

// 任务进度结构
function TaskProgressNodeModel(num)
{
    return {
        type: 1, // 逻辑类型：1 与 2 或
        num: 0, // 所需目标数量
        count: 0, // 当前拥有数量
    }
}

function PoetryData (poetryid)
{
    return {
        id:poetryid, // 诗集ID
        new:true,   // 诗集是否是新获得状态
        created:false,  // 是否创作
        date:(new Date()).getTime(), // 获取时间
    }
}

// SCENE
function SceneData (sceneid)
{
    return {
        id:sceneid,  // 剧情ID
        data:(new Date()).getTime(), // 获取时间
        new:true,   //是否是新获得
    }
}

// SOUNDS
function SoundData (soundid)
{
    return {
        id:soundid, // 墨魂配音
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

// CG
function CGData (cgid)
{
    return {
        id:cgid,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

// NPCS
function NpcData (npcId)
{
    return {
        id:npcId,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

//Backgrounds
function BackgroundData (bid)
{
    return {
        id:bid,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

//Words
function WordData (wid)
{
    return {
        id:wid,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

// buildings
function BuildingData (bid)
{
    return {
        id:bid,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}

// formula
function FormulaData (fid)
{
    return {
        id:fid,
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}


// GIFTS
function GiftData (gift)
{
    return {
        id:gift, // 答谢礼物
        data:(new Date()).getTime(), // 获取时间
        new:true,  //是否是新获得
    }
}


function QuizData (hid)
{
    return {
        hid:hid,    // 墨魂id
        stat:1, // 是否可以参加答题
        count:1, // 可以参加答题的次数
        used:0, //已经使用的答题次数
    }
}

function UnlockInfoData ()
{
    return {
        type:1, //解锁功能类型
        id:0, //解锁功能id
        stat:1, //解锁功能状态
    }
}

function MohunAttr ()
{
    return {
        exp:0,      //亲密
        emotion:0,
        jiaoy:0,
        feel:0,     //魂力
        energy:0,
        cleany:0,
        hungry:0,
        lingg:0
    }
}

function ShopModel(menu)
{
    return {
        menu: menu, // 菜单列表
        refTime: (new Date()).getTime(), // 刷新时间
        refFreeCount: 5, // 免费刷新次数
        gridCount: 4 // 格子
    }
}

// 邮件模型
function MailModel(mailId=0)
{
    return {
        mid: mailId,
        mtitle: "",
        msender: "系统邮件",
        issystem: 1,
        content: "",
        time: 0,
        validitytime: 0,
        readstatus: 0,
        opstatus: 0,
        items: []
    }
}

exports.HeroAttrModel = HeroAttrModel;
exports.HeroModel = HeroModel;
exports.ItemModel = ItemModel;
exports.BuildingModel = BuildingModel;
exports.HeroGachaModel = HeroGachaModel;
exports.HeroGachaGridModel = HeroGachaGridModel;
exports.InspModel = InspModel;
exports.InspThemeModel = InspThemeModel;
exports.InspGridModel = InspGridModel;
exports.InspAwardModel = InspAwardModel;
exports.SGRoundInfoModel = SGRoundInfoModel;
exports.SGGameDataModel = SGGameDataModel;
exports.SGDataModel = SGDataModel;
exports.skillBuffModel = skillBuffModel;
exports.WorkBuildingModel = WorkBuildingModel;
exports.WorkHeroGridModel = WorkHeroGridModel;
exports.WorkWorkGridModel = WorkWorkGridModel;
exports.WorkItemGridModel = WorkItemGridModel;
exports.HotspringModel = HotspringModel;
exports.HotspringHeroDataModel = HotspringHeroDataModel;
exports.HotspringFeelEventData = HotspringFeelEventData;
exports.HotspringRestoreModel = HotspringRestoreModel;
exports.OrderModel = OrderModel;
exports.ShortOrderModel = ShortOrderModel;
exports.LongOrderSingleGridModel = LongOrderSingleGridModel;
exports.LongOrderModel = LongOrderModel;
exports.DormData = DormData;
exports.HeroDormData = HeroDormData;
exports.DormLevelUpInfo = DormLevelUpInfo;
exports.DormRestInfoData = DormRestInfoData;
exports.TaskNodeModel = TaskNodeModel;
exports.TaskProgressNodeModel = TaskProgressNodeModel;
exports.PoetryData = PoetryData;
exports.GiftData = GiftData;
exports.SceneData = SceneData;
exports.SoundData = SoundData;
exports.CGData = CGData;
exports.NpcData = NpcData;
exports.BackgroundData = BackgroundData;
exports.WordData = WordData;
exports.BuildingData = BuildingData;
exports.FormulaData = FormulaData;
exports.QuizData = QuizData;
exports.MohunAttr = MohunAttr;
exports.ShopModel = ShopModel;
exports.UnlockInfoData = UnlockInfoData;
exports.MailModel = MailModel;
exports.newWorkBuildingModel = newWorkBuildingModel;
exports.newWorkDataModel = newWorkDataModel;
exports.achievementModel = achievementModel;