const utils = require('./../../common/utils');

const itemController = require('./../controllers/itemController');
const fixedController = require('./fixedController');
const categoryFromItemList = fixedController.categoryFromItemList;


class commonController
{
	constructor(uuid, multiController, taskController)
	{
		this.uuid_ = uuid ? parseInt(uuid) : 0;
		this.multiController = multiController;
		this.taskController = taskController;
	}
	
	async sendReward(clsPlayer, clsHero, rewardList) {
		return new Promise(async resolve => {
			let rewardData = [];
			if(Array.isArray(rewardList)){
				rewardData = rewardList;
			}else {
				rewardData.push(rewardList)
			}
			
			let retData = {};
			
			
			console.log("============ reward list", rewardData)
			console.log("============ reward list", rewardData)
			let bonusData = categoryFromItemList(rewardData);
				console.warn("---------<>>", JSON.stringify(bonusData));
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
								//newAddHeroLis.forEach((_, index, input) => { input[index] = input[index].hid; });
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
	
	
	rewardFormat(){
		
		BonusData = categoryFromItemListEx(BonusData, utils.getItemArraySplitTwice(node.awardBonus, '|', ','));
	}
	

	
	async playUpdate(){
	
	}
	
	
}

module.exports = commonController;
