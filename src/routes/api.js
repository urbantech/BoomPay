/**
 * BoomPay Shopify Integration - API Routes
 *
 * Defines API routes for the Shopify integration
 *
 * @module routes/api
 */

const express = require('express');
const logger = require('../utils/logger');

/**
 * Creates API router for the Shopify integration
 *
 * @param {Object} services - Application services
 * @param {Object} services.paymentGateway - Payment gateway service
 * @param {Object} services.orderService - Order service
 * @param {Object} middleware - Application middleware
 * @param {Function} middleware.shopifyAuth - Shopify authentication middleware
 * @returns {Object} Express router
 */
function createApiRouter(services, middleware) {
  const router = express.Router();

  // Apply Shopify authentication middleware to all routes
  router.use(middleware.shopifyAuth.verifyRequest);

  /**
   * Create payment intent for a Shopify order
   *
   * @route POST /api/payments
   */
  router.post('/payments', async (req, res) => {
    try {
      const { order } = req.body;

      if (!order || !order.id) {
        return res.status(400).json({ error: 'Order data is required' });
      }

      // Add shop domain from session
      order.shop_domain = req.shopifySession.shop;

      logger.debug('Creating payment intent', { orderId: order.id });

      const paymentIntent = await services.paymentGateway.createPaymentIntent(order);

      res.status(200).json(paymentIntent);
    } catch (error) {
      logger.error('Error creating payment intent', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Check payment status
   *
   * @route GET /api/payments/:paymentId
   */
  router.get('/payments/:paymentId', async (req, res) => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID is required' });
      }

      logger.debug('Checking payment status', { paymentId });

      const paymentStatus = await services.paymentGateway.checkPaymentStatus(paymentId);

      res.status(200).json(paymentStatus);
    } catch (error) {
      logger.error('Error checking payment status', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Update order status
   *
   * @route POST /api/orders/:orderId/status
   */
  router.post('/orders/:orderId/status', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentId, status } = req.body;

      if (!paymentId || !status) {
        return res.status(400).json({ error: 'Payment ID and status are required' });
      }

      logger.debug('Updating order status', { orderId, paymentId, status });

      const updatedOrder = await services.orderService.updateOrderStatus({
        orderId,
        paymentId,
        paymentStatus: status,
        session: req.shopifySession,
      });

      res.status(200).json(updatedOrder);
    } catch (error) {
      logger.error('Error updating order status', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get order details
   *
   * @route GET /api/orders/:orderId
   */
  router.get('/orders/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;

      logger.debug('Getting order details', { orderId });

      const orderDetails = await services.orderService.getOrderDetails({
        orderId,
        session: req.shopifySession,
      });

      res.status(200).json(orderDetails);
    } catch (error) {
      logger.error('Error getting order details', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createApiRouter;
