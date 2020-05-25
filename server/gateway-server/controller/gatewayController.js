/* 
* GZC created on 2020/5/25
*  
* */
const Code = require('../../shared/server/Code');

let controller = module.exports;

controller.getGameService = function ({lastAddress}, cb) {

    const app = require('../app');
    const type = Code.ServiceType.game;
    const s = app.serviceAccess.getOneRandServer(type, lastAddress || "");
    if (!s) {
        return cb(null, {code: Code.FAIL, msg: `not found type=${type} service`});
    }

    const {host, port, address} = s;
    cb(null, {code: Code.OK, host, port, address});
};
