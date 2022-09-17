const express = require('express');
const app = express();
const cors = require('cors')
require('express-async-errors');
const expressIP = require('express-ip');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');

const tokenExtractor = require('./middleware/tokenHandler');
const credentials = require('./middleware/credentials')
const corsOptions = require('./utils/corsOptions');
const logoutRouter = require('./controllers/logout');
const registerRouter = require('./controllers/register');
const enrollmentRouter = require('./controllers/enrollment');
const loginRouter = require('./controllers/login');
const refreshRouter = require('./controllers/refreshToken');

const customerRouter = require('./controllers/customers');
const transactionRouter = require('./controllers/transactions');
const {errorHandler} = require('./middleware/errorHandler');
const path = require('path');
const device = require('express-device');
const { ROLES_LIST } = require('./utils/roles');
const { verifyRoles } = require('./middleware/verifyRoles');

app.set('trust proxy', true)

app.use(credentials);
app.use(cors(corsOptions));
app.use(expressIP().getIpInfoMiddleware);
app.use(device.capture());
app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));

app.use(fileUpload());
app.use(cookieParser());
app.use(express.static('build'));


app.use('/api/v1/register', registerRouter);
app.use('/api/v1/enrollment', enrollmentRouter);
app.use('/api/v1/login', loginRouter);
app.use('/api/v1/refresh', refreshRouter);
app.use('/api/v1/logout', logoutRouter);

app.use(tokenExtractor);
app.use('/api/v1/customers', verifyRoles(ROLES_LIST.USER), customerRouter);
app.use('/api/v1/transfer-funds', verifyRoles(ROLES_LIST.USER), transactionRouter)
app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ "error": "404 Not Found" });
  } else {
    res.type('txt').send("404 Not Found");
  }
});

app.use(errorHandler);
module.exports = app;