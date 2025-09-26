const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const ProdamusService = require('./services/prodamusService');
const SubscriptionService = require('./services/subscriptionService');
const HmacService = require('./services/hmacService');
const BotHandlers = require('./handlers/botHandlers');

class TelegramSubscriptionBot {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.app = express();
        this.port = process.env.PORT || 3000;
        
        // Инициализация сервисов
        this.prodamusService = new ProdamusService();
        this.subscriptionService = new SubscriptionService();
        this.hmacService = new HmacService();
        this.botHandlers = new BotHandlers(this.bot, this.prodamusService, this.subscriptionService);
        
        this.setupExpress();
        this.setupBotHandlers();
    }

    setupExpress() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Webhook для Telegram
        this.app.post(process.env.WEBHOOK_PATH || '/webhook/telegram', (req, res) => {
            this.bot.processUpdate(req.body);
            res.sendStatus(200);
        });

        // Webhook для Продамус
        this.app.post('/sales/prodamus', (req, res) => {
            this.handleProdamusWebhook(req, res);
        });

        // Статус сервера
        this.app.get('/status', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
    }

    setupBotHandlers() {
        // Команды бота
        this.bot.onText(/\/start/, (msg) => this.botHandlers.handleStart(msg));
        this.bot.onText(/\/help/, (msg) => this.botHandlers.handleHelp(msg));
        this.bot.onText(/\/subscribe/, (msg) => this.botHandlers.handleSubscribe(msg));
        this.bot.onText(/\/status/, (msg) => this.botHandlers.handleStatus(msg));
        this.bot.onText(/\/admin/, (msg) => this.botHandlers.handleAdmin(msg));

        // Обработка callback query (кнопки)
        this.bot.on('callback_query', (callbackQuery) => {
            this.botHandlers.handleCallbackQuery(callbackQuery);
        });

        // Обработка ошибок
        this.bot.on('error', (error) => {
            console.error('Bot error:', error);
        });

        this.bot.on('polling_error', (error) => {
            console.error('Polling error:', error);
        });
    }

    async handleProdamusWebhook(req, res) {
        try {
            const { body } = req;
            
            // Получаем подпись из заголовков (Продамус использует заголовок 'Sign')
            const signature = req.headers['sign'] || req.headers['Sign'];
            
            if (!signature) {
                console.error('No signature found in headers');
                return res.status(400).json({ error: 'No signature found' });
            }

            // Проверяем HMAC подпись через ProdamusService
            const isValidSignature = this.prodamusService.verifyWebhookSignature(body, signature);

            if (!isValidSignature) {
                console.error('Invalid HMAC signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }

            console.log('Valid webhook received:', body);

            // Обрабатываем уведомление о платеже
            await this.subscriptionService.processPayment(body);
            
            res.json({ status: 'success' });
        } catch (error) {
            console.error('Prodamus webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    start() {
        const server = this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`Bot server running on 0.0.0.0:${this.port}`);
            console.log(`Telegram webhook: ${process.env.WEBHOOK_URL}${process.env.WEBHOOK_PATH}`);
            console.log(`Prodamus webhook: ${process.env.WEBHOOK_URL}/sales/prodamus`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${this.port} is already in use`);
                console.log(`💡 Try one of these solutions:`);
                console.log(`   1. Kill the process using the port: lsof -ti:${this.port} | xargs kill`);
                console.log(`   2. Use a different port: PORT=3001 npm start`);
                console.log(`   3. Check what's running: lsof -i:${this.port}`);
            } else {
                console.error('Server error:', err);
            }
            process.exit(1);
        });
    }
}

// Запуск бота
if (require.main === module) {
    const bot = new TelegramSubscriptionBot();
    bot.start();
}

module.exports = TelegramSubscriptionBot;
