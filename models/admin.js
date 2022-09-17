const {Model, DataTypes} = require('sequelize');
const CONFIG = require('../utils/config');
const sequelize = require('../utils/db');
class Admin extends Model {};

Admin.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull:false,
    validate: {
      min: [8],
      max: [12]
    }
  },
  role: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  passPhrase: {
    type: DataTypes.VIRTUAL,
    set (val) {
      if (val === CONFIG.SUPER_ADMIN_PASS_PHRASE) {
        this.setDataValue('role', JSON.stringify({SUPER_ADMIN: 578372673}));
        return;
      }
      if (val === CONFIG.ADMIN_PASS_PHRASE){
        this.setDataValue('role', JSON.stringify({ADMIN: 390932673}));
        return;
      }
      throw new Error('Invalid pass-phrase received!');
    },
    validate: {
      isLongEnough (val) {
        if (val.length < 20) {
          throw new Error("Please supply a valid pass-phrase");
        }
      }
    }
  }
}, {
  sequelize,
  underscored: false,
  timestamps: true,
  modelName: 'admin'
})

module.exports = Admin;