class BotHandlers {
    constructor(bot, prodamusService, subscriptionService) {
        this.bot = bot;
        this.prodamusService = prodamusService;
        this.subscriptionService = subscriptionService;
    }

    /**
     * Обработчик команды /start
     */
    async handleStart(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const firstName = msg.from.first_name;

        const welcomeText = `
👋 Привет, ${firstName}!

Добро пожаловать в наш бот для подписки на закрытый канал!

🎯 Что вы получите:
• Доступ к эксклюзивному контенту
• Прямые эфиры и Q&A сессии
• Закрытое сообщество единомышленников

💰 Стоимость подписки: ${process.env.SUBSCRIPTION_PRICE || 1000} ₽
⏰ Срок действия: ${process.env.SUBSCRIPTION_DURATION_DAYS || 30} дней

Используйте /subscribe для оформления подписки или /help для получения помощи.
        `;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💳 Оформить подписку', callback_data: 'subscribe' },
                        { text: 'ℹ️ Помощь', callback_data: 'help' }
                    ],
                    [
                        { text: '📊 Статус подписки', callback_data: 'status' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, welcomeText, keyboard);
    }

    /**
     * Обработчик команды /help
     */
    async handleHelp(msg) {
        const chatId = msg.chat.id;

        const helpText = `
📖 Справка по боту

🔹 /start - Начать работу с ботом
🔹 /subscribe - Оформить подписку
🔹 /status - Проверить статус подписки
🔹 /help - Показать эту справку

💳 Процесс оплаты:
1. Нажмите "Оформить подписку"
2. Выберите способ оплаты
3. Оплатите заказ
4. Получите доступ к каналу

❓ Если у вас возникли проблемы:
• Проверьте статус подписки командой /status
• Убедитесь, что платеж прошел успешно
• Обратитесь к администратору

📞 Поддержка: @admin_username
        `;

        await this.bot.sendMessage(chatId, helpText);
    }

    /**
     * Обработчик команды /subscribe
     */
    async handleSubscribe(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Проверяем, есть ли уже активная подписка
        const existingSubscription = this.subscriptionService.getUserSubscription(userId);
        if (existingSubscription && this.subscriptionService.isSubscriptionActive(userId)) {
            const endDate = new Date(existingSubscription.endDate).toLocaleDateString('ru-RU');
            await this.bot.sendMessage(chatId, 
                `✅ У вас уже есть активная подписка до ${endDate}`
            );
            return;
        }

        const price = process.env.SUBSCRIPTION_PRICE || 1000;
        const duration = process.env.SUBSCRIPTION_DURATION_DAYS || 30;

        const subscriptionText = `
💳 Оформление подписки

📋 Детали подписки:
• Стоимость: ${price} ₽
• Срок действия: ${duration} дней
• Доступ к закрытому каналу

Нажмите кнопку ниже для перехода к оплате:
        `;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💳 Оплатить подписку', callback_data: 'create_payment' }
                    ],
                    [
                        { text: '❌ Отмена', callback_data: 'cancel' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, subscriptionText, keyboard);
    }

    /**
     * Обработчик команды /status
     */
    async handleStatus(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        const subscription = this.subscriptionService.getUserSubscription(userId);
        
        if (!subscription) {
            await this.bot.sendMessage(chatId, 
                '❌ У вас нет активной подписки.\n\nИспользуйте /subscribe для оформления подписки.'
            );
            return;
        }

        const isActive = this.subscriptionService.isSubscriptionActive(userId);
        const endDate = new Date(subscription.endDate).toLocaleDateString('ru-RU');
        const startDate = new Date(subscription.startDate).toLocaleDateString('ru-RU');

        const statusText = `
📊 Статус подписки

${isActive ? '✅ Активна' : '❌ Истекла'}
📅 Период: ${startDate} - ${endDate}
💰 Сумма: ${subscription.amount} ${subscription.currency}
🆔 ID подписки: ${subscription.id}

${isActive ? '🎉 Вы имеете доступ к закрытому каналу!' : '💳 Оформите новую подписку командой /subscribe'}
        `;

        await this.bot.sendMessage(chatId, statusText);
    }

    /**
     * Обработчик команды /admin
     */
    async handleAdmin(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Проверяем права администратора (в реальном проекте должна быть проверка)
        const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
        if (!adminIds.includes(userId.toString())) {
            await this.bot.sendMessage(chatId, '❌ У вас нет прав администратора');
            return;
        }

        const stats = this.subscriptionService.getSubscriptionStats();
        
        const adminText = `
👨‍💼 Панель администратора

📊 Статистика подписок:
• Всего подписок: ${stats.total}
• Активных: ${stats.active}
• Отмененных: ${stats.cancelled}

🔧 Доступные команды:
• /admin_stats - Подробная статистика
• /admin_users - Список пользователей
        `;

        await this.bot.sendMessage(chatId, adminText);
    }

    /**
     * Обработчик callback query (кнопки)
     */
    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        const data = callbackQuery.data;

        try {
            switch (data) {
                case 'subscribe':
                    await this.handleSubscribe({ chat: { id: chatId }, from: { id: userId } });
                    break;

                case 'help':
                    await this.handleHelp({ chat: { id: chatId }, from: { id: userId } });
                    break;

                case 'status':
                    await this.handleStatus({ chat: { id: chatId }, from: { id: userId } });
                    break;

                case 'create_payment':
                    await this.createPayment(chatId, userId);
                    break;

                case 'cancel':
                    await this.bot.sendMessage(chatId, '❌ Операция отменена');
                    break;

                default:
                    await this.bot.answerCallbackQuery(callbackQuery.id, 'Неизвестная команда');
            }
        } catch (error) {
            console.error('Callback query error:', error);
            await this.bot.answerCallbackQuery(callbackQuery.id, 'Произошла ошибка');
        }

        await this.bot.answerCallbackQuery(callbackQuery.id);
    }

    /**
     * Создает платеж через Продамус
     */
    async createPayment(chatId, userId) {
        try {
            const price = parseInt(process.env.SUBSCRIPTION_PRICE) || 1000;
            // Генерируем 5-значный номер заказа
            const orderId = Math.floor(10000 + Math.random() * 90000).toString();
            
            const paymentData = {
                userId: userId,
                amount: price,
                description: `Подписка на закрытый канал (${process.env.SUBSCRIPTION_DURATION_DAYS || 30} дней)`,
                orderId: orderId
            };

            const result = await this.prodamusService.createPayment(paymentData);

            if (result.success) {
                const paymentText = `
💳 Платеж создан

🔗 Ссылка для оплаты: ${result.paymentUrl}

⚠️ Важно:
• Оплата должна быть произведена в течение 15 минут
• После успешной оплаты вы автоматически получите доступ к каналу
• Сохраните ID заказа: ${orderId}

Если у вас возникли проблемы с оплатой, обратитесь к администратору.
                `;

                await this.bot.sendMessage(chatId, paymentText);
            } else {
                await this.bot.sendMessage(chatId, 
                    `❌ Ошибка создания платежа: ${result.error}\n\nПопробуйте позже или обратитесь к администратору.`
                );
            }
        } catch (error) {
            console.error('Payment creation error:', error);
            await this.bot.sendMessage(chatId, 
                '❌ Произошла ошибка при создании платежа. Попробуйте позже.'
            );
        }
    }
}

module.exports = BotHandlers;
