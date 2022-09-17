const router = require('express').Router();
const JWT = require('jsonwebtoken');
const CONFIG = require('../utils/config');
const sequelize = require('../utils/db');
const bcrypt = require('bcrypt');
const enrollmentMiddleware = require('../middleware/enrollmentToken');
const {loginSchema, otpJwtSchema, validateOtpSchema, forgotPasswordSchema, forgotPasswordChangeSchema} = require('../helpers/formValidator')
const {Login, CustomerLoginInfo, Customers} = require('../models/index');
const differenceInMinutes = require('date-fns/differenceInMinutes');
const { sendOtp, transporter, mailOptions } = require('../utils/emailHelpers');
const { validateCustomerDeviceInfo } = require('../utils/validateLoginDevice');
const { setSessionLimitCookie, setJwtLimitCookie, setVerifiedDeviceLimitCookie } = require('../utils/setAllCookieLimit');


router.post('/', async(req, res, next) => {
  try {
    let loginValidator = await loginSchema.validate(req.body);
    let existingUser = await Login.findOne({ where:{username: loginValidator.username }});
    
    if (!existingUser) {
      return res.status(401).send({
        success: false,
        message: 'INVALID CREDENTIALS'
      });
    }
    console.log(req.ipInfo);
    if (existingUser.loginDelay) {
      if (differenceInMinutes(new Date(), new Date(existingUser.loginDelay)) < 15) {
        return res.status(401).send({success: false, message: 'LOGIN DELAY ACTIVE', delayTime: existingUser.loginDelay});
      }
      existingUser.loginDelay = null;
      existingUser.loginAttempt = 0;
      existingUser.otpAttempt = 0;
      await existingUser.save();
    }

    const passwordCorrect = await bcrypt.compare(loginValidator.password, existingUser.password);
    if (!passwordCorrect) {
      existingUser.loginAttempt += 1;
      if (existingUser.loginAttempt > 2) {
        existingUser.loginDelay = new Date();
        await existingUser.save();
        return res.status(401).send({success: false, message: 'LOGIN DELAY ACTIVE', delayTime: existingUser.loginDelay});
      }
      await existingUser.save();
      return res.status(401).json({success: false, message: 'LOGIN NOT MATCH', loginAttempt: existingUser.loginAttempt });
    }
    const otpJwt = JWT.sign({
      user: existingUser.username,
      refId: existingUser.customerId,
      rememberMe: loginValidator.rememberMe
    }, CONFIG.OTP_TOKEN_SECRET, {expiresIn: '500s'});
    
    if (existingUser.loginAccess === 0) {
      return res.status(401).send({
        success: false,
        message: 'LOGIN REVOKED'
      });
    }
    if (existingUser.refreshToken) {
      let loginInfo = await CustomerLoginInfo.findAll({
        where: {
          loginId: existingUser.id,
        },
        limit: 1,
        order: [ [ 'createdAt', 'DESC' ]] 
      });

      if (!req.cookies?.verifiedDevice) {
        if (differenceInMinutes(new Date(), new Date(loginInfo.createdAt)) < 30) {
          return res.status(200).send({message: 'LOGGEDIN ANOTHER DEVICE'});
        }
  
        // Delete refreshToken in db
        await Login.update({refreshToken: null},{
          omitNull: false,
          where:{
            id: existingUser.id
          }
        });
        console.log("e reach here")
        return res.status(200).send({message: 'OTP REQUIRED', authToken: otpJwt});
      }
      // return await validateCustomerDeviceInfo(req, res, next, existingUser, otpJwt, loginValidator);
    }
    if (!req.cookies?.verifiedDevice) {
      return res.status(200).send({message: 'OTP REQUIRED', authToken: otpJwt});
    }
    return await validateCustomerDeviceInfo(req, res, next, existingUser, otpJwt, loginValidator);
  } catch (error) {
    return next(error);
  }
  
})
router.get('/:token', async (req, res, next) => {
  const token = req.params.token;
  const validateToken = await otpJwtSchema.validate({token: token});
  const verifyJWT = JWT.verify(validateToken.token, CONFIG.OTP_TOKEN_SECRET, );
  // console.log(verifyJWT)

  if (!verifyJWT) {
    return res.sendStatus(401);
  }
  const {refId} = verifyJWT;

  try {
    const existingUser = await Customers.findOne({
      where: {
        id: refId,
      },
      attributes: ['lastName', 'email', 'phoneNumber'],
    });
    if (!existingUser) {
      return res.sendStatus(403);
    }
    return res.status(200).send(existingUser);  
  } catch (error) {
    console.log(error);
    next(error);
  }
  
})
router.post('/request-otp/:token', async(req, res, next) => {
  const token = req.params.token;
  if (!req.body?.method || (req.body?.method !== 'EMAIL' && req.body?.method !== 'PHONE')) {
    return res.status(401).send({success: false, message: 'INVALID OTP METHOD'});
  }
  // console.log(token)
  try {
    const validateToken = await otpJwtSchema.validate({token: token});
  
    const verifyJWT = JWT.verify(validateToken.token, CONFIG.OTP_TOKEN_SECRET);
    if (!verifyJWT) {
      return res.sendStatus(401);
    }
    console.log(verifyJWT)
    const {user} = verifyJWT;
    const existingUser = await Login.findOne({
      where: {
        username: user
      }
    });
    if (!existingUser) {
      return res.sendStatus(401);
    }
    
    if(req.body.method === 'EMAIL') {
      const otpReceiver = await Customers.findOne({
        where: {
          id: existingUser.customerId
        },
        attributes: ['email']
      });

      const otpSent = await sendOtp(otpReceiver.email);
      if(!otpSent) return res.status(400).send({success: false, message: 'OTP NOT SENT, TRY AGAIN!'});
      existingUser.otp = otpSent.otp;
      await existingUser.save();
      const otpJwt = JWT.sign({
        user: existingUser.username,
        refId: existingUser.customerId,
        rememberMe: verifyJWT.rememberMe
      }, CONFIG.OTP_TOKEN_SECRET, {expiresIn: '600s'});
      res.cookie(
        'verifyOTP',
        otpJwt,
        { 
          httpOnly: true,
          sameSite: 'None', secure: true, maxAge: 1000 * 60 * 10
        }
      );
      return res.status(200).send({success: true, message: 'OTP SENT'});
    }  
  } catch (error) {
    next(error);
  }

})



