let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/login-server');
const configData = require('../shared/data/configData');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');

const serverType = Code.ServiceType.login;

let server = new ExpressServer({
    serverType: serverType,
    configAddress: serverConfig.configAddress,
    listen: serverConfig.listen,
});

/**
 * 从配置中心加载配置到本地
 */
function loadConfig() {

    const fs = require('fs');
    const files = ['log.config', 'manifest', 'player.await', 'server.config'];
    for (let file of files){
        let str = JSON.stringify(configData[file], null, '\t');
        fs.writeFileSync(`./configs/${file}.json`, str, 'utf8');
    }
}

configData.Init(serverType, serverConfig.configAddress, function (err) {

    loadConfig();
    require('./app/app.init').startServer(server.app, function (err) {

        const discoverServers = [
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


