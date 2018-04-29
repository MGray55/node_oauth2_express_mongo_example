const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model for OAuth2 authorization
 * Date is set by default for new entries to db
 */
const OAuthTokensSchema = new Schema({
  accessToken: { type: String },
  accessTokenExpiresOn: { type: Date },
  // `client` and `user` are required in multiple places, for example `getAccessToken()`
  clientId: { type: String },
  refreshToken: { type: String },
  refreshTokenExpiresOn: { type: Date },
  user : { type: Object },
  createdOn: {type: Date, default: Date.now}
});

// Export the model
module.exports = mongoose.model('OAuthTokens', OAuthTokensSchema);
