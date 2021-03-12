/*
  Request handlers
*/

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const _tokens = require('./tokensHandler');
const https = require('https');
const querystring = require('querystring');

// Private container
const _purchase = {};

// Orders - post
// Required data: orderId (pizza array)
// Optional data: none
_purchase.post = (data, callback) => {
  // Check if the user is logged in
  _tokens.verifyToken(data.headers.token, (tokenIsValid, tokenData) => {
    if(!tokenIsValid){
        callback(403, {'Error': 'Invalid token'});
    } else {
      // Check if orderId header is set
      const orderId = data.headers.orderid;
      const order = data.payload;

      console.log(orderId, order);
      if(!orderId && !order){
          callback(500, {'Error': 'Either orderId header or order in payload has to be sent.'});
          return;
      }

      const orderFileName = helpers.getOrderFileName(orderId, tokenData.email);

      // Depending on the data received, choose among 2 promises
      let getOrderDataPromise = (orderId) ? getOrderFromId : getOrderFromPayload;
      // Choose what param to put into the promise
      const param = (orderId) ? {'orderId': orderId, 'orderFileName': orderFileName} : order;

      // Run the promise
      getOrderDataPromise(param).then((orderData) => {
        //Now the order data is read, charge for it
        processOrder(tokenData.email, orderData, (err) => {
            if(err){
              callback(400, {'Error' : 'Payment error'});
            } else {
              //Delete the order file
              if (orderId) {
                _data.delete('order', orderFileName, (err) => {
                  if(err){
                    console.log(err);
                  } else {
                    console.log('Order was deleted.');
                  }
                });
              }
            callback(200, { 'Message': 'Your payment was received.' });
          }
        });
      })
      .catch((error) => {
        callback(500, error);
      });
    }
  });
};

/* 
  Promises 
*/

const getOrderFromId = (data) => {
  return new Promise((resolve, reject) => {
    let orderFileName = data.orderFileName;

    _data.read('order', orderFileName, (err, fullOrderData) => {

      if(err || fullOrderData == null){
        reject('Error reading the order or order id is invalid.');
      } else {

        orderData = helpers.validatePizzas(fullOrderData.items);
        if(orderData){
          resolve(orderData);
        } else {
          reject('Error reading the order. Please make an order using the payload.');
        }
      }
    });
  });
};

const getOrderFromPayload = (order) => {
  return new Promise((resolve, reject) => {
    let orderData = helpers.validatePizzas(order);
    if(!orderData){
      reject('Order problems');
    } else {
      resolve(orderData);
    }
  });
};

/*
  Helper functions
*/

const processOrder = (receiverEmail, order, callback) => {
  const receiver = 'XXX@XXX.com'; // Insert the email that will receive the receipt
  let bill = calculateBill(order);
  let orderPayload = createOrderPayload(bill, receiver);
  let orderDetails = createStripeRequest(orderPayload);

  purchase(orderDetails, orderPayload, (err) => {
    if (err) {
      callback(true);
    } else {
      callback(false);

      // If the payment was accepted, send the receipt via email
      const sender = 'XXX@XXX.com'; // Insert the email that will send the receipt

      sendReceipt(sender, receiver, "Pizz API receipt", 'This is a message', (err) => {
        if(err){
          console.log('Error while sending receipt: ' + err);
        } else {
          console.log('Sent receipt.');
        }
      });
    }
  });
};

const purchase = (orderDetails, orderPayload, callback) => {
  console.log('\nTrying to charge a card via Stripe...\n');

  if(orderDetails && orderPayload){
    const req = https.request(orderDetails, (res) => {
      if(200 == res.statusCode || 201 == res.statusCode) {
        callback(false);
      } else {
        callback('Payment error');
      }
    });

    req.on('error', (error) => {
      callback('Payment error 2');
    });

    req.write(orderPayload);
    req.end();

  } else {
    callback('Missing required field or field invalid.');
  }
};

const sendReceipt = (sender, receiver, subject, message, callback) => {
  console.log(`\nTrying to send a receipt from ${sender} to ${receiver}.\n`);


  // Validate fields
  sender = helpers.validateEmail(sender);
  receiver = helpers.validateEmail(receiver);
  subject = helpers.validateString(subject, 1, 78);
  message = helpers.validateString(message);

  if(sender && receiver && subject && message){
    // Create the request payload
    const payload = {
      from: sender,
      to: receiver,
      subject: subject,
      text: message
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);
    console.log("\nMail payload:\n" + stringPayload + "\n");

    // Configure the request details
    const requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.mailgun.net',
        'method': 'POST',
        'path': `/v3/YOUR_MAILGUN_DOMAIN/messages`, // Insert the domain that you get from the Mailgun account
        'auth': 'api:YOUR_MAILGUN_KEY', // Insert the ApiKey that you get from the Mailgun account
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload),
        }
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      res.on('data', (data) => {
        console.log("\nData from MailGun:\n" + data + "\n");
      });

      res.on('end', () => {
        const status = res.statusCode;
        if(status === 200 || status === 201){
          callback(false);
        } else {
          callback('Status code returned was ' + status, JSON.stringify(res.headers));
        }
      });
    });

    // In case of an error, bubble it up
    req.on('error', (error) => {
        callback(error);
    });

    // Add the payload
    req.write(stringPayload);
    req.end();

  } else {
    callback(`Error: Missing required field. Input data:\nSender: ${sender}\nReceiver: ${receiver}\nSubject: ${subject}\nMessage: ${message}\n`);
  }
};

/*
  Helper functions
*/

// Returns {charge : number, desc : string}
const calculateBill = (order) => {
  const menu = helpers.getMenu(); //array of pizzas
  console.log(`\nThe following order was made:\n${JSON.stringify(order)}\n`);

  let sum = 0.0;
  for(let i = 0; i < order.length; ++i){
    let pizza = menu.find(pizza => pizza.Id === order[i].id);
    if(pizza == undefined){
      continue;
    }

    let totalPrice = order[i].amount * pizza.Price;
    sum += totalPrice;

  }
  sum = parseInt(sum.toFixed(2));
  console.log('The bill: ' + sum);
  return {
    charge: sum
  };
}

const createOrderPayload = (bill, email) => {
  const payload = {
    'currency': 'EUR',
    'source': 'tok_visa',
    'amount': bill.charge,
    'receipt_email': email,
  };

  // Stringify the payload
  return querystring.stringify(payload);
};

const createStripeRequest = (content) => {
  console.log(`\nSending request to Stripe:\n${content}\n`);
  const requestDetails = {
    'protocol': 'https:',
    'hostname': 'api.stripe.com',
    'method': 'POST',
    'path': '/v1/charges',
    'headers':
      {
        'Authorization': `Bearer YOUR_STRIPE_SECRET_KEY`, // Insert the SecretKey that you get from the Stripe account
        'Content-Length': Buffer.byteLength(content),
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
  };

  return requestDetails;
}

//Export the module
module.exports = _purchase;