# Руководство по настройке

Подробное руководство по настройке Telegram бота для продажи подписок.

## Предварительные требования

- Node.js версии 16 или выше
- Аккаунт в Telegram
- Аккаунт в системе Продамус
- Домен с SSL сертификатом (для webhook'ов)

## Пошаговая настройка

### 1. Создание Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Subscription Bot")
4. Введите username бота (например: "subscription_bot")
5. Сохраните полученный токен

### 2. Настройка закрытого канала

1. Создайте новый канал в Telegram
2. Сделайте канал закрытым (Private Channel)
3. Добавьте бота как администратора канала
4. Дайте боту права на добавление участников
5. Получите ID канала (начинается с -100)

### 3. Настройка Продамус

1. Зарегистрируйтесь на [prodamus.ru](https://prodamus.ru)
2. Создайте новый магазин
3. Получите API ключи в разделе "Настройки" → "API"
4. Настройте webhook URL: `https://yourdomain.com/webhook/prodamus`

### 4. Настройка сервера

#### Установка зависимостей

```bash
# Клонирование проекта
git clone <repository-url>
cd tg_psy_2.0

# Установка зависимостей
npm install
```

#### Настройка переменных окружения

Создайте файл `.env` на основе `config.env.example`:

```bash
cp config.env.example .env
```

Заполните переменные:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=-1001234567890

# Prodamus Configuration
PRODAMUS_SHOP_ID=your_shop_id
PRODAMUS_API_KEY=your_api_key
PRODAMUS_SECRET_KEY=your_secret_key
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/webhook/prodamus

# Server Configuration
PORT=3000
WEBHOOK_URL=https://yourdomain.com
WEBHOOK_PATH=/webhook/telegram

# Subscription Configuration
SUBSCRIPTION_PRICE=1000
SUBSCRIPTION_DURATION_DAYS=30
CURRENCY=RUB

# Admin Configuration (опционально)
ADMIN_IDS=123456789,987654321
```

### 5. Настройка webhook'ов

#### Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook/telegram"}'
```

#### Продамус Webhook

Настройте в личном кабинете Продамус:
- URL: `https://yourdomain.com/webhook/prodamus`
- Метод: POST
- Формат: JSON

### 6. Запуск бота

#### Режим разработки

```bash
npm run dev
```

#### Продакшн

```bash
npm start
```

#### С PM2 (рекомендуется)

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start src/bot.js --name "telegram-bot"

# Автозапуск
pm2 startup
pm2 save
```

## Проверка работоспособности

### 1. Проверка статуса

Откройте в браузере: `https://yourdomain.com/status`

Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Тестирование бота

1. Найдите бота в Telegram по username
2. Отправьте команду `/start`
3. Проверьте, что бот отвечает

### 3. Тестирование платежа

1. Отправьте команду `/subscribe`
2. Нажмите "Оплатить подписку"
3. Проверьте, что создается ссылка для оплаты

### 4. Проверка webhook'ов

Проверьте логи сервера на наличие входящих webhook'ов от Продамус.

## Мониторинг и логи

### Просмотр логов

```bash
# PM2 логи
pm2 logs telegram-bot

# Системные логи
tail -f /var/log/your-app.log
```

### Мониторинг ошибок

Бот автоматически логирует:
- Ошибки создания платежей
- Неудачные webhook'и
- Проблемы с подписками

## Безопасность

### SSL сертификат

Обязательно используйте HTTPS для webhook'ов:
- Let's Encrypt (бесплатно)
- Cloudflare SSL
- Коммерческий сертификат

### Ограничение доступа

Настройте firewall для ограничения доступа к webhook endpoints:

```bash
# Разрешить только Продамус IP
iptables -A INPUT -p tcp --dport 3000 -s <PRODAMUS_IP> -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

### Резервное копирование

Регулярно создавайте резервные копии:
- Конфигурационных файлов
- Базы данных подписок
- Логов

## Устранение неполадок

### Бот не отвечает

1. Проверьте токен бота
2. Убедитесь, что webhook настроен правильно
3. Проверьте логи сервера

### Платежи не обрабатываются

1. Проверьте настройки Продамус
2. Убедитесь в правильности webhook URL
3. Проверьте HMAC подпись

### Пользователи не добавляются в канал

1. Проверьте права бота в канале
2. Убедитесь в правильности ID канала
3. Проверьте логи обработки платежей

## Обновление

```bash
# Остановка бота
pm2 stop telegram-bot

# Обновление кода
git pull origin main
npm install

# Запуск
pm2 start telegram-bot
```

## Поддержка

При возникновении проблем:

1. Проверьте логи
2. Убедитесь в правильности настроек
3. Обратитесь к документации
4. Создайте issue в репозитории
