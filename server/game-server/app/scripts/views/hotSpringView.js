const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const soulController = require('./../controllers/soulController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const hotSpringController = require('./../controllers/hotSpringController');
const taskController = require('./../controllers/taskController');
const GameBuyCounts = require('./../controllers/fixedController').GameBuyCounts;
const CONSTANTS = require('./../../common/constants');

const HOTSPRING_TICKETS_ID = 427004;
const HOTSPRING_TICKETS_COST = 1;

/**
 * GetHotspringInfo - 获取温泉玩法数据
 * @param {*} request
 * @param {*} response
 */
function GetHotspringInfo(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
    hotSpring.getHotSpringData (springData => {
        let hotspringData = {}
        hotspringData.buyout = springData.buyout;
        hotspringData.heroDatas = springData.heroDatas;
        let shouldUpdateHeroData = false;
        if (springData.kickOutInfo != null && springData.kickOutHeroDatas != null){
            hotspringData.kickOutHeroDatas = springData.kickOutHeroDatas;
            hotspringData.kickOutInfo = springData.kickOutInfo;
            let newWorkStat = heroController.WORKSTATS().IDLE;
            let hero = new heroController(request.body.uuid, 0,request.multiController, request.taskController);
            hero.addBatchAttrEmotion (hotspringData.kickOutHeroDatas, newWorkStat, retData => {
                hotspringData.attrsDatas = retData.updatedAttrs;
                respData.hotspringData = hotspringData;
                respData.updateStats = retData.updateStats;
                request.multiController.save(async function(err,data){
                    if(err){
                        respData.code = ERRCODES().FAILED;
                        hero.errorHandle()
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
            });
        }else{
            respData.hotspringData = hotspringData;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * HotspringStart - 入浴
 * @param {*} request {heroId, type}
 * @param {*} response
 */
function HotspringStart(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId <= 0 || request.body.type < 0) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId;
        let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
        let newWorkStat = heroController.WORKSTATS().HOTSPRING;
        hero.checkStatValid((statRet, status) => {
            if (statRet == heroController.CHECKSTATS ().VALID) {
                let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
                let curData = (new Date());
                if (hotSpring.checkIsValidTime (curData)){
                    hotSpring.IsHeroAleadyInBathStatus (heroId, bathStatus => {
                        if (!bathStatus) {
                            hotSpring.isHotSpringBuyOut (isBuyout => {
                                if (isBuyout) {
                                    hotSpring.startHotSpring (heroId, false, heroSpringData => {
                                        hero.setWorkStat (newWorkStat, setStat => {
                                            respData.heroData = heroSpringData;
                                            respData.updateStat = { hid:heroId, workStat: newWorkStat};
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
                                        });
                                    });
                                }else{
                                    hotSpring.IsHeroAlreadyBuyTicket (heroId, isBuyTicket => {
                                        if (isBuyTicket) {
                                            hotSpring.startHotSpring (heroId, false, heroSpringData => {
                                                hero.setWorkStat (newWorkStat, setStat => {
                                                    respData.heroData = heroSpringData;
                                                    respData.updateStat = { hid:heroId, workStat: newWorkStat};
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
                                                });
                                            });
                                        }else{
                                            if (request.body.type == 0) {
                                                let player = new playerController(request.body.uuid, request.multiController, request.taskController);
                                                var useItem = { id: HOTSPRING_TICKETS_ID, count: HOTSPRING_TICKETS_COST };
                                                player.itemValid([useItem], itemRet => {
                                                    if (itemRet) {
                                                        // 消耗道具
                                                        player.costItem([useItem], _ => {
                                                            hotSpring.startHotSpring (heroId, true, heroSpringData => {
                                                                hero.setWorkStat (newWorkStat, setStat => {
                                                                    // taskController.getCounterDataByTypeGroup(request.body.uuid, [2], taskEventData => {
                                                                    //     respData.taskEventData = taskEventData;
                                                                        respData.heroData = heroSpringData;
                                                                        respData.costitems = useItem;
                                                                        respData.updateStat = { hid:heroId, workStat: newWorkStat};
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
                                                                    // });
                                                                });
                                                            });
                                                        });
                                                    } else {
                                                        // 消耗道具不足
                                                        respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                                                        protocol.responseSend(response, respData);
                                                    }
                                                });
                                            }else{
                                                respData.code = ERRCODES().HOTSPRING_NOT_BUY_TICKET;
                                                protocol.responseSend(response, respData);
                                            }
                                        }
                                    });
                                }
                            });
                        }else{
                            respData.code = ERRCODES().HOTSPRING_IS_ALREADY_INBATH;
                            protocol.responseSend(response, respData);
                        }
                    });
                }else{
                    respData.code = ERRCODES().HOTSPRING_NOT_VALID_TIME;
                    protocol.responseSend(response, respData);
                }
            }else if (statRet == heroController.CHECKSTATS ().LOSS) {
                respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                protocol.responseSend(response, respData);
            }else if (statRet == heroController.CHECKSTATS ().VAGRANTNESS) {
                respData.code = ERRCODES().HERO_NOT_IN_HOUSE;
                protocol.responseSend(response, respData);
            }else{
                respData.code = ERRCODES().HERO_CANNOT_WORK;
                respData.workStat = status;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * GetOutofHotspring - 出浴
 * @param {*} request {heroId}
 * @param {*} response
 */
function GetOutOfHotspring(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId <= 0 ) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        let heroId = request.body.heroId;
        let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
        let newWorkStat = heroController.WORKSTATS().IDLE;
        hotSpring.IsHeroAleadyInBathStatus (heroId, bathStatus => {
            if (bathStatus) {
                hotSpring.getOutOfHotSpring (heroId, retData => {
                    let hero = new heroController(request.body.uuid, heroId,request.multiController, request.taskController);
                    hero.addAttrEnergyCheckLimited (retData.addEnergyThisTime, addAttrData => {
                        if (retData.addEnergyThisTime != addAttrData.realAdd) {
                            hotSpring.updateHotspringSupplyInfo (heroId, addAttrData.realAdd - retData.addEnergyThisTime, addEnergy => {
                                retData.addEnergy = addEnergy;
                                retData.addEnergyThisTime = addAttrData.realAdd;

                                if (retData.addFeel != null){
                                    hero.addAttrEmotion(retData.addFeel, newHeroAttrsAddEmotion => {
                                        respData.heroData = { hid:heroId, attrs: newHeroAttrsAddEmotion };
                                        respData.heroSpringData = retData;
                                        hero.setWorkStat (newWorkStat, setStat => {
                                            respData.updateStat = { hid:heroId, workStat: newWorkStat};
                                            request.multiController.save(async function(err,data){
                                                if(err){
                                                    respData.code = ERRCODES().FAILED;
                                                    hero.errorHandle()
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
                                        });
                                    });
                                }else{
                                    respData.heroData = { hid:heroId, attrs: addAttrData.attrs};
                                    respData.heroSpringData = retData;
                                    hero.setWorkStat (newWorkStat, setStat => {
                                        respData.updateStat = { hid:heroId, workStat: newWorkStat};
                                        request.multiController.save(async function(err,data){
                                            if(err){
                                                respData.code = ERRCODES().FAILED;
                                                hero.errorHandle()
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
                                    }, true);
                                }
                            });
                        }else{
                            if (retData.addFeel != null){
                                hero.addAttrEmotion(retData.addFeel, newHeroAttrsAddEmotion => {
                                    respData.heroData = { hid:heroId, attrs: newHeroAttrsAddEmotion };
                                    respData.heroSpringData = retData;
                                    hero.setWorkStat (newWorkStat, setStat => {
                                        respData.updateStat = { hid:heroId, workStat: newWorkStat};
                                        request.multiController.save(async function(err,data){
                                            if(err){
                                                respData.code = ERRCODES().FAILED;
                                                hero.errorHandle()
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
                                    });
                                });
                            }else{
                                respData.heroData = { hid:heroId, attrs: addAttrData.attrs};
                                respData.heroSpringData = retData;
                                hero.setWorkStat (newWorkStat, setStat => {
                                    respData.updateStat = { hid:heroId, workStat: newWorkStat};
                                    request.multiController.save(async function(err,data){
                                        if(err){
                                            respData.code = ERRCODES().FAILED;
                                            hero.errorHandle()
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
                                });
                            }
                        }
                    });
                });
            }else{
                respData.code = ERRCODES().HOTSPRING_NOT_INBATH;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * HotspringBuyOut - 买断
 * @param {*} request
 * @param {*} response
 */
function HotspringBuyOut(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
    hotSpring.isHotSpringBuyOut (buyOut => {
        if (!buyOut){
            hotSpring.buyOut (buyout => {
                let player = new playerController(request.body.uuid, request.multiController, request.taskController);
                player.getCurrency (currency => {
                    respData.buyout = buyout;
                    respData.currency = currency;
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
                });
            });
        }else{
            respData.code = ERRCODES().HOTSPRING_IS_ALREADY_BUYOUT;
            protocol.responseSend(response, respData);
        }
    });
}

/**
 * HotspringHandleFeelEvent - 处理心情事件
 * @param {*} request
 * @param {*} response
 */
function HotspringHandleFeelEvent(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
    if (request.body.heroId <= 0 || request.body.feelData == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }else{
        hotSpring.handleFeelEvent (request.body.heroId, request.body.feelData, retData => {
            if (retData.status == 0) {
                respData.heroId = request.body.heroId;
                respData.addFeel = retData.addFeel;
                let hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                if (retData.addFeel != null){
                    hero.addAttrEmotion(retData.addFeel, newHeroAttrs => {
                        respData.heroData = { hid: request.body.heroId, attrs: newHeroAttrs };
                        request.multiController.save(async function(err,data){
                            if(err){
                                respData.code = ERRCODES().FAILED;
                                hero.errorHandle()
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
                    });
                }else{
                    request.multiController.save(async function(err,data){
                        if(err){
                            respData.code = ERRCODES().FAILED;
                            hero.errorHandle()
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
                }
            }else {
                respData.code = ERRCODES().HOTSPRING_NOT_HAVE_FEELDATA;
                protocol.responseSend(response, respData);
            }
        });
    }
}

/**
 * GetHotspringFeelEvent - 获取心情事件信息
 * @param {*} request
 * @param {*} response
 */
function GetHotspringFeelEvent(request, response){
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    let hotSpring = new hotSpringController (request.body.uuid,request.multiController, request.taskController);
    hotSpring.getHotSpringFeelEvent (retData => {
        respData.heroData = retData;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                hotSpring.errorHandle()
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
    });
}


exports.GetHotspringInfo = GetHotspringInfo;
exports.HotspringStart = HotspringStart;
exports.GetOutOfHotspring = GetOutOfHotspring;
exports.HotspringBuyOut = HotspringBuyOut;
exports.HotspringHandleFeelEvent = HotspringHandleFeelEvent;
exports.GetHotspringFeelEvent = GetHotspringFeelEvent;
