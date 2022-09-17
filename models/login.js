const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');
class Login extends Model {};

Login.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull:true,
    validate: {
      min: [8],
      max: [12]
    }
  },
  refreshToken: {
    type: DataTypes.TEXT
  },
  role: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: JSON.stringify({USER: 200326738})
  },
  loginAttempt: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  otpAttempt: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  loginDelay: {
    type: DataTypes.DATE
  },
  loginAccess: {
    allowNull: false,
    type: DataTypes.BIGINT,
    defaultValue:  1111111111,
  },
  otp: {
    type: DataTypes.INTEGER,
  },
}, {
  sequelize,
  underscored: false,
  timestamps: true,
  modelName: 'login',
  freezeTableName: true,
})

module.exports = Login;