const views = require('./scripts/views');

function Mapping(app)
{
    app.post('/version', (req, res) => { views.Version(req, res); });
    app.post('/gateway', (req, res) => { views.Gateway(req, res); });
}

module.exports = Mapping;