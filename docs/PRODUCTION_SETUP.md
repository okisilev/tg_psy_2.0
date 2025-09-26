# Настройка для продакшена

## Проблема с PageKite

PageKite - это туннелирующий сервис для локальной разработки, который не подходит для продакшена. Нужно использовать реальный домен с HTTPS.

## Решение

### 1. Настройка домена

Замените `dashastar.pagekite.me` на ваш реальный домен:

```env
# В .env файле
WEBHOOK_URL=https://yourdomain.com
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus
```

### 2. Требования к домену

- ✅ **HTTPS обязателен** - Продамус требует SSL сертификат
- ✅ **Статический IP** - для стабильной работы
- ✅ **Доступность 24/7** - для обработки webhook'ов
- ✅ **Публичный доступ** - без VPN или локальных ограничений

### 3. Варианты хостинга

#### A. VPS/Сервер
```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка SSL сертификата (Let's Encrypt)
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

#### B. Облачные платформы
- **Heroku** - простой деплой
- **DigitalOcean App Platform** - управляемый хостинг
- **AWS EC2** - полный контроль
- **Google Cloud Run** - serverless

#### C. VPS провайдеры
- **DigitalOcean** - от $5/месяц
- **Linode** - от $5/месяц
- **Vultr** - от $2.50/месяц
- **Hetzner** - от €3.29/месяц

## Настройка сервера

### 1. Установка зависимостей

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/tg-psy-2.0.git
cd tg-psy-2.0

# Установка зависимостей
npm install

# Установка PM2
sudo npm install -g pm2
```

### 2. Настройка переменных окружения

```bash
# Создание .env файла
cp config.env.example .env

# Редактирование конфигурации
nano .env
```

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_real_bot_token
TELEGRAM_CHANNEL_ID=@your_private_channel

# Prodamus Configuration
PRODAMUS_SHOP_ID=your_real_shop_id
PRODAMUS_SECRET_KEY=your_real_secret_key
PRODAMUS_PAYMENT_FORM_URL=https://your-shop.payform.ru/pay
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

### 3. Настройка PM2

```bash
# Создание ecosystem файла
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'src/bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Запуск через PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

### 4. Настройка Nginx (опционально)

```bash
# Установка Nginx
sudo apt update
sudo apt install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/telegram-bot
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация сайта
sudo ln -s /etc/nginx/sites-available/telegram-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Настройка SSL сертификата

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Настройка в Продамус

### 1. Webhook URL

В личном кабинете Продамус укажите:
```
https://yourdomain.com/sales/prodamus
```

### 2. Тестовые уведомления

Продамус отправит тестовое уведомление для проверки интеграции.

### 3. Проверка работы

```bash
# Проверка статуса бота
curl https://yourdomain.com/status

# Проверка webhook'а
curl -X POST https://yourdomain.com/sales/prodamus \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Sign: test_signature" \
  -d "test=data"
```

## Мониторинг

### 1. Логи PM2

```bash
# Просмотр логов
pm2 logs telegram-bot

# Просмотр статуса
pm2 status

# Перезапуск
pm2 restart telegram-bot
```

### 2. Мониторинг системы

```bash
# Установка htop
sudo apt install htop

# Мониторинг ресурсов
htop

# Проверка дискового пространства
df -h

# Проверка памяти
free -h
```

### 3. Автоматические проверки

```bash
# Создание скрипта мониторинга
cat > /home/user/monitor.sh << 'EOF'
#!/bin/bash
# Проверка статуса бота
if ! curl -f https://yourdomain.com/status > /dev/null 2>&1; then
    echo "Bot is down, restarting..."
    pm2 restart telegram-bot
    # Отправка уведомления (опционально)
    # curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    #   -d "chat_id=$ADMIN_CHAT_ID" \
    #   -d "text=Bot restarted automatically"
fi
EOF

chmod +x /home/user/monitor.sh

# Добавление в crontab
crontab -e
# Добавить строку:
# */5 * * * * /home/user/monitor.sh
```

## Резервное копирование

### 1. Автоматический бэкап

```bash
# Создание скрипта бэкапа
cat > /home/user/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
PROJECT_DIR="/home/user/tg-psy-2.0"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/bot_backup_$DATE.tar.gz -C $PROJECT_DIR .
# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "bot_backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /home/user/backup.sh

# Добавление в crontab
crontab -e
# Добавить строку:
# 0 2 * * * /home/user/backup.sh
```

### 2. Восстановление

```bash
# Восстановление из бэкапа
tar -xzf /home/user/backups/bot_backup_20250126_120000.tar.gz -C /home/user/tg-psy-2.0/
pm2 restart telegram-bot
```

## Безопасность

### 1. Firewall

```bash
# Настройка UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Закрыть прямой доступ к Node.js
```

### 2. Обновления

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Мониторинг безопасности

```bash
# Установка fail2ban
sudo apt install fail2ban

# Настройка
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
```

## Рекомендации

### 1. Производительность

- ✅ Используйте PM2 для управления процессами
- ✅ Настройте мониторинг ресурсов
- ✅ Регулярно обновляйте зависимости

### 2. Надежность

- ✅ Настройте автоматические бэкапы
- ✅ Мониторьте статус бота
- ✅ Используйте HTTPS для всех соединений

### 3. Безопасность

- ✅ Регулярно обновляйте систему
- ✅ Используйте firewall
- ✅ Мониторьте логи на подозрительную активность

## Заключение

Настройка для продакшена включает:

- ✅ **Реальный домен** с HTTPS
- ✅ **Стабильный хостинг** 24/7
- ✅ **Мониторинг** и автоматические проверки
- ✅ **Резервное копирование** данных
- ✅ **Безопасность** и обновления

Теперь бот готов к работе в продакшене без PageKite!
