const ERRCODES = require('./../../common/error.codes');
const Tasks = require('./../../designdata/Tasks');
const MainChapterTaskConfig = require('./../../designdata/MainChapterTask');
const models = require('./../models');
const validator = require('validator');

const TABLE_TASKDATA = "TaskData"; // { uuid, taskLis, triggerCountData }
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
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

const TRIGGER_CONDITION_NUM = 3;


/**
 * 总的任务逻辑
 * （1）计数器数据记录（触发、完成）
 * （2）起止日期判断
 * （3）触发判断（根据计数器）,注：主任务类需要判断任务组
 * （4）完成判断（根据计数器）
 * （5）领取奖励
 * （6）周期判断（重置、达成次数判定）
 * 急需解决问题
 * 2）配置中条件解析以如何形式返回？
 */


 //缓存获取任务数据
function getTaskDataFromSource(uuid, callback)
{
    GameRedisHelper.getHashFieldValue(TABLE_TASKDATA, uuid, taskData => {
        if (taskData && validator.isJSON(taskData)) {
            callback(JSON.parse(taskData));
        } else {
            callback({ triggerCountData: {}, taskLis: {}, openTaskLis: [] });
        }
    });
}

//获取任务数据
function getSourceTaskData(uuid, taskData, callback)
{
    if (taskData) {
        callback(taskData);
    } else {
        getTaskDataFromSource(uuid, sourceTaskData => {
            callback(sourceTaskData);
        });
    }
}

//任务数据存储
function saveTaskDataFromSource(uuid, taskData, callback)
{
    if (taskData) {
        GameRedisHelper.setHashFieldValue(TABLE_TASKDATA, uuid, JSON.stringify(taskData), () => {
            callback(true);
        });
    } else {
        callback(false);
    }
}

//设置任务数据，判断是否保存
function setSourceTaskData(uuid, taskData, callback, save=false)
{
    if (save) {
        saveTaskDataFromSource(uuid, taskData, () => {
            callback();
        });
    } else {
        callback();
    }
}

// ========================================================= task data
// { uuid, triggerCountData, taskLis: { 'task id': { taskId, progress, status } }}
//调整任务列表
function adjustTaskList(playerTasks) {
    var lis = [], taskNode, status, taskLis = Object.keys(playerTasks);

    for (let sTaskId of taskLis) {
        if (playerTasks[sTaskId] &&
                playerTasks[sTaskId].tgIdxLis.length === TRIGGER_CONDITION_NUM &&
                    playerTasks[sTaskId].status != TASK_STATS().EXPIRED) {
            // 有任务数据及已触发及未过期
            taskNode = {
                taskId: playerTasks[sTaskId].taskId,
                progress: playerTasks[sTaskId].progress,
                cycleCount: playerTasks[sTaskId].cycleCount,
                st: playerTasks[sTaskId].st,
                //triggerConditionIdxList: playerTasks[sTaskId].tgIdxLis,
                cd: Tasks.getTaskLongTime(playerTasks[sTaskId].taskId),
                tgIdxs: playerTasks[sTaskId].tgIdxLis,
                status: playerTasks[sTaskId].status
            };

            lis.push(taskNode);
        }

    }

    return lis;
}

//获取任务列表
function getTaskList(uuid, callback) {
    GameRedisHelper.getHashFieldValue(TABLE_TASKDATA, uuid, sdoc => {
        var doc = sdoc ? JSON.parse(sdoc) : null;
        if (doc) {
            callback(adjustTaskList(doc.taskLis));
        } else {
            callback([]);
        }
    });
}

//触发
function triggerCounterDefault(uuid, callback, taskData) {
    //GameRedisHelper.getHashFieldValue(TABLE_TASKDATA, uuid, sdoc => {
        //var doc = sdoc ? JSON.parse(sdoc) : null;
        //if (doc && doc.triggerCountData) {
        //  console.log(taskData)
        if (JSON.stringify(taskData.triggerCountData) === '{}') {
            addTaskCounter(taskData, uuid, 3, [0], () => {
                addTaskCounterGroup(taskData, uuid, 568, [
                    {params: [110001], num: 3},
                    {params: [110002], num: 3},
                    {params: [110003], num: 3},
                    {params: [110004], num: 3},
                    {params: [110005], num: 3},
                    {params: [110006], num: 3},
                    {params: [110007], num: 3}
                ], () => {
                    callback();
                }, false);
            });
        } else {
            callback();
        }
    //});
}
//新增任务统计
function addTaskCounter(taskData, uuid, type, params, callback, num = 1, add = true) {

    var save = taskData ? false : true;

    function doCounter(ctype, paramList, countData) {
        
        function equalParam(idsA, idsB) {
            if (idsA.length !== idsB.length) {
                return false;
            } else {
                for (let i in idsA) {
                    if (idsA[i] !== idsB[i]) {
                        return false;
                    }
                }

                return true;
            }
        }
        if (countData[ctype]) {
            isFind = false
            for (let i in countData[ctype]) {
                var countNode = countData[ctype][i];
                if (equalParam(countNode.ids, paramList)) {
                //if (JSON.stringify(countNode.ids) === JSON.stringify(paramList)) {
                    // 说明ids相等
                    if (add) {
                        countData[ctype][i].num += num;
                    } else {
                        // 值是直接设置的
                        countData[ctype][i].num = num;
                    }

                    isFind = true;
                }
            }

            if (!isFind) {
                countData[ctype].push({
                    ids: params,
                    num: num
                });
            }
        } else {
            countData[ctype] = [];
            countData[ctype].push({
                ids: params,
                num: num
            })
        }

        return countData;
    }

    if (params.length < 2) params.push(0); // 补足为[x, 0]格式
    // GameDB.findOne(TABLE_TASKDATA, ['triggerCountData', 'taskLis'], {uuid: uuid}, doc => {
    //GameRedisHelper.getHashFieldValue(TABLE_TASKDATA, uuid, sdoc => {
    //    var doc = sdoc ? JSON.parse(sdoc) : null;
    getSourceTaskData(uuid, taskData, doc => {
        // 处理触发计数存储
        // { 'type': [{ ids:[], num }] }
        //var data = {triggerCountData: {}, taskLis: {}}
        //if (doc) {
            //if (!doc.triggerCountData) doc.triggerCountData = {};
            doc.triggerCountData = doCounter(type, params, doc.triggerCountData);
            // 处理完成计数处理（playerTasks）
            var taskIdLis = Object.keys(doc.taskLis); // taskLis = taskObj
            for (let sTaskId of taskIdLis) {
                var taskNode = doc.taskLis[sTaskId];
                if (!taskNode.cntFlag && (taskNode.tgIdxLis.length === TRIGGER_CONDITION_NUM)) {
                    // 是需要单独计数和已经触发了的任务

                    if (taskNode.status === TASK_STATS().NORMAL && taskNode.finTypLis && taskNode.finTypLis.indexOf(type) !== -1) { // New Add 任务类型限制判断
                        taskNode.finCntObj = doCounter(type, params, taskNode.finCntObj);
                        doc.taskLis[sTaskId] = taskNode;
                    }
                }
            }
            //data.triggerCountData = doc.triggerCountData;
            //data.taskLis = doc.taskLis;
        //} else {
        //    data.triggerCountData = doCounter(type, params, data.triggerCountData);
        //}

        // GameDB.updateOne(TABLE_TASKDATA, {$set: data}, {uuid: uuid}, () => {
        //if (doc == null) doc = {};
        //var _taskdata = Object.assign(doc, data);
        //GameRedisHelper.setHashFieldValue(TABLE_TASKDATA, uuid, JSON.stringify(_taskdata), () => {
        setSourceTaskData(uuid, doc, () => {
            callback();
        }, save);
    });
}

