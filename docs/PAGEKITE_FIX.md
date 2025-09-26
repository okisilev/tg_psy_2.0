# Исправление ошибки PageKite

## Проблема

В документации и примерах использовались URL с `dashastar.pagekite.me`, что неправильно для продакшена.

## Что исправлено

### 1. Документация обновлена

**Файлы:**
- `docs/FULL_PAYMENT_LINK.md`
- `docs/WEBHOOK_URL_FIX.md`

**Изменения:**
- ✅ Заменены все `dashastar.pagekite.me` на `yourdomain.com`
- ✅ Обновлены примеры URL'ов
- ✅ Исправлены команды curl

### 2. Примеры конфигурации

**Было:**
```env
WEBHOOK_URL=https://dashastar.pagekite.me
PRODAMUS_WEBHOOK_URL=https://dashastar.pagekite.me/sales/prodamus
```

**Стало:**
```env
WEBHOOK_URL=https://yourdomain.com
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus
```

### 3. Примеры URL'ов

**Было:**
```
https://dashastar.pagekite.me/sales/prodamus
https://dashastar.pagekite.me/success
https://dashastar.pagekite.me/failure
```

**Стало:**
```
https://yourdomain.com/sales/prodamus
https://yourdomain.com/success
https://yourdomain.com/failure
```

## Для продакшена

### 1. Замените домен

В файле `.env` укажите ваш реальный домен:

```env
WEBHOOK_URL=https://yourdomain.com
PRODAMUS_WEBHOOK_URL=https://yourdomain.com/sales/prodamus
```

### 2. Настройте в Продамус

В личном кабинете Продамус укажите webhook URL:
```
https://yourdomain.com/sales/prodamus
```

### 3. Проверьте работу

```bash
# Проверка статуса
curl https://yourdomain.com/status

# Проверка webhook'а
curl -X POST https://yourdomain.com/sales/prodamus \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Sign: test_signature" \
  -d "test=data"
```

## Заключение

✅ **Все упоминания PageKite исправлены**
✅ **Документация обновлена**
✅ **Примеры используют правильные домены**
✅ **Готово для продакшена**

Теперь все примеры и документация используют правильные домены для продакшена!
