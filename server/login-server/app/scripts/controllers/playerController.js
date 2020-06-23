const GameDBHelper = require('./../../app.init').GameDBHelper;
const LoginRedisHelper = require('./../../app.init').LoginRedisHelper;
const playerDefault = require('./../../../configs/player.default');
const validator = require('validator');
const initUUID = require('./../../../configs/server.config.json').uuid_index;
const promise = require('util').promisefy


function isSameDay(tim)
{
	var ndate = new Date().toLocaleDateString(),
		tdate = new Date(tim).toLocaleDateString();
	return (ndate == tdate);
}

function createUUID(callback, gwUUID=0)
{
	if (gwUUID > 0) {
		callback(gwUUID); // 已在网关服生成的UUID
	} else {
		LoginRedisHelper.getString('GameCounter:UUID', uuid => {
			if (uuid === null) {
				LoginRedisHelper.setString('GameCounter:UUID', initUUID + 1, () => {
					callback(initUUID + 1);
				});
			} else {
				LoginRedisHelper.addCounter('GameCounter:UUID', newUUID => {
					callback(newUUID);
				});
			}
		});
	}
}

function newPlayer(token, callback, db=null, gwUUID=0)
{
	createUUID(newUUID => {
		var accountDefault = playerDefault.gamedata().account;
		accountDefault.uuid 			= newUUID;
		accountDefault.createtime 		= (new Date()).getTime();
		accountDefault.lastlogintime 	= (new Date()).getTime();
		LoginRedisHelper.setHashFieldValue('UserData', newUUID, JSON.stringify(accountDefault), () => {
			createItemData(newUUID, itemData => {
				createMapData(newUUID, mapData => {
					createHeroData(newUUID, heroData => {
						createDormData(newUUID, dormData => {
							createMailData(newUUID, mailData => {
								accountDefault.ItemData = itemData;
								accountDefault.MapData  = mapData;
								accountDefault.HeroData = heroData;
								accountDefault.Dorm 	= dormData;
								callback(accountDefault);
							}, db);
						}, db);
					}, db);
				}, db);
			}, db);
		});
	}, gwUUID);
}

function getPlayerData(uuid, callback, db=null)
{
	var now = (new Date()).getTime();
	LoginRedisHelper.getHashFieldValue('UserData', uuid, sPlayerData => {
		let playerData = JSON.parse(sPlayerData);
		if (playerData.lastlogintime == null || playerData.lastlogintime === 0) {
			playerData.lastlogintime = now;
		}
		if (!isSameDay(playerData.lastlogintime)) {
			if (playerData.DailyLoginInfo == null) {
				playerData.DailyLoginInfo = {}
			}
			playerData.DailyLoginInfo.loginDayCnt += 1; //增加登陆次数
		}
		playerData.token = now;
		LoginRedisHelper.setHashFieldValue('UserData', uuid, JSON.stringify(playerData), () => {
			getMapData(uuid, mapData => {
				getDormData(uuid, dormData => {
					getStockData(uuid, stockData => {
						getMailData(uuid, mailData => {
							getItemData(uuid, itemData => {
								getHeroData(uuid, heroData => {
									getUserGuideInfo(uuid, guideData => {
										playerData.MapData 		= mapData;
										playerData.Dorm 		= dormData;
										playerData.Stock 		= stockData;
										playerData.Mails 		= mailData;
										playerData.ItemData 	= itemData;
										playerData.HeroData 	= heroData;
										playerData.GuideData  	= guideData;
										callback(playerData);
									});
								}, db);
							}, db);
						}, db);
					}, db);
				}, db);
			}, db);
		});
	});
}


function createItemData(uuid, callback, db=null)
{
	var itemDefault = playerDefault.gamedata().items;
	LoginRedisHelper.setHashFieldValue('ItemData', uuid, JSON.stringify(itemDefault), () => {
		callback(itemDefault);
	});
}

function getItemData(uuid, callback, db=null)
{
	LoginRedisHelper.getHashFieldValue('ItemData', uuid, sItemLis => {
		callback(sItemLis ? JSON.parse(sItemLis) : []);
	});
}

function createMapData(uuid, callback, db=null)
{
	var mapDefault = playerDefault.gamedata().maps;
	let mapData = {};
	mapData.maps = mapDefault;
	LoginRedisHelper.setHashFieldValue('MapData', uuid, JSON.stringify(mapData), () => {
		callback(mapDefault);
	});
}

function getMapData(uuid, callback)
{
	LoginRedisHelper.getHashFieldValue('MapData', uuid, sMapLis => {
		let doc = sMapLis ? JSON.parse(sMapLis) : null;
		if (doc && doc.maps) {
			callback (doc.maps);
		}else {
			callback ([]);
		}
	});
}

