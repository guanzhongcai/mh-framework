const playerView = require('./scripts/views/playerView');
const shopView = require('./scripts/views/shopView');
const gameView = require('./scripts/views/gameView');
const MarketView = require('./scripts/views/MarketView');
const mapView = require('./scripts/views/mapView');
const heroView = require('./scripts/views/heroView');
const gachaView = require('./scripts/views/gachaView');
const inspView = require('./scripts/views/inspView');
const soulView = require('./scripts/views/soulView');
const hotSpringView = require('./scripts/views/hotSpringView');
const orderView = require ('./scripts/views/orderView')
const workView = require('./scripts/views/workView');
const dormView = require('./scripts/views/dormView');
const pursueView = require('./scripts/views/pursueTreeView');
const collectView = require('./scripts/views/collectView');
const externalView = require('./scripts/views/externalView');
const taskView = require('./scripts/views/taskView');
const skillView = require('./scripts/views/skillView');
const mailView = require('./scripts/views/mailView');
const itemView = require('./scripts/views/itemView');
const testView = require('./scripts/views/testView');
const debugView = require ('./scripts/views/debugView')
const checkinView = require('./scripts/views/checkinView');
const newTaskView = require('./scripts/views/newTaskView');
const rechargeView = require('./scripts/views/rechargeView');
const achievementView = require('./scripts/views/achievementView');
const activityView = require('./scripts/views/activityView');

