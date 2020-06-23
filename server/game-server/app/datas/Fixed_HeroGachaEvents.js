function HeroGachaEventsData() {
	return Object.freeze({
		10001: Object.freeze({ eventId:10001, eventType:0, exceptHeroList:'0', bonusList:'10032,1|10033,1|10034,1' }),
		10101: Object.freeze({ eventId:10101, eventType:1, exceptHeroList:'0', bonusList:'10001,1' }),
		10201: Object.freeze({ eventId:10201, eventType:2, exceptHeroList:'0', bonusList:'10035,50|10036,30|10037,20' }),
		10301: Object.freeze({ eventId:10301, eventType:3, exceptHeroList:'0', bonusList:'10002,1' }),
		10401: Object.freeze({ eventId:10401, eventType:4, exceptHeroList:'0', bonusList:'10003,30|10004,50|10005,20' }),
		10501: Object.freeze({ eventId:10501, eventType:5, exceptHeroList:'0', bonusList:'12019,780|12020,780|12021,780|12022,30|12023,30|12024,30' }),
		10601: Object.freeze({ eventId:10601, eventType:6, exceptHeroList:'0', bonusList:'10029,70|10012,30' }),
		10701: Object.freeze({ eventId:10701, eventType:7, exceptHeroList:'0', bonusList:'10015,30|10030,70' }),
		10801: Object.freeze({ eventId:10801, eventType:8, exceptHeroList:'0', bonusList:'10018,30|10031,70' }),
		10901: Object.freeze({ eventId:10901, eventType:5, exceptHeroList:'0', bonusList:'12025,10|12026,10|12027,10|12028,10|12029,10|12030,10|12031,10|12032,10|12033,10|12034,10|12035,10|12036,10|12037,10|12038,10' }),
		31000102: Object.freeze({ eventId:31000102, eventType:12, exceptHeroList:'0', bonusList:'31000102,1' }),
		31000202: Object.freeze({ eventId:31000202, eventType:12, exceptHeroList:'0', bonusList:'31000202,1' }),
		31000402: Object.freeze({ eventId:31000402, eventType:12, exceptHeroList:'0', bonusList:'31000402,1' }),
		31000502: Object.freeze({ eventId:31000502, eventType:12, exceptHeroList:'0', bonusList:'31000502,1' }),
		31000602: Object.freeze({ eventId:31000602, eventType:12, exceptHeroList:'0', bonusList:'31000602,1' }),
		31000603: Object.freeze({ eventId:31000603, eventType:12, exceptHeroList:'0', bonusList:'31000603,1' }),
		31000702: Object.freeze({ eventId:31000702, eventType:12, exceptHeroList:'0', bonusList:'31000702,1' }),
		31000802: Object.freeze({ eventId:31000802, eventType:12, exceptHeroList:'0', bonusList:'31000802,1' }),
		31000902: Object.freeze({ eventId:31000902, eventType:12, exceptHeroList:'0', bonusList:'31000902,1' }),
	});
}

const HeroGachaEventsIndexes = Object.freeze({
	eventType0:Object.freeze([10001]),
	eventType1:Object.freeze([10101]),
	eventType2:Object.freeze([10201]),
	eventType3:Object.freeze([10301]),
	eventType4:Object.freeze([10401]),
	eventType5:Object.freeze([10501,10901]),
	eventType6:Object.freeze([10601]),
	eventType7:Object.freeze([10701]),
	eventType8:Object.freeze([10801]),
	eventType12:Object.freeze([31000102,31000202,31000402,31000502,31000602,31000603,31000702,31000802,31000902])
});

exports.HeroGachaEventsIndexes = HeroGachaEventsIndexes;
exports.HeroGachaEventsData = HeroGachaEventsData;
