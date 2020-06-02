/* 
* GZC created on 2020/5/25
*  
* */
const Code = require('../../shared/server/Code');

let controller = module.exports;

/**
 *
 * @param type string 服务类型
 * @param lastAddress string 形如http://host:port
 * @param cb
 * @returns {*}
 */
controller.getOneService = function (type, lastAddress, cb) {

    type = type || Code.ServiceType.game;
    lastAddress = lastAddress || "";

    const app = require('../app');
    const s = app.serviceAccess.getOneRandServer(type, lastAddress);
    if (!s) {
        return cb(null, {code: Code.FAIL, msg: `not found type=${type} service`});
    }

    const {host, port, address} = s;
    cb(null, {code: Code.OK, host, port, address});
};

/**
 * 获取login和game的服务地址
 * @returns {{loginServInfo: {host, port, address}, gameServInfo: {host, port, address}}}
 */
controller.getServices = function () {

    const app = require('../app');
    const loginServInfo = app.serviceAccess.getOneRandServer(Code.ServiceType.login, "");
    const gameServInfo = app.serviceAccess.getOneRandServer(Code.ServiceType.game, "");

    return {loginServInfo, gameServInfo};
};

