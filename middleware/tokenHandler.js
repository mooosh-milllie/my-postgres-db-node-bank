const JWT = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Login } = require('../models/index');
const CONFIG = require('../utils/config');
const { setSessionLimitCookie } = require('../utils/setAllCookieLimit');
const {logoutHelper} = require('../helpers/logoutHelper')

const tokenExtractor = async(req, res, next) => {
  const authorization = req.headers.authorization || req.headers.Authorization;
  // console.log('All Session', req.session.cookie)
  if (!req?.cookies?.isAuth) {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(403).send({success: false, message: 'SESSION TIMEOUT'}); //Forbidden
    const refreshToken = cookies.jwt;
    const foundUser = await Login.findOne({where:{refreshToken: refreshToken}});
    await logoutHelper(foundUser);

    return res.status(403).send({success: false, message: 'SESSION TIMEOUT'});
  }
  
  
  if (authorization?.startsWith('Bearer ')) {
    JWT.verify(
      authorization.substring(7),
      CONFIG.ACCESS_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {console.log(err); return res.sendStatus(403)}
        const loggedIn = await Login.findOne({
          where: {
            id: decoded.id,
            refreshToken: {
              [Op.ne]: null
            }
          }
        })
        // console.log(loggedIn);
        if (!loggedIn) {
          return res.sendStatus(403).send({success: false, message: 'LOGGED OUT'});
        }
        setSessionLimitCookie(res);
        req.id = decoded.id;
        req.refId = decoded.refId;
        req.username = decoded.username;
        req.roles = decoded.role;
        next();
      }
    )
    return;
  }
  res.sendStatus(401);
}

module.exports = tokenExtractor;