const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

class guideController
{
    constructor(uuid, multiController, taskController)
    {
        this.uuid_ = uuid ? parseInt(uuid) : 0;
        this.tblname_ = 'UserGuideData';
        this.multiController = multiController
        this.taskController = taskController
        this.guideData = null
    }

    getFromDBOrCache(cb){
        if(!!this.guideData){
            cb(this.guideData)
        }else{
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, sdoc => {
                var doc = sdoc && validator.isJSON(sdoc)? JSON.parse(sdoc) : null;
                this.guideData = doc
                cb(doc)
            })
        }
    }

    saveUseGuideData (guidedata) {
        this.multiController.push(1, this.tblname_ + ":" + this.uuid_, JSON.stringify(guidedata));
    }
}

module.exports = guideController;