router.post('/verify-otp', async(req, res, next) => {
  try {

    if (!req.cookies?.verifyOTP) {
      return res.status(400).send({success: false, message: 'COOKIE NOT FOUND'}); 
    }
    const authCookieJwt = JWT.verify(req.cookies.verifyOTP, CONFIG.OTP_TOKEN_SECRET);
    
    if (!authCookieJwt) {
      return res.status(400).send({success: false, message: 'JWT ERROR'});
    }
    const validateOtp = await validateOtpSchema.validate(req.body);
    let existingUser = await Login.findOne({ where:{username: authCookieJwt.user}});
    // console.log(existingUser)
    if (!existingUser) {
      return res.status(401).send({success: false, message: 'USER NOT FOUND'});
    }
    if (existingUser.loginDelay) {
      if (differenceInMinutes(new Date(), new Date(existingUser.loginDelay)) < 15) {
        return res.status(401).send({success: false, message: 'LOGIN DELAY ACTIVE', delayTime: existingUser.loginDelay});
      }
      existingUser.loginDelay = null;
      existingUser.otpAttempt = 0;
      await existingUser.save();
    }
    
    if (existingUser.otp !== validateOtp.otp ) {
      existingUser.otpAttempt += 1;
      if (existingUser.otpAttempt > 2) {
        existingUser.loginDelay = new Date();
        await existingUser.save();
        return res.status(401).send({success: false, message: 'LOGIN DELAY ACTIVE', delayTime: existingUser.loginDelay});
      }
      await existingUser.save();
      return res.status(401).send({success: false, message: 'INVALID OTP', otpAttempt: existingUser.otpAttempt});
    }

    const role = Object.values(JSON.parse(existingUser.role)).filter(Boolean);

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
    }
    const accessToken = JWT.sign(userToken, CONFIG.ACCESS_TOKEN_SECRET, {expiresIn: '3600s'});
    const deviceCookie = JWT.sign(deviceToken, CONFIG.DEVICE_TOKEN_SECRET, {expiresIn: '30d'});
    const refreshToken = JWT.sign(
      {username: existingUser.username},
      CONFIG.REFRESH_TOKEN_SECRET,
      {expiresIn: '1d'}
    );

    const result = await sequelize.transaction( async(t) => {
      await existingUser.createLogininfo({
        ipAddress: req.ipInfo.ip,
        city: req.ipInfo.city,
        country: req.ipInfo.country,
        region: req.ipInfo.region,
        ll: req.ipInfo.ll,
        deviceType: req.device.type
      }, {transaction: t});
      
      await Login.update({
        otp: null,
        refreshToken: refreshToken
      },
      {
        omitNull: false,
        where: {
          id: existingUser.id
        }
      }, {transaction: t});

      
      return true;
    })
    
    if (!result) {
      return res.status(500).send({success: false, message: 'UNABLE TO SET USER LOGIN'});
    }

    if (authCookieJwt.rememberMe === true) {
      setVerifiedDeviceLimitCookie(res, deviceCookie);
    }

    setSessionLimitCookie(res);

    setJwtLimitCookie(res, refreshToken);
    
    res.status(200).send({
      accessToken,
      user: existingUser.username
    });
  } catch (error) {
    next(error)
  }  
})

