const express = require("express");
const serverConfig = require('../../config/manage-server');
const favicon = require('serve-favicon');
const path = require('path');
const sign = require('../shared/util/sign');

let app = express();
app.use(favicon(path.join(__dirname, 'image', 'favicon.ico')));

const staticPath = __dirname;
console.log(`staticPath=${staticPath}`);

app.use("/", express.static(staticPath, {maxage: 5000}));
app.use(function (req, res, next) {
    console.log(req.method, req.originalUrl, req.query, req.body);
    next(null);
});

app.listen(serverConfig.port, function (err) {
    if (err) {
        throw err;
    }
    console.log(`静态文件服务器启动OK，${serverConfig.gm_title}, http://127.0.0.1:${serverConfig.port}/`);
});

app.get('/config', function (req, res) {

    res.json(serverConfig);
});

app.get('/relayRequest', function (req, res) {

    const query = req.query;
    sign.addSign(query);
    res.jsonp({code: 200, msg: "success"});
});
