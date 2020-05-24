let router = require('../../shared/server/ExpressServer').Router();

module.exports = router;


router.post('/test', function (req, res) {

    res.json({code: 200});
});
