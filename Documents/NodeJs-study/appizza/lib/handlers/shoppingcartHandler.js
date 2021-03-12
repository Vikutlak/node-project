/*
  Shopping cart request handlers
*/

// Dependencies
const helpers = require('../helpers');
const _data = require('../data');
const _tokens = require('./tokensHandler');

// Container for shopping cart
const _shoppingCart = {};

// Shopping cart - get
// Required header: token
// Required data: none
// Optional data: none
// Lists ordered but not yet purchased items
_shoppingCart.get = (data, callback) => {
  // Verify if token is valid
  _tokens.verifyToken(data.headers.token, (tokenIsValid, tokenData) => {
    if(!tokenIsValid){
      callback(403, {'Error': 'Invalid token.'});
    } else {
      const userName = tokenData.email;

      // List all items in the directory containing the userName
      _data.listContaining('order', userName, (err, fileList) => {
        if(err){
          callback(500, {'Error': 'Your cart is not right'});
        } else {
          // If empty orders, notify
          if(fileList.length == 0){
            callback(200, {'Message': 'Your cart is empty'});
          }
          // Array for holding orders
          let orderArray = [];
          // Counting files processed
          let count = 0;

          fileList.forEach((fileName) => {
            _data.read('order', fileName, (err, orderData) => {
              ++count;
              if(err){
                callback(500, {'Error': 'Your cart is not right'});
              } else if(orderData != null){
                orderArray.push(orderData);
              }
              // When all orders are processed, return the array
              if(count === fileList.length){
                callback(200, {'Shopping cart': orderArray});
                return;
              }
            });            
          });          
        }
      });
    }
  });
};

// Shopping cart - post
// Required data: token, array of pizza objects (id required, amount optional)
// Optional data: none
_shoppingCart.post = (data, callback) => {
   // Verify if token is valid
   _tokens.verifyToken(data.headers.token, (tokenIsValid, tokenData) => {
    if(!tokenIsValid){
      callback(403, {'Error': 'Your token is invalid.'});
    } else {
      // validate order
      const orders = helpers.validatePizzas(data.payload);

      if(!orders){
        callback(403, {'Error': 'Your order is invalid.'});
        return
      }

      const orderId = Date.now();
      const orderFileName = helpers.getOrderFileName(orderId, tokenData.email);
      const orderData = {'orderId': orderId, 'items': orders};

      // Create a JSON file for the order
      _data.create('order', orderFileName, orderData, function(err){
				if(err){
            callback(500, {'Error' : 'Error adding order to the shopping cart.'})
        } else {
          console.log(`Order ${orderId} was saved to file: ` + JSON.stringify(orderData));
          callback(200, {'Message' : 'The order was received', 'orderId' : orderId });
        }
			});
    }
  });
};

// Shopping cart - delete]
// Required data: token, orderId
// Optional data: none
_shoppingCart.delete = (data, callback) => {
  // Verify if token is valid
  _tokens.verifyToken(data.headers.token, (tokenIsValid, tokenData) => {
    if(tokenIsValid){
      const orderId = data.queryStringObject.orderId;

      console.log('Data received: ' + JSON.stringify(data.queryStringObject));
      console.log('Order id validated: ' + orderId);

      if(!orderId){
        callback(403, {'Error': 'Order id is missing or not a number'});
        return;
      }

      const orderFileName = helpers.getOrderFileName(orderId, tokenData.email);

      // Deleting order file
      _data.delete('order', orderFileName, (err) => {
        if(err){
          callback(500, {'Error': 'Error deleting the order or it does not exist.'})
          return;
        } else {
          callback(200, {'Message': 'The order was deleted'});
        }
      });
    } else {
      callback(403, {'Error': 'Invalid token'});
    }
  });
};

module.exports = _shoppingCart;
