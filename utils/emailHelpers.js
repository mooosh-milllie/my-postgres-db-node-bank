const CONFIG = require("./config");
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  port: CONFIG.EMAIL_PORT,    // true for 465, false for other ports
  host: CONFIG.EMAIL_HOST,
  auth: {
    user: CONFIG.EMAIL_USERNAME,
    pass: CONFIG.EMAIL_PASSWORD
  },
  secure: true,
});

function mailOptions(to, subject, body, bodyType, path ) {
  if (bodyType !== 'html' && bodyType !== 'text') {
    throw new Error('body type is undefined');
  }
 if (bodyType === 'text') {
  return {
    from: CONFIG.EMAIL_FROM_ENROLLMENT,
    to: to,
    subject: subject,
    text: body
  }
 }
 if (bodyType === 'html') {
  return {
    from: CONFIG.EMAIL_FROM_ENROLLMENT,
    to: to,
    subject: subject,
    html: body,
    attachments: [
      {
        filename: 'errorFile.txt',
        path: path
      }
    ],
  }
 }
}


async function sendOtp(emailReceiver) {
  let otp = Math.floor(100000 + Math.random() * 900000);
  let emailSubject = 'Your One-time-password';
  let emailBody = `Your OTP is ${otp} \n Please do not disclose this to a third party!`;

  try {
    const otpSent = await transporter.sendMail({...mailOptions(emailReceiver, emailSubject, emailBody, 'text')});
    if(otpSent.accepted.length < 1) throw new Error('OTP NOT SENT');

    return {otp: otp}; 
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  transporter,
  mailOptions,
  sendOtp
}