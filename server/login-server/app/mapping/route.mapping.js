const views = require('./../scripts/view.collect');

exports.mapping = (app) => {

	// 玩家登录
	app.post('/version', (req, res) => { views.get_view('login').Version(req, res); });
	app.post('/login', (req, res) => { views.get_view('login').Login(req, res); });
	//app.post('/bindinvitecode', (req, res) => { views.get_view('login').BindInviteCode(req, res); });
	//app.post('/playerrestoredata', (req, res) => { views.get_view('login').ReStoreData(req, res); });
	//app.post('/addserverstatus', (req, res) => { views.get_view('login').AddServInfo(req, res); });
	//app.post('/serverlist', (req, res) => { views.get_view('login').ServerList(req, res); });
	app.post('/newtype_playerawaitbeat', (req, res) => { views.get_view('login').PlayerAwaitBeat(req, res); });

	// 兑换码
	/*
	app.post('/invitecodelist', (req, res) => { views.get_view('code').InviteCodeList(req, res); });
	app.post('/createinvitecodes', (req, res) => { views.get_view('code').CreateInviteCodes(req, res); });
	app.post('/giftcodelist', (req, res) => { views.get_view('code').GiftCodeList(req, res); });
	app.post('/creategiftcodes', (req, res) => { views.get_view('code').CreateGiftCodes(req, res); });
	app.post('/covertgiftcode', (req, res) => { views.get_view('code').CovertGiftCode(req, res); });*/
}
