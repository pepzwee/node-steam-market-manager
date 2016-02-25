var request = require('request');
var async = require('async');
var accounting = require('accounting');
var express = require('express');

module.exports = SteamPriceManager;

function SteamPriceManager(options) {
	options = options || {};

	this._request = request;
	this._async = async;

	this._marketBaseUrl = 'http://steamcommunity.com/';
	this._marketUri = '/market/priceoverview/';

	this._errorCodes = {
		"400": "We did a bad request. Please report this error at Github.",
		"401": "We are not authorized to do this request. Please report this error at Github.",
		"403": "Steam is refusing to respond.",
		"500": "Steam is having issues. (Potential issue: No listings for this item.)",
		"503": "Steam is having issues.",
		"429": "We are making too many requests to Steam."
	};

	this.appID = options.appID || undefined;
	this.currency = options.currency || 3; // EUR
	this.includeFloats = options.includeFloats || false;
	this.keepCurrencySymbols = options.keepCurrencySymbols || false;

	// Backpack.TF API
	this.backpacktf = options.backpacktf || undefined;
	this._backpackBaseUrl = 'http://backpack.tf/';
	this._backpackUri = '/api/IGetMarketPrices/v1/';
	this._backpackAvailableFormats = ['json', 'vdf', 'jsonp', 'pretty'];
	this._backpackData = null;
	this._backpackTimer = false;

	// Web API
	this._webApp = express();

	this.enableWebApi = options.enableWebApi || false;
	this.webApiPort = options.webApiPort || 1337;
	this.webApiSeperator = options.webApiSeperator || '!N!';

	if(this.enableWebApi) {
		this.initWebApi();
	}
}

SteamPriceManager.prototype.getItem = function(details, callback) {
	var appID = details.appID || this.appID;
	var currency = details.currency || this.currency;
	var itemName = details.name;
	var includeFloat = details.includeFloat || this.includeFloats;

	// If user did not specify the appID let's throw an error.
	if(appID === undefined) throw new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs');
	// If user did not specify any item name let's throw an error.
	if(itemName === undefined) throw new Error('Specify an Item name.');
	// We need a callback
	if(typeof callback !== "function") throw new Error('Callback is not defined or not a function');

	this._requestItem(currency, appID, itemName, function(err, item) {
		callback(err, item);
	});
}

SteamPriceManager.prototype.getItems = function(details, callback) {
	var self = this;

	var appID = details.appID || this.appID;
	var currency = details.currency || this.currency;
	var includeFloat = details.includeFloat || this.includeFloats;

	var items = details.names;

	// If user did not specify the appID let's throw an error.
	if(appID === undefined) throw new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs');
	// If user did not specify any item name let's throw an error.
	if(items === undefined || typeof items !== 'object') throw new Error('You did not specify `names` parameter or it is not an object.');
	// We need a callback
	if(typeof callback !== "function") throw new Error('Callback is not defined or not a function');

	// Tasks object for async
	var tasks = items.map(function(itemName){
	  return function(callback) {
	    self._requestItem(currency, appID, itemName, function(err, item) {
	        if( err) {
	        	// Since async stops the whole parallel from continuing on errors we will not populate err
	            callback(null, { "name": itemName, "error": err });
	            return;
	        }

	        callback(null, { "name": itemName, "data": item });
	    });
	  }
	});
	// Go through tasks, using async parallel
	this._async.parallel(tasks, function(err, results) {
		callback(results);
	});
}

SteamPriceManager.prototype.getAllItems = function(details, callback) {
	var format = details.format || 'json';
	var key = this.backpacktf;
	var appID = details.appID || this.appID;

	// If user did not specify the appID let's throw an error.
	if(key === undefined) throw new Error('To fetch all items you must get the BackpackTF API Key. More info: http://backpack.tf/api/register');
	// If user did not specify the appID let's throw an error.
	if(appID === undefined) throw new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs');
	// Check if user specified correct format
	if(this._backpackAvailableFormats.indexOf(format) === -1) throw new Error('Invalid data format for getAllItems');
	// We need a callback
	if(typeof callback !== "function") throw new Error('Callback is not defined or not a function');

	// Backpack.tf has a 300 second query rate limit
	if(this._backpackTimer === false || this._backpackTimer > ((new Date().getTime() / 1000) + 300)) {
		this._request({
			uri: this._backpackUri,
			baseUrl: this._backpackBaseUrl,
			qs: {
				format: format,
				key: key,
				appid: appID
			}
		}, function(err, res, body) {
			if( ! err && res.statusCode !== 200) {
				callback('Unsuccessful response (' + res.statusCode + ') from Backpack.tf', null);
			} else if( ! err && res.statusCode === 200) {
				if(format == 'json') {
					body = JSON.parse(body);
					if(body.response.success == 0) {
						callback(body.response.message, null);
						return;
					}
				}
				// Set the backpack body and set the timer
				this._backpackData = body;
				this._backpackTimer = new Date().getTime() / 1000;
				callback(null, body);
			} else {
				callback(err, null);
			}
		});
	} else {
		if(this._backpackData !== null) {
			callback(null, this._backpackData);
		}
	}

	
}

SteamPriceManager.prototype.initWebApi = function() {
	var self = this;

	this._webApp.get('/', function(req, res) {
		res.send("github.com/Netifriik/node-steam-market-manager");
	});

	this._webApp.get('/item/:name', function(req, res) {
		var name = decodeURIComponent(req.params.name);
		self.getItem({ 'name': name }, function(err, item) {
			if( err) {
				res.json({ 'error': err });
				return;
			}

			res.json({ 'item': item });
		});
	});
	
	this._webApp.get('/items/all', function(req, res) {
		self.getAllItems({}, function(err, data) {
			if( err) {
				res.json({ 'error': err });
				return;
			}

			res.json({ 'items': data.response.items });
		});
	});

	this._webApp.get('/items/:names', function(req, res) {
		var items = decodeURIComponent(req.params.names);
		var names = items.split(self.webApiSeperator);
		
		self.getItems({ 'names': names }, function(items) {
			res.json({ 'items': items });
		});
		
	});

	this._webApp.listen(self.webApiPort, function () {
		console.log('API listening on port ' + self.webApiPort);
	});
}

SteamPriceManager.prototype._requestItem = function(currency, appID, itemName, callback) {
	var self = this;

	this._request({
		uri: this._marketUri,
		baseUrl: this._marketBaseUrl,
		json: true,
		qs: {
			currency: currency,
			appid: appID,
			market_hash_name: itemName
		}
	}, function(err, res, body) {
		if( ! err && res.statusCode !== 200) {
			if(self._errorCodes[res.statusCode] !== undefined) {
				callback(self._errorCodes[res.statusCode], null);
			} else {
				callback('Unsuccessful response (' + res.statusCode + '). Is Steam having issues?', null);
			}
		} else if( ! err && res.statusCode === 200) {
			if( ! self.keepCurrencySymbols) {
				// Steam uses commas to seperate decimals on all currencies? Untested..
				body.lowest_price = accounting.unformat(body.lowest_price, ",");
				body.median_price = accounting.unformat(body.median_price, ",");
			}
			callback(null, body);
		} else {
			callback(err, null);
		}
	});
}