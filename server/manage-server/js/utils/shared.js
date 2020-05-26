// http://localhost:6083/gm/dev/serviceMonitor.html

//服务器类型
const SERVER_TYPE = {
    game: 'game',   //游戏牌局服
    config: 'config',//配置服
    gateway: 'gateway', //网关服务器
    monitor: 'monitor', //监控服务器
};

/**
 *
 * @param url string http://host:port/path
 * @param method GET/POST
 * @param body object
 * @returns {{url: *, method: *, body: *}}
 */
function newRelayRequest({url, body}) {
    return {
        url,
        body,
    }
}
/**
 *
 * @param request object 发送给目标服务的请求数据
 * @param cb
 * @private
 */
function relayRequest(request, cb) {

    _ajax({
        url: '/relayRequest',
        type: "GET",
        dataType: "JSONP",
        data: request,
    }, cb);
}

/**
 *
 * @param url string
 * @param type string GET/POST
 * @param dataType string
 * @param data object
 * @param cb
 * @private
 */
function _ajax({url, type, dataType, data}, cb) {

    $.ajax({
        url: url,
        type: type,
        dataType: dataType,
        data: data,
        success: function (result) {//设置请求成功后的回调函数
            if (cb && typeof (cb) === "function") {
                cb(null, result);
            } else {
                if (typeof result === 'object') {
                    result = JSON.stringify(result);
                }
                alert(result); //string
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {//设置请求失败后的回调函数
            alert('服务器超时，请重试')
        },
        async: true,//设置是否异步，默认值是true，表示异步
    })
}


/**
 *
 * @param timestamp 时间戳
 * @returns {string}
 */
function timeAgo(timestamp) {

    let str = '';

    let olTime = parseInt((Date.now() - timestamp) / 1000);
    let val = parseInt(olTime / 3600);
    if (val > 0) {
        str += val + '时';
        olTime -= val * 3600;
    }
    val = parseInt(olTime / 60);
    if (val > 0) {
        str += val + '分';
        olTime -= val * 60;
    }
    str += olTime + '秒';

    return str;
}

/**
 * js数组转html的table
 * @param arr Object [{a,b,..}]
 * @param keyname object, {nick: "昵称"} 每个key在表中的列名
 * @returns {string}
 */
function array2table(arr, keyname = {}) {

    if (!arr || arr.length === 0) {
        console.log(`无数据`, arr);
        return '';
    }

    let keyMap = new Map();
    for (let obj of arr) {
        for (let key in obj) {
            if (!keyMap.has(key)) {
                keyMap.set(key, keyname[key] || key);
            }
        }
    }

    let tr = '<tr><th></th>';
    for (let name of keyMap.values()) {
        tr += '<th>' + name + '</th>';
    }
    tr += '</tr>';

    for (const i in arr) {
        const index = Number(i) + 1;
        tr += "<tr><td>" + index + "</td>";
        const obj = arr[i];
        if (!obj) {
            console.error("null obj");
            continue;
        }
        for (let key of keyMap.keys()) {
            let val = obj[key];
            if (val === undefined) {
                val = '';
            }
            else if (typeof (val) === 'object') {
                val = JSON.stringify(val);
            }
            else if (!isNaN(val) && val > 1028218329197) {
                val = new Date(val).toLocaleString();
            }
            tr += "<td>" + val + "</td>";
        }
        tr += "/<tr>";
    }

    return tr;
}
