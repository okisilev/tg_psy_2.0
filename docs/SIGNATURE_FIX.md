# Исправление ошибки "Ошибка подписи передаваемых данных"

## Проблема

При переходе по платежной ссылке возникает ошибка:
```
Ошибка подписи передаваемых данных. Оплата отменена.
```

## Причина

Проблема в неправильном формировании HMAC подписи. Согласно документации Продамус, подпись должна формироваться определенным образом.

## Решение

### 1. Проверьте секретный ключ

Убедитесь, что в `.env` файле указан правильный секретный ключ:

```env
PRODAMUS_SECRET_KEY=your_secret_key
```

### 2. Проверьте алгоритм формирования подписи

Подпись формируется следующим образом:

```javascript
// Сортируем ключи для правильного формирования подписи
const sortedKeys = Object.keys(data).sort();
const signatureString = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&');
    
const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
```

### 3. Проверьте порядок параметров

Параметры должны быть отсортированы по алфавиту:

1. `amount`
2. `client_email`
3. `currency`
4. `custom_fields`
5. `description`
6. `do`
7. `failure_url`
8. `order_id`
9. `success_url`
10. `sys`
11. `webhook_url`

### 4. Тестирование

Запустите тест создания платежа:

```bash
npm run test:payment
```

Ожидаемый результат:
```
✅ Платежная ссылка создана успешно!
🔗 URL: https://dashastar.payform.ru/?do=pay&sys=dashastar&...
```

### 5. Проверка в Продамус

1. Войдите в личный кабинет Продамус
2. Перейдите в настройки платежной страницы
3. Проверьте, что секретный ключ правильный
4. Убедитесь, что страница активна

## Отладка

### 1. Логирование подписи

Добавьте в код логирование для отладки:

```javascript
console.log('Data for signature:', data);
console.log('Signature string:', signatureString);
console.log('Generated signature:', signature);
```

### 2. Проверка параметров

Убедитесь, что все параметры передаются корректно:

```javascript
// Проверьте, что все обязательные поля присутствуют
const requiredFields = ['do', 'sys', 'order_id', 'amount', 'currency'];
for (const field of requiredFields) {
    if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
    }
}
```

### 3. Тест с минимальными параметрами

Попробуйте создать платеж с минимальным набором параметров:

```javascript
const minimalData = {
    do: 'pay',
    sys: this.shopId,
    order_id: orderId,
    amount: amount,
    currency: 'RUB'
};
```

## Альтернативные решения

### 1. Использование готовой библиотеки

Если проблема не решается, используйте готовую библиотеку HMAC:

```bash
npm install hmac-signature
```

```javascript
const hmac = require('hmac-signature');
const signature = hmac.sign(data, secretKey, 'sha256');
```

### 2. Обращение в поддержку Продамус

Если проблема не решается:

1. Обратитесь в поддержку Продамус: support@prodamus.ru
2. Предоставьте пример данных и подписи
3. Уточните правильный алгоритм формирования подписи

### 3. Проверка документации

Изучите актуальную документацию Продамус:

- [Официальная документация](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov)
- [Примеры интеграции](https://help.prodamus.ru/payform/integracii/rest-api/instrukcii-dlya-samostoyatelnaya-integracii-servisov#parametry-kotorye-vy-mozhete-peredat-v-zaprose)

## Проверочный список

- [ ] Секретный ключ правильный
- [ ] Параметры отсортированы по алфавиту
- [ ] Используется SHA256 для HMAC
- [ ] Все обязательные поля присутствуют
- [ ] Платежная страница активна в Продамус
- [ ] Тест создания платежа проходит успешно

## Поддержка

Если проблема не решается:

1. **Проверьте логи:** `pm2 logs telegram-bot`
2. **Обратитесь в поддержку Продамус:** support@prodamus.ru
3. **Создайте issue** в репозитории с подробным описанием проблемы