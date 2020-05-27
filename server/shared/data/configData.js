const sign = require('../util/sign');
const requestHttp = require('../http/requestHttp');

let configData = {
    redis: {},
    mongo: {
        uri: "",
        options: {},
    },
    etcd: {},
    monitorServer: "http://localhost:5801/",
};

/**
 *
 * @param serverType string
 * @param configAddress string
 * @param cb function
 * @constructor
 */
configData.Init = function (serverType, configAddress, cb) {

    const msg = {
        type: serverType,
    };
    sign.addSign(msg);

    const uri = `${configAddress}/config/get`;
    requestHttp.post(uri, msg, function (err, result) {
        if (err || result.code !== 200) {
            console.error(err);
            console.error(result);
            return process.exit(0);
        }
        console.debug(`[configData] %j`, result);
        if (err) {
            throw err;
        }

        Object.assign(configData, result);
        cb(null);
    });
};


module.exports = configData;
