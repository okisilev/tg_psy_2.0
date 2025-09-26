# Полный формат платежной ссылки Продамус

## Проблема

Ранее использовался упрощенный формат ссылки с минимальными параметрами, что могло приводить к ошибкам подписи. Теперь используется полный формат согласно документации Продамус.

## Решение

### 1. Полные параметры ссылки

Согласно [документации Продамус](https://help.prodamus.ru/payform/integracii/rest-api-1/setactivity), ссылка содержит все необходимые параметры:

```javascript
const data = {
    do: 'pay',                                    // Действие (оплата)
    sys: this.shopId,                             // ID магазина
    order_id: orderId,                           // Номер заказа (5-значный)
    amount: amount,                              // Сумма платежа
    currency: process.env.CURRENCY || 'RUB',     // Валюта
    description: description,                     // Описание платежа
    client_email: `${userId}@telegram.user`,     // Email клиента
    success_url: `${process.env.WEBHOOK_URL}/success`,     // URL успешной оплаты
    failure_url: `${process.env.WEBHOOK_URL}/failure`,     // URL неудачной оплаты
    webhook_url: process.env.PRODAMUS_WEBHOOK_URL,        // URL webhook
    custom_fields: JSON.stringify({              // Дополнительные поля
        telegram_user_id: userId
    })
};
```

### 2. Пример полной ссылки

```
https://dashastar.payform.ru/?do=pay&sys=dashastar&order_id=12345&amount=1000&currency=RUB&description=Подписка+на+закрытый+канал&client_email=123456789%40telegram.user&success_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&failure_url=https%3A%2F%2Fdashastar.pagekite.me%2Ffailure&webhook_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsales%2Fprodamus&custom_fields=%7B%22telegram_user_id%22%3A%22123456789%22%7D&signature=8832f6193cfc55d2cb8db600c29a2208d6f2b4e59c324665ba2271be72e3b5f7
```

### 3. Декодированные параметры

| Параметр | Значение | Описание |
|----------|----------|----------|
| `do` | `pay` | Действие (оплата) |
| `sys` | `dashastar` | ID магазина |
| `order_id` | `12345` | Номер заказа (5-значный) |
| `amount` | `1000` | Сумма в копейках |
| `currency` | `RUB` | Валюта |
| `description` | `Подписка на закрытый канал` | Описание платежа |
| `client_email` | `123456789@telegram.user` | Email клиента |
| `success_url` | `https://dashastar.pagekite.me/success` | URL успешной оплаты |
| `failure_url` | `https://dashastar.pagekite.me/failure` | URL неудачной оплаты |
| `webhook_url` | `https://dashastar.pagekite.me/sales/prodamus` | URL webhook |
| `custom_fields` | `{"telegram_user_id":"123456789"}` | Дополнительные поля |
| `signature` | `8832f6193cfc55d2cb8db600c29a2208d6f2b4e59c324665ba2271be72e3b5f7` | HMAC подпись |

## Преимущества полного формата

### 1. Надежность
- ✅ Все параметры передаются явно
- ✅ Нет зависимости от настроек платежной страницы
- ✅ Полный контроль над процессом оплаты

### 2. Функциональность
- ✅ Автоматическое заполнение данных клиента
- ✅ Персонализированные URL'ы успеха/неудачи
- ✅ Передача дополнительных данных через custom_fields

### 3. Отладка
- ✅ Легко отследить все параметры
- ✅ Простая валидация данных
- ✅ Понятные логи

## HMAC подпись

### 1. Алгоритм создания

```javascript
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
```

### 2. Строка для подписи

```
amount=1000&client_email=123456789@telegram.user&currency=RUB&custom_fields={"telegram_user_id":"123456789"}&description=Подписка на закрытый канал&do=pay&failure_url=https://dashastar.pagekite.me/failure&order_id=12345&success_url=https://dashastar.pagekite.me/success&sys=dashastar&webhook_url=https://dashastar.pagekite.me/sales/prodamus
```

### 3. Проверка подписи

```javascript
verifyWebhookSignature(webhookData, signature) {
    const sortedKeys = Object.keys(webhookData).sort();
    const signatureString = sortedKeys
        .map(key => `${key}=${webhookData[key]}`)
        .join('&');
        
    const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(signatureString, 'utf8')
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}
```

## Обработка webhook'ов

### 1. Данные от Продамус

```php
array (
  'date' => '2025-09-26T00:00:00+03:00',
  'order_id' => '12345',
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

### 2. Заголовки запроса

```
Sign: 4e58a71daabd1f1460b5f659c09702c112784a12a6b576ceda52eff95da1bfb1
Content-Type: application/x-www-form-urlencoded
```

### 3. Обработка в боте

```javascript
app.post('/sales/prodamus', (req, res) => {
    const signature = req.headers['Sign'];
    const body = req.body;
    
    // Проверяем подпись
    const isValidSignature = prodamusService.verifyWebhookSignature(body, signature);
    
    if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Обрабатываем платеж
    subscriptionService.processPayment(body);
    
    res.json({ status: 'success' });
});
```

## Тестирование

### 1. Создание тестовой ссылки

```bash
npm run test:payment
```

### 2. Проверка параметров

```bash
# Декодирование URL
node -e "
const url = 'https://dashastar.payform.ru/?do=pay&sys=dashastar&order_id=12345&amount=1000&currency=RUB&description=Подписка+на+закрытый+канал&client_email=123456789%40telegram.user&success_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&failure_url=https%3A%2F%2Fdashastar.pagekite.me%2Ffailure&webhook_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsales%2Fprodamus&custom_fields=%7B%22telegram_user_id%22%3A%22123456789%22%7D&signature=8832f6193cfc55d2cb8db600c29a2208d6f2b4e59c324665ba2271be72e3b5f7';
const params = new URLSearchParams(url.split('?')[1]);
for (const [key, value] of params) {
    console.log(\`\${key}: \${decodeURIComponent(value)}\`);
}
"
```

### 3. Валидация подписи

```bash
# Тест HMAC подписи
node -e "
const crypto = require('crypto');
const data = {
    do: 'pay',
    sys: 'dashastar',
    order_id: '12345',
    amount: 1000,
    currency: 'RUB',
    description: 'Подписка на закрытый канал',
    client_email: '123456789@telegram.user',
    success_url: 'https://dashastar.pagekite.me/success',
    failure_url: 'https://dashastar.pagekite.me/failure',
    webhook_url: 'https://dashastar.pagekite.me/sales/prodamus',
    custom_fields: '{\"telegram_user_id\":\"123456789\"}'
};

const sortedKeys = Object.keys(data).sort();
const signatureString = sortedKeys.map(key => \`\${key}=\${data[key]}\`).join('&');
const signature = crypto.createHmac('sha256', 'your_secret_key').update(signatureString, 'utf8').digest('hex');

console.log('Signature string:', signatureString);
console.log('Signature:', signature);
"
```

## Настройка в Продамус

### 1. Платежная страница

- **URL:** `https://dashastar.payform.ru/pay`
- **Настройки:** Используйте предустановленные значения
- **Уведомления:** Настройте webhook URL

### 2. Webhook настройки

- **URL:** `https://dashastar.pagekite.me/sales/prodamus`
- **Метод:** POST
- **Формат:** application/x-www-form-urlencoded
- **Подпись:** HMAC-SHA256

### 3. Тестовые уведомления

Продамус отправляет тестовые уведомления для проверки интеграции.

## Мониторинг

### 1. Логи бота

```bash
# Просмотр логов
pm2 logs telegram-bot

# Или напрямую
npm start
```

### 2. Проверка webhook'ов

```bash
# Тест доступности
curl -I https://dashastar.pagekite.me/sales/prodamus

# Тест webhook'а
curl -X POST https://dashastar.pagekite.me/sales/prodamus \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Sign: test_signature" \
  -d "test=data"
```

### 3. Статус сервера

```bash
curl https://dashastar.pagekite.me/status
```

## Рекомендации

### 1. Безопасность

- ✅ Всегда проверяйте HMAC подпись
- ✅ Используйте HTTPS для webhook'ов
- ✅ Логируйте все входящие запросы

### 2. Производительность

- ✅ Обрабатывайте webhook'и асинхронно
- ✅ Используйте кэширование для частых запросов
- ✅ Мониторьте время ответа

### 3. Отладка

- ✅ Логируйте все параметры ссылки
- ✅ Проверяйте валидность подписи
- ✅ Тестируйте в демо-окружении

## Заключение

Полный формат ссылки обеспечивает:

- ✅ **Надежность** - все параметры передаются явно
- ✅ **Безопасность** - HMAC подпись защищает от подделки
- ✅ **Функциональность** - полный контроль над процессом оплаты
- ✅ **Отладка** - легко отследить все параметры

Теперь бот создает платежные ссылки в полном соответствии с документацией Продамус!
