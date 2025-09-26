const crypto = require('crypto');

class ProdamusService {
    constructor() {
        this.shopId = process.env.PRODAMUS_SHOP_ID;
        this.secretKey = process.env.PRODAMUS_SECRET_KEY;
        // URL вашей платежной страницы в Продамус
        this.paymentFormUrl = process.env.PRODAMUS_PAYMENT_FORM_URL;
        
        if (!this.paymentFormUrl) {
            throw new Error('PRODAMUS_PAYMENT_FORM_URL не настроен. Укажите URL вашей платежной страницы в .env файле');
        }
    }

    /**
     * Создает платежную ссылку в системе Продамус
     * @param {Object} paymentData - Данные платежа
     * @returns {Promise<Object>} - Результат создания платежа
     */
    async createPayment(paymentData) {
        try {
            const { userId, amount, description, orderId } = paymentData;
            
            // Формируем минимальные данные для платежной ссылки
            const data = {
                do: 'pay',
                sys: this.shopId,
                order_id: orderId
            };

            // Создаем HMAC подпись
            const signature = this.createHmacSignature(data);
            data.signature = signature;

            // Формируем URL с параметрами
            const paymentUrl = this.buildPaymentUrl(data);

            return {
                success: true,
                paymentUrl: paymentUrl,
                orderId: orderId
            };
        } catch (error) {
            console.error('Prodamus payment creation error:', error.message);
            return {
                success: false,
                error: 'Payment creation failed: ' + error.message
            };
        }
    }

    /**
     * Создает HMAC подпись для данных платежа
     * @param {Object} data - Данные для подписи
     * @returns {string} - HMAC подпись
     */
    createHmacSignature(data) {
        // Сортируем ключи для правильного формирования подписи
        const sortedKeys = Object.keys(data).sort();
        const signatureString = sortedKeys
            .map(key => `${key}=${data[key]}`)
            .join('&');
            
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(signatureString, 'utf8')
            .digest('hex');
    }

    /**
     * Формирует URL для платежной формы
     * @param {Object} data - Данные платежа
     * @returns {string} - URL платежной формы
     */
    buildPaymentUrl(data) {
        const params = new URLSearchParams();
        
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                params.append(key, data[key]);
            }
        });

        return `${this.paymentFormUrl}?${params.toString()}`;
    }

    /**
     * Проверяет HMAC подпись webhook от Продамус
     * @param {Object} webhookData - Данные webhook
     * @param {string} signature - Подпись из заголовка
     * @returns {boolean} - Результат проверки
     */
    verifyWebhookSignature(webhookData, signature) {
        try {
            // Создаем подпись на основе данных webhook
            const sortedKeys = Object.keys(webhookData).sort();
            const signatureString = sortedKeys
                .map(key => `${key}=${webhookData[key]}`)
                .join('&');
                
            const expectedSignature = crypto
                .createHmac('sha256', this.secretKey)
                .update(signatureString, 'utf8')
                .digest('hex');

            // Безопасное сравнение подписей
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (error) {
            console.error('HMAC verification error:', error);
            return false;
        }
    }

    /**
     * Управляет статусом подписки через REST API
     * @param {Object} subscriptionData - Данные подписки
     * @returns {Promise<Object>} - Результат операции
     */
    async setSubscriptionActivity(subscriptionData) {
        try {
            const { subscriptionId, tgUserId, activeManager, activeUser } = subscriptionData;
            
            const data = {
                subscription: subscriptionId,
                tg_user_id: tgUserId
            };

            // Добавляем статус в зависимости от того, кто управляет подпиской
            if (activeManager !== undefined) {
                data.active_manager = activeManager;
            } else if (activeUser !== undefined) {
                data.active_user = activeUser;
            }

            // Создаем подпись для REST API
            const signature = this.createHmacSignature(data);
            data.signature = signature;

            // Отправляем запрос к REST API
            const response = await this.makeRestApiRequest('/rest/setActivity/', data);

            return {
                success: true,
                response: response
            };
        } catch (error) {
            console.error('Prodamus setActivity error:', error.message);
            return {
                success: false,
                error: 'Subscription management failed: ' + error.message
            };
        }
    }

    /**
     * Активирует подписку от лица менеджера
     * @param {string} subscriptionId - ID подписки
     * @param {string} tgUserId - ID пользователя Telegram
     * @returns {Promise<Object>} - Результат активации
     */
    async activateSubscription(subscriptionId, tgUserId) {
        return await this.setSubscriptionActivity({
            subscriptionId: subscriptionId,
            tgUserId: tgUserId,
            activeManager: 1
        });
    }

    /**
     * Деактивирует подписку от лица менеджера
     * @param {string} subscriptionId - ID подписки
     * @param {string} tgUserId - ID пользователя Telegram
     * @returns {Promise<Object>} - Результат деактивации
     */
    async deactivateSubscription(subscriptionId, tgUserId) {
        return await this.setSubscriptionActivity({
            subscriptionId: subscriptionId,
            tgUserId: tgUserId,
            activeManager: 0
        });
    }

    /**
     * Отписывает пользователя от подписки
     * @param {string} subscriptionId - ID подписки
     * @param {string} tgUserId - ID пользователя Telegram
     * @returns {Promise<Object>} - Результат отписки
     */
    async unsubscribeUser(subscriptionId, tgUserId) {
        return await this.setSubscriptionActivity({
            subscriptionId: subscriptionId,
            tgUserId: tgUserId,
            activeUser: 0
        });
    }

    /**
     * Выполняет запрос к REST API Продамус
     * @param {string} endpoint - Конечная точка API
     * @param {Object} data - Данные для отправки
     * @returns {Promise<Object>} - Ответ API
     */
    async makeRestApiRequest(endpoint, data) {
        const axios = require('axios');
        const baseUrl = process.env.PRODAMUS_REST_API_URL || 'https://demo.payform.ru';
        
        try {
            const response = await axios.post(`${baseUrl}${endpoint}`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error) {
            console.error('REST API request error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = ProdamusService;
