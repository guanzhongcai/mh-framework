const _ = require('lodash')
const TaskTriggerTblName = 'TaskTriggerData'
const TaskFinishTblName = 'TaskListData'
const MainChapterTaskConfig = require('./../../designdata/MainChapterTask');
const models = require('../models')
const TRIGGER_CONDITION_NUM = 3
const Tasks = require('./../../designdata/Tasks');
const DailyTasks = null;
const AchievementSCores = 'AchievementSCores';
const AchievementHash = 'AchievementHash';
const TaskDailyRefresh = 'TaskDailyRefresh';
const RefreshData = 'RefreshData';
const OpenTaskList = 'OpenTaskList';
const Utils = require('./../../common/utils');

// const {parserConditionParams} = require('./taskController')
const CONSTANTS = require('./../../common/constants');
function TASK_TYPES() {
    return {
        FAST: 3 // 紧急任务
    }
}





// 周期类型
function CYCLE_TYPES() {
    return {
        NONE: 0,        // 没有周期
        DAY: 1,         // 每天
        WEEK: 2,        // 每周
        MONTH: 3,       // 每月
        YEAR: 4,        // 每年
        FOREVER: 5,     // 永久
    }
}

function TASK_STATS() {
    return {
        NORMAL: 0,      // 未完成
        COMPLETE: 1,    // 已完成
        REWARDED: 2,    // 已领取
        EXPIRED: 3,     // 已过期
    }
}

class Task {
    constructor(redis_client) {
        this.redisHelper = redis_client
        this.taskRedisData = {};
        this.actPoints = {};
        this.countData = null;
        this.tChangeList = {};
        this.tRewardId = null;
        this.cChangeObj = {};
        this.chapterOpen = [];
        this.aRewardData = [];
        this.achievementScores = null;
        this.AchievementHash = null;
        this.OpenTaskList = [];
        this.OpenMainId = null;
    }
    
    addChapter(tasks){
        this.chapterOpen.push(...tasks);
        
    }
    
    setAchievementRewardId(...rewardData){
        this.aRewardData = [...rewardData]
    }
    
    
    /**
     *
     * @param uuid
     * @param taskId
     * @returns {Promise<boolean>}
     */
    //判断主线是否开启
    async isOpenTasks(uuid,taskId){
        this.OpenTaskList = await this.getOpenTasks(uuid, OpenTaskList)
        let isOpened = false;
        for (const i of this.OpenTaskList) {
            if(Number(i.tid) === Number(taskId)){
                isOpened = true;
            }
        }
        return isOpened;
    }
    
    /**
     *
     * @param uuid
     * @returns {Promise<[]>}
     */
    //获取主线详情
    async getOpenTasks(uuid){
        this.OpenTaskList = await this.getOpenTaskList(uuid, OpenTaskList)
        return this.OpenTaskList;
    }
    
    /**
     *
     * @param uuid
     * @returns {Promise<*[]|any>}
     */
    async getOpenTaskList(uuid){
        try {
            let openTaskList = await this.redisHelper.getOpenTaskList(uuid, OpenTaskList)
            if(openTaskList){
                return JSON.parse(openTaskList)
            }else {
                return []
            }
        }catch (e) {
            console.log(e)
        }
    }
    
    
    /**
     * 设置添加主线剧情
     * @param uuid
     * @param openTaskList
     * @returns {Promise<void>}
     */
    async setOpenTaskList(uuid, openTaskList){
        try {
            await this.redisHelper.setOpenTaskList(uuid, OpenTaskList, JSON.stringify(openTaskList))
        }catch (e) {
            console.log(e)
        }
    }
    
    
    /**
     * 任务初始化
     * @param uuid
     * @param times
     * @returns {Promise<void>}
     */
    async initTask(uuid, times)
    {
        // 任务初始化
        let TASK_DATA = global.FIX_INIT_TASKDATA
        let cacheData = {};
        for (const i in TASK_DATA) {
            let taskStr = JSON.stringify(TASK_DATA[i]);
            cacheData[i] = taskStr;
            this.taskRedisData[i] = JSON.parse(taskStr);
        }
    
        await this.setDailyTaskRefreshTime(uuid);
        await this.redisHelper.taskSet(uuid, TaskFinishTblName, cacheData)
    }
    
    
    /**
     * 检查任务初始化
     * @param uuid
     * @param time
     * @returns {Promise<boolean>}
     */
    async checkTaskInit(uuid,time){
        let hasData =  await this.taskCheck(uuid);
        if(!hasData){
            await this.initTask(uuid, time)
        }
        return true;
    }
    
    /**
     * 判断任务数据数据是否存在
     * @param uuid
     * @returns {Promise<*>}
     */
    async taskCheck(uuid)
    {
       return await this.redisHelper.taskCheck(uuid,TaskFinishTblName)
    }
    
    
    /**
     * 批量提前任务数据 taskList
     * @param uuid
     * @returns {Promise<*>}
     */
    async getTaskListData(uuid)
    {
        return await this.redisHelper.hgetall(uuid,TaskFinishTblName)
    }
    
    
    /**
     * 批量提取任务统计数据
     * @param uuid
     * @returns {Promise<*>}
     */
    async getTaskCountData(uuid)
    {
        return await this.redisHelper.hgetall(uuid, TaskTriggerTblName)
    }
    
    
    /**
     * 根据id提取统计数据
     * @param uuid
     * @param actId
     * @returns {Promise<*[]|*>}
     */
    async getCountDataById(uuid, actId){
        try {
            if(this.countData[actId]){
                return this.countData[actId];
            }else {
                let cData =  await this.redisHelper.taskGetData(uuid, TaskTriggerTblName,actId)
                if(_.isEmpty(cData)){
                    return [];
                }else {
                    this.countData[actId] = cData[actId];
                    return cData[actId];
                }
            }
        }catch (e) {
            console.log(e)
        }

    }
    
