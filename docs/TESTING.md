# Руководство по тестированию

Подробное руководство по тестированию Telegram бота для продажи подписок.

## Структура тестов

```
tests/
├── bot.test.js              # Тесты основного бота
├── hmacService.test.js      # Тесты HMAC сервиса
├── subscriptionService.test.js # Тесты сервиса подписок
├── prodamusService.test.js  # Тесты сервиса Продамус
├── botHandlers.test.js      # Тесты обработчиков бота
├── integration.test.js       # Интеграционные тесты
├── test-payment.js          # Тест создания платежей
├── test-order-id.js         # Тест генерации номеров заказов
└── setup.js                 # Настройка тестового окружения
```

## Запуск тестов

### Все тесты
```bash
npm test
```

### Тесты с покрытием
```bash
npm test -- --coverage
```

### Отдельные тесты
```bash
# Тесты сервисов
npm test -- hmacService.test.js
npm test -- subscriptionService.test.js
npm test -- prodamusService.test.js

# Тесты бота
npm test -- bot.test.js
npm test -- botHandlers.test.js

# Интеграционные тесты
npm test -- integration.test.js
```

### Тесты в режиме наблюдения
```bash
npm run test:watch
```

## Функциональные тесты

### Тест создания платежа
```bash
npm run test:payment
```

Ожидаемый результат:
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://dashastar.payform.ru/pay?...
```

### Тест генерации номеров заказов
```bash
node tests/test-order-id.js
```

Ожидаемый результат:
```
1. 58133 ✅
2. 47478 ✅
...
```

## Тестирование вручную

### 1. Тестирование бота

1. **Запустите бота:**
```bash
npm start
```

2. **Найдите бота в Telegram:**
   - Откройте Telegram
   - Найдите бота по username
   - Отправьте `/start`

3. **Протестируйте команды:**
   - `/start` - приветствие
   - `/help` - справка
   - `/subscribe` - оформление подписки
   - `/status` - статус подписки

### 2. Тестирование платежей

1. **Создайте тестовый платеж:**
   - Отправьте `/subscribe`
   - Нажмите "Оплатить подписку"
   - Скопируйте ссылку

2. **Проверьте ссылку:**
   - Откройте ссылку в браузере
   - Убедитесь, что открывается платежная страница
   - Проверьте, что все данные корректны

3. **Тестовая оплата:**
   - Используйте тестовые данные карты
   - Проверьте, что webhook приходит на сервер
   - Убедитесь, что подписка активируется

### 3. Тестирование webhook'ов

1. **Проверьте статус сервера:**
```bash
curl https://yourdomain.com/status
```

2. **Тест Telegram webhook:**
```bash
curl -X POST https://yourdomain.com/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"/start","chat":{"id":123},"from":{"id":456}}}'
```

3. **Тест Продамус webhook:**
```bash
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -H "Sign: test_signature" \
  -d '{"order_id":"12345","status":"success","amount":"1000"}'
```

## Нагрузочное тестирование

### 1. Тест множественных запросов

```bash
# Установите Apache Bench
sudo apt install apache2-utils

# Тест 100 запросов с 10 параллельными соединениями
ab -n 100 -c 10 https://yourdomain.com/status
```

### 2. Тест webhook'ов

```bash
# Создайте скрипт для тестирования
cat > test-webhooks.sh << 'EOF'
#!/bin/bash
for i in {1..50}; do
  curl -X POST https://yourdomain.com/webhook/prodamus \
    -H "Content-Type: application/json" \
    -H "Sign: test_signature" \
    -d "{\"order_id\":\"$i\",\"status\":\"success\",\"amount\":\"1000\"}" &
done
wait
echo "All requests completed"
EOF

chmod +x test-webhooks.sh
./test-webhooks.sh
```

## Тестирование безопасности

### 1. Тест HMAC подписей

```bash
# Тест с правильной подписью
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -H "Sign: valid_signature" \
  -d '{"order_id":"12345","status":"success"}'

