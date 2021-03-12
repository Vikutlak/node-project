There are some variables and properties that needs to have their values switched to the information requested

at orderHandler.js => const processOrder needs a valid email receiving the receipt (receiver) and a valid email for Mailgun service (sender)
=> at requestDetails inside const sendReceipt needs a Mailgun domain and an authentication key
=> const createStripeRequest needs a Stripe SecretKey

at config.js => environments, all the keys.

First of all, run node index to get the server running
Via Postman send a POST request to the /users route passing a body with the properties => firstName, lastName, email, password and address (they should all be strings)
Via Postman send a POST request to the /tokens route passing a body with the email and the password of the user you've created, you should receive a token
Via Postman send a GET request to the /menu route passing the token via Headers, you should see the menu
Via Postman send a POST request to the /shoppingcart route passing the token via Headers and a body with an array of objects with properties id and amount (they should all be numbers) based on what you chose from the menu
-> It should look like this => [{"id":1, "amount": 3}] if you chose to buy 3 pizzas with the property id = 1
You should receive a message confirming the order and an orderId
Via Postman send a POST request to the /purchase route passing the token and the orderId via Headers.
