/**
 * 签名检查 by gzc 19.8.12
 */

const crypto = require("crypto");
const SALT = "md5_salt";

const ExcludeKeys = [
    "__sign",
    "callback", //jsonp
    "_",
];

let exp = module.exports;
/**
 * 获取签名
 * @param msg object
 */
exp.getSign = function(msg) {

    let arrKey = [];
    for (let key in msg) {
        if (ExcludeKeys.includes(key)) { //去除签名值参数 & jsonp附加参数
            continue;
        }
        arrKey.push(key);
    }

    arrKey = arrKey.sort();
    //console.log(arrKey);

    let str = "";
    for (let key of arrKey) {
        let val = msg[key];
        if (typeof (val) === "object"){
            val = JSON.stringify(val);
        }
        str += val + "#";
    }
    str += SALT;


    let md5 = crypto.createHash('md5');
    md5.update(str);
    const sign = md5.digest('hex');
    // console.debug(`str:: ${str}`);

    return sign;
};

/**
 * 增加时间戳和md5签名值
 * @param msg object
 * @returns {*}
 */
exp.addSign = function(msg) {

    msg.__timestamp = Date.now();
    msg.__sign = exp.getSign(msg);

    return msg;
};
