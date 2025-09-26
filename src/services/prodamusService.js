const axios = require('axios');

class ProdamusService {
    constructor() {
        this.shopId = process.env.PRODAMUS_SHOP_ID;
        this.apiKey = process.env.PRODAMUS_API_KEY;
        this.secretKey = process.env.PRODAMUS_SECRET_KEY;
        this.baseUrl = 'https://api.prodamus.ru';
    }

    /**
     * Создает платеж в системе Продамус
     * @param {Object} paymentData - Данные платежа
     * @returns {Promise<Object>} - Результат создания платежа
     */
    async createPayment(paymentData) {
        try {
            const { userId, amount, description, orderId } = paymentData;
            
            const paymentParams = {
                shop_id: this.shopId,
                order_id: orderId,
                amount: amount,
                currency: process.env.CURRENCY || 'RUB',
                description: description,
                client_email: `${userId}@telegram.user`,
                success_url: `${process.env.WEBHOOK_URL}/success`,
                failure_url: `${process.env.WEBHOOK_URL}/failure`,
                webhook_url: process.env.PRODAMUS_WEBHOOK_URL,
                custom_fields: {
                    telegram_user_id: userId
                }
            };

            const response = await axios.post(`${this.baseUrl}/api/payments`, paymentParams, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                paymentUrl: response.data.payment_url,
                paymentId: response.data.payment_id
            };
        } catch (error) {
            console.error('Prodamus payment creation error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Payment creation failed'
            };
        }
    }

    /**
     * Получает информацию о платеже
     * @param {string} paymentId - ID платежа
     * @returns {Promise<Object>} - Информация о платеже
     */
    async getPaymentInfo(paymentId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return {
                success: true,
                payment: response.data
            };
        } catch (error) {
            console.error('Prodamus payment info error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get payment info'
            };
        }
    }

    /**
     * Проверяет статус платежа
     * @param {string} orderId - ID заказа
     * @returns {Promise<Object>} - Статус платежа
     */
    async checkPaymentStatus(orderId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/orders/${orderId}/status`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return {
                success: true,
                status: response.data.status,
                payment: response.data
            };
        } catch (error) {
            console.error('Prodamus payment status error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to check payment status'
            };
        }
    }

    /**
     * Создает возврат платежа
     * @param {string} paymentId - ID платежа
     * @param {number} amount - Сумма возврата
     * @returns {Promise<Object>} - Результат возврата
     */
    async createRefund(paymentId, amount) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/refunds`, {
                payment_id: paymentId,
                amount: amount
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                refundId: response.data.refund_id
            };
        } catch (error) {
            console.error('Prodamus refund error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Refund creation failed'
            };
        }
    }
}

module.exports = ProdamusService;
