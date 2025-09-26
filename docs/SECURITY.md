# Руководство по безопасности

Руководство по обеспечению безопасности Telegram бота для продажи подписок.

## Общие принципы безопасности

### 1. Защита конфиденциальных данных

#### Переменные окружения
```bash
# Никогда не коммитьте .env файлы
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Используйте разные файлы для разных окружений
.env.development
.env.staging
.env.production
```

#### Секретные ключи
```bash
# Ротация ключей
# Меняйте ключи регулярно (каждые 3-6 месяцев)
# Используйте сильные пароли (минимум 32 символа)
# Храните ключи в безопасном месте
```

### 2. Валидация входных данных

#### Telegram сообщения
```javascript
// Проверка структуры сообщения
function validateTelegramMessage(msg) {
  if (!msg || !msg.chat || !msg.from) {
    throw new Error('Invalid message structure');
  }
  
  if (!msg.chat.id || !msg.from.id) {
    throw new Error('Missing required fields');
  }
  
  return true;
}
```

#### Webhook данные
```javascript
// Валидация webhook от Продамус
function validateProdamusWebhook(data) {
  const requiredFields = ['order_id', 'status', 'amount'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Проверка типов данных
  if (typeof data.amount !== 'string' && typeof data.amount !== 'number') {
    throw new Error('Invalid amount type');
  }
  
  return true;
}
```

## HMAC Подписи

### 1. Проверка подписей

```javascript
// Безопасная проверка HMAC
function verifySignature(data, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data), 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
```

### 2. Защита от timing attacks

```javascript
// Используйте timingSafeEqual для сравнения
const isValid = crypto.timingSafeEqual(
  Buffer.from(receivedSignature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);
```

## Защита от атак

### 1. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Ограничение для webhook'ов
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Too many requests from this IP'
});

app.use('/webhook', webhookLimiter);
```

### 2. Защита от DDoS

```javascript
// Ограничение размера запроса
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Таймауты
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 секунд
  res.setTimeout(30000);
  next();
});
```

### 3. Валидация IP адресов

```javascript
// Разрешенные IP адреса Продамус
const allowedIPs = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '2a02:5180::/32'
];

function isAllowedIP(ip) {
  return allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR проверка
      return isIPInRange(ip, allowedIP);
    } else {
      return ip === allowedIP;
    }
  });
}
```

## Безопасность базы данных

### 1. Защита от SQL инъекций

```javascript
// Используйте параметризованные запросы
const query = 'SELECT * FROM subscriptions WHERE user_id = ?';
const result = await db.query(query, [userId]);
```

### 2. Шифрование чувствительных данных

```javascript
const crypto = require('crypto');

// Шифрование данных пользователя
function encryptUserData(data) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('user-data', 'utf8'));
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

## Логирование и мониторинг

### 1. Безопасное логирование

```javascript
// Не логируйте чувствительные данные
function safeLog(data) {
  const sanitized = { ...data };
  
  // Удаляем чувствительные поля
  delete sanitized.secret_key;
  delete sanitized.password;
  delete sanitized.token;
  
  // Маскируем частично чувствительные данные
  if (sanitized.client_email) {
    const [user, domain] = sanitized.client_email.split('@');
    sanitized.client_email = `${user.substring(0, 2)}***@${domain}`;
  }
  
  console.log('Payment processed:', sanitized);
}
```

### 2. Мониторинг подозрительной активности

```javascript
// Отслеживание неудачных попыток
const failedAttempts = new Map();

function trackFailedAttempt(ip) {
  const attempts = failedAttempts.get(ip) || 0;
  failedAttempts.set(ip, attempts + 1);
  
  if (attempts > 10) {
    console.warn(`Suspicious activity from IP: ${ip}`);
    // Блокировка IP или уведомление администратора
  }
}
```

## HTTPS и SSL

### 1. Принудительное HTTPS

```javascript
// Перенаправление HTTP на HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 2. Безопасные заголовки

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Аутентификация и авторизация

### 1. Проверка прав администратора

```javascript
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_IDS ? 
    process.env.ADMIN_IDS.split(',') : [];
  
  return adminIds.includes(userId.toString());
}

