let express = require('express');

const serverConfig = require('../../config/serverConfig');
const Code = require('../shared/server/Code');

const serviceType  = Code.ServiceType.config;

let app = module.exports = express();

app.use(require('../shared/middleware/logger'));
app.use(require('body-parser').json());
app.use(require('../shared/middleware/checkSign'));

//路由处理
app.use('/config', require('./routes/configRoute'));

const port = serverConfig.listenPort.config;

app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log(`服务启动成功：serviceType=${serviceType}, port=${port}`);
});