    /**
     * 任务actionPoint format
     * @param arr
     * @returns {*}
     */
    fill(arr)
    {
        if(arr.params.length < 2){
            arr.params.push(0)
        }
        if(typeof arr.num === 'undefined'){
            arr.num = 1;
        }
        if(typeof arr.add === 'undefined'){
            arr.add = true;
        }
        return arr
    }
    
    
    /**
     * 添加 action 枚举 与触发详情
     * @param type
     * @param actions
     */
    addPointObj(type,actions){
        for(let i of actions){
            this.fill(i)
        }
        if(this.actPoints[type]){
            this.actPoints[type].push(...actions);
        }
        else {
            this.actPoints[type] = [];
            this.actPoints[type] = [...actions];
        }
    }
    
    
 
    countDataUpdate(){
    
        if(_.isEmpty(this.actPoints)){
            return [];
        }
        
        let data = this.actPoints;
        let  countData = this.countData;
        let dataChange = {}
        for (const key in data) {
            dataChange[key] = {}
            if(!countData[key]){
                countData[key] = [];
            }
            for (let i = 0; i < data[key].length; i++) {
                let dItem = data[key][i];
                let dIdx = dItem.params.join("-");
                let found = false;
                for (let k = 0; k < countData[key].length; k++) {
                    let cItem = countData[key][k];
                    let cIdx =  cItem.ids.join("-");
                    if(dIdx === cIdx){
                        if(dItem.add){
                            countData[key][k].num +=  dItem.num
                        }else{
                            countData[key][k].num =  dItem.num
                        }
                        found = true;
                        dataChange[key][dIdx] = countData[key][k];
                    }
                }
                if(!found){
                    let newData = {ids:dItem.params,num:dItem.num}
                    countData[key].push(newData);
                    dataChange[key][dIdx] = newData;
                }
            }
        }
        return {dataChange};
    }
    
    
    async taskUpdate(uuid){
        try {
            if(_.isEmpty(this.actPoints)){
                return {taskList:[],taskEventData:[]}
            }else {
                await this.addMultiCounter(uuid)
                let taskList = this.adjustTaskList(this.tChangeList);
                let achievementScores = this.adjustAchievementList();
                return {taskList, achievementScores , taskEventData : this.cChangeObj,openTask: this.OpenTaskList }
            }
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }

    }
    
    
    
    async taskChange(uuid){
        try {
            let data = this.actPoints;
            await Promise.all(Object.keys(data).map(async element =>{
                await this.doTaskChange(uuid, Number(element), data[element])
            }))
            return ;
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }

    }
    
    
    async doTaskChange(uuid, key, countData)
    {
        try {
            let tasks = global.FIX_TASK.finishMap[key]||[];
            let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon(tasks)
            return await Promise.all(tasks.map(async taskId=>{
                let TaskConfig = TasksObjConfig[taskId];
                let taskNode = {};
                if(this.taskRedisData[taskId]){
                    taskNode = this.taskRedisData[taskId];
                }else {
                    let cacheTask = await this.getFromCacheOrRedis(uuid,taskId);
                    taskNode = cacheTask[taskId];
                    this.taskRedisData[taskId] = cacheTask[taskId];
                }
                
                if(!_.isEmpty(taskNode)){
                    //TODO 周期任务重置
                    if(taskNode.status === CONSTANTS.TASK_STATUS.NORMAL){
                        if (!taskNode.cntFlag) {
                            taskNode.finCntObj =  this.doFinObjUpdate(taskNode.finCntObj, countData, TaskConfig, key);
                        }
                        let  isSkip = false;
                        [isSkip, taskNode] = this.doTaskByDate(taskNode, TaskConfig);
                        if(!isSkip){
                            this.doTaskByFinish(taskNode, TasksObjConfig, TaskConfig, (TaskConfig.TriggerCounterFlag === 1) ? this.countData : taskNode.finCntObj);
                        }
                    }
                    
                }
            }));
            
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }
    }
    
    
    
