let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/gateway-server');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');

const serverType = Code.ServiceType.gateway;

let server = new ExpressServer({
    serverType: serverType,
    configAddress: serverConfig.configAddress,
    listen: serverConfig.listen,
});

const discoverServers = [
    Code.ServiceType.game,
];

server.InitServer(dbAccess.InitDB, discoverServers).then(async function () {

    server.AddRouter('/', require('./routes/gatewayRoute'));

    server.EnableErrorHandler();

}).catch(console.error);

process.on('SIGINT', function () {

    server.GracefulStop(dbAccess.Close);
});

module.exports = server;


