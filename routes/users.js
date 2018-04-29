const express = require('express');
const router = express.Router({});
const controller = require('../controllers/auth.server.controller');

/* POST - Register a new user */
router.post('/registerUser', controller.registerUser);

module.exports = router;