    async taskComplete(uuid){
        try {
            let taskNode = this.taskRedisData[this.tRewardId];
            let TaskCof = Tasks.getTaskConfigById(this.tRewardId)
            if(TaskCof.CycleCompleteCount > 1 && TaskCof.CycleCompleteCount !== taskNode.cycleCount && taskNode.status === CONSTANTS.TASK_STATUS.COMPLETE){
                for (const item of taskNode.progress) {
                    item.count = 0;
                }
                taskNode.finCntObj ={};
                taskNode.cycleCount++;
                taskNode.status = CONSTANTS.TASK_STATUS.NORMAL;
            }
            return ;
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }
        
    }
    
    

    
    // 处理完成计数
    doTaskByFinish(taskNode, TasksObjConfig, TaskConfig, countData) {
        var oldProgress = JSON.parse(JSON.stringify(taskNode.progress));
        let isChange = false;
        if (taskNode.status === CONSTANTS.TASK_STATUS.NORMAL) {
            // 未完成的任务才需要处理
            const ConditionLis = {
                Condition1: TaskConfig.FinishCondition1,
                Condition2: TaskConfig.FinishCondition2,
                Condition3: TaskConfig.FinishCondition3
            }
            let counter = 0;
            taskNode.progress = [];
            let realTasks = 0;
            for (let i = 1; i <= 3; i++) {
                if(ConditionLis['Condition' + i].length){
                    realTasks++;
                    var ConditionConfig = ConditionLis['Condition' + i], success, progressLis = [];
                    [success, progressLis] = this.parserConditionParams(ConditionConfig, countData);
                    // 更新任务的progress
                    taskNode.progress = taskNode.progress.concat(progressLis);
                    if (success) ++counter;
                }
                
            }
            
            
            if (counter === realTasks) {
                //条件都达成，将任务状态设置未完成
                isChange = true;
                taskNode.status = CONSTANTS.TASK_STATUS.COMPLETE;
            }
        }
        
        taskNode = this.dealTaskGroupWithFinish(taskNode, TasksObjConfig, TaskConfig);
        
        // 判断任务的前后progress数据是否一致
        if (!this.checkProgressEqual(oldProgress,taskNode.progress)) {
            // 任务前后progress不一致（说明有变化）
            this.tChangeList[taskNode.taskId] = taskNode;
            this.taskRedisData[taskNode.taskId] = taskNode;
        }
        
        if(isChange){
            this.tChangeList[taskNode.taskId] = taskNode;
            this.taskRedisData[taskNode.taskId] = taskNode;
        }
    }
    
    
    doFinObjUpdate(newCountData, countData, TaskConfig){
        try {
            for (let i =1,len = 3; i <= len; i++){
                let finishKey = `FinishCondition${i}`;
                if(TaskConfig[finishKey].length){
                    let actKey = TaskConfig[finishKey][0];
                    if(Array.isArray(TaskConfig[finishKey][1])){
                        //[1,[4444,7],N]
                        if(TaskConfig[finishKey][1][0]){
                            for (let j = 0; j < countData.length; j++) {
                                if(countData[j].params[0] === TaskConfig[finishKey][1][0]){
                                    if(newCountData[actKey]){
                                        let ifFound = false;
                                        for (let k = 0; k < newCountData[actKey].length; k++) {
                                            if(newCountData[actKey][k].ids[0] === countData[j].params[0]){
                                                if(countData[j].add){
                                                    newCountData[actKey][k].num += countData[j].num;
                                                }else {
                                                    newCountData[actKey][k].num = countData[j].num;
                                                }
                                                ifFound = true;
                                            }
                                        }
                                        if(!ifFound){
                                            newCountData[actKey].push({
                                                ids:[countData[j].params[0],countData[j].params[1]],
                                                num :countData[j].num
                                            })
                                        }
                                    }else {
                                        newCountData[actKey] = [{
                                            ids:[countData[j].params[0],countData[j].params[1]],
                                            num :countData[j].num
                                        }]
                                        
                                    }
                                }
                            }
                        }else{
                            //[1,[0,7],N]
                            if(TaskConfig[finishKey][1][1]){
                                for (let j = 0; j < countData.length; j++) {
                                    if(countData[j].params[1] === TaskConfig[finishKey][1][1]){
                                        if(newCountData[actKey]){
                                            let ifFound = false;
                                            for (let k = 0; k < newCountData[actKey].length; k++) {
                                                if(newCountData[actKey][k].ids[0] === countData[j].params[0]){
                                                    if(countData[j].add){
                                                        newCountData[actKey][k].num += countData[j].num;
                                                    }else {
                                                        newCountData[actKey][k].num = countData[j].num;
                                                    }
                                                    ifFound = true;
                                                }
                                            }
                                            if(!ifFound){
                                                newCountData[actKey].push({
                                                    ids:[countData[j].params[0],countData[j].params[1]],
                                                    num :countData[j].num
                                                })
                                            }
                                        }else {
                                            newCountData[actKey] = [{
                                                ids:[countData[j].params[0],countData[j].params[1]],
                                                num :countData[j].num
                                            }]
                                        }
                                    }
                                }
                            }
                            else {
                                //[1,[0,0],N]
                                for (let j = 0; j < countData.length; j++) {
                                    if(TaskConfig[finishKey][1][1] === 0){
                                        if(newCountData[actKey]){
                                            let ifFound = false;
                                            for (let k = 0; k < newCountData[actKey].length; k++) {
                                                if(newCountData[actKey][k].ids[0] === countData[j].params[0]){
                                                    if(countData[j].add){
                                                        newCountData[actKey][k].num += countData[j].num;
                                                    }else {
                                                        newCountData[actKey][k].num = countData[j].num;
                                                    }
                                                    ifFound = true;
                                                }
                                            }
                                            if(!ifFound){
                                                newCountData[actKey].push({
                                                    ids:[countData[j].params[0],countData[j].params[1]],
                                                    num :countData[j].num
                                                })
                                            }
                                        }else {
                                            newCountData[actKey] = [{
                                                ids:[countData[j].params[0],countData[j].params[1]],
                                                num :countData[j].num
                                            }]
                                        }
                                    }
                                }
                                
                            }
                            

                        }
                    }else {
                        //[4,4444,N]
                        if(TaskConfig[finishKey][1]){
                            for (let j = 0; j < countData.length; j++) {
                                if(countData[j].params[0] === TaskConfig[finishKey][1]){
                                    if(newCountData[actKey]){
                                        let ifFound = false;
                                        for (let k = 0; k < newCountData[actKey].length; k++) {
                                            if(newCountData[actKey][k].ids[0] === countData[j].params[0]){
                                                if(countData[j].add){
                                                    newCountData[actKey][k].num += countData[j].num;
                                                }else {
                                                    newCountData[actKey][k].num = countData[j].num;
                                                }
                                                ifFound = true;
                                            }
                                        }
                                        if(!ifFound){
                                            newCountData[actKey].push({
                                                ids:[countData[j].params[0],countData[j].params[1]],
                                                num :countData[j].num
                                            })
                                        }
                                    }else {
                                        newCountData[actKey] = [{
                                            ids:[countData[j].params[0],countData[j].params[1]],
                                            num :countData[j].num
                                        }]
                                    }
                                }
                            }
                        }else {
                            //[5,0,N]
                            for (let j = 0; j < countData.length; j++) {
                                if (newCountData[actKey]) {
                                    let ifFound = false;
                                    for (let k = 0; k < newCountData[actKey].length; k++) {
                                        if (newCountData[actKey][k].ids[0] === countData[j].params[0]) {
                                            if (countData[j].add) {
                                                newCountData[actKey][k].num += countData[j].num;
                                            } else {
                                                newCountData[actKey][k].num = countData[j].num;
                                            }
                                            ifFound = true;
                                        }
                                    }
                                    if (!ifFound) {
                                        newCountData[actKey].push({
                                            ids: [countData[j].params[0], countData[j].params[1]],
                                            num: countData[j].num
                                        })
                                    }
                                } else {
                                    newCountData[actKey] = [{
                                        ids: [countData[j].params[0], countData[j].params[1]],
                                        num: countData[j].num
                                    }]
                                }
                            }
                        }
                    }
                }
            }
            return newCountData;
        }catch (e) {
            console.log(e)
        }
    }
    
    
    
