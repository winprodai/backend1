const sgMail = require('@sendgrid/mail');
const config = require('./index');

sgMail.setApiKey(config.sendgrid.apiKey);

module.exports = sgMail;