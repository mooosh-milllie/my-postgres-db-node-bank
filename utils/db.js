const {Sequelize} = require('sequelize');
const CONFIG = require('./config');


// const sequelize = new Sequelize(CONFIG.DATABASE, CONFIG.USER, CONFIG.PASSWORD, {
//   host: CONFIG.HOST,
//   port: CONFIG.DATABASE_PORT,
//   dialect: 'postgres',
//   logging: false,
//   sync: true
// })
const sequelize = new Sequelize(CONFIG.DATABASE_URL,{
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});




module.exports = sequelize;