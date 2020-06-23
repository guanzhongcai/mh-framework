// ==========================================================
// 追求树墨魂
// ==========================================================
const utils = require('./../common/utils');
const categoryFromItemList = require('./../scripts/controllers/fixedController').categoryFromItemList;

let FIXED_PURSUETREEHEROS = null
let FIXED_PURSUETREEHEROS_INDEXES = null

class PursueTreeHeros
{
    static getNodeParamConfig(pos, heroId, nodeId, callback)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}

        var id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0],
            node = FIXED_PURSUETREEHEROS[id];
        if (node) {
            callback(node['NodeParam' + pos]);
        } else {
            console.error("[PursueTreeHeros][getNodeParamConfig] null: ", pos, heroId, nodeId);
            callback(null);
        }
    }

    // 获取奖励（节点类型为1，2）
    static getBonusConfig(heroId, nodeId, callback)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}

        var id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0],
            node = FIXED_PURSUETREEHEROS[id];
        if (node) {
            if (node.NodeParam2.toString().includes(',')) {
                callback(categoryFromItemList(utils.getItemArraySplitTwice(node.NodeParam2, '|', ',')));
            } else {
                callback(null);
            }
        } else {
            console.error("[PursueTreeHeros][getBonusConfig] null: ", pos, heroId, nodeId);
            callback(null);
        }
    }

    // 解锁条件列表 [{ type, id, value }]
    static getUnlockConditionListConfig(heroId, nodeId, callback)
    {
        var lis = [];
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0],
            node = FIXED_PURSUETREEHEROS[id];
        if (node) {
            for (let i of [1, 2, 3]) {
                var condType = node['UnlockConditionType'+i],
                    condParam = node['UnlockConditionParam'+i];
                if (condType === 5) {
                    if (condParam.includes('|')) {
                        lis.push({
                            type: condType,
                            params: utils.splitToIntArray(condParam.split('|')[1], ',')
                        });
                    }
                }else if (condType === 6) {
                    // 配置追求树技能节点条件 通过任务计数来实现 先忽略此条件
                } else if (condType > 0) {
                    if (condParam.includes(',')) {
                        var tmps = utils.splitToIntArray(condParam, ',');
                        lis.push({
                            type: condType,
                            params: [ { id:tmps[0], count: tmps[1] } ]
                        });
                    }
                }
            }
        }
        callback(lis);
    }

    static getShowStatConfig(heroId, nodeId, callback)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0],
            node = FIXED_PURSUETREEHEROS[id];
        if (node) {
            callback(node.ShowStat);
        } else {
            console.error("[PursueTreeHeros][getShowStatConfig] null: ", heroId, nodeId);
            callback(null);
        }
    }

    static getTypeConfig(heroId, nodeId)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0],
    node = FIXED_PURSUETREEHEROS[id], type = null

        if (node) {
            type = node.Type;
        } else {
            console.warn("[PursueTreeHeros][getTypeConfig] null: ", heroId, nodeId);
        }
        return type;
    }

    static getCounterConfig(heroId, callback)
    {
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var idLis = FIXED_PURSUETREEHEROS_INDEXES['HeroID_ShowStat_' + heroId + '_1'];
        callback(idLis ? idLis.length : 0);
    }

    static getHeroNodeListByNodeGroupConfig(heroId, nodeIdGroup, callback)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var id, node, lis = [];
        for (let nodeId of nodeIdGroup) {
            id = FIXED_PURSUETREEHEROS_INDEXES['HeroID_NodeID_' + heroId + '_' + nodeId][0];
            node = FIXED_PURSUETREEHEROS[id];
            if (node) {
                lis.push({
                    NodeID: node.NodeID,
                    NodeParam1: node.NodeParam1
                });
            }
        }

        callback(lis);
    }

    /**
     * getHeroNodeAll - 获取墨魂的全部追求树节点
     * @param {Number} heroId
     */
    static getHeroNodeAll(heroId)
    {
        if(!FIXED_PURSUETREEHEROS){FIXED_PURSUETREEHEROS = global.FIXDB.FIXED_PURSUETREEHEROS}
        if(!FIXED_PURSUETREEHEROS_INDEXES){FIXED_PURSUETREEHEROS_INDEXES = global.FIXDB.FIXED_PURSUETREEHEROS_INDEXES}
        var idLis = FIXED_PURSUETREEHEROS_INDEXES['HeroID_ShowStat_' + heroId + '_1'];
        if (!Array.isArray(idLis)) idLis = [];
        if (FIXED_PURSUETREEHEROS_INDEXES['HeroID_ShowStat_' + heroId + '_3']) {
            idLis = idLis.concat(FIXED_PURSUETREEHEROS_INDEXES['HeroID_ShowStat_' + heroId + '_3']);
        }
        var lis = [], node;
        for (let cId of idLis) {
            node = FIXED_PURSUETREEHEROS[cId];
            if (node) {
                lis.push(node.NodeID);
            }
        }

        return lis;
    }
}

module.exports = PursueTreeHeros;
