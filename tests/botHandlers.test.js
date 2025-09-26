const BotHandlers = require('../src/handlers/botHandlers');

// Mock dependencies
jest.mock('node-telegram-bot-api');
jest.mock('../src/services/prodamusService');
jest.mock('../src/services/subscriptionService');

describe('BotHandlers', () => {
    let botHandlers;
    let mockBot;
    let mockProdamusService;
    let mockSubscriptionService;

    beforeEach(() => {
        // Mock bot
        mockBot = {
            sendMessage: jest.fn(),
            answerCallbackQuery: jest.fn()
        };

        // Mock services
        mockProdamusService = {
            createPayment: jest.fn()
        };

        mockSubscriptionService = {
            getUserSubscription: jest.fn(),
            isSubscriptionActive: jest.fn()
        };

        // Set environment variables
        process.env.SUBSCRIPTION_PRICE = '1000';
        process.env.SUBSCRIPTION_DURATION_DAYS = '30';

        botHandlers = new BotHandlers(mockBot, mockProdamusService, mockSubscriptionService);
    });

    describe('createPayment', () => {
        test('should create payment successfully', async () => {
            const chatId = '12345';
            const userId = '67890';

            mockProdamusService.createPayment.mockResolvedValue({
                success: true,
                paymentUrl: 'https://test.payform.ru/pay?test=123',
                orderId: '12345'
            });

            await botHandlers.createPayment(chatId, userId);

            expect(mockProdamusService.createPayment).toHaveBeenCalledWith({
                userId: userId,
                amount: 1000,
                description: 'Подписка на закрытый канал (30 дней)',
                orderId: expect.stringMatching(/^\d{5}$/)
            });

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                chatId,
                expect.stringContaining('Платеж создан')
            );
        });

        test('should handle payment creation error', async () => {
            const chatId = '12345';
            const userId = '67890';

            mockProdamusService.createPayment.mockResolvedValue({
                success: false,
                error: 'Payment failed'
            });

            await botHandlers.createPayment(chatId, userId);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                chatId,
                expect.stringContaining('Ошибка создания платежа')
            );
        });

        test('should generate 5-digit order ID', async () => {
            const chatId = '12345';
            const userId = '67890';

            mockProdamusService.createPayment.mockResolvedValue({
                success: true,
                paymentUrl: 'https://test.payform.ru/pay',
                orderId: '12345'
            });

            await botHandlers.createPayment(chatId, userId);

            const callArgs = mockProdamusService.createPayment.mock.calls[0][0];
            expect(callArgs.orderId).toMatch(/^\d{5}$/);
        });
    });

    describe('handleStart', () => {
        test('should send welcome message', async () => {
            const msg = {
                chat: { id: '12345' },
                from: { first_name: 'Test User' }
            };

            await botHandlers.handleStart(msg);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                '12345',
                expect.stringContaining('Привет, Test User!'),
                expect.objectContaining({
                    reply_markup: expect.objectContaining({
                        inline_keyboard: expect.any(Array)
                    })
                })
            );
        });
    });

    describe('handleSubscribe', () => {
        test('should show subscription message for new user', async () => {
            const msg = {
                chat: { id: '12345' },
                from: { id: '67890' }
            };

            mockSubscriptionService.getUserSubscription.mockReturnValue(null);
            mockSubscriptionService.isSubscriptionActive.mockReturnValue(false);

            await botHandlers.handleSubscribe(msg);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                '12345',
                expect.stringContaining('Оформление подписки'),
                expect.objectContaining({
                    reply_markup: expect.objectContaining({
                        inline_keyboard: expect.any(Array)
                    })
                })
            );
        });

        test('should show existing subscription message', async () => {
            const msg = {
                chat: { id: '12345' },
                from: { id: '67890' }
            };

            const mockSubscription = {
                endDate: '2024-12-31T23:59:59.000Z'
            };

            mockSubscriptionService.getUserSubscription.mockReturnValue(mockSubscription);
            mockSubscriptionService.isSubscriptionActive.mockReturnValue(true);

            await botHandlers.handleSubscribe(msg);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                '12345',
                expect.stringContaining('У вас уже есть активная подписка')
            );
        });
    });

    describe('handleStatus', () => {
        test('should show no subscription message', async () => {
            const msg = {
                chat: { id: '12345' },
                from: { id: '67890' }
            };

            mockSubscriptionService.getUserSubscription.mockReturnValue(null);

            await botHandlers.handleStatus(msg);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                '12345',
                expect.stringContaining('У вас нет активной подписки')
            );
        });

        test('should show active subscription message', async () => {
            const msg = {
                chat: { id: '12345' },
                from: { id: '67890' }
            };

            const mockSubscription = {
                id: 'sub_123',
                amount: 1000,
                currency: 'RUB',
                startDate: '2024-01-01T00:00:00.000Z',
                endDate: '2024-01-31T23:59:59.000Z'
            };

            mockSubscriptionService.getUserSubscription.mockReturnValue(mockSubscription);
            mockSubscriptionService.isSubscriptionActive.mockReturnValue(true);

            await botHandlers.handleStatus(msg);

            expect(mockBot.sendMessage).toHaveBeenCalledWith(
                '12345',
                expect.stringContaining('Активна')
            );
        });
    });
});
