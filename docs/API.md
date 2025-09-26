# API Документация

Документация по API endpoints и интеграции с внешними сервисами.

## Внутренние Endpoints

### GET /status

Проверка статуса сервера.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /webhook/telegram

Webhook для получения обновлений от Telegram.

**Заголовки:**
- `Content-Type: application/json`

**Тело запроса:** Обновление от Telegram API

### POST /webhook/prodamus

Webhook для получения уведомлений о платежах от Продамус.

**Заголовки:**
- `Content-Type: application/json`
- `x-prodamus-signature`: HMAC подпись

**Тело запроса:**
```json
{
  "order_id": "order_123",
  "payment_id": "pay_123",
  "status": "success",
  "amount": "1000",
  "currency": "RUB",
  "custom_fields": {
    "telegram_user_id": "123456789"
  }
}
```

**Ответ:**
```json
{
  "status": "success"
}
```

## Интеграция с Продамус API

### Создание платежа

```javascript
const prodamusService = new ProdamusService();

const paymentData = {
  userId: '123456789',
  amount: 1000,
  description: 'Подписка на закрытый канал',
  orderId: 'order_123'
};

const result = await prodamusService.createPayment(paymentData);
```

### Проверка статуса платежа

```javascript
const result = await prodamusService.checkPaymentStatus('order_123');
```

### Создание возврата

```javascript
const result = await prodamusService.createRefund('pay_123', 500);
```

## HMAC Подтверждение

### Создание подписи

```javascript
const hmacService = new HmacService();

// Для обычных данных
const signature = hmacService.createSignature(data);

// Для webhook данных Продамус
const signature = hmacService.createWebhookSignature(webhookData);
```

### Проверка подписи

```javascript
// Проверка обычной подписи
const isValid = hmacService.verifySignature(data, signature);

// Проверка webhook подписи
const isValid = hmacService.verifyWebhookSignature(webhookData, signature);
```

## Управление подписками

### Создание подписки

```javascript
const subscriptionService = new SubscriptionService();

const result = subscriptionService.createSubscription(userId, paymentData);
```

### Проверка статуса подписки

```javascript
// Получение подписки пользователя
const subscription = subscriptionService.getUserSubscription(userId);

// Проверка активности
const isActive = subscriptionService.isSubscriptionActive(userId);
```

### Продление подписки

```javascript
const result = subscriptionService.extendSubscription(userId, 7); // 7 дней
```

### Отмена подписки

```javascript
const result = subscriptionService.cancelSubscription(userId);
```

## Telegram Bot API

### Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Начать работу с ботом |
| `/help` | Справка по командам |
| `/subscribe` | Оформить подписку |
| `/status` | Проверить статус подписки |
| `/admin` | Панель администратора |

### Callback Query

Бот поддерживает inline кнопки с следующими callback_data:

- `subscribe` - Оформить подписку
- `help` - Показать справку
- `status` - Проверить статус
- `create_payment` - Создать платеж
- `cancel` - Отменить операцию

## Обработка ошибок

### Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Неверная подпись |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

### Примеры ошибок

```json
{
  "error": "Invalid signature"
}
```

```json
{
  "error": "Payment creation failed"
}
```

## Webhook события

### Telegram Webhook

Бот обрабатывает следующие события от Telegram:

- `message` - Текстовые сообщения
- `callback_query` - Нажатия на inline кнопки

### Продамус Webhook

Бот обрабатывает следующие события от Продамус:

- `payment.success` - Успешный платеж
- `payment.failed` - Неудачный платеж
- `payment.cancelled` - Отмененный платеж

## Безопасность

### HMAC Подпись

Все webhook'и от Продамус должны содержать валидную HMAC подпись в заголовке `x-prodamus-signature`.

### Валидация данных

Все входящие данные проходят валидацию:

- Проверка формата JSON
- Валидация обязательных полей
- Проверка типов данных

### Rate Limiting

Рекомендуется настроить rate limiting для предотвращения злоупотреблений:

```javascript
// Пример с express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов
});

app.use('/webhook', limiter);
```

## Мониторинг

### Логирование

Бот логирует следующие события:

- Создание платежей
- Обработка webhook'ов
- Ошибки и исключения
- Действия пользователей

### Метрики

Рекомендуется отслеживать:

- Количество активных подписок
- Конверсия платежей
- Время ответа API
- Ошибки обработки

## Примеры использования

### Полный цикл подписки

```javascript
// 1. Пользователь нажимает /subscribe
bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // 2. Создаем платеж
  const paymentData = {
    userId: userId,
    amount: 1000,
    description: 'Подписка на канал',
    orderId: `order_${userId}_${Date.now()}`
  };
  
  const result = await prodamusService.createPayment(paymentData);
  
  if (result.success) {
    // 3. Отправляем ссылку для оплаты
    await bot.sendMessage(chatId, `Ссылка для оплаты: ${result.paymentUrl}`);
  }
});

// 4. Обрабатываем webhook от Продамус
app.post('/webhook/prodamus', async (req, res) => {
  const { body } = req;
  
  // Проверяем подпись
  const isValid = hmacService.verifyWebhookSignature(body, req.headers['x-prodamus-signature']);
  
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Обрабатываем платеж
  if (body.status === 'success') {
    await subscriptionService.processPayment(body);
    
    // Добавляем пользователя в канал
    const userId = body.custom_fields.telegram_user_id;
    await addUserToChannel(userId);
  }
  
  res.json({ status: 'success' });
});
```
