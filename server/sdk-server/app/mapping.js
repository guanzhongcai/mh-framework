const rechargeView = require ('./scripts/views/rechargeView')

function mapping(app)
{
    app.post('/newtype_createrechargeorder', (req, res) => { rechargeView.CreateRechargeOrder(req, res); })
    app.post('/newtype_updatechargeorderstatus', (req, res) => { rechargeView.UpdateRechargeOrderStatus(req, res); })
    app.post('/newtype_payserverrechargecallback', (req, res) => { rechargeView.PayserverRechargeCallback(req, res); })
}

module.exports = mapping;