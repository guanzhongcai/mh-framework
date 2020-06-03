// http://localhost:6083/gm/dev/serviceMonitor.html

const ERROR_TYPE = {
    "1": "系统异常",
    "2": "响应失败",
    "3": "指令超时",
};

//服务器类型
const SERVER_TYPE = {
    game: 'game',   //游戏牌局服
    config: 'config',//配置服
    gateway: 'gateway', //网关服务器
    monitor: 'monitor', //监控服务器
};


let monitorAddress;

function onReady() {

    $("#beginTime").datetimepicker({
        showSecond: true,
        showMillisec: false,
        timeFormat: 'hh:mm:ss'
    });
    $("#endTime").datetimepicker({
        showSecond: true,
        showMillisec: false,
        timeFormat: 'hh:mm:ss'
    });

    let tnow = Date.now();
    $("#beginTime").datetimepicker('setDate', (new Date(tnow - 3600 * 1000)));
    $("#endTime").datetimepicker('setDate', (new Date(tnow)));

    for (let error in ERROR_TYPE) {
        const option = `<option value=${error}>${ERROR_TYPE[error]}</option>`;
        $("#error_select").append($(option));
    }

    initOptionSelect();
    configGet();
}

function configGet() {

    sendRequest('/config', {}, function (err, result) {
        monitorAddress = result['monitorAddress'];
        console.log(`monitorAddress=${monitorAddress}`);
        if (!monitorAddress) {
            alert(JSON.stringify(result));
        }
    })
}

let _serviceAll = {};

function fetchOneAddress(type) {

    const all = _serviceAll[type];
    if (all) {
        const values = Object.values(all);
        if (values.length > 0) {
            const index = Math.floor(Math.random() * values.length);
            const {address} = values[index];
            return address;
        }
    }

    return `http://localhost:6401`;
}

function serviceGetAll() {
    // alert(`monitorAddress=${monitorAddress}`);
    relayRequest(monitorAddress, '/service/getAll', {}, function (err, serviceAll) {
        let services = [];
        _serviceAll = serviceAll;
        for (let type in serviceAll) {
            const all = serviceAll[type];
            for (let key in all) {
                services.push({
                    type: type,
                    key: key,
                    value: all[key],
                })
            }
        }
        const data = array2table(services);
        $("#table1").html(data);
    })
}

const PAGE_SIZE = 30;

function healthCheck() {

    const address = fetchOneAddress(SERVER_TYPE.game);
    relayRequest(address, '/admin/healthCheck', {});
}

function fetchservertime() {

    const address = fetchOneAddress(SERVER_TYPE.game);
    relayRequest(address, '/fetchservertime', body);
}

function stopService() {

    const address = fetchOneAddress(SERVER_TYPE.game);
    relayRequest(address, '/admin/stopService', {force: 0});

}

function getOneService() {

    const address = fetchOneAddress(SERVER_TYPE.gateway);
    const body = {type: "game", lastAddress: "http://host:port"};
    relayRequest(address, '/getOneService', body);
}

//{"loginServInfo":{"host":"192.168.188.224","port":8120},
// "gameServInfo":{"host":"192.168.188.224","port":6401},
// "httpuuid":"0","uuid":18808031,"code":200}
function gatewayGet() {

    const address = fetchOneAddress(SERVER_TYPE.gateway);
    const body = {
        httpuuid: 0,
        openid: "112233",
        platform: "win32",
    };
    relayRequest(address, '/gateway', body);
}

function relayRequest(address, path, body, cb) {
    let url = address + path;
    if (path === '/service/getAll') {
        body = JSON.stringify(body);
    } else {
        url = prompt('请确认请求url:', url);
        if (!url) {
            return;
        }
        body = prompt("请确认JSON请求消息体:", JSON.stringify(body));
        if (!body) {
            return;
        }
    }
    try {
        body = JSON.parse(body);
        sendRequest('/relayRequest', {url, body}, function (err, result) {
            let str = `【请求】url= ${url}, body= ` + JSON.stringify(body);
            str += '<br>';
            str += `【回应:】` + JSON.stringify(result);
            $("#text_span").html(str);
            if (typeof cb === 'function') {
                cb(err, result);
            }
        });
    } catch (e) {
        alert(`JSON格式不合法，发送失败！请确认！\n` + body);
    }
}

