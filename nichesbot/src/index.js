import { Bot, webhookCallback } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';

// 初始化bot
const BOT_TOKEN = '7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI';
const bot = new Bot(BOT_TOKEN);

bot.api.config.use(autoRetry());
// Set up webhook URL.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/setWebhook?url=https://justbot.cain-wuyi.workers.dev/

export default {
	async fetch(request, env, ctx) {
		console.log('fetch');

		try {
			bot.command('start', async (ctx) => {
				console.log('Start command');

				await ctx.reply('Welcome to NichesBot Demo 🇬🇳!');
			});

			bot.command('help', async (ctx) => {
				await ctx.reply('Help message');
				await bot.api.sendMessage(ctx.chat.id, 'Help message By NichesBot');
			});

			// 处理其他的消息。
			bot.on('message', (ctx) => ctx.reply('Got another message!'));

			return webhookCallback(bot, 'cloudflare-mod')(request);
		} catch (e) {
			console.log(e);

			return new Response('Error: ' + e.message, { status: 500 });
		}
	},
};
