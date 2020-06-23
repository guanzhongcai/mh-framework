const  multiController = require('../../scripts/controllers/multiController')
const task = require('../../scripts/controllers/newTaskController')

module.exports = (logServer,Const,GameRedisHelper) => {
    return (req, res, next) => {
        if(['/newtype_playerheartbeat','/fetchservertime'].includes(req.url)){
           return next(null, req, res);
        }else{
            req.logServer = logServer
            req.Const = Const
            req.logCurrency = log_currency
            req.multiController = new multiController(GameRedisHelper)
            req.taskController = new task(GameRedisHelper)
            next(null, req, res);
        }
    }
};

function log_currency(currency)
{
    let currencyObj =[ {id:410001,count:currency[0]},{id:410002,count:currency[1]}]
    return currencyObj.filter(v => {return v.count > 0})
}