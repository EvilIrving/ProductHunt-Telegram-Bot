import { TimePeriodEnum } from './constants.js';
import { fetchProductHuntData } from './api.js';
import { sendTelegramResponse, sendTelegramMediaResponse, deleteTelegramMessage } from './telegram.js';
import { translateProducts } from './translation.js';
import { getIntroMessage, generateProductHTML, generateProductHTMLZh } from './utils.js';
import { setEnv } from './env.js';

async function sendToUser(chatIds, timePeriod) {
	const introMessage = getIntroMessage(timePeriod);
	let products = await fetchProductHuntData(timePeriod);

	products = await translateProducts(products);
	const [chatId, chatIdEn] = chatIds;

	if (chatId) {
		await sendZhMessages(chatId, products);
	}

	if (chatIdEn) {
		await sendEnMessages(chatIdEn, introMessage, products);
	}

	return { status: 'Messages queued for sending' };
}

async function sendZhMessages(chatId, products) {
	let index = 0;
	for (let product of products) {
		await sendTelegramMediaResponse(chatId, product, index, generateProductHTMLZh);
		index++;
	}
}

async function sendEnMessages(chatId, introMessage, products) {
	await sendTelegramResponse(chatId, introMessage);
	let index = 0;
	for (let product of products) {
		await sendTelegramMediaResponse(chatId, product, index, generateProductHTML);
		index++;
	}
}

async function handleCommand(chatId, command) {
	const commands = {
		'/start': () =>
			'Welcome to Product Hunt Bot! Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt.',
		'/help': () => 'Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt.',
		'/contact': () => 'You can contact me in telegram @noncain',
		'/today': () => "Fetching today's products. Please wait...",
		'/yesterday': () => "Fetching yesterday's products. Please wait...",
		'/thisweek': () => "Fetching this week's products. Please wait...",
		'/thismonth': () => "Fetching this month's products. Please wait...",
		'/lastweek': () => "Fetching last week's products. Please wait...",
		'/lastmonth': () => "Fetching last month's products. Please wait...",
	};

	const handler = commands[command];
	if (handler) {
		const response = handler();
		let messageId;
		if (command !== '/start' && command !== '/help' && command !== '/contact') {
			// 发送等待消息并保存消息ID
			messageId = await sendTelegramResponse(chatId, response);

			// 触发实际的数据获取
			const timePeriod = command.split('/')[1];
			await sendToUser([chatId], timePeriod);

			// 删除等待消息
			await deleteTelegramMessage(chatId, messageId);
		} else {
			await sendTelegramResponse(chatId, response);
		}
	} else if (/^\d{4}-\d{2}-\d{2}$/.test(command)) {
		// 处理日期格式的输入
		const messageId = await sendTelegramResponse(chatId, `正在获取 ${command} 的产品数据,请稍候...`);
		await sendToUser([chatId], command);
		await deleteTelegramMessage(chatId, messageId);
	} else {
		await sendTelegramResponse(chatId, '无效的命令。请使用 /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth');
	}
}

async function handleRequest(request) {
	const { method } = request;
	const url = new URL(request.url);

	if (method === 'POST' && url.pathname === '/webhooks/telegram') {
		try {
			const { message } = await request.json();
			if (message && message.text) {
				const command = message.text.trim();
				const chatId = message.chat.id;
				await handleCommand(chatId, command);
				// console.log(`Command ${command} processed for chat ID ${chatId}`);
			}
		} catch (error) {
			console.error('Error processing Telegram webhook:', error);
			return new Response('Error processing request', { status: 500 });
		}
	}

	return new Response('OK', { status: 200 });
}

// 更新主要的发送逻辑，支持多频道发送
async function scheduledRequest(event, env) {
	const cronJobs = {
		'0 1 * * *': () => sendToUser([env.CHANNEL_ID_ZH, env.CHANNEL_ID], TimePeriodEnum.YESTERDAY),
		'0 0 * * mon': () => sendToUser([env.CHANNEL_ID_ZH, env.CHANNEL_ID], TimePeriodEnum.LAST_WEEK),
		'0 0 1 * *': () => sendToUser([env.CHANNEL_ID_ZH, env.CHANNEL_ID], TimePeriodEnum.LAST_MONTH),
	};

	const job = cronJobs[event.cron] || cronJobs['0 1 * * *'];
	await job();

	return new Response(event.cron + ' OK', { status: 200 });
}
// Export
export default {
	async fetch(request, env, ctx) {
		try {
			setEnv(env);
			return await handleRequest(request);
		} catch (error) {
			console.error('Error in fetch:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},

	async scheduled(event, env, ctx) {
		setEnv(env);
		return scheduledRequest(event, env);
	},
};
