const router = require('express').Router();
const {registerationSchema} = require('../helpers/formValidator');
const  CONFIG = require('../utils/config');
const {Customers, AccountHistory} = require('../models/index');
const { cloudinary } = require('../utils/cloudinary');
const { mailOptions, transporter } = require('../utils/emailHelpers');
const { Op } = require('sequelize');
const sequelize = require('../utils/db');
const { saveFile, removeFile } = require('../helpers/fileSystemHelpers');
const path = require('path');


router.post('/',  async (req, res, next) => {
  
  try {
    let validationResult = await registerationSchema.validate(req.body, {abortEarly: false});
    let dob = new Date(validationResult.dob);
    dob.setUTCHours(0,0,0,0);
    const formatedDOB = dob.toISOString();
    const checkExisting = Customers.findOne({
      where: {
        [Op.or]: [{email: validationResult.email}, {phoneNumber: validationResult.phoneNumber}, {socialSecurity: validationResult.socialSecurity}]
      }
    })
    if (checkExisting) {
      if (checkExisting.email === validationResult.email && checkExisting.phone === validationResult.phoneNumber && checkExisting.socialSecurity === validationResult.socialSecurity) {
        return res.status(400).send({success: false, message: 'ACCOUNT ALREADY EXISTS'})
      }
      if (checkExisting.email === validationResult.email && checkExisting.phone === validationResult.phoneNumber) {
        return res.status(400).send({success: false, message: 'EMAIL AND PHONE ALREADY EXISTS'})
      }
      if (checkExisting.email === validationResult.email) {
        return res.status(400).send({success: false, message: 'EMAIL ALREADY EXISTS'})
      }
      if (checkExisting.phone === validationResult.phoneNumber) {
        return res.status(400).send({success: false, message: 'PHONE NUMBER ALREADY EXISTS'})
      }
      if (checkExisting.socialSecurity === validationResult.socialSecurity) {
        return res.status(400).send({success: false, message: 'ACCOUNT ALREADY EXISTS'})
      }
    }
    const ID_CARD = validationResult.identityCard;
    // let data = ID_CARD.idCard.replace(/^data:image\/\w+;base64,/, "");
    // let buf = Buffer.from(data, 'base64');
    // let file = ID_CARD.name
    // let filePath = path.join(__dirname, '..', 'img', '/', file);
    // let savedFile = await saveFile(filePath, buf, next);
    // if (!savedFile) {
    //   res.status(500).send({success: false, message: 'FILE ERROR'})
    // }

    const imageUrl = await cloudinary.uploader.upload(ID_CARD, 
    { width: 400, height: 300, crop: "fill" });

    
    // // While loop to handle registeration of of new customers, until the account number generated is unique
    while (true) {
      // Generate account Number of 10 digts
      let accountNumberGenerator = Math.floor(1000000000 + Math.random() * 9000000000);
      const existingCustomer = await Customers.findOne({
        where:{ accountNumber: accountNumberGenerator}
      })
      // If a user does not exist with the unique details provided, a the customer is created
      if (!existingCustomer) {
        let transaction;
        try {
          transaction = await sequelize.transaction();
          const newCustomer = await Customers.create({
            ...validationResult, dob: formatedDOB, identityCard: imageUrl.secure_url, accountNumber: accountNumberGenerator
          }, transaction);
          await AccountHistory.create({
            transferType: 'VISA card payment',
            description: 'opening deposit',
            credit: 10000, debit: 0,
            transactionType: 'credit',
            currentBalance: 10000,
            availableBalance: 10000,
            institution: 'Regions Bank',
            senderOrReceiver: 'Self',
            customerId: newCustomer.id
          }, {transaction})
          await transaction.commit();
          if (newCustomer) {
            let emailSubject = 'Welcome to Node Bank';
            let emailBody = `
            <h1>Welcome to NodeBank</h1>
            <p> Your Account registration was successful, \n your account number is ${newCustomer.accountNumber} and pin is ${newCustomer.pin}</p>
            <p>Visit http://localhost:3000/enrollment/home to enroll for online banking, and bank on the go.</p>`;
            let emailReceiver = newCustomer.email;
            await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'html')});
            break;
          }
        } catch (error) {
          await transaction.rollback();
        }
      }
    }
    // await removeFile(path);
    return res.status(200).send({success: true, message: 'ACCOUNT CREATED'});
  } catch (error) {
    console.log(error)
    return next(error)
  }
})

module.exports = router;