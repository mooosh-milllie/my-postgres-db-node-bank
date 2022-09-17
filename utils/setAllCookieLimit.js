const setSessionLimitCookie = (res) => {
  return res.cookie(
    'isAuth',
    {isAuth: true}, 
    {
      httpOnly: true,
      sameSite: 'None', secure: true, maxAge: 1000 * 60 * 15
    }
  );
}

const setJwtLimitCookie = (res, refreshToken) => {
  return res.cookie(
    'jwt',
    refreshToken, 
    { 
      httpOnly: true,
      sameSite: 'None', secure: true, maxAge: 1000 * 60 * 60 * 24
    }
  );
}

const setVerifiedDeviceLimitCookie = (res, deviceCookie) => {
  return res.cookie(
    'verifiedDevice',
    deviceCookie, 
    { 
      httpOnly: true,
      sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 * 30
    }
  );
}


module.exports = {
  setSessionLimitCookie,
  setJwtLimitCookie,
  setVerifiedDeviceLimitCookie
}