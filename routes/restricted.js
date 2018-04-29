const express = require('express');
const router = express.Router({});
const controller = require('../controllers/restricted.server.controller');

/** Injecting a reference to the Express App, so this route
 * has access to the Node-OAuth2-Server configuration.
 * @param expressApp - Instance of running express app
 */
module.exports = (expressApp) => {
  /* POST - Try to access the restricted area */
  router.post('/restrict', expressApp.oauth.authorise(), controller.accessRestrictedArea);
  return router;
};