function createHeroData(uuid, callback)
{
	var heroDefault = playerDefault.gamedata().mhdatas;
	let heroData = {};
	heroData.mhdatas = heroDefault;
	LoginRedisHelper.setHashFieldValue('HeroData', uuid, JSON.stringify(heroData), () => {
		callback(heroDefault);
	});
}

function verifyHeroWorkStat(uuid, heroLis, callback)
{
	// 获取工作状态墨魂
	var workStatHeroLis = [];
	for (let i in heroLis) {
		if (heroLis[i].workStat == 2) {
			var workHero = heroLis[i];
			workStatHeroLis.push(workHero);
		}
	}

	// 获取订单数据
	LoginRedisHelper.getHashFieldValue('OrderData', uuid, orderRes => {
		var orderHeroId = 0;
		if ('string' == typeof orderRes && validator.isJSON(orderRes)) {
			var orderData = JSON.parse(orderRes);
			orderHeroId = ('number' == typeof orderData.heroId) ? orderData.heroId : 0;
		}

		for (let i = 0; i < workStatHeroLis.length; i++) {
			if (workStatHeroLis[i].hid == orderHeroId) {
				// 是工作状态, 剔除该墨魂嫌疑
				workStatHeroLis.splice(i, 1);
				--i;
				break;
			}
		}
		// 获取生产数据
		var buildingLis = [];
		LoginRedisHelper.getHashFieldValue('WorkData', uuid, workRes => {
			if ('string' == typeof workRes && validator.isJSON(workRes)) {
				var workData = JSON.parse(workRes);
				buildingLis = workData.buildings;
			}
			for (let i = 0; i < workStatHeroLis.length; i++) {
				// 遍历建筑及旗下墨魂队列
				var isFind = false;

				for (let j in buildingLis) {
					var heroGridLis = buildingLis[j].heroGridList;
					for (let k in heroGridLis) {
						if (heroGridLis[k].hid == workStatHeroLis[i].hid) {
							isFind = true; // 确实在工作, 排除嫌疑
							break;
						}
					}
					if (isFind)
						break;
				}
				if (isFind) {
					workStatHeroLis.splice(i, 1);
					--i;
				}
			}
			if (workStatHeroLis.length == 0) {
				// 没有嫌疑
				callback();
			} else {
				for (let i in workStatHeroLis) {
					for (let j in heroLis) {
						if (workStatHeroLis[i].hid == heroLis[j].hid) {
							heroLis[j].workStat = 1; // 空闲
						}
					}
				}
				LoginRedisHelper.setHashFieldValue('HeroData', uuid, JSON.stringify({ mhdatas: heroLis }), () => {
					callback();
				});
			}
		});
	});
}

function getHeroData(uuid, callback)
{
	LoginRedisHelper.getHashFieldValue('HeroData', uuid, sHeroLis => {
		let doc = sHeroLis ? JSON.parse(sHeroLis) : null;
		if (doc && doc.mhdatas) {
			callback (doc.mhdatas);
		}else {
			callback ([]);
		}
	});
}

function getUserGuideInfo(uuid, callback) {
	LoginRedisHelper.getHashFieldValue('UserGuideData', uuid, guideData => {
		let doc = guideData ? JSON.parse(guideData) : {};
		callback (doc);
	});
}

function createDormData(uuid, callback)
{
	var dormDefault = playerDefault.gamedata().dorminfos;
	let dormData = {};
	dormData.dorminfos = dormDefault;
	LoginRedisHelper.setHashFieldValue('Dorm', uuid, JSON.stringify(dormData), () => {
		callback(dormDefault);
	});
}

function getDormData(uuid, callback)
{
	LoginRedisHelper.getHashFieldValue('Dorm', uuid, sDormLis => {
		let doc = sDormLis ? JSON.parse(sDormLis) : null;
		if (doc && doc.dorminfos) {
			callback (doc.dorminfos);
		}else {
			callback ([]);
		}
	});
}

function createMailData(uuid, callback)
{
	var mailDefault = playerDefault.gamedata().mails;
	LoginRedisHelper.setHashFieldValue('Mails', uuid, JSON.stringify(mailDefault), () => {
		callback(mailDefault);
	});
}

function getMailData(uuid, callback)
{
	LoginRedisHelper.getHashFieldValue('Mails', uuid, sMailLis => {
		callback(sMailLis ? JSON.parse(sMailLis) : []);
	});
}

function getStockData(uuid, callback)
{
	LoginRedisHelper.getHashFieldValue('Stock', uuid, sStockLis => {
		let doc = sStockLis ? JSON.parse(sStockLis) : {};
		callback (doc);
	});
}

exports.newPlayer = newPlayer;
exports.getPlayerData = getPlayerData;
