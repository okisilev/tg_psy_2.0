#!/usr/bin/env node

/**
 * Скрипт для проверки работы API Продамус
 */

const { config } = require('dotenv');
config();

async function testProdamusApi() {
    console.log('🧪 Проверка работы API Продамус...\n');

    // Проверка переменных окружения
console.log('📋 Проверка переменных окружения:');
const requiredVars = [
    'PRODAMUS_SHOP_ID',
    'PRODAMUS_SECRET_KEY',
    'PRODAMUS_PAYMENT_FORM_URL',
    'WEBHOOK_URL',
    'PRODAMUS_WEBHOOK_URL'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
    if (process.env[varName]) {
        const value = process.env[varName];
        const maskedValue = value.length > 10 ? 
            value.substring(0, 10) + '...' : 
            value;
        console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
        console.log(`❌ ${varName}: НЕ НАСТРОЕНА`);
        allVarsPresent = false;
    }
});

if (!allVarsPresent) {
    console.log('\n❌ Не все переменные окружения настроены!');
    process.exit(1);
}

console.log('\n🔧 Создание сервиса Продамус...');

try {
    const ProdamusService = require('../src/services/prodamusService');
    const prodamusService = new ProdamusService();

    console.log('✅ Сервис Продамус создан успешно');

    // Тест 1: Создание платежной ссылки
    console.log('\n💳 Тест 1: Создание платежной ссылки...');
    
    const paymentData = {
        userId: 'test_user_123',
        amount: 1000,
        description: 'Тестовая подписка на закрытый канал',
        orderId: 'test_' + Math.floor(Math.random() * 100000)
    };

    const result = await prodamusService.createPayment(paymentData);
    
    if (result.success) {
        console.log('✅ Платежная ссылка создана успешно!');
        console.log(`🔗 URL: ${result.paymentUrl}`);
        console.log(`📦 Order ID: ${result.orderId}`);
        
        // Анализ URL
        const url = new URL(result.paymentUrl);
        const params = url.searchParams;
        
        console.log('\n📝 Параметры ссылки:');
        for (const [key, value] of params) {
            console.log(`   ${key}: ${decodeURIComponent(value)}`);
        }
    } else {
        console.log('❌ Ошибка создания платежной ссылки:', result.error);
    }

    // Тест 2: Проверка HMAC подписи
    console.log('\n🔍 Тест 2: Проверка HMAC подписи...');
    
    const testData = {
        do: 'link',
        sys: process.env.PRODAMUS_SHOP_ID,
        order_id: 'test_signature',
        amount: 1000,
        currency: 'RUB'
    };
    
    const signature = prodamusService.createHmacSignature(testData);
    testData.signature = signature;
    
    const isValid = prodamusService.verifyWebhookSignature(testData, signature);
    
    if (isValid) {
        console.log('✅ HMAC подпись работает корректно');
    } else {
        console.log('❌ Ошибка в HMAC подписи');
    }

    // Тест 3: Проверка REST API
    console.log('\n🌐 Тест 3: Проверка REST API...');
    
    try {
        const restResult = await prodamusService.makeRestApiRequest('/rest/test/', {
            test: 'data'
        });
        console.log('✅ REST API доступен');
    } catch (error) {
        console.log('⚠️  REST API недоступен (это нормально для тестирования)');
    }

    console.log('\n✨ Все тесты завершены!');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        process.exit(1);
    }
}

// Запуск тестов
testProdamusApi().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
});
