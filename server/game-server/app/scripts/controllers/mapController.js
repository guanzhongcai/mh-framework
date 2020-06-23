const GameDB = require('./../../../index.app').GameDB;
const models = require('./../models');

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CONSTANTS = require('./../../common/constants');
class MapController
{
    constructor(uuid, multiController, taskController = null)
    {
        this.m_uuid = uuid ? parseInt(uuid) : 0;
        this.m_tblName = 'MapData';
        this.mapData = null
        this.multiController = multiController;
        this.taskController = taskController;
    }

    errorHandle(){
        this.mapData = null
    }

    getFromDBOrCache(cb){
        if(!!this.mapData){
            cb(this.mapData)
        }else{
            GameRedisHelper.getHashFieldValue(this.m_tblName, this.m_uuid, sMapData => {
                var doc = sMapData && validator.isJSON(sMapData) ? JSON.parse(sMapData) : null;
                this.mapData = doc
                cb(doc);
            });
        }
    }

    getMapData(callback)
    {
        this.getFromDBOrCache(doc => {
            this.mapData = doc
            if (doc == null || doc.maps == null) {
                callback ([]);
            }else {
                callback(doc.maps);
            }
        });
    }

    addBuilding(id, type, tag, building, callback)
    {
        this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
            if (doc && doc.maps) {
                var isFind = false, pos = -1;
                for (let i in doc.maps) {
                    if (doc.maps[i].id === id && doc.maps[i].type === type && doc.maps[i].tag === tag) {
                        // 找到地图数据
                        pos = i;
                        for (let j in doc.maps[i].building) {
                            if (doc.maps[i].building[j].id === building.id &&
                                doc.maps[i].building[j].tag === building.tag) {
                                isFind = true;
                            }
                        }
                    }
                }

                if (isFind) {
                    // 说明重复
                    callback(building);
                } else {
                    if (pos == -1) {
                        // 没有地图数据
                        var mapModel = models.BuildingModel();
                        mapModel.id = id;
                        mapModel.type = type;
                        mapModel.tag = tag;
                        mapModel.building.push(building);
                        doc.maps.push(mapModel);
                    } else {
                        // 已有地图信息
                        doc.maps[pos].building.push(building);
                    }

                    this.multiController.push(1,this.m_tblName + ":" + this.m_uuid,JSON.stringify(doc))
                    this.mapData = doc
                    callback(building);
                }
            } else {
                var mapModel = models.BuildingModel();
                mapModel.id = id;
                mapModel.type = type;
                mapModel.tag = tag;
                mapModel.building.push(building);
                doc.maps = [];
                doc.maps.push (mapModel);

                this.multiController.push(1,this.m_tblName + ":" + this.m_uuid,JSON.stringify(doc))
                this.mapData = doc
                callback(building);
            }
        });
    }

    checkBuilding(id, tag, type, bid, btag, callback)
    {
        this.getFromDBOrCache(doc => {
             if(!doc){doc = {}}
            if (doc && doc.maps) {
                var isFind = false;
                for (let i in doc.maps) {
                    if (doc.maps[i].id === id && doc.maps[i].type === type && doc.maps[i].tag === tag) {
                        // 找到地图数据
                        for (let j in doc.maps[i].building) {
                            if (doc.maps[i].building[j].id === bid &&
                                doc.maps[i].building[j].tag === btag) {
                                isFind = true;
                            }
                        }
                    }
                }
                callback(!isFind);
            } else {
                callback(true);
            }
        });
    }

    updateBuildings (type, id, tag, mapdata, callback)
    {
        this.getFromDBOrCache(doc => {
            if(!doc){doc = {}}
            if (doc && doc.maps) {
                var isFind = false;
                for (let i in doc.maps) {
                    if (doc.maps[i].id === id && doc.maps[i].type === type && doc.maps[i].tag === tag) {
                        // 找到地图数据
                        if (mapdata.building) doc.maps[i].building = mapdata.building;
                        if (mapdata.pexpand) doc.maps[i].pexpand = mapdata.pexpand;
                        if (mapdata.mexpand) doc.maps[i].mexpand = mapdata.mexpand;
                        if (mapdata.deco) doc.maps[i].deco = mapdata.deco;
                        isFind = true;
                        break;
                    }
                }

                if (!isFind) {
                    // 未找到
                    var mapModel = models.BuildingModel();
                    mapModel.id = id;
                    mapModel.type = type;
                    mapModel.tag = tag;
                    if (mapdata.building) mapModel.building = mapdata.building;
                    if (mapdata.pexpand) mapModel.pexpand = mapdata.pexpand;
                    if (mapdata.mexpand) mapModel.mexpand = mapdata.mexpand;
                    if (mapdata.deco) mapModel.deco = mapdata.deco;
                    doc.maps.push(mapModel);
                }

                this.multiController.push(1,this.m_tblName + ":" + this.m_uuid,JSON.stringify(doc))
                this.mapData = doc
                callback(mapdata);
            } else {
                var mapModel = models.BuildingModel();
                mapModel.id = id;
                mapModel.type = type;
                mapModel.tag = tag;

                if (mapdata.building) mapModel.building = mapdata.building;
                if (mapdata.pexpand) mapModel.pexpand = mapdata.pexpand;
                if (mapdata.mexpand) mapModel.mexpand = mapdata.mexpand;
                if (mapdata.deco) mapModel.deco = mapdata.deco;

                doc.maps = [];
                doc.maps.push (mapModel);

                this.multiController.push(1,this.m_tblName + ":" + this.m_uuid,JSON.stringify(doc))
                this.mapData = doc
                callback(mapdata);
            }
        });
    }
}

module.exports = MapController;
