/*
  Create and export configuration variables
*/
const path = require('path');

// Container for configuration variables
const config = {};

//Variables for workers
config.workersLoopTime = 1000 * 60 * 15; // 15 minutes

//Variables for tokens
config.tokenExpirationTimeInMiliseconds = 1000 * 60 * 60; // 1 hour
config.tokenLength = 20;

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging',
	'hashingSecret': 'pizzaIsSecret',
	'stripe': {
		'publicKey': 'YOUR_STRIPE_PUBLIC_KEY',
		'secretKey': 'YOUR_STRIPE_SECRET_KEY',
		'currency': 'EUR',
		'currencySign': '€',
		'source': 'tok_visa'
	},
	'mailGun': {
		'hostname': 'api.eu.mailgun.net', //european endpoint
		'domain': 'YOUR_MAILGUN_DOMAIN',
		'apiKey': 'key-YOUR_MAILGUN_APIKEY',
		'senderMail': 'Pizz API <XXX@XXX.com>' // A valid email 
	}
};

// Production environment
environments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'isTesting': false,
	'envName': 'production',
	'hashingSecret': 'pizzaIsSecret',
	'stripe': {
		'publicKey': 'YOUR_STRIPE_PUBLIC_KEY',
		'secretKey': 'YOUR_STRIPE_SECRET_KEY',
		'currency': 'usd',
		'currencySign': '$',
		'source': 'tok_visa'
	},
	//To be changed in real-life solution, but never to be published
	'mailGun': {
		'hostname': 'api.mailgun.net', //us endpoint
		'domain': 'YOUR_MAILGUN_DOMAIN',
		'apiKey': 'key-YOUR_MAILGUN_APIKEY',
		'senderMail': 'Pizz API <XXX@XXX.com>' // A valid email
	}
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;