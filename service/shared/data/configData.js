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
 * @param confHost string
 * @param confPort number
 * @constructor
 */
configData.Init = async function (serverType, confHost, confPort) {

    const msg = {
        type: serverType,
    };
    sign.addSign(msg);

    return new Promise(((resolve, reject) => {

        const uri = requestHttp.getUri(confHost, confPort, '/config/get');
        requestHttp.post(uri, msg, function (err, result) {

            // console.debug(`result`, result);
            if (err) {
                throw err;
            }

            try {
                Object.assign(configData, JSON.parse(result));
                resolve(null);
            } catch (e) {
                reject(e);
                throw e;
            }
        });

    })).then(data => {
        // console.log(`done`, data);
    }).catch(err => console.error(err));
};


module.exports = configData;
