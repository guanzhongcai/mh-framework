const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const taskController = require('./../controllers/taskController');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const skillController = require('./../controllers/skillController');
const Items = require ('./../controllers/fixedController').Items;
const Skills = require('./../../designdata/Skills');
const CONSTANTS = require('./../../common/constants');

// 技能提升等级
// request { httpuuid, uuid, heroId, skillId, items}
function SkillToLevelUp(request, response)
{
    // 任务相关（技能升级）
    function taskCounterSkillLvUp(uuid, hid, sid, psid, callback) {
        
        var upSkillLevel = Skills.getSkillLevelById(sid) + 1;
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroProd_Skill_Level,[{params:[hid, psid],num:upSkillLevel,add:false}]);
        
        //TODO 主动技能 Level
        request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.PrantSkill_Level,[{params:[upSkillLevel]}]);
        callback()
    }

    function getChargingItemCount (items, itemId) {
        let count = 0;
        for (let item of items) {
            if (item.id == itemId) {
                count += item.count;
            }
        }
        return count;
    }

    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId == null  || request.body.skillId == null || request.body.items == null) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        skillController.checkSkillLevelMaxValid(request.body.skillId, maxLvValid => {
            if (!maxLvValid) {
                // 达到最大等级
                respData.code = ERRCODES().SKILL_LEVEL_IS_MAX;
                protocol.responseSend(response, respData);
            } else {
                let SkillType = Skills.getSkillTypeConfig(request.body.skillId);
                if (SkillType === Skills.SkillType().ACTIVE) {
                    var player = new playerController(request.body.uuid,request.multiController, request.taskController);
                    player.itemValid (request.body.items, itemValid => {
                        if (itemValid) {
                            Skills.getStudyCostConfig(request.body.skillId, CostConfig => {
                                let needChargingPoint = CostConfig.skillChargingPoint;
                                let itemIds = [];
                                for (let item of request.body.items) {
                                    itemIds.push (item.id);
                                }
                                Items.getItemsInfoByItemIds(itemIds, itemInfos => {
                                    // 判断是否都是冲能类型 计算当前可以充能能量
                                    let chargingtype = Items.TYPES().HERO_PIECE;
                                    let totalAddPower = 0;
                                    let itemTypeMatch = true;
                                    for (let item of itemInfos) {
                                        if (item.type == chargingtype) {
                                            let count = getChargingItemCount (request.body.items, item.itemId);
                                            if (item.value == request.body.heroId) {
                                                totalAddPower += item.likeUpEffectVal * count;
                                            }else {
                                                totalAddPower += item.upEffectVal * count;
                                            }
                                        }else {
                                            itemTypeMatch = false;
                                        }
                                    }
                                    if (!itemTypeMatch) {
                                        respData.code = ERRCODES().SKILL_LEVELUP_ITEMTYPE_ERROR;
                                        protocol.responseSend(response, respData);
                                    }else {
                                        var parentSkillId = Skills.getParentSkillId(request.body.skillId);
                                        var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                                        hero.checkSkillValid (request.body.skillId, skillValid => {
                                            if (skillValid) {
                                                // 技能升级
                                                hero.skillChargingLevelUp(parentSkillId, needChargingPoint, totalAddPower, retData => {
                                                    if (retData.skillList) respData.skillList = retData.skillList;
                                                    respData.skillId = request.body.skillId;
                                                    respData.isSkillLevelUp = retData.isSkillLevelUp;
                                                    respData.skillChargingPoint = retData.skillChargingPoint;
                                                    respData.addChargingPoint = totalAddPower;
                                                    player.costItem(request.body.items, () => {
                                                        respData.costItems = request.body.items;
                                                        if (respData.isSkillLevelUp) {
                                                            taskCounterSkillLvUp(request.body.uuid, request.body.heroId, request.body.skillId, parentSkillId, () => {
                                                                // respData.taskEventData = taskEventData;
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
                                                        }else {
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
                                                        }
                                                    });
                                                });
                                            }else {
                                                // 技能不存在
                                                respData.code = ERRCODES().SKILL_IS_WRONG;
                                                protocol.responseSend(response, respData);
                                            }
                                        });
                                    }
                                });
                            });
                        }else {
                            // 物品不足
                            respData.code = ERRCODES().ITEM_NOT_ENOUGH;
                            protocol.responseSend(response, respData);
                        }
                    });
                } else {
                    respData.code = ERRCODES().HERO_SKILL_NOT_LEVELUP;
                    protocol.responseSend(response, respData);
                }
            }
        });
    }
}

exports.SkillToLevelUp = SkillToLevelUp;
