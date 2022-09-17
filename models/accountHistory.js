const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

class AccountHistory extends Model {};

AccountHistory.init({
  transactionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  transferType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bankIdentityNumber: {
    type: DataTypes.CHAR
  },
  description: {
    type: DataTypes.STRING,
    allowNull:true
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderOrReceiver: {
    type: DataTypes.CHAR,
  },
  institution: {
    type: DataTypes.STRING
  },
  credit: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  debit: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0
  },
  availableBalance: {
    allowNull: false,
    type: DataTypes.DOUBLE,
  },
  currentBalance: {
    allowNull: false,
    type: DataTypes.DOUBLE,
  },
  address: {
    type: DataTypes.CHAR
  },
  transactionStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'SUCCESSFUL'
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  underscored: false,
  timestamps: true,
  modelName: 'accounthistory',
  freezeTableName: true
})



module.exports = AccountHistory;
