const protocol = require('./../../common/protocol');
const rechargeController = require('../controllers/rechargeController');
const ERRCODES = require('./../../common/error.codes');
const utils = require('./../../common/utils');
const nUtils = require('util');
var crypto = require('crypto');

/**
 * fetchOrderStatus
 * @param {*} request {sident} 根据服务器订单号来验证状态
 * @param {*} response
 */

async function fetchOrderStatus(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let recharge = new rechargeController (request.body.uuid, request.multiController, request.taskController);
    if (request.body.sident == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        console.log("fetchOrderStatus", request.body.sident)
        let retData = await recharge.fetchOrderStatus (request.body.sident);
        if (retData.status == 0)  {
            respData.status = retData.status;
            respData.rechargeTime = retData.rechargeTime;
            respData.firstRechargeReward = retData.firstRechargeReward;
            respData.addDiamondsTotal = retData.addDiamondsTotal;
            respData.currency = retData.currency
            respData.rechargeMoney = retData.rechargeMoney
            respData.handledOrder = retData.handledOrder;

            request.multiController.save(function(err, data){
                if(err){
                    respData.code = ERRCODES().FAILED;
                    return protocol.responseSend(response, respData);
                }
                return protocol.responseSend(response, respData);
            })
        }else {
            respData.status = retData.status;
            protocol.responseSend(response, respData);
        }
    }
}



/**
 * handleAllPaySuccessOrder
 * @param {*} request {} 处理所有状态成功的订单
 * @param {*} response
 */
async function handleAllPaySuccessOrder(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let recharge = new rechargeController (request.body.uuid, request.multiController, request.taskController);
    let retData = await recharge.handleAllPaySuccessOrder ();
    if (retData.status == 0)  {
        respData.status = retData.status;
        respData.rechargeTime = retData.rechargeTime;
        respData.firstRechargeReward = retData.firstRechargeReward;
        respData.addDiamondsTotal = retData.addDiamondsTotal;
        respData.currency = retData.currency;
        respData.handledOrder = retData.handledOrder;
        respData.rechargeMoney = retData.rechargeMoney
        request.multiController.save(function(err, data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return protocol.responseSend(response, respData);
            }
            return protocol.responseSend(response, respData);
        })
    }else {
        respData.status = retData.status;
        protocol.responseSend(response, respData);
    }
}

exports.FetchOrderStatus = fetchOrderStatus;
exports.HandleAllPaySuccessOrder = handleAllPaySuccessOrder;
