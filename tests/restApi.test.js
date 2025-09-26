const ProdamusService = require('../src/services/prodamusService');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('ProdamusService REST API', () => {
    let prodamusService;

    beforeEach(() => {
        process.env.PRODAMUS_SHOP_ID = 'test_shop';
        process.env.PRODAMUS_SECRET_KEY = 'test_secret_key';
        process.env.PRODAMUS_PAYMENT_FORM_URL = 'https://test-shop.payform.ru/pay';
        process.env.PRODAMUS_REST_API_URL = 'https://demo.payform.ru';
        
        prodamusService = new ProdamusService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setSubscriptionActivity', () => {
        test('should activate subscription as manager', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.setSubscriptionActivity({
                subscriptionId: '123',
                tgUserId: '456',
                activeManager: 1
            });

            expect(result.success).toBe(true);
            expect(result.response).toEqual(mockResponse);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_manager: 1,
                    signature: expect.any(String)
                }),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            );
        });

        test('should deactivate subscription as manager', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.setSubscriptionActivity({
                subscriptionId: '123',
                tgUserId: '456',
                activeManager: 0
            });

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_manager: 0,
                    signature: expect.any(String)
                }),
                expect.any(Object)
            );
        });

        test('should unsubscribe user', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.setSubscriptionActivity({
                subscriptionId: '123',
                tgUserId: '456',
                activeUser: 0
            });

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_user: 0,
                    signature: expect.any(String)
                }),
                expect.any(Object)
            );
        });

        test('should handle API errors', async () => {
            axios.post.mockRejectedValue(new Error('API Error'));

            const result = await prodamusService.setSubscriptionActivity({
                subscriptionId: '123',
                tgUserId: '456',
                activeManager: 1
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Subscription management failed');
        });
    });

    describe('activateSubscription', () => {
        test('should activate subscription', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.activateSubscription('123', '456');

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_manager: 1
                }),
                expect.any(Object)
            );
        });
    });

    describe('deactivateSubscription', () => {
        test('should deactivate subscription', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.deactivateSubscription('123', '456');

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_manager: 0
                }),
                expect.any(Object)
            );
        });
    });

    describe('unsubscribeUser', () => {
        test('should unsubscribe user', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.unsubscribeUser('123', '456');

            expect(result.success).toBe(true);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/setActivity/',
                expect.objectContaining({
                    subscription: '123',
                    tg_user_id: '456',
                    active_user: 0
                }),
                expect.any(Object)
            );
        });
    });

    describe('makeRestApiRequest', () => {
        test('should make REST API request', async () => {
            const mockResponse = { success: 'success' };
            axios.post.mockResolvedValue({ data: mockResponse });

            const result = await prodamusService.makeRestApiRequest('/rest/test/', { test: 'data' });

            expect(result).toEqual(mockResponse);
            expect(axios.post).toHaveBeenCalledWith(
                'https://demo.payform.ru/rest/test/',
                { test: 'data' },
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            );
        });

        test('should handle REST API errors', async () => {
            const error = new Error('Network error');
            axios.post.mockRejectedValue(error);

            await expect(prodamusService.makeRestApiRequest('/rest/test/', { test: 'data' }))
                .rejects.toThrow('Network error');
        });
    });
});
