/*
  Primary file for the API
*/

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const helpers = require('./lib/helpers');

// Declare the app
var app = {};

// Init function
app.init = () => {
  // Start the server
  server.init();

  // Start the workers
  workers.init();
};

// Execute
app.init();

// Export the app
module.exports = app;