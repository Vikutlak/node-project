/*
  Worker-related tasks
*/

// Dependencies
const util = require('util');
const debug = util.debuglog('workers');
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Instantiate the worker object
const workers = {};

// Init script
workers.init = () => {

  // Send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

  // Delete expired tokens
  workers.deleteExpiredFiles();
};

workers.deleteExpiredFiles = () => {
  workers.gatherAll = (config.tokensFolder, "expires", (date) => {
    return (date && date <= Date.now()) ? true : false;
  });
};

// Deleting files based on expiration date
workers.loop = () => {
  setInterval(() => {
    workers.deleteExpiredFiles();
  }, config.workersLoopTime);
};

// Lookup files and send to validator
workers.gatherAll = (folder, fieldToValidate, validationFunction) => {
  // Get files in folder
  _data.list(folder, (err, fileNames) => {
    if(!err && fileNames && fileNames.length > 0){
      fileNames.forEach((fileName) => {
        // Remove all expired files
        if(!eerr && data){
          workers.validateData(folder, fileName, data, fieldToValidate, validationFunction);
        } else if(config.showMessagesInCommandLine){
          console.log("Error reading from file: " + fileName);
        }
      });
    } else {
      console.log("Error: Could not gather files");
    }
  });
};

workers.validateData = (folder, fileName, data, fieldToValidate, validationFunction) => {
  data = helpers.validateObject(data);
  const fieldValue = data[fieldToValidate];

  if(config.showMessagesInCommandLine){
    console.log(`Field value as date: ${new Date(fieldValue).toString()}`);
    console.log(`File ${fileName} should be deleted: ${validationFunction(fieldValue)}`);
  }

  // If orderDate is invalid or is over it's lifespan, delete
  // If token 'expires' is expired, delete
  if(fieldValue == null || validationFunction(fieldValue)){
    _data.delete(folder, fileName, (err) => {
      if (!err) {
        if (config.showMessagesInCommandLine){
          console.log("Successfully deleted file by workers: " + fileName)
        };
      } else {
        if (config.showMessagesInCommandLine){
          console.log("Error deleting one of files by workers.")
        };
      }
    });
  }
};

// Export the module
module.exports = workers;