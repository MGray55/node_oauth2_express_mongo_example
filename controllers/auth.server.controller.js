const chalk = require('chalk');
const isString = require('lodash/isString');
const authModel = require('../models/oauth.tokens.model');
const userController = require('../controllers/user.server.controller');

/**
 * Performs two functions,
 * 1) Check for existence of user in db
 * 2) Create a new entry for user if no previous entry exists
 * @return {Promise}
 */
exports.registerUser = (req, res, err) => {
  //get the username and password:
  const username = req.body.username;
  const password = req.body.password;

  //validate the request
  if (!isString(username) || !isString(password)) {
    console.log(chalk.red('Invalid or missing credentials'));
    sendResponse(res, 'Invalid or missing credentials', true);
  }

  console.log(`authRoutesMethods: registerUser: req.body is:`, req.body);
  // Check to see if a record exists for this user in the db already
  // This is an asynchronous call that will return a promise
  userController.getUserByName(username)
    .then((user) => {
      if (user) {
        // If 'yes', send a response that the user could not be added
        console.log(chalk.yellow('User is already registered'));
        sendResponse(res, 'User is already registered', true);
        return;
      }
      // If 'no', register the user in the db, and wait for the async response
      userController.registerUserInDB(req.body.username, req.body.password)
        .then((result) => {
          console.log(chalk.blue(`User registration was successful ${result}` + result));
           sendResponse(res, 'User registration was successful', false);
        }, (error) => {
          console.log(chalk.red('Failed to register user', error));
          sendResponse(error, 'Failed to register user', true);
        });
    })
    .catch((error) => {
      console.log(chalk.red(`Failed to register user: ${username}`));
      return sendResponse(error, `Failed to register user: ${username}`, true);
    });
};

/**
 * CREATE - Persist an access token for this user.
 * The API will need to validate this token by reading from db
 * on new requests
 * @param accessToken
 * @param userID
 * @return {Promise}
 */
exports.saveAccessToken = (accessToken, clientId, expires, user) => {
  const entry = new authModel({
    'accessToken': accessToken,
    'clientId': clientId,
    'accessTokenExpiresOn': expires,
    'user': user
  });
  return entry.save();
};

/**
 * Lookup the provided bearer token
 * Return control to the node-oauth2-server api with the callback
 * @param accessToken
 * @param callback
 */
exports.getAccessToken = (accessToken, callback) => {
  return authModel.findOne({'access_token': accessToken}).exec()
    .then((result) => {
      callback(false, result);
      return result;
    }, (error) => {
      callback(error, null);
      return sendResponse(error, 'Failed to lookup access token', true);
    }) ;
};


/**
 * READ - Lookup the user by name AND the password
 * @return {Promise}
 */
exports.getAccessTokenByClientId = (clientId) => {
  return authModel.findOne({'clientId': clientId}).sort('-accessTokenExpiresOn').exec();
};

exports.updateRefreshToken = (clientId, accessToken, refreshToken, refreshTokenExpiresOn) => {
  const query = {'clientId': clientId, 'accessToken' : accessToken};
  return authModel.findOneAndUpdate(query, {
    'refreshToken': refreshToken,
    'refreshTokenExpiresOn': refreshTokenExpiresOn
  });
};

/**
* Sends a response created out of the specified parameters to the client.
*
* @param res - HTTP Response to respond to client
* @param message - message to send to the client
* @param error - error to send to the client
*/
function sendResponse(res, message, error) {

  /* Here e create the status code to send to the client depending on whether
  or not the error being passed in is null. Then, we create and send
  the json object response to the client */
  res
    .status(error != null ? 200 : 400)
    .json({
      'message': message,
      'error': error,
    })
}
