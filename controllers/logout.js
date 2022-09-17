const {Login} = require('../models/index');
const router = require('express').Router();

router.put('/', async (req, res, next) => {
  // On client, also delete the accessToken
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  try {
    // Is refreshToken in db?
    const foundUser = await Login.findOne({where:{refreshToken: refreshToken}});
    if (!foundUser) {
      res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
      return res.sendStatus(204);
    }

    // Delete refreshToken in db
    console.log('userrrr::', foundUser);
    await Login.update({refreshToken: null},{
      omitNull: false,
      where:{
        id: foundUser.id
      }
    });
  } catch (error) {
    return next(error);
  }
  
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.sendStatus(204);
})

module.exports = router;