const utils = require('./../../common/utils');
const ERRCODES = require('./../../common/error.codes');
const categoryFromItemListEx = require('./fixedController').categoryFromItemListEx;
const PursueTreeHeros = require('./../../designdata/PursueTreeHeros');
const PursueTree = require('./../../designdata/PursueTree');
const heroController = require('./heroController');
const collectController = require('./collectController');
const externalController = require('./externalController');
const taskController = require('./taskController');
const stockController = require('./stockController');
const CONSTANTS = require('./../../common/constants');

function checkConditionValid(clsPlayer, clsHero, nodeId, callback)
{
    // 消耗判断
    const _checkPTCost = (playerPtr, heroPtr, costData, callback) =>
    {
        if (Object.keys(costData).length === 0) {
            callback({ valid: true, code: ERRCODES().SUCCESS });
        } else {
            playerPtr.itemValid(costData.items, itemValid => {
                if (itemValid) {
                    playerPtr.currencyMultiValid(costData.currency, currencyValid => {
                        if (currencyValid) {
                            heroPtr.checkAttrsValid(costData.attrs, attrsValid => {
                                if (attrsValid) {
                                    callback({ valid: true, code: ERRCODES().SUCCESS });
                                } else {
                                    // 属性消耗不足（暂不区分每个属性分别提示错误码）
                                    callback({ code: ERRCODES().HERO_ATTRS_NOT_ENOUGH });
                                }
                            });
                        } else {
                            // 货币不足
                            callback({ valid: false, code: ERRCODES().CURRENCY_NOT_ENOUGH });
                        }
                    });
                } else {
                    // 物品不足
                    callback({ valid: false, code: ERRCODES().ITEM_NOT_ENOUGH });
                }
            });
        }
    }

    // 墨魂属性判断
    const _checkPTHeroAttr = (heroPtr, attrData, callback) =>
    {
        if (Object.keys(attrData).length === 0) {
            callback({ valid: true, code: ERRCODES().SUCCESS });
        } else {
            //console.warn(JSON.stringify(attrData));
            heroPtr.checkAttrsValid(attrData.attrs, attrsValid => {
                if (attrsValid) {
                    callback({ valid: true, code: ERRCODES().SUCCESS });
                } else {
                    // 数值不达标
                    callback({ valid: false, code: ERRCODES().HERO_ATTRS_NOT_ENOUGH });
                }
            });
        }
    }

    // 解锁阶段判断
    const _checkPTUnlockStep = (heroPtr, unlockLis, callback) =>
    {
        heroPtr.getPursueTreeList(pursueTreeLis => {
            var valid = true, isFind;
            for (let nid of unlockLis) {
                isFind = false;
                for (let i in pursueTreeLis) {
                    if (pursueTreeLis[i].nodeId === nid) {
                        isFind = true;
                        break;
                    }
                }

                if (!isFind) { // Not find this node id.
                    valid = false;
                    break;
                }
            }

            callback(valid);
        });
    }

    PursueTreeHeros.getUnlockConditionListConfig(clsHero.getHeroId(), nodeId, ConditionList => {
        var CostData = {}, ValidData = {}, UnlockNodeLis = [], TaskCompleted = [];
        for (let i in ConditionList) {
            var conditionData = ConditionList[i];
            if (conditionData.type === 1) {
                // 消耗类型
                CostData = categoryFromItemListEx(CostData, conditionData.params);
            } else if (conditionData.type === 2) {
                // 属性达标
                ValidData = categoryFromItemListEx(ValidData, conditionData.params);
            } else if (conditionData.type === 5) {
                UnlockNodeLis = UnlockNodeLis.concat(conditionData.params);
            } else if (conditionData.type === 6) {
                //  行为数据状态是否达标
            }
        }

        _checkPTUnlockStep(clsHero, UnlockNodeLis, unlockValid => {
            if (unlockValid) {
                _checkPTCost(clsPlayer, clsHero, CostData, costRet => {
                    if (costRet.valid) {
                        _checkPTHeroAttr(clsHero, ValidData, attrRet => {
                            if (attrRet.valid) {
                                delete attrRet.valid;
                                if (Object.keys(CostData).length > 0) attrRet.costData = CostData;
                                callback(attrRet);
                            } else {
                                // 数值不达标
                                delete attrRet.valid;
                                callback(attrRet);
                            }
                        });
                    } else {
                        delete costRet.valid;
                        callback(costRet);
                    }
                });
            } else {
                // 追求树当前阶段未解锁
                callback({ code: ERRCODES().PURSUETREE_CURRENT_STEP_UNLOCK });
            }
        });
    });
}

