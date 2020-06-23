const utils = require('./../../common/utils');
const ActivityConfig = require('./../../designdata/ActivityConfig');
const itemController = require('./../controllers/itemController');
const fixedController = require('./fixedController');
const GiftItemConfig = require('./../../designdata/GiftItems');
const shopController = require('./../controllers/shopController');
const mailController = require('./../controllers/mailController');
const categoryFromItemList = fixedController.categoryFromItemList;

const ACTIVITY_TYPE_RECHARGE = 1;
const ACTIVITY_TYPE_RECHARGEBACK = 2;
const ACTIVITY_TYPE_LOGIN = 3;

class ActivityController
{
    constructor(uuid, multiController, taskController)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.multiController = multiController;
        this.taskController = taskController;
    }
    
    async getActivityAward(clsPlayer, clsHero, atype, aindex, param) {
        return new Promise(async resolve => {
            let retData = {};
            retData.status = 0;
            let rewardData = [];
            let activityAwardConfig = ActivityConfig.getActivityDataByTypeAndIndex(atype, aindex);
            if (activityAwardConfig != null) {
                if (atype === ACTIVITY_TYPE_RECHARGE) {
                    let awardStatus = await clsPlayer.getFirstRechargeGetAwardStatus();
                    let checkCondition = await clsPlayer.checkFirstRechargeCondition();
                    if (!checkCondition)
                        retData.status = 2;
                    else if (awardStatus)
                        retData.status = 1;
                }else if (atype === ACTIVITY_TYPE_LOGIN) {
                    let checkCondition = await clsPlayer.checkActiveRewardStatusCondition (parseInt(aindex));
                    let awardStatus = await clsPlayer.checkActivityAwardStatis (atype, aindex);
                   if (!checkCondition)
                        retData.status = 2;
                   else if (awardStatus)
                       retData.status = 1;
                }else if (atype === ACTIVITY_TYPE_RECHARGEBACK) {
                    retData.status = 3;
                }
            }else {
                retData.status = 4
            }

            if (retData.status === 0) {
                if (activityAwardConfig.RewardType === 1) {
                    let skinArray = utils.splitToIntArray (activityAwardConfig.Reward, '|')
                    for (let skin of skinArray) {
                        if (skin === param) {
                            rewardData.push(skin);
                            break
                        }
                    }
                }else if (activityAwardConfig.RewardType === 2) {
                    let rewardItems = utils.splitToIntArray (activityAwardConfig.Reward, '|')
                    let rwdId = utils.getRandomFromArray(rewardItems)
                    if (rwdId != null && rwdId != 0)
                        rewardData.push(rwdId);
                }else {
                    let rewardItems = utils.splitToIntArray (activityAwardConfig.Reward, '|')
                    rewardData = rewardData.concat(rewardItems);
                }

                if (rewardData.length <= 0) {
                    retData.status = 5;
                    resolve (retData);
                }else {
                    fixedController.GeneralAwards.getBonusConfig(rewardData, bonusData => {
                        clsPlayer.addCurrencyMulti(bonusData.currency, newCurreny => {
                            if (bonusData.currency.filter((a) => { return a > 0; }).length > 0) {
                                retData.currency = newCurreny;
                            }
                            // heros
                            clsHero.getConvertNewHeroAndPieceItem(bonusData.heros, (addHeroGroup, pieceHeroGroup) => {
                                // 获取墨魂碎片物品
                                fixedController.Items.getItemListByHeroIdGroupConfig(pieceHeroGroup, pieceItemLis => {
                                    bonusData.items = bonusData.items.concat(pieceItemLis);
                                    clsHero.addHeroGroup(addHeroGroup, () => {
                                        if (addHeroGroup.length > 0) retData.heroList = addHeroGroup;
                                        // hero-skins
                                        clsPlayer.getItemList(playerItemLis => {
                                            clsHero.getSkinHeroMap(skinHeroMap => {
                                                let upSkinLis = [];
                                                [bonusData.items, upSkinLis] = itemController.bonusHeroSkin(bonusData.items, upSkinLis, playerItemLis, skinHeroMap, bonusData.skinitems);
                                                clsHero.setUpSkinHeroGroup(upSkinLis, () => {
                                                    if (upSkinLis.length > 0) {
                                                        retData.heroSkinList = upSkinLis;
                                                    }
                                                    // items
                                                    clsPlayer.addItem(bonusData.items, () => {
                                                        clsPlayer.addActiveDegreeValue(bonusData.activeDegreeValue, newActDegVal => {
                                                            if (bonusData.activeDegreeValue > 0) retData.actDegValue = newActDegVal;
                                                            if (bonusData.items.length > 0) {
                                                                retData.addItems = bonusData.items;
                                                            }
                                                            resolve (retData);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        },);
                    });
                }
            }else {
                resolve (retData);
            }
        });
    }

    async buyTriggerGift (clsPlayer, clsHero, giftId) {
        const _doLongGift = (uuid, giftId, giftBonus, multiController, callback) =>
        {
            if (giftBonus.longBonus != null) {
                // 说明是持续礼包
                shopController.getShopDataFromSource(uuid, ShopData => {
                    if (!Array.isArray(ShopData.longGiftList)) ShopData.longGiftList = [];
                    ShopData.longGiftList.push({
                        itemId: 0,
                        giftId: giftId,
                        bonus: giftBonus.longBonus, // 持续礼包物品
                        dayCnt: giftBonus.longDayCount-1, // 持续天数（开始就算一日）
                        st: new Date().getTime() // 刚获得时间记录
                    });
                    // 发送持续礼包邮件奖励（第一日）
                    mailController.sendMultiMail(uuid,
                        [mailController.getLongGiftMailModel(giftId, 1, giftBonus.longBonus)], () => {
                            shopController.saveShopDataFromSource(uuid, ShopData, multiController,() => {
                                callback();
                            });
                        });
                });
            } else {
                callback();
            }
        }

        return new Promise( async resolve => {
            let retData = {};
            retData.status = 0;
            let triggerConfigData = ActivityConfig.getTriggerGiftByGiftId(giftId);
            if (triggerConfigData != null) {
                if (triggerConfigData.PriceType == 2) {
                    retData.status = 2;
                    resolve (retData);
                }else {
                    let canBuy = await clsPlayer.checkTriggerGiftCanBuy (giftId);
                    if (canBuy) {
                        let Price = triggerConfigData.Price
                        let costData = categoryFromItemList(utils.getItemArraySplitTwice(Price, '|', ','));
                        if (costData != null) {
                            clsPlayer.currencyMultiValid(costData.currency, currencyRet => {
                                if (currencyRet) {
                                    clsPlayer.itemValid(costData.items, itemRet => {
                                        if (itemRet){
                                            clsPlayer.costCurrencyMulti(costData.currency, newCurrrency => {
                                                clsPlayer.costItem(costData.items, async _ => {
                                                    let triggerData = await clsPlayer.updateTriggerGiftBuyCnt(giftId, 1);
                                                    retData.costItems = costData.items;
                                                    retData.currency = newCurrrency;

                                                    if (triggerData != null) retData.TiggerGift = triggerData;
                                                    var GiftBonus = GiftItemConfig.undoGift(giftId, 1);
                                                    if (GiftBonus) {
                                                        // 加入物品
                                                        itemController.useItemList(GiftBonus.bonus, useItemRetData => {
                                                            _doLongGift(this.uuid_, giftId, GiftBonus, this.multiController, () => {
                                                                if (useItemRetData.addItems) retData.addItems = useItemRetData.addItems;
                                                                if (useItemRetData.currency) retData.currency = useItemRetData.currency;
                                                                if (useItemRetData.heroList) retData.heroList = useItemRetData.heroList;
                                                                if (useItemRetData.heroSkinList) retData.heroSkinList = useItemRetData.heroSkinList;
                                                                resolve (retData);
                                                            });
                                                        }, clsHero, clsPlayer);
                                                    }
                                                    else {
                                                        resolve (retData);
                                                    }
                                                });
                                            });
                                        }else {
                                            retData.status = 5;
                                            resolve (retData);
                                        }
                                    });
                                }else {
                                    retData.status = 4;
                                    resolve (retData);
                                }
                            });
                        }else {
                            retData.status = 3;
                            resolve (retData);
                        }
                    }else {
                        retData.status = 2;
                        resolve (retData);
                    }
                }
            }else {
                retData.status = 1;
                resolve (retData);
            }
        });
    }
}

module.exports = ActivityController;
