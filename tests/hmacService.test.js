const HmacService = require('../src/services/hmacService');

describe('HmacService', () => {
    let hmacService;

    beforeEach(() => {
        process.env.PRODAMUS_SECRET_KEY = 'test_secret_key';
        hmacService = new HmacService();
    });

    describe('createSignature', () => {
        test('should create valid HMAC signature for string data', () => {
            const data = 'test_data';
            const signature = hmacService.createSignature(data);
            
            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64); // SHA256 hex length
        });

        test('should create valid HMAC signature for object data', () => {
            const data = { test: 'value', number: 123 };
            const signature = hmacService.createSignature(data);
            
            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64);
        });

        test('should create different signatures for different data', () => {
            const data1 = 'test1';
            const data2 = 'test2';
            const signature1 = hmacService.createSignature(data1);
            const signature2 = hmacService.createSignature(data2);
            
            expect(signature1).not.toBe(signature2);
        });
    });

    describe('verifySignature', () => {
        test('should verify valid signature', () => {
            const data = 'test_data';
            const signature = hmacService.createSignature(data);
            
            const isValid = hmacService.verifySignature(data, signature);
            expect(isValid).toBe(true);
        });

        test('should reject invalid signature', () => {
            const data = 'test_data';
            const invalidSignature = 'invalid_signature';
            
            const isValid = hmacService.verifySignature(data, invalidSignature);
            expect(isValid).toBe(false);
        });

        test('should reject empty signature', () => {
            const data = 'test_data';
            
            const isValid = hmacService.verifySignature(data, '');
            expect(isValid).toBe(false);
        });

        test('should reject null signature', () => {
            const data = 'test_data';
            
            const isValid = hmacService.verifySignature(data, null);
            expect(isValid).toBe(false);
        });
    });

    describe('createWebhookSignature', () => {
        test('should create webhook signature for Prodamus data', () => {
            const webhookData = {
                order_id: '123',
                status: 'success',
                amount: '1000',
                currency: 'RUB'
            };
            
            const signature = hmacService.createWebhookSignature(webhookData);
            
            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64);
        });
    });

    describe('verifyWebhookSignature', () => {
        test('should verify valid webhook signature', () => {
            const webhookData = {
                order_id: '123',
                status: 'success',
                amount: '1000'
            };
            
            const signature = hmacService.createWebhookSignature(webhookData);
            const isValid = hmacService.verifyWebhookSignature(webhookData, signature);
            
            expect(isValid).toBe(true);
        });

        test('should reject invalid webhook signature', () => {
            const webhookData = {
                order_id: '123',
                status: 'success',
                amount: '1000'
            };
            
            const isValid = hmacService.verifyWebhookSignature(webhookData, 'invalid_signature');
            expect(isValid).toBe(false);
        });
    });

    describe('createSecureToken', () => {
        test('should create secure token', () => {
            const userId = '12345';
            const additionalData = 'test';
            
            const token = hmacService.createSecureToken(userId, additionalData);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBe(64);
        });
    });
});
