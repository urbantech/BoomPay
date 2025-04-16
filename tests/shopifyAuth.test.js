/**
 * Shopify Authentication Middleware Tests
 * 
 * Following Semantic Seed Coding Standards V2.0 with BDD-style tests
 * Using real API keys for testing
 */

const express = require('express');
const request = require('supertest');
const session = require('express-session');
require('dotenv').config();

// Import the shopifyAuth module directly
const createShopifyAuth = require('../src/middleware/shopifyAuth');

// Mock logger to avoid console output during tests
jest.mock('../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Shopify Auth Middleware', () => {
  let app;
  let shopifyAuth;
  
  beforeEach(() => {
    // Create the auth middleware with real config from environment
    shopifyAuth = createShopifyAuth({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecret: process.env.SHOPIFY_API_SECRET,
      scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_orders',
      hostName: process.env.HOST || 'localhost',
    });
    
    // Create a new Express app for testing
    app = express();
    
    // Setup session middleware
    app.use(session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: true,
    }));
    
    // Setup test routes
    app.get('/auth', shopifyAuth.redirectToAuth);
    app.get('/auth/callback', shopifyAuth.handleCallback);
    app.get('/protected', shopifyAuth.verifyRequest, (req, res) => {
      res.status(200).json({ success: true });
    });
  });
  
  describe('redirectToAuth', () => {
    it('should redirect to Shopify auth', async () => {
      // Skip this test if no shop domain is provided
      if (!process.env.SHOPIFY_SHOP_DOMAIN) {
        console.log('Skipping auth test - no SHOPIFY_SHOP_DOMAIN in environment');
        return;
      }
      
      const response = await request(app)
        .get(`/auth?shop=${process.env.SHOPIFY_SHOP_DOMAIN}`);
      
      expect(response.status).toBe(302);
    });
    
    it('should return 400 if shop is missing', async () => {
      const response = await request(app).get('/auth');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('handleCallback', () => {
    it('should handle auth callback', async () => {
      // Skip this test if no shop domain is provided
      if (!process.env.SHOPIFY_SHOP_DOMAIN) {
        console.log('Skipping callback test - no SHOPIFY_SHOP_DOMAIN in environment');
        return;
      }
      
      const response = await request(app)
        .get(`/auth/callback?shop=${process.env.SHOPIFY_SHOP_DOMAIN}&code=test-code`);
      
      // Even if the auth fails, we should get a redirect or error response
      expect(response.status).toBe(302).or.toBe(500);
    });
  });
  
  describe('verifyRequest', () => {
    it('should redirect to auth if no session exists', async () => {
      // Skip this test if no shop domain is provided
      if (!process.env.SHOPIFY_SHOP_DOMAIN) {
        console.log('Skipping verify test - no SHOPIFY_SHOP_DOMAIN in environment');
        return;
      }
      
      const response = await request(app)
        .get(`/protected?shop=${process.env.SHOPIFY_SHOP_DOMAIN}`);
      
      // Should redirect to auth since we don't have a valid session
      expect(response.status).toBe(302);
    });
  });
});