function getError() {

    const startTime = $("#beginTime").val();
    const endTime = $("#endTime").val();
    const type = parseInt($("#error_select").val());

    const page = prompt(`每页${PAGE_SIZE}条，按时间倒序，请输入页数：`, '1');
    if (!page) {
        return;
    }

    let condition = {time: {$gte: startTime, $lte: endTime}, type: type};
    if (type === 0) {
        delete condition.type;
    }
    const projection = {_id: 0, __v: 0};
    const options = {limit: PAGE_SIZE, sort: {time: -1}, skip: PAGE_SIZE * (page - 1)};
    const params = {condition, projection, options};
    relayRequest(monitorAddress, `/error/get`, params, function (err, docs) {
        if (docs.length === 0) {
            return alert('查无记录');
        }
        for (let doc of docs) {
            doc.time = new Date(doc.time).toLocaleString();
            doc.type = ERROR_TYPE[doc.type];
        }
        const text = array2table(docs);
        $("#table1").html(text);
    })
}


function getProfile() {

    relayRequest(monitorAddress, '/profile/get', {}, function (err, docs) {
        if (docs.length === 0) {
            return alert('查无记录');
        }

        let systems = [];
        const now = Date.now();
        for (let doc of docs) {
            let s = {"serviceId": doc.serviceId};
            systems.push(Object.assign(s, doc.system));
            filterSystemInfo(s);
            delete doc.system;

            doc.uptime = timeAgo(now - doc.uptime * 1000);
            if (now - doc.time > 60 * 1000) {
                doc.time = '<font color=red>' + timeAgo(doc.time) + '前' + '</font>';
            } else {
                doc.time = timeAgo(doc.time) + '前';
            }
            filterProcessInfo(doc.process);
        }

        const keyName = {
            process: "进程信息",
            time: "上次心跳",
            uptime: "运行时间",
        };
        const text = array2table(docs, keyName);
        $("#table1").html(text);

        const text2 = array2table(systems);
        $("#table2").html(text2);
    });

    //"process":{"cpuAvg":"0.1","memAvg":"0.6","vsz":"1572164","rss":"56656"}
    function filterProcessInfo(process) {
        //{"cpu":"0.2%","memory":"61.90M","ppid":12609,"pid":44691,"ctime":2470,"elapsed":212000,"timestamp":1586769426957}
        const keys = ['pid', 'ppid', 'ctime', 'elapsed', 'timestamp'];
        for (let key in process) {
            if (keys.includes(key)) {
                delete process[key];
            }
        }
        process.cpu = Number(process.cpu).toFixed(2) + '%';
        process.memory = (process.memory / 1024 / 1024).toFixed(2) + 'M';
    }

    //"system":{"hostname":"sg2dev","type":"Linux","platform":"linux","arch":"x64","release":"3.2.0-67-generic","totalmem":8374824960,"freemem":1904488448,"memoryUsage":{"rss":57933824,"heapTotal":38080512,"heapUsed":27937264,"external":195625}}
    function filterSystemInfo(system) {

        delete system.memoryUsage;
        // delete system.release;
        // delete system.arch;

        const G = 1024 * 1024 * 1024;
        system.totalmem = (system.totalmem / G).toFixed(2) + "G";
        system.freemem = (system.freemem / G).toFixed(2) + "G";
    }
}

function commandMetricGet() {

    const address = "http://localhost:6401";
    relayRequest(address, '/admin/commandMetricGet', {}, function (err, result) {

        const {data} = result;
        let array = [];
        for (let route in data) {
            array.push(Object.assign({route, avg: 0}, data[route]));
        }
        if (array.length === 0) {
            return alert('查无记录')
        }
        const keyName = {
            route: "调用路由",
            avg: "平均处理",
            min: "最短时间",
            max: "最长时间",
            count: "调用次数",
        };
        for (let o of array) {
            o.avg = Math.round(o.total / o.count) + 'ms';
            delete o.total;
        }
        array.sort(function (a, b) {
            return b.avg - a.avg;
        });
        const text = array2table(array, keyName);
        $("#table2").html(text);
    })
}

/**
 *
 * @param url string
 * @param data object
 * @param cb
 * @private
 */
function sendRequest(url, data, cb) {

    $.ajax({
        url: url,
        type: "GET",
        dataType: "JSON",
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


const options = {
    serviceGetAll,
    commandMetricGet,
    getProfile,
    stopService,
    healthCheck,
    fetchservertime,
    gatewayGet,
    getOneService,
};

function initOptionSelect() {
    for (const key in options) {
        const option = `<option value=${key}>${key}</option>`;
        $("#option_select").append($(option));
    }
}

function onButtonOption() {

    const key = $("#option_select").val();
    options[key]();
}
