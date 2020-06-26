/* 
* GZC created on 2020/5/25
*  
* */
const Code = require('../../shared/server/Code');

let controller = module.exports;

/**
 * 获取login和game的服务地址
 * @returns {{loginServInfo: {host, port, address}, gameServInfo: {host, port, address}}}
 */
controller.getServices = function () {

    const app = require('../app');
    const loginServInfo = app.serviceAccess.getOne(Code.ServiceType.login);
    const gameServInfo = app.serviceAccess.getOne(Code.ServiceType.game);
    const payServInfo = app.serviceAccess.getOne(Code.ServiceType.pay);

    return {loginServInfo, gameServInfo, payServInfo};
};

