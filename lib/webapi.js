var SteamPriceManager = require('./index.js');

SteamPriceManager.prototype.initWebApi = function() {
	this._webApp.get('/', function(req, res) {
		res.send("github.com/Netifriik/node-steam-market-manager");
	});

	this._webApp.get('/item/:name', function(req, res) {
		var name = decodeURIComponent(req.params.name);
		this.getItem({ 'name': name }, function(err, item) {
			if( err) {
				res.json({ 'error': err });
				return;
			}

			res.json({ 'item': item });
		});
	}.bind(this));
	
	this._webApp.get('/items/all', function(req, res) {
		this.getAllItems({}, function(err, data) {
			if( err) {
				res.json({ 'error': err });
				return;
			}

			res.json({ 'items': data.response.items });
		});
	}.bind(this));

	this._webApp.get('/items/:names', function(req, res) {
		var items = decodeURIComponent(req.params.names);
		var names = items.split(this.webApiSeperator);
		
		this.getItems({ 'names': names }, function(items) {
			res.json({ 'items': items });
		});
		
	}.bind(this));

	this._webApp.listen(this.webApiPort, function() {
		console.log('API listening on port ' + this.webApiPort);
	}.bind(this));
}