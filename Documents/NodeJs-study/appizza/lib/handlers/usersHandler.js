/*
  Request handlers
*/

// Dependencies
const _data = require('../data');
const _tokens = require('../handlers/tokensHandler');
const helpers = require('../helpers');
const config = require('../config');

// Container for the users submethods
const _users = {};

// Users - post
// Required data (for adding a new user): firstName, lastName, email, address, password, tosAgreement
// Optional data: none
// Required header: token
_users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = helpers.validateString(data.payload.firstName);
  const lastName = helpers.validateString(data.payload.lastName);
  const email = helpers.validateString(data.payload.email);
  const password = helpers.validateString(data.payload.password);
  const address = helpers.validateString(data.payload.address, 1, 300);
  
  if(firstName && lastName && email && address && password){
    // Make sure that the user doesn't already exist
    _data.read('users', email, (err, data) => {
      if(err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          const userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'hashedPassword': hashedPassword,
            'address': address,
          }

          // Store the user
          _data.create('users', email, userObject, (err) => {
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'Could not create the new user'});
            }
          })        
        } else {
          callback(500, {'Error': 'Could not hash the user\'s password'});
        } 
      } else {
        // User already exists
        callback(400, {'Error': 'A user with that email already exists'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Users - get
// Required data: email
// Optional data: none
// Required header: token
_users.get = (data, callback) => {
  // Check that the email is valid
  const email = helpers.validateString(data.payload.email);
  if(email){
    // Get the token from the headers
    const token = helpers.validateString(data.headers.token);
    // Verify that the given token is valid for the email
    _tokens.verifyToken(token, (tokenIsValid) => {
      if(tokenIsValid){
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if(!err && data){
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, {'Error': 'Invalid email.'});
          }
        });        
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });    
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, address, password (at least one must be specified)
// Required header: token
_users.put = (data, callback) => {
  // Check for the required field
  const email = helpers.validateString(data.payload.email);
  
  // Check for the optional fields
  const firstName = helpers.validateString(data.payload.firstName);  
  const lastName = helpers.validateString(data.payload.lastName);
  const password = helpers.validateString(data.payload.password);
  const address = helpers.validateString(data.payload.address);

  // Error if the email is invalid
  if(email){
    // Error if nothing is sent to update
    if(firstName || lastName || password || address){
      // Get the token from the headers
      const token = helpers.validateString(data.headers.token);
    
      // Verify that the given token is valid for the email number
      _tokens.verifyToken(token, email, (tokenIsValid) => {
        if(tokenIsValid){
        // Lookup the user
        _data.read('users', email, (err, userData) =>{
          if(!err && userData){
              // Update the fields necessary
              if(firstName){ userData.firstName = firstName; }
              if(lastName){ userData.lastName = lastName; }
              if(password){ userData.hashedPassword = helpers.hash(password); }
              if(address){ userData.address = address; }

              //Store the new updates
              _data.update('users', email, userData, (err) => {
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error': 'The specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token in header, or token is invalid'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Users - delete
// Required field: email
// Optional data: none
// Required header: token
_users.delete = (data, callback) => {
  // Check that the email is valid
  const email = helpers.validateString(data.payload.email);
  if(email){
    // Get the token from the headers
    const token = helpers.validateString(data.headers.token);
  
    // Verify that the given token is valid for the email
    _tokens.verifyTokenAndEmail(token, email, (tokenIsValid) => {
      if(tokenIsValid){
        // Lookup the user
        _data.read('users', email, (err, userData) => {
          if(!err && data){
            _data.delete('users', email, (err) => {
              if(!err){
                // List all items in the directory containing the user's name (email)
                _data.listContaining('order', email, (err, fileList) => {
                  if(err && config.showMessagesInCommandLine){
                    console.log('\nError deleting orders of user:' + email + '\n');
                  } else {
                    fileList.forEach((fileName) => {
                      _data.delete('order', fileName, (err) => {
                        if(err && config.showMessagesInCommandLine){
                          console.log('\nError deleting order: ' + email + '\n');
                        }
                      });
                    });
                  }
                });
                callback(200, {'Message': 'Successfully deleted the user'});
              } else {
                callback(500, {'Error': 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400, {'Error': 'Could not find the specified user'});
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });    
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

module.exports = _users;