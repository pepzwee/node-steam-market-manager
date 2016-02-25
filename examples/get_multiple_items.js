var MarketPriceManager = require('./lib/index.js'); // use require('steam-market-manager') in production
var market = new MarketPriceManager({
	"appID": 730
});

market.getItems({ 
	"names": [
		"M4A4 | Modern Hunter (Battle-Scarred)",
		"StatTrak™ CZ75-Auto | The Fuschia Is Now (Invalid Item)", // This item will have "error"
		"Operation Phoenix Weapon Case"
	]
}, function(items) {
	console.log('Items: ', items);
});

// The response would look something like this:
/*
Items:  [ 
  	{ 
  		name: 'M4A4 | Modern Hunter (Battle-Scarred)', 
  		data: { 
			success: true,
			lowest_price: 3.75,
			volume: '1',
			median_price: 4.78
		} 
	},
	{
		name: 'StatTrak™ CZ75-Auto | The Fuschia Is Now (Invalid Item)',
		error: 'Steam is having issues. (Potential issue: No listings for this item.)' 
	},
	{
		name: 'Operation Phoenix Weapon Case',
		data: {
			success: true,
			lowest_price: 0.06,
			volume: '48,203',
			median_price: 0.06
		} 
	} 
]
*/