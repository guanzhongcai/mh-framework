/**
 * 服务的操作：查询、下线等
 */
let router = module.exports = require("../../shared/server/ExpressServer").Router();

router.post('/getAll', async function (req, res) {

    const services = await require('../app').serviceAccess.getAllService();
    res.json(services);
});
