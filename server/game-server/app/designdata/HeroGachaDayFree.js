// ==========================================================
// 找墨魂每日免费
// ==========================================================

let FIXED_HEROGACHADAYFREE = null
let FIXED_HEROGACHADAYFREE_INDEXES = null

class HeroGachaDayFree
{
    static getDayFreeListConfig()
    {
        if(!FIXED_HEROGACHADAYFREE){FIXED_HEROGACHADAYFREE = global.FIXDB.FIXED_HEROGACHADAYFREE}
        if(!FIXED_HEROGACHADAYFREE_INDEXES){FIXED_HEROGACHADAYFREE_INDEXES = global.FIXDB.FIXED_HEROGACHADAYFREE_INDEXES}
        var idLis = FIXED_HEROGACHADAYFREE_INDEXES['Type1'], node, lis = [];
        if (idLis) {
            for (let id of idLis) {
                node = FIXED_HEROGACHADAYFREE[id];
                if (node) {
                    lis.push({ Sort: node.Sort, AreaId: node.AreaId });
                }
            }

            lis.sort((a, b) => { return a.Sort > b.Sort; });
        } else {
            console.warn("[HeroGachaDayFree][getDayFreeListConfig] Indexes is null: Type1");
        }

        return lis;
    }

    static getFreeAreaIdConfig(dayFreeSelect)
    {
        if(!FIXED_HEROGACHADAYFREE){FIXED_HEROGACHADAYFREE = global.FIXDB.FIXED_HEROGACHADAYFREE}
        if(!FIXED_HEROGACHADAYFREE_INDEXES){FIXED_HEROGACHADAYFREE_INDEXES = global.FIXDB.FIXED_HEROGACHADAYFREE_INDEXES}
        var idLis = FIXED_HEROGACHADAYFREE_INDEXES['Type1'], node, freeAreaId = 0;
        if (dayFreeSelect > 0 && idLis) {
            for (let id of idLis) {
                node = FIXED_HEROGACHADAYFREE[id];
                if (node && node.Sort === dayFreeSelect) {
                    freeAreaId = node.AreaId;
                    break;
                }
            }
        }

        return freeAreaId;
    }

    static getDayFreeSelectLimitConfig()
    {
        if(!FIXED_HEROGACHADAYFREE){FIXED_HEROGACHADAYFREE = global.FIXDB.FIXED_HEROGACHADAYFREE}
        if(!FIXED_HEROGACHADAYFREE_INDEXES){FIXED_HEROGACHADAYFREE_INDEXES = global.FIXDB.FIXED_HEROGACHADAYFREE_INDEXES}
        var idLis = FIXED_HEROGACHADAYFREE_INDEXES['Type1'], min = 0, max = 0, node;
        if (idLis && idLis.length > 0) {
            node = FIXED_HEROGACHADAYFREE[idLis[0]];
            if (node) min = node.Sort;
            node = FIXED_HEROGACHADAYFREE[idLis[idLis.length-1]];
            if (node) max = node.Sort;
        }
        return [min, max];
    }
}

module.exports = HeroGachaDayFree;
