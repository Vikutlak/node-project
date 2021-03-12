/*
  Helpers for various tasks
*/

// Dependencies 
const config = require('./config');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Container for all the helpers
const helpers = {};

// Get menu (JSON)
helpers.getMenu = () => {
  const menuText = fs.readFileSync(path.join(__dirname, 'menu.json'), 'utf8');
  return JSON.parse(menuText);
}

helpers.getOrderFileName = (orderId, userName) => {
  return `order_${orderId}_for_${userName}`;
}

// Create a SHA256 hash
helpers.hash = (str) => {
  if(typeof(str) == 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
  try{
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
};

// Series of validation
helpers.validateArrayAndFields = (input, reqFields = []) => {
  // Check if input is an array
  const isValid = helpers.validateArray(input);
  if(!isValid){
    return false;
  }

  // Check if all elements have the required fields
  input.forEach((element) => {
    let elementIsValid = helpers.hasAllProperties(element, reqFields);
    if(!elementIsValid){
      return false;
    }
  });
  return input;
};

helpers.validateArray = (input) => {
  return typeof(input) == 'object' && input instanceof Array && input.length > 0 ? input : false;
};

helpers.validateArrayOfNumbers = (input) => {
  let isValid = helpers.validateArray(input);
  if(isValid){
    input.forEach((element) => {
      if(!validateInteger(element)){
        return false;
      }
    });
  return true;
  } else {
    return false;
  }
};

helpers.validateArrayOfEmpty = (input) => {
  return typeof(input) == 'object' && input instanceof Array && input.length > 0 ? input : false;
}

helpers.validateString = (input, minLength = 1, maxLength = Number.MAX_SAFE_INTEGER) => {
  minLength = typeof(minLength) == 'number' && minLength > 0 ? minLength : 1;
  maxLength = typeof(maxLength) == 'number' && maxLength > 0 ? maxLength : Number.MAX_SAFE_INTEGER;

  if(typeof(input) != 'string'){
    return false
  } else {
    input = input.trim();
    return input.length >= minLength && input.length <= maxLength ? input : false;
  }
};

helpers.validateString = (input, possibleValues, defaultOutput = false) => {
  let result = typeof(input) == 'string' ? input.trim() : false;
  if(possibleValues instanceof Array && possibleValues != null){
    result = possibleValues.indexOf(result) > -1 ? result : false;
  }

  if(result == false){
    return defaultOutput;
  } else {
    return result;
  }
};

helpers.validateStringLength = (input, exactLength) => {
  if(typeof(exactLength) != 'number'){
    return false;
  }
  return typeof(input) == 'string' && input.trim().length == exactLength ? input.trim() : false;
}

helpers.validateEmail = (input) => {
	input = typeof(input) == 'string' ? input.trim() : false;
 	const regex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/;

	if (input && regex.test(String(input).toLowerCase())){
    return input;
	} else {
    return false;
  }
};

helpers.getBoolean = (input) => {
	return typeof(input) == 'boolean' ? input : false;
};

helpers.validateInteger = (input, minValue = false, maxValue = false) => {
	let result = typeof(input) == 'number' && input % 1 === 0 ? input : false;
	if (typeof(minValue) == 'number'){
		result = input >= minValue ? input : false;
  }
	if (typeof(maxValue) == 'number'){
  	result = input <= maxValue ? input : false;
  }
	return result;
};

helpers.validateObject = (input) => {
	return typeof(input) == 'object' && input != null ? input : false;
};

helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) == 'number'&& strLength > 0 ? strLength : false;
  if(strLength){
    let possibleCharacters = 'abcdefghijklmnoprstuvwxyz0123456789';
    let str = '';
    for(i = 1; i <= strLength; ++i){
      let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

helpers.hasAllProperties = (element, fields) => {
	if(fields == 'undefined' || fields == null){
		return false;
  }
	
	fields.forEach((field) => {
		if(!element.hasOwnProperty(field)){
			return false; 
    }
	});
	return true;
};

helpers.validatePizzas = (pizzaArray) => {
	// Check if array is valid
	let isValid = helpers.validateArrayAndFields(pizzaArray, ["id"]);
	if(!isValid){
		return false;
  }
	if(pizzaArray.length > config.maxOrderItems){
		return false;
  }

	var menu = helpers.getMenu();

	// Check if field values are valid
	pizzaArray.forEach(function(element) {
	    if(!menu.some(pizza => pizza.Id == element.id)){
	    	pizzaArray = false;
	    	return;
	    }
	    if (('amount' in element) && (element.amount < 1 || element.amount > config.maxAmountPerOrderItem)){
	    	pizzaArray = false;
	    	return;
	    }
	    if (!helpers.validateInteger(element.amount)){
	    	element.amount = 1;
      }
	});

	return pizzaArray;
};


// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for(i = 1; i <= strLength; i++){
      // Get a random character from the possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)); 
      // Append this character to the final string
      str += randomCharacter;
    }

      // Return string
      return str;
  } else {
    return false;
  }
}

module.exports = helpers;