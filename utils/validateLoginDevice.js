const JWT = require('jsonwebtoken');
const {v4: uuid} = require('uuid');
const CONFIG = require('../utils/config');
const { setSessionLimitCookie, setJwtLimitCookie, setVerifiedDeviceLimitCookie } = require('./setAllCookieLimit');


async function validateCustomerDeviceInfo(req, res, next, existingUser, otpJwt, loginValidator) {
  const checkDeviceJwt = JWT.verify(req.cookies.verifiedDevice, CONFIG.DEVICE_TOKEN_SECRET);
  const role = Object.values(JSON.parse(existingUser.role)).filter(Boolean);

  const {user, city, state} = checkDeviceJwt;
  // console.log(city, user, state)
  console.log("Request",req.ipInfo)
  if (user !== existingUser.username || city !== req.ipInfo.city || state !== req.ipInfo.region) {
    return res.status(200).send({message: 'OTP REQUIRED', authToken: otpJwt});
  }

  const userToken = {
    user: existingUser.username,
    refId: existingUser.customerId,
    id: existingUser.id,
    role: role
  }

  const deviceToken = {
    user: existingUser.username,
    deviceType: req.device.type,
    city: req.ipInfo.city,
    state: req.ipInfo.region,
    // deviceId: uuid()
  }
  const accessToken = JWT.sign(userToken, CONFIG.ACCESS_TOKEN_SECRET, {expiresIn: '3600s'});
  const deviceCookie = JWT.sign(deviceToken, CONFIG.DEVICE_TOKEN_SECRET, {expiresIn: '30d'});
  const refreshToken = JWT.sign(
    {username: existingUser.username},
    CONFIG.REFRESH_TOKEN_SECRET,
    {expiresIn: '1d'}
  );

  try {
    existingUser.refreshToken = refreshToken;
    await existingUser.save();
    await existingUser.createLogininfo({
      ipAddress: req.ipInfo.ip,
      city: req.ipInfo.city,
      country: req.ipInfo.country,
      region: req.ipInfo.region,
      ll: req.ipInfo.ll,
      deviceType: req.device.type
    })
  } catch (error) {
    next(error)
  }

  setSessionLimitCookie(res);

  setJwtLimitCookie(res, refreshToken);

  if (loginValidator.rememberMe) {
    setVerifiedDeviceLimitCookie(res, deviceCookie);
  }
  
  res.status(200).send({
    accessToken,
    user: existingUser.username,
    role: existingUser.role,
  });
}

module.exports = {
  validateCustomerDeviceInfo
}