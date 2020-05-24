/**
 * 服务的操作：查询、下线等
 */
let router = module.exports = require("../../shared/server/ExpressServer").Router();
const monitorMongo = require('../db/monitorMongo');

router.post('/test', function (req, res, next) {

    if (Object.keys(req.body).length === 0){
        throw new Error(`need param!`);
    }
    res.json({code: 200, body: req.body});
});
