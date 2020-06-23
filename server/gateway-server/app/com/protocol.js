const config = require('./../../configs/gateway.cfg.json');
const zlib = require('zlib');

function responseSend(res, data)
{
    if (config.debug) console.debug("response:", JSON.stringify(data));
    if (config.encrypt) {
        zlib.deflate(JSON.stringify(data), (err, buffer) => {
            res.send(buffer.toString('base64'));
        });
    } else {
        res.json(data);
    }
}

module.exports = {
    responseSend
}