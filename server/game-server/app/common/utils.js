function getRandom(wt)
{
    return Math.ceil(Math.random() * wt);
}

// 范围没随机
function getLimitRandom(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomFromArray (arr)
{
    return arr[Math.floor((Math.random() * arr.length))];
}

function getRandomArrayElements (arr, count)
{
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function isArrayContains (arr, obj)
{
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
}

function getArrayMinIndex (arr)
{
    let minIndex = 0;
    let minValue = -1;
    for (let i in arr){
        if (i == 0) {
            minValue = arr[i];
            minIndex = i;
        }else {
            if (arr[i] <= minValue) {
                minValue = arr[i];
                minIndex = i;
            }
        }
    }
    return minIndex;
}

// list = [{k, v}]
function randomListByWeight(list, count=1, unique=false)
{
    if (count === 0)
        return [];
    // 权重排序
    list.sort((a, b) => { return a.v > b.v; });
    // 获取总权重值
    let weightTotal = 0;
    for (let i = 0; i < list.length; i++) {
        weightTotal += list[i].v;
    }
    let data = [];
    // 开始随机
    while (count--) {
        var a = 0, b = 0;
        var seed = getRandom(weightTotal);
        for (let i = 0; i < list.length; i++) {
            a += (i==0) ? 1 : list[i-1].v;
            b += list[i].v;
            if (seed >= a && seed <= b) {
                if (unique && isArrayContains (data, list[i].k)) {
                    count++;
                }else {
                    data.push(list[i].k);
                }
            }
        }
    }
    return data;
}

function shuffle(arr)
{
    var len = arr.length,
    randomIndex,
    tmp;

    while (len) {
        randomIndex = Math.floor(Math.random() * (len--));
        tmp = arr[randomIndex];
        arr[randomIndex] = arr[len];
        arr[len] = tmp;
    }
    return arr;
}

function addArray(arr1, arr2)
{
    arr1.forEach((_, index, input) => {
        input[index] += arr2[index];
    });

    return arr1;
}

function isOneChar(str, char)
{
    var count = 0;
    for (let i = 0; i < str.length; i++) {
        var charAt = str.charAt(i);
        if (charAt === char) {
            ++count;
        }
    }

    return (count === 1);
}

function splitToIntHash(str, char1, char2)
{
    if (str == null || str === '')
        return [];

    var hash = [];

    if (isOneChar(str, char2)) {
        var tmps = str.split(char2);
        hash.push(parseInt(tmps[0]));
        hash.push(parseInt(tmps[1]));
    } else {
        var tmps = str.split(char1);
        if (char2 !== null) {
            for (let i = 0; i < tmps.length; i++) {
                var kv = tmps[i].split(char2);
                hash.push([parseInt(kv[0]), parseInt(kv[1])]);
            }
        } else {
            var kv = [];
            for (let i = 0; i < tmps.length; i++) {
                if (i%2 === 0) {
                    // key
                    kv[0] = parseInt(tmps[i]);
                } else {
                    // value
                    kv[1] = parseInt(tmps[i]);
                }

                if (kv.length === 2) {
                    hash.push(kv);
                    kv = [];
                }
            }
        }
    }

    return hash;
}

function splitToIntArray (str, char1)
{
    if (str == null || str === '')
        return [];

    str = str.toString ();

    var res = [];
    var tmps = str.split(char1);
    for (let i = 0; i < tmps.length; i++) {
        res.push (parseInt(tmps[i]));
    }
    return res;
}


function splitToKVHashArray(str, char1, char2)
{
    if (str == null || str === '')
        return [];
    var hash = [];

    if (isOneChar(str, char2)) {
        var tmps = str.split(char2);
        hash.push({ k:parseInt(tmps[0]), v:parseInt(tmps[1])});
    } else {
        var tmps = str.split(char1);
        if (char2 !== null) {
            for (let i = 0; i < tmps.length; i++) {
                var kv = tmps[i].split(char2);
                hash.push({ k:parseInt(kv[0]), v:parseInt(kv[1])});
            }
        } else {
            var kv = [];
            for (let i = 0; i < tmps.length; i++) {
                if (i%2 === 0) {
                    kv[0] = parseInt(tmps[i]);
                } else {
                    kv[1] = parseInt(tmps[i]);
                }
                if (kv.length === 2) {
                    hash.push({k: kv[0], v: kv[1]});
                    kv = [];
                }
            }
        }
    }
    return hash;
}

function splitList(str, char)
{
    if (str && str.includes(char)) {
        let data = [];
        var tmps = str.split(char);
        let k = 0, v = 0;
        for (let i = 0; i < tmps.length; i++) {
            if (i%2 === 0) {
                // key
                k = parseInt(tmps[i]);
            } else {
                // value
                v = parseInt(tmps[i]);
            }

            if (k > 0 && v > 0) {
                data.push({ k:k, v:v });
                k = 0;
                v = 0;
            }
        }

        return data;
    } else {
        return [];
    }
}

function splitItemList(str, char)
{
    if (str && str.includes(char)) {
        let data = [];
        var tmps = str.split(char);
        let k = 0, v = 0;
        for (let i = 0; i < tmps.length; i++) {
            if (i%2 === 0) {
                // key
                k = parseInt(tmps[i]);
            } else {
                // value
                v = parseInt(tmps[i]);
            }

            if (k > 0 && v > 0) {
                data.push({ id:k, count:v });
                k = 0;
                v = 0;
            }
        }

        return data;
    } else {
        return [];
    }
}

// function isSameDay (timeStampA, timeStampB)
// {
//     let dateA = new Date(timeStampA);
//     let dateB = new Date(timeStampB);
//     return (dateA.setHours(0, 0, 0, 0) == dateB.setHours(0, 0, 0, 0));
// }

function isSameDay (timeStamp1, timeStamp2)
{
    timeStamp1 = Math.floor(timeStamp1 / 1000);
    timeStamp2 = Math.floor(timeStamp2 / 1000);
    let DayBeginHour = 0;
    var now = new Date();
    timeStamp1 -= now.getTimezoneOffset() * 60;
    timeStamp2 -= now.getTimezoneOffset() * 60;
    if(DayBeginHour){
        timeStamp1 -= DayBeginHour * 60 * 60;
        timeStamp2 -= DayBeginHour * 60 * 60;
    }
    var day1 = Math.floor(timeStamp1 / (60 * 60 * 24));
    var day2 = Math.floor(timeStamp2 / (60 * 60 * 24));
    return day1 === day2;
}


function getTime(dt='')
{
    return (dt === '') ? (new Date()).getTime() : (new Date(dt)).getTime();
}

function getFormatTime() {
    return (new Date ()).toLocaleString ();
}

function getCdTime(cd, st)
{
    if (cd === 0)
        return 0;

    var cdtime = cd - ((new Date()).getTime() - st);
    return cdtime <= 0 ? 0 : cdtime;
}

function getItemArraySplitOnce(s, c)
{
    var items = [];
    if (s && s.includes(c) && (s.split(c).length%2 === 0)) {
        var chunks = s.split(c), itemId = 0, itemCount = 0;
        for (let i in chunks) {
            var value = parseInt(chunks[i]);
            if ((parseInt(i) + 1) % 2 === 0) {
                itemCount = value;
            } else {
                itemId = value;
            }

            if (itemId > 0 && itemCount > 0) {
                items.push({
                    id: itemId,
                    count: itemCount
                });

                itemId = 0, itemCount = 0;
            }
        }
    }

    return items;
}

function getItemArraySplitTwice(s, c1, c2)
{
    if (s === '') {
        return []
    } else {
        var data = [],
            chunks = s.split(c1);
        for (let chunk of chunks) {
            if (chunk.includes(c2)) {
                var tmps = chunk.split(c2);
                data.push({ id: parseInt(tmps[0]), count: parseInt(tmps[1]) });
            }
        }

        return data;
    }
}

function getHashArraySplitTwice(s, c1, c2, sKey=false)
{
    if (s === '') {
        return []
    } else {
        var data = [],
            chunks = s.split(c1);
        for (let chunk of chunks) {
            if (chunk.includes(c2)) {
                var tmps = chunk.split(c2);
                data.push({ k: sKey ? tmps[0] : parseInt(tmps[0]), v: parseInt(tmps[1]) });
            }
        }

        return data;
    }
}

function GetSpeedUpCostByLeftTime (time)
 {
    var min = Math.ceil(time / 10),
        costTotal = 0;
    /*
    if (min > 60) {
        costTotal = (min - 60) * 0.2 + 41;
    } else if (min > 30) {
        costTotal = (min - 60) * 0.5 + 26;
    } else if (min > 10) {
        costTotal = (min - 10) * 0.8 + 10;
    } else {
        costTotal = min;
    }*/

    costTotal = Math.ceil(min * 0.05);
    return Math.abs(Math.floor(costTotal));
}

function isSameWeek(st, nt) {
    var DAY_COUNT = 24*60*60*1000,
        stCount = parseInt(st.getTime() / DAY_COUNT),
        ntCount = parseInt(nt.getTime() / DAY_COUNT);
    return parseInt((stCount + 4 ) / 7) == parseInt((ntCount + 4) / 7);
}

function getDays(st, nt)
{
    if (st >= nt) {
        return 0;
    }

    var sd = new Date(st),
        nd = new Date(nt),
        count = 1;
    while (1) {
        sd.setDate(sd.getDate() + 1);

        if (sd.getFullYear() == nd.getFullYear() &&
                sd.getMonth() == nd.getMonth() &&
                    sd.getDate() == nd.getDate()) {
            break;
        }

        if (++count > 99999) {
            break;
        }
    }

    return count;
}

// 根据时间获取毫秒
function getMSByTime(time='00:00:00')
{
    var tmps = [0, 0, 0], chunks = time.split(':');
    for (let i in tmps) {
        tmps[i] = ('string' == typeof chunks[i] ? parseInt(chunks[i]) : 0);
    }

    return tmps[0] * 60 * 60 * 1000 + tmps[1] * 60 * 1000 + tmps[2] * 1000;
}

/**
 * getGlobalUniqueId - 获取全局唯一ID
 * @param {Number} param
 */
function getGlobalUniqueId()
{
    const UUID = require('uuid');
    const crypto = require('crypto');

    var str = crypto.createHash('md5').update(UUID.v1()).digest('hex');
    return str.substr(8, 16);
}


function getGlobalUniqueIdAll() {
    const UUID = require('uuid');
    const crypto = require('crypto');
    let str = crypto.createHash('md5').update(UUID.v1()).digest('hex');
    return str;
}

function hscanBackArrToObj(arr)
{
    let backObj = {}
    for ( let i = 0 ; i < arr.length ; i +=2){
        backObj[arr[i]] = JSON.parse(arr[i+1])
    }
    return backObj
}

function refactorFloor (num) {
    let isPositive = num >= 0
    if (Math.abs(num) < 1) {
        return isPositive ? 1 : -1;
    }else {
        return Math.round (num);
    }
}

exports.getRandom = getRandom;
exports.getLimitRandom = getLimitRandom;
exports.getRandomFromArray = getRandomFromArray;
exports.getRandomArrayElements = getRandomArrayElements;
exports.isArrayContains = isArrayContains;
exports.getArrayMinIndex = getArrayMinIndex;
exports.randomListByWeight = randomListByWeight;
exports.shuffle = shuffle;
exports.addArray = addArray;
exports.splitToIntArray = splitToIntArray;
exports.splitToIntHash = splitToIntHash;
exports.splitToKVHashArray = splitToKVHashArray;
exports.splitList = splitList;
exports.splitItemList = splitItemList;
exports.isSameDay = isSameDay;
exports.getTime = getTime;
exports.getCdTime = getCdTime;
exports.getFormatTime = getFormatTime;
exports.getItemArraySplitOnce = getItemArraySplitOnce;
exports.getItemArraySplitTwice = getItemArraySplitTwice;
exports.getHashArraySplitTwice = getHashArraySplitTwice;
exports.GetSpeedUpCostByLeftTime = GetSpeedUpCostByLeftTime;
exports.isSameWeek = isSameWeek;
exports.getDays = getDays;
exports.getMSByTime = getMSByTime;
exports.getGlobalUniqueId = getGlobalUniqueId;
exports.getGlobalUniqueIdAll = getGlobalUniqueIdAll;
exports.hscanBackArrToObj = hscanBackArrToObj;
exports.refactorFloor = refactorFloor;