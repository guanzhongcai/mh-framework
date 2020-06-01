function InspModel()
{
    return {
        uuid: 0,
        inspBuyCount: 0, // 每日购买次数
        inspCountUpStartTime: 0,
        inspCount: 0,
        inspActionPoint: 0,
        themeList: [1],
        useEffectItem:[], // 使用道具列表（用于掷骰子效果）
        inspData: [
            {
                themeId: 1,
                playHeroId: 0,
                currGridPos: 0,
                mapData: []
            }
        ]
    }
}

function InspThemeModel()
{
    return {
        themeId: 0,
        playHeroId: 0,
        extBonus: {
            upLingg: 0
        },
        mapData: []
    }
}

exports.InspModel = InspModel;
exports.InspThemeModel = InspThemeModel;