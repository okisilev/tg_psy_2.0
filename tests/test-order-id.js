#!/usr/bin/env node

/**
 * Тест генерации 5-значного номера заказа
 */

function generateOrderId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

console.log('🧪 Тестирование генерации 5-значных номеров заказов...\n');

// Генерируем 10 номеров для проверки
for (let i = 0; i < 10; i++) {
    const orderId = generateOrderId();
    const isValid = /^\d{5}$/.test(orderId);
    console.log(`${i + 1}. ${orderId} ${isValid ? '✅' : '❌'}`);
}

console.log('\n✨ Тест завершен!');
