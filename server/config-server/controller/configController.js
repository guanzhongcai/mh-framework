const Code = require('../../shared/server/Code');
const serverConfig = require('../../../config/config-server');

let logic = module.exports;

logic.getConfig = function ({type}, cb) {

    const config = serverConfig[type];
    if (!config) {
        cb(null, {code: Code.FAIL, msg: `not found service config for type=${type}`});
        return
    }
    let result = {
        code: Code.OK,
        config: serverConfig[type],
        etcd: serverConfig.etcd,
    };
    cb(null, result);
};
