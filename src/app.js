const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const emailRoutes = require('./routes/email.routes');
const paymentRoutes = require('./routes/payment.routes');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors'); // Add this line

const createApp = () => {
  const app = express();


  // Middlewares
  app.use(cors()); // Add this before other middlewares
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/emails', emailRoutes);
  app.use('/api/payments', paymentRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
  });

  // Error handling
  app.use(errorHandler);

  return app;
};

module.exports = createApp;