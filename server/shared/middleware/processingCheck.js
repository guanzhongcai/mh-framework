/* 
* GZC created on 2020/6/7
* 当前正在处理的请求数目预检
* */
const debug = require('debug')('processingCheck');

let _processing = 0;
let _limit = 1000;

let exp = module.exports;

/**
 *
 * @param limit number 正在处理的队列上限
 * @returns {Function}
 */
exp.check = function (limit = 1000) {

    _limit = limit;
    return function (req, res, next) {
        debug(`req:: route=%s, method=%s, body=%j, query=%j`, req.originalUrl, req.method, req.body, req.query);
        if (_processing >= _limit) {
            debug(`_processing is over ${_limit}`);
            if (req.originalUrl.indexOf('/admin/') === -1) {
                res.status(401).json({code: 401, msg: `_processing is over ${_limit}`});
                return
            }
        }
        _processing += 1;
        next();
    }
};

exp.updateLimit = function (limit) {
    _limit = limit;
};

exp.decrease = function () {
    _processing--;
};

exp.get = function () {
    return _processing;
};
