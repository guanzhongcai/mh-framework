let router = require('../../shared/server/ExpressServer').Router();
let gatewayController = require('../controller/gatewayController');

module.exports = router;


router.post('/getOneService', function (req, res) {

    let {type, lastAddress} = req.body;

    gatewayController.getOneService(type, lastAddress, function (err, result) {
        console.debug(`type=${type}, lastAddress=${lastAddress}, result=`, result);
        res.json(result);
    })
});
