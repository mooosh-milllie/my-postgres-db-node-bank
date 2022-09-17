const yup = require('yup');
const differenceInYears = require('date-fns/differenceInYears');
const validator = require('validator/validator');


const registerationSchema = yup.object({
  firstName: yup.string().required(),
  middleName: yup.string(),
  lastName: yup.string().required(),
  dob: yup.string().required().test("dob", "Should be greater than 18", function (value) {
    return differenceInYears(new Date(), new Date(value)) >= 18;
  }),
  email: yup.string().email().required().test("is-valid", (message) => `${message.path} is invalid`, (value) => value ? validator.isEmail(value) : new yup.ValidationError("Invalid value")),
  address: yup.string().min(8).required(),
  city: yup.string().min(3).required(),
  state: yup.string().min(3).required(),
  gender: yup.string().min(4).required(),
  maritalStatus: yup.string().min(3).required(),
  socialSecurity: yup.string().min(9).max(9).required('Social security is required'),
  phoneNumber: yup.string().required().test("is-valid-number", (message) => `${message.path} is invalid`, (value) => value ? validator.isMobilePhone(value) : new yup.ValidationError("Invalid value")),
  accountType: yup.string().min(7).required(),
  branch: yup
  .string()
  .required('AccounType is required').test('isBranch', 'Not a rocgnised branch', 
  (branch) => {
    const BRANCH_LIST = ['sacramento', 'dallas', 'los angeles', 'washington', 'boston']
    return BRANCH_LIST.includes(branch);
  }),
  occupation: yup.string().min(2).required(),
  employer: yup.string(2).required(),
  identityCard: yup.object().test('IsImageSize', 'Omo upload Image na', 
  (identityCard) => {
    const MAXIMUM_SIZE = 3000000;
    let data = identityCard.idCard.replace(/^data:image\/\w+;base64,/, "");
    let stringLength = data.length;
    let stringInBytes = Math.ceil(stringLength/4) * 3 - 2;
    return stringInBytes <= MAXIMUM_SIZE;
  }).test('isImageType', 'Not Image Type', 
  (identityCard) => {
    const SUPPORTED_FORMATS = ["jpg", "jpeg", "png"];
    let extention = identityCard.idCard.split(';')[0].match(/jpeg|jpg|png/)[0];
    return SUPPORTED_FORMATS.includes(extention);
  })
})

const loginSchema = yup.object({
  username: yup.string().min(8).required(),
  password: yup.string().min(8).max(18).required(),
  rememberMe: yup.boolean().required()
})

const enrollmentSchema = yup.object({
  username: yup.string().min(8).required(),
  password: yup.string().min(8).required(),
  passwordTwo: yup.string().min(8).required().test('match', 
  'paswords do not match',
   function(passwordTwo) { 
     return passwordTwo === this.parent.password; 
   }),
})

const enrollmentVerifySchema = yup.object({
  lastName: yup.string().required(),
  email: yup.string().email().required().test("is-valid", (message) => `${message.path} is invalid`, 
  (value) => value ? validator.isEmail(value) : new yup.ValidationError("Invalid value")),
  pin: yup.number().required().test(
    "maxDigits",
    "number field must have minimum of 4 and maximum 6 digits",
    (pin) => pin.toString().length > 3 && pin.toString().length < 7
  ),
  lastFourDigitSSN: yup.number().required().test('isValidPin', 'Invalid Pin Length', 
  (lastFourDigitSSN) => {
    const ALLOWED_NUM_LENGTH = 4;
    return lastFourDigitSSN.toString().length === ALLOWED_NUM_LENGTH;
  })
})

// Change password from 

const changePasswordSchema = yup.object({
  oldPassword: yup.string().min(8).required(),
  newPassword: yup.string().min(8).required().test('isSecure', 'Password Requirements Failed', 
  function(password){
    let regex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return regex.test(password)
  }),
  verifyNewPassword: yup.string().min(8).required().test('match', 
  'paswords do not match',
   function(verifyNewPassword) {
     return verifyNewPassword === this.parent.newPassword;
   }),
})

// UPDATE PROFILE PICTURE
const updateProfilePicture = yup.object({
  profilePicture: yup.object().test('IsImageSize', 'LARGE FILE SIZE', 
  (profilePicture) => {
    const MAXIMUM_SIZE = 3000000;
    let data = profilePicture.avatar.replace(/^data:image\/\w+;base64,/, "");
    let stringLength = data.length;
    let stringInBytes = Math.ceil(stringLength/4) * 3 - 2;
    return stringInBytes <= MAXIMUM_SIZE;
  }).test('isImageType', 'NOT IMAGE TYPE', 
  (profilePicture) => {
    const SUPPORTED_FORMATS = ["jpg", "jpeg", "png"];
    let extention = profilePicture.avatar.split(';')[0].match(/jpeg|jpg|png/)[0];
    return SUPPORTED_FORMATS.includes(extention);
  })
})

