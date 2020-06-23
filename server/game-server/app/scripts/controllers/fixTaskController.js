const _ = require('lodash')
let Tasks = require('../../designdata/Tasks')
const models = require('../models')

class FixTask {
    constructor() {
        this.config = null;
        // this.triggerMap = new Map();
        // this.finishMap = new Map();
        this.triggerMap = {};
        this.finishMap = {};
        this.dailyTasks = [];
        this.loadFixData();
    }

    loadFixData()
    {
        let triggerNum = 3;
        const triggerObj = {};
        const finishObj  = {};
        const dailyTasks  = [];
        const FIXED_TASKS = global.FIXDB.FIXED_TASKS;
        const FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS;
        
        //任务
        for (const item in FIXED_TASKS) {
            let node = FIXED_TASKS[item];
            if(node.Type === 2){
                dailyTasks.push(node.TaskID);
            }
            for (let i =1,len = triggerNum; i <= len; i++){
                ['TriggerCondition', 'FinishCondition' ]
                let triggerKey = `TriggerCondition${i}`;
                let finishKey = `FinishCondition${i}`;
                let actId = "";
                if(node[triggerKey]){
                    let params = node[triggerKey].split('-');
                    actId = params[0];
                    if(actId){
                        if(triggerObj[actId]){
                            triggerObj[actId].push(node.TaskID);
                        }else {
                            triggerObj[actId] = []
                            triggerObj[actId].push(node.TaskID);
                        }
                    }
                }
 
                if(node[finishKey]){
                    let params = node[finishKey].split('-');
                    actId = params[0];
                    if(actId){
                        if(finishObj[actId]){
                            finishObj[actId].push(node.TaskID);
                        }else {
                            finishObj[actId] = []
                            finishObj[actId].push(node.TaskID);
                        }
                    }
                }
            }
        }
    
        //主线
        for (const item in FIXED_MAIN_TASKS) {
            let node = FIXED_MAIN_TASKS[item];
            for (let i =1,len = triggerNum; i <= len; i++){
                ['TriggerCondition', 'FinishCondition' ]
                let triggerKey = `TriggerCondition${i}`;
                let finishKey = `FinishCondition${i}`;
                let actId = "";
                if(node[triggerKey]){
                    let params = node[triggerKey].split('-');
                    actId = params[0];
                    if(actId){
                        if(triggerObj[actId]){
                            triggerObj[actId].push(node.TaskID);
                        }else {
                            triggerObj[actId] = []
                            triggerObj[actId].push(node.TaskID);
                        }
                    }
                }
            
                if(node[finishKey]){
                    let params = node[finishKey].split('-');
                    actId = params[0];
                    if(actId){
                        if(finishObj[actId]){
                            finishObj[actId].push(node.TaskID);
                        }else {
                            finishObj[actId] = []
                            finishObj[actId].push(node.TaskID);
                        }
                    }
                }
            }
        }
    
    
    
    
        Object.keys(triggerObj).map(element =>{
            this.triggerMap[element] = _.uniq(triggerObj[element])
        })
        Object.keys(finishObj).map(element =>{
            this.finishMap[element] = _.uniq(finishObj[element])
        })
        this.dailyTasks = dailyTasks;
        return {
            triggerMap: this.triggerMap,
            finishMap: this.finishMap,
            dailyTasks: this.dailyTasks,
        }

        
        // for ( let task of Object.keys(FIXED_TASKS)){
        //     let node = FIXED_TASKS[task]
        //     if(node){
        //         const arr = _.times(3,Number)
        //         for (let number of arr){
        //             let base_arr = ['TriggerCondition', 'FinishCondition' ]
        //             for ( let type of base_arr)
        //             {
        //                 if(node[type + (number + 1)] && node[type + (number + 1)].length > 0 ){
        //                     let loops = []
        //                     if(node[type + (number + 1)].indexOf(',') > 0){
        //                         if(node.TaskID != 201470 && type === 'TriggerCondition'){
        //                             loops = node[type + (number + 1)].split(',')
        //                         }
        //                     }else{
        //                         loops.push(node[type + (number + 1)])
        //                     }
        //                     for (let loop of loops){
        //                         let params = loop.split('-')
        //                         let action = params[0]
        //                         let point = params[1]
        //                         let keys = []
        //                         if(parseInt(point) > 0){
        //                             keys.push(action + '-' + point)
        //                         }else{
        //                             keys.push(action)
        //                         }
        //
        //                         for(let key of keys){
        //                             let save = null
        //                             if (type === 'TriggerCondition')
        //                             {
        //                                 save = this.triggerMap
        //                             }else{
        //                                 save = this.finishMap
        //                             }
        //
        //                             if(save[key])
        //                             {
        //                                 save[key].push(node.TaskID)
        //                             }else{
        //                                 save[key] = [node.TaskID]
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
        // Object.keys(this.triggerMap).map(element =>{
        //     this.triggerMap[element] = _.uniq(this.triggerMap[element])
        // })
        // Object.keys(this.finishMap).map(element =>{
        //     this.finishMap[element] = _.uniq(this.finishMap[element])
        // })
        // return {
        //     triggerMap: this.triggerMap,
        //     finishMap: this.finishMap
        // }
    }

    async initTask()
    {
        const FIXED_TASKS = global.FIXDB.FIXED_TASKS
        let taskIds = []
        let nums = _.times(3,Number)
        let key = 'TriggerCondition'
        for( let task of Object.keys(FIXED_TASKS)) {
            let row = FIXED_TASKS[task]
            let unlock = true
            for(let num of nums){
                if(!_.isEmpty(row[key + (num+1)])){
                    unlock = false
                }
            }
            if(unlock){
               taskIds.push(row.TaskID)
            }
        }

        let TASK_IDS = taskIds
        let TasksObjConfig = Tasks.getTaskObjByGroupConfigCommon([])
        let initData = {}
        await Promise.all(TASK_IDS.map(async taskId=> {
            let taskNode = null
            let TaskConfig = TasksObjConfig[taskId];
            if (_.isEmpty(taskNode)) {
                taskNode = models.TaskNodeModel(taskId, null);
                taskNode.cntFlag = (TaskConfig.TriggerCounterFlag === 1);
            }
            initData[taskId] = taskNode
        }))
        return initData
    }
}

module.exports = FixTask