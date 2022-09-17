const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = require('express').Router();
const {Customers, Login} = require('../models/index');
const CONFIG = require('../utils/config');
const enrollmentMiddleware = require('../middleware/enrollmentToken');
const {enrollmentVerifySchema, enrollmentSchema} = require('../helpers/formValidator');
const { mailOptions, transporter } = require('../utils/emailHelpers');
const { Op } = require('sequelize');


router.get('/', (req, res) => {
  console.log(req.ip)
  console.log(req.headers['x-forwarded-for'])
  console.log(req.device.type)
  console.log(req.ipInfo);
  const deviceToken = {
    user: 'wilfndidi',
    deviceType: req.device.type,
    city: req.ipInfo.city,
    state: req.ipInfo.region,
  }

  const deviceCookie = JWT.sign(deviceToken, CONFIG.DEVICE_TOKEN_SECRET, {expiresIn: '30d'});

  res.cookie(
    'verifiedDevice',
    deviceCookie, 
    { 
      httpOnly: true,
      sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000
    }
  );
  res.send('Enroll Now')
})
router.post('/check', async (req, res, next) => {

  try {
    const validateInput = await enrollmentVerifySchema.validate(req.body);
    const registeredUser = await Customers.findOne({
      where: {
        pin: validateInput.pin,
        email: validateInput.email.toLowerCase(),
        lastName: {[Op.iLike]: validateInput.lastName}
      }
    })
    if (!registeredUser) return res.sendStatus(401);
    const enrolledUser = await registeredUser.getLogin();
    console.log(enrolledUser)
    if (enrolledUser) {
      return res.status(422).send({success: false, message: 'ALREADY ENROLLED'});
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
    <h3>Let's Finish this process, click the link below to complete the online banking enrollment process</h3>
    <a href='http://localhost:3000/enrollment/create-login/${token}' target='_blank'>click here</a>
    <h4>Thank You for choosing Node Bank</h4>
    `;
    let emailReceiver = registeredUser.email;
    
    await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'html')});

    return res.status(200).send({success: true, message: 'ENROLLMENT LINK SENT'});

  } catch (error) {
    return next(error);
  }
})

router.get('/verify/:token', enrollmentMiddleware, (req, res) => {
  if (req.fullName && req.email) {
    return res.status(200).json({fullName: req.fullName, email: req.email});
  }
  return res.sendStatus(401);
})

router.post('/create-login/:token', enrollmentMiddleware, async(req, res, next) => {
  try {
    const validateInput = await enrollmentSchema.validate(req.body);
    const hashedPassword = await bcrypt.hash(validateInput.password, CONFIG.BCRYPT_SALT);

    let user = await Customers.findOne({where:{email: req.email}});
    const alreadyEnrolled = await user.getLogin();
    if (alreadyEnrolled) {
      return res.status(422).send({success: false, message: 'ALREADY ENROLLED'});
    }
    await user.createLogin({username: validateInput.username, password: hashedPassword});

    return res.status(200).send({success: false, message: 'LOGIN CREATED'});

  } catch (error) {
    next(error);
  }
})

module.exports = router;