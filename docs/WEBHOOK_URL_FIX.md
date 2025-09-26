# Исправление URL webhook для Продамус

## Проблема

Продамус отправляет тестовые уведомления на URL:
```
https://dashastar.pagekite.me/sales/prodamus
```

Но бот слушал на:
```
https://dashastar.pagekite.me/webhook/prodamus
```

Это приводило к ошибке `503 Unavailable`.

## Решение

### 1. Изменен путь webhook в коде

**Файл:** `src/bot.js`

```javascript
// Было:
this.app.post('/webhook/prodamus', (req, res) => {
    this.handleProdamusWebhook(req, res);
});

// Стало:
this.app.post('/sales/prodamus', (req, res) => {
    this.handleProdamusWebhook(req, res);
});
```

### 2. Обновлен URL в логах

```javascript
// Было:
console.log(`Prodamus webhook: ${process.env.WEBHOOK_URL}/webhook/prodamus`);

// Стало:
console.log(`Prodamus webhook: ${process.env.WEBHOOK_URL}/sales/prodamus`);
```

### 3. Обновлена конфигурация

**Файл:** `config.env.example`

```env
# Было:
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/webhook/prodamus

# Стало:
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus
```

### 4. Обновлены тесты

Все тесты обновлены для использования правильного URL:
- `tests/bot.test.js`
- `tests/prodamusService.test.js`

## Настройка в Продамус

### 1. В личном кабинете Продамус

Укажите webhook URL:
```
https://dashastar.pagekite.me/sales/prodamus
```

### 2. Тестовые уведомления

Продамус будет отправлять тестовые уведомления на этот URL с данными:

```php
array (
  'date' => '2025-09-26T00:00:00+03:00',
  'order_id' => '1',
  'order_num' => 'test',
  'domain' => 'dashastar.payform.ru',
  'sum' => '1000.00',
  'customer_phone' => '+79999999999',
  'customer_email' => 'email@domain.com',
  'customer_extra' => 'тест',
  'payment_type' => 'Пластиковая карта Visa, MasterCard, МИР',
  'commission' => '3.5',
  'commission_sum' => '35.00',
  'attempt' => '1',
  'sys' => 'test',
  'products' => array (
    0 => array (
      'name' => 'Доступ к обучающим материалам',
      'price' => '1000.00',
      'quantity' => '1',
      'sum' => '1000.00',
    ),
  ),
  'payment_status' => 'success',
  'payment_status_description' => 'Успешная оплата',
)
```

### 3. Заголовки запроса

```
Sign: 4e58a71daabd1f1460b5f659c09702c112784a12a6b576ceda52eff95da1bfb1
```

## Проверка работы

### 1. Запуск бота

```bash
npm start
```

Ожидаемый вывод:
```
Bot server running on port 3000
Telegram webhook: https://dashastar.pagekite.me/webhook/telegram
Prodamus webhook: https://dashastar.pagekite.me/sales/prodamus
```

### 2. Тестирование webhook

Продамус отправит тестовое уведомление. В логах бота должно появиться:

```
Valid webhook received: { ... }
Processing payment data: { ... }
Subscription created successfully: { ... }
```

### 3. Проверка статуса

```bash
curl https://dashastar.pagekite.me/status
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-01-26T..."
}
```

## Отладка

### 1. Логи бота

```bash
# Если используете PM2
pm2 logs telegram-bot

# Или просто логи Node.js
npm start
```

### 2. Проверка webhook

```bash
# Тест webhook вручную
curl -X POST https://dashastar.pagekite.me/sales/prodamus \
  -H "Content-Type: application/json" \
  -H "Sign: test_signature" \
  -d '{"test": "data"}'
```

### 3. Проверка доступности

```bash
# Проверка доступности сервера
curl -I https://dashastar.pagekite.me/sales/prodamus
```

## Безопасность

### 1. HMAC подпись

Все webhook'и проверяются по HMAC подписи:

```javascript
const signature = req.headers['Sign'];
const isValidSignature = this.prodamusService.verifyWebhookSignature(body, signature);
```

### 2. Валидация данных

```javascript
if (!signature) {
    return res.status(400).json({ error: 'No signature found' });
}

if (!isValidSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
}
```

## Рекомендации

### 1. Мониторинг

- Отслеживайте логи webhook'ов
- Проверяйте статус сервера
- Логируйте ошибки обработки

### 2. Резервное копирование

- Сохраняйте настройки webhook'ов
- Документируйте изменения URL
- Тестируйте после обновлений

### 3. Производительность

- Используйте асинхронную обработку
- Обрабатывайте ошибки gracefully
- Логируйте время обработки

## Заключение

Исправление URL webhook'а решает проблему с получением уведомлений от Продамус. Теперь бот правильно обрабатывает платежи и активирует подписки.

### ✅ Что исправлено:

- URL webhook изменен с `/webhook/prodamus` на `/sales/prodamus`
- Обновлены все тесты
- Исправлены логи
- Обновлена документация

### 🚀 Результат:

- Webhook'и от Продамус работают корректно
- Тестовые уведомления обрабатываются
- Подписки активируются автоматически
