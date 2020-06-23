const protocol = require('./../../common/protocol');
const rechargeController = require('../controllers/rechargeController');
const GameConstants = require('./../../common/error.codes');
const serverConfig = require('./../../../configs/server.json');
var urlencode = require('urlencode');
const utils = require('./../../common/utils');
const nUtils = require('util');
var crypto = require('crypto');
var multiparty = require ('multiparty');

/**
 * createRechargeOrder
 * @param {*} request {ident, rid, uuid, httpuuid, time, price}
 * @param {*} response
 */

async function createRechargeOrder(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let recharge = new rechargeController (request.body.uuid, request.multiController);
    if (request.body.ident == null || request.body.rid == null
        || request.body.price == null || request.body.time == null) {
        respData.code = GameConstants.ERRCODES.PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let curTime  = (new Date()).getTime();
        console.log(curTime, curTime)
        if (curTime - request.body.time >= 30000 * 1000) {
            respData.code = GameConstants.ERRCODES.REQUEST_INVALIDATION;
            protocol.responseSend(response, respData);
        }else {
            let retData = await recharge.createRechargeOrder (request.body.ident, request.body.rid, request.body.price)
            switch (retData.status) {
                case 0:
                    respData.buyOrder = retData.buyOrder
                    request.multiController.save(function(err, data){
                        if(err){
                            respData.code = GameConstants.ERRCODES.FAILED;
                            return protocol.responseSend(response, respData);
                        }
                        return protocol.responseSend(response, respData);
                    })
                    break;
                case 1:
                    respData.code = GameConstants.ERRCODES.RORDER_NOT_EXIST;
                    return protocol.responseSend(response, respData);
                case 2:
                    respData.code = GameConstants.ERRCODES.RORDER_CANNOT_BUY;
                    return protocol.responseSend(response, respData);
                case 3:
                    respData.code = GameConstants.ERRCODES.RORDER_CONFIG_NOTMATCH;
                    return protocol.responseSend(response, respData);
                case 4:
                    respData.code = GameConstants.ERRCODES.RORDER_FREQUENTLY;
                    return protocol.responseSend(response, respData);
                case 5:
                    respData.code = GameConstants.ERRCODES.RORDER_INVALIDSTATUS;
                    return protocol.responseSend(response, respData);
                case 6:
                    respData.code = GameConstants.ERRCODES.RORDER_STATUSHANDLED;
                    return protocol.responseSend(response, respData);
                default:
                    respData.code = GameConstants.ERRCODES.ERRCODES;
                    return protocol.responseSend(response, respData);
            }
        }
    }
}

/**
 * updateRechargeOrderStatus
 * @param {*} request {sident, uuid, httpuuid, status}
 * @param {*} response
 */
async function updateRechargeOrderStatus(request, response) {
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let recharge = new rechargeController(request.body.uuid, request.multiController);
    if (request.body.sident == null || request.body.status == null) {
        respData.code = GameConstants.ERRCODES.PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let retData = await recharge.updateRechargeOrder(request.body.sident, request.body.status);
        switch (retData.status) {
            case 0:
                request.multiController.save(function (err, data) {
                    if (err) {
                        respData.code = GameConstants.ERRCODES.FAILED;
                        return protocol.responseSend(response, respData);
                    }
                    return protocol.responseSend(response, respData);
                })
                break;
            case 1:
                respData.code = GameConstants.ERRCODES.RORDER_NOT_EXIST;
                return protocol.responseSend(response, respData);
            case 2:
                respData.code = GameConstants.ERRCODES.RORDER_CANNOT_BUY;
                return protocol.responseSend(response, respData);
            case 3:
                respData.code = GameConstants.ERRCODES.RORDER_CONFIG_NOTMATCH;
                return protocol.responseSend(response, respData);
            case 4:
                respData.code = GameConstants.ERRCODES.RORDER_FREQUENTLY;
                return protocol.responseSend(response, respData);
            case 5:
                respData.code = GameConstants.ERRCODES.RORDER_INVALIDSTATUS;
                return protocol.responseSend(response, respData);
            case 6:
                respData.code = GameConstants.ERRCODES.RORDER_STATUSHANDLED;
                return protocol.responseSend(response, respData);
            default:
                respData.code = GameConstants.ERRCODES.ERRCODES;
                return protocol.responseSend(response, respData);
        }
    }
}

/**
 * PayserverRechargeCallback
 * @param {*} request attach 分隔  uuid|sident|price
 * @param {*} response
 */
