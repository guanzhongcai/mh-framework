const utils = require('./../../common/utils');
const RechargeData = require('./../../designdata/Recharge');
const models = require('./../models');
const validator = require('validator');
const playerController = require('./playerController');
const ActivityConfig = require('./../../designdata/ActivityConfig');

const GameRedisHelper = require('./../../../index.app').GameRedisHelper;


class rechargeController
{
    // 支付状态
    static PayStatus () {
        return {
            PaySuccess:0,     // 订单完成
            PayWaiting:1,    // 订单还在等待支付回调返回
            PayCancel:2,    // 订单已经取消
            PayFailed:3     // 订单支付失败
        }
    };

    // 游戏服处理状态
    static GameHandleStatus () {
        return {
            ContentSendSuccess:0,    // 订单发送奖励成功
            ContentUndo:1,           // 订单未处理
            ContentSendFaild:2      // 订单发送奖励失败
        }
    };

    constructor(uuid, multiController, taskController)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'RechargeData';
        this.tblnameRechargeRecord = "RechargeRecord";
        this.multiController = multiController
        this.taskController = taskController
        this.rechargeData = null
        this.rechargeRecordData = null
    }

    getFromDBOrCache(cb){
        if(!!this.rechargeData){
            cb(this.rechargeData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sdoc => {
                var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
                this.rechargeData = doc
                cb(doc)
            })
        }
    }

    getOrderRecordFromDBOrCache (cb) {
        if(!!this.rechargeRecordData){
            cb(this.rechargeRecordData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblnameRechargeRecord, this.uuid_, sdoc => {
                var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : {};
                this.rechargeRecordData = doc
                cb(doc)
            })
        }
    }

    // 处理所有的支付成功订单
    async handleAllPaySuccessOrder () {
        return new Promise(resolve => {
            this.getFromDBOrCache(async doc => {
                if (doc != null && doc.orderList != null) {
                    let player = new playerController(this.uuid_, this.multiController, this.taskController);
                    let rechargeTime = await player.getRechargeTime ();
                    let firstRechargeReward = await player.getFirstRechargeGetAwardStatus();

                    let addCurrency = [0, 0, 0];
                    let addDiamondsTotal = 0
                    let retData = {}
                    let rechargeMoney = 0

                    retData.rechargeTime = rechargeTime;
                    retData.firstRechargeReward = firstRechargeReward;
                    retData.addDiamonds = 0
                    let isFirstRecharge = rechargeTime === 0;

                    let handledOrder = [];
                    let changeCnt = 0
                    for (let key in doc.orderList) {
                        let payOrder = doc.orderList[key];
                        if (payOrder.pstatus === rechargeController.PayStatus().PaySuccess && payOrder.gstatus === rechargeController.GameHandleStatus().ContentUndo) {
                            let rechargeConfig = RechargeData.getRechargeConfigData(payOrder.cid);
                            if (rechargeConfig != null) {
                                changeCnt += 1
                                let addDiamonds = rechargeConfig.Diamonds;
                                if (isFirstRecharge) {
                                    addDiamonds += rechargeConfig.DoubleDiamonds;
                                }else {
                                    addDiamonds += rechargeConfig.ExtraDiamonds;
                                }
                                rechargeMoney = rechargeMoney + rechargeConfig.Price;
                                addDiamondsTotal = addDiamondsTotal + addDiamonds;
                                payOrder.gstatus = rechargeController.GameHandleStatus().ContentSendSuccess;
                                handledOrder.push({sident:payOrder.sIdent, cid:payOrder.cid, pstatus:payOrder.pstatus, gstatus:payOrder.gstatus, firstrecharge:isFirstRecharge, addDiamonds:addDiamonds})
                                isFirstRecharge = false;
                            }
                        }
                    }

                    if (addDiamondsTotal !== 0) {
                        addCurrency[1] = addDiamondsTotal;
                        retData.addDiamondsTotal = addDiamondsTotal;
                        player.addCurrencyMulti(addCurrency, async newCurrency => {
                            await player.updateRechargeTime(changeCnt);
                            let totalMoney = await player.updateRechargeMoneyCnt(rechargeMoney);
                            retData.rechargeTime += changeCnt;
                            retData.status = 0;
                            retData.currency = newCurrency;
                            retData.handledOrder = handledOrder;
                            retData.rechargeMoney = totalMoney;

                            this.getOrderRecordFromDBOrCache(record => {
                                if (record.orderList == null) record.orderList = {};
                                let removeKeys = []
                                for (let key in doc.orderList) {
                                    let payOrder = doc.orderList[key];
                                    if (payOrder.pstatus === rechargeController.PayStatus().PaySuccess && payOrder.gstatus === rechargeController.GameHandleStatus().ContentSendSuccess) {
                                        record.orderList[payOrder.sIdent] = payOrder;
                                        record.orderList[payOrder.sIdent].updatetime = utils.getTime();
                                        removeKeys.push(payOrder.sIdent);
                                    }
                                }

                                console.log("remove keys ", removeKeys)
                                for (let key of removeKeys) {
                                    delete doc.orderList[key];
                                }
                                console.log(doc.orderList)

                                this.multiController.push(1, this.tblnameRechargeRecord + ":" + this.uuid_, JSON.stringify(record));
                                this.multiController.push(1, this.tblname_ + ":" + this.uuid_, JSON.stringify(doc));
                                resolve (retData);
                            });
                        });
                    }else {
                        resolve ({status:1});  // 没有待处理的订单
                    }
                }else {
                    resolve ({status:1}); // 没有待处理的订单
                }
            });
        });
    }


    //获取当前查询的订单状态
    async fetchOrderStatus (sident) {
        return new Promise(resolve => {
            this.getFromDBOrCache(async doc => {
                if (doc != null && doc.orderList[sident] != null && doc.orderList[sident] != null) {
                    if (doc.orderList[sident].pstatus !== rechargeController.PayStatus().PaySuccess) {
                        resolve ({status:1}); // 订单还未确认
                    }else {
                        if (doc.orderList[sident].gstatus === rechargeController.GameHandleStatus().ContentUndo) {
                            let player = new playerController(this.uuid_, this.multiController, this.taskController);
                            let cid = doc.orderList[sident].cid;
                            let rechargeConfig = RechargeData.getRechargeConfigData(cid);
                            if (rechargeConfig == null) {
                                resolve({status: 3}); // 订单配置已失效
                            }else {
                                let rechargeTime = await player.getRechargeTime ();
                                let firstRechargeReward = await player.getFirstRechargeGetAwardStatus();
                                let triggerGiftId = ActivityConfig.getTriggerGiftIdByChargeId(cid);

                                let isFirstRecharge = rechargeTime === 0
                                if (rechargeTime == null) {
                                    resolve({status: 4}); //未找到玩家数据
                                }else {

                                    let retData = {}
                                    retData.rechargeTime = rechargeTime;
                                    retData.firstRechargeReward = firstRechargeReward
                                    retData.handledOrder = []

                                    let addCurrency = [0, 0, 0];
                                    let rechargeMoney = rechargeConfig.Price
                                    let addDiamonds = rechargeConfig.Diamonds;
                                    if (isFirstRecharge) {
                                        addDiamonds += rechargeConfig.DoubleDiamonds;
                                    }else {
                                        addDiamonds += rechargeConfig.ExtraDiamonds;
                                    }

                                    addCurrency[1] = addDiamonds;
                                    player.addCurrencyMulti(addCurrency, async newCurrency => {
                                        await player.updateRechargeTime(1);
                                        let totalMoney = await player.updateRechargeMoneyCnt(rechargeMoney);

                                        if (triggerGiftId != null) {
                                            let triggerData = await player.updateTriggerGiftBuyCnt(triggerGiftId, 1);
                                            if (triggerData != null) retData.TiggerGift = triggerData;
                                        }

                                        retData.rechargeTime += 1
                                        retData.currency = newCurrency;
                                        retData.addDiamondsTotal = addDiamonds;
                                        retData.rechargeMoney = totalMoney

                                        doc.orderList[sident].gstatus = rechargeController.GameHandleStatus().ContentSendSuccess;
                                        retData.status = 0;
                                        retData.handledOrder.push({sident:sident, cid:doc.orderList[sident].cid, pstatus:doc.orderList[sident].pstatus, gstatus:doc.orderList[sident].gstatus, firstrecharge:isFirstRecharge, addDiamonds:addDiamonds})
                                        this.getOrderRecordFromDBOrCache(record => {
                                            if (record.orderList == null) record.orderList = {};
                                            record.orderList[sident] = doc.orderList[sident];
                                            record.orderList[sident].updatetime = utils.getTime();
                                            this.multiController.push(1, this.tblnameRechargeRecord + ":" + this.uuid_, JSON.stringify(record));
                                            delete doc.orderList[sident];
                                            this.multiController.push(1, this.tblname_ + ":" + this.uuid_, JSON.stringify(doc));
                                            resolve (retData);
                                        });
                                    });
                                }
                            }
                        }else {
                            resolve ({status:2}); // 订单已处理
                        }
                    }
                }else {
                    resolve ({status:5}); //订单未找到
                }
            });
        });
    }
}

module.exports = rechargeController;