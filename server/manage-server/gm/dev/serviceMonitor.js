let monitorAddress = "http://localhost:6401";

const ERROR_TYPE = {
    "1": "系统异常",
    "2": "响应失败",
    "3": "指令超时",
};

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

    relayRequest({});
}

const PAGE_SIZE = 30;

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
    requestMonitor(`/error/get`, params, function (docs) {
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

    requestMonitor('/profile/get', {}, function (docs) {
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


function requestMonitor(route, param, cb) {

    const url = urlMerge(monitorAddress, route);
    const request = new RelayRequest({
        url,
        method: "POST",
        body: param
    });

    gmRequest(Route.RelayRequest, request, function (result) {
        console.log(`route: ${route}, param=${JSON.stringify(param)}, result: ${result}`);
        cb(JSON.parse(result));
    })
}

const actionHandler = {

    getProfile: getProfile,
};

function onButton() {

    const action = $("#action_select").val();
    const handler = actionHandler[action];
    if (!handler) {
        return alert(`no default handler for action=${action}`);
    }
    handler();

}
