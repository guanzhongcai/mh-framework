const utils = require('./../../common/utils');
const models = require('./../models');
const playerController = require('./playerController');
const heroController = require('./../controllers/heroController');
const skillController = require('./../controllers/skillController');
const fixedController = require('./../controllers/fixedController');
const taskController = require('./../controllers/taskController');
const Notification = require('./notifController').Notification;
const Defaults = require('./../../designdata/Defaults');
const Skills = require('./../../designdata/Skills');
const WorkTermUpAndUnlock = require('./../../designdata/WorkTermUpAndUnlock');
const WorkBuildingExpend = require('./../../designdata/WorkBuildingExpend');
const WorkFormulas = require('./../../designdata/WorkFormulas');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const assert = require('assert');
const CONSTANTS = require('./../../common/constants');
const validator = require('validator');

class WorkController
{
    // 建筑状态
    static BUILDINGSTATS () {
        return {
            UNREPAIRED:0,   // 未修复
            REPAIRING:1,    // 修复中
            REPAIRED:2   // 已修复
        }
    };

    // 格子状态
    static GRIDSTATS () {
        return {
            LOCK:0,       // 未解锁
            UNLOCK:1,    // 已解锁
            WORKING:2,   //当前队列正在工作
            NOTEMPTY:3   //队列未领取
        }
    };

    // 操作状态
    static HEROOPTIONTYPE (){
        return {
            DEPLOY:0,   //配置
            RETIRED:1,  //卸任
        }
    }

