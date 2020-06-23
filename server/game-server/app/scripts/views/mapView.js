const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const fixedController = require('./../controllers/fixedController');
const MapController = require('./../controllers/mapController');
const PlayerController = require('./../controllers/playerController');
const stockController = require('./../controllers/stockController');
const taskController = require('./../controllers/taskController');
const gamedata = require('./../../../configs/gamedata.json');
const async = require('async')
const CONSTANTS = require('./../../common/constants');
/**
 * BuildingBuy - 购买建筑
 * @param {*} request body { httpuuid, uuid, type, tag, id, costType, building }
 * @param {*} response
 */


function BuildingBuy(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    respData.id = request.body.id;
    respData.tag = request.body.tag;
    respData.type = request.body.type;

    if (respData.httpuuid && respData.uuid &&
        (request.body.type != null) && (request.body.tag != null) && (request.body.id != null) &&
            request.body.costType && request.body.building) {
        fixedController.BuildingMarket.getNeedLevel(request.body.building.id, function (needLevel) {
            let player = new PlayerController(request.body.uuid, request.multiController, request.taskController);
            // 判断等级
            player.getLevel(function (level) {
                if (needLevel && level >= needLevel) {
                    fixedController.BuildingMarket.getCostConfig(request.body.building.id, costData => {
                        // 判断消耗货币
                        player.currencyMultiValid(costData.currency, currencyValid => {
                            if (currencyValid) {
                                player.itemValid(costData.items, itemValid => {
                                    if (itemValid) {
                                        let mapController = new MapController(request.body.uuid,request.multiController, request.taskController);
                                        // 判断是否已有建筑（id & tag & type确定唯一地图）
                                        mapController.checkBuilding(request.body.id, request.body.tag, request.body.type,
                                            request.body.building.id, request.body.building.tag, function (stat) {
                                            if (stat) {
                                                mapController.addBuilding(request.body.id,
                                                        request.body.type, request.body.tag, request.body.building, function (newBuilding) {
                                                    // 扣除货币
                                                    player.costCurrencyMulti(costData.currency, function (newCurrency) {
                                                        respData.building = newBuilding;
                                                        respData.currency = newCurrency;
                                                        request.multiController.save(async function(err,data){
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
                                                    }, true);
                                                });
                                            } else {
                                                // 已存在建筑
                                                respData.code = ERRCODES().HAS_BUILDING;
                                                protocol.responseSend(response, respData);
                                            }
                                        });
                                    } else {
                                        // 物品不足
                                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                        protocol.responseSend(response, respData);
                                    }
                                });
                            } else {
                                // 货币不足（有不同返回码）
                                respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                                protocol.responseSend(response, respData);
                            }
                        });
                    });
                } else {
                    // 等级不足
                    respData.code = ERRCODES().PLAYER_LEVEL_VALID_FAILED;
                    protocol.responseSend(response, respData);
                }
            });
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * BuildingBatchBuy (request, response)
 * @param {*} request body { httpuuid, uuid, buildings = [id, counts], costgold, costdiamonds, buysource = 1 商城 2购物车 3地图 }
 * @param {*} response
 */
function BuildingBatchBuy (request, response)
{
    function taskCounterBatchBuy(uuid, batchs, callback, taskData) {
        var idGroup = [];
        for (let i in batchs) {
            idGroup.push(batchs[i].id);
        }

        var StockObjConfig = fixedController.BuildingInfo.getStockObject(idGroup),
            paramGroup = [],
            stockNode = null;

        for (let i in batchs) {
            stockNode = StockObjConfig[batchs[i].id];
            if (stockNode) {
                paramGroup.push({
                    params: [batchs[i].id, stockNode.type],
                    num: batchs[i].count
                });
            }
        }
    
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.GetFurnitureQ_A,paramGroup);
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Furniture,paramGroup);
        
        callback();
        // taskController.addTaskCounterGroup(taskData, uuid, 504, paramGroup, () => {
        //     taskController.addTaskCounterGroup(taskData, uuid, 506, paramGroup, () => {
        //         taskController.getCounterDataByTypeGroup(uuid, [504, 506], taskEventData => {
        //             taskController.saveTaskDataFromSource(uuid, taskData, () => {
        //                 callback(taskEventData);
        //             });
        //         }, taskData);
        //     });
        // });
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.currency == null || request.body.buysource == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let currency = request.body.currency;
        let player = new PlayerController(request.body.uuid,request.multiController, request.taskController);
        player.currencyMultiValid(currency, function(ret) {
            if (ret) {
                var buysource = request.body.buysource;
                // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                    player.costCurrencyMulti (currency, newCurrency => {
                        respData.currency = newCurrency;
                        let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
                        stock.addBuildingStock (request.body.buildings, updatedBuilding => {
                            taskCounterBatchBuy(request.body.uuid, request.body.buildings,  taskEventData => {
                            //     respData.taskEventData = taskEventData;
                                respData.stocks = updatedBuilding;
                                respData.buysbuilings = request.body.buildings;
                                request.multiController.save(async function(err,data){
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
                                    "itemLog":async function (cb) {
                                        await request.logServer.itemLog([request.body.uuid, request.Const.actions.buildBuy,[],request.body.buildings, request.Const.functions.house])
                                        cb(1)
                                    },
                                    "logCurrency": async function(cb){
                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.buildBuy,request.Const.functions.house,1,currency,newCurrency)
                                        cb(1)
                                    }
                                },function (err,results) {
                                })
                            });
                        });
                    });
                // });
            }else {
                // 货币不足（有不同返回码）
                respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
                protocol.responseSend(response, respData);
            }
        });
    }
}


function BuildingSell (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.currency == null || request.body.buildingId == null ||  request.body.count == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let currency = request.body.currency;
        let player = new PlayerController(request.body.uuid,request.multiController, request.taskController);
        player.addCurrencyMulti (currency, newCurrency => {
            respData.currency = newCurrency;
            let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
            stock.removeBuildingStock (request.body.buildingId, request.body.count, status => {
                respData.status = status;
                respData.buildingId = request.body.buildingId;
                respData.count = request.body.count;
                request.multiController.save(async function(err,data){
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
            });
        });
    }
}

/**
 * MapBuildingAndStocksUpload (request, response)
 * @param {*} request body { httpuuid, uuid, type, tag, id,  mapdata, stocks }
 * @param {*} response
 */
function MapBuildingAndStocksUpload (request, response){
    function doLayoutStockTaskCount(uuid, stocks, callback)
    {
        if (Array.isArray(stocks)) {
            var stockIdLis = [];
            stocks.map((x) => { stockIdLis.push(x.id); });

            var StockObjConfig = fixedController.BuildingInfo.getStockObject(stockIdLis),
                paramGroup = [],
                stockNode = null;
            for (let i in stocks) {
                stockNode = StockObjConfig[stocks[i].id];
                if (stockNode) {
                    paramGroup.push({
                        params: [stocks[i].id, stockNode.type],
                        num: 1
                    });
                }
            }
    
            request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.SetFurniture, paramGroup);
            callback();
            // taskController.getTaskDataFromSource(uuid, TaskData => {
            //     taskController.addTaskCounterGroup(TaskData, uuid, 508, paramGroup, () => {
            //         taskController.getCounterDataByTypeGroup(uuid, [508], taskEventData => {
            //             taskController.saveTaskDataFromSource(uuid, TaskData, () => {
            //                 callback(taskEventData);
            //             });
            //         }, TaskData);
            //     });
            // });
        } else {
            callback();
        }
    }

    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.type == null || request.body.id == null || request.body.tag == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
        stock.updateBuildingStock (request.body.stocks, newStocks => {
            let mapController = new MapController(request.body.uuid,request.multiController, request.taskController);
            mapController.updateBuildings (request.body.type, request.body.id, request.body.tag, request.body.mapdata, newMapData => {
                doLayoutStockTaskCount(request.body.uuid, request.body.stocks, () => {
                    // respData.taskEventData = taskEventData;
                    respData.stocks = newStocks;
                    respData.mapdata = newMapData;
                    request.multiController.save(async function(err,data){
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
                });
            });
        });
    }
}

function BuildingCartAddBuilding (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.buildings == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
        stock.addBuiling2Cart (request.body.buildings, buildings => {
            respData.buildings = buildings;
            request.multiController.save(async function(err,data){
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
        });
    }
}

function BuildingCartRemoveBuilding (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.bid == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
        stock.removeBuildingFromCart (request.body.bid, bid => {
            respData.bid = bid;
            request.multiController.save(async function(err,data){
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
        });
    }
}

function BuildingCartUpdateBuildingCount (request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.bid == null || request.body.count == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let stock = new stockController (request.body.uuid,request.multiController, request.taskController);
        stock.updateCartBuildingCount (request.body.bid, request.body.count, carts => {
            respData.updatebuilding = carts;
            request.multiController.save(async function(err,data){
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
        });
    }
}

exports.BuildingBuy = BuildingBuy;
exports.BuildingBatchBuy = BuildingBatchBuy;
exports.BuildingCartAddBuilding = BuildingCartAddBuilding;
exports.BuildingCartRemoveBuilding = BuildingCartRemoveBuilding;
exports.BuildingCartUpdateBuildingCount = BuildingCartUpdateBuildingCount;
exports.MapBuildingAndStocksUpload = MapBuildingAndStocksUpload;
exports.BuildingSell = BuildingSell;
