/**
 * web-service framework with express & db-load & graceful stop
 * author gzc
 */

let express = require('express');
let configData = require('../data/configData');
let ServiceAccess = require('../etcd/ServiceAccess');
let compression = require('compression');
const monitor = require('../metrics/monitor');
const reportFormat = require('../metrics/reportFormat');
const requestHttp = require('../http/requestHttp');
const Code = require('./Code');

let checkSign = require('../middleware/checkSign');

class ExpressServer {

    /**
     * 构造器
     * @param serverType string 服务类型
     * @param configAddress string 配置服信息
     * @param listen object {host, port} 本服务对外host和监听端口
     * @param logs object {host, port} 日志模块
     * @param traceEndpoint string 服务链路追踪终点
     */
    constructor({serverType, configAddress, listen, logs, traceEndpoint}) {

        this.serverType = serverType;
        this.configAddress = configAddress;
        this.listen = {
            host: listen.host || "0.0.0.0",
            port: listen.port,
        };

        this.app = express();
        this._serviceId = ServiceAccess.Name(this.serverType, this.listen.host, this.listen.port);
        this._dbMap = new Map(); //name -> dbObject
    }

    static Router() {

        return express.Router();
    }
}

/**
 * 服务启动
 * @param dbInitFunc function 数据库模块初始化启动
 * @param discoverServers array [server1,server2] 要发现的服务
 * @returns {Promise<void>}
 * @constructor
 */
ExpressServer.prototype.InitServer = async function (dbInitFunc, discoverServers) {

    let self = this;
    let {serverType, configAddress, listen} = self;
    const name = ServiceAccess.Name(serverType, listen.host, listen.port);

    await configData.Init(serverType, configAddress);

    self._initMiddleware();

    await execFn(dbInitFunc);
    //初始化service注册etcd中心
    this.serviceAccess = new ServiceAccess(configData.etcd);

    await this._initListen();
    await this.serviceAccess.register(serverType, listen);

    discoverServers.push(Code.ServiceType.monitor);
    for (let server of discoverServers) {
        await this.serviceAccess.discover(server);
    }

    this._initMonitor();

    this.app.use("/admin", require('./routes/admin'));

    console.debug(`service start success: ${name}`);
};

function execFn(fn) {
    if (!fn) {
        return;
    }

    return new Promise((resolve) => {
        fn(resolve)
    });
}

ExpressServer.prototype._initListen = function () {

    const {app, listen} = this;
    let self = this;

    console.debug(`listen`, listen);
    return new Promise((resolve, reject) => {
        self._server = app.listen(listen.port, function (err) {
            if (err) {
                reject(err);
                throw err;
            }
            resolve(null);
        });
    });
};

ExpressServer.prototype._initMonitor = function () {

    if (this.serverType === Code.ServiceType.monitor) {
        return;
    }

    const self = this;

    setInterval(function () {
        monitor.getProfile(function (err, profile) {

            self._dbMap.forEach(function (value, key) {
                profile[key] = value.getProfile();
            });
            profile.time = Date.now();
            profile.serviceId = self._serviceId;
            // console.log(`profile %j`, profile);
            self.NotifyMonitor('/profile/add', profile);
        })
    }, 30 * 1000);
};

/**
 * 初始化默认中间件
 * @private
 */
ExpressServer.prototype._initMiddleware = function () {

    const {serverType, listen, app} = this;

    //终端日志
    app.use(require('../middleware/logger'));

    //http压缩
    app.use(compression({threshold: '10KB'}));

    //消息体解析
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));

    //消息日志
    app.use(require('../middleware/logMessage')(this));

    //签名检查
    app.use(checkSign);
};

ExpressServer.prototype.EnableSerialTask = function (timeoutMs = 20) {

    this.app.use(require('../middleware/serialTask')(timeoutMs));
};

/**
 * 错误处理
 * 必须在加载router之后加载
 * @constructor
 */
ExpressServer.prototype.EnableErrorHandler = function () {

    const {_serviceId, app} = this;
    const self = this;

    app.use(function (req, res, next) {
        res.status(404).json({code: 500, msg: "not found route!" + req.originalUrl});
        next();
    });

    app.use(function (err, req, res, next) {
        console.error('出现错误！', err);
        res.status(500).json({code: 500, msg: err.message || "error happened"});

        const report = reportFormat.ErrorSystem(_serviceId, req, err);
        self.NotifyMonitor('/error/add', report);
    });
};

/**
 *
 * @param route string
 * @param report object
 * @constructor
 */
ExpressServer.prototype.NotifyMonitor = function (route, report) {

    if (this.serverType === Code.ServiceType.monitor) {
        return;
    }

    const service = this.serviceAccess.getOneRandServer(Code.ServiceType.monitor);
    if (!service) {
        console.error(`no monitor-server! %j`, report);
        return;
    }
    const {host, port} = service;
    const uri = requestHttp.getUri(host, port, route);
    require('../util/sign').addSign(report);
    requestHttp.post(uri, report);
};

/**
 * 添加服务路由器
 * @param path string
 * @param func function
 * @constructor
 */
ExpressServer.prototype.AddRouter = function (path, func) {

    this.app.use(path, func);
};

function checkFn(fn) {
    if (!fn) {
        fn = function (cb) {
            cb(null);
        }
    }
    return fn;
}

/**
 * 优雅停止服务前的清理工作
 * @param dbCloseFunc function 数据库关闭函数
 * @constructor
 */
ExpressServer.prototype.GracefulStop = function (dbCloseFunc) {

    let self = this;
    const {serverType, listen} = self;
    self.serviceAccess.Delete(serverType, listen).then(function () {

        self.serviceAccess.Close();

        self._server.close(function (err) {
            console.debug(`[listen] close`);

            dbCloseFunc = checkFn(dbCloseFunc);
            dbCloseFunc(function (err) {
                console.log('Graceful Stop');
                process.exit(0);
            })
        })
    });

    setTimeout(function () {
        console.error(`timeout exit !`);
        process.exit(0);
    }, 2000);
};

/**
 * 按类型获取某组服务器
 * @param type string
 * @returns object
 */
ExpressServer.prototype.getTypeServer = function (type) {

    return this.serviceAccess.servers[type];
};

/**
 * 添加监控的db
 * @param db string 名称
 * @param obj object 已连接的database对象
 */
ExpressServer.prototype.watchDatabase = function (db, obj) {

    if (!obj.getProfile) {
        return console.error(__filename, `add fail！${db} no getProfile method`);
    }

    if (this._dbMap.has(db)) {
        return console.error(__filename, `already added! ${db}`);
    }

    this._dbMap.set(db, obj);
};


process.on('uncaughtException', function (err) {

    console.log('uncaughtException::', err);
});

module.exports = ExpressServer;
