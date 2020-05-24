const utils = require('../util/utils');
const async = require('async');

let mongoUtil = module.exports;

mongoUtil.DEFAULT_PROJECTION = {_id: 0, __v:0};
/**
 * 获取数据-分页
 * @param model collection 表名称
 * @param condition object 查询条件
 * @param sortkey string 排序列名称
 * @param cb
 */
mongoUtil.findByPage = function (model, condition, sortkey, cb) {

    let pid = 0; //主键id

    let iscontinue = true;
    const PAGE_SIZE = 500;

    let sortdata = {};
    sortdata[sortkey] = 1;

    let array = [];

    async.whilst(
        function () {
            return iscontinue;
        },
        function (callback) {

            model.find(condition, {_id: 0}).sort(sortdata).limit(PAGE_SIZE).exec(function (err, docs) {

                // console.log('>>>>', docs.length, PAGE_SIZE);
                for (let doc of docs){
                    const key = doc[sortkey];
                    pid = key > pid ? key : pid;
                }
                array = array.concat(docs);

                if (docs.length < PAGE_SIZE){
                    iscontinue = false;
                }
                callback(null);
            });
        },
        function (err, res) {

            if (!!cb && typeof (cb) === 'function'){
                cb(null, array);
            }
        }
    );

};


mongoUtil.findOne = function (model, condition, projection, cb) {

    if(!cb && typeof projection === 'function') {
        cb = projection;
        projection = {};
    }

    model.findOne(condition, projection, function (err, res) {
        if (err){
            throw err;
        }
        utils.invokeCallback(cb, err, res);
    });
};

const callback = function(err, res, cb){
    if (err){
        throw err;
    }
    utils.invokeCallback(cb, err, res);
};

mongoUtil.count = function(model, condition, cb){

    model.count(condition, function (err, cnt) {
        if (err){
            throw err;
        }
        cb(err, cnt);
    })
};

mongoUtil.find = function (model, condition, projection, cb) {

    if(!cb && typeof projection === 'function') {
        cb = projection;
        projection = {};
    }
    model.find(condition, projection, function (err, res) {
        callback(err, res, cb);
    });
};

mongoUtil.updateOne = function (model, condition, updateDoc, option, cb) {

    if(!cb && typeof option === 'function') {
        cb = option;
        option = {};
    }

    model.updateOne(condition, updateDoc, option, function (err, res) {
        callback(err, res, cb);
    });
};

mongoUtil.updateMany = function (model, condition, updateDoc, option, cb) {

    if(!cb && typeof option === 'function') {
        cb = option;
        option = {};
    }

    model.updateMany(condition, updateDoc, option, function (err, res) {
        callback(err, res, cb);
    })
};

mongoUtil.remove = function (model, condition, cb) {

    if (arguments.length < 2){
        throw new Error("mongoUtil_param_num_error");
    }
    model.deleteMany(condition, function (err, res) {
        callback(err, res, cb);
    })
};

mongoUtil.aggregate = function (model, condition, cb) {

    if (arguments.length < 3){
        throw new Error("mongoUtil_param_num_error");
    }
    model.aggregate(condition, function (err, res) {
        callback(err, res, cb);
    })
};

mongoUtil.create = function (model, doc, cb) {

    if (arguments.length < 2){
        throw new Error("mongoUtil_param_num_error");
    }
    model.create(doc, function (err, res) {
        callback(err, res, cb);
    })
};

mongoUtil.insertMany = function (model, docs, cb) {

    if (arguments.length < 2){
        throw new Error("mongoUtil_param_num_error");
    }
    model.insertMany(docs, function (err, res) {
        callback(err, res, cb);
    })
};

mongoUtil.distinct = function (model, field, condition, cb) {

    if(!cb && typeof condition === 'function') {
        cb = condition;
        condition = {};
    }

    model.distinct(field, condition, function (err, res) {
        callback(err, res, cb);
    });
};


/**
 * 执行mongodb访问model的操作
 * @param model
 * @param msg 操作的选项
 * @param cb
 */
mongoUtil.modelHandleCommand = function(model, msg, cb){

    let {command, condition, options, doc, projection} = msg;

    condition = condition || {};
    options = options || {};
    projection = projection || {_id: 0};

    switch (command) {
        case 'find':
        case 'findOne':
            if (!projection && options){
                projection = options;
            }
            model[command](condition, projection, function(err, docs){
                cb(err, docs);
            });
            break;

        case 'update':
        case 'updateOne':
        case 'updateMany':
            if (!doc){
                cb(null, {code: Code.FAIL, msg: '参数错误，需要传doc更新参数'});
                return;
            }
            model[command](condition, doc, options, function(err, ret){
                if (!err && ret['ok'] == 1 && ret['n'] > 0){
                    cb(null, {code: Code.OK, msg: Code.msg.err_success});
                }
                else {
                    cb(err, ret);
                }
            });
            break;

        case 'remove':
        case 'deleteOne':
        case 'deleteMany':
            if (command === 'remove'){
                command = 'deleteMany';
            }
            model[command](condition, function(err, ret){
                if (!err){
                    cb(null, {code: Code.OK, msg: Code.msg.err_success});
                }
                else {
                    cb(null, {code: Code.FAIL, msg: 'error_mdb'});
                    throw err;
                }
            });
            break;

        case 'create':
            if (!doc){
                cb(null, {code: Code.FAIL, msg: Code.msg.err_param});
                return;
            }
            model[command](doc, function(err, ret){
                if (!err && ret['ok'] == 1 && ret['n'] > 0){
                    cb(null, {code: Code.OK, msg: Code.msg.err_success});
                }
                else {
                    cb(err, ret);
                }
            });
            break;

        case 'aggregate':
            if (!condition){
                cb(null, {code: Code.FAIL, msg: Code.msg.err_param});
                return;
            }
            model[command](condition, function(err, ret){
                cb(err, ret);
            });
            break;

        case 'count':
            model[command](condition, function (err, ret) {
                cb(err, {count: ret});
            });
            break;

        case 'insertMany':
            var docs = msg.docs;
            if (!docs || docs.length == 0){
                cb(null, {code: Code.FAIL, msg: Code.msg.err_param});
                return;
            }
            model[command](docs, function(err, ret){
                if (!err && ret['ok'] == 1 && ret['n'] > 0){
                    cb(null, {code: Code.OK, msg: Code.msg.err_success});
                }
                else {
                    cb(err, ret);
                }
            });
            break;

        case 'distinct':
            var field = msg.field;
            if (!field){
                cb(null, {code: 500, msg: 'no_field'});
                return;
            }
            model[command](field, condition, function (err, array) {
                console.log('distinct', err, array);
                cb(err, array);
            });
            break;

        case 'clone':
            var clone_uid = msg.clone_uid;
            var uid = msg.uid;
            if (!clone_uid || !uid){
                cb(null, {code: Code.FAIL, msg: '要克隆的uid参数错误'});
                return;
            }
            model.find({uid: clone_uid}, {_id: 0, __v: 0}, function(err, array){
                if (array.length === 0){
                    cb(null, {code: Code.FAIL, msg: '克隆的角色的此数据为空！'});
                    return;
                }
                for (var i in array){
                    array[i].uid = uid;
                }
                model.remove({uid: uid}, function(err, docs){
                    model.insertMany(array, function(err, docs){
                        if (!err){
                            cb(null, {code: Code.OK, msg: '操作成功'});
                        }
                        else {
                            cb(null, err);
                        }
                    });
                });
            });
            break;

        default :
            cb(null, {code: Code.FAIL, msg: '不支持的方法::'+command});
            break;
    }

};
