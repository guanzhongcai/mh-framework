function HeroLevelUpData() {
	return Object.freeze({
		1: Object.freeze({ level:1, minExp:0, maxExp:3750 }),
		2: Object.freeze({ level:2, minExp:3750, maxExp:10000 }),
		3: Object.freeze({ level:3, minExp:10000, maxExp:18500 }),
		4: Object.freeze({ level:4, minExp:18500, maxExp:30000 }),
		5: Object.freeze({ level:5, minExp:30000, maxExp:50000 }),
		6: Object.freeze({ level:6, minExp:50000, maxExp:61250 }),
		7: Object.freeze({ level:7, minExp:61250, maxExp:81250 }),
		8: Object.freeze({ level:8, minExp:81250, maxExp:104250 })
	});
}

exports.HeroLevelUpData = HeroLevelUpData;
