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
 * @constructor
 */
configData.Init = async function (serverType, configAddress) {

    const msg = {
        type: serverType,
    };
    sign.addSign(msg);

    return new Promise(((resolve, reject) => {

        const uri = `${configAddress}/config/get`;
        requestHttp.post(uri, msg, function (err, result) {

            console.debug(`result`, result);
            if (err) {
                throw err;
            }

            try {
                Object.assign(configData, result);
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
