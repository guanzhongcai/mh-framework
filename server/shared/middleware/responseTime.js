/**
 * message response time metric
 */
const reportFormat = require('../metrics/reportFormat');
const command = require('../metrics/command');
const processingCheck = require('./processingCheck');
const debug = require('debug')('responseTime');
const onHeaders = require('on-headers');

/**
 *
 * @param server object server entity
 * @returns function
 */
module.exports = function (server) {

    return function (req, res, next) {

        const startAt = process.hrtime();

        onHeaders(res, function () {
            const diff = process.hrtime(startAt); //[ 0, 553352843 ]
            const span = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
            const fn = createSetHeader();
            fn(req, res, span);

            if (span > 500) {
                debug(req.originalUrl, span, '毫秒');
                const report = reportFormat.Timeout(server._serviceId, req, span);
                server.NotifyMonitor('/error/add', report);
            }
            command.record(req.originalUrl, span);
            processingCheck.decrease();
        });

        next();
    };
};

/**
 * Create function to set response time header.
 */
function createSetHeader() {

    return function setResponseHeader(req, res, time) {
        if (res.getHeader('X-Response-Time')) {
            return
        }

        const val = time.toFixed(3);
        res.setHeader('X-Response-Time', val)
    }
}
