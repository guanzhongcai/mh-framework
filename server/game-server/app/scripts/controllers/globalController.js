const GameRedisHelper = require('./../../../index.app').GameRedisHelper;

const GLOBAL_TABLE = "GlobalData";

function getGlobalUpTime(callback)
{
    GameRedisHelper.getHashFieldValueInt(GLOBAL_TABLE, 'GLOBAL_UPTIME', globalUpTime => {
        callback(globalUpTime);
    });
}

function setGlobalUpTime(v, callback)
{
    GameRedisHelper.setHashFieldValue(GLOBAL_TABLE, 'GLOBAL_UPTIME', v, () => {
        callback(v);
    });
}

function updateGlobalData(callback)
{
    getGlobalUpTime(globalUpTime => {
        var isUpdate = false, newGlobalUpTime = 0;
        if (globalUpTime === 0) {
            // 说明是初期状态
            isUpdate = true;
            newGlobalUpTime = new Date().getTime();
        } else {
            // 需要判断日期（是否为隔日）
            var now = new Date(), 
                st = new Date(globalUpTime);

                if (!(now.getFullYear() === st.getFullYear() && 
                        now.getMonth() === st.getMonth() && now.getDate() === st.getDate())) {
                    // 已隔天
                    isUpdate = true;
                    newGlobalUpTime = now.getTime();
                }
        }

        if (isUpdate) {
            // 更新每日免费循环记录数据（找墨魂）
            updateGlobalGachaDayFreeSelect(() => {
                setGlobalUpTime(newGlobalUpTime, () => {
                    callback(isUpdate);
                });
            });
        } else {
            callback(isUpdate);
        }
    });
}

// ====================================================
// GACHA - DAY_FREE_SELECT
// ====================================================
const HeroGachaDayFree = require('./../../designdata/HeroGachaDayFree');

function getGlobalGachaDayFreeSelect(callback)
{
    GameRedisHelper.getHashFieldValueInt(GLOBAL_TABLE, 'GACHA_DAY_FREE_SELECT', gachaDayFreeSelect => {
        callback(gachaDayFreeSelect);
    });
}

function setGlobalGachaDayFreeSelect(v, callback)
{
    GameRedisHelper.setHashFieldValue(GLOBAL_TABLE, 'GACHA_DAY_FREE_SELECT', v, () => {
        callback(v);
    });
}

function updateGlobalGachaDayFreeSelect(callback)
{
    var min, max;
    [min, max] = HeroGachaDayFree.getDayFreeSelectLimitConfig();
    if (min === 0 || max === 0) {
        // 说明配置表无数据
        callback(0);
    } else {
        getGlobalGachaDayFreeSelect(gachaDayFreeSelect => {
            var dayFreeSelect = gachaDayFreeSelect;
            if (dayFreeSelect === 0) {
                dayFreeSelect = min;
            } else {
                if ((dayFreeSelect + 1) > max) {
                    dayFreeSelect = min;
                } else {
                    ++dayFreeSelect;
                }
            }

            setGlobalGachaDayFreeSelect(dayFreeSelect, () => {
                callback(dayFreeSelect);
            });
        });
    }
}

exports.updateGlobalData = updateGlobalData;
exports.getGlobalGachaDayFreeSelect = getGlobalGachaDayFreeSelect;