/**
 * 消息debug日志
 */

/**
 *
 * @returns function
 */
module.exports = function (req, res, next) {

    const msg = req.method === "GET" ? req.query : req.body;

    let oldWrite = res.write,
        oldEnd = res.end;

    let chunks = [];

    res.write = function (chunk) {
        chunks.push(chunk);

        oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk)
            chunks.push(chunk);

        let body;
        if (typeof chunk === "string") {
            body = chunk;
            console.warn(`string chunk::`, __filename, chunk);
        } else {
            body = Buffer.concat(chunks).toString('utf8');
        }
        console.debug(`[LogMessage] %s, %j, 请求= %j, 回应= %s`, req.originalUrl, req.user || {}, msg, body);
        oldEnd.apply(res, arguments);
    };

    next();
};
