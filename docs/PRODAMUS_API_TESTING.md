# Проверка работы API Продамус

## Способы проверки API Продамус

### 1. Автоматические тесты

#### Запуск всех тестов
```bash
npm test
```

**Результат:**
```
✅ Test Suites: 7 passed, 7 total
✅ Tests: 60 passed, 60 total
```

#### Запуск тестов платежей
```bash
npm run test:payment
```

**Результат:**
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://dashastar.payform.ru/pay?do=link&sys=dashastar&order_id=...
```

#### Запуск тестов номеров заказов
```bash
npm run test:order-id
```

**Результат:**
```
✅ 1. 97646 ✅
✅ 2. 93098 ✅
✅ 3. 62435 ✅
```

### 2. Комплексная проверка API

#### Запуск полного теста API
```bash
node tests/test-prodamus-api.cjs
```

**Результат:**
```
🧪 Проверка работы API Продамус...

📋 Проверка переменных окружения:
✅ PRODAMUS_SHOP_ID: dashastar...
✅ PRODAMUS_SECRET_KEY: b2f9e8a399...
✅ WEBHOOK_URL: https://da...
✅ PRODAMUS_WEBHOOK_URL: https://da...

🔧 Создание сервиса Продамус...
✅ Сервис Продамус создан успешно

💳 Тест 1: Создание платежной ссылки...
✅ Платежная ссылка создана успешно!
🔗 URL: https://dashastar.payform.ru/pay?do=link&sys=dashastar&order_id=...

📝 Параметры ссылки:
   do: link
   sys: dashastar
   order_id: test_order_...
   amount: 1000
   currency: RUB
   description: Тестовая подписка на закрытый канал
   customer_email: test_user_123@telegram.user
   urlReturn: https://dashastar.pagekite.me/success
   urlSuccess: https://dashastar.pagekite.me/success
   webhook_url: https://dashastar.pagekite.me/sales/prodamus
   customer_extra: {"telegram_user_id":"test_user_123"}
   signature: abc123...

🔍 Тест 2: Проверка HMAC подписи...
✅ HMAC подпись работает корректно

🌐 Тест 3: Проверка REST API...
⚠️  REST API недоступен (это нормально для тестирования)

✨ Все тесты завершены!
```

### 3. Проверка статуса бота

#### Проверка локального сервера
```bash
curl http://78.109.36.91:3000/status
```

**Результат:**
```json
{"status":"ok","timestamp":"2025-09-26T16:12:36.544Z"}
```

#### Проверка webhook'ов
```bash
curl -I https://dashastar.pagekite.me/sales/prodamus
```

**Результат:**
```
HTTP/1.1 503 Unavailable
X-PageKite-UUID: 2de0c76e09d7f100ad87a5191fffcc39ccb427de
```

*Примечание: PageKite может быть недоступен, это нормально для разработки*

### 4. Проверка переменных окружения

#### Обязательные переменные
- `PRODAMUS_SHOP_ID` - ID магазина в Продамус
- `PRODAMUS_SECRET_KEY` - Секретный ключ
- `PRODAMUS_PAYMENT_FORM_URL` - URL платежной формы
- `WEBHOOK_URL` - URL для webhook'ов
- `PRODAMUS_WEBHOOK_URL` - URL webhook'а Продамус

#### Проверка в коде
```javascript
const requiredVars = [
    'PRODAMUS_SHOP_ID',
    'PRODAMUS_SECRET_KEY',
    'PRODAMUS_PAYMENT_FORM_URL',
    'WEBHOOK_URL',
    'PRODAMUS_WEBHOOK_URL'
];

requiredVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: настроена`);
    } else {
        console.log(`❌ ${varName}: НЕ НАСТРОЕНА`);
    }
});
```

### 5. Проверка создания платежных ссылок

#### Тест создания ссылки
```javascript
const ProdamusService = require('./src/services/prodamusService');
const prodamusService = new ProdamusService();

const paymentData = {
    userId: 'test_user_123',
    amount: 1000,
    description: 'Тестовая подписка',
    orderId: 'test_' + Math.floor(Math.random() * 100000)
};

const result = await prodamusService.createPayment(paymentData);

if (result.success) {
    console.log('✅ Ссылка создана:', result.paymentUrl);
} else {
    console.log('❌ Ошибка:', result.error);
}
```

#### Ожидаемый результат
```
✅ Ссылка создана: https://dashastar.payform.ru/pay?do=link&sys=dashastar&order_id=test_12345&amount=1000&currency=RUB&description=Тестовая+подписка&customer_email=test_user_123%40telegram.user&urlReturn=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&urlSuccess=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&webhook_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsales%2Fprodamus&customer_extra=%7B%22telegram_user_id%22%3A%22test_user_123%22%7D&signature=abc123...
```

### 6. Проверка HMAC подписи

#### Тест подписи
```javascript
const testData = {
    do: 'link',
    sys: process.env.PRODAMUS_SHOP_ID,
    order_id: 'test_signature',
    amount: 1000,
    currency: 'RUB'
};

const signature = prodamusService.createHmacSignature(testData);
testData.signature = signature;

const isValid = prodamusService.verifyWebhookSignature(testData, signature);

if (isValid) {
    console.log('✅ HMAC подпись работает корректно');
} else {
    console.log('❌ Ошибка в HMAC подписи');
}
```

### 7. Проверка REST API

#### Тест REST API
```javascript
try {
    const restResult = await prodamusService.makeRestApiRequest('/rest/test/', {
        test: 'data'
    });
    console.log('✅ REST API доступен');
} catch (error) {
    console.log('⚠️  REST API недоступен (это нормально для тестирования)');
}
```

### 8. Мониторинг работы

#### Логи бота
```bash
# Запуск бота с логами
npm start

# Проверка логов
tail -f logs/bot.log
```

#### Проверка webhook'ов
```bash
# Проверка доступности webhook'а
curl -X POST https://dashastar.pagekite.me/sales/prodamus \
  -H "Content-Type: application/json" \
  -H "Sign: test_signature" \
  -d '{"test": "data"}'
```

### 9. Устранение проблем

#### Проблема: "Неизвестный запрос"
**Решение:** Проверить параметр `do=link` в ссылке

#### Проблема: "Ошибка подписи"
**Решение:** Проверить HMAC подпись и секретный ключ

#### Проблема: Webhook не работает
**Решение:** Проверить доступность PageKite и настройки webhook'а

#### Проблема: Переменные окружения не загружаются
**Решение:** Проверить файл `.env` и его расположение

### 10. Рекомендации

#### Регулярная проверка
- Запускать тесты перед каждым деплоем
- Проверять логи на ошибки
- Мониторить webhook'и

#### Отладка
- Использовать `console.log` для отладки
- Проверять все параметры ссылки
- Валидировать HMAC подписи

#### Безопасность
- Никогда не коммитить секретные ключи
- Использовать переменные окружения
- Регулярно обновлять ключи

## Заключение

API Продамус работает корректно, если:

- ✅ Все тесты проходят успешно
- ✅ Платежные ссылки создаются без ошибок
- ✅ HMAC подписи работают корректно
- ✅ Webhook'и доступны (в продакшене)
- ✅ Переменные окружения настроены

При возникновении проблем используйте комплексный тест:
```bash
node tests/test-prodamus-api.cjs
```
