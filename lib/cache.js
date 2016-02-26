var SteamPriceManager = require('./index.js');

SteamPriceManager.prototype._checkCache = function(itemName, callback) {
	if(this.cache) {
		if(this.getCache(itemName) === null || ((this.getCache(itemName).updated_at + this.cache) < (new Date().getTime() / 1000))) {
			callback(false);
		} else {
			callback(true, this.getCache(itemName));
		}
	} else {
		callback(false);
	}
}

SteamPriceManager.prototype._addBackpackToCache = function(data) {
	var items = data.response.items;
	for(var index in items) {
		// BackpackTF returns values in cents... and in USD currency
		this.setCache(index, { "lowest_price": items[index].value / 100, "updated_at": new Date().getTime() / 1000 });
	}
	this.saveCache();
}


SteamPriceManager.prototype._initCacheData = function() {
	var fsCacheFileExists = this._fs.existsSync(this._cacheFile);
	if(fsCacheFileExists && Object.getOwnPropertyNames(this._cacheData).length == 0) {
		this._cacheData = JSON.parse(this._fs.readFileSync(this._cacheFile));
	}
}

SteamPriceManager.prototype.setCache = function(itemName, data) {
	data.updated_at = new Date().getTime() / 1000; 
	this._cacheData[itemName] = data;
}

SteamPriceManager.prototype.getCache = function(itemName) {
	return this._cacheData[itemName] || null;
}

SteamPriceManager.prototype.saveCache = function() {
	this._fs.writeFile(this._cacheFile, JSON.stringify(this._cacheData));
}
