# Исправление ошибки "Неизвестный запрос" с PageKite URL

## Проблема

Ссылка формируется с PageKite URL:
```
https://dashastar.payform.ru/pay?do=pay&sys=dashastar&order_id=16884&amount=1000&currency=RUB&description=Подписка+на+закрытый+канал+%2830+дней%29&client_email=431292182%40telegram.user&success_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&failure_url=https%3A%2F%2Fdashastar.pagekite.me%2Ffailure&webhook_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsales%2Fprodamus&custom_fields=%7B%22telegram_user_id%22%3A431292182%7D&signature=736e1ee0e58699bcbae0470f2dc3b94ee161b921be3c489feae3314158b8f60c
```

Но на ней ошибка "Неизвестный запрос".

## Причина

1. **PageKite URL** - `dashastar.pagekite.me` не работает для продакшена
2. **Неправильная конфигурация** - в `.env` файле используются placeholder значения
3. **Отсутствие реального домена** - нужен HTTPS домен для webhook'ов

## Решение

### 1. Обновите .env файл

Замените содержимое файла `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_real_bot_token
TELEGRAM_CHANNEL_ID=@your_private_channel

# Prodamus Configuration
PRODAMUS_SHOP_ID=dashastar
PRODAMUS_SECRET_KEY=your_real_secret_key
PRODAMUS_PAYMENT_FORM_URL=https://dashastar.payform.ru/pay
PRODAMUS_REST_API_URL=https://payform.ru
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus

# Server Configuration
PORT=3000
WEBHOOK_URL=https://yourdomain.com
WEBHOOK_PATH=/webhook/telegram

# Subscription Configuration
SUBSCRIPTION_PRICE=1000
SUBSCRIPTION_DURATION_DAYS=30
CURRENCY=RUB
```

### 2. Замените yourdomain.com на реальный домен

**Варианты:**

#### A. Локальная разработка с ngrok
```bash
# Установка ngrok
npm install -g ngrok

# Запуск туннеля
ngrok http 3000

# Получите URL вида: https://abc123.ngrok.io
# Используйте его в .env:
WEBHOOK_URL=https://abc123.ngrok.io
PRODAMUS_WEBHOOK_URL=https://abc123.ngrok.io/sales/prodamus
```

#### B. Продакшен сервер
```env
WEBHOOK_URL=https://yourdomain.com
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus
```

### 3. Настройте в Продамус

В личном кабинете Продамус укажите webhook URL:
```
https://yourdomain.com/sales/prodamus
```

### 4. Перезапустите бота

```bash
# Остановка бота
pkill -f "node src/bot.js"

# Запуск с новой конфигурацией
npm start
```

## Проверка работы

### 1. Тест создания платежа

```bash
npm run test:payment
```

Ожидаемый результат:
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://dashastar.payform.ru/pay?do=pay&sys=dashastar&order_id=...&success_url=https%3A%2F%2Fyourdomain.com%2Fsuccess&...
```

### 2. Проверка webhook'а

```bash
# Проверка доступности
curl -I https://dashastar.pagekite.me/sales/prodamus

# Тест webhook'а
curl -X POST https://dashastar.pagekite.me/sales/prodamus \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Sign: test_signature" \
  -d "test=data"
```

### 3. Проверка статуса

```bash


```

## Альтернативные решения

### 1. Использование ngrok для разработки

```bash
# Установка
npm install -g ngrok

# Запуск
ngrok http 3000

# Получите URL и обновите .env
```

### 2. Использование локального туннеля

```bash
# Установка localtunnel
npm install -g localtunnel

# Запуск
lt --port 3000 --subdomain your-subdomain

# URL будет: https://your-subdomain.loca.lt
```

### 3. Развертывание на VPS

Следуйте инструкциям в [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

## Отладка

### 1. Проверка переменных окружения

```bash
# Проверка загруженных переменных
node -e "
require('dotenv').config();
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL);
console.log('PRODAMUS_WEBHOOK_URL:', process.env.PRODAMUS_WEBHOOK_URL);
"
```

### 2. Логи бота

```bash
# Просмотр логов
npm start

# Или если используете PM2
pm2 logs telegram-bot
```

### 3. Проверка URL'ов в ссылке

Декодируйте URL и проверьте параметры:

```bash
node -e "
const url = 'https://dashastar.payform.ru/pay?do=pay&sys=dashastar&order_id=16884&amount=1000&currency=RUB&description=Подписка+на+закрытый+канал+%2830+дней%29&client_email=431292182%40telegram.user&success_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsuccess&failure_url=https%3A%2F%2Fdashastar.pagekite.me%2Ffailure&webhook_url=https%3A%2F%2Fdashastar.pagekite.me%2Fsales%2Fprodamus&custom_fields=%7B%22telegram_user_id%22%3A431292182%7D&signature=736e1ee0e58699bcbae0470f2dc3b94ee161b921be3c489feae3314158b8f60c';
const params = new URLSearchParams(url.split('?')[1]);
for (const [key, value] of params) {
    console.log(\`\${key}: \${decodeURIComponent(value)}\`);
}
"
```

## Заключение

Проблема решается заменой PageKite URL на реальный домен:

- ✅ **Обновите .env файл** с реальными данными
- ✅ **Замените yourdomain.com** на ваш домен
- ✅ **Настройте в Продамус** правильный webhook URL
- ✅ **Перезапустите бота** с новой конфигурацией

После этого ссылки будут формироваться с правильными URL'ами и работать корректно!
