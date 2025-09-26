const SubscriptionService = require('../src/services/subscriptionService');

describe('SubscriptionService', () => {
    let subscriptionService;

    beforeEach(() => {
        process.env.SUBSCRIPTION_DURATION_DAYS = '30';
        subscriptionService = new SubscriptionService();
    });

    describe('createSubscription', () => {
        test('should create subscription successfully', () => {
            const userId = '12345';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            const result = subscriptionService.createSubscription(userId, paymentData);

            expect(result.success).toBe(true);
            expect(result.subscription).toBeDefined();
            expect(result.subscription.userId).toBe(userId);
            expect(result.subscription.paymentId).toBe('pay_123');
            expect(result.subscription.status).toBe('active');
        });

        test('should generate unique subscription ID', () => {
            const userId1 = '12345';
            const userId2 = '67890';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            const result1 = subscriptionService.createSubscription(userId1, paymentData);
            const result2 = subscriptionService.createSubscription(userId2, paymentData);

            expect(result1.subscription.id).not.toBe(result2.subscription.id);
        });
    });

    describe('getUserSubscription', () => {
        test('should return user subscription if exists', () => {
            const userId = '12345';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            subscriptionService.createSubscription(userId, paymentData);
            const subscription = subscriptionService.getUserSubscription(userId);

            expect(subscription).toBeDefined();
            expect(subscription.userId).toBe(userId);
        });

        test('should return null if no subscription exists', () => {
            const subscription = subscriptionService.getUserSubscription('nonexistent');
            expect(subscription).toBeNull();
        });
    });

    describe('isSubscriptionActive', () => {
        test('should return true for active subscription', () => {
            const userId = '12345';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            subscriptionService.createSubscription(userId, paymentData);
            const isActive = subscriptionService.isSubscriptionActive(userId);

            expect(isActive).toBe(true);
        });

        test('should return false for no subscription', () => {
            const isActive = subscriptionService.isSubscriptionActive('nonexistent');
            expect(isActive).toBe(false);
        });
    });

    describe('extendSubscription', () => {
        test('should extend subscription successfully', () => {
            const userId = '12345';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            subscriptionService.createSubscription(userId, paymentData);
            const result = subscriptionService.extendSubscription(userId, 7);

            expect(result.success).toBe(true);
            expect(result.subscription).toBeDefined();
        });

        test('should return error if no subscription exists', () => {
            const result = subscriptionService.extendSubscription('nonexistent', 7);

            expect(result.success).toBe(false);
            expect(result.error).toBe('No active subscription found');
        });
    });

    describe('cancelSubscription', () => {
        test('should cancel subscription successfully', () => {
            const userId = '12345';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            subscriptionService.createSubscription(userId, paymentData);
            const result = subscriptionService.cancelSubscription(userId);

            expect(result.success).toBe(true);
            expect(result.subscription.status).toBe('cancelled');
        });

        test('should return error if no subscription exists', () => {
            const result = subscriptionService.cancelSubscription('nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No active subscription found');
        });
    });

    describe('getSubscriptionStats', () => {
        test('should return correct statistics', () => {
            const userId1 = '12345';
            const userId2 = '67890';
            const paymentData = {
                payment_id: 'pay_123',
                order_id: 'order_123',
                amount: 1000,
                currency: 'RUB'
            };

            subscriptionService.createSubscription(userId1, paymentData);
            subscriptionService.createSubscription(userId2, paymentData);
            subscriptionService.cancelSubscription(userId2);

            const stats = subscriptionService.getSubscriptionStats();

            expect(stats.total).toBe(2);
            expect(stats.active).toBe(1);
            expect(stats.cancelled).toBe(1);
        });
    });
});
