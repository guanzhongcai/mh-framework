// ============================================================
//  墨魂
// ============================================================

let FIXED_HEROS = null;
let FIXED_HEROS_INDEXES = null

class HeroConfig
{
    static HERO_STATS()
    {
        return {
            ALL: 0,
            ENABLE: 1,
            DISABLE: 2,
        }
    }

    static getHeroIdList()
    {
        if(!FIXED_HEROS_INDEXES){FIXED_HEROS_INDEXES = global.FIXDB.FIXED_HEROS_INDEXES}
        var lis = FIXED_HEROS_INDEXES['EnableStat' + HeroConfig.HERO_STATS().ENABLE];
        return (lis ? lis : []);
    }

    static checkHeroId(heroId)
    {
        if(!FIXED_HEROS){FIXED_HEROS = global.FIXDB.FIXED_HEROS}
        var node = FIXED_HEROS[heroId];
        return (node && node.EnableStat == HeroConfig.HERO_STATS().ENABLE);
    }
}

module.exports = HeroConfig;
