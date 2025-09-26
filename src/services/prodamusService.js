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
            
            // Формируем данные для создания платежной ссылки согласно документации Продамус
            const data = {
                do: 'pay',
                sys: this.shopId,
                order_id: orderId,
                customer_email: `${userId}@telegram.user`,
                customer_extra: JSON.stringify({
                    telegram_user_id: userId
                }),
                products: [
                    {
                        name: description,
                        price: amount.toString(),
                        quantity: '1',
                        tax: {
                            tax_type: 0  // без НДС
                        },
                        paymentMethod: 4,  // полная оплата в момент передачи предмета расчёта
                        paymentObject: 4   // услуга
                    }
                ],
                urlReturn: `${process.env.WEBHOOK_URL}/success`,
                urlSuccess: `${process.env.WEBHOOK_URL}/success`,
                urlNotification: process.env.PRODAMUS_WEBHOOK_URL,
                npd_income_type: 'FROM_INDIVIDUAL'
            };

            // Создаем HMAC подпись (без поля signature)
            const signature = this.createHmacSignature(data);
            data.signature = signature;

            // Формируем URL с параметрами согласно документации
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
        // Создаем копию данных без поля signature
        const dataForSignature = { ...data };
        delete dataForSignature.signature;
        
        // Обрабатываем вложенные объекты и массивы
        const processedData = this.processDataForSignature(dataForSignature);
        
        // Сортируем ключи для правильного формирования подписи
        const sortedKeys = Object.keys(processedData).sort();
        const signatureString = sortedKeys
            .map(key => `${key}=${processedData[key]}`)
            .join('&');
            
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(signatureString, 'utf8')
            .digest('hex');
    }

    /**
     * Обрабатывает данные для создания подписи (включая вложенные объекты)
     * @param {Object} data - Данные для обработки
     * @returns {Object} - Обработанные данные
     */
    processDataForSignature(data) {
        const processed = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                // Обрабатываем массивы (например, products)
                processed[key] = value.map((item, index) => {
                    if (typeof item === 'object') {
                        return this.processDataForSignature(item);
                    }
                    return item;
                });
            } else if (typeof value === 'object' && value !== null) {
                // Обрабатываем вложенные объекты
                processed[key] = this.processDataForSignature(value);
            } else {
                processed[key] = value;
            }
        }
        
        return processed;
    }

    /**
     * Создает ссылку на оплату через API Продамус согласно документации
     * @param {Object} data - Данные платежа
     * @returns {Promise<string>} - URL платежной формы
     */
    async createPaymentLinkViaApi(data) {
        try {
            const axios = require('axios');
            
            // Формируем URL для запроса (базовый URL без /pay)
            const apiUrl = this.paymentFormUrl.replace('/pay', '');
            
            // Делаем GET запрос к API Продамус согласно документации
            const response = await axios.get(apiUrl, {
                params: data,
                timeout: 10000,
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                }
            });

            // Проверяем ответ
            if (response.data && typeof response.data === 'string') {
                // Если ответ содержит URL, возвращаем его
                if (response.data.startsWith('http')) {
                    return response.data;
                }
                // Если ответ содержит HTML, извлекаем URL из него
                const urlMatch = response.data.match(/href="([^"]*pay[^"]*)"/);
                if (urlMatch) {
                    return urlMatch[1];
                }
                // Ищем ссылку на оплату в HTML
                const payUrlMatch = response.data.match(/href="([^"]*\/pay[^"]*)"/);
                if (payUrlMatch) {
                    return payUrlMatch[1];
                }
            }

            // Если не удалось извлечь URL, формируем его вручную
            return this.buildPaymentUrl(data);
            
        } catch (error) {
            console.error('Prodamus API request error:', error.message);
            // В случае ошибки API, формируем URL вручную
            return this.buildPaymentUrl(data);
        }
    }

    /**
     * Создает ссылку на оплату через API Продамус
     * @param {Object} data - Данные платежа
     * @returns {Promise<string>} - URL платежной формы
     */
    async createPaymentLink(data) {
        try {
            const axios = require('axios');
            
            // Формируем URL для запроса (базовый URL без /pay)
            const apiUrl = this.paymentFormUrl.replace('/pay', '');
            
            // Делаем GET запрос к API Продамус
            const response = await axios.get(apiUrl, {
                params: data,
                timeout: 10000
            });

            // Проверяем ответ
            if (response.data && typeof response.data === 'string') {
                // Если ответ содержит URL, возвращаем его
                if (response.data.startsWith('http')) {
                    return response.data;
                }
                // Если ответ содержит HTML, извлекаем URL из него
                const urlMatch = response.data.match(/href="([^"]*pay[^"]*)"/);
                if (urlMatch) {
                    return urlMatch[1];
                }
                // Ищем ссылку на оплату в HTML
                const payUrlMatch = response.data.match(/href="([^"]*\/pay[^"]*)"/);
                if (payUrlMatch) {
                    return payUrlMatch[1];
                }
            }

            // Если не удалось извлечь URL, формируем его вручную
            return this.buildPaymentUrl(data);
            
        } catch (error) {
            console.error('Prodamus API request error:', error.message);
            // В случае ошибки API, формируем URL вручную
            return this.buildPaymentUrl(data);
        }
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
                if (Array.isArray(data[key])) {
                    // Обрабатываем массивы (например, products)
                    data[key].forEach((item, index) => {
                        if (typeof item === 'object') {
                            // Обрабатываем объекты в массиве
                            Object.keys(item).forEach(subKey => {
                                if (typeof item[subKey] === 'object' && item[subKey] !== null) {
                                    // Обрабатываем вложенные объекты (например, tax)
                                    Object.keys(item[subKey]).forEach(subSubKey => {
                                        params.append(`${key}[${index}][${subKey}][${subSubKey}]`, item[subKey][subSubKey]);
                                    });
                                } else {
                                    params.append(`${key}[${index}][${subKey}]`, item[subKey]);
                                }
                            });
                        } else {
                            params.append(`${key}[${index}]`, item);
                        }
                    });
                } else if (typeof data[key] === 'object' && data[key] !== null) {
                    // Обрабатываем вложенные объекты
                    Object.keys(data[key]).forEach(subKey => {
                        params.append(`${key}[${subKey}]`, data[key][subKey]);
                    });
                } else {
                    params.append(key, data[key]);
                }
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