router.post('/forgot-password/check-details', async(req, res, next) => {
  try {
    const validateInput = await forgotPasswordSchema.validate(req.body);
    const registeredUser = await Customers.findOne({
      where: {
        pin: validateInput.pin,
        email: validateInput.email.toLowerCase(),
      }
    })
    if (!registeredUser) return res.sendStatus(401);
    const enrolledUser = await registeredUser.getLogin();
    console.log(enrolledUser)
    if (!enrolledUser) {
      return res.status(422).send({success: false, message: 'NOT ENROLLED'});
    }
    const userInfo = {
      fullName: registeredUser.fullName,
      email: registeredUser.email
    }
  
    const token = JWT.sign(userInfo, CONFIG.JWT_SECRET, {
      expiresIn: '3600s'
    });

    let emailSubject = 'Your Verification link';
    let emailBody = `
    <h3>Let's Finish this process, click the link below to complete your password reset process</h3>
    <a href='http://localhost:3000/forgot-password/change-password/${token}' target='_blank'>click here</a>
    <h4>Thank You for choosing Node Bank</h4>
    `; 
    let emailReceiver = registeredUser.email;
    
    await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'html')});

    return res.status(200).send({success: true, message: 'ENROLLMENT LINK SENT'});

  } catch (error) {
    return next(error);
  }
})

router.get('forgot-password/verify/:token', enrollmentMiddleware, (req, res) => {
  if (req.fullName && req.email) {
    return res.status(200).json({fullName: req.fullName, email: req.email});
  }
  console.log('Nawa O');
  return res.sendStatus(401);
})

router.put('/forgot-password/reset-pass/:token', enrollmentMiddleware, async(req, res, next) => {
  try {
    const validateInput = await forgotPasswordChangeSchema.validate(req.body);
    const hashedPassword = await bcrypt.hash(validateInput.password, CONFIG.BCRYPT_SALT);

    let existingUser = await Customers.findOne({where:{email: req.email}});
    const updatedLogin = await Login.update({
      password: hashedPassword
    },
    {
      where: {
        customerId: existingUser.id
      }
    });
    console.log(updatedLogin);
    if (updatedLogin[0] === 0) {
      return res.status(422).send({success: false, message: 'PASSWORD NOT CHANGED'})
    }
    return res.status(200).send({success: true, message: 'PASSWORD CHANGED'});
  } catch (error) {
    next(error);
  }
})



module.exports = router;