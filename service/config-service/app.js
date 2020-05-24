let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('./config-service');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');

const server_type = Code.ServiceType.config;

let server = new ExpressServer({
    serverType: server_type,
    configServer: serverConfig.configServer,
    listen: serverConfig.listen,
    logs: console.log
});

const discoverServers = [
];

server.InitServer(dbAccess.initDB, discoverServers).then(async function () {

    server.AddRouter('/config', require('./routes/configRoute'));

    server.EnableErrorHandler();

}).catch(console.error);

process.on('SIGINT', function () {

    server.GracefulStop(dbAccess.Close);
});

module.exports = server;


