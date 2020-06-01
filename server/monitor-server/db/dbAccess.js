const configData = require('../../shared/data/configData');

const monitorMongo = require('./monitorMongo');

exports.InitDB = function (cb) {

    return cb(null);
    const url = configData.mongo.uri;
    const options = configData.mongo.options;
    monitorMongo.connect(url, options, monitorMongo.models, cb);
};

exports.CloseDB = function (cb) {

    return cb(null);
    monitorMongo.Disconnect(cb);
};

