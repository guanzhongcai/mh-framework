const MongoAccess = require("../../shared/mongo/MongoAccess");

let gameMongo = new MongoAccess();

module.exports = gameMongo;

//数据表模型
let DataSchema = new gameMongo.Schema({
    uuid: {type: Number, unique: true}, //玩家编号
    data: {}, //对象结构数据
});

gameMongo.models = {
    demo: DataSchema,
};

/**
 *
 * @param model string table name
 */
gameMongo.checkModel = function (model) {

    let models = gameMongo.models;
    if (!models[model]) {
        models[model] = DataSchema;

        const name = model.toLowerCase();
        const schema = models[model];
        models[model] = gameMongo._connection.model(model, schema, name);
        console.debug(`construct mongo model success: table=${model}`);
    }
};
