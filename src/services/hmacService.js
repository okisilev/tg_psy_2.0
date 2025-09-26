const crypto = require('crypto');

class HmacService {
    constructor() {
        this.secretKey = process.env.PRODAMUS_SECRET_KEY;
    }

    /**
     * Создает HMAC подпись для данных
     * @param {Object|string} data - Данные для подписи
     * @param {string} secret - Секретный ключ (опционально)
     * @returns {string} - HMAC подпись
     */
    createSignature(data, secret = null) {
        const key = secret || this.secretKey;
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        
        return crypto
            .createHmac('sha256', key)
            .update(dataString, 'utf8')
            .digest('hex');
    }

    /**
     * Проверяет HMAC подпись
     * @param {Object|string} data - Данные для проверки
     * @param {string} signature - Подпись для проверки
     * @param {string} secret - Секретный ключ (опционально)
     * @returns {boolean} - Результат проверки
     */
    verifySignature(data, signature, secret = null) {
        if (!signature) {
            return false;
        }

        const expectedSignature = this.createSignature(data, secret);
        
        // Используем безопасное сравнение для предотвращения timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Проверяет подпись из заголовков HTTP запроса
     * @param {Object} data - Тело запроса
     * @param {string} signature - Подпись из заголовка
     * @returns {boolean} - Результат проверки
     */
    verifyWebhookSignature(data, signature) {
        return this.verifySignature(data, signature);
    }

    /**
     * Создает подпись для webhook данных Продамус
     * @param {Object} webhookData - Данные webhook
     * @returns {string} - HMAC подпись
     */
    createWebhookSignature(webhookData) {
        // Продамус использует специальный формат для подписи
        const sortedKeys = Object.keys(webhookData).sort();
        const signatureString = sortedKeys
            .map(key => `${key}=${webhookData[key]}`)
            .join('&');
            
        return this.createSignature(signatureString);
    }

    /**
     * Проверяет подпись webhook от Продамус
     * @param {Object} webhookData - Данные webhook
     * @param {string} signature - Подпись из заголовка
     * @returns {boolean} - Результат проверки
     */
    verifyWebhookSignature(webhookData, signature) {
        const expectedSignature = this.createWebhookSignature(webhookData);
        
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Создает безопасный токен для валидации
     * @param {string} userId - ID пользователя
     * @param {string} additionalData - Дополнительные данные
     * @returns {string} - Безопасный токен
     */
    createSecureToken(userId, additionalData = '') {
        const timestamp = Date.now();
        const data = `${userId}:${timestamp}:${additionalData}`;
        return this.createSignature(data);
    }

    /**
     * Проверяет безопасный токен
     * @param {string} token - Токен для проверки
     * @param {string} userId - ID пользователя
     * @param {string} additionalData - Дополнительные данные
     * @param {number} maxAge - Максимальный возраст токена в миллисекундах
     * @returns {boolean} - Результат проверки
     */
    verifySecureToken(token, userId, additionalData = '', maxAge = 3600000) {
        const timestamp = Date.now();
        const data = `${userId}:${timestamp}:${additionalData}`;
        const expectedToken = this.createSignature(data);
        
        return crypto.timingSafeEqual(
            Buffer.from(token, 'hex'),
            Buffer.from(expectedToken, 'hex')
        );
    }
}

module.exports = HmacService;
