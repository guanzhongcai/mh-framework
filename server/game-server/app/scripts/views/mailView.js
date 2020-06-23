const protocol = require('./../../common/protocol');
const ERRCODES = require('./../../common/error.codes');
const Mail = require('./../controllers/mailController').Mail;
const playerController = require('./../controllers/playerController');
const taskController = require('./../controllers/taskController');
const itemController = require('./../controllers/itemController');
const heroController = require('./../controllers/heroController');
const CONSTANTS = require('./../../common/constants');
function MailList(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('number' === typeof request.body.uuid && request.body.uuid > 0) {
        var mail = new Mail(request.body.uuid,request.multiController, request.taskController);
        mail.load(() => {
            respData.ret = mail.getList();
            protocol.responseSend(response, respData);
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

function DeleteMails(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('number' === typeof request.body.uuid && request.body.uuid > 0 &&
            Array.isArray(request.body.mails) && request.body.mails.length > 0) {
        var mail = new Mail(request.body.uuid,request.multiController, request.taskController);
        mail.load(() => {
            if (mail.delMail(request.body.mails)) {
                mail.save(() => {
                    protocol.responseSend(response, respData);
                });
            } else {
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

function UpdateMailReadStatus(request, response)
{
    var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
    if ('number' === typeof request.body.uuid && request.body.uuid > 0 &&
            Array.isArray(request.body.mails) && request.body.mails.length > 0) {
        var mail = new Mail(request.body.uuid,request.multiController, request.taskController);
        mail.load(() => {
            if (mail.setReadStat(request.body.mails)) {
                mail.save(() => {
                    protocol.responseSend(response, respData);
                });
            } else {
                protocol.responseSend(response, respData);
            }
        });
    } else {
        respData.code = ERRCODES().PARAMS_ERROR;
        protocol.responseSend(response, respData);
    }
}

/**
 * AttchMail - 领取邮件（组）附件
 * @param {*} request { mails=[mid1, mid2, ...] }
 * @param {*} response 
 */
function AttchMail(request, response)
{
    if ('number' === typeof request.body.uuid && request.body.uuid > 0 && 
            Array.isArray(request.body.mails) && request.body.mails.length > 0) {
        var respData = protocol.responseData(request.body.httpuuid, request.body.uuid);
        
        var mail = new Mail(request.body.uuid,request.multiController, request.taskController);
        mail.load(() => {
            if (mail.checkOpStatValid(request.body.mails)) {
                var awardItemLis = mail.getEnclosureAwardList(request.body.mails);
                if (awardItemLis != null) {
                    var player = new playerController(request.body.uuid,request.multiController, request.taskController),
                        hero = new heroController(request.body.uuid,0,request.multiController, request.taskController);
                    // taskController.getTaskDataFromSource(request.body.uuid, TaskData => {
                        itemController.useItemList(awardItemLis, retData => {
                            // taskController.saveTaskDataFromSource(request.body.uuid, TaskData, () => {
                                mail.save(async () => {
                                    Object.assign(respData, retData);
    
                                    respData.taskEventData = [];
                                    respData.taskList = [];
                                    try {
                                        let {taskList, taskEventData} = await request.taskController.taskUpdate(request.body.uuid)
                                        respData.taskEventData = taskEventData;
                                        respData.taskList = taskList;
                                    }catch (e) {
                                        respData.code = ERRCODES().FAILED;
                                        return  protocol.responseSend(response, respData);
                                    }
                                    
                                    
                                    protocol.responseSend(response, respData);
                                    await request.logServer.itemLog([request.body.uuid,request.Const.actions.mail,[],awardItemLis,request.Const.functions.mail])
                                });
                            // });
                        }, hero, player);
                    // });
                } else {
                    // 无邮件奖励
                    respData.code = ERRCODES().MAIL_NO_ENCLOSURE;
                    protocol.responseSend(response, respData);
                }
            } else {
                respData.code = ERRCODES().PARAMS_ERROR;
                protocol.responseSend(response, respData);
            }
        });
    }
}

exports.MailList = MailList;
exports.DeleteMails = DeleteMails;
exports.UpdateMailReadStatus = UpdateMailReadStatus;
exports.AttchMail = AttchMail;