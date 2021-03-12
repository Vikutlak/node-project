/*
  Menu request handlers
*/

// Dependencies
const helpers = require('../helpers');
const _tokens = require('./tokensHandler');

// Container for menu
const _menu = {};

// Menu - get
// Required data: none
// Optional data: none
// Required header: token
_menu.get = (data, callback) => {
  // Verify token and email
  _tokens.verifyToken(data.headers.token, (tokenIsValid) => {
    if(tokenIsValid){
      callback(200, helpers.getMenu());
    } else {
      callback(403, {'Error': 'Missing required non-expired token'});
    }
  });
};

module.exports = _menu;