// paramGroup = [{ params, num }]
/*
568
* [
                    {params: [110001], num: 3},
                    {params: [110002], num: 3},
                    {params: [110003], num: 3},
                    {params: [110004], num: 3},
                    {params: [110005], num: 3},
                    {params: [110006], num: 3},
                    {params: [110007], num: 3}*/
//新增
function addTaskCounterGroup(taskData, uuid, type, paramGroup, callback, add = true) {
    function doCounter(ctype, params, num, countData) {
        function equalParam(idsA, idsB) {
            if (idsA.length !== idsB.length) {
                return false;
            } else {
                for (let i in idsA) {
                    if (idsA[i] !== idsB[i]) {
                        return false;
                    }
                }

                return true;
            }
        }

        if (countData[ctype]) {
            isFind = false;
            for (let i in countData[ctype]) {
                var countNode = countData[ctype][i];
                if (equalParam(countNode.ids, params)) {
                //if (JSON.stringify(countNode.ids) === JSON.stringify(params)) {
                    // 说明ids相等
                    if (add) {
                        countData[ctype][i].num += num;
                    } else {
                        // 是直接设置的
                        countData[ctype][i].num = num;
                    }

                    isFind = true;
                }
            }

            if (!isFind) {
                countData[ctype].push({
                    ids: params,
                    num: num
                });
            }
        } else {
            countData[ctype] = [];
            countData[ctype].push({
                ids: params,
                num: num
            });
        }

        return countData;
    }

    var save = taskData ? false : true;

    if (paramGroup.length > 0) {
        getSourceTaskData(uuid, taskData, doc => {
            // 处理触发计数存储
            // { 'type': [{ ids:[], num }] }
            //var data = {triggerCountData: {}, taskLis: {}}
            for (let i in paramGroup) {
                if (paramGroup[i].params.length < 2) paramGroup[i].params.push(0); // 补齐[x, 0]
                if (doc) {
                    //if (!doc.triggerCountData) doc.triggerCountData = {};
                    doc.triggerCountData = doCounter(type, paramGroup[i].params, paramGroup[i].num, doc.triggerCountData);

                    // 处理完成计数处理（playerTasks）
                    var taskIdLis = Object.keys(doc.taskLis); // taskLis = taskObj
                    for (let sTaskId of taskIdLis) {
                        var taskNode = doc.taskLis[sTaskId];
                        if (!taskNode.cntFlag && (taskNode.tgIdxLis.length === TRIGGER_CONDITION_NUM)) {
                            // 是需要单独计数和已经触发了的任务
                            if (taskNode.status === TASK_STATS().NORMAL && taskNode.finTypLis && taskNode.finTypLis.indexOf(type) !== -1) { // New Add 任务类型限制判断
                                taskNode.finCntObj = doCounter(type, paramGroup[i].params, paramGroup[i].num, taskNode.finCntObj);
                                doc.taskLis[sTaskId] = taskNode;
                            }
                        }
                    }

                    //data.triggerCountData = doc.triggerCountData;
                    //data.taskLis = doc.taskLis;
                } /*else {
                    data.triggerCountData = doCounter(type, paramGroup[i].params, paramGroup[i].num, data.triggerCountData);
                }*/
            }
            setSourceTaskData(uuid, doc, () => {
                callback();
            }, save);
        });
    } else {
        callback({});
    }
}

/**
 * checkTaskStatValid - 验证任务状态
 * @param {*} uuid
 * @param {*} taskId
 * @param {*} callback
 */
