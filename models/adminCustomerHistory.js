const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');
class AdminCustomerHistory extends Model {};


AdminCustomerHistory.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  adminAction: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  timestamps: true,
  modelName: 'admin_customer_history'
})

module.exports = AdminCustomerHistory;