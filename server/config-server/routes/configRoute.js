let router = require('../../shared/server/ExpressServer').Router();
let {configController} = require('../controller');

module.exports = router;


router.post('/get', function (req, res) {

    const {type} = req.body;
    configController.getConfig({type}, function (err, result) {
        console.debug(`type=${type}, result=`, result);
        res.json(result);
    })
});