function checkTaskStatValid(uuid, taskId, callback, taskData) {
    /*
    Tasks.getParentTaskToSubTaskGroupConfig([taskId], subTaskGroup => {
            var playerTasks = taskData.taskLis;
        //getPlayerTasks(uuid, playerTasks => {
            var errCode = ERRCODES().SUCCESS;
            for (let taskId of subTaskGroup) {
                if (playerTasks[taskId]) {
                    if (playerTasks[taskId].status === TASK_STATS().REWARDED) {
                        // 说明已领取（只需判断一个子任务就行，因为领取全部一起领取了）
                        errCode = ERRCODES().TASK_AWARD_GETED;
                        break;
                    }

                    if (playerTasks[taskId].status < TASK_STATS().COMPLETE) {
                        errCode = ERRCODES().TASK_NOT_COMPLETE;
                        break;
                    }
                } else {
                    // 客户端参数问题
                    errCode = ERRCODES().PARAMS_ERROR;
                }
            }

            callback(errCode);
        //});
    });*/

    if (taskData) {
        var playerTasks = taskData.taskLis;
        var taskGroup = Tasks.getSubTaskList(taskId);
        var errCode = ERRCODES().SUCCESS;
        if (Array.isArray(taskGroup)) {
            for (let tskId of taskGroup) {
                if (playerTasks[tskId]) {
                    // 只要任务组中有一个子任务为非完成状态，就无法领取
                    if (playerTasks[tskId].status != TASK_STATS().COMPLETE) {
                        errCode = ERRCODES().TASK_NOT_COMPLETE;
                        break;
                    }
                } else {
                    errCode = ERRCODES().FAILED;
                    break;
                }
            }
        } else {
            // 没有该任务ID（非法）
            errCode = ERRCODES().PARAMS_ERROR;
        }

        callback(errCode);
    } else {
        callback(ERRCODES().FAILED);
    }
}

function setTaskStat(uuid, taskId, callback, taskData) {
    Tasks.getParentTaskToSubTaskGroupConfig([taskId], subTaskGroup => {
        var playerTasks = taskData.taskLis;
        //getPlayerTasks(uuid, playerTasks => {
            var retTasks = {};
            for (let taskId of subTaskGroup) {
                if (playerTasks[taskId]) {
                    playerTasks[taskId].status = TASK_STATS().REWARDED;
                    retTasks[taskId] = playerTasks[taskId];
                }
            }

            taskData.taskLis = playerTasks;

            //setPlayerTasks(uuid, playerTasks, () => {
                callback(adjustTaskList(retTasks));
            //});
        //});
    });
}

// ========================================================= cycle
/**
 * updateTaskLisByCycle - 周期更新
 * @param {*} uuid
 * @param {*} taskId
 * @param {*} callback
 */
function updateTaskByCycle(uuid, taskGroup, callback, taskData) {
    function isUpdate(cycle, sTime) {
        var now = new Date(),
            dt = new Date(sTime),
            cycleType = cycle.CycleType,
            flag = false;
        if (cycleType === CYCLE_TYPES().DAY) {
            if (!(now.getFullYear() === dt.getFullYear() &&
                now.getMonth() === dt.getMonth() && now.getDate() === dt.getDate())) {
                    flag = true;
                }
        } else if (cycleType === CYCLE_TYPES().WEEK) {
            if (now.getDate() !== dt.getDate() && now.getDay() === dt.getDay()) {
                flag = true;
            }
        } else if (cycleType === CYCLE_TYPES().MONTH) {
            if (now.getMonth() !== dt.getMonth()) {
                flag = true;
            }
        } else if (cycleType === CYCLE_TYPES().YEAR) {
            if (now.getFullYear() !== dt.getFullYear()) {
                flag = true;
            }
        }

        return flag;
    }

    function getTaskGroup(plrTasks, tskGroup) {
        if (tskGroup.length === 0) {
            var keys = Object.keys(plrTasks),
                newTskGroup = [];
            for (let sTaskID of keys) {
                newTskGroup.push(plrTasks[sTaskID].taskId);
            }
            return newTskGroup;
        } else {
            return tskGroup;
        }
    }

    var playerTasks = taskData.taskLis;

    //getPlayerTasks(uuid, playerTasks => {
        Tasks.getParentTaskToSubTaskGroupConfig(getTaskGroup(playerTasks, taskGroup), subTaskGroup => {
            Tasks.getObjTaskAbortCycleByGroupConfig(subTaskGroup, ObjTaskConfig => {
                var retObjTasks = {};

                for (let taskId of subTaskGroup) {
                    if (playerTasks[taskId]) {
                        if (isUpdate(ObjTaskConfig[taskId], playerTasks[taskId].st)) {
                            playerTasks[taskId].cycleCount = 0; // 重置周期计数
                            playerTasks[taskId].finCntObj = {}; // 重置计数器
                            playerTasks[taskId].st = (new Date()).getTime();
                            playerTasks[taskId].status = TASK_STATS().NORMAL;
                            for (let i in playerTasks[taskId].progress) {
                                playerTasks[taskId].progress[i].count = 0;
                            }
                        }

                        retObjTasks[taskId] = playerTasks[taskId];
                    }
                }

                taskData.taskLis = playerTasks;

                //setPlayerTasks(uuid, playerTasks, () => {
                    callback(retObjTasks);
                //});
            });
        });
    //});
}

