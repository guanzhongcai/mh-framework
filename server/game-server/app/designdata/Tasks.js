// ==========================================================
// 任务
// ==========================================================
const utils = require('./../common/utils');
const MainChapterTaskConfig = require('./MainChapterTask');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
const categoryFromItemListEx = require('./../scripts/controllers/fixedController').categoryFromItemListEx;
let FIXED_TASKS = null;
let FIXED_TASKS_INDEXES = null
let FIXED_MAIN_TASKS = null
let FIXED_MAIN_TASKS_INDEXES = null

// 解析条件（条件3是或形式，多条条件）
function parseCondition(condition)
{
    if (typeof condition !== 'string') condition = '';
    function getFields(cond) {
        var lis = [];
        if (cond.includes(',')) {
            // 多限制
            if (cond.includes('-')) {
                var chunks = cond.split('-');
                // [type, [param1, param2], num]
                lis.push(parseInt(chunks[0])); // type
                lis.push(utils.splitToIntArray(chunks[1], ',')); // param []
                lis.push(parseInt(chunks[2])); // num
            }
        } else {
            if (cond.includes('-')) {
                // [type, param, num]
                lis = utils.splitToIntArray(cond, '-');
            }
        }

        return lis;
    }

    var condLis = [];

    if (condition.includes('|')) {
        // 说明有或（是条件3）
        var chunks = condition.split('|');
        for (let chunk of chunks) {
            // [[type, params, num], ...] // 逻辑或形式
            condLis.push(getFields(chunk));
        }
    } else {
        condLis = getFields(condition);
    }

    return condLis;
}

class Tasks
{
    static getMainTaskGroupByGroupConfig(taskGroup, callback)
    {
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node, mainTaskGroup = [];
        for (let taskId of taskGroup) {
            node = FIXED_MAIN_TASKS[taskId];
            if (node) {
                mainTaskGroup.push(node.TaskID);
            }
        }
        callback(mainTaskGroup);
    }

    static getTaskListByGroupIdConfig(taskGroup, callback)
    {
        if (taskGroup.length === 0) {
            callback(taskGroup);
        } else {
            if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
            if(!FIXED_TASKS_INDEXES){FIXED_TASKS_INDEXES = global.FIXDB.FIXED_TASKS_INDEXES}
            function getSubTaskLis(taskId) {
                var subTaskLis = FIXED_TASKS_INDEXES['GroupID' + taskId];
                if (subTaskLis) {
                    // 说明是普通任务
                    return subTaskLis;
                } else {
                    // 可能是主线任务
                    var node = FIXED_MAIN_TASKS[taskId];
                    if (node) {
                        return FIXED_MAIN_TASKS_INDEXES['GroupID' + node.GroupID];
                    } else {
                        return [];
                    }
                }
            }

            var newTaskGroup = [], subTaskLis;
            for (let taskId of taskGroup) {
                subTaskLis = getSubTaskLis(taskId);
                if (subTaskLis.length > 1) {
                    for (let i = 1; i < subTaskLis.length; i++) {
                        newTaskGroup.push(subTaskLis[i]);
                    }
                } else {
                    newTaskGroup.push(taskId);
                }
            }

            callback(newTaskGroup);
        }
    }

    static getTaskListByGroupIdConfigBak(taskGroup)
    {
        if (taskGroup.length === 0) {
            return taskGroup;
        } else {
            if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
            if(!FIXED_TASKS_INDEXES){FIXED_TASKS_INDEXES = global.FIXDB.FIXED_TASKS_INDEXES}
            function getSubTaskLis(taskId) {
                var subTaskLis = FIXED_TASKS_INDEXES['GroupID' + taskId];
                if (subTaskLis) {
                    // 说明是普通任务
                    return subTaskLis;
                } else {
                    // 可能是主线任务
                    var node = FIXED_MAIN_TASKS[taskId];
                    if (node) {
                        return FIXED_MAIN_TASKS_INDEXES['GroupID' + node.GroupID];
                    } else {
                        return [];
                    }
                }
            }

            var newTaskGroup = [], subTaskLis;
            for (let taskId of taskGroup) {
                subTaskLis = getSubTaskLis(taskId);
                if (subTaskLis.length > 1) {
                    for (let i = 1; i < subTaskLis.length; i++) {
                        newTaskGroup.push(subTaskLis[i]);
                    }
                } else {
                    newTaskGroup.push(taskId);
                }
            }

            return newTaskGroup;
        }
    }

    static getMainSubTaskList(mainTaskId)
    {
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        if(!FIXED_TASKS_INDEXES){FIXED_TASKS_INDEXES = global.FIXDB.FIXED_TASKS_INDEXES}
        var node = FIXED_MAIN_TASKS[mainTaskId];
        if (node) {
            var lis = FIXED_MAIN_TASKS_INDEXES['GroupID' + node.GroupID];
            return Array.isArray(lis) ? lis.filter((a) => { return a != mainTaskId }) : [];
        } else {
            return [];
        }
    }