    async taskTrigger(uuid){
        try {
            let data = this.actPoints;
            return await Promise.all(Object.keys(data).map(async element =>{
                await this.triggerTaskByAct(uuid, element, data[element])
            }))
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }
    
    }
    
    async triggerTaskByAct(uuid , actKey){
        try {
            if(global.FIX_TASK.triggerMap[actKey]){
                let taskList = global.FIX_TASK.triggerMap[actKey];
                await this.tasksTrigger(uuid, taskList)
            }
            return true;
        }catch (e) {
            console.log(e)
        }
    }
    
    async tasksTrigger(uuid, taskList ){
        try {
            let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon(taskList)
            return await Promise.all(taskList.map(async taskId=>{
                let taskNode = await this.getFromCacheOrRedis(uuid,taskId)
                if(_.isEmpty(taskNode)){
                    let TaskConfig = TasksObjConfig[taskId];
                    let triggerSet = 0;
                    for (let i = 1; i <= TRIGGER_CONDITION_NUM ; i++) {
                        let key = `TriggerCondition${i}`;
                        if(TaskConfig[key].length){
                            if(this.countData[TaskConfig[key][0]]){
                                let cData = this.countData[TaskConfig[key][0]];
                                for (let j = 0; j < cData.length; j++) {
                                    if(TaskConfig[key][1] === 0){
                                        if(cData[j].num >= TaskConfig[key][2]){
                                            triggerSet++;
                                        }
                                    }else {
                                        if(cData[j].ids[0] === TaskConfig[key][1]){
                                            triggerSet++;
                                        }
                                    }
                                }
                            }
                        }else {
                            triggerSet++;
                        }
                    }
                    if(triggerSet === TRIGGER_CONDITION_NUM){
                        taskNode = models.TaskNodeModel(taskId, null);
                        taskNode.cntFlag = (TaskConfig.TriggerCounterFlag === 1);
                        let isSkip = false;
                        [isSkip, taskNode] = this.doTaskByDate(taskNode, TaskConfig);
                        if(!isSkip){
                            this.taskRedisData[taskNode.taskId] = taskNode;
                            this.doTaskByFinish(taskNode, TasksObjConfig, TaskConfig, (TaskConfig.TriggerCounterFlag === 1) ? this.countData : taskNode.finCntObj);
                        }
                    }
                }
            }))
        }catch (e) {
            console.log(e)
        }
    }
    
    
    async mainTaskTrigger(uuid){
        try {
            this.OpenTaskList = await this.getOpenTasks(uuid)
            let mainId = this.chapterOpen[0];
            var chapId = MainChapterTaskConfig.getChapterId(mainId), newNode = null;
            if (chapId > 0) {
                newNode = {
                    cid: chapId,
                    tid: mainId,
                    st: new Date().getTime()
                };
                this.OpenTaskList.push(newNode);
            }
            
            let taskList  = this.chapterOpen.reverse();
            let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon(taskList)
            await Promise.all(taskList.map(async taskId=>{
                let taskNode = await this.getFromCacheOrRedis(uuid,taskId)
                if(_.isEmpty(taskNode)){
                    let TaskConfig = TasksObjConfig[taskId];
                    taskNode = models.TaskNodeModel(taskId);
                    if(TaskConfig.TriggerCounterFlag === 1){
                        for (let i = 1; i <= TRIGGER_CONDITION_NUM ; i++) {
                            let key = `FinishCondition${i}`;
                            if(TaskConfig[key].length){
                                let actId = TaskConfig[key][0];
                                if(!this.countData[actId]){
                                    await this.getCountDataById(uuid, actId);
                                }
                            }
                        }
                        taskNode.cntFlag = true
                    }
                    this.taskRedisData[taskNode.taskId] = taskNode;
                    this.doTaskByFinish(taskNode, TasksObjConfig, TaskConfig, (TaskConfig.TriggerCounterFlag === 1) ? this.countData : taskNode.finCntObj);
                }
            }))
            
      
        }catch (e) {
            console.log(e)
        }
    }
 
 
    //##################################### achievement #############################################
    /**
     * 成就相关数据
     * @param uuid
     * @returns {Promise<{sList: [], rList: []}>}
     */
    async getAchievementData(uuid){
        try {
            let sList = [];
            let rList = [];
            let scores =  await this.achievementScoreGet(uuid)
            for (const i in scores) {
                sList.push({type:i, score:scores[i].num})
            }
            
            let setList = await  this.achievementHashGet(uuid)
            if(!_.isEmpty(setList)){
                for (const i in setList) {
                    rList.push({id:i, time:setList[i]})
                }
            }
            
            return {sList , rList}
        }catch (e) {
            console.log(e)
        }
    }
    
    
    
