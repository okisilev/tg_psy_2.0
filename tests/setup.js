// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test_token';
process.env.PRODAMUS_SHOP_ID = 'test_shop';
process.env.PRODAMUS_API_KEY = 'test_api_key';
process.env.PRODAMUS_SECRET_KEY = 'test_secret_key';
process.env.SUBSCRIPTION_PRICE = '1000';
process.env.SUBSCRIPTION_DURATION_DAYS = '30';
process.env.CURRENCY = 'RUB';
