const config = require('./../../configs/server.config.json');
const zlib = require('zlib');

function encode(data)
{
    return JSON.stringify(data);
}

function decode(data)
{
    return JSON.parse(data);
}

function responseData(httpuuid, uuid)
{
    return {
        httpuuid: httpuuid,
        uuid: uuid,
        code: 200
    }
}

function responseSend(res, data)
{
    if (config.debug) console.debug(JSON.stringify(data));
    if (config.encrypt) {
        zlib.deflate(JSON.stringify(data), (err, buffer) => {
            res.send(buffer.toString('base64'));
        });
    } else {
        res.json(data);
    }
}

exports.encode = encode;
exports.decode = decode;
exports.responseData = responseData;
exports.responseSend = responseSend;