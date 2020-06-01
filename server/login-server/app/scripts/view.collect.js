exports.get_view = (view_name) => {
	return require('./views/'+view_name+'.view');
}