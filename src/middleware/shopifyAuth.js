/**
 * BoomPay Shopify Integration - Shopify Authentication Middleware
 *
 * Handles OAuth authentication for Shopify
 *
 * @module middleware/shopifyAuth
 */

const { Shopify } = require('@shopify/shopify-api');
const logger = require('../utils/logger');

/**
 * Creates Shopify authentication middleware
 *
 * @param {Object} config - Configuration options
 * @param {string} config.apiKey - Shopify API key
 * @param {string} config.apiSecret - Shopify API secret
 * @param {string} config.scopes - Shopify OAuth scopes
 * @param {string} config.hostName - Host name for the app
 * @returns {Object} Authentication middleware functions
 */
function createShopifyAuth(config) {
  // Validate required config
  if (!config.apiKey || !config.apiSecret || !config.scopes || !config.hostName) {
    throw new Error('Missing required Shopify authentication configuration');
  }
  
  logger.info('Initializing Shopify authentication middleware');
  
  // Initialize Shopify API - handle different versions of the API
  try {
    // For newer versions of the API
    if (typeof Shopify.Context.initialize === 'function') {
      Shopify.Context.initialize({
        API_KEY: config.apiKey,
        API_SECRET_KEY: config.apiSecret,
        SCOPES: config.scopes.split(','),
        HOST_NAME: config.hostName,
        IS_EMBEDDED_APP: true,
        API_VERSION: '2023-04',
      });
    } else {
      // For older versions of the API
      new Shopify.Context({
        API_KEY: config.apiKey,
        API_SECRET_KEY: config.apiSecret,
        SCOPES: config.scopes.split(','),
        HOST_NAME: config.hostName,
        IS_EMBEDDED_APP: true,
        API_VERSION: '2023-04',
      });
    }
  } catch (error) {
    logger.error('Error initializing Shopify API', { error: error.message });
  }
  
  /**
   * Middleware to verify Shopify requests
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  const verifyRequest = async (req, res, next) => {
    try {
      // Get shop from query or session
      const shop = req.query.shop || req.session.shop;
      
      if (!shop) {
        logger.warn('No shop provided in request');
        return res.status(400).json({ error: 'No shop provided' });
      }
      
      // Check if we have an active session
      let session;
      
      try {
        session = await Shopify.Utils.loadOfflineSession(shop);
      } catch (error) {
        logger.warn('Error loading session', { error: error.message });
      }
      
      if (!session) {
        logger.warn('No session found for shop', { shop });
        return redirectToAuth(req, res);
      }
      
      // Add session to request for downstream middleware/routes
      req.shopifySession = session;
      next();
    } catch (error) {
      logger.error('Error verifying Shopify request', { error: error.message });
      res.status(500).json({ error: 'Authentication error' });
    }
  };
  
  /**
   * Redirects to Shopify OAuth
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  const redirectToAuth = (req, res) => {
    const shop = req.query.shop;
    
    if (!shop) {
      return res.status(400).json({ error: 'No shop provided' });
    }
    
    // Redirect to auth
    try {
      const redirectUrl = Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        '/auth/callback',
        false,
      );
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Error beginning auth', { error: error.message });
      res.status(500).json({ error: 'Authentication initialization failed' });
    }
  };
  
  /**
   * Handles OAuth callback from Shopify
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  const handleCallback = async (req, res) => {
    try {
      const session = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query,
      );
      
      // Store session
      req.session.shop = session.shop;
      req.session.accessToken = session.accessToken;
      
      logger.info('Authentication successful', { shop: session.shop });
      
      // Redirect to app
      res.redirect(`/?shop=${session.shop}`);
    } catch (error) {
      logger.error('Error handling auth callback', { error: error.message });
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
  
  return {
    verifyRequest,
    redirectToAuth,
    handleCallback,
  };
}

module.exports = createShopifyAuth;
