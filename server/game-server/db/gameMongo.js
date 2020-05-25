const MongoAccess = require("../../shared/mongo/MongoAccess");
const modelData = require('../models/modelData');

let gameMongo = new MongoAccess();

module.exports = gameMongo;

//数据表模型
let DataSchema = new gameMongo.Schema({
    uid: {type: Number, unique: true}, //玩家编号
    obj: {},
});

gameMongo.models = {};

for (let key in modelData.Table) {
    const table = modelData.Table[key];
    gameMongo[table] = DataSchema;
}