async function doUnlock(clsPlayer, clsHero, nodeId, multiController, taskController)
{
    return new Promise(resolve => {
        PursueTreeHeros.getNodeParamConfig(1, clsHero.getHeroId(), nodeId, Param1 => {
            PursueTree.getNodeTypeConfig(PursueTreeHeros.getTypeConfig(clsHero.getHeroId(), nodeId), nodeId, NodeType => {
                if (NodeType === 1) {
                    //（有奖励）
                    PursueTreeHeros.getBonusConfig(clsHero.getHeroId(), nodeId, BonusData => {
                        if (BonusData) {
                            clsPlayer.addItem(BonusData.items, () => {
                                clsPlayer.addCurrencyMulti(BonusData.currency, (newCurrency) => {
                                    resolve({ retData:{ code: ERRCODES().SUCCESS, bonusItem: BonusData.items, currency: newCurrency}, nodeType:NodeType});
                                });
                            });
                        } else {
                            resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                        }
                    });
                } else if (NodeType === 2) {
                    PursueTreeHeros.getBonusConfig(clsHero.getHeroId(), nodeId, BonusData => {
                        if (BonusData) {
                            clsPlayer.addItem(BonusData.items, () => {
                                clsPlayer.addCurrencyMulti(BonusData.currency, (newCurrency) => {
                                    resolve({ retData:{ code: ERRCODES().SUCCESS, bonusItem: BonusData.items, currency: newCurrency}, nodeType:NodeType});
                                });
                            });
                        } else {
                            resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                        }
                    });
                } else if (NodeType === 3) {
                    // 诗集
                    /*var collect = new collectController(clsPlayer.getUUID(),multiController, taskController);
                    collect.addNewPoetry(Param1, (newPoetry) => {
                        callback({ code: ERRCODES().SUCCESS, poetryData: newPoetry }, NodeType);
                    });*/
                    resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                } else if (NodeType === 4) {
                    // 技能解锁相关（加入技能列表）
                    clsHero.checkSkillValid(Param1, skillValid => {
                        if (skillValid) {
                            clsHero.addSkill(Param1, newSkillList => {
                                resolve({ retData:{ code: ERRCODES().SUCCESS, skillList: newSkillList}, nodeType:NodeType});
                            });
                        } else {
                            resolve({ retData:{ code: ERRCODES().HERO_SKILL_REAL_UNLOCK}, nodeType:NodeType});
                        }
                    });
                } else if (NodeType === 5) {
                    // 技能强化相关
                    clsHero.checkSkillGroupValid(Param1, skillValid => {
                        if (skillValid) {
                            clsHero.skillLevelUp(Param1, 1, newSkillList => {
                                resolve({ retData:{ code: ERRCODES().SUCCESS, skillList: newSkillList}, nodeType:NodeType});
                            });
                        } else {
                            // 说明没有改升级技能的上一等级技能
                            resolve({ retData:{ code: ERRCODES().HERO_SKILL_NOT_LEVELUP }, nodeType:NodeType});
                        }
                    });
                } else if (NodeType === 6) {
                    // 皮肤
                    clsHero.addSkin(Param1, newSkin => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, skinData: newSkin}, nodeType:NodeType});
                    });
                } else if (NodeType === 7) {
                    // 墨魂配音
                    var collect = new collectController(clsPlayer.getUUID(),multiController, taskController);
                    collect.addNewHeroSound(Param1, (newSound) => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, soundData: newSound}, nodeType:NodeType});
                    });
                } else if (NodeType === 8) {
                    // 家具
                    var stockPtr = new stockController(clsPlayer.getUUID(),multiController, taskController),
                        newStock = { id: Param1, count: 1 };
                    stockPtr.addStock([newStock], () => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, stockData: newStock}, nodeType:NodeType});
                    });
                } else if (NodeType === 9) {
                    // 任务（暂无）
                    resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                } else if (NodeType === 10) {
                    if (Param1 === 1) {
                        // 设为助手
                        var assistantStat = 1;
    
                        taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroHelper,[{params:[clsHero.getHeroId()]}] )
                        // request.taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroAppointNode,[{params:[request.body.sceneid]}]);
    
                        // taskController.addTaskCounter(taskData, clsPlayer.getUUID(), 742, [clsHero.getHeroId()], () => {
                            clsHero.setAssistantStat(clsHero.getHeroId(), assistantStat, () => {
                                resolve({ retData:{ code: ERRCODES().SUCCESS, assistantStat: assistantStat }, nodeType:NodeType});
                            });
                        // });
                    } else if (Param1 === 2) {
                        // 茶会邀请
                        var Quiz = new externalController(clsPlayer.getUUID(), multiController, taskController);
                        Quiz.getHeroQuizInfo(clsHero.getHeroId(), quizData => {
                            PursueTreeHeros.getNodeParamConfig(2, clsHero.getHeroId(), nodeId, Param2 => {
                                Quiz.addHeroQuizCount(clsHero.getHeroId(), parseInt(Param2), targetQuiz => {
                                    resolve({ retData:{ code: ERRCODES().SUCCESS, quizData: targetQuiz }, nodeType:NodeType});
                                });
                            });
                        });
                    } else if (Param1 === 3) {
                        // 灵感委托
                        clsHero.setLinggDepositStat(1, linggDepositStat => {
                            resolve({ retData:{ code: ERRCODES().SUCCESS, linggDepositStat: linggDepositStat }, nodeType:NodeType});
                        });
                    } else if (Param1 === 4) {
                        // 魂力委托
                        clsHero.setSoulDepositStat(1, soulDepositStat => {
                            resolve({ retData:{ code: ERRCODES().SUCCESS, soulDepositStat: soulDepositStat}, nodeType:NodeType });
                        });
                    } else {
                        resolve({ retData:{ code: ERRCODES().SUCCESS }, nodeType:NodeType });
                    }
                } else if (NodeType === 11) {
                    // 档案
                    clsHero.addHeroFileList(Param1, () => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, fileId: Param1 }, nodeType:NodeType });
                    });
                } else if (NodeType === 12) {
                    // 头像
                    clsPlayer.addGameHeadList(Param1, () => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, gameHeadId: Param1}, nodeType:NodeType});
                    });
                } else if (NodeType === 13) {
                    // 加入剧情
                    /*
                    var collect = new collectController(clsPlayer.getUUID(),multiController, taskContoller);
                    collect.addNewScene (Param1, sceneData=> {
                        PursueTreeHeros.getBonusConfig(clsHero.getHeroId(), nodeId, BonusData => {
                            if (BonusData) {
                                clsPlayer.addItem(BonusData.items, () => {
                                    clsPlayer.addCurrencyMulti(BonusData.currency, (newCurrency) => {
                                        resolve({ code: ERRCODES().SUCCESS, bonusItem: BonusData.items, currency: newCurrency, sceneData: sceneData }, NodeType);
                                    }, taskData);
                                }, taskData);
                            } else {
                                resolve({ code: ERRCODES().SUCCESS, sceneData: sceneData }, NodeType);
                            }
                        });
                    });
                    */

                    PursueTreeHeros.getBonusConfig(clsHero.getHeroId(), nodeId, BonusData => {
                        if (BonusData) {
                            clsPlayer.addItem(BonusData.items, () => {
                                clsPlayer.addCurrencyMulti(BonusData.currency, (newCurrency) => {
                                    resolve({ retData:{ code: ERRCODES().SUCCESS, bonusItem: BonusData.items, currency: newCurrency}, nodeType:NodeType});
                                });
                            });
                        } else {
                            resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                        }
                    });

                } else if (NodeType === 1000) {
                    // CG
                    let collect = new collectController(clsPlayer.getUUID(),multiController, taskController);
                    collect.addNewCG(Param1, (newCG) => {
                        resolve({ retData:{ code: ERRCODES().SUCCESS, cgData: newCG }, nodeType:NodeType});
                    });
                } else {
                    resolve({ retData:{ code: ERRCODES().SUCCESS}, nodeType:NodeType});
                }
            });
        });
    });

}