    static getTaskLongTime(taskId)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node = FIXED_TASKS[taskId];
        if (node) {
            return isNaN(node.ExpiredAt) ? 0 : Number(node.ExpiredAt) * 1000;
        } else {
            node = FIXED_MAIN_TASKS[taskId];
            return (node ? (isNaN(node.ExpiredAt) ? 0 : Number(node.ExpiredAt) * 1000) : 0);
        }
    }

    static getTaskNode(taskId)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node = FIXED_TASKS[taskId];
        if (node) {
            return {
                Type: node.Type,
                LongTime: isNaN(node.ExpiredAt) ? 0 : Number(node.ExpiredAt) * 1000
            };
        } else {
            node = FIXED_MAIN_TASKS[taskId];
            return (node ? {
                Type: node.Type,
                LongTime: isNaN(node.ExpiredAt) ? 0 : Number(node.ExpiredAt) * 1000
            } : null);
        }
    }
    
    
    static getTaskCfgById(taskId)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        return  FIXED_TASKS[taskId]
    }
 
    
    /**
     * getTaskObjByGroupConfig - 根据任务组（空表时为全部）获取对应任务配置Object表
     * @param {*} taskGroup
     * @param {*} callback
     */
    static getTaskObjByGroupConfig(taskGroup, callback)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        function doTaskNode(taskNode) {
            if (taskNode) {
                var newNode = {
                    TaskID: taskNode.TaskID,

                    Type: taskNode.Type,

                    // 任务组相关
                    SubTaskFlag: taskNode.SubTaskFlag,
                    GroupID: taskNode.GroupID,
                    GroupNum: taskNode.GroupNum,
                    TriggerCounterFlag: taskNode.TriggerCounterFlag,

                    // 时间相关
                    StartedAt: (typeof taskNode.StartedAt === 'string' && taskNode.StartedAt.includes('-')) ? taskNode.StartedAt : null,
                    ExpiredAt: (typeof taskNode.ExpiredAt === 'string' && taskNode.ExpiredAt.includes('-')) ? taskNode.ExpiredAt : null,

                    // 持续时间（复用ExpiredAt字段）
                    LongTime: isNaN(taskNode.ExpiredAt) ? 0 : Number(taskNode.ExpiredAt) * 1000,

                    // 周期相关
                    CycleType: taskNode.CycleType,
                    CycleCompleteCount: taskNode.CycleCompleteCount
                };

                // 条件相关
                for (let k = 1; k <= 3; k++) {
                    newNode['TriggerCondition' + k] = parseCondition(taskNode['TriggerCondition' + k]);
                    newNode['FinishCondition' + k] = parseCondition(taskNode['FinishCondition' + k]);
                }

                return newNode;
            } else {
                return null;
            }
        }

        var node, taskObj = {}, newGroup = [];
        if (taskGroup.length === 0) {
            // all
            newGroup = Object.keys(FIXED_TASKS);
            newGroup = newGroup.concat(Object.keys(FIXED_MAIN_TASKS));
        } else {
            newGroup = taskGroup;
        }

        //主线，任务id 集合newGroup
        for (let taskId of newGroup) {
            node = doTaskNode(FIXED_TASKS[taskId]);
            if (!node) {
                // 可能是主线任务
                node = doTaskNode(FIXED_MAIN_TASKS[taskId]);
            }

            if (node) {
                taskObj[node.TaskID] = node;
            }
        }

        callback(taskObj);
    }

    // 获取任务配置数据
    static getTaskObjByGroupConfigCommon(taskGroup)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        function doTaskNode(taskNode) {
            if (taskNode) {
                var newNode = {
                    TaskID: taskNode.TaskID,

                    Type: taskNode.Type,

                    // 任务组相关
                    SubTaskFlag: taskNode.SubTaskFlag,
                    GroupID: taskNode.GroupID,
                    GroupNum: taskNode.GroupNum,
                    TriggerCounterFlag: taskNode.TriggerCounterFlag,

                    // 时间相关
                    StartedAt: (typeof taskNode.StartedAt === 'string' && taskNode.StartedAt.includes('-')) ? taskNode.StartedAt : null,
                    ExpiredAt: (typeof taskNode.ExpiredAt === 'string' && taskNode.ExpiredAt.includes('-')) ? taskNode.ExpiredAt : null,

                    // 持续时间（复用ExpiredAt字段）
                    LongTime: isNaN(taskNode.ExpiredAt) ? 0 : Number(taskNode.ExpiredAt) * 1000,

                    // 周期相关
                    CycleType: taskNode.CycleType,
                    CycleCompleteCount: taskNode.CycleCompleteCount
                };

                // 条件相关
                for (let k = 1; k <= 3; k++) {
                    newNode['TriggerCondition' + k] = parseCondition(taskNode['TriggerCondition' + k]);
                    newNode['FinishCondition' + k] = parseCondition(taskNode['FinishCondition' + k]);
                }

                return newNode;
            } else {
                return null;
            }
        }

        var node, taskObj = {}, newGroup = [];
        if (taskGroup.length === 0) {
            // all
            newGroup = Object.keys(FIXED_TASKS);
            newGroup = newGroup.concat(Object.keys(FIXED_MAIN_TASKS));
        } else {
            newGroup = taskGroup;
        }

        for (let taskId of newGroup) {
            node = doTaskNode(FIXED_TASKS[taskId]);
            if (!node) {
                // 可能是主线任务
                node = doTaskNode(FIXED_MAIN_TASKS[taskId]);
            }

            if (node) {
                taskObj[node.TaskID] = node;
            }
        }

        return taskObj;
    }
    
    
    
    
    // 获取任务配置数据
    static getTaskConfigById(taskId)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        function doTaskNode(taskNode) {
            if (taskNode) {
                var newNode = {
                    TaskID: taskNode.TaskID,
                    
                    Type: taskNode.Type,
                    
                    // 任务组相关
                    SubTaskFlag: taskNode.SubTaskFlag,
                    GroupID: taskNode.GroupID,
                    GroupNum: taskNode.GroupNum,
                    TriggerCounterFlag: taskNode.TriggerCounterFlag,
                    
                    // 时间相关
                    StartedAt: (typeof taskNode.StartedAt === 'string' && taskNode.StartedAt.includes('-')) ? taskNode.StartedAt : null,
                    ExpiredAt: (typeof taskNode.ExpiredAt === 'string' && taskNode.ExpiredAt.includes('-')) ? taskNode.ExpiredAt : null,
                    
                    // 持续时间（复用ExpiredAt字段）
                    LongTime: isNaN(taskNode.ExpiredAt) ? 0 : Number(taskNode.ExpiredAt) * 1000,
                    
                    // 周期相关
                    CycleType: taskNode.CycleType,
                    CycleCompleteCount: taskNode.CycleCompleteCount
                };
                
                // 条件相关
                for (let k = 1; k <= 3; k++) {
                    newNode['TriggerCondition' + k] = parseCondition(taskNode['TriggerCondition' + k]);
                    newNode['FinishCondition' + k] = parseCondition(taskNode['FinishCondition' + k]);
                }
                
                return newNode;
            } else {
                return null;
            }
        }
        
        var node, taskObj = {};
        node = doTaskNode(FIXED_TASKS[taskId]);
        if (!node) {
            // 可能是主线任务
            node = doTaskNode(FIXED_MAIN_TASKS[taskId]);
        }
        
        return node;
    }
    
    
    
    
    
    
    
    
    
    // 获取任务（普通+主线）奖励配置
    static getBonusConfig(taskId, callback)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node = FIXED_TASKS[taskId];
        node = node ? node : FIXED_MAIN_TASKS[taskId];
        if (node) {
            callback(categoryFromItemList(utils.getItemArraySplitOnce(node.Bonus, ',')), node.BonusExp);
        } else {
            console.error("[Tasks][getBonusConfig] null: ", taskId);
            callback(null);
        }
    }

    // 判断是否为主线任务
    static checkMainTaskValid(taskId, callback)
    {
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node = FIXED_MAIN_TASKS[taskId];
        callback(node ? true : false);
    }

    static getObjTaskAbortCycleByGroupConfig(taskGroup, callback)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var taskObj = {}, node, newGroup = [];
        if (taskGroup.length === 0) {
            newGroup = Object.keys(FIXED_TASKS);
            newGroup = newGroup.concat(Object.keys(FIXED_MAIN_TASKS));
        } else {
            newGroup = taskGroup;
        }

        for (let taskId of newGroup) {
            node = FIXED_TASKS[taskId];
            node = node ? node : FIXED_MAIN_TASKS[taskId];
            if (node) {
                taskObj[node.TaskID] = {
                    TaskID: node.TaskID,
                    CycleType: node.CycleType,
                    CycleCompleteCount: node.CycleCompleteCount
                };
            }
        }

        callback(taskObj);
    }

    // 将包含父任务的组转换成全部是的子任务组
    static getParentTaskToSubTaskGroupConfig(taskGroup, callback)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        if(!FIXED_TASKS_INDEXES){FIXED_TASKS_INDEXES = global.FIXDB.FIXED_TASKS_INDEXES}
        if(!FIXED_MAIN_TASKS_INDEXES){FIXED_MAIN_TASKS_INDEXES = global.FIXDB.FIXED_MAINTASKS_INDEXES}
        function getSubTaskGroup(taskNode) {
            var idLis = FIXED_TASKS_INDEXES['GroupID' + taskNode.GroupID], subGroup = [];
            idLis = idLis ? idLis : FIXED_MAIN_TASKS_INDEXES['GroupID' + taskNode.GroupID];

            if (idLis.length === 1) {
                subGroup.push(idLis[0]);
            } else {
                for (let i = 1; i < idLis.length; i++) {
                    subGroup.push(idLis[i]);
                }
            }

            return subGroup;
        }

        var newTaskGroup = [], node;
        for (let taskId of taskGroup) {
            node = FIXED_TASKS[taskId];
            node = node ? node : FIXED_MAIN_TASKS[taskId];
            if (node) {
                if (node.SubTaskFlag === 1) {
                    // 父任务
                    newTaskGroup = newTaskGroup.concat(getSubTaskGroup(node));
                } else {
                    // 子任务
                    newTaskGroup.push(taskId);
                }
            }
        }

        callback(newTaskGroup);
    }

    // 根据taskGroup获取奖励
    static getBonusByGroupConfig(taskGroup, callback)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node, bonusItemLis = [], BonusExp = 0;
        for (let taskId of taskGroup) {
            node = FIXED_TASKS[taskId];
            node = node ? node : FIXED_MAIN_TASKS[taskId];
            if (node) {
                bonusItemLis = bonusItemLis.concat(utils.getItemArraySplitTwice(node.Bonus, '|', ','));
                BonusExp += node.BonusExp;
            }
        }

        callback(categoryFromItemList(bonusItemLis), BonusExp);
    }

    // 开启任务章节消耗
    static getOpenCost(taskId)
    {
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var node = FIXED_MAIN_TASKS[taskId];
        if (node) {
            return categoryFromItemList(utils.getItemArraySplitTwice(node.OpenCost, '|', ','));
        } else {
            console.warn("[Tasks][getOpenCost] Can't find main task:", taskId);
            return null;
        }
    }

    // 默认主动开启（解锁）章节任务列表
    static getUnlockChapterTaskListDefault()
    {
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        var sTaskLis = Object.keys(FIXED_MAIN_TASKS), lis = [], node;
        for (let sTaskId of sTaskLis) {
            node = FIXED_MAIN_TASKS[sTaskId];
            if (node) {
                if (node.SubTaskFlag === 1 && node.OpenCost === '') {
                    lis.push({
                        TaskID: node.TaskID,
                        ChapterID: MainChapterTaskConfig.getMainChapterId(node.TaskID)
                    });
                }
            }
        }

        return lis;
    }

    static getSubTaskList(taskId)
    {
        if(!FIXED_TASKS){FIXED_TASKS = global.FIXDB.FIXED_TASKS}
        if(!FIXED_MAIN_TASKS){FIXED_MAIN_TASKS = global.FIXDB.FIXED_MAINTASKS}
        if(!FIXED_TASKS_INDEXES){FIXED_TASKS_INDEXES = global.FIXDB.FIXED_TASKS_INDEXES}
        if(!FIXED_MAIN_TASKS_INDEXES){FIXED_MAIN_TASKS_INDEXES = global.FIXDB.FIXED_MAINTASKS_INDEXES}
        var taskNode;

        // 获取该任务节点
        if (FIXED_TASKS[taskId]) {
            taskNode = FIXED_TASKS[taskId];
        } else if (FIXED_MAIN_TASKS[taskId]) {
            taskNode = FIXED_MAIN_TASKS[taskId];
        } else {
            taskNode = null;
        }

        if (taskNode) {
            // 是配置的任务
            // 获取任务组
            var taskGroup, FIELD_NAME = 'GroupID' + taskNode.GroupID;

            if (FIXED_TASKS_INDEXES[FIELD_NAME]) {
                taskGroup = FIXED_TASKS_INDEXES[FIELD_NAME];
            } else if (FIXED_MAIN_TASKS_INDEXES[FIELD_NAME]) {
                taskGroup = FIXED_MAIN_TASKS_INDEXES[FIELD_NAME];
            } else {
                taskGroup = null;
            }

            if (Array.isArray(taskGroup) && taskGroup.length > 1) {
                var lis = [];
                for (let i in taskGroup) {
                    if (taskGroup[i] != taskId)
                        lis.push(taskGroup[i]); // 仅有子任务的列表
                }
                return lis;
            } else {
                return [taskId]; // 该任务没子任务
            }
        } else {
            // 没有该任务
            console.warn("[TaskConfig][getSubTaskList] Can't find task:", taskId);
            return null;
        }
    }
}

module.exports = Tasks;
