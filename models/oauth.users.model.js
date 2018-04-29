const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model for OAuth2 authorization
 * Date is set by default for new entries to db
 */
const OAuthUsersSchema = new Schema({
  // email: { type: String, default: '' },
  // firstname: { type: String },
  // lastname: { type: String },
  password: { type: String },
  username: { type: String },
  createdOn: {type: Date, default: Date.now}
});

// Export the model
module.exports = mongoose.model('OAuthUsers', OAuthUsersSchema);
