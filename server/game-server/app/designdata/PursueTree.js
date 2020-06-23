// ==========================================================
// 追求树
// ==========================================================
let FIXED_PURSUETREE = null
let FIXED_PURSUETREE_INDEXES = null

class PursueTree
{
    // 获取节点类型配置
    static getNodeTypeConfig(type, nodeId, callback)
    {
        if(!FIXED_PURSUETREE){FIXED_PURSUETREE = global.FIXDB.FIXED_PURSUETREE}
        if(!FIXED_PURSUETREE_INDEXES){FIXED_PURSUETREE_INDEXES = global.FIXDB.FIXED_PURSUETREE_INDEXES}
        if (type && nodeId) {
            var idLis = FIXED_PURSUETREE_INDEXES['Type_NodeID_' + type + '_' + nodeId],
                node = FIXED_PURSUETREE[idLis[0]];
            if (node) {
                callback(node.NodeType);
            } else {
                console.warn("[PursueTree][getNodeTypeConfig] null: ", type, nodeId);
                callback(0);
            }
        } else {
            console.warn("[PursueTree][getNodeTypeConfig] type, nodeId wrong: ", type, nodeId);
            callback(0);
        }
    }

    // 前置节点ID
    static getPrevNodeIdConfig(type, nodeId, callback)
    {
        if(!FIXED_PURSUETREE){FIXED_PURSUETREE = global.FIXDB.FIXED_PURSUETREE}
        if(!FIXED_PURSUETREE_INDEXES){FIXED_PURSUETREE_INDEXES = global.FIXDB.FIXED_PURSUETREE_INDEXES}

        var idLis = FIXED_PURSUETREE_INDEXES['Type_NodeID_' + type + '_' + nodeId],
            node = FIXED_PURSUETREE[idLis[0]];
        if (node) {
            callback(node.PrevNodeID);
        } else {
            console.error("[PursueTree][getPrevNodeIdConfig] null: ", nodeId);
            callback(0);
        }
    }

    // 获取节点ID列表根据节点类型
    static getNodeListByTypeConfig(type, nodeType, callback)
    {
        if(!FIXED_PURSUETREE){FIXED_PURSUETREE = global.FIXDB.FIXED_PURSUETREE}
        if(!FIXED_PURSUETREE_INDEXES){FIXED_PURSUETREE_INDEXES = global.FIXDB.FIXED_PURSUETREE_INDEXES}
        var idLis = FIXED_PURSUETREE_INDEXES['Type_NodeType_' + type + '_' + nodeType], node, lis = [];
        for (let id of idLis) {
            node = FIXED_PURSUETREE[id];
            if (node) {
                lis.push(node.NodeID);
            }
        }
        callback(lis);
    }
}

module.exports = PursueTree;
