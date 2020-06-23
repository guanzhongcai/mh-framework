const InspirationEvent = require('./fixedController').InspirationEvent;
const InspirationTheme = require('./fixedController').InspirationTheme;
const GeneralAwards = require('./fixedController').GeneralAwards;
const heroController = require('./heroController');
const Notification = require('./notifController').Notification;
const playerController = require('./playerController');
const skillController = require('./../controllers/skillController');
const models = require('./../models');
const utils = require('./../../common/utils');
const _ = require('lodash')
const INSP_COUNT_MAX = 4;
const INSP_COUNT_UPTIME = 6*60*60*1000; // 6 hour
const INSP_AP = 1500

const SOME_DICE_ITEMID = 440004;
const DOUBLE_DICE_ITEMID = 440005;

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CONSTANTS = require('./../../common/constants');
function getWalkNode(mapNode)
{
    return {
        gridPos: mapNode.gridPos,
        eventId: mapNode.eventId,
        triggerStat: mapNode.triggerStat,
        status: mapNode.status,
        awardData: mapNode.awardData
    }
}

function getTotalAwardData(totalAwardData, awardData)
{
    totalAwardData.baselingg += awardData.baselingg;
    totalAwardData.lingg += awardData.lingg;
    totalAwardData.emotion += awardData.emotion;
    totalAwardData.ap += awardData.ap;
    totalAwardData.items = totalAwardData.items.concat(awardData.items);
    for (let i in totalAwardData.currency)
        totalAwardData.currency[i] += awardData.currency[i] ;

    return totalAwardData;
}

function doAction(awardMapCfg, extBuff, currPos, walkCount, EvData, themeId, heroId)
{
    function setBuffLis(eBuff, buffType, buffValue)
    {
        if ('object' === typeof eBuff.lis) {
            var isFind = false;
            for (let i in eBuff.lis) {
                if (eBuff.lis[i].type  === buffType) {
                    eBuff.lis[i].value += buffValue;
                    isFind = true;
                    break;
                }
            }

            if (!isFind) {
                eBuff.lis.push({ type: buffType, value: buffValue });
            }
        } else {
            eBuff.lis = [{ type: buffType, value: buffValue }];
        }
    }

    function getCovertEventData(evData, tid, hid) {
        // 获取主题事件的效果类型及效果值
        var newEvData = InspirationEvent.getThemeEventDataConfig(tid, evData.eventId, hid);
        return (newEvData ? newEvData : evData);
    }

    var awardData = models.InspAwardModel();
    var awardId_ = 0;
    var addGrid_ = 0;
    var addBaseLingg_ = 0;
    var castAp_ = 0;

    var eventData = getCovertEventData(EvData, themeId, heroId);

    if (eventData.type === 1) { // 加行动力
        awardData.ap = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
    } else if (eventData.type === 2) { // 减行动力
        awardData.ap = 0-utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
    } else if (eventData.type === 3) { // 获得灵感
        awardData.lingg = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
    } else if (eventData.type === 4) { // 停留在该格子
        walkCount = 0; // 停止走动
    } else if (eventData.type === 5) { // 获得辅助道具
        var awardId = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        awardId_ = awardId
        var bonusData = awardMapCfg.get(awardId);
        awardData.items = bonusData.items;
    } else if (eventData.type === 6) { // 获得铜板
        var awardId = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        awardId_ = awardId
        var bonusData = awardMapCfg.get(awardId);
        awardData.currency = bonusData.currency;
    } else if (eventData.type === 7) { // 获得独玉
        var awardId = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        awardId_ = awardId
        var bonusData = awardMapCfg.get(awardId);
        awardData.currency = bonusData.currency;
    } else if (eventData.type === 8) { // 增加心情
        awardData.emotion = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
    } else if (eventData.type === 9) { // 减少投骰子行动力
        var cAp = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        extBuff.ap -= cAp;
        castAp_ = 0 - cAp;

        setBuffLis(extBuff, eventData.type, cAp);

    } else if (eventData.type === 10) { // 向前移动
        var diceNum = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        addGrid_ = diceNum;
        walkCount += diceNum; // 注：直接加就行，到最后一个格子会自动停止走动
    } else if (eventData.type === 11) { // 后续获得灵感增加
        addBaseLingg_ = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        extBuff.lingg += addBaseLingg_;

        setBuffLis(extBuff, eventData.type, addBaseLingg_);

    } else if (eventData.type === 12) { // 增加投骰子行动力
        var cAp = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        extBuff.ap += cAp;
        castAp_ = cAp;

        setBuffLis(extBuff, eventData.type, cAp);

    } else if (eventData.type === 13) { // 减少心情
        awardData.emotion -= utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
    } else if (eventData.type === 14) { // 后退格子
        var step = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        addGrid_ = 0 - step;
        currPos -= step;
        currPos -= 1; // 注：减1是后续执行会加1
        if (currPos < 0) currPos = 0; // 设置回退落脚点
        walkCount = 1;

    } else if (eventData.type === 15) { // 减少灵感
        awardData.lingg -= utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];

    }else if(eventData.type === 16){ // 获得buff
        extBuff.eventBuff = eventData.value.split(',')
    } else if (eventData.type === 101) {
        // 增加骰子数
        var diceCountVal = utils.randomListByWeight(utils.getHashArraySplitTwice(eventData.value, '|', ','), 1)[0];
        if ('number' === typeof extBuff.diceCount) {
            extBuff.diceCount += diceCountVal;
        } else {
            extBuff.diceCount = diceCountVal;
        }
        setBuffLis(extBuff, eventData.type, diceCountVal);
    }

    return {
        castAp: castAp_,
        addBaseLingg: addBaseLingg_,
        addGrid: addGrid_,
        awardId: awardId_,
        extBuff: extBuff,
        currPos: currPos,
        walkCount: walkCount,
        awardData: awardData
    }
}

class inspController
{
    constructor(uuid,multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'InspData';
        this.inspData = null;
        this.inspRedisDataString = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    errorHandle(){
        this.inspData = null;
        this.inspRedisDataString = null
    }

    costBuff(themeId,buff)
    {
        return new Promise(resolve => {
            if(!buff|| buff.length === 0){
                return resolve(1)
            }
            this.getInspDataFromDataSource(function (data) {
                let inspData = data.inspData.filter(element=>{ return element.themeId == themeId})
                if(inspData.length === 0||!inspData[0].extBuff || !inspData[0].extBuff.eventBuff){return resolve(-1)}
                let eventBuff = inspData[0].extBuff.eventBuff
                if(eventBuff){
                   let buffId = eventBuff[0]
                   let ret = buff.filter((element )=>{ return element.id == buffId})
                    if(ret && ret.length > 0){
                        return resolve(1)
                    }else{
                        return resolve(-1)
                    }
                }else{
                    //无buff
                    return resolve(-1)
                }
            })
        })
    }

    getInspDataFromDataSource (callback) {
        if (this.inspData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sInspirationData => {
                this.inspRedisDataString = sInspirationData;
                let doc = sInspirationData &&  validator.isJSON(sInspirationData) ? JSON.parse(sInspirationData) : null;
                this.inspData = doc;
                callback (doc);
            });
        }else {
            callback (this.inspData);
        }
    }

