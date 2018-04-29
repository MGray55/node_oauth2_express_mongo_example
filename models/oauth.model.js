const authController = require('../controllers/auth.server.controller');
const tokensModel = require('../models/oauth.tokens.model');
const usersModel = require('../models/oauth.users.model');
const clientsModel = require('../models/oauth.clients.model');

/**
 * Modified (and inspired) code from:
 * @see https://blog.cloudboost.io/how-to-make-an-oauth-2-server-with-node-js-a6db02dc2ce7
 */
const model = {
  /* This method returns the client application which is attempting to get the accessToken.
   The client is normally be found using the  clientID & clientSecret. However, with user facing client applications such
   as mobile apps or websites which use the password grantType we don't use the clientID or clientSecret in the authentication flow.
   Therefore, although the client  object is required by the library all of the client's fields can be  be null. This also
  includes the grants field. Note that we did, however, specify that we're using the password grantType when we made the
  oAuth object in the index.js file.

  The callback takes 2 parameters. The first parameter is an error of type falsey and the second is a client object.
  As we're not of retrieving the client using the clientID and clientSecret (as we're using the password grantType)
  we can just create an empty client with all null values.Because the client is a hardcoded object
   - as opposed to a client we've retrieved through another operation - we just pass false for the error parameter
    as no errors can occur due to the aforemtioned hardcoding */

  getClient: (clientId, clientSecret, callback) => {
    // An Object representing the client and associated data,
    // or a falsy value if no such client could be found.
    clientsModel.findOne({'client_id': clientId}).exec()
      .then((result) => {
        callback(false, result);
      }, (err) => {
        callback(err);
      });
  },

  getUser: (username, password, callback) => {
    //try and get the user using the user's credentials
    console.log('getUser() called and username is: ', username, ' and password is: ', password);
    return usersModel.findOne({
      'username': username,
      'password': password
    }).exec()
      .then((result) => {
        callback(false, result);
      }, (err) => {
        callback(err);
      });
  },

  /**
   * Determine if we should allow access using the provided grant type.
   *  @see https://oauth2-server.readthedocs.io/en/latest/misc/migrating-v2-to-v3.html
   * "grantTypeAllowed() was removed. You can instead:
   * Return falsy in your getClient()
   * Throw an error in your getClient()"
   */
  grantTypeAllowed: (clientID, grantType, callback) => {
    console.log('grantTypeAllowed called and clientID is: ', clientID, ' and grantType is: ', grantType);
    if (['refresh_token', 'password'].some(el => grantType.indexOf(el) > -1)) {
      callback(false, true);
      return;
    }
    callback(true);
  },


  /**
   * Saves the newly generated accessToken along with the userID retrieved the specified user
   * TODO - delete old tokens....
   * @param accessToken
   * @param clientId
   * @param expires
   * @param user
   * @param callback
   */
  saveAccessToken: (accessToken, clientId, expires, user, callback) => {
    authController.saveAccessToken(accessToken, clientId, expires, user)
      .then((result) => {
        callback(false, result);
      }, (err) => {
        callback(err);
      });
  },

  /**
   * https://oauth2-server.readthedocs.io/en/latest/model/spec.html#generateaccesstoken-client-user-scope-callback
   * generateAccessToken(client, user, scope, [callback])
   *
   * Invoked to generate a new access token.
   *
   * This model function is optional.
   * If not implemented, a default handler is used that generates access tokens
   * consisting of 40 characters in the range of a..z0..9.
   *
   * Invoked during:
   *    authorization_code grant
   *    client_credentials grant
   *    refresh_token grant
   *    password grant
   */
  getAccessToken: (bearerToken, callback) => {
    //try and get the userID from the db using the bearerToken
    return tokensModel.findOne({accessToken: bearerToken}).lean()
      .then((result) => {

        //create the token using the retrieved userID
        const accessToken = {
          user: {
            id: result.user.username,
          },
          expires: null
        };

        callback(null, accessToken);
      });
  },

  /**
   * When 'refresh_category' grant is used, a refresh token will be generated
   * at the same time as the initial access token.
   * This function will be called by the API
   * In this example, we are updating the refresh token along associated with the
   * access token.
   * TODO - delete old tokens....
   * @param refreshToken
   * @param clientId
   * @param expires
   * @param user
   * @param callback
   */
  saveRefreshToken: (refreshToken, clientId, expires, user, callback) => {
    console.log('saveRefreshToken called and clientID is: ', clientId);
    authController.getAccessTokenByClientId(clientId)
      .then((result) => {
          // Add the refresh token
          authController.updateRefreshToken(clientId, result.accessToken, refreshToken, expires)
            .then((result) => {
              callback(false, result);
            })
        },
        (err) => {
          callback(err);
        });
  },

  /**
   * Get refresh token (Optional)
   * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
   * This model function is required if the refresh_token grant is used.
   */
  getRefreshToken: (refreshToken, callback) => {
    tokensModel.findOne({refreshToken: refreshToken}).lean()
      .then((result) => {
        callback(false, result);
      }, (err) => {
        callback(err);
      });
  }
};

// Export the model
module.exports = model;
