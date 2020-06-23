const TBL_MAILS = "Mails";
const models = require('./../models');
const validator = require('validator');
const GameRedisHelper = require('./../../../index.app').GameRedisHelper;
const CONSTANTS = require('./../../common/constants');
class Mail
{
    constructor(uuid, multiController, taskController = null)
    {
        this.uuid_ = uuid;
        this.tblname_ = "Mails";
        this.data_ = null;
        this.multiController = multiController;
        this.taskController = taskController;
    }

    load(callback)
    {
        if (Array.isArray(this.data_)) {
            callback(this.data_);
        } else {
            GameRedisHelper.getHashFieldValue(this.tblname_, this.uuid_, res => {
                this.data_ = res && validator.isJSON(res) ? JSON.parse(res) : [];
                callback(this.data_);
            });
        }
    }

    save(callback)
    {
        if (Array.isArray(this.data_)) {
            this.multiController.push(1,this.tblname_ + ":" + this.uuid_,JSON.stringify(this.data_))
            callback(true);
        } else {
            callback(false);
        }
    }

    getList()
    {
        return this.data_;
    }

    /**
     * checkOpStatValid - 根据邮件ID组判断领取状态
     * @param {Array} mailGroup [mid1, mid2, ...]
     */
    checkOpStatValid(mailGroup)
    {
        var valid = true;
        for (let mid of mailGroup) {
            for (let i in this.data_) {
                if (mid === this.data_[i].mid) {
                    if (this.data_[i].opstatus === 1) {
                        valid = false;
                        break;
                    }
                }
            }

            if (!valid) {
                break;
            }
        }

        return valid;
    }

    /**
     * setReadStat - 根据邮件ID组设置已读状态
     * @param {Array} mailGroup [mid1, mid2, ...]
     */
    setReadStat(mailGroup)
    {
        var setFlag = false;
        for (let mid of mailGroup) {
            for (let i in this.data_) {
                if (this.data_[i].mid === mid && this.data_[i].readstatus === 0) {
                    setFlag = true;
                    this.data_[i].readstatus = 1;
                    break;
                }
            }
        }
        return setFlag;
    }

    /**
     * delMail - 根据邮件ID组删除
     * @param {Array} mailGroup [mid1, mid2, ...]
     */
    delMail(mailGroup)
    {
        var setFlag = false;
        for (let mid of mailGroup) {
            for (let i in this.data_) {
                if (this.data_[i].mid === mid) {
                    setFlag = true;
                    this.data_[i].isDelete = 1
                    // this.data_.splice(i, 1);
                    break;
                }
            }
        }

        return setFlag;
    }

    /**
     * getEnclosureAwardList - 根据邮件ID组获取附件奖励列表
     * @param {Array} mailGroup [mid1, mid2, ...]
     */
    getEnclosureAwardList(mailGroup)
    {
        var awardItemLis = [];
        for (let mid of mailGroup) {
            for (let i in this.data_) {
                if (this.data_[i].mid === mid && this.data_[i].opstatus === 0) {
                    awardItemLis = awardItemLis.concat(this.data_[i].items);
                    this.data_[i].opstatus = this.data_[i].readstatus = 1;
                    break;
                }
            }
        }

        return (awardItemLis.length > 0 ? awardItemLis : null);
    }
}

function sendMultiMail(uuid, mails, callback)
{
    GameRedisHelper.getHashFieldValue(TBL_MAILS, uuid, sMailLis => {
        var mailLis = sMailLis  && validator.isJSON(sMailLis) ? JSON.parse(sMailLis) : [];
        for (let mail of mails) {
            if (mail.mid == 0) mail.mid = mailLis.length + 1; // WARNNING: MAIL ID
            mailLis.push(mail);
        }
        GameRedisHelper.setHashFieldValue(TBL_MAILS, uuid, JSON.stringify(mailLis), () => {
            callback();
        });
    });
}

function getLongGiftMailModel(giftId, day, bonus, dt=new Date())
{
    var mailModel = models.MailModel();
    mailModel.mtitle     = "持续礼包(" + giftId + ")奖励";
    mailModel.content    = "这是持续礼包的奖励物品，第" + day + "天";
    mailModel.items      = bonus;
    mailModel.time = mailModel.validitytime = dt.getTime();
    return mailModel;
}

module.exports = {
    Mail,
    sendMultiMail,
    getLongGiftMailModel
}
