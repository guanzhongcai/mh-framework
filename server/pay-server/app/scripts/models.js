// 订单数据
function SOrderModel()
{
    return {
        sIdent: "",
        cIdent: "",
        cid: 0,
        createTime: 0,
        pstatus: 0,
        gstatus: 0,
    }
}

// 用户订单数据
function UserSOrderModel ()
{
    return {
        lastCreateTime:0,
        orderList:{},
    }
}

exports.SOrderModel = SOrderModel;
exports.UserSOrderModel = UserSOrderModel;