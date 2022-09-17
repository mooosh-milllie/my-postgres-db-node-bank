const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');
class CustomerLoginInfo extends Model {};

CustomerLoginInfo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: false
  },
  city: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  region: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  country: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  ll: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: false
  },
  deviceType: {
    type: DataTypes.CHAR,
    allowNull: false
  }
},{
  sequelize,
  timestamps: true,
  modelName: 'logininfo',
  underscored: false,
  freezeTableName: true,
})

module.exports = CustomerLoginInfo