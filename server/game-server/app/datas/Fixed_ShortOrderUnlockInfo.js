function ShortOrderUnlockInfoData() {
	return Object.freeze({
		1: Object.freeze({ Id:1, OrderType:1, GridId:1, UnlockLevel:1, UnlockCost:'0', LimitedTimeUnlockLevel:1 }),
		2: Object.freeze({ Id:2, OrderType:1, GridId:2, UnlockLevel:1, UnlockCost:'0', LimitedTimeUnlockLevel:1 }),
		3: Object.freeze({ Id:3, OrderType:1, GridId:3, UnlockLevel:1, UnlockCost:'0', LimitedTimeUnlockLevel:10 }),
		4: Object.freeze({ Id:4, OrderType:1, GridId:4, UnlockLevel:10, UnlockCost:'0', LimitedTimeUnlockLevel:20 }),
		5: Object.freeze({ Id:5, OrderType:1, GridId:5, UnlockLevel:20, UnlockCost:'0', LimitedTimeUnlockLevel:30 }),
		6: Object.freeze({ Id:6, OrderType:1, GridId:6, UnlockLevel:30, UnlockCost:'0', LimitedTimeUnlockLevel:40 }),
		7: Object.freeze({ Id:7, OrderType:1, GridId:7, UnlockLevel:40, UnlockCost:'0', LimitedTimeUnlockLevel:50 }),
		8: Object.freeze({ Id:8, OrderType:1, GridId:8, UnlockLevel:50, UnlockCost:'0', LimitedTimeUnlockLevel:60 }),
		9: Object.freeze({ Id:9, OrderType:1, GridId:9, UnlockLevel:60, UnlockCost:'0', LimitedTimeUnlockLevel:80 }),
		1001: Object.freeze({ Id:1001, OrderType:2, GridId:1, UnlockLevel:0, UnlockCost:'0', LimitedTimeUnlockLevel:0 }),
		1002: Object.freeze({ Id:1002, OrderType:2, GridId:2, UnlockLevel:0, UnlockCost:'0', LimitedTimeUnlockLevel:0 }),
		1003: Object.freeze({ Id:1003, OrderType:2, GridId:3, UnlockLevel:10, UnlockCost:'410001,25000-410002,100', LimitedTimeUnlockLevel:0 }),
		1004: Object.freeze({ Id:1004, OrderType:2, GridId:4, UnlockLevel:20, UnlockCost:'410001,25000-410002,100', LimitedTimeUnlockLevel:0 }),
		1005: Object.freeze({ Id:1005, OrderType:2, GridId:5, UnlockLevel:30, UnlockCost:'410001,25000-410002,100', LimitedTimeUnlockLevel:0 }),
		1006: Object.freeze({ Id:1006, OrderType:2, GridId:6, UnlockLevel:40, UnlockCost:'410001,25000-410002,100', LimitedTimeUnlockLevel:0 })
	});
}

const ShortOrderUnlockInfoIndexes = Object.freeze({
	OrderType1:Object.freeze([1,2,3,4,5,6,7,8,9]),
	OrderType2:Object.freeze([1001,1002,1003,1004,1005,1006])
});

exports.ShortOrderUnlockInfoIndexes = ShortOrderUnlockInfoIndexes;
exports.ShortOrderUnlockInfoData = ShortOrderUnlockInfoData;
