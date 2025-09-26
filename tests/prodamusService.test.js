const ProdamusService = require('../src/services/prodamusService');

describe('ProdamusService', () => {
    let prodamusService;

    beforeEach(() => {
        process.env.PRODAMUS_SHOP_ID = 'test_shop';
        process.env.PRODAMUS_SECRET_KEY = 'test_secret_key';
        process.env.PRODAMUS_PAYMENT_FORM_URL = 'https://payform.ru/pay';
        process.env.WEBHOOK_URL = 'https://test.com';
        process.env.PRODAMUS_WEBHOOK_URL = 'https://test.com/webhook/prodamus';
        process.env.CURRENCY = 'RUB';
        
        prodamusService = new ProdamusService();
    });

    describe('createPayment', () => {
        test('should create payment URL successfully', async () => {
            const paymentData = {
                userId: '12345',
                amount: 1000,
                description: 'Test payment',
                orderId: 'order_123'
            };

            const result = await prodamusService.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.paymentUrl).toBeDefined();
            expect(result.paymentUrl).toContain('https://payform.ru/pay');
            expect(result.paymentUrl).toContain('do=pay');
            expect(result.paymentUrl).toContain('sys=test_shop');
            expect(result.paymentUrl).toContain('order_id=order_123');
            expect(result.paymentUrl).toContain('signature=');
        });

        test('should include minimal required parameters in URL', async () => {
            const paymentData = {
                userId: '12345',
                amount: 1000,
                description: 'Test payment',
                orderId: 'order_123'
            };

            const result = await prodamusService.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.paymentUrl).toContain('do=pay');
            expect(result.paymentUrl).toContain('sys=test_shop');
            expect(result.paymentUrl).toContain('order_id=order_123');
            expect(result.paymentUrl).toContain('signature=');
        });

        test('should handle payment creation error', async () => {
            const paymentData = {
                userId: '12345',
                amount: 1000,
                description: 'Test payment',
                orderId: 'order_123'
            };

            // Mock the createHmacSignature method to throw an error
            const originalCreateHmacSignature = prodamusService.createHmacSignature;
            prodamusService.createHmacSignature = jest.fn(() => {
                throw new Error('HMAC creation failed');
            });

            const result = await prodamusService.createPayment(paymentData);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Payment creation failed');
            
            // Restore original method
            prodamusService.createHmacSignature = originalCreateHmacSignature;
        });
    });

    describe('createHmacSignature', () => {
        test('should create valid HMAC signature', () => {
            const data = {
                do: 'pay',
                sys: 'test_shop',
                order_id: 'order_123',
                amount: 1000
            };

            const signature = prodamusService.createHmacSignature(data);

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64); // SHA256 hex length
        });

        test('should create different signatures for different data', () => {
            const data1 = { do: 'pay', sys: 'test_shop', order_id: 'order_123' };
            const data2 = { do: 'pay', sys: 'test_shop', order_id: 'order_456' };

            const signature1 = prodamusService.createHmacSignature(data1);
            const signature2 = prodamusService.createHmacSignature(data2);

            expect(signature1).not.toBe(signature2);
        });
    });

    describe('buildPaymentUrl', () => {
        test('should build correct payment URL', () => {
            const data = {
                do: 'pay',
                sys: 'test_shop',
                order_id: 'order_123',
                amount: 1000,
                signature: 'test_signature'
            };

            const url = prodamusService.buildPaymentUrl(data);

            expect(url).toContain('https://payform.ru/pay');
            expect(url).toContain('do=pay');
            expect(url).toContain('sys=test_shop');
            expect(url).toContain('order_id=order_123');
            expect(url).toContain('amount=1000');
            expect(url).toContain('signature=test_signature');
        });
    });

    describe('verifyWebhookSignature', () => {
        test('should verify valid webhook signature', () => {
            const webhookData = {
                order_id: 'order_123',
                status: 'success',
                amount: '1000'
            };

            // Create signature using the same method
            const sortedKeys = Object.keys(webhookData).sort();
            const signatureString = sortedKeys
                .map(key => `${key}=${webhookData[key]}`)
                .join('&');
            const expectedSignature = require('crypto')
                .createHmac('sha256', 'test_secret_key')
                .update(signatureString, 'utf8')
                .digest('hex');

            const isValid = prodamusService.verifyWebhookSignature(webhookData, expectedSignature);

            expect(isValid).toBe(true);
        });

        test('should reject invalid webhook signature', () => {
            const webhookData = {
                order_id: 'order_123',
                status: 'success',
                amount: '1000'
            };

            const isValid = prodamusService.verifyWebhookSignature(webhookData, 'invalid_signature');

            expect(isValid).toBe(false);
        });
    });
});
