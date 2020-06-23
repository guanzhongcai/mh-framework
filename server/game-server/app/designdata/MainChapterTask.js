// ==========================================================
// 主线章节信息
// ==========================================================
const utils = require('./../common/utils');
let FIXED_MAIN_CHAPTER_TASK = null

class MainChapterTask
{
    // 获取需要验证完成章节（任务）的列表配置
    static getChapterValidFinishTaskLisConfig(taskId, callback)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var taskChapterLis = FIXED_MAIN_CHAPTER_TASK, lis = [];
        for (let node of taskChapterLis) {
            var stop = false;
            var chunks = utils.splitToIntArray(node.ChapterList, ',');
            for (let chapterId of chunks) {
                // 只获取改章节ID之前的全部章节ID
                if (chapterId === taskId) {
                    stop = true;
                    break;
                }

                lis.push(chapterId);
            }

            if (stop) {
                break;
            }
        }

        callback(lis);
    }

    // 是否为番外
    static isExtraChapterTask(taskId)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, taskLis, valid = false;
        for (let node of chapLis) {
            taskLis = utils.splitToIntArray(node.ExtraChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                valid = true;
                break;
            }
        }

        return valid;
    }

    // 是否为第一章第一节
    static isFirstChapterTask(taskId)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, taskLis, valid = false;
        if (chapLis && chapLis[0]) {
            var node = chapLis[0];
            taskLis = utils.splitToIntArray(node.ChapterList, ',');
            if (taskLis[0] === taskId && node.ChapterID === 1) { // 第一章第一节
                valid = true;
            }
        }

        return valid;
    }

    static getChapterId(taskId)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, taskLis, chapId = 0;
        for (let node of chapLis) {
            taskLis = utils.splitToIntArray(node.ChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                chapId = node.ChapterID;
                break;
            }

            taskLis = utils.splitToIntArray(node.ExtraChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                chapId = node.ChapterID;
                break;
            }
        }

        return chapId;
    }

    // 前置章节ID
    static getPrevChapterId(taskId)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, taskLis, prevChapId = 0;
        for (let node of chapLis) {
            taskLis = utils.splitToIntArray(node.ChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                break;
            } else {
                prevChapId = node.ChapterID;
            }

            taskLis = utils.splitToIntArray(node.ExtraChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                break;
            } else {
                prevChapId = node.ChapterID;
            }
        }

        return prevChapId;
    }

    // 任务章节ID（不含番外）
    static getMainChapterId(taskId)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, taskLis, chapId = 0;
        for (let node of chapLis) {
            taskLis = utils.splitToIntArray(node.ChapterList, ',');
            if (taskLis.filter((a) => { return a === taskId; }).length > 0) {
                chapId = node.ChapterID;
                break;
            }
        }

        if (chapId === 0) {
            console.warn("[MainChapterTask][getMainChapterId] This task's chapter can't find:", taskId);
        }

        return chapId;
    }

    // 获取章节列表
    static getChapterTaskList(chapId, extra=false)
    {
        if(!FIXED_MAIN_CHAPTER_TASK){FIXED_MAIN_CHAPTER_TASK = global.FIXDB.FIXED_MAINCHAPTERTASK}
        var chapLis = FIXED_MAIN_CHAPTER_TASK, node = null;
        for (let i in chapLis) {
            if (chapLis[i].ChapterID === chapId) {
                node = chapLis[i];
                break;
            }
        }

        if (node) {
            return utils.splitToIntArray(extra ? node.ExtraChapterList : node.ChapterList, ',');
        } else {
            console.warn("[MainChapterTask][getChapterTaskList] Can't find task chapter:", chapId);
            return [];
        }
    }
}

module.exports = MainChapterTask;
