const SoulGameCard = require('./fixedController').SoulGameCard;
const SoulGameTheme = require('./fixedController').SoulGameTheme;
const SoulGameViewPoint = require('./fixedController').SoulGameViewPoint;
const GeneralAwards = require('./fixedController').GeneralAwards;
const heroController = require('./heroController');
const playerController = require('./playerController');
const Notification = require('./notifController').Notification;
const skillController = require('./../controllers/skillController');
const models = require('./../models');
const utils = require('./../../common/utils');
const gameConfigData = require('./../../../configs/gamedata.json');
const async = require ('async');
var assert = require ('assert');
const CONSTANTS = require('./../../common/constants');
const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

class soulController
{
    static CardType (){
        return {
            A:1,
            B:2,
            C:3,
            D:4,
            E:5,
        }
    }

    static soulGameRound (){
        return {
            ROUND_ONE:1,
            ROUND_TWO:2,
            ROUND_THREE:3,
            ROUND_FOUR:4,
            ROUND_FIVE:5
        }
    }

    static SoulGameStatus (){
        return {
            GAMESTART:1,
            GAMEEND:2,
        }
    }

    constructor(uuid,multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'SoulGameData';
        this.soulGameData = null;
        this.soulGameRedisDataString = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    getSoulGameDataFromDataSource (callback) {
        if (this.soulGameData == null) {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sSoulGameData => {
                this.soulGameRedisDataString = sSoulGameData;
                let doc = sSoulGameData && validator.isJSON(sSoulGameData)? JSON.parse(sSoulGameData) : null;
                this.soulGameData = doc;
                callback (doc);
            });
        }else {
            callback (this.soulGameData);
        }
    }

    saveSoulGameDataImmediately (callback) {
        this.saveSoulGameDataToDataSource (this.soulGameData, callback, true);
    }

