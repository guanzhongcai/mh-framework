const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const activityController = require ('./../controllers/activityController');

const taskController = require('./../controllers/taskController');
const async = require('async')
const CONSTANTS = require('./../../common/constants');

/**
 * GetActivityReward - 获取活动奖励
 * @param {*} request {activityType 活动类型  index,  param 参数}
 * @param {*} response
 */
async function GetActivityReward(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.activityType == null || request.body.activityType <= 0 ||
        request.body.index == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let activityType = request.body.activityType, activityIndex = request.body.index;
        if (activityType === 3 && activityIndex === 5 && (request.body.param == null || request.body.param <= 0)) {
            respData.code = ERRCODES().PARAMS_ERROR;
            protocol.responseSend(response, respData);
        }else {
            let hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
            let player = new playerController(request.body. uuid,request.multiController, request.taskController);
            let activity = new activityController (request.body.uuid, request.multiController, request.taskController);
            let awardInfo = await activity.getActivityAward (player, hero, activityType, activityIndex, request.body.param);
            if (awardInfo.status == 0) {
                if (activityType === 1) {
                    let getRewardStatus = await player.updateFirstRechargeRewardStatus ();
                    respData.firstRechargeReward = getRewardStatus;
                }else if (activityType === 3) {
                    let DailyLoginInfo = await player.setActivityAwardStatus (activityType, activityIndex);
                    respData.DailyLoginInfo = DailyLoginInfo;
                }

                if (awardInfo.currency) respData.currency = awardInfo.currency;
                if (awardInfo.heroSkinList) respData.heroSkinList = awardInfo.heroSkinList;
                if (awardInfo.addItems) respData.addItems = awardInfo.addItems;
                if (awardInfo.heroList) respData.heroList = awardInfo.heroList;

                request.multiController.save(function(err, data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        return protocol.responseSend(response, respData);
                    }
                    return protocol.responseSend(response, respData);
                })
            }else if (awardInfo.status == 1) {
                respData.code = ERRCODES().ACTIVITY_REWARD_GETED;
                protocol.responseSend(response, respData);
            }else if (awardInfo.status == 2) {
                respData.code = ERRCODES().ACTIVITY_REWARD_NOTMATCHCONDITION;
                protocol.responseSend(response, respData);
            }else if (awardInfo.status == 3) {
                respData.code = ERRCODES().ACTIVITY_REWARD_CANNOTGET;
                protocol.responseSend(response, respData);
            }else if (awardInfo.status == 4) {
                respData.code = ERRCODES().ACTIVITY_REWARD_NOTFOUNDACTIVITY;
                protocol.responseSend(response, respData);
            }else if (awardInfo.status == 5) {
                respData.code = ERRCODES().ACTIVITY_REWARD_NOTFOUNDACTIVITY;
                protocol.responseSend(response, respData);
            }else {
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        }
    }
}

/**
 * BuyTriggerGift - 购买触发礼包奖励
 * @param {*} request {giftid}  礼包id
 * @param {*} response
 */
async function BuyTriggerGift(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.giftid == null || request.body.giftid <= 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
        let player = new playerController(request.body.uuid, request.multiController, request.taskController);
        let activity = new activityController(request.body.uuid, request.multiController, request.taskController);
        let retData = await activity.buyTriggerGift (player, hero, request.body.giftid);
        if (retData.status == 0) {
            if (retData.costItems) respData.costItems = retData.costItems;
            if (retData.currency) respData.currency = retData.currency;
            if (retData.heroSkinList) respData.heroSkinList = retData.heroSkinList;
            if (retData.addItems) respData.addItems = retData.addItems;
            if (retData.heroList) respData.heroList = retData.heroList;
            if (retData.TiggerGift) respData.TiggerGift = retData.TiggerGift;

            request.multiController.save(function(err, data){
                if(err){
                    respData.code = ERRCODES().FAILED;
                    return protocol.responseSend(response, respData);
                }
                return protocol.responseSend(response, respData);
            })

        }else if (retData.status === 1) {
            respData.code = ERRCODES().ACTIVITY_TRIGGER_NOTFOUND;
            protocol.responseSend(response, respData);
        }else if (retData.status === 2) {
            respData.code = ERRCODES().ACTIVITY_TRIGGER_CANNOTBUY;
            protocol.responseSend(response, respData);
        }else if (retData.status === 3) {
            respData.code = ERRCODES().ACTIVITY_TRIGGER_PRICENOTFOUND;
            protocol.responseSend(response, respData);
        }else if (retData.status === 4) {
            respData.code = ERRCODES().CURRENCY_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }else if (retData.status == 5) {
            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
            protocol.responseSend(response, respData);
        }else{
            respData.code = ERRCODES().FAILED;
            protocol.responseSend(response, respData);
        }
    }
}

exports.GetActivityReward = GetActivityReward;
exports.BuyTriggerGift = BuyTriggerGift;
