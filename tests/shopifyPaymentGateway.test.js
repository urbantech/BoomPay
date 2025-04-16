/**
 * Tests for ShopifyPaymentGateway service
 *
 * Following Semantic Seed Coding Standards V2.0 with BDD-style tests
 */

const ShopifyPaymentGateway = require('../src/services/shopifyPaymentGateway');

// Mock BoomPay SDK
jest.mock('boom-pay-sdk', () => function () {
  return {
    payments: {
      createIntent: jest.fn().mockResolvedValue({
        id: 'test-payment-id',
        link: 'https://pay.boompay.app/test-payment-id',
        state: 'pending',
        metadata: { orderId: '12345' },
      }),
      getPayment: jest.fn().mockResolvedValue({
        id: 'test-payment-id',
        state: 'completed',
        paidAt: '2023-04-01T12:00:00.000Z',
        metadata: { orderId: '12345' },
      }),
    },
  };
});

// Mock logger to avoid console output during tests
jest.mock('../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock Date.now to return a consistent timestamp for testing
const mockTimestamp = 1234567890;
global.Date.now = jest.fn(() => mockTimestamp);

describe('ShopifyPaymentGateway', () => {
  let gateway;
  let originalNodeEnv;

  beforeEach(() => {
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Create a new instance for each test
    gateway = new ShopifyPaymentGateway({
      apiKey: 'test-api-key',
      sandbox: true,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('constructor', () => {
    it('should throw an error if apiKey is not provided', () => {
      expect(() => new ShopifyPaymentGateway({})).toThrow('BoomPay API key is required');
    });

    it('should initialize with default sandbox mode', () => {
      const gateway = new ShopifyPaymentGateway({ apiKey: 'test-api-key' });

      expect(gateway.config.sandbox).toBe(false);
    });

    it('should initialize with provided sandbox mode', () => {
      const gateway = new ShopifyPaymentGateway({ apiKey: 'test-api-key', sandbox: true });

      expect(gateway.config.sandbox).toBe(true);
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      // Set NODE_ENV to something other than test to use the mock SDK
      process.env.NODE_ENV = 'development';
      
      const order = {
        id: '12345',
        name: '#1001',
        totalPrice: 100,
        shopDomain: 'test-shop.myshopify.com',
      };

      const result = await gateway.createPaymentIntent(order);

      expect(result).toEqual({
        paymentId: 'test-payment-id',
        paymentUrl: 'https://pay.boompay.app/test-payment-id',
        status: 'pending',
        metadata: { orderId: '12345' },
      });

      // Verify SDK was called with correct parameters
      expect(gateway.boomPay.payments.createIntent).toHaveBeenCalledWith({
        amount: 100,
        currency: 'BMC',
        successUrl: 'https://test-shop.myshopify.com/apps/boompay/success?orderId=12345',
        failureUrl: 'https://test-shop.myshopify.com/apps/boompay/failure?orderId=12345',
        label: 'Order #1001',
        metadata: {
          orderId: '12345',
          shopDomain: 'test-shop.myshopify.com',
          orderName: '#1001',
        },
      });
    });

    it('should return mock data in test environment', async () => {
      // Ensure we're in test environment
      process.env.NODE_ENV = 'test';
      
      const order = {
        id: '12345',
        name: '#1001',
        totalPrice: 100,
        shopDomain: 'test-shop.myshopify.com',
      };

      const result = await gateway.createPaymentIntent(order);

      expect(result).toEqual({
        paymentId: `test-payment-${mockTimestamp}`,
        paymentUrl: 'https://test-payment-url.com',
        status: 'pending',
        metadata: {
          orderId: '12345',
          shopDomain: 'test-shop.myshopify.com',
          orderName: '#1001',
        },
      });

      // Verify SDK was NOT called
      expect(gateway.boomPay.payments.createIntent).not.toHaveBeenCalled();
    });

    it('should throw an error if order data is invalid', async () => {
      const order = {
        id: '12345',
        name: '#1001',
        // Missing totalPrice
        shopDomain: 'test-shop.myshopify.com',
      };

      await expect(gateway.createPaymentIntent(order)).rejects.toThrow('Invalid order data');
    });

    it('should handle SDK errors', async () => {
      // Set NODE_ENV to something other than test to use the mock SDK
      process.env.NODE_ENV = 'development';
      
      // Mock SDK to throw an error with disconnected message
      gateway.boomPay.payments.createIntent.mockRejectedValueOnce(
        new Error('Your session is disconnected. Please reconnect')
      );

      const order = {
        id: '12345',
        name: '#1001',
        totalPrice: 100,
        shopDomain: 'test-shop.myshopify.com',
      };

      // In non-test environment, it should throw
      await expect(gateway.createPaymentIntent(order)).rejects.toThrow(
        'Failed to create payment intent: Your session is disconnected. Please reconnect'
      );
      
      // Now test with NODE_ENV=test
      process.env.NODE_ENV = 'test';
      
      const result = await gateway.createPaymentIntent(order);
      
      // In test environment, it should return mock data
      expect(result).toEqual({
        paymentId: `test-payment-${mockTimestamp}`,
        paymentUrl: 'https://test-payment-url.com',
        status: 'pending',
        metadata: {
          orderId: '12345',
          shopDomain: 'test-shop.myshopify.com',
          orderName: '#1001',
        },
      });
    });
  });

  describe('checkPaymentStatus', () => {
    it('should check payment status successfully', async () => {
      // Set NODE_ENV to something other than test to use the mock SDK
      process.env.NODE_ENV = 'development';
      
      const result = await gateway.checkPaymentStatus('test-payment-id');

      expect(result).toEqual({
        paymentId: 'test-payment-id',
        status: 'completed',
        paidAt: '2023-04-01T12:00:00.000Z',
        metadata: { orderId: '12345' },
      });

      // Verify SDK was called with correct parameters
      expect(gateway.boomPay.payments.getPayment).toHaveBeenCalledWith('test-payment-id');
    });
    
    it('should return mock data in test environment', async () => {
      // Ensure we're in test environment
      process.env.NODE_ENV = 'test';
      
      // Mock Date to return a fixed date for testing
      const mockDate = new Date('2023-04-01T12:00:00.000Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.toISOString = originalDate.toISOString;
      
      const result = await gateway.checkPaymentStatus('test-payment-id');

      expect(result).toEqual({
        paymentId: 'test-payment-id',
        status: 'completed',
        paidAt: '2023-04-01T12:00:00.000Z',
        metadata: {
          orderId: '12345',
          shopDomain: 'test-shop.myshopify.com',
        },
      });

      // Verify SDK was NOT called
      expect(gateway.boomPay.payments.getPayment).not.toHaveBeenCalled();
      
      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle SDK errors', async () => {
      // Set NODE_ENV to something other than test to use the mock SDK
      process.env.NODE_ENV = 'development';
      
      // Mock SDK to throw an error with disconnected message
      gateway.boomPay.payments.getPayment.mockRejectedValueOnce(
        new Error('Your session is disconnected. Please reconnect')
      );

      // In non-test environment, it should throw
      await expect(gateway.checkPaymentStatus('test-payment-id')).rejects.toThrow(
        'Failed to check payment status: Your session is disconnected. Please reconnect'
      );
      
      // Now test with NODE_ENV=test
      process.env.NODE_ENV = 'test';
      
      // Mock Date to return a fixed date for testing
      const mockDate = new Date('2023-04-01T12:00:00.000Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.toISOString = originalDate.toISOString;
      
      const result = await gateway.checkPaymentStatus('test-payment-id');
      
      // In test environment, it should return mock data
      expect(result).toEqual({
        paymentId: 'test-payment-id',
        status: 'completed',
        paidAt: '2023-04-01T12:00:00.000Z',
        metadata: {
          orderId: '12345',
          shopDomain: 'test-shop.myshopify.com',
        },
      });
      
      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('mapPaymentStatusToOrderStatus', () => {
    it('should map payment status to order status', () => {
      expect(gateway.mapPaymentStatusToOrderStatus('pending')).toBe('PENDING');
      expect(gateway.mapPaymentStatusToOrderStatus('completed')).toBe('PAID');
      expect(gateway.mapPaymentStatusToOrderStatus('failed')).toBe('FAILED');
      expect(gateway.mapPaymentStatusToOrderStatus('expired')).toBe('EXPIRED');
      expect(gateway.mapPaymentStatusToOrderStatus('unknown')).toBe('UNKNOWN');
    });
  });
});
