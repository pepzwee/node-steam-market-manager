var MarketPriceManager = require('./lib/index.js'); // use require('steam-market-manager') in production
var market = new MarketPriceManager({
	"appID": 730,
	"backpacktf": "your_key", // (can be retreived from http://backpack.tf/api)
	"enableWebApi": true
});

// That's it.