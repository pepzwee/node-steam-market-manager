var SteamPriceManager = require('./index.js');
var SteamCommunity = require('steamcommunity');
var SteamID = SteamCommunity.SteamID;
var community = new SteamCommunity();

SteamPriceManager.prototype.getInventory = function(details, callback) {
	var appID = details.appID || this.appID;
	var contextID = details.contextID;
	var tradableOnly = details.tradableOnly || false;
	var getWithPrices = details.getWithPrices || false;
	var getWithFloats = details.getWithFloats || false; // TODO
	
	// We need a callback
	if(typeof callback !== "function") {
		throw new Error('Callback is not defined or not a function');
	}
	// We need the steamid to fetch the user
	if(details.steamid === undefined) {
		callback(new Error('Please specify SteamID64 for the user you are trying to query.'));
		return;
	}
	if(appID === undefined) {
		callback(new Error('You did not specify any Steam Application ID. Don\'t know what to use? Here: https://developer.valvesoftware.com/wiki/Steam_Application_IDs'));
		return;
	}
	if(contextID === undefined) {
		callback(new Error('Please provide the `contextID` of the context within the app you want to load'));
		return;
	}

	// SteamID object
	var SteamID64 = new SteamID(details.steamid);
	// We need to get the steam user first
	community.getSteamUser(SteamID64, function(err, user) {
		if( err) {
			// Returns an `Error` object according to `node-steamcommunity` Wiki
			callback(err);
			return;
		}
		// Get the inventory of the user
		user.getInventory(appID, contextID, tradableOnly, function(err, inventory) {
			if( err) {
				// Returns an `Error` object according to `node-steamcommunity` Wiki
				callback(err);
				return;
			}
			// Populate the inventory with prices
			if(getWithPrices) {
				inventory = this._addPricesToInventory(inventory);
			}
			// Get the floats for the items
			if(getWithFloats) {
				inventory = this._addFloatsToInventory(details, inventory);
			}

			// Return inventory
			callback(null, inventory);
		}.bind(this));
	}.bind(this));

}

// Not sure how to deal with error handling here...
// TODO: Error handling
SteamPriceManager.prototype._addPricesToInventory = function(inventory) {
	var inventoryItemNames = inventory.map(function(item) {
		return item.market_hash_name;
	});

	var prices = {};
	this.getItems({ 'names': inventoryItemNames }, function(results) {
		for(var index in results) {
			prices[results[index].name] = results[index].data;
		}
	});

	var inventoryWithPrices = inventory.map(function(item) {
		item.priceData = prices[item.market_hash_name] || {};
		return item;
	});
	return inventoryWithPrices;
	
}

SteamPriceManager.prototype._addFloatsToInventory = function(details, inventory) {
	return inventory;
}