    async achievementDataSet(uuid,aid){
        try {
            let type = this.aRewardData.shift();
            let aid = this.aRewardData.shift();
            let scores = this.aRewardData.shift();
            if(this.achievementScores[type]){
                this.achievementScores[type].num += scores;
            }else {
                this.achievementScores[type] = {};
                this.achievementScores[type].num = scores;
            }
            
            //hash
            await this.redisHelper.achievementHashSet(uuid, AchievementHash, aid, (new Date().getTime()));
            //string
            await this.redisHelper.achievementScoreSET(uuid, AchievementSCores, JSON.stringify(this.achievementScores))
            return
        }catch (e) {
            console.log(e)
        }
    }
    
    
    async achievementScoreGet(uuid){
        try {
            let scores = await this.redisHelper.achievementScoreListGet(uuid, AchievementSCores)
            if(scores){
                this.achievementScores = JSON.parse(scores);
                return this.achievementScores;
            }else {
                this.achievementScores = {};
                return this.achievementScores;
            }
        }catch (e) {
            console.log(e)
        }
    }
    
    
    async achievementHashGet(uuid){
        try {
            this.AchievementHash = await this.redisHelper.hgetall(uuid, AchievementHash);
            return this.AchievementHash;
        }catch (e) {
            console.log(e)
        }
    }
    
    
    async achievementHashGetById(uuid,aid){
        try {
            return await this.redisHelper.achievementHashGetById(uuid, AchievementHash,aid);
        }catch (e) {
            console.log(e)
        }
    }
    
    
    
    async getFromCacheOrRedis(uuid,taskId)
    {
        if(this.taskRedisData[taskId]){
            return this.taskRedisData[taskId]
        }
        return await this.redisHelper.taskGetData(uuid, TaskFinishTblName, taskId)
    }
    
    
    async getTaskData(uuid,taskId)
    {
        if(this.taskRedisData[taskId]){
            return this.taskRedisData[taskId]
        }
        else {
            let taskNode =  await this.redisHelper.taskGetData(uuid, TaskFinishTblName, taskId)
            if(_.isEmpty(taskNode)){
                return {};
            }
            this.taskRedisData[taskId] = taskNode[taskId];
            
            return this.taskRedisData[taskId];
        }
    }
    
    //判断是否是第一章节
    isFirstChapterTask(taskId){
        return MainChapterTaskConfig.isFirstChapterTask(taskId)
    }
    
    
    
    
    isUpdate(cycle, sTime) {
        var now = new Date(),
            dt = new Date(sTime),
            cycleType = cycle.CycleType,
            flag = false;
        if (cycleType === CONSTANTS.TASK_CYCLE_TYPES.DAY) {
            if (!(now.getFullYear() === dt.getFullYear() &&
                now.getMonth() === dt.getMonth() && now.getDate() === dt.getDate())) {
                flag = true;
            }
        } else if (cycleType === CONSTANTS.TASK_CYCLE_TYPES.WEEK) {
            if (now.getDate() !== dt.getDate() && now.getDay() === dt.getDay()) {
                flag = true;
            }
        } else if (cycleType === CONSTANTS.TASK_CYCLE_TYPES.MONTH) {
            if (now.getMonth() !== dt.getMonth()) {
                flag = true;
            }
        } else if (cycleType === CONSTANTS.TASK_CYCLE_TYPES.YEAR) {
            if (now.getFullYear() !== dt.getFullYear()) {
                flag = true;
            }
        }
        
        return flag;
    }
    sleep(time)
    {
        return new Promise(resolve => {
            setTimeout(()=>{
                resolve (1)
            },time)
        })
    }

    

    
    
