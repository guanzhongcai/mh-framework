// ==========================================================
// 任务
// ==========================================================
const utils = require('./../common/utils');
const MainChapterTaskConfig = require('./MainChapterTask');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;
const categoryFromItemListEx = require('./../scripts/controllers/fixedController').categoryFromItemListEx;
let FIX_ACHIEVEMENT = null;
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

class Achievement
{
	
	
	static getAchievementConfigById(aId)
	{
		if(!FIX_ACHIEVEMENT){FIX_ACHIEVEMENT = global.FIX_ACHIEVEMENT}
		return FIX_ACHIEVEMENT[aId];
	}
	
}

module.exports = Achievement;
