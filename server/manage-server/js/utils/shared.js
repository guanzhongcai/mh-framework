// http://localhost:6083/gm/dev/serviceMonitor.html
const entryAddress = "http://localhost:3001";

//服务器类型
const SERVER_TYPE = {
    game: 'game',   //游戏牌局服
    config: 'config',//配置服
    gateway: 'gateway', //网关服务器
    monitor: 'monitor', //监控服务器
};

/**
 *
 * @param type string 服务类型 account/lobby/..
 * @param cb
 */
function getService(type, cb) {

    if (type === "entry") {
        return cb(entryAddress);
    }

    const url = urlMerge(sessionStorage.entry_server, '/getService');
    const request = new RelayRequest({
        url: url,
        method: "POST",
        body: {type: type},
    });
    gmRequest(Route.RelayRequest, request, function (result) {
        //{"code":200,"type":"account","service":{"type":"account","address":"http://127.0.0.1:5001","protocol":"http"}}
        console.log(result);
        try {
            const ret = JSON.parse(result);
            if (ret.code !== 200) {
                return alert(result);
            }
            const {type, address, protocol} = ret.service || {};
            cb(address);
        } catch (e) {
            alert(`askEntry失败！route=${route}, result=` + result);
            alert(e);
        }
    })
}

/**
 *
 * @param addr string http://host:port
 * @param route string /xx/yy
 * @returns {string}
 */
function urlMerge(addr, route) {
    if (route[0] !== "/") {
        route = "/" + route;
    }
    return `${addr}${route}`;
}

/**
 * 向gm-server发送jsonp请求
 * @param route string 路由 /player/xxx
 * @param request object json请求
 * @param cb
 */
function gmRequest(route, request, cb) {

    //beego的autoRoute需要小写
    console.log(`gmRequest: %s, %s`, request.url, request.body);

    const url = sessionStorage.gm_server + route.toLowerCase();
    _ajax(url, 'GET', 'JSONP', request, cb);
}

/**
 * ajax请求
 * @param url string 请求地址
 * @param method string 请求方式，默认是GET，常用的还有POST
 * @param dataType string 设置返回的数据格式，常用的是json格式，也可以设置为html/jsonp
 * @param data object 设置发送给服务器的数据
 * @param cb
 * @private
 */
function _ajax(url, method, dataType, data, cb) {

    $.ajax({
        url: url,
        type: method.toUpperCase(),
        dataType: dataType,
        data: data,
        success: function (result) {//设置请求成功后的回调函数
            if (cb && typeof (cb) === "function") {
                cb(result);
            } else {
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

    for (var i in arr) {
        var index = Number(i) + 1;
        tr += "<tr><td>" + index + "</td>";
        var obj = arr[i];
        if (!obj) {
            console.error("null obj");
            continue;
        }
        for (let key of keyMap.keys()) {
            var val = obj[key];
            if (val === undefined) {
                val = '';
            }
            else if (typeof (val) === 'object') {
                val = JSON.stringify(val);
            }
            else if (!isNaN(val) && val > 1028218329197) {
                val = getDateTime(val);
            }
            tr += "<td>" + val + "</td>";
        }
        tr += "/<tr>";
    }

    return tr;
}

/**
 * 获取md5签名值
 * @param obj object
 * @returns {*}
 */
const getCryptoSign = function (obj) {

    const keys = Object.keys(obj).sort();
    let str = "";
    for (const key of keys) {
        if (key === "sign" || key === "__sign") {
            continue;
        }

        let val = obj[key];
        if (typeof (val) === 'object' && Object.keys(val).length > 0) {
            // toString(obj);
            val = JSON.stringify(val);
        }
        str += val + "#";
    }
    str += "gosecret98b36e97159eaa9cbf8aaa35";
    // console.log(`str::${str}`);
    return Crypto.MD5(str);
};

/**
 * 添加时间戳和签名值
 * @param obj object
 */
function addTimeSign(obj) {

    if (!obj.__timestamp) {
        obj.__timestamp = Date.now();
    }

    if (!obj.__sign) {
        obj.__sign = getCryptoSign(obj);
    }

    return obj;
}
