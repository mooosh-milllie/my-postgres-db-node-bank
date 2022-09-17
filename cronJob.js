const cron = require('node-cron');
const {Customers} = require('./models/index');
const {Op} = require('sequelize');
const { transporter, mailOptions } = require('./utils/emailHelpers');
const { getMonth } = require('date-fns');
const path = require('path');

const valid = cron.validate('0 0 * * *');
console.log(valid);
// const task = cron.schedule('18 18 9 1-12 1-6', async() => {
const task = cron.schedule('0 7 1 * *', async() => {
  let TODAY = new Date();
  TODAY.setUTCHours(0,0,0,0);
  const MONTH = TODAY.getMonth();
  const MONTH_ARRAY = ['JANUARY', 'FEBUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  console.log('Today',TODAY.toISOString());
  const getActiveUsers = await Customers.findAll({where: {
      accountStatus: 'Active',
    },
    attributes: ['id', 'email', 'firstName']
  })
  // console.log(getActiveUsers);
  getActiveUsers.map(async (activeUsers) => {
    console.log(activeUsers.email);
    let emailSubject = 'New Month';

    let emailBody = `
    <h3>HNM ${activeUsers.firstName}</h3>
    <p> Wishing you a happy and productive new month, this ${MONTH_ARRAY[MONTH]}. Let's Win Together!</p>
    <h2>Node Bank</h2>
    `;
    let emailReceiver = activeUsers.email;
    try {
      await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'html')});
      console.log('DONE!!!')
    } catch (error) {
      console.log(error)
    }

  })
  console.log(getActiveUsers)
},
{
  scheduled: true,
  timezone: 'Africa/Lagos'
}
);

module.exports = task;