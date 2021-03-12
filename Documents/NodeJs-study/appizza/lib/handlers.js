/*
Request handlers
*/

//Dependencies
const helpers = require('./helpers');
const config = require('./config');
const _users = require('./handlers/usersHandler');
const _tokens = require('./handlers/tokensHandler');
const _purchase = require('./handlers/orderHandler');
const _menu = require('./handlers/menuHandler');
const _shoppingcarts = require('./handlers/shoppingcartHandler');

//Define handlers
const handlers = {};

handlers.users = (data, callback) => {
	const acceptableMethods = ['post','get','put','delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		_users[data.method](data, callback);
	} else {
		callback(405);
	}
};

handlers.tokens = (data, callback) => {
	const acceptableMethods = ['post','get','put','delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		_tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};

handlers.purchase = (data, callback) => {
  const acceptableMethods = ['post'];
  if(acceptableMethods.indexOf(data.method) > -1){
    _purchase[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if(acceptableMethods.indexOf(data.method) > -1){
    _menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.shoppingcarts = (data, callback) => {
  const acceptableMethods = ['post','get','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    _shoppingcarts[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers.notFound = (data, callback) => {
	callback(404, {'Error' : 'Invalid route.'});
};

//Export the module
module.exports = handlers;