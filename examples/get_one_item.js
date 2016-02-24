var MarketPriceManager = require('../lib/index.js'); // use require('steam-market-manager') in production
var market = new MarketPriceManager({
	"appID": 730
});

market.getItem({ "name": "StatTrak™ CZ75-Auto | The Fuschia Is Now (Well-Worn)" }, function(err, item) {
	if( err) {
		console.log('Error: ', err);
		return;
	}

	console.log('Item: ', item);
});

// The response would look something like this:
/*
Item: {
	success: true,
	lowest_price: 10.4,
	volume: '1',
	median_price: 6.99
}
*/