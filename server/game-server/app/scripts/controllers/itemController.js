const GiftItems = require('./../../designdata/GiftItems');
const fixedController = require('./fixedController');
const categoryFromItemList = fixedController.categoryFromItemList;
const heroController = require('./heroController');
const taskController = require('./taskController');
const skillController = require('./../controllers/skillController');
const utils = require('./../../common/utils');
const CONSTANTS = require('./../../common/constants');

class itemController
{
    // 道具类型
    static TYPES()
    {
        return {
            ITEM_GIFT: 4 // 礼物
        }
    }

    // 道具子类型
    static SUBTYPES()
    {
        return {
            GIFT_EXP: 1,               // 礼物（亲密）
            GIFT_FEEL: 2,              // 礼物（魂力）
            GIFT_LINGG: 3,             // 礼物（灵感）
            GIFT_SKILLPOINT: 4,        // 礼物（熟练度）
            GIFT_ENERGY: 5,            // 礼物（体力）
            GIFT_EMOTION: 26            // 礼物（心情）
        }
    }

    static useItem(uuid, heroId, heroLevel, itemId, itemCount, multiController, taskController, callback)
    {
        // 获取道具配置数据
        fixedController.Items.getItemNode(itemId, (node) => {
            if (node) {
                // 判断该道具是否是墨魂喜欢的类型
                fixedController.Heros.getPreferItems(heroId, function (loveItems, hateItems) {
                    let addVal = Math.floor (node.upEffectVal * itemCount) ;
                    if (node.type === itemController.TYPES().ITEM_GIFT) { // 礼物道具
                        // 是消耗道具
                        // 判断子类型
                        if (node.subType === itemController.SUBTYPES().GIFT_EXP) {
                            let isLoveItems = loveItems.includes(''+itemId);
                            if (isLoveItems) {
                                addVal = Math.floor (node.likeUpEffectVal * itemCount);
                            }else {
                                if (hateItems.includes (''+itemId)) {
                                    addVal = Math.floor (node.dislikeUpEffectVal * itemCount);
                                }
                            }
                            
                            // 亲密
                            // 判断是否达到上限
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.exp;
                                let hero = new heroController(uuid, heroId,  multiController, taskController)
                                hero.getAttrExp(async exp => {
                                    if (exp < max) {
                                        let skillEffectData = await skillController.calcHeroActiveSkillEffects(hero, skillController.EFFECTSYS().DEFAULT, heroId,null);
                                        if (skillEffectData.effBuffData != null) {
                                            let addGiftInfo = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDGIFTEFFECT];
                                            if (addGiftInfo != null && addGiftInfo.value != null && addGiftInfo.extra != null) {
                                                if (addGiftInfo.value === 0 || addGiftInfo.value === itemId) {
                                                    let addGiftEffect = utils.refactorFloor(addVal * addGiftInfo.extra / 10000);
                                                    addVal += addGiftEffect;
                                                    console.log("----skill active log .. add gift effect", heroId, addGiftEffect)
                                                }
                                            }
                                        }
                                        addVal = (exp+addVal) > max ? (max-exp) : addVal;
                                        hero.addAttrExp(addVal, (attrs) => {
                                            hero.addSendGiftRecord (heroId, itemId, sendStatus => {
                                                // 任务相关（亲密）
                                                if(taskController){
                                                    taskController.addPointObj(CONSTANTS.TASK_TRIGGER_TYPE.HeroTacitAgreement,[{params:[0],num:(exp+addVal) > max ? max : (exp+addVal),add:false}])
                                                    callback({ret:node.subType, addVal:addVal, newAttrs:attrs, newSendGift:sendStatus});
                                                }else {
    
                                                    // taskController.addTaskCounter(null, uuid, 702, [heroId], () => {
                                                    //     callback({ret:node.subType, addVal:addVal, newAttrs:attrs, newSendGift:sendStatus});
                                                    // }, (exp+addVal) > max ? max : (exp+addVal), false);
                                                
                                                }
                                            });
                                        });
                                    } else {
                                        // 亲密已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret: -5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else if (node.subType === itemController.SUBTYPES().GIFT_FEEL) {
                            // 魂力
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.feel;
                                let hero = new heroController(uuid, heroId, multiController, taskController)
                                hero.getAttrFeel(feel => {
                                    if (feel < max) {
                                        addVal = (feel+addVal) > max ? (max-feel) : addVal;
                                        hero.addAttrFeel(addVal, (attrs) => {
                                            callback({ret:node.subType, addVal:addVal, newAttrs:attrs});
                                        }, true);
                                    } else {
                                        // 魂力已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret:-5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else if (node.subType === itemController.SUBTYPES().GIFT_LINGG) {
                            // 灵感
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.lingg;
                                let hero = new heroController(uuid, heroId, multiController, taskController)
                                hero.getAttrLingg(lingg => {
                                    if (lingg < max) {
                                        addVal = (lingg+addVal) > max ? (max-lingg) : addVal;
                                        hero.addAttrLingg(addVal, (attrs) => {
                                            callback({ret:node.subType, addVal:addVal, newAttrs:attrs});
                                        }, true);
                                    } else {
                                        // 灵感已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret: -5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else if (node.subType === itemController.SUBTYPES().GIFT_ENERGY) {
                            // 体力
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.energy;
                                let hero = new heroController(uuid, heroId, multiController, taskController)
                                hero.getAttrEnergy(async energy => {
                                    if (energy < max) {
                                        let skillEffectData = await skillController.calcHeroActiveSkillEffects(hero, skillController.EFFECTSYS().DEFAULT, heroId,null);
                                        if (skillEffectData.effBuffData != null) {
                                            let addSupplyEnergy = skillEffectData.effBuffData[skillController.EFFECTRESULTTYPE().ADDSUPPLYENERGY];
                                            if (addSupplyEnergy != null && addSupplyEnergy.value != null) {
                                                addVal = addVal + addSupplyEnergy.value;
                                                console.log("----skill active log .. add supply energy", heroId, addSupplyEnergy.value)
                                            }
                                        }
                                        addVal = (energy + addVal) > max ? (max-energy) : addVal;
                                        hero.addAttrEnergy(addVal, (attrs) => {
                                            callback({ret:node.subType, addVal:addVal, newAttrs:attrs});
                                        }, true);
                                    } else {
                                        // 灵感已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret: -5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else if (node.subType === itemController.SUBTYPES().GIFT_SKILLPOINT) {
                            // 技能熟练度
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.skillpoint;
                                let hero = new heroController(uuid, heroId, multiController, taskController)
                                hero.getAttrSkillPoint(skillpoint => {
                                    if (skillpoint < max) {
                                        addVal = (skillpoint+addVal) > max ? (max-skillpoint) : addVal;
                                        hero.addAttrSkillPoint(addVal, (attrs) => {
                                            callback({ret:node.subType, addVal:addVal, newAttrs:attrs});
                                        });
                                    } else {
                                        // 灵感已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret: -5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else if (node.subType === itemController.SUBTYPES().GIFT_EMOTION) {
                            // 技能熟练度
                            fixedController.HeroLevelUpTermAndBonus.getHeroAttrLimitsDefaultConfig(heroId, heroLevel, HeroAttrDefault => {
                                var min, max;
                                [min, max] = HeroAttrDefault.emotion;
                                let hero = new heroController(uuid, heroId, multiController, taskController)
                                hero.getAttrEmotion(emotion => {
                                    if (emotion < max) {
                                        addVal = (emotion+addVal) > max ? (max-emotion) : addVal;
                                        hero.addAttrEmotion(addVal, (attrs) => {
                                            callback({ret:node.subType, addVal:addVal, newAttrs:attrs});
                                        });
                                    } else {
                                        // 灵感已达上限
                                        hero.getAttrs(attrs => {
                                            callback({ ret: -5, newAttrs: attrs });
                                        });
                                    }
                                });
                            });
                        } else {
                            // 道具无法使用（不支持的子类型）
                            callback({ret:-3});
                        }
                    } else {
                        // 道具无法使用（不支持的类型）
                        callback({ret:-2});
                    }
                });
            } else {
                // 配置表问题
                callback({ret:-1});
            }
        });
    }

    static getGiftItemBonus(heroPtr, itemId, itemCount, callback)
    {
        // 获取随机的一个通用奖励ID
        var AwardLis = GiftItems.getAwards(itemId, itemCount);
        // 获取通用奖励ID对应的奖励配置
        fixedController.GeneralAwards.getBonusConfig(AwardLis, BonusConfig => {
            //console.error("[getGiftItemBonus]", AwardLis, BonusConfig)
            // 将奖励中的墨魂列表转成新墨魂和碎片墨魂列表
            heroPtr.getConvertNewHeroAndPieceItem(BonusConfig.heros, (newAddHeroLis, pieceHeroGroup) => {
                // 获取墨魂碎片物品
                fixedController.Items.getItemListByHeroIdGroupConfig(pieceHeroGroup, pieceItemLis => {
                    BonusConfig.items = BonusConfig.items.concat(pieceItemLis); // 将物品和墨魂碎片物品合并
                    BonusConfig.heros = newAddHeroLis;
                    callback(BonusConfig);
                });
            });
        });
    }

    /**
     * bonusHeroSkin - 皮肤奖励
     * @param {*} items 奖励物品
     * @param {*} upSkinLis [{hid, skins}, ...] 被更新的墨魂皮肤列表
     * @param {*} playerItemLis 玩家背包
     * @param {*} playerSkinHeroMap 玩家皮肤数据墨魂列表
     * @param {*} skinItemLis 奖励皮肤物品
     */
    static bonusHeroSkin(items, upSkinLis, playerItemLis, playerSkinHeroMap, skinItemLis)
    {
        // 有墨魂：已解锁该皮肤则转碎片,无则解锁该皮肤
        // 无墨魂：已有此皮肤道具则转碎片,无则不变
        function checkSkinItemId(plrItemLis, skinItemId) {
            for (let i in plrItemLis) {
                if (plrItemLis[i].id === skinItemId) {
                    // 存在皮肤道具
                    return true;
                }
            }

            return false;
        }

        function isSkinUnlock(skins, skinId)
        {
            for (let i in skins) {
                if (skins[i].id === skinId) {
                    return true;
                }
            }

            return false;
        }

        if (skinItemLis != null && skinItemLis.length > 0) {
            // 皮肤碎片只会有一个
            var skinItemData = fixedController.Items.getItemSkinConfig(skinItemLis[0].id);
            if (skinItemData) {
                if (checkSkinItemId(playerItemLis, skinItemData.skinItemId)) {
                    // 已有皮肤道具（防止先获得皮肤道具,后获得墨魂情况出现）
                    items.push({ id: skinItemData.skinPieceId, count: skinItemLis[0].count });
                } else {
                    // 获取对应皮肤墨魂
                    var heroSkins = playerSkinHeroMap.get(skinItemData.heroId); // 旧墨魂 + 新墨魂
                    if (heroSkins) {
                        // 有墨魂,判断是否已解锁墨魂
                        if (isSkinUnlock(heroSkins, skinItemData.skinId)) {
                            // 已解锁皮肤,则转成碎片加入奖励道具中
                            items.push({ id: skinItemData.skinPieceId, count: skinItemLis[0].count });
                        } else {
                            // 未解锁皮肤,则解锁皮肤
                            var myskins = { id: skinItemData.skinId, new: 1, st: new Date().getTime() };
                            heroSkins.push(myskins);

                            upSkinLis.push({ hid: skinItemData.heroId, skins: heroSkins });
                        }
                    } else {
                        // 无墨魂,判断是否持有该皮肤碎片
                        if (checkSkinItemId(playerItemLis, skinItemData.skinItemId)) {
                            // 已存在该皮肤道具,则转成碎片加入奖励道具中
                            items.push({ id: skinItemData.skinPieceId, count: skinItemLis[0].count });
                        } else {
                            // 直接加入奖励道具中
                            items.push(skinItemLis[0]);
                        }
                    }
                }
                return [items, upSkinLis];
            } else {
                return [items, upSkinLis];
            }
        } else {
            return [items, upSkinLis];
        }
    }

    static useItemList(itemLis, callback, heroPtr=null, playerPtr=null)
    {
        var bonusData = categoryFromItemList(itemLis), retData = {};
        // currency
        playerPtr.addCurrencyMulti(bonusData.currency, newCurreny => {
            if (bonusData.currency.filter((a) => { return a > 0; }).length > 0) {
                retData.currency = newCurreny;
            }
            // heros
            //console.warn("---------<>>", heroSave, playerSave, JSON.stringify(bonusData));
            heroPtr.getConvertNewHeroAndPieceItem(bonusData.heros, (addHeroGroup, pieceHeroGroup) => {
                // 获取墨魂碎片物品
                fixedController.Items.getItemListByHeroIdGroupConfig(pieceHeroGroup, pieceItemLis => {
                    bonusData.items = bonusData.items.concat(pieceItemLis);
                    heroPtr.addHeroGroup(addHeroGroup, () => {
                        //newAddHeroLis.forEach((_, index, input) => { input[index] = input[index].hid; });
                        if (addHeroGroup.length > 0) retData.heroList = addHeroGroup;
                        // hero-skins
                        playerPtr.getItemList(playerItemLis => {
                            heroPtr.getSkinHeroMap(skinHeroMap => {
                                var upSkinLis = [];
                                [bonusData.items, upSkinLis] = itemController.bonusHeroSkin(bonusData.items, upSkinLis, playerItemLis, skinHeroMap, bonusData.skinitems);
                                heroPtr.setUpSkinHeroGroup(upSkinLis, () => {
                                    if (upSkinLis.length > 0) {
                                        retData.heroSkinList = upSkinLis;
                                    }
                                    // items
                                    playerPtr.addItem(bonusData.items, () => {
                                        playerPtr.addActiveDegreeValue(bonusData.activeDegreeValue, newActDegVal => {
                                            if (bonusData.activeDegreeValue > 0) retData.actDegValue = newActDegVal;

                                            if (bonusData.items.length > 0) {
                                                retData.addItems = bonusData.items;
                                            }
                                            callback(retData);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}

module.exports = itemController;
