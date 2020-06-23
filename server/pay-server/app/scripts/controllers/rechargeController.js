const utils = require('./../../common/utils');
const RechargeData = require('./../../designdata/Recharge');
const models = require('./../models');
const validator = require('validator');
const GameConstants = require('./../../common/error.codes');
const GameRedisHelper = require('../../../index.app').GameRedisHelper;


class rechargeController
{
    constructor(uuid, multiController)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'RechargeData';
        this.tblnameRechargeRecord = "RechargeRecord";
        this.multiController = multiController
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

    async createRechargeOrder (ident, rid, price) {
        return new Promise(resolve => {
            this.getFromDBOrCache (doc => {
                if (doc == null) {
                    doc = models.UserSOrderModel();
                }

                let curTime = utils.getTime();
                if (curTime - doc.lastCreateTime <= 20 * 1000) { // 创建订单过于频繁
                    resolve ({status:4})
                }else {
                    let rechargeConfig = RechargeData.getRechargeConfigData (rid);
                    if (rechargeConfig == null) {
                        resolve ({status:1})    // 订单信息不存在
                    }else if (rechargeConfig.OnSell !== 1) {
                        resolve ({status:2})    // 该商品不可购买
                    }else if (rechargeConfig.Ident != ident || rechargeConfig.Price != price) {
                        resolve ({status:3})   // 该商品信息不匹配
                    }else {
                        let order = models.SOrderModel();
                        let sIdent = utils.getGlobalUniqueIdAll();
                        //创建唯一的订单编号
                        while (true) {
                            if (doc.orderList[sIdent] == null) {
                                break;
                            } else {
                                sIdent = utils.getGlobalUniqueIdAll();
                            }
                        }
                        order.cIdent = ident;
                        order.sIdent = sIdent;
                        order.createTime = curTime;
                        order.cid = rid;
                        order.price = rechargeConfig.Price;
                        order.pstatus = GameConstants.RORDERSTATUS.PayWaiting;
                        order.gstatus = GameConstants.RORDERSTATUS.ContentUndo;
                        doc.orderList[sIdent] = order
                        doc.lastCreateTime = curTime
                        this.multiController.push(1, this.tblname_ + ":" + this.uuid_,  JSON.stringify(doc))
                        resolve({status: 0,  buyOrder: order});
                    }
                }
            });
        });
    }

    async updateRechargeOrder (sident, status) {
        return new Promise(resolve => {
            if (status === GameConstants.RORDERSTATUS.PayCancel || status === GameConstants.RORDERSTATUS.PayFailed) {
                this.getFromDBOrCache(doc => {
                    if (doc != null && doc.orderList != null && doc.orderList[sident] != null) {
                        doc.orderList[sident].pstatus = status;
                        this.getOrderRecordFromDBOrCache(record => {
                            if (record.orderList == null) record.orderList = {};
                            record.orderList[sident] = doc.orderList[sident];
                            record.orderList[sident].updatetime = utils.getTime();
                            this.multiController.push(1, this.tblnameRechargeRecord + ":" + this.uuid_, JSON.stringify(record));
                            delete doc.orderList[sident];
                            this.multiController.push(1, this.tblname_ + ":" + this.uuid_, JSON.stringify(doc));
                            resolve({status: 0})
                        });
                    } else {
                        resolve({status: 1});
                    }
                });
            } else {
                resolve({status: 5});
            }
        });
    }

    // 支付服务器返回订单状态
    async updateRechargeOrderStatusByPayServer (sident, price, status) {
        return new Promise(resolve => {
            if (status === GameConstants.RORDERSTATUS.PaySuccess) {
                this.getFromDBOrCache(doc => {
                    if (doc != null && doc.orderList[sident] != null && doc.orderList[sident] != null) {
                        let cid = doc.orderList[sident].cid;
                        let rechargeConfig = RechargeData.getRechargeConfigData(cid);
                        if (rechargeConfig == null || rechargeConfig.Price != price) {
                            resolve({status: 3});
                        } else {
                            if (doc.orderList[sident].pstatus === GameConstants.RORDERSTATUS.PayWaiting) {
                                doc.orderList[sident].pstatus = status;
                                this.multiController.push(1, this.tblname_ + ":" + this.uuid_, JSON.stringify(doc));
                                resolve({status: 0});
                            }else {
                                resolve ({status:6});
                            }
                        }
                    }else {
                        resolve ({status:1});
                    }
                });
            }else {
                resolve ({status:5});
            }
        });
    }
}

module.exports = rechargeController;