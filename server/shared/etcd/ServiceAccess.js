/**
 * 服务间的注册和发现
 * by gzc 2019.9.17
 */

const EtcdAccess = require('./EtcdAccess');
const Code = require('../server/Code');
const debug = require('debug')('ServiceAccess');

class ServiceAccess extends EtcdAccess {

    constructor({hosts, username, password, ttl}) {

        super();
        // this.etcdClient = new EtcdAccess().init({hosts, username, password, ttl});
        this.init({hosts, username, password, ttl});
        this.servers = {}; //字典 {serverType: {serverID: {host: "ip address",port: 3010, address..}}
    }

    /**
     * 组etcd的key 默认有反斜杠前缀
     * @param type string 服务类型
     * @param host string 服务地址
     * @param port int 服务端口
     * @returns {string}
     */
    static Name(type, host, port) {

        return type + "@" + host + ":" + port;
    };
}

/**
 * 服务注册
 * @param type string 服务器类型
 * @param server object {host,port,name,address}
 * @param protocol string
 * @returns {Promise<void>}
 */
ServiceAccess.prototype.register = async function (type, server, protocol = "http") {

    const {host, port} = server;
    if (!type || !host || !port) {
        throw `参数错误！${type} ${host} ${port}`;
    }
    server.address = `${protocol}://${host}:${port}`;
    const key = ServiceAccess.Name(type, host, port);
    await this.putWithLease(key, JSON.stringify(server));
    debug(`service register:: ${key} %j`, server);
};

/**
 * 服务发现
 * @param type string
 * @returns {Promise<*>}
 */
ServiceAccess.prototype.discover = async function (type) {

    const self = this;

    let server = self.servers[type] = await self.getAllJson(type);
    console.debug(`service discover:: ${type} %j`, server);

    const key = type + "@";
    self.watchPrefix(key, function (err, result) {
        if (!err && !!result) {
            const {event, key, value} = result;
            switch (event) {
                case "put":
                    server[key] = JSON.parse(value);
                    break;

                case "delete":
                    delete server[key];
                    break;

                default:
                    console.error(`未处理 %j`, result);
                    break;
            }
        }
    });

    return server;
};

/**
 * 获取所有此类型的服务
 * @param type string
 * @returns {*} object
 */
ServiceAccess.prototype.getOne = function (type) {
    const server = this.servers[type];
    if (!server) {
        return console.error(`未配置服务发现type=${type}`);
    }

    let array = Object.values(server);
    let size = array.length;
    if (size === 0) {
        // console.warn(`当前没有可用的服务！type=${type}`);
        return
    }

    if (size > 1) {
        array.sort(function (a, b) {
            return a.processing - b.processing;
        });
    }
    const {host, port, address} = array[0];
    return {host, port, address};
};

/**
 *
 * @param type string
 * @param host string
 * @param port number
 * @returns {Promise<void>}
 * @constructor
 */
ServiceAccess.prototype.Delete = async function (type, {host, port}) {

    const key = ServiceAccess.Name(type, host, port);
    await this.delete(key);
};

ServiceAccess.prototype.Close = function () {

    this.close();
};

ServiceAccess.prototype.getAllService = async function () {

    let s = {};
    const keys = Object.keys(Code.ServiceType);
    for (const key of keys) {
        s[key] = await this.getAllJson(key + "@");
    }
    return s;
};

module.exports = ServiceAccess;
