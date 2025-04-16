/**
 * BoomPay Shopify Integration - Webhook Middleware
 *
 * Handles webhooks from BoomPay for payment notifications
 *
 * @module middleware/webhooks
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Creates webhook verification middleware for BoomPay
 *
 * @param {Object} config - Configuration options
 * @param {string} config.webhookSecret - BoomPay webhook secret
 * @returns {Function} Express middleware function
 */
function createWebhookMiddleware(config) {
  if (!config.webhookSecret) {
    throw new Error('BoomPay webhook secret is required');
  }

  logger.info('Initializing BoomPay webhook middleware');

  /**
   * Verifies webhook signature from BoomPay
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  return (req, res, next) => {
    try {
      const signature = req.headers['x-boompay-signature'];

      if (!signature) {
        logger.warn('Missing BoomPay signature header');

        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get raw body
      const rawBody = JSON.stringify(req.body);

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', config.webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid BoomPay signature', {
          expected: expectedSignature,
          received: signature,
        });

        return res.status(401).json({ error: 'Invalid signature' });
      }

      logger.debug('Webhook signature verified');
      next();
    } catch (error) {
      logger.error('Error verifying webhook signature', { error: error.message });
      res.status(500).json({ error: 'Webhook verification failed' });
    }
  };
}

/**
 * Sets up webhook handlers for BoomPay notifications
 *
 * @param {Object} app - Express app
 * @param {Object} config - Configuration options
 * @param {Object} services - Application services
 * @param {Object} services.orderService - Order service
 */
function setupWebhooks(app, config, services) {
  const webhookMiddleware = createWebhookMiddleware(config);

  // Payment success webhook
  app.post('/api/webhooks/payment/success', webhookMiddleware, async (req, res) => {
    try {
      const { paymentId, orderId, status = 'completed' } = req.body;

      logger.info('Received payment success webhook', { paymentId, orderId });

      if (!paymentId || !orderId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get Shopify session for the shop
      const shopDomain = req.body.metadata?.shopDomain;

      if (!shopDomain) {
        logger.warn('Missing shop domain in webhook payload', { paymentId });

        return res.status(400).json({ error: 'Missing shop domain' });
      }

      // Update order status
      await services.orderService.updateOrderStatus({
        orderId,
        paymentId,
        paymentStatus: status,
        session: { shop: shopDomain },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error processing payment success webhook', { error: error.message });
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Payment failure webhook
  app.post('/api/webhooks/payment/failure', webhookMiddleware, async (req, res) => {
    try {
      const { paymentId, orderId, status = 'failed' } = req.body;

      logger.info('Received payment failure webhook', { paymentId, orderId });

      if (!paymentId || !orderId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get Shopify session for the shop
      const shopDomain = req.body.metadata?.shopDomain;

      if (!shopDomain) {
        logger.warn('Missing shop domain in webhook payload', { paymentId });

        return res.status(400).json({ error: 'Missing shop domain' });
      }

      // Update order status
      await services.orderService.updateOrderStatus({
        orderId,
        paymentId,
        paymentStatus: status,
        session: { shop: shopDomain },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error processing payment failure webhook', { error: error.message });
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });
}

module.exports = {
  createWebhookMiddleware,
  setupWebhooks,
};
