const router = require('express').Router();
const { Op } = require("sequelize");
const sequelize = require('../utils/db')
const ibanTools = require('ibantools');
const { sameBankTransferSchema, domesticWireTransferSchema, internationalWireTransferSchema, billpayTransferSchema } = require('../helpers/formValidator');
const { validateRoutingNumber } = require('../helpers/validateRoutingNum');
const {Customers, AccountHistory, PendingTransactions} = require('../models/index');
const { calculateAvailableAndCurrentBalance } = require('../utils/calculateAvailableAndCurrentBalance');

const TRANSACTION_TYPE = {
  credit: 'credit',
  debit: 'debit'
}
const TRANSFER_TYPE = {
  billpay: 'billpay',
  domesticWire: 'domesticWire',
  internationalWire: 'internationalWire',
  neft: 'NEFT'
}

const WIRE_FEE = 30;

router.post('/internal/neft', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await sameBankTransferSchema.validate(req.body);
  // NEFT (National Electronic Fund Transfer)
  if (transferValidation.transferType === TRANSFER_TYPE.neft) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, transactionAmount, TRANSACTION_TYPE.debit );
      console.log(getSenderNewBalance);
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const verifyReceiver = await Customers.findOne({
        where: {
          accountNumber: transferValidation.accountNumber,
          accountStatus: {
            [Op.ne]: 'closed'
          }
        },
      })
      if (!verifyReceiver) {
        return res.status(400).send({success: false, message: 'ACCOUNT NUMBER INVALID'});
      }
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createAccounthistory({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: 'Node Bank',
          senderOrReceiver: `name: ${verifyReceiver.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.localTransCode,
          debit: transferValidation.amount,
          availableBalance: getSenderNewBalance.newAvailableBalance,
          currentBalance: getSenderNewBalance.newCurrentBalance
        },{transaction: t});
        
        await Customers.update({
          availableBalance: getSenderNewBalance.newAvailableBalance,
          currentBalance: getSenderNewBalance.newCurrentBalance
        }, {
          where: {
            id: currentCustomer.id
          }
        }), {transaction: t}

        const getReceiverNewBalance = calculateAvailableAndCurrentBalance(verifyReceiver, transactionAmount, TRANSACTION_TYPE.credit );
  
        await verifyReceiver.createAccounthistory({
          transactionType: 'credit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: 'Node Bank',
          senderOrReceiver: `name: ${currentCustomer.fullName} \n acct: ${currentCustomer.accountNumber}`,
          credit: transactionAmount,
          availableBalance: getReceiverNewBalance.newAvailableBalance,
          currentBalance: getReceiverNewBalance.newCurrentBalance
        }, {transaction: t})

        await Customers.update({
          availableBalance: getReceiverNewBalance.newAvailableBalance,
          currentBalance: getReceiverNewBalance.newCurrentBalance
        }, {
          where: {
            id: verifyReceiver.id
          }
        })
        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      console.log(error);
    }
  }
})

router.post('/internal/domestic-wire', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await domesticWireTransferSchema.validate(req.body);
  
  if (transferValidation.transferType === TRANSFER_TYPE.domesticWire) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount;
      const totalTransactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, totalTransactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const verifyReceiver = await Customers.findOne({
        where: {
          accountNumber: transferValidation.accountNumber,
          accountStatus: {
            [Op.ne]: 'closed'
          }
        },
      })
      if (!verifyReceiver) {
        return res.status(400).send({success: false, message: 'ACCOUNT NUMBER INVALID'});
      }
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createAccounthistory({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: 'Node Bank',
          senderOrReceiver: `name: ${verifyReceiver.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          debit: transferValidation.amount,
          address: `${transferValidation.address}, \n ${transferValidation.city}, ${transferValidation.state}, \n ${transferValidation.zipCode}`,
          availableBalance: getSenderNewBalance.newAvailableBalance,
          currentBalance: getSenderNewBalance.newCurrentBalance
        },{transaction: t});
        
        await Customers.update({
          availableBalance: getSenderNewBalance.newAvailableBalance,
          currentBalance: getSenderNewBalance.newCurrentBalance
        }, {
          where: {
            id: currentCustomer.id
          }
        }, {transaction: t})

        const getReceiverNewBalance = calculateAvailableAndCurrentBalance(verifyReceiver, transactionAmount, TRANSACTION_TYPE.credit );
  
        await verifyReceiver.createAccounthistory({
          transactionType: 'credit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: 'Node Bank',
          senderOrReceiver: `name: ${currentCustomer.fullName} \n acct: ${currentCustomer.accountNumber}`,
          credit: transactionAmount,
          availableBalance: getReceiverNewBalance.newAvailableBalance,
          currentBalance: getReceiverNewBalance.newCurrentBalance
        }, {transaction: t})

        await Customers.update({
          availableBalance: getReceiverNewBalance.newAvailableBalance,
          currentBalance: getReceiverNewBalance.newCurrentBalance
        }, {
          where: {
            id: verifyReceiver.id
          }
        })
        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})

