let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/serverConfig');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');
let configData = require('../shared/data/configData');

const serverType = Code.ServiceType.monitor;

let server = new ExpressServer({
    serverType: serverType,
    host: serverConfig.publicIP,
    port: serverConfig.listenPort[serverType],
});

configData.Init(serverType, serverConfig.address.config, function (err) {

    const discoverServers = [
        Code.ServiceType.login,
        Code.ServiceType.game,
        Code.ServiceType.gateway,
    ];

    server.InitMiddleware();
    server.InitServer(dbAccess, discoverServers).then(function () {

        server.AddRouter('/error', require('./routers/error'));
        server.AddRouter('/profile', require('./routers/profile'));
        server.AddRouter('/service', require('./routers/service'));

        server.EnableErrorHandler();

    }).catch(console.error);

    process.on('SIGINT', function () {

        server.GracefulStop(true);
    });
});

module.exports = server;