    saveInspDataToDataSource (inspData, callback) {
        if (inspData != null) {
            let saveString = JSON.stringify(inspData);
            let shouldSave = false;
            if (this.inspRedisDataString == null || this.inspRedisDataString !== saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.inspData = inspData;
                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_, saveString)
                this.inspRedisDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    closeGrid(grid,mapCount)
    {
        if(grid - 1 < 1){
            return [grid,grid +1]
        }
        if(grid + 1 > mapCount){
            return [grid,grid-1]
        }
        return [grid,grid-1,grid +1]
    }

    // =================================================================
    // 数据处理
    // =================================================================
    createThemeMapData(themeId, heroId, callback)
    {
        var mapData = [],self = this
        // 获取数量信息
        let countConfig =  InspirationTheme.getEventCountConfig(themeId)
        // 固定事件
        let persistEventList = InspirationTheme.getTypeEventConfig(themeId, 0, countConfig.persistEventCount)

        // 获取随机事件列表
        let randEventList   = InspirationTheme.getTypeEventConfig(themeId, 1,  countConfig.randEventCount)

        let merchantEventList = InspirationTheme.getTypeEventConfig(themeId,4,countConfig.merchantEventNum)

        let themeEventList = InspirationTheme.getTypeEventConfig(themeId,2, 1) // 固定位置生产主题事件

        const [linkEventList,map] = InspirationTheme.getLinkEventConfig(themeId,3,countConfig.linkEventNum)

        // 创建空地图数据（最终宝箱格子不创建）
        for (let i = 0; i < countConfig.mapCount-1; i++) {
            mapData.push(models.InspGridModel());
        }
        // 合并事件列表（固定事件+随机事件）
        var eventList = persistEventList.concat(randEventList);
        // 合并列表（固定事件+随机事件+墨魂专属事件）
        eventList = eventList.concat(merchantEventList)
        eventList = eventList.concat(InspirationTheme.getRandHeroOwnEventListConfig(themeId, heroId,countConfig.heroLinkEventNum));
        const grid_map = {}
        let withOut = []
        // 固定事件位置
        linkEventList.map(element =>{
            let link_start_grid = _.random(5,30)
            let link_end_grid = _.random(40,67)
            withOut.push(...self.closeGrid(link_end_grid,countConfig.mapCount),...self.closeGrid(link_start_grid,countConfig.mapCount))
            grid_map[link_start_grid] = element
            grid_map[link_end_grid] = parseInt(map[element])
        })

        let total = _.times(countConfig.mapCount, Number)
        total[0] = countConfig.mapCount
        if (themeEventList.length >= 1) {
            // 插入主题事件
            var midPos = Math.floor(countConfig.mapCount / 2) - 1;
            mapData[midPos].eventId = themeEventList[0];
            withOut.push(...self.closeGrid(midPos),countConfig.mapCount)
        }

        //洗牌
        eventList = _.shuffle(eventList)
        let remainGrid = _.difference(total,withOut)
        let max_step = (remainGrid.length / eventList.length).toFixed(0)
        max_step = Number(max_step)
        const compare = JSON.parse(JSON.stringify(max_step))
        let min_step = 2
        let step = _.random(min_step,max_step)
        let count = 0,stepCount = 0,times = 0,move = 0,eventCount = JSON.parse(JSON.stringify(eventList.length))
        for (let grid of remainGrid){
            count ++
            if(count === step){
                // 埋点
                count = 0
                times ++
                step = _.random(min_step,max_step)
                stepCount = step - compare
                if(stepCount < 0){
                    if(max_step < 8){
                        min_step ++
                        max_step ++
                    }
                }
                if(stepCount > 0){
                    if(min_step > 2){
                        min_step --
                        max_step --
                        move --
                    }
                }
                if(times === remainGrid.length ){
                    eventCount--
                    if(eventCount> 0){
                        grid_map[grid - stepCount] = eventList.pop()
                    }else{
                        break
                    }
                }else{
                    eventCount--
                    if(eventCount> 0){
                        grid_map[grid] = eventList.pop()
                    }else{
                        break
                    }
                }
            }
        }

        for (let i = 0; i < mapData.length; i++){
            mapData[i].gridPos = i+1;
            if(grid_map[i+1]){
                mapData[i].eventId = grid_map[i+1]
            }
        }

        // 最终宝箱格子（必定是宝箱）
        var lastGridData = models.InspGridModel();
        lastGridData.gridPos = countConfig.mapCount;
        mapData.push(lastGridData);
        callback(mapData);
    }

    getBaseInfo(callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc) {
                callback({inspCount: doc.inspCount,inspCountUpStartTime: doc.inspCountUpStartTime,inspBuyCount: doc.inspBuyCount});
            } else {
                callback({inspCount: 0,inspCountUpStartTime: 0,inspBuyCount: 0});
            }
        });
    }

    getData(clsHero, themeId, playHeroId, callback)
    {
        // 注：地图刷新走完最后一个格子那边刷新
        this.getInspDataFromDataSource (async doc => {
            if (doc) {
                if (themeId > 0) {
                    let pos = -1;
                    for (let i = 0; i < doc.inspData.length; i++) {
                        if (doc.inspData[i].themeId === themeId) {
                            pos = i;
                            break;
                        }
                    }
                    if (pos > -1) {
                        // 找到该主题的数据
                        if (doc.inspData[pos].mapData.length === 0 ||
                                doc.inspData[pos].currGridPos === doc.inspData[pos].mapData.length) {
                            doc.inspActionPoint = INSP_AP;
                            // 说明是解锁的新主题（未初期化地图数据）
                            this.createThemeMapData(themeId, playHeroId, async mapData => {
                                doc.inspData[pos].playHeroId = playHeroId;
                                delete doc.inspData[pos].linggTotal;
                                doc.inspData[pos].mapData = mapData; // 创建新地图
                                doc.inspData[pos].extBuff = models.InspThemeModel().extBuff;
                                doc.inspData[pos].currGridPos = 0;
                                doc.inspData[pos].addSkillBaselinggan = 0;
                                doc.inspData[pos].freeItemCnt = 0;
                                doc.inspData[pos].freeItemId  = -1;

                                let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().INSPIRATION, playHeroId, null);
                                if (skillEffectData.effBuffData != null) {
                                    let addBaseLinggan = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDBASELINGGAN];
                                    if (addBaseLinggan != null && addBaseLinggan.value != null) {
                                        doc.inspData[pos].addSkillBaselinggan = addBaseLinggan.value
                                        console.log("---- skill active add base ling gan  ", playHeroId, addBaseLinggan)
                                        doc.inspData[pos].effSkillList = skillEffectData.effSkillList;
                                    }

                                    let freeItemCnt = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().USEITEMFREE];
                                    if (freeItemCnt != null && freeItemCnt.value != null) {
                                        doc.inspData[pos].freeItemId = freeItemCnt.value;
                                        if (freeItemCnt.extra != null) doc.inspData[pos].freeItemCnt = freeItemCnt.extra;
                                        doc.inspData[pos].effSkillList = skillEffectData.effSkillList;
                                    }
                                }

                                this.saveInspDataToDataSource (doc, ()=> {
                                    callback(doc, {mapData: doc.inspData[pos].mapData, currGridPos: doc.inspData[pos].currGridPos,
                                        effSkillList:doc.inspData[pos].effSkillList, freeItemId:doc.inspData[pos].freeItemId, freeItemCnt:doc.inspData[pos].freeItemCnt});
                                });
                            });
                        } else {
                            callback(doc, {mapData: doc.inspData[pos].mapData, currGridPos: doc.inspData[pos].currGridPos,
                                effSkillList:doc.inspData[pos].effSkillList, freeItemId:doc.inspData[pos].freeItemId, freeItemCnt:doc.inspData[pos].freeItemCnt});
                        }
                    } else {
                        // 说明没有该主题的数据信息（需要初期化）
                        this.createThemeMapData(themeId, playHeroId, async mapData => {
                            var themeModel = models.InspThemeModel();
                            themeModel.themeId      = themeId;
                            themeModel.playHeroId   = playHeroId;
                            themeModel.mapData      = mapData;
                            themeModel.addSkillBaselinggan = 0;
                            themeModel.freeItemCnt  = 0;
                            themeModel.freeItemId   = -1;

                            let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().INSPIRATION, playHeroId, null);
                            if (skillEffectData.effBuffData != null) {
                                let addBaseLinggan = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDBASELINGGAN];
                                if (addBaseLinggan != null && addBaseLinggan.value != null) {
                                    themeModel.addSkillBaselinggan = addBaseLinggan.value
                                    console.log("---- skill active add base ling gan  ", playHeroId, addBaseLinggan)
                                }

                                let freeItemCnt = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().USEITEMFREE];
                                if (freeItemCnt != null && freeItemCnt.value != null) {
                                    themeModel.freeItemId = freeItemCnt.value;
                                    if (freeItemCnt.extra != null) themeModel.freeItemCnt = freeItemCnt.extra;
                                }
                            }

                            var isFind = false;
                            for (let i = 0; i < doc.inspData.length; i++) {
                                if (doc.inspData[i].themeId == themeId) {
                                    doc.inspData[i].playHeroId = playHeroId;
                                    delete doc.inspData[i].linggTotal;
                                    doc.inspData[i].mapData = mapData;
                                    isFind = true;
                                    break;
                                }
                            }
                            if (!isFind)
                                doc.inspData.push(themeModel); // {themeId, mapData}

                            this.saveInspDataToDataSource (doc, ()=> {
                                callback(doc, {mapData: mapData, currGridPos: 0, effSkillList:themeModel.effSkillList, freeItemId:themeModel.freeItemId, freeItemCnt:themeModel.freeItemCnt});
                            });
                        });
                    }
                } else {
                    // Call from GameData
                    var themeData = null;
                    for (let i in doc.inspData) {
                        if (doc.inspData[i].mapData.length != doc.inspData[i].currGridPos) {
                            themeData = doc.inspData[i];
                            break;
                        }
                    }
                    callback(doc, {themeData: themeData});
                }
            } else {
                // 新建数据
                let inspModel = models.InspModel();
                inspModel.uuid = this.uuid_;
                inspModel.inspBuyCount = 0;
                inspModel.inspCount = INSP_COUNT_MAX; // 此后会配置支持
                inspModel.inspActionPoint = INSP_AP;
                inspModel.themeList = InspirationTheme.getOpenWeekThemeListConfig();
                inspModel.inspData = [];

                if (themeId > 0) {
                    this.createThemeMapData(themeId, playHeroId, async mapData => {
                    //this.createThemeData(themeId, playHeroId, themeData => {
                        var themeModel = models.InspThemeModel();
                        themeModel.themeId      = themeId;
                        themeModel.playHeroId   = playHeroId;
                        themeModel.mapData      = mapData;
                        themeModel.addSkillBaselinggan = 0;
                        themeModel.freeItemCnt  = 0;
                        themeModel.freeItemId   = -1;

                        let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().INSPIRATION, playHeroId, null);
                        if (skillEffectData.effBuffData != null) {
                            let addBaseLinggan = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDBASELINGGAN];
                            if (addBaseLinggan != null && addBaseLinggan.value != null) {
                                themeModel.addSkillBaselinggan = addBaseLinggan.value
                                console.log("---- skill active add base ling gan  ", playHeroId, addBaseLinggan)
                            }

                            let freeItemCnt = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().USEITEMFREE];
                            if (freeItemCnt != null && freeItemCnt.value != null) {
                                themeModel.freeItemId = freeItemCnt.value;
                                if (freeItemCnt.extra != null) themeModel.freeItemCnt = freeItemCnt.extra;
                            }
                        }

                        var isFind = false;
                        for (let i = 0; i < inspModel.inspData.length; i++) {
                            if (inspModel.inspData[i].themeId == themeId) {
                                inspModel.inspData[i].playHeroId = playHeroId;
                                delete inspModel.inspData[i].linggTotal;
                                inspModel.inspData[i].mapData = mapData;
                                isFind = true;
                                break;
                            }
                        }
                        if (!isFind)
                            inspModel.inspData.push(themeModel); // {themeId, mapData}

                        this.saveInspDataToDataSource (inspModel, ()=> {
                            callback(inspModel, {mapData: mapData, currGridPos: 0, effSkillList:themeModel.effSkillList, freeItemId:themeModel.freeItemId, freeItemCnt:themeModel.freeItemCnt});
                        });
                    });
                } else {
                    this.saveInspDataToDataSource (inspModel, ()=> {
                        callback(inspModel, {themeData:null});
                    });
                }
            }
        });
    }

    getThemeData(themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            let themeData = null;
            if (doc && doc.inspData) {
                for (let index in doc.inspData) {
                    if (doc.inspData[index].themeId == themeId) {
                        themeData = doc.inspData[index];
                        break;
                    }
                }
            }
            callback(themeData);
        });
    }

    getThemeDataUsingThemeId (themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            let themeData = null;
            if (doc && doc.inspData) {
                for (let index in doc.inspData) {
                    if (doc.inspData[index].themeId == themeId) {
                        themeData = doc.inspData[index];
                        break;
                    }
                }
            }
            callback (doc, themeData);
        });
    }

    async setThemeData(themeId, themeData)
    {
        return new Promise( resolve => {
            this.getInspDataFromDataSource (doc => {
                if (doc && doc.inspData) {
                    for (let index in doc.inspData) {
                        if (doc.inspData[index].themeId == themeId) {
                            doc.inspData[index] = themeData
                            break;
                        }
                    }
                    this.saveInspDataToDataSource (doc, ()=> {
                        resolve(true);
                    });
                }else {
                    resolve(false);
                }
            });
        });
    }

    // =================================================================
    // 掷骰子
    // =================================================================
    checkPlayHeroValid(themeId, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            callback(themeDatas && inspData && 'number' == typeof inspData.playHeroId ? inspData.playHeroId : 0);
        });
    }

    checkPlayIsOverValid(themeId, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            let isOver = false;
            if (themeDatas && inspData) {
                isOver = (inspData.currGridPos === inspData.mapData.length);
            }
           callback(isOver);
        });
    }

    getExtBuffAp(themeId, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            var extAp = 0;
            if (themeDatas && inspData && inspData.extBuff != null) {
                extAp = inspData.extBuff.ap;
            }
            callback(extAp);
        })
    }

    setGameOver(themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && doc.inspData) {
                for (let i in doc.inspData) {
                    if (doc.inspData[i].themeId === themeId) {
                        // 将当前位置设置成最后位置就是游戏结束
                        doc.inspData[i].currGridPos = doc.inspData[i].mapData.length;
                        break;
                    }
                }
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    getAwardAll(themeId, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            var totalAwardData = models.InspAwardModel(), overAwardData = {};
            if (themeDatas && inspData) {
                var themeData = inspData;
                for (let i in themeData.mapData) {
                    if (themeData.mapData[i].awardData) {
                        var idx = parseInt(i);

                        if ((idx + 1) === themeData.mapData.length) {
                            overAwardData = themeData.mapData[i].awardData;
                        } else {
                            totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[i].awardData);
                        }
                    }
                }
            }
            callback(totalAwardData, overAwardData);
        });
    }

    toPlayDice(themeId, callback)
    {
        // 获取步数
        function getWalkCount(diceNum, mapNum, currPos)
        {
            return (diceNum+currPos) > mapNum ? (mapNum-currPos) : diceNum;
        }

        // 获取骰子数据（根据使用道具）
        function getDiceNum(useItem, extBuff)
        {
            //var effItemId = 0;
            var totalDiceNum = 0, diceList = [];
            if (useItem.length > 0) {
                /*
                if (useItem[0].id == SOME_DICE_ITEMID) {
                    // 任意骰子
                    var diceVal = useItem[0].count;//utils.getRandom(6);
                    totalDiceNum += diceVal;
                    diceList.push(diceVal);

                    //effItemId = SOME_DICE_ITEMID;
                } else if (useItem[0].id == DOUBLE_DICE_ITEMID) {
                    // 双倍骰子
                    for (let i = 0; i < 2; i++) {
                        var diceVal = utils.getRandom(6);
                        totalDiceNum += diceVal;
                        diceList.push(diceVal);
                    }

                    //effItemId = DOUBLE_DICE_ITEMID;
                }*/
                var pos = -1;
                // 查找遥控骰子（优先使用）
                for (let i in useItem) {
                    if (useItem[i].id === SOME_DICE_ITEMID) {
                        pos = i;
                        break;
                    }
                }
                if (pos > -1) {
                    // 找到遥控骰子
                    var diceVal = useItem[pos].count;//utils.getRandom(6);
                    totalDiceNum += diceVal;
                    diceList.push(diceVal);
                    useItem.splice(pos, 1); // 清除改元素
                } else {
                    if (useItem[0].id === DOUBLE_DICE_ITEMID) {
                        // 双倍骰子
                        for (let i = 0; i < 2; i++) {
                            var diceVal = utils.getRandom(6);
                            totalDiceNum += diceVal;
                            diceList.push(diceVal);
                        }
                    }

                    useItem = [];
                }
            } else {
                // 没有使用道具
                totalDiceNum = utils.getRandom(6);
                diceList.push(totalDiceNum);
            }

            // 增加额外的骰子数
            totalDiceNum += extBuff.diceCount;

            return {
                //effItemId: effItemId,
                totalDiceNum: totalDiceNum,
                diceData: diceList,
                useItem: useItem
            }
        }

        // 获取存储数据
        this.getInspDataFromDataSource (doc => {
            if (doc == null) doc = {};
            var pos = -1, themeData = null, addSkillBaselinggan = 0;
            // 获取对应主题数据位置
            for (let i in doc.inspData) {
                if (doc.inspData[i].themeId === themeId) {
                    themeData = doc.inspData[i];
                    if (themeData.addSkillBaselinggan != null) addSkillBaselinggan = themeData.addSkillBaselinggan;
                    pos = i;
                    break;
                }
            }

            // 获取骰子数据
            var diceData = getDiceNum(doc.useEffectItem, themeData.extBuff);
            //doc.effItemId = diceData.effItemId; // 设置效果道具（用户gamedata接口返回）
            doc.effItemId = 0; // 使用过后清除效果道具的保存数据

            doc.useEffectItem = diceData.useItem; // 可能会有多个效果道具

            var totalAwardData = models.InspAwardModel();

            // 获取通用奖励配置
            GeneralAwards.getAwardMapConfig(awardMapConfig => {
                // 获取全部事件配置
                InspirationEvent.getEventMapConfig(eventMapConfig => {
                    // 走格子基础灵感配置
                    InspirationTheme.getBaseLinggConfig(themeId, baseLingg => {
                        baseLingg += themeData.extBuff.lingg;
                        baseLingg += addSkillBaselinggan;

                        //var baseLingg_ = baseLingg + themeData.extBuff != null ? themeData.extBuff.lingg : 0;
                        // 获取最终宝箱奖励配置
                        InspirationTheme.getOverAwardBonusConfig(themeId, (overAwardId, overBonusData) => {
                            // 获取步数
                            var walkCount = getWalkCount(diceData.totalDiceNum, themeData.mapData.length, themeData.currGridPos);
                            var walkList = [];


                            while (walkCount--) {

                                ++themeData.currGridPos; // 增加当前位置（前进一步）

                                var index = themeData.currGridPos - 1; // 注：索引和步子相差1

                                // themeData.mapData[index].status = 1; // 设置走过格子状态
                                if (themeData.mapData[index] == null || themeData.mapData[index] == 'undefined' || 'object' != typeof themeData.mapData[index]) {
                                    break;
                                }

                                if ('number' != typeof themeData.mapData[index].triggerStat) themeData.mapData[index].triggerStat = 0;

                                if (themeData.currGridPos === themeData.mapData.length) {
                                    // 当前格子和地图长度一致说明是最后宝箱了（直接获取宝箱奖励）
                                    themeData.mapData[index].awardData = models.InspAwardModel();
                                    if (themeData.mapData[index].status === 0) {
                                        if (themeData.mapData[index].awardData.baselingg) {
                                            themeData.mapData[index].awardData.baselingg += baseLingg;
                                        } else {
                                            themeData.mapData[index].awardData.baselingg = baseLingg;
                                        }
                                    }
                                    //themeData.mapData[index].awardData.lingg += baseLingg; // 基础灵感增加
                                    themeData.mapData[index].awardData.items = overBonusData.items;
                                    themeData.mapData[index].awardData.lingg = overBonusData.attrs.lingg;
                                    themeData.mapData[index].awardData.rewardId = overAwardId;
                                    themeData.mapData[index].awardData.currency = overBonusData.currency;

                                    totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);

                                    var mapNode = getWalkNode(themeData.mapData[index]);
                                    walkList.push(mapNode);

                                    walkCount = 0; // 停止走动
                                } else {

                                    var eventData = eventMapConfig.get(themeData.mapData[index].eventId);
                                    if (eventData) {
                                        if (walkCount === 0 && eventData.optFlag === 1) {
                                            // 是选项事件
                                            themeData.mapData[index].awardData = models.InspAwardModel();
                                            if (themeData.mapData[index].status === 0)
                                                themeData.mapData[index].awardData.baselingg += baseLingg;
                                            themeData.mapData[index].triggerStat = 1; // 设置触发状态（选项事件只设置状态不实际触发）

                                            totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);

                                            var mapNode = getWalkNode(themeData.mapData[index]);
                                            walkList.push(mapNode);
                                        } else {
                                            if (walkCount === 0 && themeData.mapData[index].triggerStat === 0) { // 未触发过
                                                // 最后落脚点（必定触发）
                                                var retData = doAction(awardMapConfig, themeData.extBuff, themeData.currGridPos, walkCount, eventData, themeData.themeId, themeData.playHeroId);

                                                var oldCurrGridPos = themeData.currGridPos;

                                                themeData.extBuff = retData.extBuff;
                                                themeData.currGridPos = retData.currPos;
                                                walkCount = retData.walkCount;
                                                if (themeData.mapData[index].status === 0) {
                                                    if (retData.awardData.baselingg) {
                                                        retData.awardData.baselingg += baseLingg;
                                                    } else {
                                                        retData.awardData.baselingg = baseLingg;
                                                    }
                                                }

                                                totalAwardData = getTotalAwardData(totalAwardData, retData.awardData);

                                                themeData.mapData[index].awardData = retData.awardData;
                                                if (retData.awardId > 0)
                                                    themeData.mapData[index].awardData.rewardId = retData.awardId;
                                                if (retData.addGrid !== 0)
                                                    themeData.mapData[index].awardData.addGrid = retData.addGrid;
                                                if (retData.addBaseLingg > 0) themeData.mapData[index].awardData.addBaseLingg = retData.addBaseLingg;
                                                themeData.mapData[index].awardData.castAp = retData.castAp;
                                                themeData.mapData[index].triggerStat = 1; // 设置触发状态

                                                // ==================================================
                                                if (oldCurrGridPos > retData.currPos) {
                                                    // 说明是后退
                                                    for (let k = index; k > retData.currPos; k--) {
                                                        var mapNode = getWalkNode(themeData.mapData[k]);
                                                        walkList.push(mapNode);
                                                    }
                                                } else {
                                                    var mapNode = getWalkNode(themeData.mapData[index]);
                                                    walkList.push(mapNode);
                                                }
                                                // ==================================================
                                            } else {
                                                // 只是经过的格子（需要判断是否经过触发）
                                                if (eventData.passFlag === 1 && themeData.mapData[index].triggerStat === 0) {
                                                    // 可触发事件（经过）
                                                    var retData = doAction(awardMapConfig, themeData.extBuff, themeData.currGridPos, walkCount, eventData, themeData.themeId, themeData.playHeroId);

                                                    var oldCurrGridPos = themeData.currGridPos;

                                                    themeData.extBuff = retData.extBuff;
                                                    themeData.currGridPos = retData.currPos;
                                                    walkCount = retData.walkCount;
                                                    if (themeData.mapData[index].status === 0) {
                                                        if (retData.awardData.baselingg) {
                                                            retData.awardData.baselingg += baseLingg;
                                                        } else {
                                                            retData.awardData.baselingg = baseLingg;
                                                        }
                                                    }
                                                    //retData.awardData.lingg += baseLingg; // 基础灵感增加
                                                    totalAwardData = getTotalAwardData(totalAwardData, retData.awardData);

                                                    themeData.mapData[index].awardData = retData.awardData;
                                                    if (retData.awardId > 0)
                                                        themeData.mapData[index].awardData.rewardId = retData.awardId;
                                                    if (retData.addGrid !== 0)
                                                        themeData.mapData[index].awardData.addGrid = retData.addGrid;
                                                    if (retData.addBaseLingg > 0) themeData.mapData[index].awardData.addBaseLingg = retData.addBaseLingg;
                                                    themeData.mapData[index].awardData.castAp = retData.castAp;
                                                    themeData.mapData[index].triggerStat = 1; // 设置触发状态

                                                    // ==================================================
                                                    if (oldCurrGridPos > retData.currPos) {
                                                        // 说明是后退
                                                        for (let k = index; k > retData.currPos; k--) {
                                                            var mapNode = getWalkNode(themeData.mapData[k]);
                                                            walkList.push(mapNode);
                                                        }
                                                    } else {
                                                        var mapNode = getWalkNode(themeData.mapData[index]);
                                                        walkList.push(mapNode);
                                                    }
                                                    // ==================================================
                                                } else {
                                                    // 不默认触发
                                                    themeData.mapData[index].awardData = models.InspAwardModel();
                                                    if (themeData.mapData[index].status === 0) {
                                                        themeData.mapData[index].awardData.baselingg += baseLingg;
                                                    }

                                                    totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);

                                                    var mapNode = getWalkNode(themeData.mapData[index]);
                                                    walkList.push(mapNode); // 走过的格子加入列表中
                                                }
                                            }
                                        }
                                    } else {
                                        // 空格子（也需要给与基础灵感奖励）
                                        themeData.mapData[index].awardData = models.InspAwardModel();
                                        if (themeData.mapData[index].status === 0) {
                                            if (themeData.mapData[index].awardData.baselingg) {
                                                themeData.mapData[index].awardData.baselingg += baseLingg;
                                            } else {
                                                themeData.mapData[index].awardData.baselingg = baseLingg;
                                            }
                                        }
                                        totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);
                                        var mapNode = getWalkNode(themeData.mapData[index]);
                                        walkList.push(mapNode); // 走过的格子加入列表中
                                    }
                                }

                                themeData.mapData[index].status = 1; // 设置走过格子状态
                            }

                            doc.inspData[pos] = themeData; // 设置新的主题数据
                            // 更新数据
                            //GameDB.updateOne(this.tblname_, {$set:doc}, { uuid: this.uuid_ }, _ => {
                            //GameRedisHelper.setHashFieldValue(this.tblname_, this.uuid_, JSON.stringify(doc), () => {
                            this.saveInspDataToDataSource (doc, ()=> {
                                callback({
                                    currGridPos: themeData.currGridPos,
                                    diceData: diceData.diceData,
                                    walkData: walkList,
                                    awardData: totalAwardData
                                });
                            });
                        });
                    })
                });
            });
        });
    }

    // =================================================================
    // 解锁主题
    // =================================================================
    checkThemeUnlockValid(themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            let ret = false;
            if (doc && doc.themeList) {
                for (let i = 0; i < doc.themeList.length; i++) {
                    if (doc.themeList[i] === themeId) {
                        ret = true;
                        break;
                    }
                }
            }
            callback(ret);
        });
    }

    // 按周期（cycle:week）开放主题
    openThemeByCycleWeek(callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc) {
                var newThemeLis = InspirationTheme.getOpenWeekThemeListConfig();
                if (JSON.stringify(doc.themeList) !== JSON.stringify(newThemeLis)) {
                    doc.inspData = [];
                }
                doc.themeList = newThemeLis;
                this.saveInspDataToDataSource (doc, ()=> {
                    callback(doc.themeList);
                });
            } else {
                callback([]);
            }
        });
    }
    // 当前格子位置
    getCurrGridPos(themeId, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
           callback(themeDatas && inspData ? inspData.currGridPos : 0);
        });
    }

    setCurrGridPos(themeId, v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc == null) doc = {};
            if (doc.inspData == null) doc.inspData = [];
            for (let i = 0; i < doc.inspData.length; i++) {
                if (doc.inspData[i].themeId === themeId) {
                    doc.inspData[i].currGridPos = v;
                }
            }
        });
    }

    // =================================================================
    // 使用效果道具
    // =================================================================
    // 是否为任意骰子
    isUseItemSomeDice(callback)
    {
        // 任意骰子ID现在没有
        this.getUseEffectItem(useItem => {
            callback(useItem.length > 0 ? useItem[0].itemId === SOME_DICE_ITEMID : false);
        });
    }

    getUseEffectItem(callback)
    {
        this.getInspDataFromDataSource (doc => {
            callback(doc ? doc.useEffectItem : []);
        });
    }

    useEffectItem(callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc) {
                doc.useEffectItem = [];
                this.saveInspDataToDataSource (doc, ()=> {
                    callback(doc.useEffectItem);
                });
            }else {
                callback ([]);
            }
        });
    }

    setUseEffectItem(items, callback)
    {
        this.getInspDataFromDataSource (doc => {
            doc.useEffectItem = items;
            this.saveInspDataToDataSource (doc, ()=> {
                callback();
            });
        });
    }

    addUseEffectItem(item, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc.useEffectItem == null) doc.useEffectItem = [];
            doc.useEffectItem.push (item);
            this.saveInspDataToDataSource (doc, ()=> {
                callback();
            });
        });
    }

    // 是否为遥控骰子
    isControlDice(callback)
    {
        this.getInspDataFromDataSource (doc => {
            var ret = false;
            if (doc && Array.isArray(doc.useEffectItem)) {
                for (let i in doc.useEffectItem) {
                    if (doc.useEffectItem[i].id == 440004) {
                        ret = true;
                        break;
                    }
                }
            }
            callback(ret);
        });
    }

    setEffItemId(eitemId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            doc.effItemId = eitemId;
            this.saveInspDataToDataSource (doc, ()=> {
                callback();
            });
        });
    }

    // =================================================================
    // 灵感购买次数
    // =================================================================
    getInspBuyCount(callback)
    {
        this.getInspDataFromDataSource (doc => {
            callback(doc ? doc.inspBuyCount : 0);
        });
    }

    addInspBuyCount(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc.inspBuyCount == null) doc.inspBuyCount = 0;
            doc.inspBuyCount += v;
            this.saveInspDataToDataSource (doc, ()=> {
                callback(doc.inspBuyCount);
            });
        });
    }

    setInspBuyCount(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && doc.inspBuyCount) {
                doc.inspBuyCount = v
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            }else {
                callback();
            }
        });
    }

    // =================================================================
    // 灵感次数
    // =================================================================
    getInspCountCd(st)
    {
        var now = (new Date()).getTime();
        var cd = INSP_COUNT_UPTIME - (now-st);
        if (cd < 0) cd = 0;
        return cd;
    }

    setInspBatterySTime(st, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && 'number' == typeof doc.inspCountUpStartTime) {
                if (st > 0)
                    doc.inspCountUpStartTime = st;
                this.saveInspDataToDataSource (doc, ()=> {
                    callback(st);
                });
            } else {
                callback(0);
            }
        });
    }

    setInspCountUpStartTime(st, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && 'number' == typeof doc.inspCountUpStartTime) {
                if (doc.inspCountUpStartTime == 0) {
                    doc.inspCountUpStartTime = st;
                    this.saveInspDataToDataSource (doc, ()=> {
                        callback(doc.inspCountUpStartTime)
                    });
                } else {
                    callback(doc.inspCountUpStartTime);
                }
            } else {
                callback(0);
            }
        });
    }

    updateInspCount(reset, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && typeof doc.inspCountUpStartTime === 'number' && typeof doc.inspCount === 'number') {
                /* 取消灵感自动恢复逻辑
                 if (doc.inspCount < INSP_COUNT_MAX) {
                    var now = (new Date()).getTime();
                    if (doc.inspCountUpStartTime === 0)
                        doc.inspCountUpStartTime = now;
                    if ((now-doc.inspCountUpStartTime) >= INSP_COUNT_UPTIME) {
                        var count = Math.floor((now-doc.inspCountUpStartTime)/INSP_COUNT_UPTIME);
                        doc.inspCount += count;
                        doc.inspCount = doc.inspCount > INSP_COUNT_MAX ? INSP_COUNT_MAX : doc.inspCount;
                        doc.inspCountUpStartTime = now - ((now-doc.inspCountUpStartTime)-INSP_COUNT_UPTIME*count);
                    }
                }*/
                if (reset) {
                    doc.inspCount = INSP_COUNT_MAX;
                    doc.inspCountUpStartTime = 0;
                    doc.inspBuyCount = 0;
                }
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    checkInspCountValid(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            let nowCount = doc && doc.inspCount ? doc.inspCount : 0;
            callback(nowCount >= v);
        });
    }

    isInspCountFull(callback)
    {
        this.getInspDataFromDataSource (doc => {
            callback(doc && doc.inspCount ? (doc.inspCount === INSP_COUNT_MAX) : false);
        });
    }

    getInspCount(callback)
    {
        this.getInspDataFromDataSource (doc => {
            callback(doc && doc.inspCount ? doc.inspCount : 0);
        });
    }

    addInspCount(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && 'number' == typeof doc.inspCount) {
                doc.inspCount += v;
                this.saveInspDataToDataSource (doc, ()=> {
                    callback(doc.inspCount);
                });
            }else {
                callback (0);
            }
        });
    }

    costInspCount(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && doc.inspCount) {
                doc.inspCount -= v;
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            }else {
                callback ();
            }
        });
    }

    // =================================================================
    // 行动力
    // =================================================================
    getInspActionPoint(callback)
    {
        this.getInspDataFromDataSource (doc => {
            callback(doc && doc.inspActionPoint ? doc.inspActionPoint : 0);
        });
    }

    setInspActionPoint(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc && doc.inspActionPoint) {
                doc.inspActionPoint = v;
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            }else {
                callback();
            }
        });
    }

    checkInspActionPointValid(v, callback)
    {
        this.getInspActionPoint(ap => {
            callback(ap >= v);
        });
    }

    costInspActionPoint(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            if (doc.inspActionPoint == null) doc.inspActionPoint = 0;
            var ap = 0;
            if (doc) {
                ap = doc.inspActionPoint - v;
                ap = ap < 0 ? 0 : ap;
            }
            doc.inspActionPoint = ap;

            this.saveInspDataToDataSource (doc, ()=> {
                callback(ap);
            });
        });
    }

    addInspActionPoint(v, callback)
    {
        this.getInspDataFromDataSource (doc => {
           if (doc.inspActionPoint == null) doc.inspActionPoint = 0;

            var ap = 0;
            if (doc) {
                ap = doc.inspActionPoint + v;
                ap = ap < 0 ? 0 : ap;
            }

            doc.inspActionPoint = ap;
            this.saveInspDataToDataSource (doc, ()=> {
                callback(ap);
            });
        });
    }

    // =================================================================
    // 事件选项
    // =================================================================
    getEventIdByGridPos(themeId, gridPos, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            let eventId = 0;
            if (themeDatas && inspData) {
                let mapData = inspData.mapData;
                for (let i = 0; i < mapData.length; i++) {
                    if (mapData[i].gridPos === gridPos) {
                        eventId = mapData[i].eventId;
                        break;
                    }
                }
            }
            callback(eventId);
        });
    }

    getRandomGoods(eventId)
    {
        let shopData = InspirationEvent.getRandomByConfig(eventId);
        return shopData;
    }

    buyGoods(goodsId)
    {
        let shopData = InspirationEvent.goodsBuy(goodsId);
        return shopData;
    }

    getSelectOptionCost(eventId, selectId, callback)
    {
        InspirationEvent.getOptCost(eventId, selectId, costData => {
            callback(costData);
        });
    }

    doSelectEvent(themeId, eventId, selectId, callback)
    {
        // 只要处理当前落脚点和最终落脚点（后退或前进）
        this.getInspDataFromDataSource (doc => {
            if (doc && doc.inspData) {
                let pos = -1, themeData = null;
                for (let i in doc.inspData) {
                    if (doc.inspData[i].themeId === themeId &&
                        doc.inspData[i].mapData.length > 0) {
                        pos = Number(i);
                        themeData = doc.inspData[i];
                        break;
                    }
                }
                var index = themeData.currGridPos-1;
                if (pos === -1 || themeData === null || themeData.mapData[index] == null || themeData.mapData[index] == 'undefined' || 'object' != typeof themeData.mapData[index]) {
                    callback(null);
                } else {

                    if ('number' != typeof themeData.mapData[index].triggerStat) themeData.mapData[index].triggerStat = 0;

                    // 通用奖励配置
                    var walkList = [];
                    var totalAwardData = models.InspAwardModel();
                    GeneralAwards.getAwardMapConfig(awardMapConfig => {
                        // 获取全部事件配置
                        InspirationEvent.getEventMapConfig(eventMapConfig => {
                            // 走格子基础灵感配置
                            InspirationTheme.getBaseLinggConfig(themeId, baseLingg => {
                                baseLingg += themeData.extBuff.lingg;
                                // 获取最终宝箱奖励配置
                                InspirationTheme.getOverAwardBonusConfig(themeId, (overAwardId, overBonusData) => {
                                    // 获取选项奖励效果
                                    InspirationEvent.getOptionEffectConfig(eventId, selectId, effConfig => {
                                        var walkCount = 0;
                                        var retData = doAction(awardMapConfig, themeData.extBuff,
                                            themeData.currGridPos, walkCount, effConfig, themeData.themeId, themeData.playHeroId);

                                        // ==================================================
                                        if ('number' != typeof retData.addGrid) retData.addGrid = 0;
                                        if (retData.addGrid != 0) {
                                            if (themeData.mapData[themeData.currGridPos-1].awardData != null && 'object' == typeof themeData.mapData[themeData.currGridPos-1].awardData) {
                                            themeData.mapData[themeData.currGridPos-1].awardData.addGrid = retData.addGrid;
                                            }
                                        }
                                        if (themeData.currGridPos > retData.currPos) {
                                            // 说明是后退
                                            for (let k = (themeData.currGridPos-1); k > retData.currPos; k--) {
                                                var mapNode = getWalkNode(themeData.mapData[k]);
                                                walkList.push(mapNode);
                                            }
                                        }
                                        // ==================================================
                                        var oldCurrGridPos = themeData.currGridPos;

                                        themeData.currGridPos = retData.currPos;
                                        walkCount = retData.walkCount;
                                        if (walkCount > 0) {
                                            var mapNode = getWalkNode(themeData.mapData[oldCurrGridPos-1]);
                                            walkList.push(mapNode);
                                            // 说明是前进或后退格子了
                                            while (walkCount--) {
                                                ++themeData.currGridPos; // 增加当前位置（前进一步）

                                                var index = themeData.currGridPos - 1; // 注：索引和步子相差1

                                                if (themeData.mapData[index] == null || themeData.mapData[index] == 'undefined' || 'object' != typeof themeData.mapData[index]) {
                                                    break;
                                                }

                                                if ('number' != typeof themeData.mapData[index].triggerStat) themeData.mapData[index].triggerStat = 0;
                                                if (themeData.mapData[index].triggerStat === 0) {
                                                    // 只有当格子未触发

                                                    if (themeData.currGridPos === themeData.mapData.length) {
                                                        // 当前格子和地图长度一致说明是最后宝箱了（直接获取宝箱奖励）
                                                        themeData.mapData[index].awardData = models.InspAwardModel();
                                                        if (themeData.mapData[index].awardData.baselingg) {
                                                            themeData.mapData[index].awardData.baselingg += baseLingg;
                                                        } else {
                                                            themeData.mapData[index].awardData.baselingg = baseLingg;
                                                        }
                                                        //themeData.mapData[index].awardData.lingg += baseLingg; // 基础灵感增加
                                                        themeData.mapData[index].awardData.items = overBonusData.items;
                                                        themeData.mapData[index].awardData.rewardId = overAwardId;
                                                        themeData.mapData[index].awardData.currency = overBonusData.currency;

                                                        totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);

                                                        walkCount = 0; // 停止走动
                                                    } else {
                                                        var eventData = eventMapConfig.get(themeData.mapData[index].eventId);
                                                        if (eventData) {
                                                            if (walkCount === 0 && eventData.optFlag === 1) {
                                                                // 是选项事件
                                                                themeData.mapData[index].awardData = models.InspAwardModel();
                                                                if (themeData.mapData[index].status === 0)
                                                                    themeData.mapData[index].awardData.baselingg += baseLingg;
                                                                themeData.mapData[index].triggerStat = 1; // 设置触发状态（选项事件只设置状态不实际触发）
                                                                // themeData.mapData[index].awardData = _.omitBy(themeData.mapData[index].awardData,_.isEmpty)
                                                            } else {
                                                                if (walkCount === 0 && themeData.mapData[index].triggerStat === 0) { // 未触发过
                                                                    // 最后落脚点（必定触发）
                                                                    var retData = doAction(awardMapConfig, themeData.extBuff, themeData.currGridPos, walkCount, eventData, themeData.themeId, themeData.playHeroId);
                                                                    // ==================================================
                                                                    if (themeData.currGridPos > retData.currPos) {
                                                                        // 说明是后退
                                                                        for (let k = (index-1); k > (retData.currPos+1); k--) {
                                                                            var mapNode = getWalkNode(themeData.mapData[k]);
                                                                            walkList.push(mapNode);
                                                                        }
                                                                    }
                                                                    // ==================================================

                                                                    themeData.extBuff = retData.extBuff;
                                                                    themeData.currGridPos = retData.currPos;
                                                                    walkCount = retData.walkCount;
                                                                    if (themeData.mapData[index].status === 0) {
                                                                        if (retData.awardData.baselingg) {
                                                                            retData.awardData.baselingg += baseLingg;
                                                                        } else {
                                                                            retData.awardData.baselingg = baseLingg;
                                                                        }
                                                                    }

                                                                    totalAwardData = getTotalAwardData(totalAwardData, retData.awardData);

                                                                    themeData.mapData[index].awardData = retData.awardData;
                                                                    if (retData.awardId > 0)
                                                                        themeData.mapData[index].awardData.rewardId = retData.awardId;
                                                                    if (retData.addGrid !== 0)
                                                                        themeData.mapData[index].awardData.addGrid = retData.addGrid;
                                                                    if (retData.addBaseLingg > 0) themeData.mapData[index].awardData.addBaseLingg = retData.addBaseLingg;
                                                                    themeData.mapData[index].awardData.castAp = retData.castAp;
                                                                    themeData.mapData[index].triggerStat = 1; // 设置触发状态
                                                                    // themeData.mapData[index].awardData = _.omitBy(themeData.mapData[index].awardData,_.isEmpty)
                                                                } else {
                                                                    // 只是经过的格子（需要判断是否经过触发）
                                                                    if (eventData.passFlag === 1 && themeData.mapData[index].triggerStat === 0) {
                                                                        // 可触发事件（经过）
                                                                        var retData = doAction(awardMapConfig, themeData.extBuff, themeData.currGridPos, walkCount, eventData, themeData.themeId, themeData.playHeroId);
                                                                        // ==================================================
                                                                        if (themeData.currGridPos > retData.currPos) {
                                                                            // 说明是后退
                                                                            for (let k = (index-1); k > (retData.currPos+1); k--) {
                                                                                var mapNode = getWalkNode(themeData.mapData[k]);
                                                                                walkList.push(mapNode);
                                                                            }
                                                                        }
                                                                        // ==================================================

                                                                        themeData.extBuff = retData.extBuff;
                                                                        themeData.currGridPos = retData.currPos;
                                                                        walkCount = retData.walkCount;
                                                                        if (themeData.mapData[index].status === 0) {
                                                                            if (retData.awardData.baselingg) {
                                                                                retData.awardData.baselingg += baseLingg;
                                                                            } else {
                                                                                retData.awardData.baselingg = baseLingg;
                                                                            }
                                                                        }
                                                                        //retData.awardData.lingg += baseLingg; // 基础灵感增加
                                                                        totalAwardData = getTotalAwardData(totalAwardData, retData.awardData);

                                                                        themeData.mapData[index].awardData = retData.awardData;
                                                                        if (retData.awardId > 0)
                                                                            themeData.mapData[index].awardData.rewardId = retData.awardId;
                                                                        if (retData.addGrid !== 0)
                                                                            themeData.mapData[index].awardData.addGrid = retData.addGrid;
                                                                        if (retData.addBaseLingg > 0) themeData.mapData[index].awardData.addBaseLingg = retData.addBaseLingg;
                                                                        themeData.mapData[index].awardData.castAp = retData.castAp;
                                                                        themeData.mapData[index].triggerStat = 1; // 设置触发状态
                                                                        // themeData.mapData[index].awardData = _.omitBy(themeData.mapData[index].awardData,_.isEmpty)
                                                                    } else {
                                                                        // 不默认触发
                                                                        themeData.mapData[index].awardData = models.InspAwardModel();
                                                                        if (themeData.mapData[index].status === 0)
                                                                            themeData.mapData[index].awardData.baselingg += baseLingg;
                                                                        totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);
                                                                        // themeData.mapData[index].awardData = _.omitBy(themeData.mapData[index].awardData,_.isEmpty)
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            // 空格子（也需要给与基础灵感奖励）
                                                            themeData.mapData[index].awardData = models.InspAwardModel();
                                                            if (themeData.mapData[index].status === 0) {
                                                                if (themeData.mapData[index].awardData.baselingg) {
                                                                    themeData.mapData[index].awardData.baselingg += baseLingg;
                                                                } else {
                                                                    themeData.mapData[index].awardData.baselingg = baseLingg;
                                                                }
                                                            }
                                                            totalAwardData = getTotalAwardData(totalAwardData, themeData.mapData[index].awardData);
                                                            // themeData.mapData[index].awardData = _.omitBy(themeData.mapData[index].awardData,_.isEmpty)
                                                        }
                                                    }

                                                    themeData.mapData[index].status = 1; // 设置走过格子状态

                                                    var mapNode = getWalkNode(themeData.mapData[index]);
                                                    walkList.push(mapNode); // 走过的格子加入列表中
                                                } else {
                                                    var mapNode = getWalkNode(themeData.mapData[index]);
                                                    walkList.push(mapNode); // 走过的格子加入列表中
                                                }
                                            }
                                        } else {
                                            // 说明只是奖励类
                                            var index = themeData.currGridPos - 1;
                                            totalAwardData = getTotalAwardData(totalAwardData, retData.awardData);
                                            var baselingg = themeData.mapData[index] && themeData.mapData[index].awardData && themeData.mapData[index].baselingg ? themeData.mapData[index].awardData.baselingg : 0;
                                            baselingg = baselingg ? baselingg : 0;
                                            themeData.mapData[index].awardData = retData.awardData;
                                            themeData.mapData[index].awardData.baselingg = baselingg;
                                            if (retData.addBaseLingg > 0) themeData.mapData[index].awardData.addBaseLingg = retData.addBaseLingg;
                                            themeData.mapData[index].awardData.castAp = retData.castAp;
                                            if (retData.awardId > 0)
                                                themeData.mapData[index].awardData.rewardId = retData.awardId;
                                            var mapNode = getWalkNode(themeData.mapData[index]);
                                            walkList.push(mapNode);
                                        }

                                        doc.inspData[pos] = themeData; // 设置新的主题数据
                                        // 更新数据
                                        this.saveInspDataToDataSource (doc, ()=> {
                                            callback({
                                                playHeroId: themeData.playHeroId,
                                                currGridPos: themeData.currGridPos,
                                                walkData: walkList,
                                                awardData: totalAwardData
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            } else {
                callback(null);
            }
        });
    }


    setGridStatus(themeId, gridPos, v, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            if (themeDatas && inspData) {
                for (let i = 0; i < inspData.mapData.length; i++) {
                    if (inspData.mapData[i].gridPos === gridPos) {
                        inspData.mapData[i].status = v;
                        break;
                    }
                }
                this.saveInspDataToDataSource (doc, ()=> {
                    callback();
                });
            }else {
                callback ();
            }
        });
    }

    getGridStatus(themeId, gridPos, callback)
    {
        this.getThemeDataUsingThemeId (themeId, (themeDatas, inspData) => {
            let stat = 1;
            if (themeDatas && inspData) {
                for (let i = 0; i < inspData.mapData.length; i++) {
                    if (inspData.mapData[i].gridPos === gridPos) {
                        stat = inspData.mapData[i].status
                        break;
                    }
                }
            }
            callback(stat);
        });
    }

    getBuffList(themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            var buffLis = [], eventBuff = [];
            if (doc && doc.inspData) {
                for (let index in doc.inspData) {
                    if (doc.inspData[index].themeId == themeId) {
                        if(_.isPlainObject(doc.inspData[index].extBuff) && doc.inspData[index].extBuff.eventBuff){
                            eventBuff = doc.inspData[index].extBuff.eventBuff
                        }
                        if ('object' === typeof doc.inspData[index].extBuff &&
                                'object' === typeof doc.inspData[index].extBuff.lis) {
                            buffLis = doc.inspData[index].extBuff.lis;
                        }
                        break;
                    }
                }
            }
            callback(buffLis,eventBuff);
        });
    }

    getLinggTotal(themeId, callback)
    {
        this.getInspDataFromDataSource (doc => {
            var linggTotal = 0;
            if (doc && doc.inspData) {
                for (let index in doc.inspData) {
                    if (doc.inspData[index].themeId == themeId) {
                        linggTotal = ('number' == typeof doc.inspData[index].linggTotal) ? doc.inspData[index].linggTotal : 0;
                        break;
                    }
                }
            }
            callback(linggTotal);
        });
    }

    addLinggTotal(themeId, v, callback)
    {
        this.getInspDataFromDataSource (doc => {
            var linggTotal = 0;
            if (doc && doc.inspData) {
                for (let index in doc.inspData) {
                    if (doc.inspData[index].themeId == themeId) {
                        if (doc.inspData[index].linggTotal) {
                            doc.inspData[index].linggTotal += v;

                            if (doc.inspData[index].linggTotal < 0)
                                doc.inspData[index].linggTotal = 0;

                            linggTotal = doc.inspData[index].linggTotal;
                        } else {
                            doc.inspData[index].linggTotal = v;
                            linggTotal = v;

                            if (v < 0) {
                                doc.inspData[index].linggTotal = 0;
                                linggTotal = 0;
                            }
                        }
                        break;
                    }
                }
            }
            callback(linggTotal);
        });
    }
}

module.exports = inspController;
