let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/game-server');
const configData = require('../shared/data/configData');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');
const fs = require('fs');

const serverType = Code.ServiceType.game;

let server = new ExpressServer({
    serverType: serverType,
    configAddress: serverConfig.configAddress,
    listen: serverConfig.listen,
});

/**
 * 从配置中心加载配置到本地
 */
function loadConfig() {

    let str = JSON.stringify(configData['server'], null, '\t');
    fs.writeFileSync('./configs/server.json', str, 'utf8');
    str = JSON.stringify(configData['log'], null, '\t');
    fs.writeFileSync('./configs/log.json', str, 'utf8');
}

configData.Init(serverType, serverConfig.configAddress, function (err) {

    loadConfig();
    require('./index.app.js').startServer(server.app, function (err) {
        const discoverServers = [];

        server.InitServer(dbAccess.InitDB, discoverServers).then(async function () {

            server.EnableErrorHandler();
        });

    });

    process.on('SIGINT', function () {

        server.GracefulStop(dbAccess.Close);
    });
});

module.exports = server;


