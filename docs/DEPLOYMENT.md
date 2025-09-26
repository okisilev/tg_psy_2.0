# Руководство по развертыванию

Подробное руководство по развертыванию Telegram бота для продажи подписок.

## Варианты развертывания

### 1. Heroku (Рекомендуется для начинающих)

#### Преимущества:
- Простота настройки
- Автоматическое развертывание
- Встроенный мониторинг
- SSL сертификаты включены

#### Настройка:

1. **Создайте приложение на Heroku:**
```bash
# Установите Heroku CLI
npm install -g heroku

# Войдите в аккаунт
heroku login

# Создайте приложение
heroku create your-bot-name
```

2. **Настройте переменные окружения:**
```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
heroku config:set PRODAMUS_SHOP_ID=your_shop_id
heroku config:set PRODAMUS_SECRET_KEY=your_secret_key
heroku config:set PRODAMUS_PAYMENT_FORM_URL=https://your-shop.payform.ru/pay
heroku config:set WEBHOOK_URL=https://your-bot-name.herokuapp.com
heroku config:set PRODAMUS_WEBHOOK_URL=https://your-bot-name.herokuapp.com/webhook/prodamus
```

3. **Деплой:**
```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

### 2. VPS (Рекомендуется для продакшена)

#### Требования:
- Ubuntu 20.04+ или CentOS 8+
- Node.js 16+
- Nginx
- PM2
- SSL сертификат

#### Настройка сервера:

1. **Установите зависимости:**
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Nginx
sudo apt install nginx -y
```

2. **Настройте SSL (Let's Encrypt):**
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d yourdomain.com
```

3. **Настройте Nginx:**
```nginx
# /etc/nginx/sites-available/telegram-bot
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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

4. **Запустите бота через PM2:**
```bash
# Создайте ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'src/bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Запуск
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Docker (Для контейнеризации)

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml:
```yaml
version: '3.8'

services:
  telegram-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - PRODAMUS_SHOP_ID=${PRODAMUS_SHOP_ID}
      - PRODAMUS_SECRET_KEY=${PRODAMUS_SECRET_KEY}
      - PRODAMUS_PAYMENT_FORM_URL=${PRODAMUS_PAYMENT_FORM_URL}
      - WEBHOOK_URL=${WEBHOOK_URL}
      - PRODAMUS_WEBHOOK_URL=${PRODAMUS_WEBHOOK_URL}
    restart: unless-stopped
```

## Настройка домена

### 1. Покупка домена

Рекомендуемые регистраторы:
- Namecheap
- GoDaddy
- Cloudflare

### 2. Настройка DNS

```bash
# A-запись для основного домена
yourdomain.com -> YOUR_SERVER_IP

# CNAME для поддомена (если нужно)
bot.yourdomain.com -> yourdomain.com
```

### 3. SSL сертификат

```bash
# Let's Encrypt (бесплатно)
sudo certbot --nginx -d yourdomain.com

# Или Cloudflare SSL (автоматически)
```

## Мониторинг и логи

### 1. PM2 мониторинг

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs telegram-bot

# Перезапуск
pm2 restart telegram-bot

# Мониторинг в реальном времени
pm2 monit
```

### 2. Nginx логи

```bash
# Доступ к логам
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Системные логи

```bash
# Логи системы
sudo journalctl -u nginx -f

# Логи PM2
pm2 logs --lines 100
```

## Резервное копирование

### 1. Автоматическое резервное копирование

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
PROJECT_DIR="/path/to/your/bot"

# Создание архива
tar -czf $BACKUP_DIR/bot_backup_$DATE.tar.gz $PROJECT_DIR

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "bot_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: bot_backup_$DATE.tar.gz"
```

### 2. Cron задача

```bash
# Добавьте в crontab
0 2 * * * /path/to/backup.sh
```

## Обновление

### 1. Обновление кода

```bash
# Остановка бота
pm2 stop telegram-bot

# Обновление кода
git pull origin main
npm install

# Запуск
pm2 start telegram-bot
```

### 2. Откат изменений

```bash
# Откат к предыдущей версии
git reset --hard HEAD~1
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
sudo ufw deny 3000
```

### 2. Обновления системы

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Мониторинг безопасности

```bash
# Установка fail2ban
sudo apt install fail2ban -y

# Настройка
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Производительность

### 1. Оптимизация Node.js

```bash
# Увеличение лимитов
echo "fs.file-max = 65536" >> /etc/sysctl.conf
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 2. Мониторинг ресурсов

```bash
# Установка htop
sudo apt install htop -y

# Мониторинг в реальном времени
htop
```

## Устранение неполадок

### 1. Бот не отвечает

```bash
# Проверка статуса
pm2 status

# Проверка логов
pm2 logs telegram-bot --lines 50

# Перезапуск
pm2 restart telegram-bot
```

### 2. Webhook не работает

```bash
# Проверка доступности
curl -X GET https://yourdomain.com/status

# Проверка логов Nginx
sudo tail -f /var/log/nginx/error.log
```

### 3. Проблемы с SSL

```bash
# Обновление сертификата
sudo certbot renew --dry-run

# Проверка сертификата
openssl s_client -connect yourdomain.com:443
```

## Поддержка

При возникновении проблем:

1. Проверьте логи: `pm2 logs telegram-bot`
2. Проверьте статус: `pm2 status`
3. Проверьте доступность: `curl https://yourdomain.com/status`
4. Обратитесь к документации или создайте issue
