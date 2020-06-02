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
const utils = require('../util/utils');

let checkSign = require('../middleware/checkSign');

class ExpressServer {

    /**
     * 构造器
     * @param serverType string 服务类型
     * @param host string 服务主机
     * @param port string 服务端口
     */
    constructor({serverType, host, port}) {

        this.serverType = serverType;
        this.listen = {
            host: host || "0.0.0.0",
            port: port,
        };

        this.app = express();
        this._serviceId = ServiceAccess.Name(this.serverType, this.listen.host, this.listen.port);
        this._dbMap = new Map(); //name -> dbObject
    }

    static Router() {

        return express.Router();
    }
}

ExpressServer.prototype.UpdateListen = function ({host, port}) {
    if (!!host) {
        this.listen.host = host;
    }
    if (!!port) {
        this.listen.port = port;
    }
    console.debug(`UpdateListen: %j`, this.listen);
};


/**
 * 服务启动
 * @param dbAccess factory object 数据库模块
 * @param discoverServers array [server1,server2] 要发现的服务
 * @returns {Promise<void>}
 * @constructor
 */
ExpressServer.prototype.InitServer = async function (dbAccess, discoverServers) {

    this.dbAccess = dbAccess || {};
    this.serverStatus = Code.ServiceStatus.launching;
    self = this;
    let {serverType, listen} = self;
    const name = ServiceAccess.Name(serverType, listen.host, listen.port);

    await execFn(self.dbAccess.InitDB);
    //初始化service注册etcd中心
    this.serviceAccess = new ServiceAccess(configData.etcd);

    discoverServers.push(Code.ServiceType.monitor);
    for (let server of discoverServers) {
        await this.serviceAccess.discover(server);
    }

    this._initMonitor();

    this.app.use(require('../middleware/responseTime')(this));

    let admin = require('./routes/admin');
    this.app.use("/admin", admin);
    admin.bindServer(this);

    await this._initListen();
    await this.serviceAccess.register(serverType, listen);

    console.debug(`service start success: ${name}`);
    this.ChangeStatus(Code.ServiceStatus.running);
};

function execFn(fn) {
    if (!fn || typeof fn !== "function") {
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
ExpressServer.prototype.InitMiddleware = function () {

    const {serverType, listen, app} = this;

    //终端日志
    app.use(require('../middleware/logger'));

    //http压缩
    app.use(compression({threshold: '10KB'}));

    //消息体解析
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));

    //消息日志
    app.use(require('../middleware/logMessage'));

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
 * @param cb function
 * @constructor
 */
ExpressServer.prototype.NotifyMonitor = function (route, report, cb) {

    if (this.serverType === Code.ServiceType.monitor) {
        utils.invokeCallback(cb, null);
        return;
    }

    const service = this.serviceAccess.getOneRandServer(Code.ServiceType.monitor);
    if (!service) {
        // console.error(`no monitor-server! %j`, report);
        utils.invokeCallback(cb, null);
        return;
    }
    const {host, port} = service;
    const uri = requestHttp.getUri(host, port, route);
    require('../util/sign').addSign(report);
    requestHttp.post(uri, report, cb);
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

/**
 * 优雅停止服务前的清理工作
 * @param force int 是否强制停止服务 1是/0否
 * @constructor
 */
ExpressServer.prototype.GracefulStop = function (force = 0) {

    let self = this;
    const {serverType, listen} = self;
    self.serviceAccess.Delete(serverType, listen).then(function () {

        const report = {
            serviceId: self._serviceId,
        };
        self.NotifyMonitor('/profile/delete', report, function (err) {

            self.serviceAccess.Close();

            self._server.close(async function (err) {
                console.debug(`[listen] close`);
                console.log('Graceful Stop');
                self.ChangeStatus(Code.ServiceStatus.stop);

                if (force) {
                    setTimeout(async function () {
                        await execFn(self.dbAccess.CloseDB);
                        process.exit(0);
                    }, 2500);
                }
            })
        });
    });

    if (force) {
        setTimeout(function () {
            console.error(`timeout exit !`);
            process.exit(0);
        }, 3000);
    }
};

ExpressServer.prototype.ChangeStatus = function (status) {

    this.serverStatus = status;
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
