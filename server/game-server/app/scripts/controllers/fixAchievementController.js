const _ = require('lodash')
let Tasks = require('../../designdata/Tasks')
const models = require('../models')

const utils = require('./../../common/utils');




class FixTask {
	constructor() {
	}
	
	formatReward(cond){
		var lis = [];
		if (cond.includes('|')) {
			// 多限制
			let newdata  = utils.splitToIntArray(cond, '|');
			for(let i of newdata){
				if(cond.includes(',')){
					lis.push({id:i[0], count: i[1]})
				}
			}
			
			
		} else {
			if (cond.includes(',')) {
				// [type, param, num]
				let i  = utils.splitToIntArray(cond, ',');
				
				lis.push({id:i[0], count: i[1]})
			}
		}
		
		return lis;
		
	}
	
	forMatCompleteCondition(cond){
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
	
	async initAchievement()
	{
		const FIXED_ACHIEVEMENT = global.FIXDB.FIXED_ACHIEVEMENT
		let achievementIdx =  Object.keys(FIXED_ACHIEVEMENT);
		let initData = {}
		achievementIdx.map(async taskId=> {
			let node =  models.achievementModel(taskId)
			let recordData = FIXED_ACHIEVEMENT[taskId];
			node.AchievementId = recordData.AchievementId
			node.Type = recordData.Type
			node.CompleteCondition = this.forMatCompleteCondition(FIXED_ACHIEVEMENT[taskId].CompleteCondition)
			node.Rewards = this.formatReward(FIXED_ACHIEVEMENT[taskId].Rewards)
			node.RewardsPoint = recordData.RewardsPoint
			node.PreAchivement = recordData.PreAchivement
			node.StartCntCondition = recordData.StartCntCondition
			node.IsHideType = recordData.IsHideType
			initData[taskId] = node
		})
		return initData
	}
}

module.exports = FixTask