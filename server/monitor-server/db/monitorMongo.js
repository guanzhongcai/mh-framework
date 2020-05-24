const MongoAccess = require("../../shared/mongo/MongoAccess");

let Mongo = new MongoAccess();
module.exports = Mongo;

let Schema = Mongo.Schema;

let ErrorReport = new Schema({
    time: {type: Date, default: new Date()}, //入库时间戳
    type: Number, //错误类型
    service: String,
    url: String,
    request: String,
    errMsg: String,
    errStack: String,
    span: Number,
    result: {},
});
ErrorReport.index({time: 1}, {expireAfterSeconds: 10 * 24 * 3600});

let ServiceProfile = new Schema({
    serviceId: {type: String, unique: true},
    time: Number, //入库时间戳
    uptime: Number,
    process: {},
    system: {},
    redis: {},
    mongo: {},
    mysql: {},
    mq: {},
});

Mongo.models = {

    ErrorReport,
    ServiceProfile,
};
