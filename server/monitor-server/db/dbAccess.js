const configData = require('../../shared/data/configData');

const monitorMongo = require('./monitorMongo');

exports.InitDB = function (cb) {

    const url = configData.mongo.uri;
    const options = configData.mongo.options;
    monitorMongo.connect(url, options, monitorMongo.models, cb);
};

exports.Close = function (cb) {

    monitorMongo.Disconnect(cb);
};

