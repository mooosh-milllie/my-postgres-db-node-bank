const router = require('express').Router();
const {Customers, AccountHistory, PendingTransactions} = require('../models/index');
const {changePasswordSchema, updateProfilePicture} = require('../helpers/formValidator');
const { cloudinary } = require('../utils/cloudinary');


router.get('/home', async(req, res, next) => {
  const id = req.refId;
  try {
    const currentCustomer = await Customers.findOne({where:{id: id},
      include: {
        model: AccountHistory,
        limit: 2,
        order: [ [ 'createdAt', 'DESC' ]]
      },
      attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'accountNumber', 'fullName', 'accountType', 'accountStatus', 'availableBalance', 'currentBalance']
    });
    res.status(200).send(currentCustomer);
  } catch (error) {
    next(error);
  }
})

router.get('/account-history', async(req, res, next) => {
  const id = req.refId;

  try {
    const currentCustomer = await Customers.findOne({where:{id: id},
      attributes: {
      exclude: ['identityCard', 'createdAt', 'updatedAt']
      }
    })

    const accountHistory = await AccountHistory.findAll({
      where: {
        customerId: currentCustomer.id
      }
    })
    return res.status(200).send(accountHistory);
  } catch (error) {
    next(error);
  }
})

router.get('/pending-account-history', async(req, res, next) => {
  const id = req.refId;

  try {
    const currentCustomer = await Customers.findOne({where:{id: id},
      attributes: {
      exclude: ['identityCard', 'createdAt', 'updatedAt']
      }
    })

    const accountHistory = await PendingTransactions.findAll({
      where: {
        customerId: currentCustomer.id
      },
      attributes: ['transactionId', 'credit', 'debit', 'description', 'transactionStatus']
    })
    return res.status(200).send(accountHistory);
  } catch (error) {
    next(error);
  }
})

router.get('/profile', async(req, res, next) => {
  const id = req.refId;
  try {
    const {fullName, address, city, state, gender, title, maritalStatus, profilePicture} = await Customers.findOne({where:{id: id},
      attributes: {
      exclude: ['identityCard', 'createdAt', 'updatedAt']
    }});

    res.status(200).send({success: true, data: {
      fullName,
      address,
      city,
      state,
      gender,
      title,
      maritalStatus,
      profilePicture
    }});
  } catch (error) {
    next(error);
  }
})

router.put('/change-password', async(req, res, next) => {
  const id = req.refId;

  try {
    const validatedPassword = await changePasswordSchema.validate(req.body);
    const currentCustomer = await Customers.update({password: validatedPassword.newPassword}, {
      where: {
        id: id,
        password: validatedPassword.oldPassword
      }
    });

    if (currentCustomer) {
      return res.status(200).send({success: true, message: 'PASSWORD UPDATED'});
    }
    return res.status(400).send({success: false, message: 'PASSWORD UPDATE FAILED'});   
  } catch (error) {
    next(error);
  }
})

router.put('/update-profile-picture', async(req, res, next) => {
  const id = req.refId;
  const validationResult = await updateProfilePicture.validate(req.body.profilePicture);
  const PROFILE_PIC = validationResult.profilePicture;

  try {
    const imageUrl = await cloudinary.uploader.upload(PROFILE_PIC.avatar, 
    { width: 250, height: 250, crop: "fill" });

    const currentCustomer = await Customers.update({profilePicture: imageUrl.secure_url}, {
      where: {
        id: id,
      }
    });
    if (currentCustomer) {
      return res.status(200).send({success: true, message: 'IMAGE UPLOADED'});
    }
  } catch (error) {
    next(error);
  }
})



module.exports = router;