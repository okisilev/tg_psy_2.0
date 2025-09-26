const TelegramSubscriptionBot = require('../src/bot');

// Mock dependencies
jest.mock('node-telegram-bot-api');
jest.mock('express');
jest.mock('body-parser', () => ({
    json: jest.fn(() => 'jsonParser'),
    urlencoded: jest.fn(() => 'urlParser')
}));
jest.mock('../src/services/prodamusService');
jest.mock('../src/services/subscriptionService');
jest.mock('../src/services/hmacService');

describe('TelegramSubscriptionBot', () => {
    let bot;

    beforeEach(() => {
        // Mock environment variables
        process.env.TELEGRAM_BOT_TOKEN = 'test_token';
        process.env.PORT = '3000';
        process.env.WEBHOOK_URL = 'https://test.com';
        process.env.WEBHOOK_PATH = '/webhook/telegram';
        process.env.PRODAMUS_WEBHOOK_URL = 'https://test.com/webhook/prodamus';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize bot with correct token', () => {
            const TelegramBot = require('node-telegram-bot-api');
            const express = require('express');
            const mockBot = {
                onText: jest.fn(),
                on: jest.fn(),
                processUpdate: jest.fn()
            };
            const mockApp = {
                use: jest.fn(),
                post: jest.fn(),
                get: jest.fn(),
                listen: jest.fn()
            };
            
            TelegramBot.mockReturnValue(mockBot);
            express.mockReturnValue(mockApp);

            bot = new TelegramSubscriptionBot();

            expect(TelegramBot).toHaveBeenCalledWith('test_token', { polling: true });
        });

        test('should setup express app', () => {
            const express = require('express');
            const mockApp = {
                use: jest.fn(),
                post: jest.fn(),
                get: jest.fn(),
                listen: jest.fn()
            };
            express.mockReturnValue(mockApp);

            bot = new TelegramSubscriptionBot();

            expect(express).toHaveBeenCalled();
        });
    });

    describe('setupExpress', () => {
        test('should setup webhook routes', () => {
            const express = require('express');
            const mockApp = {
                use: jest.fn(),
                post: jest.fn(),
                get: jest.fn(),
                listen: jest.fn()
            };
            express.mockReturnValue(mockApp);

            bot = new TelegramSubscriptionBot();

            expect(mockApp.post).toHaveBeenCalledWith('/webhook/telegram', expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/webhook/prodamus', expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/status', expect.any(Function));
        });
    });

    describe('handleProdamusWebhook', () => {
        let mockReq, mockRes;

        beforeEach(() => {
            const TelegramBot = require('node-telegram-bot-api');
            const express = require('express');
            const mockBot = {
                onText: jest.fn(),
                on: jest.fn(),
                processUpdate: jest.fn()
            };
            const mockApp = {
                use: jest.fn(),
                post: jest.fn(),
                get: jest.fn(),
                listen: jest.fn()
            };
            
            TelegramBot.mockReturnValue(mockBot);
            express.mockReturnValue(mockApp);

            bot = new TelegramSubscriptionBot();

            mockReq = {
                body: { test: 'data' },
                headers: { 'Sign': 'test_signature' }
            };
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        test('should handle valid webhook', async () => {
            const ProdamusService = require('../src/services/prodamusService');
            const SubscriptionService = require('../src/services/subscriptionService');
            
            // Mock the services
            ProdamusService.prototype.verifyWebhookSignature.mockReturnValue(true);
            SubscriptionService.prototype.processPayment.mockResolvedValue({ success: true });

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ status: 'success' });
        });

        test('should handle invalid signature', async () => {
            const ProdamusService = require('../src/services/prodamusService');
            ProdamusService.prototype.verifyWebhookSignature.mockReturnValue(false);

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
        });

        test('should handle processing error', async () => {
            const ProdamusService = require('../src/services/prodamusService');
            const SubscriptionService = require('../src/services/subscriptionService');
            
            ProdamusService.prototype.verifyWebhookSignature.mockReturnValue(true);
            SubscriptionService.prototype.processPayment.mockRejectedValue(new Error('Processing error'));

            await bot.handleProdamusWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});
