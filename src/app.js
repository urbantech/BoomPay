/**
 * BoomPay Shopify Integration - Main Application
 * 
 * Entry point for the Shopify integration application
 * 
 * @module app
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Shopify } = require('@shopify/shopify-api');

// Import services
const ShopifyPaymentGateway = require('./services/shopifyPaymentGateway');
const OrderService = require('./services/orderService');

// Import middleware
const createShopifyAuth = require('./middleware/shopifyAuth');
const { setupWebhooks } = require('./middleware/webhooks');

// Import routes
const createMainRouter = require('./routes');

// Import utilities
const logger = require('./utils/logger');

/**
 * Creates and configures the Express application
 * 
 * @returns {Object} Configured Express app
 */
function createApp() {
  // Load environment variables
  const {
    SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET,
    SHOPIFY_SCOPES,
    HOST,
    BOOMPAY_API_KEY,
    BOOMPAY_WEBHOOK_SECRET,
    NODE_ENV = 'development',
  } = process.env;
  
  // Validate required environment variables
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !BOOMPAY_API_KEY) {
    logger.error('Missing required environment variables');
    throw new Error('Missing required environment variables');
  }
  
  // Create Express app
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Configure session
  app.use(session({
    secret: SHOPIFY_API_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));
  
  // Initialize services
  const services = {
    paymentGateway: new ShopifyPaymentGateway({
      apiKey: BOOMPAY_API_KEY,
      sandbox: NODE_ENV !== 'production',
    }),
    orderService: new OrderService({
      shopify: Shopify,
      sandbox: NODE_ENV !== 'production',
    }),
  };
  
  // Initialize middleware
  const middleware = {
    shopifyAuth: createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      apiSecret: SHOPIFY_API_SECRET,
      scopes: SHOPIFY_SCOPES || 'read_orders,write_orders',
      hostName: HOST,
    }),
  };
  
  // Setup webhooks
  setupWebhooks(app, {
    webhookSecret: BOOMPAY_WEBHOOK_SECRET,
  }, services);
  
  // Setup routes
  app.use(createMainRouter(services, middleware));
  
  // Error handling middleware
  app.use((err, req, res) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
}

// Start the server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
}

module.exports = createApp;
