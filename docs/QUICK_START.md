# Быстрый старт

Краткое руководство по запуску Telegram бота для продажи подписок.

## 🚀 Быстрая настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

```bash
cp config.env.example .env
```

Заполните `.env` файл:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=-1001234567890

# Prodamus
PRODAMUS_SHOP_ID=your_shop_id
PRODAMUS_SECRET_KEY=your_secret_key
PRODAMUS_PAYMENT_FORM_URL=https://your-shop.payform.ru/pay
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/webhook/prodamus

# Server
PORT=3000
WEBHOOK_URL=https://yourdomain.com
```

### 3. Запуск бота

```bash
npm start
```

## ✅ Проверка работы

### 1. Тест создания платежа

```bash
npm run test:payment
```

Ожидаемый результат:
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://your-shop.payform.ru/pay?...
```

### 2. Тест бота

1. Найдите бота в Telegram
2. Отправьте `/start`
3. Нажмите "Оплатить подписку"
4. Проверьте, что ссылка работает

### 3. Проверка статуса

```bash
curl http://localhost:3000/status
```

Ожидаемый результат:
```json
{"status":"ok","timestamp":"2025-01-01T00:00:00.000Z"}
```

## 🔧 Основные команды

### Запуск и остановка

```bash
# Запуск
npm start

# Разработка
npm run dev

# Остановка
pkill -f "node src/bot.js"
```

### Тестирование

```bash
# Все тесты
npm test

# Тест платежей
npm run test:payment

# Тест с покрытием
npm run test:coverage
```

### Развертывание

```bash
# PM2 (рекомендуется)
pm2 start src/bot.js --name telegram-bot
pm2 save
pm2 startup
```

## 📚 Дополнительная документация

- [Полная настройка](SETUP.md)
- [Развертывание](DEPLOYMENT.md)
- [Тестирование](TESTING.md)
- [Безопасность](SECURITY.md)
- [Устранение неполадок](TROUBLESHOOTING.md)

## 🆘 Если что-то не работает

1. **Проверьте логи:**
```bash
pm2 logs telegram-bot
```

2. **Проверьте настройки:**
```bash
npm run test:payment
```

3. **Обратитесь к документации:**
   - [Устранение неполадок](TROUBLESHOOTING.md)
   - [Настройка Продамус](FIX_PAYMENT.md)

## 📞 Поддержка

- **Документация:** [docs/](.)
- **Issues:** Создайте issue в репозитории
- **Продамус:** support@prodamus.ru
