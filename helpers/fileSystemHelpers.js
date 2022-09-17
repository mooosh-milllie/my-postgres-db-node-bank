const fs = require('fs');
const { logEvents } = require('../middleware/logEvent');

function saveFile(path, fileBuffer, next ) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, fileBuffer, (err) => {
      if (err) {
        next(err);
        logEvents(err, 'registerationErrors');
        return reject(false);
      }else {
        return resolve(true);
      }
    });
  })
}
function removeFile(path) {
  return new Promise((resolve) => {
    fs.rm(path, (err) => {
      if (err) {
        logEvents(err, 'registerationErrors')
      }
      return resolve(true)
    })
  })
}
module.exports = {
  removeFile, saveFile
}