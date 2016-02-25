var MarketPriceManager = require('./lib/index.js'); // use require('steam-market-manager') in production
var market = new MarketPriceManager({
	"appID": 730,
	"backpacktf": "your_key" // (can be retreived from http://backpack.tf/api)
});


market.getAllItems({}, function(err, items) {
	if( err) {
		console.log('Error', err);
		return;
	}

	console.log('Items: ', items);
});