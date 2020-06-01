let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/game-server');
const configData = require('../shared/data/configData');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');
const hostInfo = require('./hostInfo');
let port = 8130; //此服务的监听端口

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

function loadArgs() {

    const args = process.argv.splice(2);
    for (let arg of args) {
        const [key, value] = arg.split("=");
        if (key === "port") {
            port = Number(value);
            if (!port) {
                throw new Error(`wrong port=${port}`);
            }
        }
    }
}

configData.Init(serverType, serverConfig.configAddress, function (err) {

    loadConfig();
    loadArgs();
    server.UpdateListen({host: hostInfo.publicIP, port});
    require('./index.app.js').startServer(server.app, function (err) {

        const discoverServers = [];
        server.InitServer(dbAccess, discoverServers).then(async function () {

            server.EnableErrorHandler();
        }).catch(console.error);

    });

    process.on('SIGINT', function () {

        server.GracefulStop(true);
    });
});

module.exports = server;


