const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet')
const limit = require('express-rate-limit')
const zlib = require('zlib');
const validator = require('validator');
const fs = require('fs')
const formidable = require('express-formidable');

const config = require('./configs/server.json');
const protocol = require('./app/common/protocol');
const tokenHelper = require('./app/common/token')
const redisHelper = require('./app/common/redisHelper');
const GameRedisHelper = new redisHelper(config.gameRedis);
exports.GameRedisHelper = GameRedisHelper;

let FIXDB = {}
app = express();

app.use(formidable());

// 加载配置表进内存
(async ()=>{
    let files = await fs.readdirSync('./app/datas/')
    await Promise.all(files.map(element =>{
        if (!element.startsWith('.')) {
            let perfix = element.split('.')[0]
            let data = require('./app/datas/'+element)
            let fileName =  perfix.split('_')[1]
            let funcName = fileName+ "Data"
            let indexs = fileName + 'Indexes'
            if(data[indexs]) {
                let key = perfix + '_indexes'
                FIXDB[key.toUpperCase()] = data[indexs]
            }
            let loadData = data[funcName]()
            FIXDB[perfix.toUpperCase()] = loadData
        }
    }))
    global.FIXDB = FIXDB
})()

app.set('host', config.host);
app.set('port', config.port);

let conn = require('./app/log/KafkaProducer')
const constant = require('./app/log/constants/index')
const logUtil = require('./app/log/logUtils')(conn)
const logParams = require('./app/log/midderware/index')
app.use(logParams(logUtil, constant, GameRedisHelper))
let tokenUtil = new tokenHelper(GameRedisHelper)
app.use(helmet())
app.use(limit({
    windowMs:15*60*1000,  // 15分钟
    max:1000,             // limit each IP to 1000 requests per windowMs
    statusCode:500,
    message:'too many connection'
}))

app.use(function (req, res, next) {
    if (req.method == 'POST') {
        req.setEncoding('utf8');
        let data = "";
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {
            next ()
        });
    } else {
        next();
    }
});

app.use(compression());

// slog
if (config.debug)
    app.use(morgan('short'));

const domain = require('domain')
app.use((req, res, next) =>{
    const req_domain = domain.create()
    req_domain.on('error',err =>{
        console.log('-----------',err)
        res.status(200).send({code: 500, err: err.stack})
    })
    req_domain.run(next)
})

process.on('uncaughtException',function (err) {
    // 监听异常退出
})

process.on('uncaughtRejectException',function (err) {
    // 监听异步异常退出
})

process.on('exit',function (err) {
})

const RouteMapping = require('./app/mapping');
RouteMapping(app);

app.listen(app.get('port'), app.get('host'), () => {
    console.log("==========================================");
    console.log("|             MH RECHARGE SERVER          |");
    console.log("==========================================");
    console.log("Server running: http://%s:%s/", app.get('host'), app.get('port'));
});
