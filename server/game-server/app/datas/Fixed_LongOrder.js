function LongOrderData() {
	return Object.freeze([
		Object.freeze({ LevelId:1, NeedValue:100, RewardPool:1, RewardExp:100, BaseCurrency:'410001,100', BaseTime:'1,1', MaxTime:'1,0', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:2, NeedValue:200, RewardPool:1, RewardExp:200, BaseCurrency:'410001,200', BaseTime:'1,1|2,1', MaxTime:'1,0|2,0', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:3, NeedValue:300, RewardPool:1, RewardExp:300, BaseCurrency:'410001,300', BaseTime:'1,2|2,1', MaxTime:'1,0|2,0|3,2', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:4, NeedValue:400, RewardPool:1, RewardExp:400, BaseCurrency:'410001,400', BaseTime:'1,2|2,2', MaxTime:'1,0|2,0|3,2|4,2', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:5, NeedValue:500, RewardPool:1, RewardExp:500, BaseCurrency:'410001,500', BaseTime:'1,2|2,2', MaxTime:'1,0|2,0|3,2|4,2|5,2', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:6, NeedValue:600, RewardPool:1, RewardExp:600, BaseCurrency:'410001,600', BaseTime:'1,2|2,2', MaxTime:'1,0|2,0|3,2|4,2|5,2|6,1', RateProfit:'100,130,200', RateProb:'70,20,10'}),
		Object.freeze({ LevelId:7, NeedValue:700, RewardPool:1, RewardExp:700, BaseCurrency:'410001,1000', BaseTime:'1,2|2,2', MaxTime:'1,0|2,0|3,2|4,2|5,2|6,1|7,1', RateProfit:'100,130,200', RateProb:'70,20,10'})
	]);
}

exports.LongOrderData = LongOrderData;
