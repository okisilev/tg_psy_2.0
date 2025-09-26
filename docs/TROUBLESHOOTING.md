# Устранение неполадок

Руководство по решению проблем с Telegram ботом для продажи подписок.

## Проблемы с платежными ссылками

### 1. "Неизвестный запрос" на странице Продамус

#### Причины:
- Неправильный URL платежной страницы
- Неправильные параметры запроса
- Проблемы с HMAC подписью
- Неактивная платежная страница

#### Решения:

**Проверьте URL платежной страницы:**
```bash
# В .env файле должен быть правильный URL
PRODAMUS_PAYMENT_FORM_URL=https://dashastar.payform.ru/pay
```

**НЕ используйте:**
- ❌ `https://payform.ru/pay` (общий URL)
- ❌ `https://payform.ru/` (без /pay)

**Используйте:**
- ✅ `https://your-shop.payform.ru/pay` (ваш конкретный URL)

**Проверьте настройки в Продамус:**
1. Войдите в личный кабинет Продамус
2. Перейдите в "Платежные страницы"
3. Убедитесь, что страница **активна**
4. Проверьте, что URL правильный
5. Убедитесь, что включена отправка уведомлений

### 2. Ссылка не открывается

#### Проверьте:
1. **Доступность сервера:**
```bash
curl -I https://dashastar.payform.ru/pay
```

2. **Правильность параметров:**
```bash
npm run test:payment
```

3. **Логи бота:**
```bash
pm2 logs telegram-bot
```

### 3. Webhook не приходят

#### Проверьте:
1. **Настройки webhook в Продамус:**
   - URL: `https://yourdomain.com/webhook/prodamus`
   - Метод: POST
   - Формат: JSON

2. **Доступность webhook URL:**
```bash
curl -X POST https://yourdomain.com/webhook/prodamus \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

3. **Логи сервера:**
```bash
tail -f /var/log/nginx/access.log
```

## Проблемы с ботом

### 1. Бот не отвечает

#### Проверьте:
1. **Статус бота:**
```bash
pm2 status
```

2. **Логи бота:**
```bash
pm2 logs telegram-bot
```

3. **Токен бота:**
```bash
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

4. **Webhook настроен:**
```bash
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 2. Команды не работают

#### Проверьте:
1. **Права бота:**
   - Бот должен быть администратором канала
   - Должны быть права на добавление участников

2. **Логи обработки:**
```bash
pm2 logs telegram-bot --lines 50
```

3. **Тестирование команд:**
```bash
# Отправьте боту /start
# Проверьте ответ в логах
```

### 3. Пользователи не добавляются в канал

#### Проверьте:
1. **Права бота в канале:**
   - Администратор канала
   - Право добавлять участников
   - Право приглашать пользователей

2. **ID канала:**
```bash
# В .env файле
TELEGRAM_CHANNEL_ID=-1001234567890
```

3. **Логи добавления:**
```bash
grep "Adding user" /var/log/telegram-bot.log
```

## Проблемы с сервером

### 1. Порт занят

#### Ошибка:
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### Решение:
```bash
# Найдите процесс
lsof -ti:3000

# Убейте процесс
kill $(lsof -ti:3000)

# Или используйте другой порт
PORT=3001 npm start
```

### 2. SSL сертификат

#### Проблемы с HTTPS:
```bash
# Проверьте сертификат
openssl s_client -connect yourdomain.com:443

# Обновите сертификат
sudo certbot renew
```

### 3. Nginx ошибки

#### Проверьте конфигурацию:
```bash
# Проверка синтаксиса
sudo nginx -t

# Перезапуск
sudo systemctl restart nginx

# Логи
sudo tail -f /var/log/nginx/error.log
```

## Проблемы с базой данных

### 1. Подписки не сохраняются

#### Проверьте:
1. **Логи создания подписок:**
```bash
grep "Subscription created" /var/log/telegram-bot.log
```

2. **Обработка webhook:**
```bash
grep "Processing payment" /var/log/telegram-bot.log
```

### 2. Дублирование подписок

#### Проверьте:
1. **Уникальность order_id:**
```bash
grep "order_id" /var/log/telegram-bot.log | sort | uniq -d
```

2. **Проверка существующих подписок:**
```javascript
// В коде бота
const existingSubscription = subscriptionService.getUserSubscription(userId);
if (existingSubscription) {
    console.log('User already has subscription:', existingSubscription.id);
}
```

## Мониторинг и диагностика

### 1. Проверка здоровья системы

```bash
# Статус всех сервисов
pm2 status
sudo systemctl status nginx
sudo systemctl status certbot

# Использование ресурсов
htop
df -h
free -h
```

### 2. Логи и мониторинг

```bash
# Все логи бота
pm2 logs telegram-bot --lines 100

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -u nginx -f
```

### 3. Тестирование компонентов

```bash
# Тест создания платежа
npm run test:payment

# Тест генерации номеров заказов
npm run test:order-id

# Все тесты
npm test

# Тест с покрытием
npm run test:coverage
```

## Восстановление после сбоев

### 1. Восстановление бота

```bash
# Остановка
pm2 stop telegram-bot

# Обновление кода
git pull origin main
npm install

# Запуск
pm2 start telegram-bot
```

### 2. Восстановление из бэкапа

```bash
# Остановка сервисов
pm2 stop all
sudo systemctl stop nginx

# Восстановление из бэкапа
tar -xzf backup.tar.gz -C /

# Запуск сервисов
sudo systemctl start nginx
pm2 start all
```

### 3. Откат изменений

```bash
# Откат к предыдущей версии
git reset --hard HEAD~1
pm2 restart telegram-bot
```

## Профилактика проблем

### 1. Регулярные проверки

```bash
# Ежедневно
pm2 status
curl https://yourdomain.com/status

# Еженедельно
npm audit
sudo apt update && sudo apt upgrade

# Ежемесячно
sudo certbot renew --dry-run
```

### 2. Мониторинг

```bash
# Установка мониторинга
npm install -g pm2-logrotate

# Настройка ротации логов
pm2 install pm2-logrotate
```

### 3. Резервное копирование

```bash
# Автоматическое резервное копирование
0 2 * * * /path/to/backup.sh
```

## Получение помощи

### 1. Сбор информации для диагностики

```bash
# Создайте файл с информацией о системе
cat > system-info.txt << EOF
=== System Info ===
Date: $(date)
Uptime: $(uptime)
Memory: $(free -h)
Disk: $(df -h)

=== Bot Status ===
$(pm2 status)

=== Nginx Status ===
$(sudo systemctl status nginx)

=== Logs (last 50 lines) ===
$(pm2 logs telegram-bot --lines 50)
EOF
```

### 2. Контакты поддержки

- **Продамус:** support@prodamus.ru
- **Telegram Bot API:** @BotSupport
- **Документация:** [docs/README.md](README.md)

### 3. Создание issue

При создании issue укажите:
1. Описание проблемы
2. Шаги для воспроизведения
3. Ожидаемое поведение
4. Фактическое поведение
5. Логи и скриншоты
6. Информацию о системе
