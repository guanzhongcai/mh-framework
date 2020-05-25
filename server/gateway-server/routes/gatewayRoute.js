let router = require('../../shared/server/ExpressServer').Router();
const gatewayController = require('../controller/gatewayController');

module.exports = router;


router.post('/test', function (req, res) {

    res.json({code: 200});
});

router.post('/getGameService', function (req, res) {

    gatewayController.getGameService(req.body, function (err, result) {
        res.json(result);
    })
});
