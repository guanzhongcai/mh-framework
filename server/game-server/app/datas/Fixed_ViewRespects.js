function ViewRespectsData() {
	return Object.freeze({
		1: Object.freeze({ RespectID:1, RespectType:1, TimeType:1, IntervalDays:1, RefreshHour:7, Rewards:'12039,89|12040,8|12041,3' }),
		2: Object.freeze({ RespectID:2, RespectType:2, TimeType:2, IntervalDays:7, RefreshHour:7, Rewards:'12039,0|12040,80|12041,0' }),
		3: Object.freeze({ RespectID:3, RespectType:2, TimeType:2, IntervalDays:30, RefreshHour:7, Rewards:'12039,0|12040,0|12041,100' }),
		4: Object.freeze({ RespectID:4, RespectType:2, TimeType:2, IntervalDays:100, RefreshHour:7, Rewards:'12039,0|12040,0|12041,100' }),
		5: Object.freeze({ RespectID:5, RespectType:2, TimeType:2, IntervalDays:365, RefreshHour:7, Rewards:'12039,0|12040,0|12041,100' }),
		6: Object.freeze({ RespectID:6, RespectType:3, TimeType:3, IntervalDays:365, RefreshHour:7, Rewards:'12042,100' }),
		7: Object.freeze({ RespectID:7, RespectType:4, TimeType:1, IntervalDays:3, RefreshHour:7, Rewards:'12039,89|12040,8|12041,3' }),
		8: Object.freeze({ RespectID:8, RespectType:4, TimeType:1, IntervalDays:7, RefreshHour:7, Rewards:'12039,0|12040,80|12041,0' }),
		9: Object.freeze({ RespectID:9, RespectType:4, TimeType:1, IntervalDays:30, RefreshHour:7, Rewards:'12039,0|12040,0|12041,100' })
	});
}

const ViewRespectsIndexes = Object.freeze({
	RespectType1:Object.freeze([1]),
	RespectType2:Object.freeze([2,3,4,5]),
	RespectType3:Object.freeze([6]),
	RespectType4:Object.freeze([7,8,9])
});

exports.ViewRespectsIndexes = ViewRespectsIndexes;
exports.ViewRespectsData = ViewRespectsData;
