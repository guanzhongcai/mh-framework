function SoulGameCardData() {
	return Object.freeze({
		1: Object.freeze({ CardId:1, CardType:1, WinCards:'2,3,4', DrawCards:'1', LoseCards:'5', WinPopularity:1000, DrawPopularity:600, LosePopularity:200 }),
		2: Object.freeze({ CardId:2, CardType:2, WinCards:'3,5', DrawCards:'2', LoseCards:'1,4', WinPopularity:1200, DrawPopularity:500, LosePopularity:100 }),
		3: Object.freeze({ CardId:3, CardType:3, WinCards:'4,5', DrawCards:'3', LoseCards:'1,2', WinPopularity:1200, DrawPopularity:500, LosePopularity:100 }),
		4: Object.freeze({ CardId:4, CardType:4, WinCards:'2,5', DrawCards:'4', LoseCards:'1,3', WinPopularity:1200, DrawPopularity:500, LosePopularity:100 }),
		5: Object.freeze({ CardId:5, CardType:5, WinCards:'1', DrawCards:'5', LoseCards:'2,3,4', WinPopularity:1400, DrawPopularity:400, LosePopularity:0 })
	});
}

exports.SoulGameCardData = SoulGameCardData;
