let ExpressServer = require("../shared/server/ExpressServer");
const serverConfig = require('../../config/monitor-server');
const dbAccess = require('./db/dbAccess');
const Code = require('../shared/server/Code');
let configData = require('../shared/data/configData');

const serverType = Code.ServiceType.monitor;

let server = new ExpressServer({
    serverType: serverType,
    listen: serverConfig.listen,
});

configData.Init(serverType, serverConfig.configAddress, function (err) {

    const discoverServers = [
        Code.ServiceType.login,
        Code.ServiceType.game,
        Code.ServiceType.gateway,
    ];

    server.InitMiddleware();
    server.InitServer(dbAccess.InitDB, discoverServers).then(function () {

        server.AddRouter('/error', require('./routers/error'));
        server.AddRouter('/profile', require('./routers/profile'));
        server.AddRouter('/service', require('./routers/service'));

        server.EnableErrorHandler();

    }).catch(console.error);

    process.on('SIGINT', function () {

        server.GracefulStop(dbAccess.Close);
    });
});

module.exports = server;


