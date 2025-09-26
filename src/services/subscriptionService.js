const moment = require('moment');

class SubscriptionService {
    constructor() {
        // В реальном проекте здесь должна быть база данных
        this.subscriptions = new Map();
        this.payments = new Map();
    }

    /**
     * Создает новую подписку
     * @param {string} userId - ID пользователя Telegram
     * @param {Object} paymentData - Данные платежа
     * @returns {Object} - Результат создания подписки
     */
    createSubscription(userId, paymentData) {
        const subscriptionId = this.generateSubscriptionId();
        const duration = parseInt(process.env.SUBSCRIPTION_DURATION_DAYS) || 30;
        const startDate = moment();
        const endDate = startDate.clone().add(duration, 'days');

        const subscription = {
            id: subscriptionId,
            userId: userId,
            paymentId: paymentData.payment_id,
            orderId: paymentData.order_id,
            amount: paymentData.amount,
            currency: paymentData.currency || 'RUB',
            status: 'active',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.subscriptions.set(subscriptionId, subscription);
        this.payments.set(paymentData.order_id, subscriptionId);

        return {
            success: true,
            subscription: subscription
        };
    }

    /**
     * Обрабатывает уведомление о платеже от Продамус
     * @param {Object} paymentData - Данные платежа
     * @returns {Object} - Результат обработки
     */
    async processPayment(paymentData) {
        try {
            const { order_id, status, amount, currency } = paymentData;

            if (status !== 'success') {
                return {
                    success: false,
                    error: 'Payment not successful'
                };
            }

            // Проверяем, не обработан ли уже этот платеж
            if (this.payments.has(order_id)) {
                return {
                    success: false,
                    error: 'Payment already processed'
                };
            }

            // Получаем ID пользователя из custom_fields
            const userId = paymentData.custom_fields?.telegram_user_id;
            if (!userId) {
                return {
                    success: false,
                    error: 'User ID not found in payment data'
                };
            }

            // Создаем подписку
            const result = this.createSubscription(userId, {
                payment_id: paymentData.payment_id,
                order_id: order_id,
                amount: amount,
                currency: currency
            });

            if (result.success) {
                // Здесь можно добавить логику для добавления пользователя в канал
                await this.addUserToChannel(userId);
            }

            return result;
        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: 'Payment processing failed'
            };
        }
    }

    /**
     * Получает информацию о подписке пользователя
     * @param {string} userId - ID пользователя
     * @returns {Object|null} - Информация о подписке
     */
    getUserSubscription(userId) {
        for (const [id, subscription] of this.subscriptions) {
            if (subscription.userId === userId && subscription.status === 'active') {
                return subscription;
            }
        }
        return null;
    }

    /**
     * Проверяет, активна ли подписка пользователя
     * @param {string} userId - ID пользователя
     * @returns {boolean} - Статус подписки
     */
    isSubscriptionActive(userId) {
        const subscription = this.getUserSubscription(userId);
        if (!subscription) {
            return false;
        }

        const now = moment();
        const endDate = moment(subscription.endDate);
        
        return now.isBefore(endDate);
    }

    /**
     * Продлевает подписку
     * @param {string} userId - ID пользователя
     * @param {number} days - Количество дней для продления
     * @returns {Object} - Результат продления
     */
    extendSubscription(userId, days) {
        const subscription = this.getUserSubscription(userId);
        if (!subscription) {
            return {
                success: false,
                error: 'No active subscription found'
            };
        }

        const currentEndDate = moment(subscription.endDate);
        const newEndDate = currentEndDate.add(days, 'days');

        subscription.endDate = newEndDate.toISOString();
        subscription.updatedAt = new Date().toISOString();

        return {
            success: true,
            subscription: subscription
        };
    }

    /**
     * Отменяет подписку
     * @param {string} userId - ID пользователя
     * @returns {Object} - Результат отмены
     */
    cancelSubscription(userId) {
        const subscription = this.getUserSubscription(userId);
        if (!subscription) {
            return {
                success: false,
                error: 'No active subscription found'
            };
        }

        subscription.status = 'cancelled';
        subscription.updatedAt = new Date().toISOString();

        // Удаляем пользователя из канала
        this.removeUserFromChannel(userId);

        return {
            success: true,
            subscription: subscription
        };
    }

    /**
     * Получает статистику подписок
     * @returns {Object} - Статистика
     */
    getSubscriptionStats() {
        const total = this.subscriptions.size;
        const active = Array.from(this.subscriptions.values())
            .filter(sub => sub.status === 'active').length;
        const cancelled = Array.from(this.subscriptions.values())
            .filter(sub => sub.status === 'cancelled').length;

        return {
            total,
            active,
            cancelled
        };
    }

    /**
     * Добавляет пользователя в канал (заглушка)
     * @param {string} userId - ID пользователя
     */
    async addUserToChannel(userId) {
        // Здесь должна быть логика добавления пользователя в канал
        console.log(`Adding user ${userId} to channel`);
    }

    /**
     * Удаляет пользователя из канала (заглушка)
     * @param {string} userId - ID пользователя
     */
    async removeUserFromChannel(userId) {
        // Здесь должна быть логика удаления пользователя из канала
        console.log(`Removing user ${userId} from channel`);
    }

    /**
     * Генерирует уникальный ID подписки
     * @returns {string} - ID подписки
     */
    generateSubscriptionId() {
        return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

module.exports = SubscriptionService;
