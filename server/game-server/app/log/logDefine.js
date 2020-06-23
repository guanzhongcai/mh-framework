/*
 * log 表字段定义 作文档用
 */
module.exports = logDefine = {}

logDefine.logTime = () =>{
    let time = new Date();
    return time.getFullYear() + "" + time.getMonth() + 1
};

//********************************************************商城流水********************************************************
/*
 *  商城购买记录
 */
logDefine.ShopBuyRecord = ()=> {
    let field = {
        "uuid": 0,
        "actionId":0,
        "goodsId": "",
        "shopId": "",
        "goodsCount": 0,
        "createtime": 0
    };
    return {tableName: `ShopBuyRecord${logDefine.logTime()}`, field: field}
};

/*
 *  商城刷新记录
 */
logDefine.ShopRefreshRecord = ()=> {
    let field = {
        "uuid": 0,
        "actionId": 0,
        "shopId": "",
        "createtime": 0
    };
    return {tableName: `ShopRefreshRecord${logDefine.logTime()}`, field: field}
};

//*****************************************************生态数据流水*******************************************************
/*
 *  物品流向表 item墨魂产出(除货币外)
 */
logDefine.ItemRecord = ()=> {
    let field = {
        "uuid": 0,
        "actionId": 0,
        "cost": [{
            "itemId":0,
            "cnt":0
        }],
        "gain": [
            {
                "itemId":0,
                "cnt":0
            }
        ],
        "functionId": 0,  // 功能ID
        "createtime": 0
    };
    return {tableName: `ItemRecord${logDefine.logTime()}`, field: field}
};

/*
 *  货币流向表
 */
logDefine.currencyRecord = ()=> {
    let field = {
        "uuid": 0,
        "itemId": 0,   // 独玉或者铜币
        "actionId":0,
        "functionId": 0,
        "direct":0,   // 加 0  扣 1
        "cnt": 0,
        "current":0,
        "createtime": 0
    };
    return {tableName: `currencyRecord${logDefine.logTime()}`, field: field}
};

/*
 *  功能参与记录 以结算为标准
 */
logDefine.ParticipatLog = ()=> {
    let field = {
        "uuid": 0,
        "functionId": 0,   // 功能
        "createtime": 0
    };
    let index = ['functionId']
    return {tableName: `ParticipatLog${logDefine.logTime()}`, field: field , index: index}
};

/*
 * 新手引导
 */
logDefine.guide = ()=> {
    let field = {
        // "uuid": 0,
        // "functionId": 0,   // 功能
        // "createtime": 0
    };
    let index = ['functionId']
    return {tableName: `currencyRecord${logDefine.logTime()}`, field: field , index: index}
};

/*
 * 等级变动记录
 */
logDefine.level = ()=> {
    let field = {
        'uuid': 0,
        'current': 0,    // 现在等级
        'upgradeTo': 0, // 提升至
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `level${logDefine.logTime()}`, field: field , index: index}
};

/*
 * 广厦记录  统计 广厦修复 和广厦睡眠
 */
logDefine.HouseLog = ()=> {
    let field = {
        'uuid': 0,
        'actionId': 0,    // 广厦修复 广厦升级 墨魂睡眠 墨魂睡眠中断
        'doorId': 0,    // 房间ID
        'heroId': 0, // 墨魂ID
        'duration': 10000,
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `level${logDefine.logTime()}`, field: field , index: index}
};


/*
 * 工坊记录 建筑解锁
 */
logDefine.WorkLog = ()=> {
    let field = {
        'uuid': 0,
        'actionId': 0,    // 工坊解锁 工坊升级 解锁墨魂
        'buildId': 0,    // 工坊位ID
        'heroGrid': 0,  // 墨魂位解锁
        'wordGrid': 0,   // 生产位解锁
        'currentLevel': 0, // 当前等级
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `WorkLog${logDefine.logTime()}`, field: field , index: index}
};


/*
 *  赠礼记录
 */
logDefine.GiftLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,    // 赠礼
        'heroId': 0,    // 墨魂ID
        'giftId': 0,  // 礼物ID
        'count': 0,   // 礼物数量
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `GiftLog${logDefine.logTime()}`, field: field , index: index}
}


/*
 * 清谈记录
 */
logDefine.ConversationLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,   // 清谈
        'heroId': 0,     // 墨魂ID
        'reward': {},    // 奖励
        'result': 0,     // 清谈结果 【胜负平】
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `ConversationLog${logDefine.logTime()}`, field: field , index: index}
}

/*
 * 卧游记录
 */
logDefine.TravelLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,   // 道具使用 || 结算
        'heroId': 0,     // 墨魂ID
        'reward': {},    // 灵感产出
        'result': 0,     // 结算方式 【手动结算||完成结算】
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `TravelLog${logDefine.logTime()}`, field: field , index: index}
}

/*
 * 联诗
 */
logDefine.PoemLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,   // 道具使用 || 结算
        'reward': {},    // 灵感产出
        'result': 0,     // 结算方式 【手动结算||完成结算】
        'time': 0,        // 联诗总用时
        'heroId': 0,      // 使用墨魂ID
        'inviteHero': 0,  // 邀约墨魂
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `PoemLog${logDefine.logTime()}`, field: field , index: index}
}

/*
 * 格术间
 */
logDefine.LatticeRomeLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,   // 道具使用 || 结算
        'cost':[{
            'itemId':  0,
            'cnt': 0
        }],
        'gain':[{
            'itemId': 0,
            'cnt': 0
        }],
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `LatticeRomeLog${logDefine.logTime()}`, field: field , index: index}
}


/*
 * 奇货居
 */
logDefine.GoodsHouseLog = () =>{
    let field = {
        'uuid': 0,
        'actionId': 0,   // 道具使用 || 发货
        'heroId': 0,
        'cost':[{
            'itemId':  0,
            'cnt': 0
        }],
        'gain':[{
            'itemId': 0,
            'cnt': 0
        }],
        'createTime': 0  // 记录时间
    };
    let index = ['createTime']
    return {tableName: `GoodsHouseLog${logDefine.logTime()}`, field: field , index: index}
}


// /*
//  * 生产
//  */
// logDefine.ProduceLog = () =>{
//     let field = {
//         'uuid': 0,
//         'actionId': 0,   // 道具使用 || 发货
//         'reward': {},    // 交付奖励
//         'cost':[{
//             'itemId':  0,
//             'cnt': 0
//         }],
//         'gain':[{
//             'itemId': 0,
//             'cnt': 0
//         }],
//         'createTime': 0  // 记录时间
//     };
//     let index = ['createTime']
//     return {tableName: `ProduceLog${logDefine.logTime()}`, field: field , index: index}
// }