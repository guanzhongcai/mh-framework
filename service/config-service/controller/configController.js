const Code = require('../../shared/server/Code');
const serverConfig = require('../../../config/config-service');

let logic = module.exports;

logic.getConfig = function ({type}, cb) {

    let result = {
        code: Code.OK,
        config: serverConfig[type],
        etcd: serverConfig.etcd,
    };
    cb(null, result);
};
