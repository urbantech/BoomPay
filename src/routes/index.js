/**
 * BoomPay Shopify Integration - Main Routes
 *
 * Defines main application routes for the Shopify integration
 *
 * @module routes/index
 */

const express = require('express');
const createApiRouter = require('./api');
const logger = require('../utils/logger');

/**
 * Creates main router for the application
 *
 * @param {Object} services - Application services
 * @param {Object} middleware - Application middleware
 * @returns {Object} Express router
 */
function createMainRouter(services, middleware) {
  const router = express.Router();

  // Health check route (no auth required)
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Shopify auth routes
  router.get('/auth', middleware.shopifyAuth.redirectToAuth);
  router.get('/auth/callback', middleware.shopifyAuth.handleCallback);

  // API routes
  router.use('/api', createApiRouter(services, middleware));

  // Main app route (requires auth)
  router.get('/', middleware.shopifyAuth.verifyRequest, (req, res) => {
    const shop = req.query.shop || req.session.shop;

    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
    }

    logger.info('App loaded', { shop });
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BoomPay for Shopify</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #212b36;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #008060;
            }
            .status {
              padding: 10px;
              border-radius: 4px;
              background: #e3f1df;
              color: #108043;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>BoomPay for Shopify</h1>
            <div class="status">✅ Connected to ${shop}</div>
            <p>Your BoomPay payment gateway is now active. Customers can now pay with cryptocurrency.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Catch-all route for 404s
  router.use((req, res) => {
    logger.warn('Route not found', { path: req.path });
    res.status(404).json({ error: 'Not found' });
  });

  return router;
}

module.exports = createMainRouter;
