const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const CONSTANTS = require('./../../common/constants');
const gamedata = require('./../../../configs/gamedata.json');
const fixedController = require('./../controllers/fixedController');
const gachaController = require('./../controllers/gachaController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const taskController = require('./../controllers/taskController');
const Items = require('./../controllers/fixedController').Items;
const async = require('async')
/**
 * HeroGachaStart - 开始探索墨魂
 * @param {*} request {httpuuid, uuid, areaId, heroId, gachaType}
 * @param {*} response
 */
function HeroGachaStart(request, response)
{
    // 任务计数相关（探索）
    // async function taskCounterGacha(uuid, heroNodeGroup, callback, tskData=null)
    function taskCounterGacha(uuid, heroNodeGroup, heroLevel , items)
    {
        var paramGroup = [];
        for (let i in heroNodeGroup) {
            paramGroup.push({
                params: [heroNodeGroup[i].hid],
                num: 1
            });
            
        }
        
        for (const i in items) {
            let itemType = Items.getItemType(items[i].id);
            if(itemType === Items.TYPES().HERO_SKIN){
                //TODO 获得皮肤道具
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Gacha_skin,[{params:[0]}])
                break;
            }
        }

        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GachaHeroTimes,[{params:[10]}])
        if(paramGroup.length){
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GachaHero, paramGroup)
            // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GachaHero, [{params:[0],num:paramGroup.length}])
            if(paramGroup.length >= 2){
                //TODO 两个墨魂
                request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Gacha_2_Hero, [{params:[0]}])
            }
        }
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.QA_Hero_Gacha, [{params:[heroLevel],num:10}])
    }

    function areaFreeCntCost(gachaPtr, areaId, isFree, callback) {
        if (isFree) {
            gachaPtr.costAreaFreeCount(areaId, 1, newAreaFreeLis => {
                callback(newAreaFreeLis);
            });
        } else {
            callback(null);
        }
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);

    let gacha = new gachaController(request.body.uuid,request.multiController, request.taskController);
    gacha.checkAreaIsOpen(request.body.areaId, isOpen => {
        if (isOpen) {
            gacha.checkAreaTimeIsOver(request.body.areaId, timeIsOver => {
                if (!timeIsOver) {
                    gacha.checkAreaFree(request.body.areaId, async(areaIsFree, areaFreeLis) => {
                        let hero = new heroController(request.body.uuid, request.body.heroId, request.multiController, request.taskController);
                        hero.getLevel(function (heroLevel) {
                            
                            if (request.body.gachaType === 1) {
                                // 单抽（扣除1个胡萝卜423001）
                                let costItem =  areaIsFree ? [] : gamedata.GACHA.SingleCostItem;//[{id:423001, count:1}];
                                let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                player.itemValid(costItem, itemRet => {
                                    if (itemRet) {
                                        //hero.costAttrEnergy(gamedata.GACHA.SingleCostEnergy, newAttrs => {
                                            // 获取探索墨魂数据
                                            gacha.getGachaData(player, hero, request.body.areaId, request.body.heroId, request.body.gachaType, gachaRes => {
                                                gacha.saveGachaDataImmediately ( ()=> {
                                                    // 消耗道具
                                                    player.costItem(costItem, _ => {
                                                        areaFreeCntCost(gacha, request.body.areaId, areaIsFree, async newAreaFreeLis => {
                                                            
                                                            
                                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GachaHeroTimes,[{params:[1]}]);
                                                            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.QA_Hero_Gacha,[{params:[heroLevel]}]);
                                                            respData.costItem = costItem;
                                                            //respData.attrs    = newAttrs;
                                                            // 活动参与 和物品消耗
                                                            respData.gachaCount = gachaRes.gachaCount;
                                                            respData.resData    = gachaRes.mapInfo;
                                                            respData.areaFreeList = newAreaFreeLis ? newAreaFreeLis : areaFreeLis;
                                                            request.multiController.save( async function(err,data){
                                                                if(err){
                                                                    respData.code = ERRCODES().FAILED;
                                                                    return  protocol.responseSend(response, respData);
                                                                }
                                                                respData.taskEventData = [];
                                                                respData.taskList = [];
                                                                try {
                                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                                    respData.taskEventData = taskEventData;
                                                                    respData.taskList = taskList;
                                                                }catch (e) {
                                                                    respData.code = ERRCODES().FAILED;
                                                                    return  protocol.responseSend(response, respData);
                                                                }
                                                                protocol.responseSend(response, respData);
                                                            })
                                                            async.parallel({
                                                                "itemLog": async function(cb){
                                                                    await request.logServer.itemLog([request.body.uuid, request.Const.actions.singleEntry,costItem, [], request.Const.functions.explore]);
                                                                    cb(1)
                                                                },
                                                                "ParticipatLog": async function(cb){
                                                                    await request.logServer.ParticipatLog([request.body.uuid, request.Const.functions.explore]);
                                                                    cb(1)
                                                                }
                                                            },function (err,results) {
                                                            })
                                                            
                                                        });
                                                    });
                                                });
                                            });
                                        //});
                                    } else {
                                        // 消耗物品不足
                                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                               
                            } else if (request.body.gachaType === 2) {
                                let costItem = gamedata.GACHA.MultiCostItem;//[{id:423001, count:10}];
                                let player = new playerController(request.body.uuid, request.multiController, request.taskController);
                                player.itemValid(costItem, itemRet => {
                                    if (itemRet) {
                                        gacha.getGachaData(player, hero, request.body.areaId, request.body.heroId, request.body.gachaType, gachaData => {
                                            player.costItem(costItem, _ => {
                                                gacha.doGachaMultiBonus(player, hero, request.body.areaId, gachaData, (dataRes, viewMohun) => {
                                                    gacha.saveGachaDataImmediately ( ()=> {
                                                        // 增加道具
                                                        player.addItem(dataRes.items, _ => {
                                                            player.addCurrencyMulti(dataRes.currency, newCurrency => {
                                                                hero.addHeroGroup(dataRes.heros, async _ => {
                                                                    //任务
                                                                    taskCounterGacha(request.body.uuid, dataRes.heros , heroLevel, dataRes.items )
                                                                    if (viewMohun) respData.viewmohun = viewMohun;
                                                                    respData.costItem = costItem;
                                                                    respData.gachaCount = 0;
                                                                    respData.resData    = dataRes.mapInfo;
                                                                    request.multiController.save(async function(err,data){
                                                                        if(err){
                                                                            respData.code = ERRCODES().FAILED;
                                                                            // todo 清掉内存
                                                                            player.errorHandle()
                                                                            return  protocol.responseSend(response, respData);
                                                                        }
                                                                        respData.taskEventData = [];
                                                                        respData.taskList = [];
                                                                        try {
                                                                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                                            respData.taskEventData = taskEventData;
                                                                            respData.taskList = taskList;
                                                                        }catch (e) {
                                                                            respData.code = ERRCODES().FAILED;
                                                                            return  protocol.responseSend(response, respData);
                                                                        }
                                                                        protocol.responseSend(response, respData);
                                                                    })
                                                                    async.parallel({
                                                                        "itemLog": async function(cb){
                                                                            let gain =  request.logServer.itemSum(dataRes.items,dataRes.heros)
                                                                            await request.logServer.itemLog([request.body.uuid, request.Const.actions.compose,costItem,gain, request.Const.functions.explore]);
                                                                            cb(1)
                                                                        },
                                                                        "logCurrency": async function(cb){
                                                                            await request.logServer.logCurrency(request.body.uuid,request.Const.actions.compose,request.Const.functions.explore,0,dataRes.currency,newCurrency)
                                                                            cb(1)
                                                                        }
                                                                    },function (err,results) {
                                                                    })
                                                               
                                                                    // });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                       
                                    } else {
                                        // 消耗物品不足
                                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            } else {
                                // 寻找墨魂类型错误
                                respData.code = ERRCODES().HERO_GACHA_TYPE_ERR;
                                protocol.responseSend(response, respData);
                            }
                        });
                    });
                } else {
                    // 区域点时间已结束
                    respData.code = ERRCODES().HERO_GACHA_TIME_IS_OVER;
                    protocol.responseSend(response, respData);
                }
            });
        } else {
            // 区域点未开放
            respData.code = ERRCODES().HERO_GACHA_NOT_OPEN;
            protocol.responseSend(response, respData);
        }
    });

  
}

/**
 * HeroGachaClickGrid - 点击探索墨魂格子
 * @param {*} request {httpuuid, uuid, gridPos}
 * @param {*} response
 */
function HeroGachaClickGrid(request, response)
{
    // 任务计数相关（探索）
    function taskCounterGacha(uuid, evType, callback, taskData)
    {
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroGachaClickGrid,[{params:[0, evType]}])
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GachaHero, [{params:[0,0]}])
        // taskController.addTaskCounter(taskData, uuid, 143, [0, evType], () => {
        //     taskController.getCounterDataByTypeGroup(uuid, [1, 101, 102, 103, 143], taskEventData => {
        //         taskController.saveTaskDataFromSource(uuid, taskData, () => {
        //             callback(taskEventData);
        //         });
        //     }, taskData);
        // });
    }

    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let gacha = new gachaController(request.body.uuid,request.multiController, request.taskController);
    let hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
    gacha.doGachaSingleBonus(player, hero, request.body.gridPos, (ret, bonusData) => {
        if (ret === -1) {
            // 探索次数不足
            respData.code = ERRCODES().HERO_GACHA_COUNT_NONE;
            protocol.responseSend(response, respData);
        } else if (ret === -2) {
            // 未找到格子（系非法参数）
            respData.code = ERRCODES().PARAMS_ERROR;
            protocol.responseSend(response, respData);
        } else if (ret === -3) {
            // 已开启的格子
            respData.code = ERRCODES().HERO_GACHA_GRID_IS_OPEN;
            protocol.responseSend(response, respData);
        } else {
            
                player.addItem(bonusData.items, _ => {
                    player.addCurrencyMulti(bonusData.currency, newCurrency => {
                        hero.addHeroGroup(bonusData.heros, async _ => {
                            //任务数据处理
                            taskCounterGacha(request.body.uuid, bonusData.gridData.type)
                            
                            respData.gachaCount = bonusData.gachaCount;
                            respData.gridData = bonusData.gridData;
                            request.multiController.save(async function(err,data){
                                if(err){
                                    respData.code = ERRCODES().FAILED;
                                    player.errorHandle()
                                    hero.errorHandle()
                                    gacha.errorHandle()
                                    return  protocol.responseSend(response, respData);
                                }
                                respData.taskEventData = [];
                                respData.taskList = [];
                                try {
                                    //任务数据统一更新处理没有行为操作 empty {taskList:[],taskEventData:[]}
                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                    respData.taskEventData = taskEventData;
                                    respData.taskList = taskList;
                                }catch (e) {
                                    respData.code = ERRCODES().FAILED;
                                    return  protocol.responseSend(response, respData);
                                }
                                
                                protocol.responseSend(response, respData);
                            })
                            async.parallel({
                                "itemLog": async function(cb){
                                    await request.logServer.itemLog([request.body.uuid,request.Const.actions.search,[],bonusData.items,request.Const.functions.explore])

                                    cb(1)
                                },
                                "logCurrency": async function(cb){
                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.search,request.Const.functions.explore,0,bonusData.currency,newCurrency)
                                    cb(1)
                                }
                            },function (err,results) {
                            })
                            
                        });
                    });
                });
            
        }
    });
}

/**
 * HeroGachaBuyCount - 探索墨魂购买次数
 * @param {*} request {httpuuid, uuid}
 * @param {*} response
 */
function HeroGachaBuyCount(request, response)
{
    // 获取所需消耗
    // 判断消耗
    // 增加购买次数
    // 增加抽卡次数
    // 扣除消耗
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let gacha = new gachaController(request.body.uuid,request.multiController, request.taskController);
    gacha.getBuyCount(buyCount => {
        gacha.checkIsOverValid(isOver => {
            if (isOver || (buyCount-1) === gamedata.GACHA.BuyCountMax) {
                respData.code = ERRCODES().HERO_GACHA_BUY_FULL;
                protocol.responseSend(response, respData);
            } else {
                fixedController.HeroGachaBuyCountCost.getNeedDiamond(buyCount, costData => {
                    let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                    player.currencyMultiValid(costData.currency, currencyRet => {
                        if (currencyRet) {
                            player.itemValid(costData.items, itemValid => {
                                if (itemValid) {
                                    // 设置购买次数
                                    gacha.setBuyCount(buyCount, _ => {
                                        // 增加抽卡次数
                                        gacha.addGachaCount(3, newGachaCount => {
                                            gacha.saveGachaDataImmediately (()=> {
                                               
                                                    // 消耗货币
                                                    player.costCurrencyMulti(costData.currency, newCurrency => {
                                                        player.costItem(costData.items, async() => {
                                                            if (costData.items.length > 0) respData.costItem = costData.items;
                                                            if (costData.currency[0] > 0 || costData.currency[1] > 0 || costData.currency[2] > 0)
                                                                respData.currency = newCurrency;
                                                            respData.gachaCount = newGachaCount;
                                                            
                                                                // 扣钱 和道具
                                                            request.multiController.save(async function(err,data){
                                                                if(err){
                                                                    respData.code = ERRCODES().FAILED;
                                                                    player.errorHandle()
                                                                    return  protocol.responseSend(response, respData);
                                                                }
    
                                                                respData.taskEventData = [];
                                                                respData.taskList = [];
                                                                try {
                                                                    let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                                    respData.taskEventData = taskEventData;
                                                                    respData.taskList = taskList;
                                                                }catch (e) {
                                                                    respData.code = ERRCODES().FAILED;
                                                                    return  protocol.responseSend(response, respData);
                                                                }
                                                                protocol.responseSend(response, respData);
                                                            })
                                                            async.parallel({
                                                                "itemLog": async function(cb){
                                                                    if(costData.items.length > 0){await request.logServer.itemLog([request.body.uuid,request.Const.actions.addTime,costData.items,[],request.Const.functions.explore])}
                                                                    cb(1)
                                                                },
                                                                "logCurrency": async function(cb){
                                                                    await request.logServer.logCurrency(request.body.uuid,request.Const.actions.addTime,request.Const.functions.explore,1,costData.currency,newCurrency)
                                                                    cb(1)
                                                                }
                                                            },function (err,results) {
                                                            })
                                                          
                                                        });
                                                    });
                                               
                                            });
                                        });
                                    });
                                } else {
                                    // 物品不足
                                    respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                    protocol.responseSend(response, respData);
                                }
                            });
                        } else {
                            // 货币不足
                            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    });
                });
            }
        });
    });
}


/**
 * HeroGachaAllOver
 * @param {*} request {httpuuid, uuid, isAllOver}
 * @param {*} response
 */
function HeroGachaAllOver(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let gacha = new gachaController(request.body.uuid,request.multiController, request.taskController);
    let isAllOver = request.body.isAllOver;
    gacha.updateGachaDataAllOver(isAllOver, _ => {
        respData.isAllOver = isAllOver
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                player.errorHandle()                                                                                   
                return  protocol.responseSend(response, respData);
            }
    
            respData.taskEventData = [];
            respData.taskList = [];
            try {
                let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                respData.taskEventData = taskEventData;
                respData.taskList = taskList;
            }catch (e) {
                respData.code = ERRCODES().FAILED;
                return  protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        }) 
    });
}

exports.HeroGachaStart = HeroGachaStart;
exports.HeroGachaClickGrid = HeroGachaClickGrid;
exports.HeroGachaBuyCount = HeroGachaBuyCount;
exports.HeroGachaAllOver = HeroGachaAllOver;
