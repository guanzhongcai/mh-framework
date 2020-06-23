const manifest = require('./../../../configs/manifest.json');
const LoginRedisHelper = require('./../../app.init').LoginRedisHelper;

function checkServStatValid(platform, callback)
{
	if ('string' === typeof platform) {
		callback(platform in manifest.serverStatus ? manifest.serverStatus[platform].status : null);
	} else if ('number' === typeof platform) {
		// 兼容性用途（正式不会使用）
		const Platforms = { 1: 'android', 2: 'ios', 3: 'win32' };
		var splatform = Platforms[platform];
		callback(splatform in manifest.serverStatus ? manifest.serverStatus[splatform].status : null);
	} else {
		callback(null);
	}
}

function getOuthUUID(openId, callback)
{
	LoginRedisHelper.getHashFieldValue('OuthData', openId, sOuth => {
		var doc = sOuth ? JSON.parse(sOuth) : null;
		callback(doc ? parseInt(doc.uuid) : 0);
	});
}

function createOuth(data, callback)
{
	LoginRedisHelper.setHashFieldValue('OuthData', data.openid, JSON.stringify(data), () => {
		callback(data);
	});
}

exports.checkServStatValid = checkServStatValid;
exports.getOuthUUID = getOuthUUID;
exports.createOuth = createOuth;
