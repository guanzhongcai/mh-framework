const request = require('request');
let exp = module.exports;

/**
 *
 * @param host string
 * @param port number
 * @param path 路由
 * @param params object
 * @param protocol string 协议
 * @returns {string}
 */
exp.getUri = function (host, port, path, params = {}, protocol = "http") {

    let uri = `${protocol}://${host}:${port}${path}`;
    if (Object.keys(params).length > 0) {
        uri += '?';
        for (let key in params) {
            const val = typeof (params) === "object" ? JSON.stringify(params[key]) : params[key];
            uri += key + '=' + val;
        }
    }

    return uri;
};
/**
 *
 * @param uri string http://host:port/path
 * @param body object for get request
 * @param cb
 */
exp.post = function (uri, body, cb) {

    // console.debug(`>>> post ${url} %j`, body);
    request({
            method: "POST",
            uri,
            json: true,
            headers: {
                "Content-Type": "application/json",
            },
            body: body
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                // console.log(body) // 请求成功的处理逻辑
            } else {
                console.error('exp.post error:', uri, body, error, body);
            }

            if (cb && typeof (cb) === 'function') {
                cb(error, body);
            }
        });
};
