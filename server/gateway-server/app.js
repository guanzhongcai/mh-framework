let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/serverConfig');
const configData = require('../shared/data/configData');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');

const serverType = Code.ServiceType.gateway;

let server = new ExpressServer({
    serverType: serverType,
    host: serverConfig.publicIP,
    port: serverConfig.listenPort[serverType],
});

/**
 * 从配置中心加载配置到本地
 */
function loadConfig() {

    const fs = require('fs');
    for (const key in configData) {
        if (key.indexOf('.') === -1) {
            continue;
        }
        const value = configData[key];
        fs.writeFileSync(`./configs/${key}`, value, 'utf8');
        console.log(`save config file=${key}`);
    }
}

configData.Init(serverType, serverConfig.address.config, function (err) {

    loadConfig();
    require('./index.app').startServer(server, function (err) {

        const discoverServers = [
            Code.ServiceType.login,
            Code.ServiceType.game,
        ];

        server.InitServer(dbAccess, discoverServers).then(async function () {

            server.EnableErrorHandler();

        }).catch(console.error);

        process.on('SIGINT', function () {

            server.GracefulStop(true);
        });
    });
});

module.exports = server;


