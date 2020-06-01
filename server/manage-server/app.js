const express = require("express");
const serverConfig = require('../../config/serverConfig');
const favicon = require('serve-favicon');
const path = require('path');
const requestHttp = require('../shared/http/requestHttp');

let app = express();
app.use(favicon(path.join(__dirname, 'image', 'favicon.ico')));

const staticPath = __dirname;
console.log(`staticPath=${staticPath}`);

//消息体解析
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/", express.static(staticPath, {maxage: 5000}));
app.use(function (req, res, next) {
    console.log(new Date().toLocaleString(), req.method, req.originalUrl, req.query, req.body);
    next(null);
});

const port = serverConfig.listenPort.manage;
const publicIP = serverConfig.publicIP;
app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log(`静态文件服务器启动OK http://${publicIP}:${port}/`);
});

app.all('/config', function (req, res) {

    res.json({
        monitorAddress: serverConfig.address.monitor,
    });
});

app.all('/relayRequest', function (req, res) {

    const msg = req.method === "GET" ? req.query : req.body;
    let {url, body} = msg;
    if (!body) {
        body = {};
    }
    require('../shared/util/sign').addSign(body);
    requestHttp.post(url, body, function (err, result) {

        res.json(result);
    });
});