    constructor(uuid, multiController)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'WorkData';
        this.workData = null;
        this.m_RedisWorkDataString = null;
        this.multiController = multiController
    }

    errorHandle(){
        this.workData = null
        this.m_RedisWorkDataString = null
    }

    // 获取工作队列数据
    getWorkDataFromSource (callback) {
        if (this.workData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sWorkData => {
                this.m_RedisWorkDataString = sWorkData;
                let doc = sWorkData && validator.isJSON(sWorkData)? JSON.parse(sWorkData) : {};
                this.workData = doc;
                callback (doc);
            });
        }else {
            callback (this.workData);
        }
    }

    // 保存工作队列数据
    saveWorkDataFromSource (workData, callback) {
        if (workData != null) {
            let saveString = JSON.stringify(workData);
            let shouldSave = false;
            if (this.m_RedisWorkDataString == null || this.m_RedisWorkDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.workData = workData;
                this.multiController.uniqPush(1, this.tblname_ + ":" + this.uuid_,  saveString)
                this.m_RedisWorkDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    // 获取指定建筑的工作信息
    async getTargetBuildingWorkData (bid) {
        return new Promise (resolve => {
            this.getWorkDataFromSource(doc => {
                let workData = null;
                if (doc.buildings == null) doc.buildings = [];
                if (doc && doc.buildings) {
                    let pos = -1;
                    for (let i in doc.buildings) {
                        if (doc.buildings[i].bid == bid) {
                            pos = i;
                            break;
                        }
                    }
                    if (pos !== -1) workData = doc.buildings[pos];
                }
                resolve (workData);
            });
        })
    }

    // 保存指定建筑的工作信息
    async saveTargetBuildingWorkData (bid, workData) {
        return new Promise (resolve => {
            this.getWorkDataFromSource(doc => {
                if (doc.buildings == null) doc.buildings = [];
                if (doc && doc.buildings) {
                    let find = false
                    for (let i in doc.buildings) {
                        if (doc.buildings[i].bid == bid) {
                            doc.buildings[i] = workData;
                            find = true
                            break;
                        }
                    }
                    if (!find) {
                        doc.buildings.push(workData);
                    }
                    this.saveWorkDataFromSource(doc, _ => {
                        resolve (true);
                    });
                }else {
                    resolve (false);
                }
            });
        })
    }

    // 创建指定建筑的工作信息 （用于初始数据创建 默认生产已经解锁的队列）
    async createBuildingWorkData (bid) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            return true;
        }else {
            let buildingMode = models.newWorkBuildingModel(bid);
            let defaultOpenLen = WorkBuildingExpend.getDefaultOpenHeroGridConfig();
            for (let i = 1; i <= defaultOpenLen; i++) {
                let heroGridModel = models.newWorkDataModel();
                heroGridModel.grid = i;
                heroGridModel.status = WorkController.GRIDSTATS().UNLOCK;
                buildingMode.workList.push(heroGridModel);
            }
            let saveSuccess = await this.saveTargetBuildingWorkData (bid, buildingMode);
            return saveSuccess;
        }
    }

    // 获取建筑状态
    async getBuildingStatus(bid) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData != null) {
            return workData.status;
        }else {
            return WorkController.BUILDINGSTATS().UNREPAIRED;
        }
    }

    // 设置建筑状态
    async setBuildingStatus(bid, stat) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            workData.status = stat;
            let success = await this.saveTargetBuildingWorkData (bid, workData);
            resolve (success);
        }else {
            resolve (false);
        }
    }

    // 设置建筑的修复状态
    async setBuildingRepairStat(bid, bstat, ts) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            workData.status = bstat;
            workData.repairTime = ts;
            workData.repaireNeedTime = 0;
            if (bstat === WorkController.BUILDINGSTATS().REPAIRING) {
                let configId = WorkTermUpAndUnlock.getIdByLevelConfig(bid, workData.level);
                if (configId !== 0) {
                    let needTime = WorkTermUpAndUnlock.getRepairCdConfig(configId);
                    if (needTime <= 0) {
                        workData.status = WorkController.BUILDINGSTATS().REPAIRED;
                        workData.repairTime = 0;
                        workData.repaireNeedTime = 0;
                    }else {
                        workData.repaireNeedTime = needTime;
                    }
                }
            }
            let success = await this.saveTargetBuildingWorkData (bid, workData);
            return success;
        }else {
            return false;
        }
    }

    // 获取建筑当前等级
    async getBuildingLevel(bid) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData != null) {
            return workData.level;
        }else {
            return 0;
        }
    }

    // 设置建筑等级
    async setBuildingLevel(buildingId, newLevel) {
        let workData = await this.getTargetBuildingWorkData (buildingId);
        if (workData) {
            workData.level = newLevel;
            let success = await this.saveTargetBuildingWorkData (buildingId, workData);
            return success;
        }else {
            return false;
        }
    }

    // 设置建筑修复时间
    async setBuildingRepairTime(bid, ts) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            workData.repairTime = ts;
            let success = await this.saveTargetBuildingWorkData (bid, workData);
            return success;
        }else {
            return false;
        }
    }

    // 检测当前建筑状态
    async checkBuildingValid(bid) {
        let valid = false;
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {valid = (workData.status === WorkController.BUILDINGSTATS().REPAIRED);}
        return valid;
    }

    async checkBuildingGridIsWorking (bid, grid) {
        let valid = false;
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            let workList = workData.workList;
            for (let i in workList) {
                if (workList[i].grid === grid && workList[i].status === WorkController.GRIDSTATS().WORKING) {
                    valid = true;
                    break;
                }
            }
        }
        return valid;
    }

    // 检测当前墨魂是否正在当前队列上生产
    async checkHeroIsGridList (bid, grid, heroId) {
        let valid = false;
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            let workList = workData.workList;
            for (let i in workList) {
                let work = workList[i];
                if (work.grid === grid && work.status == WorkController.GRIDSTATS().WORKING && work.hid === heroId) {
                    valid = true;
                    break;
                }
            }
        }
        return valid;
    }

    // 验证配方（此建筑上）
    async checkFormulaValid(bid, formulaId) {
        return new Promise( async resolve => {
            let level = await this.getBuildingLevel (bid);
            if (level <= 0) {
                resolve (false);
            }else {
                WorkTermUpAndUnlock.getOpenFormulaMapConfig(OpenFormulaMap => {
                    let formulaList = this._getFormulaList(OpenFormulaMap, bid, level);
                    resolve (formulaList.includes (formulaId));
                });
            }
        });
    }

    // 验证当前传入的墨魂是否匹配
    async checkHeroInGridValid (bid, grid, hid) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData != null) {
            let gridList = workData.workList;
            for (let i in gridList) {
                if (gridList[i].grid === grid && gridList[i].hid == hid) {
                    return true
                }
            }
        }
        return false
    }

     // 更新建筑修复进程
    async updateBuildingRepairProgress(bid) {
        return new Promise (async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            if (workData) {
                if (workData.status === WorkController.BUILDINGSTATS().REPAIRING) {
                    let configId = WorkTermUpAndUnlock.getIdByLevelConfig(bid, workData.level);
                    if (configId !== 0) {
                        // 获取该建筑修复时间配置
                        let cd = workData.repaireNeedTime - (utils.getTime() - workData.repairTime);
                        if (cd <= 0) {
                            workData.status = WorkController.BUILDINGSTATS().REPAIRED;
                            workData.repairTime = 0;
                            workData.repaireNeedTime = 0;
                        }
                    }
                }
                let success = await this.saveTargetBuildingWorkData (bid, workData);
                if (success) {
                    resolve (workData.status);
                }else {
                    resolve (WorkController.BUILDINGSTATS().UNREPAIRED);
                }
            }else {
                resolve (WorkController.BUILDINGSTATS().UNREPAIRED);
            }
        });
    }

    // 更新建筑配方列表
    async getBuildingList(bid) {
        /* 注：
            (1) 需要动态获取开启配方列表
            (2) 需要调整生产格子队列的时间及字段
        */
        return new Promise (resolve => {
            this.getWorkDataFromSource (doc => {
                assert (doc != null && doc.buildings != null, "work data should not be nil");
                let buildings = doc.buildings;
                WorkTermUpAndUnlock.getOpenFormulaMapConfig(OpenFormulaMap => {
                    let workList = [];
                    if (bid === 0) {
                        for (let i in buildings) {
                            buildings[i].formulaList = this._getFormulaList(OpenFormulaMap, buildings[i].bid, buildings[i].level);
                        }
                        workList = buildings;
                    }else {
                        for (let i in buildings) {
                            if (buildings[i].bid === bid) {
                                buildings[i].formulaList = this._getFormulaList(OpenFormulaMap, buildings[i].bid, buildings[i].level);
                                workList.push(buildings[i]);
                                break;
                            }
                        }
                    }
                    this.saveWorkDataFromSource (doc, _ => {
                        resolve (workList);
                    });
                });
            });
        });
    }

     // 获取墨魂队列所需解锁格子
    async getNeedUnlockGrid(bid, gridPos) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData != null) {
            let gridList = workData.workList;
            let maxGridCount = WorkBuildingExpend.getHeroGridMaxConfig();
            if (gridPos > maxGridCount) {
                return -2;
            }else {
                var grid = 0;
                for (let i in gridList) {
                    if (gridList[i].status === WorkController.GRIDSTATS().LOCK) {
                        if (gridPos === 0 || gridList[i].grid == gridPos) {
                            grid = gridList[i].grid;
                            break;
                        }
                    }else {
                        if (gridList[i].grid == gridPos) {
                            return -3;
                        }
                    }
                }

                if (grid == 0) {
                    grid = gridPos;
                }
                return gridPos;
            }
        }else {
            return -1;
        }
    }

    // 解锁条件相关的判断
    async checkConditionValid(modname, playerPtr, cfgId, bid, selectType) {
        return new Promise (resolve => {
            if (selectType === 1) {
                let validLis = (modname == 'building' ? WorkTermUpAndUnlock.getBuildingLevelUpConditionConfig(cfgId) :
                        WorkBuildingExpend.getGridUnlockConditionConfig(modname, bid, cfgId));
                if (validLis != null) {
                    let ret = 0, bLevel = 0;
                    playerPtr.getLevel(userLevel => {
                        for (let node of validLis) {
                            if (node.type === 1) {
                                // 判断繁荣度
                                if (userLevel < node.value2) {
                                    ret = -2; // 等级不足
                                    break;
                                }
                            } else if (node.type === 2) {
                                // 判断工坊等级
                                bLevel = this.getBuildingLevel (node.value1);
                                if (bLevel < node.value2) {
                                    ret = -3; // 建筑等级不足
                                    break;
                                }
                            }
                        }
                        resolve (ret);
                    });
                } else {
                    resolve (-1);
                }
            } else {
                resolve (0);
            }
        });
    }

    // 解锁对应的网格
    async unlockListByGrid(bid, grid) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            let workList = workData.workList;
            let hasFond = false
            for (let i in workList) {
                if (workList[i].grid === grid) {
                    workList[i].status = WorkController.GRIDSTATS().UNLOCK; // 解锁
                    hasFond = true;
                    break;
                }
            }
            if (!hasFond) {
                let heroGridModel = models.newWorkDataModel();
                heroGridModel.grid = grid;
                heroGridModel.status = WorkController.GRIDSTATS().UNLOCK;
                workList.push(heroGridModel);
            }
            let success = await this.saveTargetBuildingWorkData (bid, workData);
            return success;
        }else {
            return false;
        }
    }

    // 检测是否可以将墨魂添加到队列
    // 格子状态已解锁
    async checkHeroIntoGridValid(bid, grid, heroId) {
        let workData = await this.getTargetBuildingWorkData (bid);
        if (workData) {
            let workList = workData.workList;
            let ret = -1;
            for (let i in workList){
                if (workList[i].grid === grid) {
                    let gridStatus = workList[i].status;
                    if (gridStatus === WorkController.GRIDSTATS().LOCK) {
                        ret = -3;
                    }else if (gridStatus === WorkController.GRIDSTATS().WORKING) {
                        ret = -4;
                    }else if (gridStatus === WorkController.GRIDSTATS().NOTEMPTY){
                        if (workList[i].hid == heroId) {
                            ret = 0;
                        }else {
                            ret = -5;
                        }
                    }else {
                        ret = 0;
                    }
                }
            }
            return ret;
        } else {
            return -1;
        }
    }

    // 替换当前格子上的墨魂
    async heroAssignedIntoGrid (bid, grid, heroId) {
        return new Promise( async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            let kickoutHero = 0, assignedHero = 0;
            let retData = {};
            retData.workList = [];
            if (workData) {
                let workList = workData.workList;
                for (let i in workList){
                    if (workList[i].grid === grid) {
                        if (workList[i].hid == heroId) {
                            kickoutHero = heroId;
                            workList[i].hid = 0;
                        }else{
                            kickoutHero = workList[i].hid;
                            assignedHero = heroId;
                            workList[i].hid = assignedHero;
                        }
                        retData.workList.push (workList[i]);
                    }
                }
            }

            let clsHero = new heroController(this.uuid_, heroId, this.multiController, this.taskController);
            if (assignedHero !== 0) {
                clsHero.checkStatValid(async (statRet, status) => {
                    if (statRet == heroController.CHECKSTATS ().VALID) {
                        await this.saveTargetBuildingWorkData(bid, workData);
                        let workStats = {};
                        if (assignedHero != 0) { workStats[assignedHero] = heroController.WORKSTATS().WORKING;}
                        if (kickoutHero != 0) { workStats[kickoutHero] = heroController.WORKSTATS().IDLE;}
                        clsHero.setWorkStatBatch (workStats, async updateStats => {
                            retData.updateStats = updateStats;
                            retData.assignedHero = assignedHero;
                            retData.kickoutHero = kickoutHero;
                            retData.retCode = 0
                            resolve (retData);
                        });
                    }else {
                        resolve ({retCode:-1, statRet:statRet, status:status}); //墨魂状态不可用
                    }
                });
            }else {
                let workStats = {};
                if (kickoutHero != 0) { workStats[kickoutHero] = heroController.WORKSTATS().IDLE;}
                await this.saveTargetBuildingWorkData(bid, workData);
                clsHero.setWorkStatBatch (workStats, async updateStats => {
                    retData.updateStats = updateStats;
                    retData.assignedHero = assignedHero;
                    retData.kickoutHero = kickoutHero;
                    retData.retCode = 0
                    resolve (retData);
                });
            }
        });
    }

    // 使用当前的工作队列来创建添加墨魂或者移除墨魂后的工作队列信息
    async packageWorkList (optiontype, workList, grid, heroId, formulaId, count) {
        if (workList == null) workList = [];
        let newTempWorkList = workList.slice();
        let deployHeroId = 0, unDeployHeroId = 0;
        if (optiontype == WorkController.HEROOPTIONTYPE ().DEPLOY) {
            for (let i in newTempWorkList) {
                if (newTempWorkList[i].grid === grid) {
                    if (newTempWorkList[i].hid !== 0 && newTempWorkList[i].hid !== heroId) unDeployHeroId = newTempWorkList[i].hid;
                    newTempWorkList[i].hid = heroId;
                    deployHeroId = heroId;
                    newTempWorkList[i].fid = formulaId;
                    newTempWorkList[i].wcount = count;
                    newTempWorkList[i].status = WorkController.GRIDSTATS ().WORKING;
                    break;
                }
            }
        }else {
            for (let i in newTempWorkList) {
                if (newTempWorkList[i].grid === grid) {
                    if (newTempWorkList[i].hid !== 0 && newTempWorkList[i].hid === heroId) unDeployHeroId = newTempWorkList[i].hid;
                    newTempWorkList[i].hid = 0;
                    newTempWorkList[i].fid = 0;
                    newTempWorkList[i].wcount = 0;
                    newTempWorkList[i].status = WorkController.GRIDSTATS ().UNLOCK;
                }
            }
        }
        return {workList:newTempWorkList, deployHeroId: deployHeroId, unDeployHeroId:unDeployHeroId};
    }

    // 计算当前生效的技能列表和技能效果
    async addHeroAndFormulaToWorkingList (clsHero, bid, workData, optiontype, workInfo) {
        return new Promise (async resolve => {
            let grid = workInfo.grid, heroId = workInfo.heroId, formulaId = workInfo.formula, count = workInfo.count;
            let newPackageWorkListInfo = await this.packageWorkList (optiontype, workData.workList, grid, heroId, formulaId, count);
            let calcSkillResult = await this.calcWorkListSkillInfoByHeroAndFormula (clsHero, bid, newPackageWorkListInfo.workList);
            let nid = newPackageWorkListInfo.deployHeroId, oid = newPackageWorkListInfo.unDeployHeroId, workList = newPackageWorkListInfo.workList;
            let skillGroup = calcSkillResult.heroSkillGroup, buffGroup = calcSkillResult.heroBuffGroup;
            resolve ({heroSkillGroup:skillGroup, heroBuffGroup:buffGroup, workList:workList, deployHeroId:nid, unDeployHeroId:oid});
        });
    }

    //计算当前生效的技能和buff列表
    //生产需要效验的数据有  当前生产的配方 当前生产的配方数量 当前工作的工坊ID
    // sysType 系统类型 heroIdGroup 当前工作的墨魂列表  heroWorkInfoGroup 当前生产队列上相关的信息
    // bid 当前建筑ID 用来匹配生产配方类型 formulaId 当前配方ID count 当前生产配方数量 effSkillList 当前技能列表
    async calcWorkListSkillInfoByHeroAndFormula (clsHero, bid, workList)
    {
        return new Promise (async resolve => {
            let heroIdAndWorkInfo = await this.getHeroIdAndFormulaGroupByWorkList(bid, workList);
            let heroWorkInfoGroup = heroIdAndWorkInfo.heroWorkInfoGroup;
            let sysType = skillController.EFFECTSYS().PRODUCE;
            let heroIdGroup = heroIdAndWorkInfo.heroIdGroup;
            clsHero.getHeroSkillGroup(heroIdGroup, async heroSkillGroup => {
                let calcActiveSkillEffects = await skillController.calcHeroesActiveSkillEffects (clsHero, sysType, heroIdGroup, heroSkillGroup, heroWorkInfoGroup);
                resolve (calcActiveSkillEffects);
            });
        });
    }

    // 获取现在生产队列上的墨魂需要在工作状态下才可以计算
    async getHeroIdAndFormulaGroupByWorkList(bid, workList) {
        let heroIdGroup = [];
        let heroWorkInfoGroup = {};
        for (let i in workList) {
            let workData = workList[i];
            if (workData.fid > 0 && workData.hid > 0 && workData.status == WorkController.GRIDSTATS().WORKING) {
                heroIdGroup.push (workData.hid);
                heroWorkInfoGroup[workData.hid] = {bid: bid, formulaId:workData.fid, count:workData.wcount, effSkillList:workData.effSkillList}
            }
        }
        return {heroIdGroup:heroIdGroup, heroWorkInfoGroup:heroWorkInfoGroup};
    }

    // 计算配方当前体力消耗情况
    async getFormulaCostByBuffGroup (heroId, heroBuffGroup, formulaId){
        let buffData = this.getTargetHeroEffectSkillBuf (heroId, heroBuffGroup);
        return await this.calcFormulaCostInfo (formulaId, buffData);
    }

    // 计算每个配方的生产时间
    async getFormulaProduceTimeByBuffGroup (heroId, heroBuffGroup, formulaId){
        return new Promise (resolve => {
            let buffData = this.getTargetHeroEffectSkillBuf (heroId, heroBuffGroup);
            WorkFormulas.getNeedTime(formulaId, NeedTime => {
                let baseNeedTime = NeedTime;
                if (buffData != null)  {
                    let reduceTime = 0;
                    let reduceTimeRate = 0;
                    if (buffData[skillController.EFFECTRESULTTYPE().REDUCETIME] != null) {
                        reduceTime = buffData[skillController.EFFECTRESULTTYPE().REDUCETIME].value * 1000;
                    }
                    if (buffData[skillController.EFFECTRESULTTYPE().REDUCETIMEPERCENT] != null) {
                        reduceTimeRate = buffData[skillController.EFFECTRESULTTYPE().REDUCETIMEPERCENT].value / 10000; // 万分比
                        reduceTime = reduceTime + utils.refactorFloor(NeedTime * reduceTimeRate);
                    }
                    console.log("reduce time", reduceTime)
                    baseNeedTime -= reduceTime;
                }
                if (baseNeedTime <= 0) baseNeedTime = 0;
                resolve (baseNeedTime);
            });
        });
    }

    // 根据当前消耗的体力与货币是否满足
    async checkCostEnergyAndCurrencyTotalValid(playerPtr, heroPtr, heroId, costData, count) {
        return new Promise (resolve => {
            let costEnergy = costData.costEnergy * count;
            let totalCostCurrency = [];
            for (let i = 0; i < 3; i++) {
                totalCostCurrency.push (costData.costCurrency[i] * count);
            }

            let heroGridList = []; heroGridList.push (heroId);
            heroPtr.getHeroAttrListByHeroIdGroup(heroGridList, heroAttrList => {
                let valid = false;
                let newHeroAttrLis = [];
                for (let i in heroAttrList) {
                    if (heroAttrList[i].hid === heroId && heroAttrList[i].attrs.energy >= costEnergy) {
                        heroAttrList[i].attrs.energy -= costEnergy;
                        newHeroAttrLis.push(heroAttrList[i]);
                        valid = true; //说明当前体力满足配方消耗
                    }
                }
                if (valid) {
                    playerPtr.currencyMultiValid(totalCostCurrency, currencyValid => {
                        if (currencyValid) {
                            heroPtr.setHeroAttrGroup (newHeroAttrLis, _ => {
                                playerPtr.costCurrencyMulti (totalCostCurrency, newCurrency => {
                                    resolve ({retCode:0, currency:newCurrency, attrList:newHeroAttrLis});
                                });
                            });
                        }else {
                            resolve ({retCode:-2});
                        }
                    });
                }else {
                    resolve ({retCode:-1});
                }
            });
        });
    }

    // 获取配方的消耗数据
    async calcFormulaCostInfo(fid, buffData) {
        return new Promise (resolve => {
            let costData = {}
            WorkFormulas.getDefaultCostEnergyConfig(fid, formulaCostEnergy => {
                costData.costEnergy = formulaCostEnergy;
                if (buffData != null) {
                    let reduceEnergy = 0
                    if (buffData[skillController.EFFECTRESULTTYPE().REDUCEENERGY] != null) {
                        reduceEnergy = buffData[skillController.EFFECTRESULTTYPE().REDUCEENERGY].value;
                    }
                    if (buffData[skillController.EFFECTRESULTTYPE().REDUCEENERGYPERCENT] != null) {
                        let reduceEnergyPercent = buffData[skillController.EFFECTRESULTTYPE().REDUCEENERGYPERCENT].value / 10000; // 万分比
                        reduceEnergy = reduceEnergy + utils.refactorFloor(formulaCostEnergy * reduceEnergyPercent);
                    }

                    console.log("reduce energy", reduceEnergy)
                    costData.costEnergy -= reduceEnergy;
                    if (costData.costEnergy <= 0) costData.costEnergy = 0;
                }

                WorkFormulas.getDefaultCostConfig(fid, CostData => {
                    let costCurrency = CostData.currency;
                    let buffVal = 0;
                    if (buffData != null) {
                        if (buffData[skillController.EFFECTRESULTTYPE().REDUCECURRENCY] != null) {
                            buffVal = buffData[skillController.EFFECTRESULTTYPE().REDUCECURRENCY].value;
                        }

                        let reduceCurrency = [0, 0, 0];
                        if (buffData[skillController.EFFECTRESULTTYPE().REDUCECURRENCYPERCENT] != null) {
                            let reducePercent = buffData[skillController.EFFECTRESULTTYPE().REDUCECURRENCYPERCENT].value / 10000;
                            for (let i = 0; i < 3; i++) {
                                reduceCurrency[i] = utils.refactorFloor(costCurrency[i] * reducePercent);
                            }
                        }

                        for (let i = 0; i < 3; i++) {
                            costCurrency[i] = costCurrency[i] - buffVal - reduceCurrency[i];
                            if (costCurrency[i] <= 0) costCurrency[i] = 0;
                        }
                    }
                    costData.costCurrency = costCurrency;
                    resolve (costData);
                });
            });
        });
    }

    // 获得当前墨魂生效buff信息
    getTargetHeroEffectSkillBuf (heroId, heroBuffGroup) {
        for (let buff of heroBuffGroup) {
            if (buff.hid == heroId) {
                return buff.effBuffData;
            }
        }
        return null;
    }

    // 获取当前墨魂生效的技能列表
    getTargetHeroSkillList (heroId, heroSkillGroup) {
        for (let skill of heroSkillGroup) {
            if (skill.hid == heroId) {
                return skill.effSkillList;
            }
        }
        return null;
    }

    // 开始一个新的生产 计算生产相关的数据
    async updateNewFormulaProduceWork (workData, calcSkillResult, grid, costEnergy, count) {
        return new Promise (async resolve => {
            if (workData.status === WorkController.GRIDSTATS ().WORKING) {
                let formulaId = workData.fid
                let costTime = await this.getFormulaProduceTimeByBuffGroup (workData.hid, calcSkillResult.heroBuffGroup, formulaId);
                workData.wt = costTime;
                let skillList = this.getTargetHeroSkillList (workData.hid, calcSkillResult.heroSkillGroup)
                if (skillList == null) skillList = [];
                workData.effSkillList = skillList;
                let skillBufList = this.getTargetHeroEffectSkillBuf (workData.hid, calcSkillResult.heroBuffGroup)
                if (skillBufList == null) skillBufList = [];
                workData.skillBuff = skillBufList;
                if (workData.grid === grid) {
                    WorkFormulas.getItemIdConfig (formulaId, itemId => {
                        workData.itemId = itemId;
                        workData.itemCount = 0;
                        workData.wenergy = costEnergy;
                        workData.wcount = count - 1;
                        workData.st = utils.getTime ();
                        workData.nt = costTime;
                        resolve (workData);
                    });
                }else {
                    resolve (workData);
                }
            }else {
                resolve (workData);
            }
        });
    }

    // 添加墨魂与配方数量 开始生产 clsPlayer为外层创建的playerController
    // 检测内容 墨魂状态  配方是否可以使用  其他三个队列上的墨魂信息来计算当前队列上的生效技能效果
    // 计算配方消耗资材与体力
    // workInfo {bid grid heroId formula count}
    // retData  {retCode, currency, attrs, workList, statRet, status}
    async startProduceFormula (clsPlayer, clsHero, workInfo) {
        return new Promise (async resolve => {
            let isHeroValid = await this.checkHeroInGridValid (workInfo.bid, workInfo.grid, workInfo.heroId);
            if (isHeroValid) {
                let formulaValid = await this.checkFormulaValid (workInfo.bid, workInfo.formula);
                if (formulaValid) {
                    let buildingWorkData = await this.getTargetBuildingWorkData (workInfo.bid);
                    let op = WorkController.HEROOPTIONTYPE().DEPLOY;
                    let calcSkillResult = await this.addHeroAndFormulaToWorkingList (clsHero, workInfo.bid, buildingWorkData, op, workInfo);
                    let formulaCostData = await this.getFormulaCostByBuffGroup (workInfo.heroId, calcSkillResult.heroBuffGroup, workInfo.formula);
                    let costData = await this.checkCostEnergyAndCurrencyTotalValid (clsPlayer, clsHero, workInfo.heroId, formulaCostData, workInfo.count);
                    if (costData.retCode === 0) {
                        // 更新队列信息
                        let updatedWorkList = calcSkillResult.workList;
                        for (let i in updatedWorkList) {
                            await this.updateNewFormulaProduceWork (updatedWorkList[i], calcSkillResult, workInfo.grid, formulaCostData.costEnergy, workInfo.count);
                        }

                        buildingWorkData.workList = updatedWorkList;
                        await this.saveTargetBuildingWorkData (workInfo.bid, buildingWorkData)
                        resolve ({retCode:0, currency:costData.currency, attrList:costData.attrList,
                            workList:updatedWorkList, deployHeroId:calcSkillResult.deployHeroId, unDeployHeroId:calcSkillResult.unDeployHeroId});
                    }else {
                        if (costData.retCode === -1) {
                            resolve ({retCode:-3});     //体力不足
                        }else {
                            resolve ({retCode:-4});    //货币不足
                        }
                    }
                }else {
                    resolve ({retCode:-2});   //配方不可使用
                }
            }else {
                resolve ({retCode:-1}); //墨魂状态不可用
            }
        });
    }

    calcFormulaCompleteTimes (pass, nt, wt) {
        if (pass < nt) {
            return 0;
        }else {
            let left = pass - nt;
            return Math.floor (left  / wt) + 1;
        }
    }

    setWorkDataAtProduceEnd (workData, shouldKickOut) {
        let kickOutHeroId = 0
        workData.st = 0;
        workData.nt = 0;
        workData.wcount = 0;
        workData.wt = 0;
        workData.fid = 0
        workData.wenergy = 0;
        if (shouldKickOut){
            kickOutHeroId = workData.hid;
            workData.hid = 0;
        }
        return kickOutHeroId;
    }

    // 单个队列指定时间更新
    async doWorkProgressGridUpdate (timeStamp, workData, shouldKickOut) {
        return new Promise (resolve => {
            let pass = timeStamp - workData.st;
            let completeCount = this.calcFormulaCompleteTimes (pass, workData.nt, workData.wt);
            if (completeCount <= 0) {
                resolve ({complete:0, grid:workData.grid});
            }else {
                let waitComplete = completeCount - 1;
                if (workData.wcount < waitComplete) waitComplete = workData.wcount;
                //生产道具奖励
                let totalItemCount = 0, kickOutHeroId = 0;
                for (let i = 0; i <= waitComplete; i++) {
                    let seed = utils.getRandom(10000), extItemCount = 0, buffVal = 0;
                    if (workData.skillBuff != null && workData.skillBuff[skillController.EFFECTRESULTTYPE().EXTRAPRODUCE] != null) {
                        buffVal = workData.skillBuff[skillController.EFFECTRESULTTYPE().EXTRAPRODUCE].value;
                        console.log("extra produce ", buffVal)
                        if (buffVal > 0 && seed <= buffVal) extItemCount = 1;
                    }
                    let addCount = (1 + extItemCount);
                    totalItemCount += addCount;
                    workData.itemCount += addCount;
                }

                if (workData.wcount !== waitComplete) {
                    workData.st = workData.st + workData.nt + workData.wt * waitComplete;
                    workData.wcount -= (waitComplete + 1);
                    workData.nt = workData.wt;
                }else {
                    workData.status = WorkController.GRIDSTATS().NOTEMPTY;
                    kickOutHeroId = this.setWorkDataAtProduceEnd (workData, shouldKickOut);
                }
                resolve ({complete: waitComplete + 1, totalItem:totalItemCount, grid:workData.grid, kickHero: kickOutHeroId})
            }
        });
    }

    // 通过指定时间对队列进行加速
    async doWorkProgressbySpeedUpTime (speedUpTime, workData) {
        return new Promise (resolve => {
            let curTimeStamp = utils.getTime ()
            let pass = curTimeStamp - workData.st;
            let completeCount = this.calcFormulaCompleteTimes (speedUpTime + pass, workData.nt, workData.wt);
            console.log("completeCount", completeCount)
            if (completeCount <= 0) {
                workData.st -= speedUpTime;
                resolve ({complete:0, grid:workData.grid});
            }else {
                let waitComplete = completeCount - 1;
                if (workData.wcount < waitComplete) waitComplete = workData.wcount;

                //生产道具奖励
                let totalItemCount = 0;
                let isGridWorkEnd = false;
                let kickOutHeroId = 0;

                for (let i = 0; i <= waitComplete; i++) {
                    let seed = utils.getRandom(10000), extItemCount = 0, buffVal = 0;
                    if (workData.skillBuff != null && workData.skillBuff[skillController.EFFECTRESULTTYPE().EXTRAPRODUCE] != null) {
                        buffVal = workData.skillBuff[skillController.EFFECTRESULTTYPE().EXTRAPRODUCE].value;
                        console.log("extra produce", buffVal)
                        if (buffVal > 0 && seed <= buffVal) extItemCount = 1;
                    }
                    totalItemCount += (1 + extItemCount);
                    workData.itemCount += (1 + extItemCount);
                }

                if (workData.wcount !== waitComplete) {
                    let curTimeStamp = utils.getTime ();
                    let leftTime = (speedUpTime - (workData.nt - pass)) - workData.wt * waitComplete;
                    assert (leftTime >= 0, "need check the time");
                    workData.st =  curTimeStamp - leftTime;
                    workData.wcount -= (waitComplete + 1);
                    workData.nt = workData.wt;
                }else {
                    workData.status = WorkController.GRIDSTATS().NOTEMPTY;
                    isGridWorkEnd = true;
                    this.setWorkDataAtProduceEnd (workData, false);
                }
                resolve ({complete: waitComplete + 1, totalItem:totalItemCount, grid:workData.grid, kickHero: kickOutHeroId, gridEnd:isGridWorkEnd})
            }
        });
    }

    async doWorkProgressUpdate (heroPtr, bid, timeStamp, workList, completeData, shouldKickOut)
    {
        let workInfo = [];
        let totalCheckWorkCount = 0;
        for (let i in workList) {
            let workData = workList[i];
            if (workData.status === WorkController.GRIDSTATS().WORKING) {
                totalCheckWorkCount += 1;
                let pass = timeStamp - workData.st;
                let time = workData.nt + workData.wcount * workData.wt;
                if (pass >= time) workInfo.push ({grid:workData.grid, time:time});
            }
        }

        // 没有任何一个队列全部完成 后者全部队列都已经完成 直接走时间进度
        if (workInfo.length <= 0 || workInfo.length === totalCheckWorkCount) {
            for (let i in workList) {
                if (workList[i].status === WorkController.GRIDSTATS().WORKING) {
                    let complete = await this.doWorkProgressGridUpdate (timeStamp, workList[i], shouldKickOut)
                    completeData.push (complete);
                }else if (workList[i].status === WorkController.GRIDSTATS().NOTEMPTY
                    || workList[i].status === WorkController.GRIDSTATS().LOCK) {
                    let kickOutHeroId = this.setWorkDataAtProduceEnd (workList[i], shouldKickOut);
                    completeData.push ({grid:workList[i].grid, kickHero: kickOutHeroId});
                }
            }
            return 0;
        }else {
            let fastestCompleteGrid = -1;
            let minTime = 0;
            for (let i in workInfo) {
                if (minTime === 0 || minTime > workInfo[i].time) {
                    minTime = workInfo[i].time;
                    fastestCompleteGrid = workInfo[i].grid;
                }
            }
            assert (fastestCompleteGrid !== -1, "fastest completed grid should not be -1")
            for (let i in workList) {
                if (workList[i].grid === fastestCompleteGrid) {
                    let complete = await this.doWorkProgressGridUpdate (timeStamp, workList[i], shouldKickOut);
                    completeData.push (complete);
                    break;
                }
            }

            let calcSkillResult = await this.calcWorkListSkillInfoByHeroAndFormula (heroPtr, bid, workList);
            for (let i in workList) {
                workList[i] = await this.updateNewFormulaProduceWork (workList[i], calcSkillResult, -1);
            }
            return await this.doWorkProgressUpdate (heroPtr, bid, timeStamp, workList, completeData, shouldKickOut)
        }
    }

    async doWorkProgressUpdateAll (clsHero, bid, layer) {
        return new Promise (resolve => {
            let curTimeStamp = utils.getTime ()
            let shouldKickOut = bid === 0 || layer !== bid
            let workCompletedFormula = [];
            let kickOutHero = [];
            let buildings = [];
            this.getWorkDataFromSource(async doc => {
                if (doc && doc.buildings) {
                    for (let i in doc.buildings) {
                        let building = doc.buildings[i];
                        if (building.status == WorkController.BUILDINGSTATS().REPAIRED && (bid === 0 || building.bid == bid)) {
                            let workCompleted = [];
                            await this.doWorkProgressUpdate (clsHero, building.bid, curTimeStamp, building.workList, workCompleted, shouldKickOut)
                            for (let wcd of workCompleted) {
                                if (wcd.complete != null && wcd.totalItem != null) {
                                    workCompletedFormula.push({
                                        complete: wcd.complete,
                                        totalItem: wcd.totalItem,
                                        grid: wcd.grid,
                                        bid: building.bid
                                    });
                                }
                                if (wcd.kickHero != null && wcd.kickHero > 0) {
                                    kickOutHero.push({kickHero: wcd.kickHero, grid: wcd.grid});
                                }
                            }
                            buildings.push (building);
                        }
                    }
                }

                this.saveWorkDataFromSource(doc, _ => {
                    resolve ({workCompletedFormula:workCompletedFormula, kickOutHero:kickOutHero,buildings:buildings});
                });
            });
        });
    }

    async revokeBuildingWorkGrid (clsHero, bid, grid, heroId) {
        return new Promise (async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            let workList = workData.workList;
            let energy = 0, leftCount = 0;

            let revokeSuccess = false
            for (let i in workList) {
                let work = workList[i];
                if (work.grid === grid && work.status === WorkController.GRIDSTATS().WORKING) {
                    energy = work.wenergy;
                    if (work.st !== 0 && work.nt !== 0) leftCount += 1;
                    leftCount += work.wcount;
                    revokeSuccess = true
                    this.setWorkDataAtProduceEnd (work, false);
                    if (work.itemCount <= 0) {
                        work.status = WorkController.GRIDSTATS().UNLOCK;
                    }else {
                        work.status = WorkController.GRIDSTATS().NOTEMPTY;
                    }
                }
            }

            if (revokeSuccess) {
                let calcSkillResult = await this.calcWorkListSkillInfoByHeroAndFormula (clsHero, bid, workList);
                for (let i in workList) {
                    workList[i] = await this.updateNewFormulaProduceWork (workList[i], calcSkillResult, -1);
                }
                await this.saveTargetBuildingWorkData (bid, workData);
                resolve ({status:0, hid:heroId, energy:energy, leftCount:leftCount, workList:workList});
            }else {
                resolve ({status:1});
            }
        });
    }

    // 给当前队列加速指定时间 全部完成需要先计算出加速的时间
    async speedUpBuildingWorkGrid (clsHero, bid, grid, speedtime) {
        let workData = await this.getTargetBuildingWorkData (bid);
        let workList = workData.workList;
        let speedUpResult = {};
        for (let i in workList) {
            if (workList[i].grid === grid) {
                speedUpResult = await this.doWorkProgressbySpeedUpTime (speedtime, workList[i]);
                break;
            }
        }

        if (speedUpResult != null && speedUpResult.gridEnd) {
            let calcSkillResult = await this.calcWorkListSkillInfoByHeroAndFormula (clsHero, bid, workList);
            for (let i in workList) {
                workList[i] = await this.updateNewFormulaProduceWork (workList[i], calcSkillResult, -1);
            }
            speedUpResult.workList = workList;
        }else {
            speedUpResult.workList = [];
            for (let i in workList) {
                if (workList[i].grid === grid) {
                    speedUpResult.workList.push (workList[i]);
                }
            }
        }
        await this.saveTargetBuildingWorkData (bid, workData);
        return  speedUpResult;
    }

    _getFormulaList(map, bid, blevel) {
        var formulaList = [];
        if (blevel === 0)
            return formulaList;
        for (let [id, node] of map) {
            if (node.buildingId === bid && node.level <= blevel) {
                formulaList = formulaList.concat(node.formulaList);
            }
        }
        return formulaList;
    }

    /**
     * collectItemByGridGroup - 根据格子位置列表收取产物
     * @param {*} bid
     * @param {*} gridGroup
     */
    async collectItemByGridGroup(bid, gridGroup) {
        return new Promise (async resolve => {
            if (gridGroup.length === 0) {
                resolve ({retCode:-2});
            }else {
                let workData = await this.getTargetBuildingWorkData (bid);
                let updatedWorkList = [];
                if (workData == null) {
                    resolve ({retCode:-1});
                }else {
                    let ret = 0, addItems = [], workList = workData.workList, produceList = [];
                    for (let grid of gridGroup) {
                        for (let i in workList) {
                            if (workList[i].grid === grid) {
                                if (workList[i].status === WorkController.GRIDSTATS ().LOCK || workList[i].itemId === 0) {
                                    // 格子未开启或没有物品（客户端参数问题）
                                    // DO NOTHING.
                                } else {
                                    if (workList[i].itemCount > 0 && workList[i].itemId !== 0) {
                                        addItems.push({id: workList[i].itemId, count: workList[i].itemCount});
                                        produceList.push( {hid:workList[i].hid, itemId: workList[i].itemId, count:workList[i].itemCount });
                                    }
                                    workList[i].itemCount = 0;
                                    if (workList[i].status == WorkController.GRIDSTATS ().NOTEMPTY) {
                                        workList[i].status = WorkController.GRIDSTATS ().UNLOCK;
                                        workList[i].itemId = 0;
                                    }
                                    updatedWorkList.push (workList[i]);
                                }
                            }
                        }
                    }

                    if (ret === 0 && addItems.length > 0) {
                        workData.workList = workList;
                        await this.saveTargetBuildingWorkData (bid, workData);
                        resolve ({retCode:ret, addItems:addItems, workList:updatedWorkList, produceList})
                    } else {
                        resolve ({retCode:ret});
                    }
                }
            }
        });
    }


    // 释放主动技能获取削减时间
    async getInitiativeSkillEffectTime(clsHero, heroId, skillId, bid, workData) {
        return new Promise (async resolve => {
            let heroIdAndWorkInfo = await this.getHeroIdAndFormulaGroupByWorkList(bid, workData);
            let heroWorkInfoGroup = heroIdAndWorkInfo.heroWorkInfoGroup;
            let sysType = skillController.EFFECTSYS().PRODUCE;
            let heroIdGroup = heroIdAndWorkInfo.heroIdGroup;
            let calcActiveSkillEffects = await skillController.checkHeroActiveSkillEffectBySkillId(clsHero, sysType, skillId, heroIdGroup, heroWorkInfoGroup);
            let subNeedTimeTotal = 0;
            if (calcActiveSkillEffects.effBuffData !== null) {
                if (calcActiveSkillEffects.effBuffData[skillController.EFFECTRESULTTYPE().SPEEDPRODUCETIME] != null) {
                    let speedUpTime = calcActiveSkillEffects.effBuffData[skillController.EFFECTRESULTTYPE().SPEEDPRODUCETIME].value / 1000;
                    console.log("active skill speed time", speedUpTime)
                    if (speedUpTime != null) {
                        subNeedTimeTotal += speedUpTime;
                    }
                }
            }
            resolve(subNeedTimeTotal);
        });
    }

    /**
     * doWorkingCastSkill- 进行主动技能操作
     * @param {*} uuid
     * @param {*} bid
     * @param {*} ts
     * @param {*} callback
     */
    async doWorkingCastSkill(clsHero, bid, grid, heroId, skillId) {
        return new Promise (async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            let workList = workData.workList;
            let speedUpResult = {};
            speedUpResult.reduceSkillCdTime = 0;

            for (let i in workList) {
                if (workList[i].grid === grid && workList[i].hid === heroId) {
                    let skillEffectTime = await this.getInitiativeSkillEffectTime (clsHero, heroId, skillId, bid, workList);
                    let heroIdAndWorkInfo = await this.getHeroIdAndFormulaGroupByWorkList(bid, workList);
                    let heroWorkInfoGroup = heroIdAndWorkInfo.heroWorkInfoGroup;
                    let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().PRODUCE, heroId, heroWorkInfoGroup[heroId]);
                    if (skillEffectData.effBuffData != null) {
                        let addSkillEffectTime = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDACTIVESKILLTIME];
                        if (addSkillEffectTime != null && addSkillEffectTime.value != null) {
                            skillEffectTime = skillEffectTime + addSkillEffectTime.value / 1000
                            console.log("---- skill active add skill effect time ", heroId, addSkillEffectTime.value / 1000)
                        }
                    }

                    speedUpResult = await this.doWorkProgressbySpeedUpTime (skillEffectTime * 1000, workList[i]);
                    speedUpResult.reduceSkillCdTime = 0;
                    if (skillEffectData.effBuffData != null) {
                        let reduceCDTime = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().REDUCEACTIVESKILLCD];
                        if (reduceCDTime != null && reduceCDTime.value != null) {
                            speedUpResult.reduceSkillCdTime = reduceCDTime.value
                            console.log("---- skill active reduce skill cd time ", heroId, speedUpResult.reduceSkillCdTime)
                        }
                    }
                    break;
                }
            }

            if (speedUpResult != null && speedUpResult.gridEnd) {
                let calcSkillResult = await this.calcWorkListSkillInfoByHeroAndFormula (clsHero, bid, workList);
                for (let i in workList) {
                    workList[i] = await this.updateNewFormulaProduceWork (workList[i], calcSkillResult, -1);
                }
                speedUpResult.workList = workList;
            }else {
                speedUpResult.workList = [];
                for (let i in workList) {
                    if (workList[i].grid === grid && workList[i].hid === heroId) {
                        speedUpResult.workList.push (workList[i]);
                    }
                }
            }
            await this.saveTargetBuildingWorkData (bid, workData);
            resolve (speedUpResult);
        });
    }

    // 退出界面刷新墨魂状态
    async exitWorkOutRefreshHeroList (bid) {
        return new Promise (async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            let newWorkList = [];
            let kickIdleHeroList = [];
            for (let i in workData.workList) {
                if (workData.workList[i].status !== WorkController.GRIDSTATS().WORKING && workData.workList[i].hid != 0) {
                    kickIdleHeroList.push (workData.workList[i].hid);
                    workData.workList[i].hid = 0;
                    newWorkList.push (workData.workList[i]);
                }
            }
            if (kickIdleHeroList.length <= 0) {
                resolve ({kickIdleHeroList:kickIdleHeroList});
            }else {
                await this.saveTargetBuildingWorkData (bid, workData);
                resolve ({kickIdleHeroList:kickIdleHeroList, workList:newWorkList});
            }
        });
    }

    async getWorkingGridNeedTimeToCostDiamond(bid, grid) {
        return new Promise (async resolve => {
            let workData = await this.getTargetBuildingWorkData (bid);
            let workList = workData.workList;
            let costDiamond = 0;
            let leftTime = 0;
            for (let i in workList) {
                let work = workList[i];
                if (work.grid === grid && work.status == WorkController.GRIDSTATS ().WORKING) {
                    leftTime = (work.nt - (utils.getTime () - work.st)) + work.wt * work.wcount;
                    costDiamond = utils.GetSpeedUpCostByLeftTime (leftTime / 1000);
                    break;
                }
            }
            resolve ({leftTime:leftTime, costDiamond:costDiamond});
        });
    }

    // 墨魂体力验证及处理逻辑
    addFastWorkCastSkillPoint(clsHero, heroId, skillId, callback) {
        hero.getAttrs (attrs => {
            if (attrs != null) {
                fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, attrs.level, HeroAttrLimitObj => {
                    Defaults.getDefaultValueConfig(Defaults.DEFAULTS_VALS().SKILLEXP2, SkillExp => {
                        // 获取技能所需的体力值
                        Skills.getSkillCostValByTypeConfig(skillId, 0, SkillNeedEnergy => {
                            if (attrs.skillpoint === undefined) {
                                attrs.skillpoint = 0;
                            }
                            var addSkillPointVal = Math.floor(SkillNeedEnergy * (SkillExp / 100)),
                                skillPointExpMax = HeroAttrLimitObj.skillpoint[1]; // [min, max]
                            if ((attrs.skillpoint + addSkillPointVal) > skillPointExpMax) {
                                attrs.skillpoint = skillPointExpMax;
                            } else {
                                attrs.skillpoint += addSkillPointVal;
                            }
                        });
                    });
                });
            }else {
                callback (null);
            }
        });
    }
}

module.exports = WorkController;
