const express = require('express');
const router = express.Router({});
const controller = require('../controllers/auth.server.controller');

module.exports = (expressApp) => {
  /* POST - Register a new user */
  router.post('/registerUser', controller.registerUser);

  /* POST - Get an access token with correct login credentials */
  router.post('/login', expressApp.oauth.grant());

  return router;
};
