var request = require('request');
var async = require('async');
var accounting = require('accounting');
var express = require('express');
var fs = require('fs');

module.exports = SteamPriceManager;

// Steam HTTP Code responses
SteamPriceManager.ESteamResponse = require('../resources/ESteamResponse.js');
// Available Steam Market currencies
SteamPriceManager.Currencies = require('../resources/Currencies.js');

function SteamPriceManager(options) {
	options = options || {};

	this._request = request;
	this._async = async;
	this._fs = fs;

	this._marketBaseUrl = 'http://steamcommunity.com/';
	this._marketUri = '/market/priceoverview/';

	this.appID = options.appID || undefined;
	this.currency = options.currency ? SteamPriceManager.Currencies[options.currency] : SteamPriceManager.Currencies.EUR;
	this.includeFloats = options.includeFloats || false;
	this.keepCurrencySymbols = options.keepCurrencySymbols || false;

	// Cache settings
	this.cache = options.cache || false;
	this._cacheFile = 'cache.json';
	this._cacheData = {};

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
	this._initCacheData();
}

SteamPriceManager.prototype.getItem = function(details, callback) {
	var appID = details.appID || this.appID;
	var currency = details.currency || this.currency;
	var itemName = details.name;
	var includeFloat = details.includeFloat || this.includeFloats;

	// We need a callback
	if(typeof callback !== "function") {
		throw new Error('Callback is not defined or not a function');
		return;
	}
	// If user did not specify the appID let's throw an error.
	if(appID === undefined) {
		callback(new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs'), null);
		return;
	}
	// If user did not specify any item name let's throw an error.
	if(itemName === undefined) {
		callback(new Error('Specify an Item name.'), null);
		return;
	}

	this._requestItem(currency, appID, itemName, function(err, item) {
		this.saveCache();
		callback(err, item);
	}.bind(this));
}

SteamPriceManager.prototype.getItems = function(details, callback) {
	var appID = details.appID || this.appID;
	var currency = details.currency || this.currency;
	var includeFloat = details.includeFloat || this.includeFloats;

	var items = details.names;

	// We need a callback
	if(typeof callback !== "function") {
		throw new Error('Callback is not defined or not a function');
	}
	// If user did not specify the appID let's throw an error.
	if(appID === undefined) { 
		callback(new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs'), null);
		return;
	}
	// If user did not specify any item name let's throw an error.
	if(items === undefined || typeof items !== 'object') {
		callback(new Error('You did not specify `names` parameter or it is not an object.'), null);
		return;
	}
	
	// Tasks object for async
	var tasks = items.map(function(itemName){
	  return function(callback) {
	    this._requestItem(currency, appID, itemName, function(err, item) {
	        if( err) {
	        	// Since async stops the whole parallel from continuing on errors we will not populate err
	            callback(null, { "name": itemName, "error": err });
	            return;
	        }

	        callback(null, { "name": itemName, "data": item });
	    });
	  }.bind(this);
	}.bind(this));
	// Go through tasks, using async parallel
	this._async.parallel(tasks, function(err, results) {
		this.saveCache();
		callback(results);
	}.bind(this));
}

SteamPriceManager.prototype.getAllItems = function(details, callback) {
	var format = details.format || 'json';
	var key = this.backpacktf;
	var appID = details.appID || this.appID;

	// We need a callback
	if(typeof callback !== "function") {
		throw new Error('Callback is not defined or not a function');
	}
	// If user did not specify the appID let's throw an error.
	if(key === undefined) {
		callback(new Error('To fetch all items you must get the BackpackTF API Key. More info: http://backpack.tf/api/register'), null);
		return;
	}
	// If user did not specify the appID let's throw an error.
	if(appID === undefined) {
		callback(new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs'), null);
		return;
	}
	// Check if user specified correct format
	if(this._backpackAvailableFormats.indexOf(format) === -1) {
		callback(new Error('Invalid data format for getAllItems'), null);
		return;
	}

	// Backpack.tf has a 300 second query rate limit
	if(this._backpackTimer === false || this._backpackTimer > ((new Date().getTime() / 1000) + (this.cache || 300))) {
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
					this._addBackpackToCache(body);
				}
				// Set the backpack body and set the timer
				this._backpackData = body;
				this._backpackTimer = new Date().getTime() / 1000;
				callback(null, body);
			} else {
				callback(err, null);
			}
		}.bind(this));
	} else {
		if(this._backpackData !== null) {
			callback(null, this._backpackData);
		} else {
			// Something went wrong. Let's clear the data and re-run this function.
			this._backpackTimer = false;
			this.backpackData = null;
			this.getAllItems(details, callback);
		}
	}

	
}

SteamPriceManager.prototype._requestItem = function(currency, appID, itemName, callback) {
	this._checkCache(itemName, function(take, item) {
		// Cached entry of the item is expired or does not exist.
		if( ! take) {
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
					var ESteamResponse = SteamPriceManager.ESteamResponse[res.statusCode];
					if(ESteamResponse !== undefined) {
						callback(ESteamResponse, null);
					} else {
						callback('Unsuccessful response (' + res.statusCode + '). Is Steam having issues?', null);
					}
				} else if( ! err && res.statusCode === 200) {
					if( ! this.keepCurrencySymbols) {
						// Steam uses commas to seperate decimals on all currencies? Untested..
						body.lowest_price = accounting.unformat(body.lowest_price, ",");
						body.median_price = accounting.unformat(body.median_price, ",");
					}
					if(this.cache) {
						this.setCache(itemName, body);
					}
					callback(null, body);
					
				} else {
					callback(err, null);
				}
			}.bind(this));
		} else {
			// Cached item found and not expired
			callback(null, item);
		}
	}.bind(this));
}

require('./webapi.js');
require('./cache.js');
require('./inventory.js');
