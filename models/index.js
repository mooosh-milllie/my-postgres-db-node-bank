const Customers = require('./customer');
const Login = require('./login');
const AccountHistory = require('./accountHistory');
const PendingTransactions = require('./pendingTransactions');

const Admin = require('./admin');
const AdminCustomerHistory = require('./adminCustomerHistory');
const {DataTypes} = require('sequelize');
const CustomerLoginInfo = require('./customerLoginInfo');

Customers.hasOne(Login, {
  onDelete: 'CASCADE'
});
Login.belongsTo(Customers, {
  onDelete: 'CASCADE',
  foreignKey: {
    name: 'customerId'
  },
  type: DataTypes.UUID,
  allowNull: false,
  unique: true,
})

Customers.hasMany(AccountHistory, {
  onDelete: 'CASCADE',
});
AccountHistory.belongsTo(Customers, {
  onDelete: 'CASCADE',
});

Customers.hasMany(PendingTransactions, {
  onDelete: 'CASCADE',
});
PendingTransactions.belongsTo(Customers, {
  onDelete: 'CASCADE',
});

Login.hasMany(CustomerLoginInfo, {
  onDelete: 'CASCADE',
});
CustomerLoginInfo.belongsTo(Login, {
  onDelete: 'CASCADE',
});

// async function syncModels() {
//   try {
//     // await Login.sync({force: true});
//     // await CustomerLoginInfo.sync({force: true});
//     console.log(await CustomerLoginInfo.create({
//       ipAddress: '197.210.226.66',
//       city: 'Port Harcourt',
//       country: 'NG',
//       region: 'RI',
//       ll: [ 4.7774, 7.0134 ],
//       deviceType: 'Desktop'
//     }))
//   } catch (error) {
//     console.log(error)
//   }
  
// }
// syncModels();


// Customers.sync({force: true})
// Login.sync({force: true})
// CustomerLoginInfo.sync({force: true})
// AccountHistory.sync({force: true})
// PendingTransactions.sync({force: true});
// async function www(params) {
//   await AccountHistory.create({
//     transactionType: 'credit',
//     transferType: 'billpay',
//     description: 'Service payment',
//     credit: 10000,
//     senderOrReceiver: 474849302,
//     institution: 'Chase bank',
//     bankIdentityNumber: 849345674,
//     originOrDestination: 'local',
//     availableBalance: 10000,
//     currentBalance: 10000,
//     customerId: "b5b80beb-ce6e-4c5d-9dde-63b55d2fac25"
//   })
// }
// www()
// async function uc() {
//   Customers.update({
//     availableBalance: 10000,
//     currentBalance: 10000
//   },
//   {where: {
//     id: 'b5b80beb-ce6e-4c5d-9dde-63b55d2fac25'
//   }}
//   )
// }
// uc();
Admin.belongsToMany(Customers, {through: AdminCustomerHistory});
Customers.belongsToMany(Admin, {
  through: AdminCustomerHistory
})
// Admin.sync({force: true})

module.exports = {
  Customers, Login, AccountHistory, PendingTransactions, CustomerLoginInfo
}