// Handle transfer
const sameBankTransferSchema = yup.object({
  amount: yup.number().required().test('not less than or equal to', 'Amount should be greater than zero',
  function(amount) {
    return amount > 0;
  }),
  accountNumber: yup.number().required().test('Greater than three digits', 'Account number must be greater than 3 digits',
  function(accountNumber) {
    return String(accountNumber).length > 3 && String(accountNumber).length < 21;
  }),
  description: yup.string().required(),
  transferType: yup.string().min(3).required(),
})

const domesticWireTransferSchema = yup.object({
  fullName: yup.string().min(5).max(50).required(),
  amount: yup.number().required().test('not less than or equal to', 'Amount should be greater than zero',
  function(amount) {
    return amount > 0;
  }),
  accountNumber: yup.number().required().test('Greater than three digits', 'Account number must be greater than 3 digits',
  function(accountNumber) {
    return String(accountNumber).length > 3 && String(accountNumber).length < 21;
  }),
  description: yup.string().required(),
  transferType: yup.string().min(3).required(),
  routingNumber: yup.number().required().test('IsRouting', 'is not a routing number', 
  (routingNumber) => {
    const routingNumberLength = 9;
    return routingNumber.toString().length === routingNumberLength
  }),
  address: yup.string().required(),
  city: yup.string().required(),
  state: yup.string().required(),
  zipCode: yup.number().required().test('isZipCode', 'is not a recognized zip code', 
  (zipCode) => {
    const zipCodeLength = 5;
    return zipCode.toString().length === zipCodeLength;
  })
})
const internationalWireTransferSchema = yup.object({
  fullName: yup.string().min(4).required(),
  amount: yup.number().required().test('not less than or equal to', 'Amount should be greater than zero',
  function(amount) {
    return amount > 0;
  }),
  accountNumber: yup.number().required().test('Greater than three digits', 'Account number must be greater than 3 digits',
  function(accountNumber) {
    return String(accountNumber).length > 3 && String(accountNumber).length < 21;
  }),
  description: yup.string().required(),
  transferType: yup.string().min(3).required(),
  bankName: yup.string().min(5).required(),
  routingNumber: yup.number().required().test('IsRouting', 'is not a routing number', 
  (routingNumber) => {
    const routingNumberLength = 9;
    return routingNumber.toString().length === routingNumberLength;
  }),
  swiftOrIban: yup.string().required().test('IsRouting', 'is not a routing number', 
  (swiftOrIban) => {
    return validator.isIBAN(swiftOrIban) || validator.isBIC(swiftOrIban);
  }),
  address: yup.string().required(),
  city: yup.string().required(),
  state: yup.string().required(),
  zipCode: yup.number().required().test('isZipCode', 'is not a recognized zip code', 
  (zipCode) => {
    const zipCodeLength = 5;
    return zipCode.toString().length === zipCodeLength;
  })
})
const billpayTransferSchema = yup.object({
  fullName: yup.string().min(5).max(50).required(),
  amount: yup.number().required().test('not less than or equal to', 'Amount should be greater than zero',
  function(amount) {
    return amount > 0;
  }),
  accountNumber: yup.number().required().test('Greater than three digits', 'Account number must be greater than 3 digits',
  function(accountNumber) {
    return String(accountNumber).length > 3 && String(accountNumber).length < 21;
  }),
  routingNumber: yup.number().required().test('IsRouting', 'is not a routing number', 
  (routingNumber) => {
    const routingNumberLength = 9;
    return routingNumber.toString().length === routingNumberLength;
  }),
  description: yup.string().required(),
  transferType: yup.string().min(3).required(),
  schedule: yup.string().required()
})

const otpJwtSchema = yup.object({
  token: yup.string().test('isJwt', 'Token param is not a jwt',
  function (token) {
    return validator.isJWT(token);
  } )
})
const validateOtpSchema = yup.object({
  otp: yup.number().test('isOTP', 'Not OTP length',
  function (otp) {
    return otp.toString().length === 6;
  } )
})

const forgotPasswordChangeSchema = yup.object({
  password: yup.string().min(8).required(),
  passwordTwo: yup.string().min(8).required().test('match', 
  'paswords do not match',
   function(passwordTwo) { 
     return passwordTwo === this.parent.password; 
   }),
})

const forgotPasswordSchema = yup.object({
  pin: yup.number().required().test(
    "maxDigits",
    "number field must have minimum of 4 and maximum 6 digits",
    (pin) => pin.toString().length > 3 && pin.toString().length < 7
  ),
  email: yup.string().email().test('isEmail', 'Not Email', (email) => {
    return validator.isEmail(email);
  }),
  // username: yup.string().min(8).required()
})
module.exports = {
  registerationSchema,
  loginSchema,
  enrollmentSchema,
  enrollmentVerifySchema,
  changePasswordSchema,
  sameBankTransferSchema,
  domesticWireTransferSchema,
  internationalWireTransferSchema,
  billpayTransferSchema,
  otpJwtSchema,
  validateOtpSchema,
  updateProfilePicture,
  forgotPasswordSchema,
  forgotPasswordChangeSchema
}