async function PayserverRechargeCallback(request, response)
{
    if (request.fields.sign == null || request.fields.order_sn == null
        || request.fields.total_fee == null || request.fields.attach == null) {
        console.error(nUtils.format ("[%s] PayError!!! ORDER INFO LOST. order_sn[%s] sign[%s] total_fee[%s] attach[%s]",
            utils.getFormatTime (), request.fields.order_sn, request.fields.sign, request.fields.total_fee, request.fields.attach));
        protocol.responseSend(response, {status:"success", msg:"not found sign key"}, false);
    }else {

        request.fields.server_secret = serverConfig.server_secret;
        let bodyKeys = Object.keys(request.fields);
        bodyKeys.sort();
        let msg = ""
        for (let key of bodyKeys) {
            if (key !== "sign" && request.fields[key] != null && request.fields[key] != "" && request.fields[key] != 0) {
                msg = msg + key + "=" + urlencode(request.fields[key])
            }
        }

        console.log("----", msg)
        let hash = crypto.createHash('md5');
        hash.update(msg)
        let encrptKeys = hash.digest('hex');
        if (encrptKeys === request.fields.sign) {
            let attach = request.fields.attach;
            let tmps = attach.split("|");
            if (tmps.length < 3) {
                console.error(nUtils.format("[%s] PayError!!! ATTACH MSG IS WRONG. order_sn[%s] attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                protocol.responseSend(response, {status: "success", msg: "attach msg is wrong."}, false);
            } else {
                let uuid = parseInt(tmps[0]), sident = tmps[1], price = parseFloat(tmps[2]);
                console.log("PayserverRechargeCallback uuid sident price ",uuid, sident, price)
                let recharge = new rechargeController(uuid, request.multiController);
                if (sident == null || uuid <= 0) {
                    console.error(nUtils.format("[%s] PayError!!! ATTACH MSG IS WRONG. order_sn[%s] attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                    protocol.responseSend(response, {status: "success", msg: "attach msg is wrong"}, false);
                } else {
                    if (request.fields.pay_result === "success") {
                        let status = GameConstants.RORDERSTATUS.PaySuccess
                        let retData = await recharge.updateRechargeOrderStatusByPayServer(request.fields.order_sn, sident, price, status);
                        switch (retData.status) {
                            case 0:
                                request.multiController.save(function (err, data) {
                                    if (err) {
                                        return protocol.responseSend(response, {
                                            status: "success",
                                            msg: "server error."
                                        }, false);
                                    }
                                    return protocol.responseSend(response, {
                                        status: "success",
                                        msg: "order pay handled."
                                    }, false);
                                })
                                break;
                            case 1:
                                console.error(nUtils.format("[%s] PayError!!! ORDER IS NOT EXIST. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                                return protocol.responseSend(response, {
                                    status: "success",
                                    msg: "order is not exist."
                                }, false);
                            case 3:
                                console.error(nUtils.format("[%s] PayError!!! ORDER CONFIG NOT MATCH. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                                return protocol.responseSend(response, {
                                    status: "success",
                                    msg: "order config not match."
                                }, false);
                            case 5:
                                console.error(nUtils.format("[%s] PayError!!! STATUS INVALID. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                                return protocol.responseSend(response, {
                                    status: "success",
                                    msg: "status invalid."
                                }, false);
                            case 6:
                                console.error(nUtils.format("[%s] PayError!!! STATUS HANDLED. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                                return protocol.responseSend(response, {
                                    status: "success",
                                    msg: "status handled."
                                }, false);
                            default:
                                console.error(nUtils.format("[%s] PayError!!! SERVER ERROR. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach));
                                return protocol.responseSend(response, {
                                    status: "success",
                                    msg: "server error."
                                }, false);
                        }
                    } else {
                        console.error(nUtils.format("[%s] PayError!!! PAY STATUS IS NOT SUCCESS. order_sn[%s]  attach[%s]", utils.getFormatTime(), request.fields.order_sn));
                        protocol.responseSend(response, {status: "success", msg: "order pay handled."}, false);
                    }
                }
            }
        } else {
            console.error(nUtils.format("[%s] PayError!!! SIGN NOT MATCH. order_sn[%s] attach[%s] sign[%s] serversign[%s]", utils.getFormatTime(), request.fields.order_sn, request.fields.attach, request.fields.sign, encrptKeys));
            protocol.responseSend(response, {status: "success", msg: "sign not match"}, false);
        }
    }
}

exports.CreateRechargeOrder = createRechargeOrder;
exports.UpdateRechargeOrderStatus = updateRechargeOrderStatus;
exports.PayserverRechargeCallback = PayserverRechargeCallback;