/**
 * admin api
 */

let router = require('../ExpressServer').Router();
let command = require('../../metrics/command');

module.exports = router;

router.post('/commandMetricGet', function (req, res) {

    res.json({code: 200, data: command.get()});
});

router.post('/healthCheck', function (req, res) {

    res.json({code: 200, msg: "health success"});
});

router.post('/stopService', function (req, res) {

    res.json({code: 200, msg: "stop success"});

    const {force} = req.body;
    router.server.GracefulStop(Number(force));
});

router.bindServer = function (server) {

    router.server = server;
};
