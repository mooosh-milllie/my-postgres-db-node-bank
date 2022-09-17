const router = require('express').Router();
const JWT = require('jsonwebtoken');
const CONFIG = require('../utils/config');
const { Login }= require('../models/index');


router.get('/', async (req, res) => {

  const cookies = req.cookies;
  console.log("cookies:::",cookies);
    // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  
  const existingToken = await Login.findOne({ where:{ refreshToken }});

  if (!existingToken) return res.sendStatus(403); //Forbidden
  // evaluate JWT
  JWT.verify(
    refreshToken,
    CONFIG.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if (err || existingToken.username !== decoded.username) return res.sendStatus(403);
      const role = Object.values(JSON.parse(existingToken.role));
      const accessToken = JWT.sign(
          {
            username: decoded.username,
            id: existingToken.id,
            refId: existingToken.customerId,
            role: role
          },
          CONFIG.ACCESS_TOKEN_SECRET,
          { expiresIn: '1h' }
      );
      res.json({ accessToken })
    }
  );
})

module.exports = router;