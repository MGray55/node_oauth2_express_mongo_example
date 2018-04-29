const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model for OAuth2 authorization
 * Date is set by default for new entries to db
 */
const OAuthClientsSchema = new Schema({
  client_id: { type: String, required: true},
  client_secret: { type: String, required: true },
  createdOn: {type: Date, default: Date.now}
});

// Export the model
module.exports = mongoose.model('OAuthClients', OAuthClientsSchema);

