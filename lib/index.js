var request = require('request');
var async = require('async');
var accounting = require('accounting');

module.exports = SteamPriceManager;

function SteamPriceManager(options) {
	options = options || {};

	this._request = request;
	this._async = async;

	this._baseUrl = 'http://steamcommunity.com/';
	this._uri = '/market/priceoverview/';

	this._errorCodes = {
		"400": "We did a bad request. Please report this error at Github.",
		"401": "We are not authorized to do this request. Please report this error at Github.",
		"403": "Steam is refusing to respond.",
		"500": "Steam is having issues.",
		"503": "Steam is having issues.",
		"429": "We are making too many requests to Steam."
	};

	this.appID = options.appID || undefined;
	this.currency = options.currency || 3; // EUR
	this.includeFloats = options.includeFloats || false;
	this.keepCurrencySymbols = options.keepCurrencySymbols || false;
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

SteamPriceManager.prototype._requestItem = function(currency, appID, itemName, callback) {
	var self = this;

	this._request({
		uri: this._uri,
		baseUrl: this._baseUrl,
		json: true,
		qs: {
			currency: currency,
			appid: appID,
			market_hash_name: itemName
		}
	}, function(err, res, body) {
		if( ! err && res.statusCode !== 200) {
			if(this._errorCodes[res.statusCode] !== undefined) {
				callback(this._errorCodes[res.statusCode], null);
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