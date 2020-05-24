let router = require('../../shared/server/ExpressServer').Router();
let {configController} = require('../controller');

module.exports = router;


router.post('/get', function (req, res) {

    const {type} = req.body;
    configController.getConfig({type}, function (err, result) {
        res.json(result);
    })
});
