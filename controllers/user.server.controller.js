const userModel = require('../models/oauth.users.model');

/**
 * READ - Search for the existence of this user in db
 * @return {Promise}
 */
exports.getUserByName = (username) => {
  return userModel.findOne({'username': username}).exec();
};

/**
 * CREATE - insert a new user record
 * @return {Promise}
 */
exports.registerUserInDB = (username, password) =>{
  const entry = new userModel({
    username: username,
    password: password,
  });
  return entry.save();
};