# Тест с неправильной подписью
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -H "Sign: invalid_signature" \
  -d '{"order_id":"12345","status":"success"}'
```

### 2. Тест валидации данных

```bash
# Тест с пустыми данными
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -d '{}'

# Тест с некорректными данными
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
```

## Автоматизированное тестирование

### 1. GitHub Actions

Создайте `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Run payment test
      run: npm run test:payment
```

### 2. Локальные скрипты

```bash
# Создайте test-all.sh
cat > test-all.sh << 'EOF'
#!/bin/bash

echo "🧪 Запуск всех тестов..."

# Установка зависимостей
npm install

# Запуск unit тестов
echo "📋 Unit тесты..."
npm test

# Запуск теста платежей
echo "💳 Тест платежей..."
npm run test:payment

# Запуск теста номеров заказов
echo "🔢 Тест номеров заказов..."
node tests/test-order-id.js

echo "✅ Все тесты завершены!"
EOF

chmod +x test-all.sh
./test-all.sh
```

## Отладка тестов

### 1. Подробный вывод

```bash
# Запуск с подробным выводом
npm test -- --verbose

# Запуск конкретного теста
npm test -- --testNamePattern="should create payment"
```

### 2. Отладка в IDE

```javascript
// Добавьте в тест
describe('Debug Test', () => {
  test('should debug payment creation', async () => {
    console.log('Debug: Starting payment test');
    
    const result = await prodamusService.createPayment(paymentData);
    
    console.log('Debug: Payment result:', result);
    expect(result.success).toBe(true);
  });
});
```

### 3. Логи тестов

```bash
# Сохранение логов в файл
npm test > test-results.log 2>&1

# Просмотр логов
tail -f test-results.log
```

## Покрытие кода

### 1. Генерация отчета

```bash
npm test -- --coverage
```

### 2. Просмотр отчета

```bash
# Откройте в браузере
open coverage/lcov-report/index.html
```

### 3. Настройка покрытия

В `jest.config.js`:

```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Непрерывная интеграция

### 1. Pre-commit хуки

```bash
# Установите husky
npm install --save-dev husky

# Настройте pre-commit
npx husky add .husky/pre-commit "npm test"
```

### 2. Автоматические тесты

```bash
# Создайте test-ci.sh
cat > test-ci.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Запуск CI тестов..."

# Проверка синтаксиса
echo "📝 Проверка синтаксиса..."
npm run lint

# Запуск тестов
echo "🧪 Запуск тестов..."
npm test

# Проверка покрытия
echo "📊 Проверка покрытия..."
npm test -- --coverage --coverageThreshold.global.lines=80

echo "✅ CI тесты пройдены!"
EOF

chmod +x test-ci.sh
```

## Рекомендации

### 1. Структура тестов

- **Unit тесты** - для отдельных функций
- **Integration тесты** - для взаимодействия компонентов
- **E2E тесты** - для полного цикла пользователя

### 2. Именование тестов

```javascript
describe('ProdamusService', () => {
  describe('createPayment', () => {
    test('should create payment URL successfully', () => {
      // тест
    });
    
    test('should handle payment creation error', () => {
      // тест
    });
  });
});
```

### 3. Моки и стабы

```javascript
// Используйте моки для внешних зависимостей
jest.mock('axios');
jest.mock('node-telegram-bot-api');

// Создавайте стабы для сложных объектов
const mockBot = {
  sendMessage: jest.fn(),
  onText: jest.fn()
};
```

### 4. Асинхронные тесты

```javascript
test('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

## Устранение неполадок

### 1. Тесты не запускаются

```bash
# Очистка кэша
npm test -- --clearCache

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

### 2. Моки не работают

```javascript
// Убедитесь, что моки созданы до импорта
jest.mock('../src/services/prodamusService');

const ProdamusService = require('../src/services/prodamusService');
```

### 3. Асинхронные ошибки

```javascript
// Используйте async/await
test('should handle async error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```
