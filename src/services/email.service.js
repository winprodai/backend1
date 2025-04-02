const sgMail = require('../config/sendgrid');
const config = require('../config');
const { formatDate, formatCurrency } = require('../utils/helpers');

const sendWelcomeEmail = async (email, name) => {
  const msg = {
    to: email,
    from: config.sendgrid.fromEmail,
    subject: `Welcome to ${config.appName}!`,
    text: `Hi ${name},\n\nWelcome to ${config.appName}! We're excited to have you on board.`,
    html: `<strong>Hi ${name},</strong><br><br>Welcome to ${config.appName}! We're excited to have you on board.`,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

const sendTransactionEmail = async (email, name, amount, plan, ) => {
  // const formattedAmount = formatCurrency(amount);
  const formattedDate = formatDate(new Date());
  
  const msg = {
    to: email,
    from: config.sendgrid.fromEmail,
    subject: `Your ${config.appName} Transaction Receipt`,
    text: `Hi ${name},\n\nThank you for your purchase!\n\nPlan: ${plan}\nAmount: ${amount}\nDate: ${formattedDate}`,
    html: `
      <strong>Hi ${name},</strong>
      <p>Thank you for your purchase!</p>
      <p><strong>Plan:</strong> ${plan}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending transaction email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendTransactionEmail
};