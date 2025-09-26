# Исправление ошибки "Payment creation failed"

## Проблема

При попытке создать платеж через бота возникает ошибка:
```
❌ Ошибка создания платежа: Payment creation failed
```

## Причина

Изначальная реализация использовала несуществующий REST API Продамус. Согласно [официальной документации Продамус](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov#parametry-kotorye-vy-mozhete-peredat-v-zaprose), система работает через формирование платежных ссылок с HMAC подписью.

## Исправления

### 1. Обновлен ProdamusService

- ✅ Удален несуществующий REST API
- ✅ Добавлено формирование платежных ссылок согласно документации
- ✅ Реализована правильная HMAC подпись
- ✅ Добавлена проверка webhook подписей

### 2. Обновлены переменные окружения

Удалены неиспользуемые переменные:
- ❌ `PRODAMUS_API_KEY` (не существует в Продамус)
- ✅ `PRODAMUS_SHOP_ID` (ID магазина)
- ✅ `PRODAMUS_SECRET_KEY` (секретный ключ)
- ✅ `PRODAMUS_PAYMENT_FORM_URL` (URL платежной формы)

### 3. Обновлена обработка webhook

- ✅ Исправлен заголовок для подписи (`Sign` вместо `x-prodamus-signature`)
- ✅ Улучшена обработка данных webhook
- ✅ Добавлено логирование для отладки

## Настройка

### 1. Обновите .env файл

```env
# Prodamus Configuration
PRODAMUS_SHOP_ID=your_shop_id          # ID вашего магазина в Продамус
PRODAMUS_SECRET_KEY=your_secret_key    # Секретный ключ из настроек
PRODAMUS_PAYMENT_FORM_URL=https://payform.ru/pay
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/webhook/prodamus
```

### 2. Настройте Продамус

1. Войдите в личный кабинет Продамус
2. Перейдите в настройки платежной страницы
3. Скопируйте:
   - **ID магазина** (sys) → `PRODAMUS_SHOP_ID`
   - **Секретный ключ** → `PRODAMUS_SECRET_KEY`
4. Настройте URL для уведомлений: `https://yourdomain.com/webhook/prodamus`

### 3. Тестирование

Запустите тест создания платежа:

```bash
npm run test:payment
```

Ожидаемый результат:
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://payform.ru/pay?do=pay&sys=your_shop_id&...
```

## Проверка работы

### 1. Создание платежа

1. Запустите бота: `npm start`
2. Отправьте команду `/subscribe`
3. Нажмите "Оплатить подписку"
4. Должна появиться ссылка для оплаты

### 2. Проверка webhook

1. Убедитесь, что сервер доступен по HTTPS
2. Проверьте логи на наличие webhook'ов от Продамус
3. При успешной оплате пользователь должен получить доступ к каналу

## Отладка

### Логи бота

```bash
# Просмотр логов
pm2 logs telegram-bot

# Или при запуске через npm
npm start
```

### Проверка переменных окружения

```bash
node -e "require('dotenv').config(); console.log('SHOP_ID:', process.env.PRODAMUS_SHOP_ID); console.log('SECRET_KEY:', process.env.PRODAMUS_SECRET_KEY ? 'SET' : 'NOT SET');"
```

### Тест HMAC подписи

```bash
npm run test:payment
```

## Возможные проблемы

### 1. "Invalid signature"

- Проверьте правильность `PRODAMUS_SECRET_KEY`
- Убедитесь, что webhook URL настроен в Продамус

### 2. "User ID not found"

- Проверьте, что `custom_fields` правильно передаются в платежную ссылку
- Убедитесь, что webhook получает данные в правильном формате

### 3. "Payment not successful"

- Проверьте статус платежа в личном кабинете Продамус
- Убедитесь, что тестовые платежи проходят успешно

## Дополнительные ресурсы

- [Документация Продамус](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov)
- [Настройка webhook'ов](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov#parametry-kotorye-vy-mozhete-peredat-v-zaprose)
- [Поддержка Продамус](https://prodamus.ru/support)
