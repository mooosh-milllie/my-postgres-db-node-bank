const {Model, DataTypes} = require('sequelize');
const sequelize = require('../utils/db');

class Customers extends Model {};

Customers.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull:true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull:false
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(value) {
      throw new Error('Do not try to set the `fullName` value!');
    }
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull:false
  },
  state: {
    type: DataTypes.STRING,
    allowNull:false
  },
  socialSecurity: {
    type: DataTypes.CHAR,
    unique: true,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING,
    allowNull:false
  },
  maritalStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountNumber: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique:true,
    validate: {
      isNumberOfDigits(value) {
        if (String(value).length < 10 || String(value).length > 10) {
          throw new Error('Pin digits should not be below 4 or above 6');
        }
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountType: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  occupation: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  employer: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  identityCard: {
    type: DataTypes.CHAR,
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.CHAR,
    allowNull: false,
    defaultValue: 'https://res.cloudinary.com/lordflames/image/upload/v1654516454/blank-profile-picture_dg8szo.png'
  },
  pin: {
    allowNull: false,
    type: DataTypes.INTEGER,
    defaultValue: Math.floor(100000 + Math.random() * 900000),
    validate: {
      isNumberOfDigits(value) {
        if (String(value).length < 4 || String(value).length > 7) {
          throw new Error('Pin digits should not be below 4 or above 6');
        }
      }
    }
  },
  accountStatus: {
    allowNull: false,
    type: DataTypes.STRING,
    defaultValue: "Active",
  },
  availableBalance: {
    allowNull: false,
    type: DataTypes.DOUBLE,
    defaultValue: 10000
  },
  currentBalance: {
    allowNull: false,
    type: DataTypes.DOUBLE,
    defaultValue: 10000
  }
}, {
  sequelize,
  underscored: false,
  timestamps: true,
  modelName: 'customers'
})


module.exports = Customers;