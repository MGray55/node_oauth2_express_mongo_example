/**
 * @see /routes/restricted.js
 * If the POST request has a valid bearer token, then
 * this function will be called. (Access granted).
 */
exports.accessRestrictedArea = (req, res) => {
  res.send('You have gained access to the area')
};