// Проверка перед выполнением админских команд
if (!isAdmin(msg.from.id)) {
  return bot.sendMessage(msg.chat.id, '❌ У вас нет прав администратора');
}
```

### 2. Токены доступа

```javascript
// Генерация безопасных токенов
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Проверка токенов
function verifyToken(token, userId) {
  const storedToken = getStoredToken(userId);
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(storedToken, 'hex')
  );
}
```

## Резервное копирование

### 1. Шифрование бэкапов

```bash
#!/bin/bash
# Создание зашифрованного бэкапа

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="bot_backup_$DATE.tar.gz"
ENCRYPTED_FILE="bot_backup_$DATE.tar.gz.enc"

# Создание архива
tar -czf $BACKUP_FILE /path/to/bot

# Шифрование
openssl enc -aes-256-cbc -salt -in $BACKUP_FILE -out $ENCRYPTED_FILE

# Удаление незашифрованного файла
rm $BACKUP_FILE

echo "Encrypted backup created: $ENCRYPTED_FILE"
```

### 2. Безопасное хранение

```bash
# Загрузка в защищенное облачное хранилище
aws s3 cp $ENCRYPTED_FILE s3://secure-backups/bot/

# Удаление локального файла
rm $ENCRYPTED_FILE
```

## Мониторинг безопасности

### 1. Алерты безопасности

```javascript
// Уведомления о подозрительной активности
function sendSecurityAlert(alert) {
  const adminChatId = process.env.ADMIN_CHAT_ID;
  
  bot.sendMessage(adminChatId, 
    `🚨 Security Alert: ${alert}`
  );
}

// Отслеживание неудачных webhook'ов
if (invalidSignatureCount > 5) {
  sendSecurityAlert('Multiple invalid webhook signatures detected');
}
```

### 2. Аудит действий

```javascript
// Логирование всех действий администратора
function logAdminAction(userId, action, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId,
    action: action,
    details: details,
    ip: getClientIP()
  };
  
  console.log('Admin action:', JSON.stringify(logEntry));
  // Сохранение в защищенное хранилище
}
```

## Обновления безопасности

### 1. Регулярные обновления

```bash
# Обновление зависимостей
npm audit
npm audit fix

# Проверка уязвимостей
npm audit --audit-level moderate
```

### 2. Мониторинг уязвимостей

```bash
# Установка инструментов безопасности
npm install -g npm-check-updates
npm install -g audit-ci

# Проверка обновлений
ncu -u
npm audit
```

## Инциденты безопасности

### 1. План реагирования

1. **Немедленные действия:**
   - Остановка сервиса при критических уязвимостях
   - Изменение всех паролей и ключей
   - Анализ логов на предмет компрометации

2. **Расследование:**
   - Определение масштаба инцидента
   - Выявление источника атаки
   - Сбор доказательств

3. **Восстановление:**
   - Устранение уязвимостей
   - Восстановление из чистых бэкапов
   - Мониторинг на предмет повторных атак

### 2. Коммуникация

```javascript
// Уведомление пользователей о проблемах
function notifyUsersAboutIssue(issue) {
  const message = `
🔧 Техническое обслуживание

В настоящее время проводятся работы по улучшению сервиса.
Некоторые функции могут быть временно недоступны.

Приносим извинения за неудобства.
  `;
  
  // Отправка всем активным пользователям
  sendToAllUsers(message);
}
```

## Рекомендации

### 1. Регулярные проверки

- **Еженедельно:** Обновление зависимостей
- **Ежемесячно:** Аудит безопасности
- **Ежеквартально:** Ротация ключей
- **Ежегодно:** Полный аудит безопасности

### 2. Обучение команды

- Регулярные тренинги по безопасности
- Изучение новых угроз
- Практические упражнения по реагированию

### 3. Документирование

- Ведение журнала инцидентов
- Документирование процедур безопасности
- Регулярное обновление политик