async function autoUnlockNodeId(clsHero, nodeId)
{
    return new Promise( resolve => {
        clsHero.checkPursueTreeNodeIsExist(nodeId, valid => {
            if (valid) {
                // 已存在改自动触发的追求树节点
                resolve(null);
            } else {
                PursueTreeHeros.getCounterConfig(clsHero.getHeroId(), counter => {
                    clsHero.getPursueTreeList(async pursueTreeList => {
                        if (pursueTreeList.length >= counter) {
                            // 完成全部节点
                            await clsHero.addPursueTreeNode(nodeId);
                            resolve({ nodeId: nodeId, status: 1 });
                        } else {
                            resolve(null);
                        }
                    });
                });
            }
        });
    });
}

function setNodeIdAboutAssistant(uuid, heroId,multiController, taskController,callback, heroPtr=null)
{
    if (heroId && heroId > 0) {
        PursueTree.getNodeListByTypeConfig(PursueTreeHeros.getTypeConfig(heroId, 10), 10, NodeIdGroup => {
            PursueTreeHeros.getHeroNodeListByNodeGroupConfig(heroId, NodeIdGroup, NodeList => {
                var nodeId = 0;
                for (let i in NodeList) {
                    if (NodeList.NodeParam1 === 1) {
                        nodeId = NodeList.NodeID;
                        break;
                    }
                }

                if (nodeId > 0) {
                    var hero = (heroPtr ? heroPtr : new heroController(uuid, heroId,multiController, taskController));
                    hero.checkPursueTreeNodeIsExist(nodeId, async valid => {
                        if (valid) {
                            callback();
                        } else {
                            await hero.addPursueTreeNode(nodeId);
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            });
        });
    } else {
        callback();
    }
}



// 任务计数相关（追求树）
function taskCounterPursueTree(uuid, hid, nid, ntype, finishFlag, assistantFlag, taskController, callback)
{
    taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.UnlockAppointNode,[{params:[0]}]);
    taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Unlock_Node_A,[
        { params: [hid, nid], num: 1 },
        { params: [hid, ntype], num: 1 }
    ]);
    if(finishFlag){
        taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.Unlock_Complete_Hero,[{params:[hid]}]);
    }
    callback()
}




exports.checkConditionValid = checkConditionValid;
exports.doUnlock = doUnlock;
exports.autoUnlockNodeId = autoUnlockNodeId;
exports.setNodeIdAboutAssistant = setNodeIdAboutAssistant;
exports.taskCounterPursueTree = taskCounterPursueTree;
