var MarketPriceManager = require('./lib/index.js'); // use require('steam-market-manager') in production
var market = new MarketPriceManager({
	"appID": 730,
	"backpacktf": "your_key", // (can be retreived from http://backpack.tf/api)
	"cache": 3600
});

// Without getAllItems - good for small inventories
market.getInventory({
	'steamid': '76561198038526790',
	'contextID': 2,
	'getWithPrices': true,
	'tradableOnly': true
}, function(err, inventory) {
	if( err) {
		console.log('Error: ', err);
		return;
	}

	console.log('Inventory: ', inventory); //  An array containing CEconItem objects for the user's inventory items
});
// Before getting large inventories (20+) with `getWithPrices` set to `true`
// I suggest running getAllItems() otherwise you'll be returned 429 status from Steam
// Steam priceoverview api rate limit is 20 per minute
market.getAllItems({}, function(err) {
	if( err) {
		console.log('Error', err);
		return;
	}

	market.getInventory({
		'steamid': '76561198038526790',
		'contextID': 2,
		'getWithPrices': true,
		'tradableOnly': true
	}, function(err, inventory) {
		if( err) {
			console.log('Error: ', err);
			return;
		}

		console.log('Inventory: ', inventory); //  An array containing CEconItem objects for the user's inventory items
	});
});