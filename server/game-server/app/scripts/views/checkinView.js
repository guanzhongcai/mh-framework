const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const HeroConfig = require('./../../designdata/HeroConfig');
const CheckinConfig = require('./../../designdata/CheckinConfig');
const checkinController = require('./../controllers/checkinController');
const playerController = require('./../controllers/playerController');
const CONSTANTS = require('./../../common/constants');
//const heroController = require('./../controllers/heroController');
const async = require('async')

/**
 * CheckInList - 签到列表
 * @param {*} request {  }
 * @param {*} response { 
 *  playerCheckinTime, 
 *  checkinList=[{hid, st, stat}, ...], 
 *  checkinRwdList: [{id, stat}, ...] 
 * }
 */
function CheckInList(request, response)
{
    // 生成签到列表数据
    const _createCheckinListData = (uuid, checkinData, callback) => {
        if (checkinData.checkinList.length === 0) {
            // 可以生成
            //var hero = new heroController(uuid);
            //hero.getHeroIdList(heroIdLis => {
                checkinData.checkinList = checkinController.createCheckinListByRule(HeroConfig.getHeroIdList());
                callback(true);
            //});
        } else {
            // 不用生成
            callback(false);
        }
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('uuid' in request.body && 'number' === typeof request.body.uuid) {
        // 获取签到数据
        checkinController.getCheckinData(request.body.uuid, CheckinData => {
            // 创建签到列表（如果为空）
            _createCheckinListData(request.body.uuid, CheckinData, created => {
                respData.playerCheckinTime = CheckinData.playerCheckinTime;
                respData.checkinList = CheckinData.checkinList;
                respData.checkinRwdList = CheckinData.checkinRwdList;
                respData.todayHeroList = CheckinData.todayHeroList; // 墨魂列表（今日获得）

                // 保存签到数据（如果数据有改动）
                checkinController.setCheckinData(request.body.uuid, CheckinData, request.multiController,() => {
    

                    request.multiController.save(async function(err,data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
    
                        respData.taskEventData = [];
                        respData.taskList = [];
                        try {
                            let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                            respData.taskEventData = taskEventData;
                            respData.taskList = taskList;
                        }catch (e) {
                            respData.code = ERRCODES().FAILED;
                            return  protocol.responseSend(response, respData);
                        }
                        protocol.responseSend(response, respData);
                    })
                }, created);
            });
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}






/**
 * CheckInTakeAward - 签到奖励
 * @param {*} request { httpuuid, uuid, date }
 * @param {*} response { addItems, currency }
 */
function CheckInTakeAward(request, response)
{
    
    
    //签到任务
    function taskCounterGacha(uuid, type=null, heroNodeGroup = null)
    {
        
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.CheckInDays,[{params:[0]}]);
        
    }
    
    
    const _checkTotalRewardValid = (checkinData, date, callback) => {
        if (date <= 31) {
            callback(true);
        } else {
            // 是累计领奖（5的倍数）
            callback(checkinData.ckRwdCount > 0 && checkinData.ckRwdCount >= 5);
        }
    }

    // 修改签到数据
    const _modifyCheckinData = (checkinData, date, callback) => {
        // 非累计签到设置
        if (date <= 31) {
            checkinData.playerCheckinTime = new Date().getTime();
            checkinData.ckRwdCount += 1; // 增加签到计数
        }

        // 将领取的签到奖励数据加入列表
        checkinData.checkinRwdList.push({ id: date, stat: 1 });

        callback();
    }

    // 奖励道具
    const _playerAddItems = (items, callback, playerPtr) => {
        if (items.length > 0) {
            playerPtr.addItem(items, () => {
                callback(items);
            });
        } else {
            callback(null);
        }
    }

    // 奖励货币
    const _playerAddCurrency = (currency, callback, playerPtr) => {
        if (currency.filter((a) => { return a > 0; }).length > 0) {
            playerPtr.addCurrencyMulti(currency, newCurrency => {
                callback(newCurrency);
            });
        } else {
            callback(null);
        }
    }


    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('uuid' in request.body && 'number' === typeof request.body.uuid && 
            'date' in request.body && 'number' === typeof request.body.date && request.body.date > 0) {
        checkinController.getCheckinData(request.body.uuid, CheckinData => {
            if (CheckinData.checkinList.length > 0) {
                _checkTotalRewardValid(CheckinData, request.body.date, valid => {
                    if (valid) {
                        if (checkinController.isTakeCheckinBonus(CheckinData, request.body.date)) {
                            // 获取奖励
                            var Bonus = CheckinConfig.getBonus(request.body.date);
                            if (Bonus) {
                                var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                // 奖励道具
                                _playerAddItems(Bonus.items, addItems => {
                                    if (addItems) respData.addItems = addItems;
                                    // 奖励货币
                                    _playerAddCurrency(Bonus.currency, newCurrency => {
                                        if (newCurrency) respData.currency = newCurrency;

                                        _modifyCheckinData(CheckinData, request.body.date, () => {
                                            checkinController.setCheckinData(request.body.uuid, CheckinData, request.multiController,async() => {
                                                taskCounterGacha(request.body.uuid, request.body.gachaType)
                                                
                                                request.multiController.save(async function(err,data){
                                                    if(err){
                                                        respData.code = ERRCODES().FAILED;
                                                        player.errorHandle()
                                                        return  protocol.responseSend(response, respData);
                                                    }
                                                    respData.taskEventData = [];
                                                    respData.taskList = [];
                                                    try {
                                                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                                        respData.taskEventData = taskEventData;
                                                        respData.taskList = taskList;
                                                    }catch (e) {
                                                        respData.code = ERRCODES().FAILED;
                                                        return  protocol.responseSend(response, respData);
                                                    }
                                                    
                                                    protocol.responseSend(response, respData);
                                                })
                                                async.parallel({
                                                    "item":async function (cb) {
                                                        if(!!addItems && addItems.length >0 ){await request.logServer.itemLog([request.body.uuid, request.Const.actions.checkIn,[],addItems, request.Const.functions.checkIn])}
                                                        cb(1)
                                                    },
                                                    "logCurrency": async function(cb){
                                                        await request.logServer.logCurrency(request.body.uuid,request.Const.actions.checkIn,request.Const.functions.checkIn,0,Bonus.currency,newCurrency)
                                                        cb(1)
                                                    }
                                                },function (err,results) {
                                                })
                                            });
                                        });

                                    }, player);
                                }, player);
                            } else {
                                // 未找到对应奖励
                                respData.code = ERRCODES().CHECKIN_CANNOT_FIND_BONUS;
                                protocol.responseSend(response, respData);
                            }
                        } else {
                            // 签到奖励已领取
                            respData.code = ERRCODES().CHECKIN_IS_TAKE_AWARDS;
                            protocol.responseSend(response, respData);
                        }
                    } else {
                        // 无法领取累计奖励
                        respData.code = ERRCODES().CHECKIN_CANNOT_TAKE_TOTAL_AWARDS;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 似乎未生成签到列表（墨魂）
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

exports.CheckInList = CheckInList;
exports.CheckInTakeAward = CheckInTakeAward;