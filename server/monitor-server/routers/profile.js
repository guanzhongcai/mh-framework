/**
 * 自动抓取记录每个服务的profile信息
 */
let router = module.exports = require("../../shared/server/ExpressServer").Router();
const monitorMongo = require('../db/monitorMongo');

router.post('/add', function (req, res) {

    const body = req.body;
    const condition = {
        serviceId: body.serviceId
    };
    let updateDoc = {$set: {}};
    Object.assign(updateDoc.$set, body);
    monitorMongo.updateOne(monitorMongo.models.ServiceProfile, condition, updateDoc, {upsert: true}, function (err) {

        res.json({code: 200});
    });
});

router.post('/delete', function (req, res) {

    const body = req.body;
    const condition = {
        serviceId: body.serviceId
    };
    monitorMongo.remove(monitorMongo.models.ServiceProfile, condition, function (err) {
        res.json({code: 200});
    });
});

router.post('/get', function (req, res) {

    monitorMongo.find(monitorMongo.models.ServiceProfile, {}, {_id: 0, __v: 0}, function (err, docs) {
        res.jsonp(docs);
    })
});

