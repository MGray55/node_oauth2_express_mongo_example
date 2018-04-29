const createError = require('http-errors');
const express = require('express');
const app = express();
const oAuth2Server = require('node-oauth2-server');
const oAuthModel = require('./models/oauth.model');
const chalk = require('chalk');

app.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password', 'refresh_token'],
  debug: true // This you may want to set up with an ENV var for production
});

/* Setup the oAuth error handling */
app.use(app.oauth.errorHandler());

const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
// Route files...
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth')(app);
const restrictedRouter = require('./routes/restricted')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
/*
  Set the bodyParser to parse the urlencoded post data
  The extended option allows to choose between parsing the URL-encoded data
  with the querystring library (when false) or the qs library (when true).
  The "extended" syntax allows for rich objects and arrays to be encoded
  into the URL-encoded format, allowing for a JSON-like experience with URL-encoded.
  For more information, please see the qs library.
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

//Map routes to Express HTTP paths
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/restricted', restrictedRouter);

// Mongoose connection:
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.YOUR_MONGO_CONNECTION_DETAILS_HERE}`);
const db = mongoose.connection;
db.on('open', function () {
  console.log(chalk.green('Mongoose connection open'));
}).catch((err) => {
  console.log(chalk.red(`${err} Error connecting to db`));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