    saveSoulGameDataToDataSource (soulGameData, callback) {
        if (soulGameData != null) {
            let saveString = JSON.stringify(soulGameData);
            let shouldSave = true;
            if (this.soulGameRedisDataString == null || this.soulGameRedisDataString != saveString) {
                shouldSave = true;
            }
            if (shouldSave) {
                this.soulGameData = soulGameData;
                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_,saveString)
                this.soulGameRedisDataString = saveString;
                callback(true);
            }else {
                callback (true);
            }
        }else {
            callback (true)
        }
    }

    // 获取当前主题体力消耗信息
    getSoulGameCostInfo (callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.costInfo && doc.costInfo.attrs){
                let costEnergy = 0;
                for (let i in doc.costInfo.attrs){
                    if (doc.costInfo.attrs[i].id == gameConfigData.SOULGAME.SoulGameAttrsEnergyId) {
                        costEnergy += doc.costInfo.attrs[i].count;
                    }
                }
                callback (costEnergy);
            }else{
                callback(gameConfigData.SOULGAME.SoulGameCostEnergy);
            }
        });
    }

    // =================================================================
    // 魂力购买次数
    // =================================================================
    getSoulGameBuyCount(callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            callback(doc ? doc.soulBuyCount : 0);
        });
    }

    addSoulGameBuyCount(v, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.soulBuyCount != null) {
                doc.soulBuyCount += v;
                this.saveSoulGameDataToDataSource (doc, () => {
                    callback(doc.soulBuyCount);
                });
            }else {
                callback(1);
            }
        });
    }

    setSoulGameBuyCount(v, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.soulBuyCount != null) {
                doc.soulBuyCount = v;
                this.saveSoulGameDataToDataSource (doc, () => {
                    callback(doc.soulBuyCount);
                });
            }else {
                callback();
            }
        });
    }

    // =================================================================
    // 魂力玩法次数
    // =================================================================
    getSoulGameCountCd(st)
    {
        var now = (new Date()).getTime();
        var cd = gameConfigData.SOULGAME.SoulGameUpdateTime - (now-st);
        if (cd < 0) cd = 0;
        return cd;
    }

    setSoulGameCountUpStartTime(st, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.soulUpTime != null) {
                if (doc.soulUpTime == 0) {
                    doc.soulUpTime = st;
                    this.saveSoulGameDataToDataSource (doc, () => {
                        callback(doc.soulUpTime)
                    });
                } else {
                    callback(doc.soulUpTime);
                }
            } else {
                callback(0);
            }
        });
    }

    calcSoulGameRefreshedCount (lastTime, curTime)
    {
        var refreshedCount = 0;
        var pastTime = curTime - lastTime;
        while (pastTime - gameConfigData.SOULGAME.SoulGameUpdateTime >= 0)
        {
            refreshedCount += 1;
            pastTime -= gameConfigData.SOULGAME.SoulGameUpdateTime;
        }
        return refreshedCount;
    }

    resetSoulGameData (isReset, callback) {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.soulCount != null && doc.soulUpTime != null && doc.soulBuyCount != null) {
                if (isReset) {
                    doc.soulCount = gameConfigData.SOULGAME.SoulGameCount;
                    doc.soulUpTime = 0
                    doc.soulBuyCount = 0
                    this.saveSoulGameDataToDataSource (doc, () => {
                        callback();
                    });
                }else {
                    callback ()
                }
            }else {
                callback ();
            }
        });
    }

    updateSoulGameCount(isReset, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.soulCount != null && doc.soulUpTime != null) {
                doc.soulCount = gameConfigData.SOULGAME.SoulGameCount;
                doc.soulUpTime = 0
                    /*取消魂力玩法时间恢复
                    if (doc.soulCount < gameConfigData.SOULGAME.SoulGameCount) {
                        // 需要按时间更新次数
                        var now = (new Date()).getTime();
                        if (doc.soulUpTime === 0)
                            doc.soulUpTime = now;
                        var refreshedCount = this.calcSoulGameRefreshedCount (doc.soulUpTime, now);
                        if (doc.soulCount + refreshedCount >= gameConfigData.SOULGAME.SoulGameCount){
                            doc.soulCount = gameConfigData.SOULGAME.SoulGameCount;
                            doc.soulUpTime = 0
                        }
                        else{
                            doc.soulCount += refreshedCount;
                            doc.soulUpTime +=  refreshedCount * gameConfigData.SOULGAME.SoulGameUpdateTime;
                        }
                    }*/
                this.saveSoulGameDataToDataSource (doc, () => {
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    checkSoulGameCountValid(v, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            let nowCount = doc ? doc.soulCount : 0;
            callback(nowCount >= v);
        });
    }

    isSoulGameCountFull(callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            callback(doc ? (doc.soulCount === gameConfigData.SOULGAME.SoulGameCount) : false);
        });
    }

    getSoulGameCount(callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            callback(doc ? doc.soulCount : 0);
        });
    }


    getSoulGameCountInfo (callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            let soundGameInfo = null;
            if (doc != null) {
                soundGameInfo = {};
                soundGameInfo.soulCount = doc.soulCount;
                soundGameInfo.soulBuyCount = doc.soulBuyCount;
                soundGameInfo.soulUpTime = doc.soulUpTime;
            }
            callback(soundGameInfo);
        });
    }

    addSoulGameCount(v, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            assert (doc != null && doc.soulCount != null && doc.soulUpTime != null, "soul game data should not be null");
            doc.soulCount += v;
            if (doc.soulCount >= gameConfigData.SOULGAME.SoulGameCount) {
                doc.soulUpTime = 0
            }
            this.saveSoulGameDataToDataSource (doc, () => {
                let soulGameInfo = {};
                soulGameInfo.soulCount = doc.soulCount;
                soulGameInfo.soulUpTime = doc.soulUpTime;
                callback (soulGameInfo);
            });
        });
    }

    // 获取下一个主题ID
    getNextThemeId (callback)
    {
        SoulGameTheme.getAllThemesIdConfig (themeIds => {
            this.getSoulGameDataFromDataSource (doc => {
                if (doc && doc.themeUsed != null){
                    let themeUsed = doc.themeUsed;
                    let themeId = 0
                    if (themeUsed.length != themeIds.length){
                        themeIds = utils.shuffle(themeIds);
                        for (let index in themeIds) {
                            themeId = themeIds[index].ThemeId;
                            if (!utils.isArrayContains (themeUsed, themeId))
                                break;
                        }
                        themeUsed.push (themeId);
                        this.saveSoulGameDataToDataSource (doc, () => {
                            callback(themeId);
                        });
                    }else{
                        themeId = utils.getRandomFromArray (themeIds).ThemeId;
                        doc.themeUsed = [themeId];
                        this.saveSoulGameDataToDataSource (doc, () => {
                            callback(themeId);
                        });
                    }
                }
                else{
                    doc = {};
                    let themeId = utils.getRandomFromArray (themeIds).ThemeId;
                    doc.themeUsed = [themeId];
                    this.saveSoulGameDataToDataSource (doc, () => {
                        callback(themeId);
                    });
                }
            });
        });
    }

    // 获取魂力玩法对应的数据
    getSoulGameData(callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc) {
                callback(doc);
            } else {
                // 新建数据
                let soulModel = models.SGDataModel();
                soulModel.uuid = this.uuid_;
                soulModel.soulBuyCount = 0;
                soulModel.soulCount = gameConfigData.SOULGAME.SoulGameCount;
                soulModel.soulUpTime = 0;
                this.getNextThemeId (nextThemeId => {
                    soulModel.themeId = nextThemeId;
                    soulModel.themeUsed = [nextThemeId];
                    SoulGameTheme.getThemeIdCostConfig (nextThemeId, costData => {
                        soulModel.costInfo = costData;
                        this.saveSoulGameDataToDataSource (soulModel, () => {
                            callback(soulModel);
                        });
                    });
                });
            }
        });
    }

    // 检查魂力玩法主题是否匹配
    checkThemeIsValid (themeId, callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.themeId == themeId){
                callback (true);
            }else{
                callback (false);
            }
        });
    }

    // 检查是否有魂力玩法未结束
    checkSoulGameIsAlreadyEnd (callback) {
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.gameData){
                if (doc.gameData.gameStatus == soulController.SoulGameStatus ().GAMESTART){
                    callback (false);
                }else{
                    callback (true);
                }
            }else{
                callback (true);
            }
        });
    }

    // 检查是否是有效的卡牌
    checkSoulGameIsValidCard (cardId, callback){
        this.getSoulGameDataFromDataSource (doc => {
            if (doc && doc.gameData){
                let ownHands = [].concat (doc.gameData.ownCards);
                let roundinfos = doc.gameData.roundInfo
                for (let i in roundinfos) {
                    let round = roundinfos[i];
                    let ownIndex  = ownHands.indexOf (round.ownCard);
                    if (ownIndex != -1) {
                        ownHands.splice (ownIndex, 1);
                    }
                }
                if (utils.isArrayContains (ownHands, cardId)){
                    callback (0);
                }else{
                    callback (1);
                }
            }else{
                callback (-1);
            }
        });
    }

    getCardInfoUsingLoadedConfig (cardid, cardsInfo)
    {
        for (let i in cardsInfo){
            if (cardsInfo[i].CardId == cardid) {
                return cardsInfo[i];
            }
        }
        return null;
    }


    //  根据当前手牌来计算出牌信息
    createNewSoulGameRoundInfo (round, owncards, oppcards, roundinfo, callback){
        if (round == soulController.soulGameRound ().ROUND_ONE){
            let outcard = utils.getRandomFromArray (oppcards);
            callback (outcard);
        }else{
            let ownHands = [].concat (owncards);
            let oppHands = [].concat (oppcards);
            if (roundinfo != null){
                for (let i in roundinfo) {
                    let round = roundinfo[i];

                    let ownIndex  = ownHands.indexOf (round.ownCard);
                    if (ownIndex != -1) {
                        ownHands.splice (ownIndex, 1);
                    }

                    let oppIndex = oppHands.indexOf (round.oppCard);
                    if (oppIndex != -1) {
                        oppHands.splice (oppIndex, 1);
                    }
                }
            }

            if (oppHands.length == 1){
                callback (oppHands[0]);
            }else {
                let cards = [].concat (ownHands) ;
                for (let i in oppHands) {
                    cards.push (oppHands[i]);
                }

                SoulGameCard.getSoulGameTargetCardsConfig (cards, cardsInfo => {
                    let bets = [];
                    for (let i in oppHands){
                        let oppCardInfo = this.getCardInfoUsingLoadedConfig (oppHands[i], cardsInfo);
                        let addScore = 0;
                        for (let j in ownHands) {
                            let handCardInfo = this.getCardInfoUsingLoadedConfig (ownHands[j], cardsInfo);
                            if (utils.isArrayContains (oppCardInfo.WinCards, handCardInfo.CardType)) {
                                addScore += 2;
                            }else if (utils.isArrayContains (oppCardInfo.DrawCards, handCardInfo.CardType)) {
                                addScore += 1;
                            }
                        }
                        bets.push (addScore);
                    }
                    let minIndex = utils.getArrayMinIndex (bets);
                    oppHands.splice (minIndex, 1);
                    let outcard = utils.getRandomFromArray (oppHands);
                    callback (outcard);
                });
            }
        }
    }

    // 创建新对局数据
    createNewSoulGameData (themeId, heroId, viewpoint, callback)
    {
        SoulGameViewPoint.getSoulGameViewPointConfig (themeId, heroId, heroCardInfo => {
            assert (heroCardInfo != null, "should not run here! can not found hand card info");
            SoulGameViewPoint.getSoulGameViewPointConfig (themeId, gameConfigData.SOULGAME.SoulGameHostId, hostCardInfo => {
                assert (hostCardInfo != null, "should not run here! can not found hand card info");

                var gameData = models.SGGameDataModel ();
                gameData.gameStatus = soulController.SoulGameStatus ().GAMESTART;
                gameData.round = soulController.soulGameRound ().ROUND_ONE;
                if (viewpoint == 1){
                    gameData.ownCards = heroCardInfo.ViewPoint1Cards;
                    gameData.oppCards = hostCardInfo.ViewPoint2Cards;
                }else{
                    gameData.ownCards = heroCardInfo.ViewPoint2Cards;
                    gameData.oppCards = hostCardInfo.ViewPoint1Cards;
                }

                this.createNewSoulGameRoundInfo (gameData.round, gameData.ownCards, gameData.oppCards, gameData.roundInfo, outsCard => {
                    let roundInfo = models.SGRoundInfoModel ();
                    roundInfo.round = gameData.round;
                    roundInfo.oppCard = outsCard;
                    roundInfo.roundEnd = 0;
                    gameData.roundInfo.push (roundInfo);
                    callback (gameData);
                });
            });
        });
    }

    //开始灵感游戏玩法
    startNewSoulGame (heroId, viewpoint, callback){
        this.getSoulGameDataFromDataSource (doc => {
            assert(doc != null, "should not run here!! soul game data can not be null");
            var rspData = {};
            rspData.soulCount = doc.soulCount - 1;
            if (doc.soulUpTime == 0){
                let curTime = (new Date()).getTime();
                rspData.soulUpTime = curTime;
            }else{
                rspData.soulUpTime = doc.soulUpTime;
            }
            rspData.themeId = doc.themeId;
            rspData.heroId = heroId;
            rspData.viewpoint = viewpoint;
            this.createNewSoulGameData (rspData.themeId, heroId, viewpoint, soulData => {
                rspData.gameData = soulData;
                doc.soulCount = rspData.soulCount;
                doc.soulUpTime = rspData.soulUpTime;
                doc.heroId = rspData.heroId;
                doc.viewpoint = rspData.viewpoint;
                doc.gameData = rspData.gameData;
                this.saveSoulGameDataToDataSource (doc, () => {
                    callback (rspData);
                });
            });
        });
    }

    //计算打牌输赢
    calcPlayedCardResult (clsHero, heroId, ownCard, oppCard, callback){
        let cards = [ownCard, oppCard];
        SoulGameCard.getSoulGameTargetCardsConfig (cards, async cardsInfo => {
            let result = {};
            let ownCardInfo = this.getCardInfoUsingLoadedConfig (ownCard, cardsInfo);
            let oppCardInfo = this.getCardInfoUsingLoadedConfig (oppCard, cardsInfo);
            result.popularity = [];
            if (utils.isArrayContains (ownCardInfo.WinCards, oppCardInfo.CardType)) {
                result.isWinner = 2;
                result.popularity = [ownCardInfo.WinPopularity, oppCardInfo.LosePopularity];
            }else if (utils.isArrayContains (ownCardInfo.DrawCards, oppCardInfo.CardType)) {
                result.isWinner = 1;
                result.popularity = [ownCardInfo.DrawPopularity, oppCardInfo.DrawPopularity];
            }else {
                result.isWinner = 0;
                result.popularity = [ownCardInfo.LosePopularity, oppCardInfo.WinPopularity];
            }

            let skillEffectData = await skillController.calcHeroActiveSkillEffects(clsHero, skillController.EFFECTSYS().SOULGAME, heroId,null);
            if (skillEffectData.effBuffData != null) {
                if (result.isWinner === 0) {
                    let loss2DrawRate = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().SOULGAMELOSS2DRAW];
                    if (loss2DrawRate != null && loss2DrawRate.value != null) {
                        let seed = utils.getRandom(10000);
                        if (loss2DrawRate.value > 0 && seed <= loss2DrawRate.value) {
                            result.isWinner = 1;
                            result.popularity = [ownCardInfo.DrawPopularity, oppCardInfo.DrawPopularity];
                            result.effSkillList = skillEffectData.effSkillList;
                        }
                        console.log("----skill active log .. change loss game 2 draw", heroId, loss2DrawRate.value)
                    }
                }

                let addPopularity = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDSOULGAMEPOPULARITY];
                if (addPopularity != null && addPopularity.value != null) {
                    result.popularity += addPopularity.value;
                    result.effSkillList = skillEffectData.effSkillList;
                    console.log("----skill active log .. add soul game popularity", heroId, addPopularity.value)
                }
            }

            callback (result);
        });
    }

    // 计算最终结算魂力奖励
    calcAllGameResult (themeId, gamestatus, roundinfos, callback)
    {
        SoulGameTheme.getThemeIdResultConfig (themeId, result => {
            let oppScore = 0;
            let ownScore = 0;
            let gameResult = {}

            if (gamestatus == soulController.SoulGameStatus ().GAMEEND) {
                for (let i in roundinfos){
                    if (roundinfos[i].roundEnd == 1){
                        ownScore += roundinfos[i].popularity[0];
                        oppScore += roundinfos[i].popularity[1];
                    }
                }

                gameResult.baseAdd = result.BaseAdd;
                if (ownScore > oppScore) {
                    gameResult.winAdd = result.WinAdd;
                }else{
                    gameResult.winAdd = 0;
                }

                let addRate = 0;
                for (let i = 0; i < result.PopularityAdd.length; i++) {
                    if (ownScore >= result.PopularityAdd[i][0]){
                        addRate = result.PopularityAdd[i][1] / 100;
                        break;
                    }
                }

                gameResult.popularityAdd = addRate;
                if (addRate != 0){
                    gameResult.addTotal = Math.round ((gameResult.baseAdd + gameResult.winAdd) * (1 + addRate));
                }else {
                    gameResult.addTotal = (gameResult.baseAdd + gameResult.winAdd);
                }

            }else{
                gameResult.baseAdd = Math.round (result.BaseAdd * 0.5);
                gameResult.winAdd = 0;
                gameResult.popularityAdd = 0;
                gameResult.addTotal = gameResult.baseAdd;
            }
            callback (gameResult);
        });
    }

    //手动结束游戏
    setGameOver (callback)
    {
        this.getSoulGameDataFromDataSource (doc => {
            assert(doc && doc.gameData, "should not run here!! soul game data can not be null");
            this.calcAllGameResult (doc.themeId, doc.gameData.gameStatus, doc.gameData.roundInfo, gameResult => {
                doc.gameData.resultInfo = gameResult;
                this.getNextThemeId (nextThemeId => {
                    doc.themeId = nextThemeId;
                    doc.gameData.gameStatus = soulController.SoulGameStatus ().GAMEEND;
                    doc.heroId = null;
                    doc.viewpoint = null;

                    SoulGameTheme.getThemeIdCostConfig (nextThemeId, costData => {
                        doc.costInfo = costData;
                        this.saveSoulGameDataToDataSource (doc, () => {
                            callback (doc);
                        });
                    });
                });
            });
        });
    }

    //出牌
    soulGamePlayCard (clsHero, heroId, cardId, callback){
        this.getSoulGameDataFromDataSource (doc => {
            assert(doc && doc.gameData, "should not run here!! soul game data can not be null");
            let round = doc.gameData.round
            let roundinfo = doc.gameData.roundInfo[round - 1];
            assert (roundinfo != null, "round info should not be null");
            roundinfo.ownCard = cardId;

            this.calcPlayedCardResult (clsHero, heroId, roundinfo.ownCard, roundinfo.oppCard, resultData => {
                roundinfo.popularity = resultData.popularity
                roundinfo.isWinner = resultData.isWinner
                if (resultData.effSkillList != null) roundinfo.effSkillList = resultData.effSkillList;
                roundinfo.roundEnd = 1

                if (round == soulController.soulGameRound ().ROUND_FIVE){
                    doc.gameData.gameStatus = soulController.SoulGameStatus ().GAMEEND;
                    this.calcAllGameResult (doc.themeId, doc.gameData.gameStatus, doc.gameData.roundInfo, gameResult => {
                        doc.gameData.resultInfo = gameResult;
                        this.getNextThemeId (nextThemeId => {
                            doc.themeId = nextThemeId;
                            SoulGameTheme.getThemeIdCostConfig (nextThemeId, costData => {
                                doc.costInfo = costData;
                                doc.heroId = null;
                                doc.viewpoint = null;
                                this.saveSoulGameDataToDataSource (doc, () => {
                                    callback (doc);
                                });
                            });
                        });
                    });
                }else{
                    doc.gameData.round = doc.gameData.round + 1
                    this.createNewSoulGameRoundInfo (doc.gameData.round, doc.gameData.ownCards, doc.gameData.oppCards, doc.gameData.roundInfo, outsCard => {
                        let roundInfo = models.SGRoundInfoModel ();
                        roundInfo.round = doc.gameData.round;
                        roundInfo.oppCard = outsCard;
                        roundInfo.roundEnd = 0;
                        doc.gameData.roundInfo.push (roundInfo);
                        this.saveSoulGameDataToDataSource (doc, () => {
                            callback (doc);
                        });
                    });
                }
            });
        });
    }
}

module.exports = soulController;
