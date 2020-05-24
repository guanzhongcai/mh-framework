/*
* GZC created on 2020/5/21
*
* */
let handler = module.exports;

handler.initModel = function (model) {
  if (!this._model) {
    this._model = model;
  }
};

/**
 * 操作mongo
 * @param action string findOne/updateMany/aggregate/..
 * @param table string table model
 * @param condition object
 * @param projection object
 * @param updateDoc object
 * @param option object
 * @param cb
 */
handler.execMongo = function ({action, table, condition, projection, updateDoc, option}, cb) {

  function toObject(data) {
    if (!data) {
      return {}
    } else if (typeof (data) === "string") {
      return JSON.parse(data);
    } else {
      return data;
    }
  }

  condition = toObject(condition);
  const _model = this._model[table];
  if (!_model) {
    return cb(null, {code: 500, msg: `no table=${table}`});
  }

  if (!_model[action]) {
    return cb(null, {code: 500, msg: `no action=${action}`});
  }

  switch (action) {
    case 'findOne':
    case 'find':
      projection = toObject(projection);
      _model[action](condition, projection, cb).limit(100);
      break;

    case "updateOne":
    case "updateMany":
      if (!updateDoc) {
        cb(null, {code: Code.FAIL, msg: "miss updateDoc"});
        return;
      }
      option = toObject(option);
      _model[action](condition, updateDoc, option, cb);
      break;

    case "deleteOne":
      _model[action](condition, cb);
      break;

    case 'aggregate':
      _model[action](condition, cb);
      break;

    default:
      cb(null, {code: Code.FAIL, msg: `not handled action=${action}`});
      break;
  }
};
