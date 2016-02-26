# Steam Market Manager for Node.js
[![npm version](https://img.shields.io/npm/v/steam-market-manager.svg)](https://npmjs.com/package/steam-market-manager)
[![npm downloads](https://img.shields.io/npm/dm/steam-market-manager.svg)](https://npmjs.com/package/steam-market-manager)
[![license](https://img.shields.io/npm/l/steam-market-manager.svg)](https://github.com/netifriik/node-steam-market-manager/blob/master/LICENSE)
[![paypal](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UFAR5YN7G9ZQA)

Install it from [npm](https://www.npmjs.com/package/steam-market-manager) or check out the
[wiki](https://github.com/netifriik/node-steam-market-manager/wiki) for documentation.

# Purpose of this module

I'm developing this module for [Skins.ee](https://www.skins.ee) CS:GO item trade-up website. Since I did not find any other module suitable for my needs I've decided to create my own first module for Node.js.

I will add features that I need. If you have some good ideas please let me know.

# Module

## Web API

You can either call the methods below in a script or enable the WebApi.

### Constructor options for WebApi

* `enableWebApi` - Optional. Defaults to `false`, if `true` then it will enable the WebApi using Express.
* `webApiPort` - Optional. Defaults to `1337`. This is the port the WebApi will be listening on.
* `webApiSeperator` - Optional. Defaults to `!N!`. This seperates the items when calling `/items/:names`.

### /item/:name

Fetches item's price from Market using `getItem` method. Uses the default constructor values.

### /items/:names

Fetches multiple items prices from Market using `getItems` method. Uses the default constructor values.

### /items/all

Fetches all items and their prices from Backpack.tf using `getAllItems` method. Uses the default constructor values.

## Methods

### getItem(options, callback) 

Fetches item's price from Market.

### getItems(options, callback) 

Fetches multiple items prices from Market.

### getAllItems(options, callback) 

Fetches all items and their prices from Backpack.tf. Holds the fetched data for 300 seconds before making a new query since Backpack.tf API limit is 1 request per 300 seconds.

### getInventory(options, callback)

Gets the user inventory using `node-steamcommunity` and adds the option to append `priceData` to the inventory items.

# Support

Report bugs on the [issue tracker](https://github.com/netifriik/node-steam-market-manager/issues)