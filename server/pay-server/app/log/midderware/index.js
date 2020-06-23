const  multiController = require('../../scripts/controllers/multiController')

module.exports = (logServer, Const, GameRedisHelper) => {
    return (req, res, next) => {
        req.logServer = logServer
        req.Const = Const
        req.logCurrency = log_currency
        req.multiController = new multiController(GameRedisHelper)
        next(null, req, res);
    }
};

function log_currency(currency)
{
    let currencyObj =[ {id:410001,count:currency[0]},{id:410002,count:currency[1]}]
    return currencyObj.filter(v => {return v.count > 0})
}