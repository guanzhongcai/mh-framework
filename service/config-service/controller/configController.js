const Code = require('../../shared/server/Code');

let logic = module.exports;

logic.getConfig = function ({type}, cb) {

    cb(null, {code: Code.OK, type});
};
