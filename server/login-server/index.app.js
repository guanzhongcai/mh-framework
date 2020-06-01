const app = require('./app/app.init').app;

app.listen(app.get('port'), app.get('host'), () => {
    console.log("==========================================");
    console.log("|             MH LOGIN SERVER            |");
    console.log("==========================================");
    console.log("Server running: http://%s:%s/", app.get('host'), app.get('port'));
});
