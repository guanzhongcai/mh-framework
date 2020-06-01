module.exports = (logServer,tokenUtil) => {
    return (req, res, next) => {
        req.logServer = logServer
        req.tokenUtil = tokenUtil
        next(null, req, res);
    }
};