// ========================================================= condition parser parameters
function parserConditionParams(ConditionConfig, countData) {
    // Condition [type, [param1, ...], num] 或 [type, param, num]
    // countData = { 'type' => [{ ids: [], num }]}
    function paramsValid(OneCondition, cntData) {
        var valid = false,
            type = OneCondition[0],
            param = OneCondition[1],
            num = OneCondition[2];

        var newProgressNode = {flag: 0, num: num, count: 0},
            counterNodeLis = cntData[type]; // 存储的计数器节点（对应枚举类型）
        if (counterNodeLis) {
            if (typeof param === 'object') {
                // 说明是多参数的条件格式[type, [param1, ...], num]
                var param1 = param[0],
                    param2 = param[1],
                    param3 = param[2] ? param[2] : 0,
                    count = 0;

                // 只有参数1为0和参数1、2都不为0两种情形
                if (num === 0) {
                    function checkParam3(ids, p3) {
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

                    // 说明要判断区间
                    for (let i in counterNodeLis) {
                        if (counterNodeLis[i].num >= param1 && counterNodeLis[i].num <= param2 && checkParam3(counterNodeLis[i].ids, param3)) {
                            // 在范围内
                            valid = true;
                            newProgressNode.num = newProgressNode.count = num;
                            break;
                        }
                    }
                } else {
                    if (param1 === 0) {
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

    var valid, success = false, progressNode, progressLis = [];
    if (ConditionConfig.length > 0) {
        if (typeof ConditionConfig[0] === 'object') {
            // 说明是条件或
            for (let i in ConditionConfig) {
                [valid, progressNode] = paramsValid(ConditionConfig[i], countData);
                progressNode.flag = 2; // 条件或
                progressLis.push(progressNode);

                if (valid) {
                    success = true; // 只要有一个条件满足就达成
                }
            }
        } else {
            [success, progressNode] = paramsValid(ConditionConfig, countData);
            progressNode.flag = 1; // 条件与
            progressLis.push(progressNode);
        }
    } else {
        // 说明无条件（直接成功）
        success = true;
    }

    return [success, progressLis];
}

function doTaskTriggerCondition(playerTasks, taskId, triggerCountData, ConditionListConfig) {
    // 验证完成的条件索引（触发条件索引或完成条件索引）
    function checkCompleteCondIdxValid(idxLis, idx) {
        var valid = false;
        for (let i in idxLis) {
            if (idxLis[i] === idx) {
                valid = true; // 说明该条件已被触发
            }
        }

        return valid;
    }

    for (let i = 1; i <= 3; i++) {
        var ConditionConfig = ConditionListConfig['Condition' + i], success, progressLis = [];
        if (!checkCompleteCondIdxValid(playerTasks[taskId].tgIdxLis, i)) {
            // 只对之前未被触发的条件进行判断（注：触发条件不处理progress）
            [success, progressLis] = parserConditionParams(ConditionConfig, triggerCountData);
            if (success) {
                // 成功触发（1条触发条件）
                // 将触发条件索引加入保存，主要是为了减少逻辑判断
                playerTasks[taskId].tgIdxLis.push(i);
            }
        }
    }

    return playerTasks
}

// ========================================================= task doing
/**
 * isTaskExpired - 任务是否过期
 * @param {Object} playerTasks
 * @param {Number} taskId
 */
function isTaskExpired(playerTasks, taskId)
{
    var TaskConfig = Tasks.getTaskNode(taskId);
    if (TaskConfig) {
        if (TaskConfig.Type === TASK_TYPES().FAST) {
            // 紧急任务（需判断时间）
            if (playerTasks[taskId]) {
                // 玩家任务列表存在该任务
                if (playerTasks[taskId].status === TASK_STATS().EXPIRED) {
                    // 该任务已过期
                    return true;
                } else if (playerTasks[taskId].st === 0) {
                    return true; // 该任务未触发（未触发任务一般不会出现在任务列表中）
                } else {
                    // 判断时间
                    var timValid = (new Date().getTime() - playerTasks[taskId].st >= TaskConfig.LongTime);
                    if (timValid) {
                        // 未触发或已过期需要设置任务状态
                        playerTasks[taskId].status = TASK_STATS().EXPIRED;
                    }
                    return timValid;
                }
            } else {
                return true; // 未在玩家任务列表（等同过期）
            }
        } else {
            // 普通任务（直接pass）
            return false;
        }
    } else {
        // 未找到该任务配置数据（等同过期）
        return true;
    }
}

function doTaskByDate(playerTasks, TaskConfig, expiredTasks) {
    // var now = new Date(), skipFlag = false, dateValid = true;
    var skipFlag = false;

    /*
    // 有配置起始时间（需判断）
    if (TaskConfig.StartedAt) {
        if (now < new Date(TaskConfig.StartedAt)) {
            // 任务未到开启时间
            dateValid = false;
        }
    }

    if (dateValid) {
        // 起始时间验证成功
        if (TaskConfig.ExpiredAt) {
            // 有配置截止时间（需判断）
            if (now > new Date(TaskConfig.ExpiredAt)) {
                // 任务已过截止时间
                dateValid = false;
            }
        }
    }

    if (dateValid) {
        // 查询玩家任务列表无该任务，则加入之
        if (!playerTasks[TaskConfig.TaskID]) {
            // 加入新的任务
            playerTasks[TaskConfig.TaskID] = models.TaskNodeModel(TaskConfig.TaskID, null);
            playerTasks[TaskConfig.TaskID].cntFlag = (TaskConfig.TriggerCounterFlag === 1);
            //console.error("--------------->>", TaskConfig, TaskConfig.TriggerCounterFlag, TaskConfig.TriggerCounterFlag === 1);
        }
    } else {
        // 查询玩家任务列表有该任务，则删除之
        if (playerTasks[TaskConfig.TaskID]) {
            skipFlag = true;
            delete playerTasks[TaskConfig.TaskID]; // 将该任务移除
        }
    }*/

    if (!playerTasks[TaskConfig.TaskID]) {
        // 加入新的任务
        playerTasks[TaskConfig.TaskID] = models.TaskNodeModel(TaskConfig.TaskID, null);
        playerTasks[TaskConfig.TaskID].cntFlag = (TaskConfig.TriggerCounterFlag === 1);
    }

    if (TaskConfig.Type === TASK_TYPES().FAST) {
        // 是紧急任务（需判断持续时间）
        if (playerTasks[TaskConfig.TaskID]) {
            if (playerTasks[TaskConfig.TaskID].status === TASK_STATS().EXPIRED) {
                // 状态为已过期
                skipFlag = true;
                expiredTasks.push(TaskConfig.TaskID);
            } else {
                // 判断时间是否过期
                if (playerTasks[TaskConfig.TaskID].st == 0 ||
                        (new Date() - playerTasks[TaskConfig.TaskID].st >= TaskConfig.LongTime)) {
                    skipFlag = true; // 未触发或已过期
                }
            }
        }
    }

    return [skipFlag, playerTasks, expiredTasks];
}

// 处理触发计数
function doTaskByTrigger(playerTasks, triggerCountData, TaskConfig, realTriggerTasks) {
    var skipFlag = false, ConditionLis = {
        Condition1: TaskConfig.TriggerCondition1,
        Condition2: TaskConfig.TriggerCondition2,
        Condition3: TaskConfig.TriggerCondition3
    };
    // 已触发过的任务直接pass
    // 是开启的新任务（根据起止时间），需要触发判断
    // 触发任务，如果是子任务（subTaskFlag===0），需要判断父任务是否已被触发
    function checkTaskGroupValid(plrTasks, TaskCfg) {
        if (TaskCfg.SubTaskFlag === 0) {
            // 说明是子任务（验证父任务是否被触发了）
            /*
            if (plrTasks[TaskCfg.GroupID]) {
                if (plrTasks[TaskCfg.GroupID].tgIdxLis.length === TRIGGER_CONDITION_NUM) {
                    // 父任务真的已被触发了
                    return true;
                } else {
                    // 父任务条件索引不满足（说明父任务还未被触发）
                    return false;
                }
            } else {
                // 父任务未触发
                return false;
            }*/
            return true;
        } else {
            // 说明是父任务
            return true;
        }
    }

    if (playerTasks[TaskConfig.TaskID]) {
        // 是开启的任务
        if (playerTasks[TaskConfig.TaskID].tgIdxLis.length === TRIGGER_CONDITION_NUM) {
            // 已触发过的任务（触发索引表length===3，说明3个条件都满足了被触发了的）
            skipFlag = false;
        } else {
            // 是新的任务，进行任务组的判断
            if (checkTaskGroupValid(playerTasks, TaskConfig)) {
                // 可进行实际的任务触发计数器判断
                playerTasks = doTaskTriggerCondition(playerTasks, TaskConfig.TaskID, triggerCountData, ConditionLis);

                if (playerTasks[TaskConfig.TaskID].tgIdxLis.length < TRIGGER_CONDITION_NUM) {
                    // 该任务未被触发
                    skipFlag = true;

                    delete playerTasks[TaskConfig.TaskID]; // New Add 触发条件未满足，玩家任务列表不存储
                } else {
                    // 该任务被触发
                    playerTasks[TaskConfig.TaskID].st = (new Date()).getTime();
                    //realTriggerTasks[TaskConfig.TaskID] = playerTasks[TaskConfig.TaskID];
                    realTriggerTasks.push(TaskConfig.TaskID);
                }
            } else {
                if (playerTasks[TaskConfig.TaskID]) delete playerTasks[TaskConfig.TaskID];
                skipFlag = true;
            }
        }
    } else {
        // 已没有该任务了（说明时间处理要么未开启，要么已关闭）
        skipFlag = true;
    }

    return [skipFlag, playerTasks, realTriggerTasks];
}

function dealTaskGroupWithFinish(playerTasks, TasksObjConfig, TaskConfig) {
    // 获取子任务列表
    function getSubTaskList(TasksObjCfg, groupId) {
        var subTaskLis = [],
            taskIdLis = Object.keys(TasksObjCfg);
        for (var sTaskId of taskIdLis) {
            if (TasksObjCfg[sTaskId].GroupID === groupId) {
                subTaskLis.push(TasksObjCfg[sTaskId].TaskID);
            }
        }

        return subTaskLis;
    }

    if (TaskConfig.SubTaskFlag === 0) {
        // 子任务
        if (playerTasks[TaskConfig.TaskID].status !== TASK_STATS().COMPLETE) {
            // 子任务未完成父任务不允许是完成状态（有子任务必定存在父任务数据）
            if (playerTasks[TaskConfig.GroupID])
                playerTasks[TaskConfig.GroupID].status = TASK_STATS().NORMAL;
        }
    } else {
        // 父任务（遍历玩家任务列表查询子任务是否完成）
        var subTaskList = getSubTaskList(TasksObjConfig, TaskConfig.GroupID);
        for (let subTaskId of subTaskList) {
            if (subTaskId != TaskConfig.TaskID) {
                if (playerTasks[subTaskId]) {
                    if (playerTasks[subTaskId].status != TASK_STATS().COMPLETE) {
                        // 该子任务未完成
                        playerTasks[TaskConfig.TaskID].status = TASK_STATS().NORMAL;
                    }
                } else {
                    // 不存在该子任务
                    playerTasks[TaskConfig.TaskID].status = TASK_STATS().NORMAL;
                }
            }
        }
    }

    return playerTasks;
}

// 处理完成计数
function doTaskByFinish(playerTasks, TasksObjConfig, TaskConfig, countData, realFinishTasks, progressChangeTasks) {
    // 判断任务的前后progress数据是否一致
    function checkProgressEqual(oldPgs, newPgs) {
        return (JSON.stringify(oldPgs) == JSON.stringify(newPgs));
    }

    var oldProgress = playerTasks[TaskConfig.TaskID].progress;

    if (playerTasks[TaskConfig.TaskID].status === TASK_STATS().NORMAL) {
        // 未完成的任务才需要处理
        var ConditionLis = {
            Condition1: TaskConfig.FinishCondition1,
            Condition2: TaskConfig.FinishCondition2,
            Condition3: TaskConfig.FinishCondition3
        }, counter = 0;

        playerTasks[TaskConfig.TaskID].progress = [];
        for (let i = 1; i <= 3; i++) {
            var ConditionConfig = ConditionLis['Condition' + i], success, progressLis = [];
            [success, progressLis] = parserConditionParams(ConditionConfig, countData);
            // 更新任务的progress
            playerTasks[TaskConfig.TaskID].progress = playerTasks[TaskConfig.TaskID].progress.concat(progressLis);

            if (success) ++counter;
        }

        if (counter === 3) {
            // 说明三个条件都达成，将任务状态设置未完成
            playerTasks[TaskConfig.TaskID].status = TASK_STATS().COMPLETE;
            //realFinishTasks[TaskConfig.TaskID] = playerTasks[TaskConfig.TaskID];
            //realFinishTasks.push(TaskConfig.TaskID);
        }
    }

    playerTasks = dealTaskGroupWithFinish(playerTasks, TasksObjConfig, TaskConfig);

    if (playerTasks[TaskConfig.TaskID].status == TASK_STATS().COMPLETE) {
        realFinishTasks.push(TaskConfig.TaskID);
    } else {
        if (!checkProgressEqual(oldProgress, playerTasks[TaskConfig.TaskID].progress)) {
            // 任务前后progress不一致（说明有变化）
            progressChangeTasks.push(TaskConfig.TaskID);
        }
    }

    return [playerTasks, realFinishTasks, progressChangeTasks];
}

// 创建任务完成类型列表
function createFinishTaskTypeList(playerTasks, taskConfig)
{
    if (taskConfig.TriggerCounterFlag === 0 && !playerTasks[taskConfig.TaskID].finTypLis) {
        // 跟任务计数单独计数，如已生成finTypLis不再做新的处理
        playerTasks[taskConfig.TaskID].finTypLis = [];

        for (let i = 1; i <= 3; i++) {
            var params = taskConfig['FinishCondition' + i];
            if (params.length > 0) {
                if (typeof params[0] === 'object') {
                    // 多条件，格式：[[],...]
                    for (let i in params) {
                        if (params[i].length > 0 && playerTasks[taskConfig.TaskID].finTypLis.indexOf(params[i][0]) === -1) {
                            playerTasks[taskConfig.TaskID].finTypLis.push(params[i][0]);
                        }
                    }
                } else {
                    // 单条件，格式：[]
                    playerTasks[taskConfig.TaskID].finTypLis.push(params[0]);
                }
            }
        }
    }

    return [playerTasks]
}

function getTaskNodeByTaskId(taskData, taskId)
{
    var taskNodeLis = null, objTasks = {}, subLis = Tasks.getSubTaskList(taskId);;
    if (taskData && taskData.taskLis && Array.isArray(subLis)) {
        // 获取父子任务数据
        if (subLis.filter((a) => { return a == taskId; }).length == 0) {
            // 列表中不存在父任务
            subLis.push(taskId);
        }

        for (let tid of subLis) {
            if (taskData.taskLis[tid]) {
                objTasks[tid] = taskData.taskLis[tid];
            }
        }

        taskNodeLis = adjustTaskList(objTasks);
    }

    return taskNodeLis;
}

/**
 * taskListTriggerValid - 任务触发列表验证
 * @param {*} uuid - 玩家ID
 * @param {*} taskGroup - 触发任务组（客户端）
 * @param {*} callback
 */
function taskGroupValid(uuid, taskGroup, callback, taskData) {
    if (JSON.stringify(taskGroup) === '{}') taskGroup = [];

    /*
    function getPlayerTaskGroup(plrTasks) {
        var lis = [];
        var sTaskIdList = Object.keys(plrTasks);
        for (let sTaskId of sTaskIdList) {
            lis.push(parseInt(sTaskId));
        }
        return lis;
    }*/

    var save = taskData ? false : true;

    getSourceTaskData(uuid, taskData, sourceTaskData => {
        var triggerCountData = sourceTaskData.triggerCountData,
            playerTasks = sourceTaskData.taskLis;

        Tasks.getTaskListByGroupIdConfig(taskGroup, nTaskGroup => {
            var newTaskGroup = nTaskGroup;//(taskGroup.length === 0 ? getPlayerTaskGroup(playerTasks) : nTaskGroup);
            Tasks.getTaskObjByGroupConfig(newTaskGroup, TasksObjConfig => {
                var isSkip, expiredTasks = [], realTriggerTasks = [], realFinishTasks = [], progressChangeTasks = []
                // 循环任务（包含主线任务）配表中的任务配置
                var taskIdLis = Object.keys(TasksObjConfig);

                for (let sTaskID of taskIdLis) {

                    var TaskConfig = TasksObjConfig[sTaskID];

                    if (TaskConfig.TaskID === undefined || TaskConfig.TaskID === 0) continue;

                    // 任务时间判断处理
                    [isSkip, playerTasks, expiredTasks] = doTaskByDate(playerTasks, TaskConfig, expiredTasks);
                    if (isSkip) continue; // 该任务未开启或这已关闭，跳过后续处理

                    // 任务触发处理
                    [isSkip, playerTasks, realTriggerTasks] = doTaskByTrigger(playerTasks, triggerCountData, TaskConfig, realTriggerTasks);
                    if (isSkip) continue; // 说明该任务未被触发

                    // New Add 加入计数器类型（Finish）列表，用户减少跟任务走的完成计数数据
                    [playerTasks] = createFinishTaskTypeList(playerTasks, TaskConfig);

                    // 任务完成处理（这里主要是用来更新progress）
                    [playerTasks, realFinishTasks, progressChangeTasks] = doTaskByFinish(playerTasks, TasksObjConfig, TaskConfig,
                        (TaskConfig.TriggerCounterFlag === 1) ? triggerCountData : playerTasks[TaskConfig.TaskID].finCntObj, realFinishTasks, progressChangeTasks);

                }

                // 设置完成触发的任务
                var paramGroup = [];
                for (let i in realFinishTasks) {
                    paramGroup.push({
                        params: [realFinishTasks[i]],
                        num: 1
                    });
                }
                /*
                var finLis = [], tskId;
                Object.keys(realFinishTasks).map((k) => {
                    tskId = Number(k);
                    paramGroup.push({ params: [tskId], num: 1 });
                    finLis.push(tskId);
                });

                var trgLis = [];
                Object.keys(realTriggerTasks).map((k) => {
                    trgLis.push(Number(k));
                });*/

                if (save) taskData = {};
                taskData.triggerCountData = triggerCountData;
                taskData.taskLis = playerTasks; // 引用操作（不需要再callback中返回）
                taskData.openTaskLis = sourceTaskData.openTaskLis;

                //console.error(JSON.stringify(realFinishTaskGroup));

                // ================================================
                // 获取有变动的任务列表
                var updateTasks = {}, modifyTaskLis = [];
                modifyTaskLis = modifyTaskLis.concat(expiredTasks);
                modifyTaskLis = modifyTaskLis.concat(realTriggerTasks);
                modifyTaskLis = modifyTaskLis.concat(realFinishTasks);
                modifyTaskLis = modifyTaskLis.concat(progressChangeTasks);

                for (let taskId of modifyTaskLis) {
                    updateTasks[taskId] = playerTasks[taskId];
                }
                // ================================================

                //addTaskCounterGroup(taskData, uuid, 581, paramGroup, () => {
                    setSourceTaskData(uuid, taskData, () => {
                        callback(adjustTaskList(updateTasks), /*adjustTaskList(realTriggerTasks)*/realTriggerTasks, /*adjustTaskList(realFinishTasks)*/realFinishTasks);
                    }, save);
                //});
            });
        });
    });
}

function getCounterDataByTypeGroup(uuid, typeGroup, callback, taskData=null) {
    getSourceTaskData(uuid, taskData, sourceTaskData => {
        var doc = sourceTaskData;
        var obj = {};
        if (doc) {
            for (let type of typeGroup) {
                if (doc.triggerCountData[type])
                    obj[type] = doc.triggerCountData[type];
            }
        }
        callback(obj);
    });
}

// 验证章节开启相关判断（改任务为主线任务前提下）
function checkMainChapterValid(uuid, taskId, callback, taskData) {
    Tasks.checkMainTaskValid(taskId, mainTaskValid => {
        if (mainTaskValid) {
            /*
            // 是主线的任务（章节）
            // 需要判断的是子任务列表（因为playerTasks中存的都是子任务）
            MainChapterTaskConfig.getChapterValidFinishTaskLisConfig(taskId, ValidFinishTaskList => {
                Tasks.getParentTaskToSubTaskGroupConfig(ValidFinishTaskList, newValidFinishTaskList => {
                    var playerTasks = taskData.taskLis;
                    var valid = true;
                    for (let taskId of newValidFinishTaskList) {
                        if (playerTasks[taskId]) {
                            if (playerTasks[taskId].status === TASK_STATS().NORMAL) {
                                valid = false;
                                break;
                            }
                        } else {
                            valid = false;
                            break;
                        }
                    }

                    callback(valid);
                });
            });*/

            checkTaskChapterOpen(uuid, taskId, openRet => {
                callback(openRet);
            }, taskData);
        } else {
            callback(0); // 非主线任务直接放行
        }
    });
}

function getTaskBonus(taskId, callback) {
    //Tasks.getParentTaskToSubTaskGroupConfig([taskId], subTaskGroup => {
        Tasks.getBonusByGroupConfig([taskId], callback);
    //});
}

// 判断任务是否完成
function checkTaskComplete(playerTasks, taskId)
{
    // 如果是父任务需要转成子任务
    var subTaskLis = Tasks.getMainSubTaskList(taskId), ret = true;
    if (subTaskLis.length > 0) {
        for (let subTaskId of subTaskLis) {
            ret = playerTasks[subTaskId] ? playerTasks[subTaskId].status > TASK_STATS().NORMAL : false;
            if (!ret)
                break;
        }
    } else {
        ret = playerTasks[taskId] ? playerTasks[taskId].status == TASK_STATS().COMPLETE : false;
    }

    return ret;
}

/**
 * checkChapterTaskUnlockAll - 章节任务是否全部开启
 * @param {*} chapId
 * @param {*} openLis
 */
function checkChapterTaskUnlockAll(chapId, openLis, playerTasks, extra=false)
{
    var taskLis = MainChapterTaskConfig.getChapterTaskList(chapId, extra), valid = true;
    for (let tid of taskLis) {
        if (openLis.filter((a) => { return (a.tid === tid && checkTaskComplete(playerTasks, tid)); }).length === 0) {
            valid = false;
            break;
        }
    }

    return valid;
}

/**
 * checkPrevChapterTaskUnlock - 判断前置章节任务是否开启
 * @param {*} chapId
 * @param {*} taskId
 * @param {*} openLis
 */
function checkPrevChapterTaskUnlock(chapId, taskId, openLis, playerTasks, extra=false)
{
    function getDealTaskLis(tskLis, tskId) {
        var lis = [];
        for (let tid of tskLis) {
            if (tid === tskId)
                break;

            lis.push(tid);
        }

        return lis;
    }

    var taskLis =  getDealTaskLis(MainChapterTaskConfig.getChapterTaskList(chapId, extra), taskId), valid = true, isFind;
    if (taskLis.length > 0) {
        for (let tid of taskLis) {
            if (openLis.filter((a) => { return (a.tid === tid && checkTaskComplete(playerTasks, tid)); }).length === 0) {
                valid = false;
                break;
            }
        }
    } else {
        // 任务章节列表为空
        valid = false;

        //if (!extra) {
            // 可能隔章，需判断前一章任务是否全部完成
            var prevChapId = MainChapterTaskConfig.getPrevChapterId(taskId);
            if (prevChapId > 0) {
                valid = checkChapterTaskUnlockAll(prevChapId, openLis, playerTasks, false);
            }
        //}
    }

    return valid;
}

/**
 * checkTaskChapterOpen - 判断任务章节是否开启
 * @param {*} uuid
 * @param {*} taskId
 * @param {*} callback
 * @param {*} taskData
 */
function checkTaskChapterOpen(uuid, taskId, callback, taskData=null)
{
    getSourceTaskData(uuid, taskData, taskData => {
        if (!Array.isArray(taskData.openTaskLis)) {
            taskData.openTaskLis = [];
        }

        var valid = 0;
        for (let i in taskData.openTaskLis) {
            if (taskData.openTaskLis[i].tid === taskId) {
                valid = -1; // 已开启
                break;
            }
        }

        if (valid === 0) {
            // 判断是否为第一章第一节
            if (MainChapterTaskConfig.isFirstChapterTask(taskId)) {
                // NOTHING TO DO.
            } else {
                // 说明未开启，需判断是否可以开启
                var isExtra = MainChapterTaskConfig.isExtraChapterTask(taskId),
                    chapId = MainChapterTaskConfig.getChapterId(taskId);
                if (chapId > 0) {
                    if (isExtra) {
                        // 番外章节（需要判断正常章节是否全部已解锁并判断是否完成）
                        if (checkChapterTaskUnlockAll(chapId, taskData.openTaskLis, taskData.taskLis)) {
                            // 已全部开启（判断番外开启顺序并判断是否完成）
                            if (!checkPrevChapterTaskUnlock(chapId, taskId, taskData.openTaskLis, taskData.taskLis, true)) {
                                valid = -2;
                            }
                        } else {
                            // 未全部开启
                            valid = -2;
                        }
                    } else {
                        // 普通章节（按顺序判断开启并判断是否完成）
                        if (!checkPrevChapterTaskUnlock(chapId, taskId, taskData.openTaskLis, taskData.taskLis)) {
                            valid = -2;
                        }
                    }
                } else {
                    valid = -3;
                }
            }
        }

        callback(valid);
    });
}

/**
 * addOpenTaskList - 加入新的开启的任务章节
 * @param {*} uuid
 * @param {*} taskId
 * @param {*} callback
 * @param {*} taskData
 * @param {*} save
 */
function addOpenTaskList(uuid, taskId, callback, taskData=null, save=false)
{
    getSourceTaskData(uuid, taskData, taskData => {
        if (!Array.isArray(taskData.openTaskLis)) {
            taskData.openTaskLis = [];
        }

        var chapId = MainChapterTaskConfig.getChapterId(taskId), newNode = null;
        if (chapId > 0) {
            newNode = {
                cid: chapId,
                tid: taskId,
                st: new Date().getTime()
            };
            taskData.openTaskLis.push(newNode);
        }
   
        setSourceTaskData(uuid, taskData, () => {
            callback(newNode);
        }, save);
    });
}

function autoUnlockTaskChapter(uuid, callback, taskData=null, save=false)
{
    getSourceTaskData(uuid, taskData, taskData => {
        if (!Array.isArray(taskData.openTaskLis) || taskData.openTaskLis.length == 0) {
            taskData.openTaskLis = [];
            var UnlockTaskLis = Tasks.getUnlockChapterTaskListDefault(), st = new Date().getTime();
            for (let i in UnlockTaskLis) {
                taskData.openTaskLis.push({
                    cid: UnlockTaskLis[i].ChapterID,
                    tid: UnlockTaskLis[i].TaskID,
                    st: st
                });
            }

            setSourceTaskData(uuid, taskData, () => {
                callback(taskData.openTaskLis);
            }, save);
        } else {
            callback(taskData.openTaskLis);
        }
    });
}

function checkTaskId(playerTasks, taskId) {
    if (playerTasks != null && 'number' == typeof taskId &&
            'object' == typeof playerTasks[taskId] && 'number' == typeof playerTasks[taskId].status) {
        if (playerTasks[taskId].status == TASK_STATS().COMPLETE) {
            return ERRCODES().SUCCESS;
        } else {
            return ERRCODES().TASK_NOT_COMPLETE;
        }
    } else {
        return ERRCODES().PARAMS_ERROR;
    }
}

exports.TASK_STATS = TASK_STATS;
exports.adjustTaskList = adjustTaskList;
//exports.getTaskData = getTaskData;
exports.addTaskCounter = addTaskCounter;
exports.addTaskCounterGroup = addTaskCounterGroup;
exports.getTaskList = getTaskList;
exports.getTaskNodeByTaskId = getTaskNodeByTaskId;
exports.taskGroupValid = taskGroupValid;
exports.updateTaskByCycle = updateTaskByCycle;
exports.checkTaskStatValid = checkTaskStatValid;
exports.setTaskStat = setTaskStat;
exports.getCounterDataByTypeGroup = getCounterDataByTypeGroup;
exports.checkMainChapterValid = checkMainChapterValid;
exports.getTaskBonus = getTaskBonus;
exports.triggerCounterDefault = triggerCounterDefault;
exports.getTaskDataFromSource = getTaskDataFromSource;
exports.getSourceTaskData = getSourceTaskData;
exports.saveTaskDataFromSource = saveTaskDataFromSource;
exports.setSourceTaskData = setSourceTaskData;

exports.checkTaskChapterOpen = checkTaskChapterOpen;
exports.addOpenTaskList = addOpenTaskList;
exports.autoUnlockTaskChapter = autoUnlockTaskChapter;
exports.isTaskExpired = isTaskExpired;
exports.checkTaskId = checkTaskId;
exports.parserConditionParams = parserConditionParams;
