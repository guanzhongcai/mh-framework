function ActivityData() {
	return Object.freeze({
		1: Object.freeze({ Id:1, ActiveId:1, Type:1, Param1:'1', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'310003|10002|10003|10004', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		2: Object.freeze({ Id:2, ActiveId:2, Type:3, Param1:'1', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		3: Object.freeze({ Id:3, ActiveId:2, Type:3, Param1:'2', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		4: Object.freeze({ Id:4, ActiveId:2, Type:3, Param1:'3', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		5: Object.freeze({ Id:5, ActiveId:2, Type:3, Param1:'4', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		6: Object.freeze({ Id:6, ActiveId:2, Type:3, Param1:'5', Param2:'', Param3:'', Param4:'', RewardType:1, Reward:'31000402|31000602|31000702|31001202', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		7: Object.freeze({ Id:7, ActiveId:2, Type:3, Param1:'6', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		8: Object.freeze({ Id:8, ActiveId:2, Type:3, Param1:'7', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'10002', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' }),
		9: Object.freeze({ Id:9, ActiveId:3, Type:2, Param1:'2', Param2:'', Param3:'', Param4:'', RewardType:0, Reward:'', OpenType:1, OpenTime:'', EndTime:'', CloseTime:'' })
	});
}

const ActivityIndexes = Object.freeze({
	Type1:Object.freeze([1]),
	Type3:Object.freeze([2,3,4,5,6,7,8]),
	Type2:Object.freeze([9])
});

exports.ActivityIndexes = ActivityIndexes;
exports.ActivityData = ActivityData;