router.post('/local/domestic-wire', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await domesticWireTransferSchema.validate(req.body);

  if (transferValidation.transferType === TRANSFER_TYPE.domesticWire) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const totalTransactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, totalTransactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const bankInfo = await validateRoutingNumber(transferValidation.routingNumber)
      
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: bankInfo.customer_name,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          debit: transferValidation.amount,
          address: `${transferValidation.address}, \n ${transferValidation.city}, ${transferValidation.state}, \n ${transferValidation.zipCode}`,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'processing'
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})

router.post('/local/billpay', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await billpayTransferSchema.validate(req.body);
  // NEFT (National Electronic Fund Transfer)
  if (transferValidation.transferType === TRANSFER_TYPE.billpay) {
    let d = new Date(transferValidation.schedule);
    d.setUTCHours(0,0,0,0);
    const transferSchedule = d.toISOString();
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, transactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }

      const bankInfo = await validateRoutingNumber(transferValidation.routingNumber)

      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: bankInfo.customer_name,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          debit: transferValidation.amount,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'pending',
          schedule: transferSchedule
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})

router.post('/international/international-wire', async (req, res, next) => {
  const id = req.refId;
  const transferValidation = await internationalWireTransferSchema.validate(req.body);

  if (transferValidation.transferType === TRANSFER_TYPE.internationalWire) {
    try {
      const currentCustomer = await Customers.findOne({where:{id: id},
        attributes: {
        exclude: ['identityCard', 'createdAt', 'updatedAt']
        }
      });
      const transactionAmount = transferValidation.amount + WIRE_FEE;
      const getSenderNewBalance = calculateAvailableAndCurrentBalance(currentCustomer, transactionAmount, TRANSACTION_TYPE.debit );
      if (getSenderNewBalance.newAvailableBalance <= 0  ) {
        return res.status(400).send({success: false, message: 'INSUFFICIENT FUNDS'});
      }
      const result = await sequelize.transaction(async (t) => {
        await currentCustomer.createPendingtransaction({
          transactionType: 'debit',
          transferType: transferValidation.transferType,
          description: transferValidation.description,
          institution: transferValidation.bankName,
          senderOrReceiver: `name: ${transferValidation.fullName} \n acct: ${transferValidation.accountNumber}`,
          bankIdentityNumber: transferValidation.routingNumber,
          swiftCode: transferValidation.swiftOrIban,
          debit: transferValidation.amount,
          address: `${transferValidation.address}, \n ${transferValidation.city}, ${transferValidation.state}, \n ${transferValidation.zipCode}`,
          availableBalance: currentCustomer.availableBalance,
          currentBalance: currentCustomer.currentBalance,
          transactionStatus: 'Processing'
        },{transaction: t});

        return true;
      })

      if (!result) {
        return res.status(500).send({success: false, message: 'TRANSACTION ERROR'})
      }
      return res.status(200).send({success: true, message: 'TRANSFER SENT'});
    } catch (error) {
      next(error);
    }
  }
})


module.exports = router;