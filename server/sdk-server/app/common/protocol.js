const config = require('./../../configs/server.json');
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

function improperResponseSend(code,res,data) {
    data.code = code
    responseSend(res,data)
}

function responseSend(res, data, encrypt = true)
{
    if (config.debug) console.debug("response:", JSON.stringify(data));
    if (encrypt && config.encrypt) {
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
exports.improperResponseSend= improperResponseSend;