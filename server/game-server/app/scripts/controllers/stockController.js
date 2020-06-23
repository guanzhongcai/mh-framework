const models = require('./../models');
const utils = require('./../../common/utils');
const taskController = require('./taskController');
const BuildingInfoConfig = require('./fixedController').BuildingInfo;
const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CONSTANTS = require('./../../common/constants');
// 建筑库存
class stockController
{
    constructor(uuid,multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'Stock';
        this.m_stockData = null
        this.m_RedisStockString = "";
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getFromDBOrCache(cb){
        if(!!this.m_stockData){
            cb(this.m_stockData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sdoc => {
                this.m_RedisStockString = sdoc;
                let doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : {};
                this.m_stockData = doc
                cb(doc)
            })
        }
    }

    saveStockDataToDataSource (stock, callback) {
        if (stock != null) {
            let saveString = JSON.stringify(stock);
            let shouldSave = false;
            if (this.m_RedisStockString == null || this.m_RedisStockString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.m_stockData = stock;
                this.multiController.uniqPush(1, this.tblname_ + ":" + this.uuid_, saveString)
                this.m_RedisStockString = saveString;
                callback (true);
            }else {
                callback (true);
            }
        }else {
            callback (true);
        }
    }

    getStock(callback)
    {
        this.getFromDBOrCache(doc => {
            if (doc == null || doc.stocks == null) {
                callback ([]);
            }else {
                callback(doc.stocks);
            }
        });
    }

    // 获取游戏额外数据信息
    updateBuildingStock(buildings, callback) {
        this.getFromDBOrCache(doc => {
            if (doc == null) {
                doc = {}
                doc.uuid = this.uuid_;
                let stocksBuildings = [];
                for (let i in buildings) {
                    let building = buildings[i];
                    this.updateBuildingCountInArray (stocksBuildings, building.id, building.count);
                }
                
                doc.stocks = stocksBuildings;
                this.saveStockDataToDataSource (doc, _ => {
                    callback(buildings);
                })
            }else {
                let stocksBuildings = [];
                for (let i in buildings) {
                    let building = buildings[i];
                    this.updateBuildingCountInArray (stocksBuildings, building.id, building.count);
                }
                doc.stocks = stocksBuildings;
                this.saveStockDataToDataSource (doc, _ => {
                    callback(buildings);
                })
            }
        });
    }


    updateBuildingCountInArray (carts, buildingId, count) {
        let hasFound = false
        for (var i = carts.length - 1; i >= 0; i-- ){
            if (carts[i].id == buildingId) {
                hasFound = true
                carts[i].count = carts[i].count + count
                if (carts[i].count <= 0) {
                    carts.splice (i, 1);
                }
                break
            }
        }

        if (!hasFound && count > 0){
            let building = {};
            building.id = buildingId;
            building.count = count;
            carts.push (building);
        }
    }

    addBuildingStock (buildings, callback) {
        this.getFromDBOrCache(doc => {
            if (doc.stocks == null) {
                doc.uuid = this.uuid_;
                let stocksBuildings = [];
                for (let i in buildings) {
                    let building = buildings[i];
                    this.updateBuildingCountInArray (stocksBuildings, building.id, building.count);
                }
                doc.stocks = stocksBuildings;
                this.saveStockDataToDataSource (doc, _ => {
                    callback(buildings);
                })
            }else {
                for (let i in buildings) {
                    let building = buildings[i];
                    this.updateBuildingCountInArray (doc.stocks, building.id, building.count);
                }
                this.saveStockDataToDataSource (doc, _ => {
                    callback(buildings);
                })
            }
        });
    }

    removeBuildingStock (buildingId, count, callback) {
        this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
            if (doc.stocks == null) {
                callback (false);
            }else {
                let removeStatus = false;
                let stocks = doc.stocks;
                for (var i = stocks.length - 1; i >= 0; i-- ) {
                    if (stocks[i].id == buildingId) {
                        if (stocks[i].count < count) {
                            removeStatus = false;
                        }else {
                            stocks[i].count -= count;
                            if (stocks[i].count <= 0) {
                                stocks.splice (i, 1);
                            }
                            removeStatus = true;
                        }
                        break
                    }
                }
                if (removeStatus) {
                    this.saveStockDataToDataSource (doc, _ => {
                        callback(true);
                    })
                }else {
                    callback (false);
                }
            }
        });
    }

    getStockList(stkLis, lis) {
        for (let stock of stkLis) {
            var isFind = false;
            for (let i in lis) {
                if (stock.id === lis[i].id) {
                    lis[i].count += stock.count;
                    isFind = true;
                    break;
                }
            }

            if (!isFind) {
                lis.push(stock);
            }
        }
        return lis;
    }

    addStock(stockLis, callback, taskData=null)
    {
        function doStockTaskCount(uuid, tskData, stkLis, cb) {
            if (stkLis.length > 0 && tskData != null) {
                var stockIdLis = [];
                stkLis.map((x) => { stockIdLis.push(x.id); });

                var StockObjConfig = BuildingInfoConfig.getStockObject(stockIdLis),
                    taskParams = [],
                    stockNode = null;
                for (let i in stkLis) {
                    stockNode = StockObjConfig[stkLis[i].id];
                    if (stockNode) {
                        taskParams.push({
                            params: [stkLis[i].id, stockNode.type],
                            num: stkLis[i].count
                        });
                    }
                }
                
                if(this.taskController){
                    this.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Furniture, taskParams)
                    cb();
                }else {
    
                    taskController.addTaskCounterGroup(tskData, uuid, 506, taskParams, () => {
                        cb();
                    });
              
                }
            } else {
                cb();
            }
        }

        doStockTaskCount(this.uuid_, taskData, stockLis, () => {
            this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
              let  newLis = this.getStockList(stockLis, doc.stocks ? doc.stocks : []);
                doc.stocks = newLis;
                this.saveStockDataToDataSource (doc, _ => {
                    callback(newLis);
                })
            });
        });
    }

    addBuiling2Cart (buildings, callback)
    {
        this.getFromDBOrCache(doc => {
            var stockLis = buildings;
            if(!doc){doc = {}}
            let newLis = this.getStockList(stockLis, doc.carts ? doc.carts : []);
            doc.carts = newLis;
            this.saveStockDataToDataSource (doc, _ => {
                callback(buildings);
            })
        });
    }

    removeBuildingFromCart (bid, callback){
        this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
            var carts = doc.carts;
            if (carts != null) {
                for (let i in carts) {
                    if (carts[i].id == bid) {
                        carts.splice(i, 1);
                        break;
                    }
                }
            }
            doc.carts = carts;
            this.saveStockDataToDataSource (doc, _ => {
                callback(bid);
            })
        });
    }

    updateCartBuildingCount (bid, count, callback) {
        this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
            var carts = doc.carts;
            if (carts != null) {
                for (let i in carts) {
                    if (carts[i].id == bid) {
                        carts[i].count = carts[i].count + count;
                        if (carts[i].count <= 0) {
                            carts[i].count = 0;
                        }
                        break
                    }
                }
            }
            doc.carts = carts;
            let updatebuiling = {};
            updatebuiling.bid = bid;
            updatebuiling.count = count;
            this.saveStockDataToDataSource (doc, _ => {
                callback(updatebuiling);
            })
        });
    }

}

module.exports = stockController;
