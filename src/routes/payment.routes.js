const express = require('express');
const asyncHandler = require('express-async-handler');
const {
  createStripeCheckoutSession,
  handleStripeWebhook,
  handleCheckoutSessionCompleted
} = require('../services/payment.service');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Stripe checkout session
router.post('/stripe/create-checkout-session', asyncHandler(async (req, res) => {
  const { priceId, userId, email, name, interval } = req.body;

  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session = await createStripeCheckoutSession(
    priceId,
    userId,
    email,
    name,
    interval
  );

  res.json({ sessionId: session.id });
}));

// Stripe webhook handler
router.post('/stripe/webhook',
  bodyParser.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    await handleStripeWebhook(req, res);
  })
);


// router.get('/verify', asyncHandler(async (req, res) => {
//   const { session_id } = req.query;
  
//   if (!session_id) {
//     return res.status(400).json({ error: 'Missing session_id parameter' });
//   }

//   try {
//     // Retrieve the session details from Stripe
//     const session = await stripe.checkout.sessions.retrieve(session_id, {
//       expand: ['customer', 'subscription']
//     });
    
//     // Get subscription details
//     const subscription = await stripe.subscriptions.retrieve(session.subscription, {
//       expand: ['items.data.price']
//     });
    
//     // Determine plan type
//     const isYearly = subscription.items.data[0].price.recurring.interval === 'year';
//     const planType = isYearly ? 'yearly' : 'monthly';
    
//     // Return verification data that frontend needs
//     const verificationData = {
//       subscription_id: subscription.id,
//       customer_id: session.customer,
//       plan_type: planType,
//       current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
//       status: subscription.status
//     };
    
//     // Optionally, process the completed checkout session if you want server-side updates too
//     // This would be in addition to the frontend direct updates
//     await handleCheckoutSessionCompleted(session);
    
//     // Return verification data to the frontend
//     return res.status(200).json(verificationData);
    
//   } catch (error) {
//     console.error('Error verifying payment:', error);
//     return res.status(500).json({ error: 'Error verifying payment: ' + error.message });
//   }
// }));

router.get('/stripe/verify', asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id parameter' });
  }

  try {
    // Retrieve the session with minimal expansion
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    // Return sanitized session data for inspection
    return res.status(200).json({
      id: session.id,
      object: session.object,
      subscription_type: typeof session.subscription,
      subscription_value: session.subscription,
      customer_type: typeof session.customer,
      customer_value: session.customer,
      payment_status: session.payment_status,
      metadata: session.metadata || {}
    });
    
  } catch (error) {
    console.error('Error retrieving session:', error);
    return res.status(500).json({ error: 'Error retrieving session: ' + error.message });
  }
}));

module.exports = router;