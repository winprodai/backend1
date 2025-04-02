const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendTransactionEmail } = require('./email.service');
const config = require('../config');

// Create Stripe checkout session
const createStripeCheckoutSession = async (priceId, userId, email, name, interval) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${config.stripe.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: config.stripe.cancelUrl,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        userEmail: email,
        userName: name,
        interval
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
};

// Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle completed checkout session
const handleCheckoutSessionCompleted = async (session) => {
  try {

    // Log the session object for debugging
    console.log('Processing session:', JSON.stringify({
      id: session.id,
      hasMetadata: !!session.metadata,
      hasUserId: session.metadata?.userId,
      hasCustomer: !!session.customer,
      hasSubscription: !!session.subscription
    }));

    // Verify required session data exists
    if (!session?.metadata?.userId) {
      throw new Error('Missing userId in session metadata');
    }

    if (!session.customer) {
      throw new Error('Missing customer in session');
    }

    if (!session.subscription) {
      throw new Error('Missing subscription in session');
    }

    // Verify required session data exists
    if (!session?.metadata?.userId || !session.customer || !session.subscription) {
      throw new Error('Missing required session data');
    }

    const { userId, userEmail, userName, interval } = session.metadata;
    const amount = session.amount_total / 100;
    const planName = interval === 'yearly' ? 'Pro (Yearly)' : 'Pro (Monthly)';
    const subscriptionTier = 'pro';
    const subscriptionStatus = 'active';

    // 1. Retrieve full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription, {
      expand: ['items.data.price']
    });

    // 2. Verify subscription status
    if (subscription.status !== 'active') {
      throw new Error(`Subscription status is ${subscription.status}, expected active`);
    }

    // 3. Determine plan type
    const isYearly = subscription.items.data[0].price.recurring.interval === 'year';
    const planType = isYearly ? 'yearly' : 'monthly';

    // 4. Update subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer,
        plan_id: planType,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) throw subError;

    // 5. Update customers table
    const { error: custError } = await supabase
      .from('customers')
      .update({
        subscription_status: subscriptionStatus,
        subscription_tier: subscriptionTier,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (custError) throw custError;

    // 6. Send confirmation email (existing functionality)
    await sendTransactionEmail(
      userEmail,
      userName || userEmail.split('@')[0],
      amount,
      planName,
      session.id
    );

    // 7. Optional: Send welcome email if first subscription
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId);

    if (!existingSubscriptions || existingSubscriptions.length === 0) {
      await sendWelcomeEmail(
        userEmail,
        userName || userEmail.split('@')[0]
      );
    }

    return true;

  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);

    // Detailed error logging
    console.error('Session details:', {
      id: session?.id,
      metadata: session?.metadata,
      customer: session?.customer ? 'exists' : 'missing',
      subscription: session?.subscription ? 'exists' : 'missing'
    });
    // // Send error notification if needed
    // await sendErrorEmail(
    //   'admin@yourdomain.com',
    //   'Checkout Session Processing Failed',
    //   `Session ID: ${session.id}\nError: ${error.message}`
    // );

    throw error;
  }
};

// Handle successful invoice payments
const handleInvoicePaymentSucceeded = async (invoice) => {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const customer = await stripe.customers.retrieve(invoice.customer);

  const amount = invoice.amount_paid / 100;
  const plan = subscription.items.data[0].price.livemode ? 'Pro' : 'Pro (Test)';

  await sendTransactionEmail(
    customer.email,
    customer.name || customer.email.split('@')[0],
    amount,
    plan,
    invoice.id
  );
};

// Handle subscription cancellation
const handleSubscriptionDeleted = async (subscription) => {
  // Handle subscription cancellation
  // await updateSubscriptionInDatabase(subscription.id, 'canceled');
};




module.exports = {
  createStripeCheckoutSession,
  handleStripeWebhook,
  handleCheckoutSessionCompleted,
  handleInvoicePaymentSucceeded,
  handleSubscriptionDeleted
};