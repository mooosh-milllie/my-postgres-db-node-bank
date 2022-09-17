const { format } = require('date-fns');
const { v4: uuid } = require('uuid');

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (message, logName) => {
    const dateAndTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
    const logInfo = `${dateAndTime}\t${uuid()}\t${message}\n`;

    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'event_logs'))) {
          await fsPromises.mkdir(path.join(__dirname, '..', 'event_logs'));
        }

        await fsPromises.appendFile(path.join(__dirname, '..', 'event_logs', logName), logInfo);
    } catch (err) {
        console.log(err);
    }
}

const logger = (req, _, next) => {
    logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, 'reqLog.txt');
    console.log(`${req.method} ${req.path}`);
    next();
}

module.exports = { logger, logEvents };