    checkCompleteCondIdxValid(idxLis, idx) {
        var valid = false;
        for (let i in idxLis) {
            if (idxLis[i] === idx) {
                valid = true; // 说明该条件已被触发
            }
        }
        return valid;
    }
    

    doTaskByDate(taskNode, TaskConfig) {
        // var now = new Date(), skipFlag = false, dateValid = true;
        var isSkip = false;
        if (taskNode.Type === TASK_TYPES().FAST) {
            // 是紧急任务（需判断持续时间）
            if (taskNode) {
                if (taskNode.status === CONSTANTS.TASK_STATUS.EXPIRED) {
                    // 状态为已过期
                    isSkip = true;
                } else {
                    // 判断时间是否过期
                    if (taskNode.st == 0 ||
                        (new Date() - taskNode.st >= TaskConfig.LongTime)) {
                        isSkip = true; // 未触发或已过期
                    }
                }
            }
        }
        return [isSkip, taskNode];
    }
    
    
    checkProgressEqual(oldPgs, newPgs) {
        return (JSON.stringify(oldPgs) === JSON.stringify(newPgs));
    }
    

    
    getSubTaskList(TasksObjCfg, groupId) {
        var subTaskLis = [],
            taskIdLis = Object.keys(TasksObjCfg);
        for (var sTaskId of taskIdLis) {
            if (TasksObjCfg[sTaskId].GroupID === groupId) {
                subTaskLis.push(TasksObjCfg[sTaskId].TaskID);
            }
        }
        
        return subTaskLis;
    }

    
    
    dealTaskGroupWithFinish(taskNode, TasksObjConfig, TaskConfig) {
        // 获取子任务列表
        if (TaskConfig.SubTaskFlag === 0) {
            // 子任务
            if (taskNode.status !== CONSTANTS.TASK_STATUS.COMPLETE) {
                // 子任务未完成父任务不允许是完成状态（有子任务必定存在父任务数据）
                if (taskNode)
                    taskNode.status = CONSTANTS.TASK_STATUS.NORMAL;
            }
        } else {
            // 父任务（遍历玩家任务列表查询子任务是否完成）
            var subTaskList = this.getSubTaskList(TasksObjConfig, TaskConfig.GroupID);
            for (let subTaskId of subTaskList) {
                if (subTaskId !== TaskConfig.TaskID) {
                    if (this.taskRedisData[subTaskId]) {
                        if (this.taskRedisData[subTaskId].status !== CONSTANTS.TASK_STATUS.COMPLETE) {
                            // 该子任务未完成
                            this.taskRedisData[TaskConfig.TaskID].status = CONSTANTS.TASK_STATUS.NORMAL;
                        }
                    } else {
                        // 不存在该子任务
                        this.taskRedisData[TaskConfig.TaskID].status = CONSTANTS.TASK_STATUS.NORMAL;
                    }
                }
            }
        }
        return this.taskRedisData[TaskConfig.TaskID];
    }
    
    
    /**
     *
     * @param taskData
     * @returns {[]}
     */
    adjustTaskList(taskData) {
        var lis = [], taskNode, status, taskLis = Object.keys(taskData);
        for (let sTaskId of taskLis) {
            if (taskData[sTaskId] &&
                taskData[sTaskId].status !== CONSTANTS.TASK_STATUS.EXPIRED) {
                // 有任务数据及已触发及未过期
                taskNode = {
                    taskId: taskData[sTaskId].taskId,
                    progress: taskData[sTaskId].progress,
                    cycleCount: taskData[sTaskId].cycleCount,
                    st: taskData[sTaskId].st,
                    cd: Tasks.getTaskLongTime(taskData[sTaskId].taskId),
                    status: taskData[sTaskId].status
                };
                lis.push(taskNode);
            }
        }
        return lis;
    }
    
    
    adjustAchievementList() {
        let sList =[]
        if(this.achievementScores){
            let scores = this.achievementScores;
            for (const i in scores) {
                sList.push({type:i, score:scores[i].num})
            }
        }
        return sList;
    }
    
