const Code = require('../../shared/service/Code');

let logic = module.exports;

logic.getConfig = function ({type}, cb) {

    cb(null, {code: Code.OK, type});
};
