const express = require('express');
const asyncHandler = require('express-async-handler');
const EmailService = require('../services/email.service');

const router = express.Router();

// Send welcome email
router.post('/welcome', asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  const success = await EmailService.sendWelcomeEmail(email, name);
  
  if (success) {
    res.json({ message: 'Welcome email sent successfully' });
  } else {
    res.status(500).json({ message: 'Failed to send welcome email' });
  }
}));

// Send transaction email
router.post('/transaction', asyncHandler(async (req, res) => {
  const { email, name, plan,amount  } = req.body;
  
  if (!email || !name || !amount || !plan ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const success = await EmailService.sendTransactionEmail(email, name, amount, plan);
  
  if (success) {
    res.json({ message: 'Transaction email sent successfully' });
  } else {
    res.status(500).json({ message: 'Failed to send transaction email' });
  }
}));

module.exports = router;