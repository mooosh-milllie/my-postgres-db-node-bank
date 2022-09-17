const JWT = require('jsonwebtoken');
const CONFIG = require('../utils/config');

const tokenExtractor = (req, res, next) => {
  const authorization = req.params.token;
  if (authorization) {
    JWT.verify(
      authorization, 
      CONFIG.JWT_SECRET,
      (err, decoded) => {
        if (err) {return res.status(401).send({success: false, message: 'TOKEN EXPIRED'})}
        console.log("Decoded:::",decoded);
        req.fullName = decoded.fullName;
        req.email = decoded.email;
        next()
      }
    );
    return;
  }
  return res.sendStatus(401);
}

module.exports = tokenExtractor;