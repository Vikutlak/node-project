/*
  Token handler
*/

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const config = require('../config');

// Container for token methods
const _tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
_tokens.post = (data, callback) => {
  const email = helpers.validateString(data.payload.email);
  const password = helpers.validateString(data.payload.password);

  if(email && password){
    // Lookup the user who matches that email
    _data.read('users', email, (err, userData) => {
      if(!err && userData){
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires,
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if(!err){
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create the new token'});
            }
          })
        } else {
          callback(400, {'Error': 'Password did not match the specified user\'s stored password'});
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field(s)'});
  }
}

// Tokens - get
// Required data: token id
// Optional data: none
_tokens.get = (data, callback) => {
  // Check that the id is valid
  const id = helpers.validateString(data.queryStringObject.id);

  if(id){
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData){
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
}

// Tokens - put
// Required data: token id, extend
// Optional data: none
_tokens.put = (data, callback) => {
  const id = helpers.validateStringLength(data.payload.id, config.tokenLength);
  const extend = helpers.getBoolean(data.payload.extent);

  if(id && extend){
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData){
        // Check to the make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + config.tokenExpirationTimeInMiliseconds;

          // Store the new updates
          _data.update('tokens', id, tokenData, (err) =>{
            if(!err){
              callback(200, {'Message': 'Token extended.'});
            } else {
              callback(500, {'Error': 'Could not update the token\'s expiration'});
            }
          })
        } else {
          callback(400, {'Error': 'The token has already expired, and cannot be extended'});
        }
      } else {
        callback(400, {'Error': 'Specified token does not exist'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
  }
}

// Tokens - delete
// Required data: token id
// Optional data: none
_tokens.delete = (data, callback) => {
   // Check that the id is valid
   const id = helpers.validateStringLength(data.queryStringObject.id, config.tokenLength);

   if(id){
     // Lookup the token
     _data.read('tokens', id, (err, data) => {
       if(!err && data){
         _data.delete('tokens', id, (err) => {
           if(!err){
             callback(200, {'Message': 'Logged out.'});
           } else {
             callback(500, {'Error': 'Could not delete the token'});
           }
         });
       } else {
         callback(400, {'Error': 'Could not find the specified token'});
       }
     });
   } else {
     callback(400, {'Error': 'Missing required field'});
   }
}

// Verify if a given token id is currently valid for a giver user
_tokens.verifyToken = (id, callback) => {
  // Lookup the token 
  _data.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.expires > Date.now()){
        callback(true, tokenData);
      } else {
        callback(false, null);
      }
    } else {
      callback(false, null);
    }
  });
};

_tokens.verifyTokenAndEmail = (id, email, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData){
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true, tokenData);
      } else {
        callback(false, null);
      }
    } else {
      callback(false, null);
    }
  });
};

module.exports = _tokens;