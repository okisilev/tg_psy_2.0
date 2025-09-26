#!/usr/bin/env node

/**
 * Скрипт для тестирования создания платежной ссылки Продамус
 * Запуск: node test-payment.js
 */

require('dotenv').config();
const ProdamusService = require('../src/services/prodamusService');

async function testPaymentCreation() {
    console.log('🧪 Тестирование создания платежной ссылки Продамус...\n');

    // Проверяем переменные окружения
    const requiredEnvVars = [
        'PRODAMUS_SHOP_ID',
        'PRODAMUS_SECRET_KEY',
        'WEBHOOK_URL',
        'PRODAMUS_WEBHOOK_URL'
    ];

    console.log('📋 Проверка переменных окружения:');
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (value) {
            console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
        } else {
            console.log(`❌ ${envVar}: НЕ НАЙДЕНА`);
            console.log('   Убедитесь, что файл .env создан и содержит все необходимые переменные');
            return;
        }
    }

    console.log('\n🔧 Создание сервиса Продамус...');
    const prodamusService = new ProdamusService();

    console.log('\n💳 Создание тестового платежа...');
    const paymentData = {
        userId: '123456789',
        amount: 1000,
        description: 'Тестовая подписка на закрытый канал',
        orderId: `test_order_${Date.now()}`
    };

    try {
        const result = await prodamusService.createPayment(paymentData);

        if (result.success) {
            console.log('✅ Платежная ссылка создана успешно!');
            console.log(`🔗 URL: ${result.paymentUrl}`);
            console.log(`📦 Order ID: ${result.orderId}`);
            
            console.log('\n📝 Параметры ссылки:');
            const url = new URL(result.paymentUrl);
            for (const [key, value] of url.searchParams) {
                console.log(`   ${key}: ${value}`);
            }
        } else {
            console.log('❌ Ошибка создания платежа:');
            console.log(`   ${result.error}`);
        }
    } catch (error) {
        console.log('❌ Исключение при создании платежа:');
        console.log(`   ${error.message}`);
    }

    console.log('\n🔍 Тестирование HMAC подписи...');
    const testData = {
        order_id: 'test_order_123',
        status: 'success',
        amount: '1000'
    };

    const signature = prodamusService.createHmacSignature(testData);
    const isValid = prodamusService.verifyWebhookSignature(testData, signature);

    if (isValid) {
        console.log('✅ HMAC подпись работает корректно');
    } else {
        console.log('❌ Проблема с HMAC подписью');
    }

    console.log('\n✨ Тестирование завершено!');
}

// Запуск теста
if (require.main === module) {
    testPaymentCreation().catch(console.error);
}

module.exports = testPaymentCreation;
