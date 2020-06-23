const ERRCODES = require('./../../common/error.codes');
const protocol = require('./../../common/protocol');
const PursueTree = require('./../../designdata/PursueTree');
const PursueTreeHeros = require('./../../designdata/PursueTreeHeros');
const playerController = require('./../controllers/playerController');
const heroController = require('./../controllers/heroController');
const pursueTreeController = require('./../controllers/pursueTreeController');
const taskController = require('./../controllers/taskController');
const CONSTANTS = require('./../../common/constants');
/**
 * PursueTreeList - 获取追求树列表
 * @param {*} request { httpuuid, uuid, heroId }
 * @param {*} response
 */
function PursueTreeList(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    var hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
    hero.getPursueTreeListByHeroId(request.body.heroId, heroTreeGroup => {
        respData.treeData = heroTreeGroup;
        request.multiController.save(async function(err,data){
            if(err){
                respData.code = ERRCODES().FAILED;
                return protocol.responseSend(response, respData);
            }
            protocol.responseSend(response, respData);
        })
    });
}

/**
 * PursueTreeUnlock - 追求树解锁节点
 * @param {*} request { httpuuid, uuid, heroId, nodeId }
 * @param {*} response
 */
function PursueTreeUnlock(request, response)
{
    let respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if (request.body.heroId < 1 || request.body.nodeId < 1) {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    } else {
        PursueTreeHeros.getShowStatConfig(request.body.heroId, request.body.nodeId, ShowStat => {
            if (ShowStat === null) {
                respData.code = ERRCODES().FAILED;
                protocol.responseSend(response, respData);
            } else if (ShowStat === 1) {
                var hero = new heroController(request.body.uuid, request.body.heroId,request.multiController, request.taskController);
                hero.checkHero(valid => {
                    if (valid) {
                        // 判断节点是否已存在
                        hero.checkPursueTreeNodeIsExist(request.body.nodeId, nodeValid => {
                            if (!nodeValid) {
                                // 判断前置节点是否解锁
                                PursueTree.getPrevNodeIdConfig(PursueTreeHeros.getTypeConfig(request.body.heroId, request.body.nodeId), request.body.nodeId, PrevNodeId => {
                                    hero.checkPursueTreeNodeIsExist(PrevNodeId, prevNodeValid => {
                                        if (prevNodeValid) {
                                            // 判断解锁条件是否达成
                                            let player = new playerController(request.body.uuid,request.multiController, request.taskController);
                                            pursueTreeController.checkConditionValid(player, hero, request.body.nodeId, async ValidData => {
                                                if (ValidData.code === ERRCODES().SUCCESS) {
                                                    // taskController.getTaskDataFromSource(request.body.uuid, async TaskData => {
                                                        let unlockRetData = await pursueTreeController.doUnlock(player, hero, request.body.nodeId, request.multiController, request.taskController);
                                                        let retData = unlockRetData.retData, NodeType = unlockRetData.NodeType;
                                                        if (retData.code === ERRCODES().SUCCESS) {
                                                            let CostData = ValidData.costData;
                                                            if (CostData) { // 需要消耗
                                                                // 消耗物品
                                                                player.costItem(CostData.items, () => {
                                                                    if (CostData.items.length > 0) respData.costItem = CostData.items;
                                                                    // 消耗货币
                                                                    player.costCurrencyMulti(CostData.currency, newCurrency => {
                                                                        respData.currency = newCurrency;
                                                                        // 消耗墨魂属性
                                                                        hero.costAttrs(CostData.attrs, async newAttrs => {
                                                                            respData.attrs = newAttrs;
                                                                            // 将解锁的节点加入到解锁列表中
                                                                            await hero.addPursueTreeNode(request.body.nodeId);
                                                                            respData.nodeData = [{ nodeId: request.body.nodeId, status: 1 }];
                                                                            let autoNodeData = await pursueTreeController.autoUnlockNodeId(hero, 1000);
                                                                            if (autoNodeData) respData.nodeData.push(autoNodeData);
                                                                            if (retData.bonusItem) respData.bonusItem = retData.bonusItem;
                                                                            if (retData.currency) respData.currency = retData.currency;
                                                                            if (retData.skillList) respData.skillList = retData.skillList;
                                                                            if (retData.poetryData) respData.poetryData = retData.poetryData;
                                                                            if (retData.soundData) respData.soundData = retData.soundData;
                                                                            if (retData.assistantStat) respData.assistantStat = retData.assistantStat;
                                                                            if (retData.quizData) respData.quizData = retData.quizData;
                                                                            if (retData.fileId) respData.fileId = retData.fileId;
                                                                            if (retData.gameHeadId) respData.gameHeadId = retData.gameHeadId;
                                                                            if (retData.stockData) respData.stockData = retData.stockData;
                                                                            if (retData.cgData) respData.cgData = retData.cgData;
                                                                            if (retData.skinData) respData.skinData = retData.skinData;
                                                                            if (retData.linggDepositStat) respData.linggDepositStat = retData.linggDepositStat;
                                                                            if (retData.soulDepositStat) respData.soulDepositStat = retData.soulDepositStat;
                                                                            if (retData.sceneData) respData.sceneData = retData.sceneData;
                                                                            pursueTreeController.taskCounterPursueTree(request.body.uuid, request.body.heroId, request.body.nodeId, NodeType, (autoNodeData != null), retData.assistantStat, request.taskController,async () => {
                                                                                    // respData.taskEventData = taskEventData;
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
                                                                    });
                                                                });
                                                            } else {
                                                                // 将解锁的节点加入到解锁列表中
                                                                await hero.addPursueTreeNode(request.body.nodeId);
                                                                respData.nodeData = [{ nodeId: request.body.nodeId, status: 1 }];
                                                                let autoNodeData = await pursueTreeController.autoUnlockNodeId(hero, 1000);
                                                                if (autoNodeData) respData.nodeData.push(autoNodeData);
                                                                if (retData.bonusItem) respData.bonusItem = retData.bonusItem;
                                                                if (retData.currency) respData.currency = retData.currency;
                                                                if (retData.skillList) respData.skillList = retData.skillList;
                                                                if (retData.poetryData) respData.poetryData = retData.poetryData;
                                                                if (retData.soundData) respData.soundData = retData.soundData;
                                                                if (retData.assistantStat) respData.assistantStat = retData.assistantStat;
                                                                if (retData.quizData) respData.quizData = retData.quizData;
                                                                if (retData.fileId) respData.fileId = retData.fileId;
                                                                if (retData.gameHeadId) respData.gameHeadId = retData.gameHeadId;
                                                                if (retData.stockData) respData.stockData = retData.stockData;
                                                                if (retData.cgData) respData.cgData = retData.cgData;
                                                                if (retData.skinData) respData.skinData = retData.skinData;
                                                                if (retData.linggDepositStat) respData.linggDepositStat = retData.linggDepositStat;
                                                                if (retData.soulDepositStat) respData.soulDepositStat = retData.soulDepositStat;
                                                                if (retData.sceneData) respData.sceneData = retData.sceneData;
                                                                pursueTreeController.taskCounterPursueTree(request.body.uuid, request.body.heroId, request.body.nodeId, NodeType, (autoNodeData != null), retData.assistantStat, request.taskController,() => {
                                                                        // respData.taskEventData = taskEventData;
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
                                                                    }, TaskData);
                                                            }
                                                        } else {
                                                            respData.code = retData.code;
                                                            protocol.responseSend(response, respData);
                                                        }
                                                    // });
                                                } else {
                                                    respData.code = ValidData.code;
                                                    protocol.responseSend(response, respData);
                                                }
                                            })
                                        } else {
                                            // 前置节点未解锁
                                            respData.code = ERRCODES().PURSUETREE_NODE_PREVNODE_LOCKED;
                                            protocol.responseSend(response, respData);
                                        }
                                    });
                                });
                            } else {
                                // 追求树节点已解锁
                                respData.code = ERRCODES().PURSUETREE_NODE_UNLOCKED;
                                protocol.responseSend(response, respData);
                            }
                        });
                    } else {
                        // 不存在该墨魂
                        respData.code = ERRCODES().HERO_IS_NOT_EXIST;
                        protocol.responseSend(response, respData);
                    }
                });
            } else {
                // 系客户端参数错误
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            }
        });
    }
}

exports.PursueTreeList = PursueTreeList;
exports.PursueTreeUnlock = PursueTreeUnlock;