function mapping(app)
{
    app.post('/fetchservertime', (req, res) => { gameView.fetchServerTime(req, res) });

    app.post('/newtype_noticelist', (req, res) => { gameView.NoticeList(req, res); })
    app.post('/newtype_noticerewardattch', (req, res) => { gameView.NoticeRewardAttch(req, res); })

    app.post('/newtype_playerheartbeat', (req, res) => { gameView.PlayerHeartBeat(req, res); })
    app.post('/newtype_playermapandstock', (req, res) => { gameView.PlayerMapAndStock(req, res); })
    app.post('/newtype_gamedata', (req, res) => { gameView.GameData(req, res); })
    app.post('/newtype_checkviewrespects', (req, res) => { gameView.CheckViewRespects(req, res); })
    app.post('/newtype_viewrespectscheckin', (req, res) => { gameView.ViewRespectsCheckIn(req, res); })

    app.post('/updatesetting', (req, res) => { playerView.PlayerSettingData(req, res); })
    app.post('/newtype_settingnickname', (req, res) => { playerView.PlayerSettingNickname(req, res); })
    app.post('/newtype_settingbirth', (req, res) => { playerView.PlayerSettingBirth(req, res); })
    app.post('/newtype_settinghead', (req, res) => { playerView.PlayerSettingHead(req, res); })
    app.post('/newtype_settingviewmohun', (req, res) => { playerView.PlayerSettingViewMohun(req, res); })
    app.post('/newtype_updateguideinfo', (req, res) => { playerView.UpdateGuideInfo(req, res); })
    app.post('/newtype_notifsetting', (req, res) => { playerView.PlayerNotifSetting(req, res); })
    // 触发礼包数据更新
    app.post('/newtype_triggergiftupdate', (req, res) => { playerView.SetPlayerTriggerGift(req, res); })

    app.post('/shoplist', (req, res) => { shopView.ShopList(req, res); })
    app.post('/shopshopping', (req, res) => { shopView.ShopShopping(req, res); })
    app.post('/shoprefreshmenu', (req, res) => { shopView.ShopRefreshMenu(req, res); })

    //app.post('/addshoppingcolumn', (req, res) => { shopView.ShopAddGrid(req, res); })
    //app.post('/createnewmail', (req, res) => { mailView.CreateNewMails(req, res); })
    //app.post('/uploadusermailsdata', (req, res) => { mailView.UpdateMails(req, res); })
    //app.post('/updataallmailsreadstatus', (req, res) => { mailView.UpdateAllMailsReadStatus(req, res); })
    //app.post('/updateallmailsopstatus', (req, res) => { mailView.UpdateAllMailsOpStatus(req, res); })
    //app.post('/updatemailopstatus', (req, res) => { mailView.UpdateMailOpStatus(req, res); })
    //app.post('/sendusermail', (req, res) => { mailView.SendMail(req, res); })

    app.post('/updatemailreadstatus', (req, res) => { mailView.UpdateMailReadStatus(req, res); })
    app.post('/queryusermails', (req, res) => { mailView.MailList(req, res); })
    app.post('/deleteusermails', (req, res) => { mailView.DeleteMails(req, res); })
    app.post('/attchmail', (req, res) => { mailView.AttchMail(req, res); })

    app.post('/newtype_buyitems', (req, res) => { MarketView.BuyItems(req, res); })
    app.post('/newtype_sellitems', (req, res) => { MarketView.SellItems(req, res); })

    app.post('/newtype_usegiftitem', (req, res) => { itemView.UseGiftItem(req, res); })
    app.post('/newtype_catchfish', (req, res) => { itemView.CatchFish(req, res); })
    app.post('/newtype_depottolevelup', (req, res) => { itemView.DepotToLevelUp(req, res); })

    app.post('/newtype_buildingbuy', (req, res) => { mapView.BuildingBuy(req, res); })
    app.post('/newtype_buildingsell', (req, res) => { mapView.BuildingSell(req, res); })
    app.post('/newtype_buildingbatchbuy', (req, res) => { mapView.BuildingBatchBuy(req, res); })
    app.post('/newtype_builingandstockupload', (req, res) => { mapView.MapBuildingAndStocksUpload(req, res); })
    app.post('/newtype_buildingcartaddbuilding', (req, res) => { mapView.BuildingCartAddBuilding(req, res); })
    app.post('/newtype_buildingcartremovebuilding', (req, res) => { mapView.BuildingCartRemoveBuilding(req, res); })
    app.post('/newtype_builingcartupdatebuildingcount', (req, res) => { mapView.BuildingCartUpdateBuildingCount(req, res); })

    app.post('/newtype_heroeating', (req, res) => { heroView.HeroEating(req, res); })
    app.post('/newtype_herosendgift', (req, res) => { heroView.HeroSendGift(req, res); })
    app.post('/newtype_herogetsendgiftrecord', (req, res) => {heroView.GetHeroSendGiftRecord (req, res); })

    app.post('/newtype_heroguidesendhero', (req, res) => { heroView.GuideSendHero(req, res); })
    app.post('/newtype_herosettingskin', (req, res) => { heroView.HeroSettingSkin(req, res); })
    app.post('/newtype_herolevelup', (req, res) => { heroView.HeroToLevelUp(req, res); })
    app.post('/newtype_herofourinone', (req, res) => { heroView.HeroFourInOne(req, res); })
    app.post('/newtype_herogoofoff', (req, res) => { heroView.HeroGoofOff(req, res); })
    app.post('/newtype_herosettingattrs', (req, res) => { heroView.HeroSettingAttrs(req, res); })
    app.post('/newtype_heroaddattrs', (req, res) => { heroView.addMohunAttrs(req, res); })
    app.post('/newtype_herounlockskin', (req, res) => { heroView.HeroUnlockSkin(req, res); })
    app.post('/newtype_herounlockpursuetreelevel', (req, res) => { heroView.UnlockPursueTreeLevel(req, res); })

    app.post('/newtype_herogachastart', (req, res) => {gachaView.HeroGachaStart(req, res); })
    app.post('/newtype_herogachaclickgride', (req, res) => { gachaView.HeroGachaClickGrid(req, res); })
    app.post('/newtype_herogachabuycount', (req, res) => { gachaView.HeroGachaBuyCount(req, res); })
    app.post('/newtype_herogachaallover', (req, res) => { gachaView.HeroGachaAllOver(req, res); })

    // 已废弃 改成自动解锁
    app.post('/newtype_InspirationThemeVideoEnd', (req, res) => { inspView.InspirationThemeVideoEnd(req, res); })
    app.post('/newtype_getInspirationInfo', (req, res) => { inspView.getInspirationInfo(req, res); })
    app.post('/newtype_InspirationShop', (req, res) => { inspView.InspirationShop(req, res); })
    app.post('/newtype_InspirationShopBuy', (req, res) => { inspView.InspirationShopBuy(req, res); })

    // 奖励领取
    app.post('/newtype_InspirationRecomentAwardReceive', (req, res) => { inspView.InspirationRecomentAwardReceive(req, res); })
    app.post('/newtype_inspirationstart', (req, res) => { inspView.InspirationStart(req, res); })
    app.post('/newtype_inspirationplaydice', (req, res) => { inspView.InspirationPlayDice(req, res); })
    //app.post('/newtype_inspirationunlocktheme', (req, res) => { inspView.InspirationUnlockTheme(req, res); })
    app.post('/newtype_inspirationuseitem', (req, res) => { inspView.InspirationUseItem(req, res); })
    app.post('/newtype_inspirationbuycount', (req, res) => { inspView.InspirationBuyCount(req, res); })
    app.post('/newtype_inspirationbuyactionpoint', (req, res) => { inspView.InspirationBuyActionPoint(req, res); })
    app.post('/newtype_inspirationeventselect', (req, res) => { inspView.InspirationEventSelect(req, res); })
    app.post('/newtype_inspirationinfo', (req, res) => { inspView.InspirationInfo(req, res); })
    app.post('/newtype_inspirationbuffinfo', (req, res) => { inspView.InspirationBuffInfo(req, res); })
    app.post('/newtype_inspirationresult', (req, res) => { inspView.InspirationResult(req, res); })

    app.post('/newtype_soulgamestart', (req, res) => { soulView.SoulGameStart(req, res); })
    app.post('/newtype_soulgameplaycard', (req, res) => { soulView.SoulGamePlayCard(req, res); })
    app.post('/newtype_soulgamemanualexit', (req, res) => { soulView.SoulGameManualExit(req, res); })
    app.post('/newtype_soulgamebuycount', (req, res) => { soulView.SoulGameBuyCount(req, res); })
    app.post('/newtype_soulgamecountinfo', (req, res) => { soulView.SoulGameCountInfo(req, res); })
    app.post('/newtype_gethotspringinfo', (req, res) => { hotSpringView.GetHotspringInfo(req, res); })
    app.post('/newtype_hotspringstart', (req, res) => { hotSpringView.HotspringStart(req, res); })
    app.post('/newtype_getoutofhotspring', (req, res) => { hotSpringView.GetOutOfHotspring(req, res); })
    app.post('/newtype_hotspringbuyout', (req, res) => { hotSpringView.HotspringBuyOut(req, res); })
    app.post('/newtype_hotspringhandlefeelevent', (req, res) => { hotSpringView.HotspringHandleFeelEvent(req, res); })
    app.post('/newtype_gethotspringfeelevent', (req, res) => { hotSpringView.GetHotspringFeelEvent(req, res); })

    // 短订单
    app.post('/newtype_getorderinfo', (req, res) => { orderView.GetOrderInfo(req, res); })
    app.post('/newtype_getshortorderinfo', (req, res) => { orderView.GetShortOrderInfo(req, res); })
    app.post('/newtype_ordersupplytimes', (req, res) => { orderView.SupplyOrderTimes(req, res); })
    app.post('/newtype_orderrefreshshortorder', (req, res) => { orderView.RefreshShortOrder(req, res); })
    app.post('/newtype_ordersendshortorder', (req, res) => { orderView.SendShortOrder(req, res); })
    app.post('/newtype_ordersethero', (req, res) => { orderView.SetShortOrderHero(req, res); })

    // 长订单
    app.post('/newtype_ordergetlongorderinfo', (req, res) => { orderView.GetLongOrderInfo(req, res); })
    app.post('/newtype_orderunlocklongordergrid', (req, res) => { orderView.UnlockLongOrderGrid(req, res); })
    app.post('/newtype_orderlongorderloadgoods', (req, res) => { orderView.LongOrderLoadGoods(req, res); })
    app.post('/newtype_ordergetlongorderreward', (req, res) => { orderView.GetLongOrderReward(req, res); })
    app.post('/newtype_ordersendlongorder', (req, res) => { orderView.LongOrderSendLongOrder(req, res); })
    app.post('/newtype_orderlongorderspeedup', (req, res) => { orderView.LongOrderSpeedUp(req, res); })
    app.post('/newtype_orderlongsupplyordertime', (req, res) => { orderView.SupplyLongOrderTimes(req, res); })

    //工坊
    app.post('/newtype_workbuildingrenovation', (req, res) => { workView.WorkBuildingRenovation(req, res); })
    app.post('/newtype_workbuildingcomplete', (req, res) => { workView.WorkBuildingComplete(req, res); })
    app.post('/newtype_workbuildingupgrade', (req, res) => { workView.WorkBuildingUpgrade(req, res); })
    app.post('/newtype_workbuildinginfo', (req, res) => { workView.WorkBuildingInfo(req, res); })
    app.post('/newtype_workunlockherolist', (req, res) => { workView.WorkUnlockHeroList(req, res); })
    app.post('/newtype_workgetitem', (req, res) => { workView.WorkGetItem(req, res); })
    app.post('/newtype_workstartproduceformula', (req, res) => { workView.WorkStartProduceFormula(req, res); })
    app.post('/newtype_workrevokeproduceformula', (req, res) => { workView.WorkRevokeProduceFormula(req, res); })
    app.post('/newtype_workaddhero', (req, res) => { workView.WorkAddHero(req, res); })
    app.post('/newtype_workexitproducelayer', (req, res) => { workView.WorkExitProduceLayer(req, res); })
    app.post('/newtype_workfast', (req, res) => { workView.WorkFastCastSkill(req, res); }) //使用技能加速
    app.post('/newtype_workfastworkingformula', (req, res) => { workView.WorkSpeedUp(req, res); }) //独玉加速 或者使用道具加速

    app.post('/newtype_pursuetreelist', (req, res) => { pursueView.PursueTreeList(req, res); })
    app.post('/newtype_pursuetreeunlock', (req, res) => { pursueView.PursueTreeUnlock(req, res); })
    app.post('/newtype_dormdoorgetdorminfo', (req, res) => { dormView.DormGetDoorData(req, res); })
    app.post('/newtype_dormdoorrepaire', (req, res) => { dormView.DormDoorRepaire(req, res); })
    app.post('/newtype_dormdoormodityname', (req, res) => { dormView.DormDoorModifyName(req, res); })
    app.post('/newtype_dormdoorlevelup', (req, res) => { dormView.DormDoorLevelUp(req, res); })
    app.post('/newtype_dormdoorassingedhero', (req, res) => { dormView.DormDoorAssingedHero(req, res); })
    app.post('/newtype_dormdoorkickout', (req, res) => { dormView.DormDoorKickout(req, res); })
    app.post('/newtype_dormherorest', (req, res) => { dormView.DormHeroRest(req, res); })
    app.post('/newtype_dormherowakeup', (req, res) => { dormView.DormHeroWakeUp(req, res); })
    app.post('/newtype_getgamecollectdata', (req, res) => { collectView.GetGameCollectData(req, res); })
    app.post('/newtype_addnewpoetry', (req, res) => { collectView.AddNewPoetry(req, res); })
    app.post('/newtype_addnewscene', (req, res) => { collectView.AddNewScene(req, res); })
    app.post('/newtype_addnewsound', (req, res) => { collectView.AddNewHeroSound(req, res); })
    app.post('/newtype_addnewcg', (req, res) => { collectView.AddNewCG(req, res); })
    app.post('/newtype_uploadusershelfplacement', (req, res) => { collectView.UploadUserShelfPlacement (req, res); })

    app.post('/newtype_updatepoetrysnewstatus', (req, res) => { collectView.UpdatePoetrysNewStatus(req, res); })
    app.post('/newtype_updatepoetryscreatestatus', (req, res) => { collectView.UpdatePoetrysCreatedStatus(req, res); })
    app.post('/newtype_udpatescenesnewstatus', (req, res) => { collectView.UpdateScenesNewStatus(req, res); })
    app.post('/newtype_udpatesoundnewstatus', (req, res) => { collectView.UpdateHeroesSoundStatus(req, res); })
    app.post('/newtype_udpatecgsnewstatus', (req, res) => { collectView.UpdateCGsStatus(req, res); })

    app.post('/newtype_getexternaldata', (req, res) => { externalView.GetExternalData(req, res); })
    app.post('/newtype_collectquizitem', (req, res) => { externalView.CollectQuizItem(req, res); })
    app.post('/newtype_startquiz', (req, res) => { externalView.StartQuiz(req, res); })
    app.post('/newtype_getquizresult', (req, res) => { externalView.GetQuizResult(req, res); })
    app.post('/newtype_usequizhelp', (req, res) => { externalView.UseQuizHelp(req, res); })
    app.post('/newtype_reduceitem', (req, res) => { externalView.ReduceItem(req, res); })
    app.post('/newtype_unlockinfo', (req, res) => { externalView.UnlockFunction(req, res); })
    app.post('/newtype_tasksvalid', (req, res) => { taskView.TasksValid(req, res); })
    app.post('/newtype_getawards', (req, res) => { newTaskView.TaskGetAwards(req, res); })
    app.post('/newtype_taskchapteropen', (req, res) => { newTaskView.TaskChapterOpen(req, res); })
    app.post('/newtype_activedegreetakeaward', (req, res) => { taskView.ActiveDegreeTakeAward(req, res); })
    app.post('/newtype_skilltolevelup', (req, res) => { skillView.SkillToLevelUp(req, res); })

    app.post('/testadditemall', (req, res) => { testView.testAddItemAll(req, res); })

    //debug views
    app.post('/newtype_debugcleardepot', (req, res) => { debugView.debugClearDepot(req, res); })
    app.post('/newtype_debugresetrefreshtimes', (req, res) => { debugView.debugResetRefreshTimes(req, res); })
    app.post('/newtype_debugupdateitemcount', (req, res) => { debugView.debugUpdateItemCount(req, res); })
    app.post('/newtype_debugadditemcount', (req, res) => { debugView.debugAddItemCount(req, res); })
    app.post('/newtype_debugupdateusercurrency', (req, res) => { debugView.debugUpdateUserCurrency(req, res); })
    app.post('/newtype_debugaddexp', (req, res) => { debugView.debugAddExp(req, res); })
    app.post('/newtype_debugaddmohun', (req, res) => { debugView.debugAddMohun(req, res); })
    app.post('/newtype_debugaddmohunattrs', (req, res) => { debugView.debugAddMohunAttrs(req, res); })
    app.post('/newtype_debugopenpursuetree', (req, res) => { debugView.debugOpenPursueTree(req, res); })

    // 签到
    app.post('/newtype_checkinlist', (req, res) => { checkinView.CheckInList(req, res); })
    app.post('/newtype_checkintakeaward', (req, res) => { checkinView.CheckInTakeAward(req, res); })
    // app.post('/test', (req, res) => { testView.test(req, res); })
    app.post('/taskList', (req, res) => { taskView.TaskList(req, res); })
    app.post('/openMainTask', (req, res) => { newTaskView.TaskChapterOpen(req, res); })
    app.post('/newtype_taskList', (req, res) => { newTaskView.TaskList(req, res); })
    app.post('/newtype_getTaskAwards', (req, res) => { newTaskView.TaskGetAwards(req, res); })

    // 充值返现
    app.post('/newtype_fetchorderstatus', (req, res) => { rechargeView.FetchOrderStatus(req, res); })
    app.post('/newtype_handleallsuccesspayorder', (req, res) => { rechargeView.HandleAllPaySuccessOrder(req, res); })


    // 活动领取奖励
    app.post('/newtype_getactivityreward', (req, res) => { activityView.GetActivityReward(req, res); })
    app.post('/newtype_buytriggergift', (req, res) => { activityView.BuyTriggerGift(req, res); })


    //成就
    app.post('/newtype_achievementdata', (req, res) => { achievementView.achievementData(req, res); })
    app.post('/newtype_achievementreward', (req, res) => { achievementView.achievementReward(req, res); })
    //test
    app.post('/test', (req, res) => { testView.test(req, res); })
}

module.exports = mapping;
