# Интеграция с REST API Продамус

Согласно [документации Продамус по управлению статусами подписки](https://help.prodamus.ru/payform/integracii/rest-api-1/setactivity), мы можем использовать REST API для управления подписками без ошибок подписи.

## Преимущества REST API

### 1. Надежность
- ✅ Нет ошибок подписи при создании платежей
- ✅ Прямое управление подписками через API
- ✅ Стандартизированные HTTP запросы

### 2. Функциональность
- ✅ Активация/деактивация подписок
- ✅ Управление от лица менеджера и пользователя
- ✅ Отписка пользователей

## Настройка

### 1. Переменные окружения

Добавьте в `.env` файл:

```env
# Prodamus REST API
PRODAMUS_REST_API_URL=https://demo.payform.ru
PRODAMUS_SHOP_ID=your_shop_id
PRODAMUS_SECRET_KEY=your_secret_key
```

### 2. URL для разных окружений

- **Демо:** `https://demo.payform.ru`
- **Продакшн:** `https://payform.ru`

## Использование

### 1. Активация подписки

```javascript
const prodamusService = new ProdamusService();

// Активация от лица менеджера
const result = await prodamusService.activateSubscription('subscription_id', 'telegram_user_id');

if (result.success) {
    console.log('Подписка активирована');
} else {
    console.error('Ошибка активации:', result.error);
}
```

### 2. Деактивация подписки

```javascript
// Деактивация от лица менеджера
const result = await prodamusService.deactivateSubscription('subscription_id', 'telegram_user_id');

if (result.success) {
    console.log('Подписка деактивирована');
}
```

### 3. Отписка пользователя

```javascript
// Отписка от лица пользователя
const result = await prodamusService.unsubscribeUser('subscription_id', 'telegram_user_id');

if (result.success) {
    console.log('Пользователь отписан');
}
```

## API Методы

### setSubscriptionActivity

Управляет статусом подписки:

```javascript
await prodamusService.setSubscriptionActivity({
    subscriptionId: '123',
    tgUserId: '456',
    activeManager: 1  // 1 - активировать, 0 - деактивировать
});
```

### activateSubscription

Активирует подписку от лица менеджера:

```javascript
await prodamusService.activateSubscription('subscription_id', 'telegram_user_id');
```

### deactivateSubscription

Деактивирует подписку от лица менеджера:

```javascript
await prodamusService.deactivateSubscription('subscription_id', 'telegram_user_id');
```

### unsubscribeUser

Отписывает пользователя от подписки:

```javascript
await prodamusService.unsubscribeUser('subscription_id', 'telegram_user_id');
```

## Параметры запроса

### Обязательные параметры

- `subscription` - ID подписки
- `tg_user_id` - ID пользователя Telegram
- `signature` - HMAC подпись

### Параметры статуса

- `active_manager` - Статус от лица менеджера (0/1)
- `active_user` - Статус от лица пользователя (0/1)

## Обработка ответов

### Успешный ответ

```json
{
  "success": "success"
}
```

### Ошибки

- `400` - Не передана подпись запроса
- `signature not found in request` - Отсутствует подпись

## Интеграция с ботом

### 1. Обработка webhook'ов

```javascript
// В webhook обработчике
app.post('/webhook/prodamus', async (req, res) => {
    const { subscription_id, status, tg_user_id } = req.body;
    
    if (status === 'success') {
        // Активируем подписку через REST API
        const result = await prodamusService.activateSubscription(
            subscription_id, 
            tg_user_id
        );
        
        if (result.success) {
            // Добавляем пользователя в канал
            await addUserToChannel(tg_user_id);
        }
    }
    
    res.json({ status: 'success' });
});
```

### 2. Команды администратора

```javascript
// Деактивация подписки
bot.onText(/\/deactivate (.+)/, async (msg, match) => {
    const subscriptionId = match[1];
    const userId = msg.from.id;
    
    const result = await prodamusService.deactivateSubscription(subscriptionId, userId);
    
    if (result.success) {
        bot.sendMessage(msg.chat.id, 'Подписка деактивирована');
    } else {
        bot.sendMessage(msg.chat.id, 'Ошибка деактивации: ' + result.error);
    }
});
```

## Тестирование

### 1. Запуск тестов

```bash
npm test -- restApi.test.js
```

### 2. Тест активации подписки

```bash
# Создайте тестовый скрипт
cat > test-rest-api.js << 'EOF'
const ProdamusService = require('./src/services/prodamusService');

async function testRestApi() {
    const service = new ProdamusService();
    
    // Тест активации
    const result = await service.activateSubscription('test_subscription', 'test_user');
    console.log('Activation result:', result);
}

testRestApi().catch(console.error);
EOF

node test-rest-api.js
```

## Безопасность

### 1. HMAC подпись

Все запросы к REST API подписываются HMAC подписью:

```javascript
const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
```

### 2. Валидация данных

```javascript
// Проверка обязательных параметров
if (!subscriptionId || !tgUserId) {
    throw new Error('Missing required parameters');
}
```

## Мониторинг

### 1. Логирование

```javascript
console.log('REST API request:', {
    endpoint: '/rest/setActivity/',
    data: data,
    timestamp: new Date().toISOString()
});
```

### 2. Обработка ошибок

```javascript
try {
    const result = await prodamusService.activateSubscription(id, userId);
    // Обработка успешного результата
} catch (error) {
    console.error('REST API error:', error);
    // Обработка ошибки
}
```

## Рекомендации

### 1. Использование

- Используйте REST API для управления подписками
- Создавайте платежные ссылки с минимальными параметрами
- Обрабатывайте webhook'и для активации подписок

### 2. Отладка

- Логируйте все запросы к REST API
- Проверяйте ответы сервера
- Тестируйте в демо-окружении

### 3. Производительность

- Кэшируйте результаты запросов
- Используйте асинхронные операции
- Обрабатывайте ошибки gracefully

## Поддержка

Если возникают проблемы:

1. **Проверьте логи:** `pm2 logs telegram-bot`
2. **Обратитесь в поддержку Продамус:** support@prodamus.ru
3. **Создайте issue** в репозитории

## Заключение

Использование REST API Продамус решает проблему с ошибками подписи и предоставляет надежный способ управления подписками. Это современный подход к интеграции с платежными системами.
