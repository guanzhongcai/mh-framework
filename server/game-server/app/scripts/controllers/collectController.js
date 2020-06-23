const Heros = require ('./fixedController').Heros;
const DormDoor = require ('./fixedController').DormDoor;
const categoryFromItemList = require ('./fixedController').categoryFromItemList;
const models = require('./../models');
const utils = require('./../../common/utils');
const CONSTANTS = require('./../../common/constants');

const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

class collectController
{
    constructor(uuid, multiController, taskController = null)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'CollectData';
        this.tblnamePlacedInfo_ = "ShelfPlacement"
        this.multiController = multiController;
        this.taskController = taskController;
        this.collectData = null  // 加入内存备份;
    }

    errorHandle(){
        this.collectData = null
    }

    getFromDBOrCache(cb){
        if(!!this.collectData){
            cb(this.collectData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sdoc => {
                var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
                this.collectData = doc
                cb(doc)
            })
        }
    }

    // 获取诗集信息
    getGameCollectData (callback) {
        // 增加内存数据块
        this.getFromDBOrCache( doc => {
            if (doc == null) {
                let collectData = {}
                collectData.scenes = [];
                collectData.uuid = this.uuid_;
                this.collectData = collectData
                callback(collectData);
            }else {
                this.collectData = doc
                callback (doc);
            }
        })
    }

    getShelfPlacementData (callback) {
        GameRedisHelper.getHashFieldValue(this.tblnamePlacedInfo_, this.uuid_, sdoc => {
            var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
            callback(doc)
        })
    }

    setShelfPlacementData (placement, callback) {
        this.multiController.uniqPush(1, this.tblnamePlacedInfo_ + ":" + this.uuid_, JSON.stringify(placement))
        callback(true);
    }

    // 添加新的诗集
    addNewPoetry (poetryid, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc == null || doc.poetrys == null || doc.poetrys.length <= 0) {
                doc.poetrys = [];
                let poetryData = models.PoetryData (poetryid);
                doc.poetrys.push (poetryData);
                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.collectData = doc
                callback(poetryData);
            }else{
                let poetrys = doc.poetrys;
                let poetryData = null;
                for (let i in poetrys) {
                    if (poetrys[i].id == poetryid) {
                        poetryData = poetrys[i];
                        break;
                    }
                }
                if (poetryData == null) {
                    poetryData = models.PoetryData (poetryid);
                    poetrys.push (poetryData);
                    this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_, JSON.stringify(doc))
                    this.collectData = doc
                    callback(poetryData);
                }else {
                    this.collectData = doc
                    callback (poetryData);
                }
            }
        });
    }

    // 添加新的剧情
    addNewScene (sceneid, unlockInfo, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc) { doc = {} }

            if (doc.scenes == null || doc.scenes.length <= 0) {
                doc.scenes = [];
            }

            let scenes = doc.scenes;
            let sceneData = null;
            for (let scene of scenes) {
                if (scene.id === sceneid) {
                    sceneData = scene;
                    break;
                }
            }

            if (sceneData == null) {
                sceneData = models.SceneData (sceneid)
                scenes.push (sceneData);

                let retUnlockData = {};
                retUnlockData.scenes = [];
                retUnlockData.scenes.push (sceneData);

                if (unlockInfo.npcs) {
                    if (doc.npcs == null) doc.npcs = [];
                    retUnlockData.npcs = [];
                    for (let nid in unlockInfo.npcs) {
                        let npc = models.NpcData (unlockInfo.npcs[nid]);
                        doc.npcs.push (npc)
                        retUnlockData.npcs.push (npc);
                    }
                    
                }

                if (unlockInfo.backgrounds) {
                    if (doc.backgrounds == null) doc.backgrounds = [];
                    retUnlockData.backgrounds = [];
                    for (let bid in unlockInfo.backgrounds) {
                        let background = models.BackgroundData (unlockInfo.backgrounds[bid]);
                        doc.backgrounds.push (background)
                        retUnlockData.backgrounds.push (background);
                    }
                }

                if (unlockInfo.words) {
                    if (doc.words == null) doc.words = [];
                    retUnlockData.words = [];
                    for (let wid in unlockInfo.words) {
                        let word = models.WordData (unlockInfo.words[wid]);
                        doc.words.push (word);
                        retUnlockData.words.push (word);
                    }
                }

                if (unlockInfo.poetry) {
                    if (doc.poetrys == null) doc.poetrys = [];
                    retUnlockData.poetrys = [];
                    let poetry = models.PoetryData (unlockInfo.poetry);
                    doc.poetrys.push (poetry)
                    retUnlockData.poetrys.push (poetry)
                }

                if (unlockInfo.gitfs) {
                    if (doc.gitfs == null) doc.gitfs = [];
                    retUnlockData.gitfs = [];
                    let gift = models.GiftData (unlockInfo.gitfs);
                    doc.gitfs.push (gift)
                    retUnlockData.gitfs.push (gift);
                }

                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.collectData  = doc
                callback(true, retUnlockData);
            }else {
                callback (false, null);
            }
        });
    }

    // 添加新的语音
    addNewHeroSound (soundid, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc) { doc = {}}
            if (doc.sounds == null || doc.sounds.length <= 0) {
                doc.sounds = [];
                let soundData = models.SoundData (soundid)
                doc.sounds.push (soundData);
                this.multiController.push(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.collectData = doc
                callback(soundData);
            }else{
                let sounds = doc.sounds;
                let soundData = null;
                for (let i in sounds) {
                    if (sounds[i].id == soundid) {
                        soundData = sounds[i];
                        break;
                    }
                }
                if (soundData == null) {
                    soundData = models.SoundData (soundid)
                    sounds.push (soundData);
                    this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                    this.collectData = doc
                    callback(soundData);
                }else {
                    this.collectData = doc
                    callback (soundData);
                }
            }
        });
    }

    // 添加墨魂获得CG
    addNewCG (cgid, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.cgs == null || doc.cgs.length <= 0) {
                doc.cgs = [];
                let cgData = models.CGData (cgid)
                doc.cgs.push (cgData);
                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.collectData = doc
                callback(cgData);
            }else{
                let cgs = doc.cgs;
                let cgData = null;
                for (let i in cgs) {
                    if (cgs[i].id == cgid) {
                        cgData = cgs[i];
                        break;
                    }
                }
                if (cgData == null) {
                    cgData = models.CGData (cgid)
                    cgs.push (cgData);

                    this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                    this.collectData = doc
                    callback(cgData);
                }else {
                    this.collectData = doc
                    callback (cgData);
                }
            }
        });
    }

    // 解锁新的配方
    addNewFormula (formulaId, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.formulas == null || doc.formulas.length <= 0) {
                doc.formulas = [];
                let formulaData = models.FormulaData (formulaId)
                doc.formulas.push (formulaData);
                this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                this.collectData = doc
                callback(formulaData);
            }else{
                let formulas = doc.formulas;
                let formulaData = null;
                for (let i in formulas) {
                    if (formulas[i].id == formulaId) {
                        formulaData = formulas[i];
                        break;
                    }
                }
                if (formulaData == null) {
                    formulaData = models.FormulaData (formulaId)
                    formulas.push (formulaData);
                    this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
                    this.collectData = doc
                    callback({newAdd:true, formulaData:formulaData});
                }else {
                    callback ({newAdd:false});
                }
            }
        });
    }


    // 更新诗集查看状态
    updatePoetrysNewStatus (poetryids, status, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.poetrys == null) doc.poetrys = [];
            let updateIds = [];
            let poetrys = doc.poetrys;
            for (let i in poetryids) {
                let id = poetryids[i];
                for (let j in poetrys) {
                    if (poetrys[j].id == id) {
                        poetrys[j].new = status;
                        updateIds.push (id);
                        break
                    }
                }
            }
            this.multiController.uniqPush(1,this.tblname_ + ":" + this.uuid_,  JSON.stringify(doc))
            this.collectData = doc
                callback(updateIds);
        });
    }

    // 更新诗集创作状态
    updatePoetrysCreatedStatus (poetryids, status, callback){
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.poetrys == null) doc.poetrys = [];
            let poetrys = doc.poetrys;
            let updateIds = [];
            for (let i in poetryids) {
                let id = poetryids[i];
                for (let j in poetrys) {
                    if (poetrys[j].id == id) {
                        poetrys[j].created = status;
                        updateIds.push (id);
                        break
                    }
                }
            }
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_,  JSON.stringify(doc))
            this.collectData = doc
            callback(updateIds);
        });
    }

    // 更新剧情查看状态
    updateScenesNewStatus (sceneids, status, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.scenes == null) doc.scenes = [];
            let scenes = doc.scenes;
            let updateIds = [];
            for (let i in sceneids) {
                let id = sceneids[i];
                for (let j in scenes) {
                    if (scenes[j].id == id) {
                        scenes[j].new = status;
                        updateIds.push (id);
                        break
                    }
                }
            }
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_ ,  JSON.stringify(doc))
            this.collectData = doc
            callback(updateIds);
        });
    }

    // 更新语音状态
    updateHeroesSoundStatus (soundids, status, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.sounds == null) doc.sounds = [];
            let sounds = doc.sounds;
            let updateIds = [];
            for (let i in soundids) {
                let id = soundids[i];
                for (let j in sounds) {
                    if (sounds[j].id == id) {
                        sounds[j].new = status;
                        updateIds.push (id);
                        break
                    }
                }
            }
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_  , JSON.stringify(doc))
            this.collectData = doc
            callback(updateIds);
        });
    }

    // 更新CG状态
    updateCGsStatus (cgids, status, callback) {
        this.getFromDBOrCache( doc => {
            if(!doc){doc = {}}
            if (doc.cgs == null) doc.cgs = [];
            let cgs = doc.cgs;
            let updateIds = [];
            for (let i in cgids) {
                let id = cgids[i];
                for (let j in cgs) {
                    if (cgs[j].id == id) {
                        cgs[j].new = status;
                        updateIds.push (id);
                        break
                    }
                }
            }
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_ , JSON.stringify(doc))
            this.collectData = doc
            callback(updateIds);
        });
    }
}

module.exports = collectController;
