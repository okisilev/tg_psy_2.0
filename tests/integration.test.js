const TelegramSubscriptionBot = require('../src/bot');

// Mock all external dependencies
jest.mock('node-telegram-bot-api');
jest.mock('express');
jest.mock('../src/services/prodamusService');
jest.mock('../src/services/subscriptionService');
jest.mock('../src/services/hmacService');

describe('Integration Tests', () => {
    let bot;

    beforeEach(() => {
        // Mock environment variables
        process.env.TELEGRAM_BOT_TOKEN = 'test_token';
        process.env.PRODAMUS_SHOP_ID = 'test_shop';
        process.env.PRODAMUS_SECRET_KEY = 'test_secret';
        process.env.PRODAMUS_PAYMENT_FORM_URL = 'https://test.payform.ru/pay';
        process.env.WEBHOOK_URL = 'https://test.com';
        process.env.PRODAMUS_WEBHOOK_URL = 'https://test.com/webhook/prodamus';
        process.env.SUBSCRIPTION_PRICE = '1000';
        process.env.SUBSCRIPTION_DURATION_DAYS = '30';

        // Mock TelegramBot
        const TelegramBot = require('node-telegram-bot-api');
        const mockBot = {
            onText: jest.fn(),
            on: jest.fn(),
            processUpdate: jest.fn()
        };
        TelegramBot.mockReturnValue(mockBot);

        // Mock Express
        const express = require('express');
        const mockApp = {
            use: jest.fn(),
            post: jest.fn(),
            get: jest.fn(),
            listen: jest.fn()
        };
        express.mockReturnValue(mockApp);

        bot = new TelegramSubscriptionBot();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Bot Initialization', () => {
        test('should initialize with correct configuration', () => {
            expect(bot).toBeDefined();
            expect(bot.bot).toBeDefined();
            expect(bot.app).toBeDefined();
            expect(bot.port).toBe('3000');
        });

        test('should setup express routes', () => {
            const express = require('express');
            const mockApp = express.mock.results[0].value;

            expect(mockApp.use).toHaveBeenCalled();
            expect(mockApp.post).toHaveBeenCalledWith('/webhook/telegram', expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/sales/prodamus', expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/status', expect.any(Function));
        });

        test('should setup bot handlers', () => {
            const TelegramBot = require('node-telegram-bot-api');
            const mockBot = TelegramBot.mock.results[0].value;

            expect(mockBot.onText).toHaveBeenCalledWith(/\/start/, expect.any(Function));
            expect(mockBot.onText).toHaveBeenCalledWith(/\/help/, expect.any(Function));
            expect(mockBot.onText).toHaveBeenCalledWith(/\/subscribe/, expect.any(Function));
            expect(mockBot.onText).toHaveBeenCalledWith(/\/status/, expect.any(Function));
            expect(mockBot.onText).toHaveBeenCalledWith(/\/admin/, expect.any(Function));
            expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
        });
    });

    describe('Webhook Handling', () => {
        test('should handle valid Prodamus webhook', async () => {
            const ProdamusService = require('../src/services/prodamusService');
            const SubscriptionService = require('../src/services/subscriptionService');

            ProdamusService.prototype.verifyWebhookSignature.mockReturnValue(true);
            SubscriptionService.prototype.processPayment.mockResolvedValue({ success: true });

            const mockReq = {
                body: {
                    order_id: '12345',
                    status: 'success',
                    amount: '1000',
                    custom_fields: JSON.stringify({ telegram_user_id: '67890' })
                },
                headers: { 'sign': 'valid_signature' }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ status: 'success' });
        });

        test('should reject invalid signature', async () => {
            const ProdamusService = require('../src/services/prodamusService');
            ProdamusService.prototype.verifyWebhookSignature.mockReturnValue(false);

            const mockReq = {
                body: { order_id: '12345' },
                headers: { 'sign': 'invalid_signature' }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
        });

        test('should handle missing signature', async () => {
            const mockReq = {
                body: { order_id: '12345' },
                headers: {}
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'No signature found' });
        });
    });

    describe('Error Handling', () => {
        test('should handle server errors gracefully', async () => {
            const mockReq = {
                body: { order_id: '12345' },
                headers: { 'sign': 'test_signature' }
            };

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            // Mock error in verification
            const ProdamusService = require('../src/services/prodamusService');
            ProdamusService.prototype.verifyWebhookSignature.mockImplementation(() => {
                throw new Error('Verification error');
            });

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});
