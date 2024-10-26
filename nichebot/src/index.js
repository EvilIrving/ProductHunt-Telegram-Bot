import { TimePeriodEnum } from './constants.js';
import { fetchProductHuntData } from './api.js';
import { sendTelegramResponse, sendTelegramTextResponse, sendTelegramMediaResponse, deleteTelegramMessage } from './telegram.js';
import { translateProducts, translateRepos } from './translation.js';
import { getIntroMessage, generateProductHTML, generateProductHTMLZh, generateRepoHTML } from './utils.js';
import { setEnv, getEnv } from './env.js';
import { fetchGitHubTrendingData } from './github.js';
async function sendToUser({ botId, chatIdZh, chatIdEn, timePeriod }) {
	const introMessage = getIntroMessage(timePeriod);
	let products = await fetchProductHuntData(timePeriod);

	products = await translateProducts(products);

	if (botId) {
		await sendZhMessages(botId, products);
	}
	if (chatIdZh) {
		await sendZhMessages(chatIdZh, products);
	}

	if (chatIdEn) {
		await sendEnMessages(chatIdEn, introMessage, products);
	}

	return { status: 'Messages queued for sending' };
}
async function sendGitHubMessages({ botId, chatIdEn, chatIdZh }) {
	let trendingRepos = await fetchGitHubTrendingData();
	// 翻译 描述信息
	trendingRepos = await translateRepos(trendingRepos);

	const promises = [];
	if (botId) {
		promises.push(sendRepoMessages(botId, trendingRepos, true));
	}

	if (chatIdEn) {
		promises.push(sendRepoMessages(chatIdEn, trendingRepos));
	}
	if (chatIdZh) {
		promises.push(sendRepoMessages(chatIdZh, trendingRepos, true));
	}

	await Promise.all(promises);

	return { status: 'Messages queued for sending' };
}
// 发送GitHub热榜数据
async function sendRepoMessages(chatId, repos, isZh = false) {
	let index = 0;
	for (let repo of repos) {
		await sendTelegramTextResponse(chatId, repo, isZh, generateRepoHTML);
		index++;
	}
}
// 发送PH 中文 数据
async function sendZhMessages(chatId, products) {
	let index = 0;
	for (let product of products) {
		await sendTelegramMediaResponse(chatId, product, index, generateProductHTMLZh);
		index++;
	}
}
// 发送PH 英文 数据
async function sendEnMessages(chatId, introMessage, products) {
	await sendTelegramResponse(chatId, introMessage);
	let index = 0;
	for (let product of products) {
		await sendTelegramMediaResponse(chatId, product, index, generateProductHTML);
		index++;
	}
}

async function handleCommand(chatId, command) {
	const env = getEnv();
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
		'/github': () => 'Fetching GitHub trending repos. Please wait...',
	};

	const handler = commands[command];
	if (handler) {
		const response = handler();
		let messageId;
		if (command === '/github') {
			// 获取今日的GitHub热榜，发送日期
			await sendTelegramResponse(chatId, `${new Date().toLocaleDateString()} 的 GitHub 热榜`);
			await sendGitHubMessages({ botId: chatId });
		} else if (command !== '/start' && command !== '/help' && command !== '/contact') {
			messageId = await sendTelegramResponse(chatId, response);

			// 触发实际的数据获取
			const timePeriod = command.split('/')[1];
			await sendToUser({ chatIdZh: chatId, timePeriod: timePeriod });

			// 删除等待消息
			await deleteTelegramMessage(chatId, messageId);
		} else {
			await sendTelegramResponse(chatId, response);
		}
	} else if (/^\d{4}-\d{2}-\d{2}$/.test(command)) {
		// 处理日期格式的输入
		const messageId = await sendTelegramResponse(chatId, `正在获取 ${command} 的产品数据,请稍候...`);
		await sendToUser({ botId: chatId, chatIdZh: env.CHANNEL_ID_ZH, timePeriod: command });
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
		// 每天中午 12 点
		'0 12 * * *': () => sendToUser({ chatIdZh: env.CHANNEL_ID_ZH, chatIdEn: env.CHANNEL_ID, timePeriod: TimePeriodEnum.YESTERDAY }),
		// 每月 1 日凌晨 3 点
		'0 3 1 * *': () => sendToUser({ chatIdZh: env.CHANNEL_ID_ZH, chatIdEn: env.CHANNEL_ID, timePeriod: TimePeriodEnum.LAST_WEEK }),
		// 每周一凌晨 3 点
		// '0 3 * * 1': () => sendToUser({ chatIdZh: env.CHANNEL_ID_ZH, chatIdEn: env.CHANNEL_ID, timePeriod: TimePeriodEnum.LAST_MONTH }),
		// 每天下午 3 点
		'0 15 * * *': () => sendGitHubMessages({ chatIdZh: env.CHANNEL_ID_ZH, chatIdEn: env.CHANNEL_ID }),
	};

	const job = cronJobs[event.cron] || cronJobs['0 12 * * *'];
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
		try {
			setEnv(env);
			return await scheduledRequest(event, env);
		} catch (error) {
			console.error('Error in scheduled:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
