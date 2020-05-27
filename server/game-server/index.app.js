const configData = require('../shared/data/configData');
exports.startServer = function(app, cb) {

    cb(null);

    const compression = require('compression');
    const morgan = require('morgan');
    const config = require('./configs/server.json'); //require('./dataWrapper/configuration.json');
    console.debug(`configData_server`, config.server);
//const handles = require('./handle');
    const zlib = require('zlib');
    const protocol = require('./app/common/protocol');
// const errorCode = require('')
    const helmet = require('helmet')
    const limit = require('express-rate-limit')
// const Database = require('./app/common/database');
// const GameDB = new Database(config.gamedb.url, config.gamedb.dbname, config.gamedb.options);
//const FixedDB = new Database(config.fixedDB.url, config.fixedDB.dbName, config.fixedDB.dbOpts);

    /*
    const mongoHelper = require('./app/common/mongoHelper');
    const GameDBHelper = new mongoHelper(config.gamedb);
    exports.GameDBHelper = GameDBHelper;*/
    const tokenHelper = require('./app/common/token')
    const redisHelper = require('./app/common/redisHelper');
    const fixTask = require('./app/scripts/controllers/fixTaskController')
    const GameRedisHelper = new redisHelper(config.gameRedis);
    exports.GameRedisHelper = GameRedisHelper;
    const fs = require('fs')
    let FIXDB = {}

    // 加载配置表进内存
    let files = fs.readdirSync('./app/datas/')
    files.map(element =>{
        if (!element.startsWith('.')) {
            let perfix = element.split('.')[0]
            let data = require('./app/datas/'+element)
            let fileName =  perfix.split('_')[1]
            let funcName = fileName+ "Data"
            let indexs = fileName + 'Indexes'
            if(data[indexs]){
                let key = perfix + '_indexes'
                FIXDB[key.toUpperCase()] = data[indexs]
            }
            let loadData = data[funcName]()
            FIXDB[perfix.toUpperCase()] = loadData
        }
    })
    global.FIXDB = FIXDB
    //配置表加载完成...
    let FIX_TASK = new fixTask()
    global.FIX_TASK = FIX_TASK.loadFixData()
    // 初始化
    global.FIX_INIT_TASKDATA = FIX_TASK.initTask()
    console.debug(`FIXDB size=%d`, Object.keys(FIXDB).length);

    app.set('host', config.host);
    app.set('port', config.port);
    let conn = require('./app/log/KafkaProducer')
    const constant = require('./app/log/constants/index')
    const logUtil = require('./app/log/logUtils')(conn)
    const logParams = require('./app/log/midderware/index')
    app.use(logParams(logUtil,constant,GameRedisHelper))
    let tokenUtil = new tokenHelper(GameRedisHelper)
    app.use(helmet())
    app.use(limit({
        windowMs:15*60*1000,  // 15分钟
        max:1000,               // limit each IP to 1000 requests per windowMs
        statusCode:500,
        message:'too many connection'
    }))



    /*
    function mapping()
    {
        let keys = Object.keys(handles.routeTable);
        for (let i = 0; i < keys.length; i++) {
            app.post(keys[i], function (req, res) {
                if (keys[i] === '/fetchservertime') {
                    handles.routeTable[keys[i]](res, req, req.body);
                } else {
                    if (req.body.token) {

                        GameDB.findOne('UserData', ['token'], { uuid: req.body.uuid }, auth => {
                            if (auth && auth.token) {
                                if (auth.token == req.body.token) {
                                    handles.routeTable[keys[i]](res, req, req.body);
                                } else {
                                    res.end(JSON.stringify({code:999}));
                                }
                            } else {
                                handles.routeTable[keys[i]](res, req, req.body);
                            }
                        });
                    } else {
                        handles.routeTable[keys[i]](res, req, req.body);
                    }
                }
            });
        }

        let getkeys = Object.keys(handles.getRouteTable);
        for (let i = 0; i < getkeys.length; i++) {
            app.get(getkeys[i], function (req, res) {
                handles.getRouteTable[getkeys[i]](res, req);
            });
        }
    }*/

    const tokenEnabled = true;

    function checkToken(url, uuid, token, callback, enabled)
    {
        if (enabled) {
            if (token && url != '/fetchservertime') {
                if(tokenUtil.verifyToken(token)){
                    // token 校验成功 刷新 token
                    tokenUtil.freashToken(uuid,token)
                    tokenUtil.existToken(uuid).then(element =>{
                        if(element === 1){
                            callback(true)
                        }else{
                            callback(1)
                        }
                    }).catch(e=>{
                        callback(false)
                    })
                }else{
                    callback(false)
                }
            } else {
                callback(true);
            }
        } else {
            callback(true);
        }
    }

    app.use(function (req, res, next) {
        if (req.method == 'POST') {
            req.setEncoding('utf8');
            let data = "";
            req.on('data', function (chunk) {
                data += chunk;
            });

            req.on('end', function () {
                if (config.encrypt) {
                    var compressed = Buffer.from(data, 'base64');
                    zlib.inflate(compressed, (err, buffer) => {
                        if (err) {
                            console.error(err);
                        } else {
                            try {
                                req.body = JSON.parse(buffer.toString());
                                if (config.debug) console.debug("\nrequest:", buffer.toString());
                                checkToken(req.url, req.body.uuid, req.body.token, tokenValid => {
                                    if(tokenValid === 1){
                                        return protocol.responseSend(res, { code: 999 });
                                    }
                                    if (tokenValid && tokenValid !== 1 ) {
                                        next();
                                    } else {
                                        protocol.responseSend(res, { code: 999 });
                                        //res.json({ code: 999 });
                                    }
                                }, tokenEnabled);
                            } catch (e) {
                                console.error('Encrypt illegal json format: '+e);
                            }
                        }
                    });
                } else {
                    if (config.debug) console.debug("\nrequest:", data);
                    try {
                        req.body = JSON.parse(data);
                        checkToken(req.url, req.body.uuid, req.body.token, tokenValid => {
                            if(tokenValid === 1){
                                return protocol.responseSend(res, { code: 400 });
                            }
                            if (tokenValid && tokenValid !== 1) {
                                next();
                            } else {
                                res.json({ code: 999 });
                            }
                        }, tokenEnabled);
                    } catch (e) {
                        console.error('Illegal json format: '+e);
                    }
                }
            });
        } else {
            next();
        }
    });

    app.use(compression());

// exports.GameDB = GameDB;
//exports.FixedDB = FixedDB;

// slog
    if (config.debug)
        app.use(morgan('short'));

//mapping();
    const domain = require('domain')
    app.use((req,res,next) =>{
        const req_domain = domain.create()
        req_domain.on('error',err =>{
            console.log('-----------',err)
            res.status(500).send(err.stack)
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
        console.log("|             MH GAME SERVER             |");
        console.log("==========================================");
        console.log("Server running: http://%s:%s/", app.get('host'), app.get('port'));
    });

}
