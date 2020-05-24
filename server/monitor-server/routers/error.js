let router = module.exports = require("../../shared/server/ExpressServer").Router();
const monitorMongo = require('../db/monitorMongo');

//todo

router.post('/add', function (req, res, next) {

    const body = req.body;
    monitorMongo.create(monitorMongo.models.ErrorReport, body, function (err) {

        res.json({code: 200});
    });
});

router.post('/get', function (req, res, next) {

    let {condition, projection, options} = req.body;
    monitorMongo.models.ErrorReport.find(condition, projection, options, function (err, docs) {

        res.json(docs);
    });
});

router.cleanErrorLogs = function () {

    const condition = {time: {$lt: Date.now() - 7 * 24 * 3600 * 1000}};
    monitorMongo.remove(monitorMongo.models.ErrorReport, condition, function (err, docs) {
        console.log(`cleanErrorLogs`, docs);
    })
};