    checkParam3(ids, p3) {
        if (Array.isArray(ids) && ids.length > 0) {
            if (p3 > 0) {
                // 说明区间判断需要判断参数限制ID
                return (ids[0]===p3);
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
    
    
    paramsValid(OneCondition, cntData) {
        var valid = false,
            type = OneCondition[0],
            param = OneCondition[1],
            num = OneCondition[2];
        
        var newProgressNode = {flag: 0, num: num, count: 0},
            counterNodeLis = cntData[type]; // 存储的计数器节点（对应枚举类型）
        if (counterNodeLis) {
            // 存储的计数器有该枚举类型的计数数据（有计数数据可用于条件判断）
            if (typeof param === 'object') {
                // 说明是多参数的条件格式[type, [param1, ...], num]
                var param1 = param[0],
                    param2 = param[1],
                    param3 = param[2] ? param[2] : 0,
                    count = 0;
                
                // 只有参数1为0和参数1、2都不为0两种情形
                if (num === 0) {
                    // 说明要判断区间
                    for (let i in counterNodeLis) {
                        if (counterNodeLis[i].num >= param1 && counterNodeLis[i].num <= param2 && this.checkParam3(counterNodeLis[i].ids, param3)) {
                            // 在范围内
                            valid = true;
                            newProgressNode.num = newProgressNode.count = num;
                            break;
                        }
                    }
                } else {
                    if (param1 === 0) {
                        
                        if(param2 === 0){
                            //[503-0,0-N]
                            for (let i in counterNodeLis) {
                                count += counterNodeLis[i].num;
                            }
                            if (count >= num) {
                                // 符合条件（达成）
                                valid = true;
                                newProgressNode.num = newProgressNode.count = num;
                            } else {
                                newProgressNode.num = num;
                                newProgressNode.count = count;
                            }
                            
                        }else {
                            //[503-0,1-N]
                            for (let i in counterNodeLis) {
                                for (let j in counterNodeLis[i].ids) {
                                    if (counterNodeLis[i].ids[j] === param2) {
                                        count += counterNodeLis[i].num;
                                    }
                                }
                            }
                            if (count >= num) {
                                // 符合条件（达成）
                                valid = true;
                                newProgressNode.num = newProgressNode.count = num;
                            } else {
                                newProgressNode.num = num;
                                newProgressNode.count = count;
                            }
                        }
                        
                    } else {
                 
                        for (let i in counterNodeLis) {
                            if (param1 === counterNodeLis[i].ids[0] &&
                                param2 === counterNodeLis[i].ids[1]) {
                                count += counterNodeLis[i].num;
                            }
                        }
                        
                        if (count >= num) {
                            // 符合条件（达成）
                            valid = true;
                            newProgressNode.num = newProgressNode.count = num;
                        } else {
                            newProgressNode.num = num;
                            newProgressNode.count = count;
                        }
                    }
                }
            } else {
                var count = 0;
                // 说明是单参数条件格式[type, param, num]
                if (param === 0) {
                    // 没有参数限制（只需判断数量）
                    for (let i in counterNodeLis) {
                        count += counterNodeLis[i].num;
                    }
                    
                    if (count >= num) {
                        // 符合条件（达成）
                        valid = true;
                        newProgressNode.num = newProgressNode.count = num;
                    } else {
                        newProgressNode.num = num;
                        newProgressNode.count = count;
                    }
                } else {
                    // 有参数限制
                    for (let i in counterNodeLis) {
                        for (let j in counterNodeLis[i].ids) {
                            if (counterNodeLis[i].ids[j] === param) {
                                count += counterNodeLis[i].num;
                            }
                        }
                    }
                    if (count >= num) {
                        // 符合条件（达成）
                        valid = true;
                        newProgressNode.num = newProgressNode.count = num;
                    } else {
                        newProgressNode.num = num;
                        newProgressNode.count = count;
                    }
                }
            }
        }
        return [valid, newProgressNode];
    }
    
    
    // ========================================================= condition parser parameters
    parserConditionParams(ConditionConfig, countData) {
        // Condition [type, [param1, ...], num] 或 [type, param, num]
        // countData = { 'type' => [{ ids: [], num }]}
        var valid, success = false, progressNode, progressLis = [];
        if (ConditionConfig.length > 0) {
            if (typeof ConditionConfig[0] === 'object') {
                // 说明是条件或
                for (let i in ConditionConfig) {
                    [valid, progressNode] = this.paramsValid(ConditionConfig[i], countData);
                    progressNode.flag = 2; // 条件或
                    progressLis.push(progressNode);
                    if (valid) {
                        success = true; // 只要有一个条件满足就达成
                    }
                }
            } else {
                [success, progressNode] = this.paramsValid(ConditionConfig, countData);
                progressNode.flag = 1; // 条件与
                progressLis.push(progressNode);
            }
        } else {
            // 说明无条件（直接成功）
            success = true;
        }
        return [success, progressLis];
    }
    
    
    
    async getTaskList(uuid)
    {
        return await this.redisHelper.hgetall(uuid, TaskFinishTblName)
    }
    
    
    async getTaskBonus(taskId) {
        return new Promise((resolve, reject)=>{
            Tasks.getBonusByGroupConfig([taskId], function (BonusData, BonusExp) {
                resolve({BonusData, BonusExp})
            });
        });
   
    }
    
    
    checkMainChapter(taskId){
        let tasks = global.FIXDB.FIXED_MAINTASKS[taskId];
        if(tasks){
            return true;
        }
        return false;
    }
    
    /**
     * checkTaskStatValid - 验证任务状态
     * @param {*} uuid
     * @param {*} taskId
     * @param {*} callback
     */
    async checkTaskStatValid(uuid ,taskId) {
        var taskGroup = Tasks.getSubTaskList(taskId);
        let taskStatus = true;
        if (Array.isArray(taskGroup)) {
            await Promise.all(taskGroup.map(async taskIdx =>{
                let taskNode = await this.getTaskData(uuid, taskIdx);
                // 只要任务组中有一个子任务为非完成状态，就无法领取
                if (taskNode.status !== CONSTANTS.TASK_STATUS.COMPLETE) {
                    taskStatus = false;
                }
                
                this.taskRedisData[taskIdx] = taskNode;
                this.tChangeList[taskIdx] = taskNode;
            }))
        } else {
            let taskNode = await this.getTaskData(uuid, taskId);
            if (taskNode.status !== CONSTANTS.TASK_STATUS.COMPLETE) {
                taskStatus = false;
            }
            this.taskRedisData[taskId] = taskNode;
            this.tChangeList[taskId] = taskNode;
        }
        
        taskGroup.push(taskId)
       return {taskStatus,taskGroup};
    }
    
    
    
//################################################ TaskRefresh ##################################################
    /**
     * 更新每日任務 判斷每日任务更新时间 isSameDay
     * @param uuid
     * @returns {Promise<*>}
     */
    async updateDailyTask(uuid){
        try {
            //判断每日任务刷新时间
            let refreshTimes = await this.getDailyTaskRefreshTime(uuid)
            if(!Utils.isSameDay(refreshTimes,(new Date().getTime()))){
                let tasks = global.FIX_TASK.dailyTasks||[];
                await Promise.all(tasks.map(async taskId=>{
                    let taskNode = {};
                    if(this.taskRedisData[taskId]){
                        taskNode = this.taskRedisData[taskId];
                    }else {
                        let cacheTask = await this.getFromCacheOrRedis(uuid,taskId);
                        taskNode = cacheTask[taskId];
                    }
        
                    if(!_.isEmpty(taskNode)){
                        taskNode.cycleCount = 0; // 重置周期计数
                        taskNode.finCntObj = {}; // 重置计数器
                        taskNode.st = (new Date()).getTime();
                        taskNode.status = CONSTANTS.TASK_STATUS.NORMAL;
                        for (let i in taskNode.progress) {
                            taskNode.progress[i].count = 0;
                        }
                        this.taskRedisData[taskId] = taskNode;
                        this.tChangeList[taskId] = taskNode;
                    }
                }));
                
                return await this.setDailyTaskRefreshTime(uuid);
            }else {

      
            }
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }
    }
    
    
    async getDailyTaskRefreshTime(uuid){
        try {
            return await this.redisHelper.getRefreshDataByType(uuid, CONSTANTS.REFRESH_TYPE.RefreshData, CONSTANTS.REFRESH_TYPE.TaskDailyRefresh)
        }catch (e) {
            console.log(e)
        }
    }
    
    
    async setDailyTaskRefreshTime(uuid){
        try {
            let data = {};
            data[CONSTANTS.REFRESH_TYPE.TaskDailyRefresh] = (new Date().getTime())
            return await this.redisHelper.setDailyTaskRefreshTimes(uuid, CONSTANTS.REFRESH_TYPE.RefreshData,data)
        }catch (e) {
            console.log(e)
        }
    }
    
    
    
    /**
     * 更新任務狀態
     * @param taskId
     * @param taskGroup
     */
    updateTaskStatus(taskId,taskGroup){
        for (const i of taskGroup) {
            // this.taskRedisData[i].status = CONSTANTS.TASK_STATUS.COMPLETE;
            this.taskRedisData[i].status = CONSTANTS.TASK_STATUS.REWARDED;
            this.tChangeList[i] = this.taskRedisData[i];
        }
        this.tRewardId = taskId;
    }
    
    // 多个行为计数
    async addMultiCounter(uuid)
    {
        try {
            let data = this.actPoints;
            this.countData = await this.redisHelper.taskGetData(uuid, TaskTriggerTblName,...Object.keys(data))
            //任务数据统计处理
            let {dataChange} = this.countDataUpdate();
            //变更数据处理
            for (const key in dataChange) {
                this.cChangeObj[key] = [];
                for (const idx in dataChange[key]) {
                    this.cChangeObj[key].push(dataChange[key][idx])
                }
            }
            //dailyTask
            await this.updateDailyTask(uuid)
            //并发处理任务
            await this.taskChange(uuid)
            //周期任务调整
            if(this.tRewardId){
                await this.taskComplete(uuid)
            }
            //根据行为任务触发
            await this.taskTrigger(uuid)
            //主线章节解锁
            if(this.chapterOpen && this.chapterOpen.length){
                await this.mainTaskTrigger(uuid)
                await this.setOpenTaskList(uuid,this.OpenTaskList)
            }
            //成就任务id存储
            if(this.aRewardData.length){
                if(!this.achievementScores){
                    this.achievementScores = await this.achievementScoreGet(uuid)
                }
                await this.achievementDataSet(uuid)
            }
            //触发相关数据存储
            let _redisData = {};
            for (const actId in this.countData) {
                _redisData[actId] = JSON.stringify(this.countData[actId])
            }
            await this.redisHelper.taskSet(uuid, TaskTriggerTblName,_redisData)
            //任务变更数据存储
            let redisSave = JSON.parse(JSON.stringify(this.taskRedisData))
            _.map(redisSave, (v,k)=>{redisSave[k] = JSON.stringify(v)})
            if(Object.keys(redisSave).length > 0){
                await this.redisHelper.taskSet(uuid, TaskFinishTblName,redisSave)
            }
        }catch (e) {
            //TODO 后续添加报错
            console.log(e)
        }
        
    }
    
    
    async getCDataByTypeAndId(uuid, type, id){
        let triggerRecord = await this.redisHelper.taskGetData(uuid, TaskTriggerTblName,type)
        let retData = {};
        if(triggerRecord[type]){
            for (const i of triggerRecord[type]) {
                if(i.ids[0] === id){
                    retData = i
                }
            }
        }
        //{ ids: [ 410001, 0 ], num: 1850 }
        return  retData;
    }
    
    
}


module.exports = Task