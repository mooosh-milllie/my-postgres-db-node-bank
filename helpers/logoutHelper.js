const {Login} = require('../models/index');

const logoutHelper = async(foundUser) => {
    
  const removeRefreshToken =  await Login.update({refreshToken: null},
    {
      omitNull: false,
      where:{
        id: foundUser.id
      }
    }
  );
  if (removeRefreshToken[0] === 1) {
    return true
  }

  return false
}

module.exports = {
  logoutHelper
}