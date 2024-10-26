import { TimePeriodEnum } from './constants.js';
import { fetchProductHuntData } from './api.js';
import { sendTelegramResponse, sendTelegramTextResponse, sendTelegramMediaResponse, deleteTelegramMessage } from './telegram.js';
import { translateProducts, translateRepos } from './translation.js';
import { getIntroMessage, generateProductHTML, generateProductHTMLZh, generateRepoHTML } from './utils.js';
import { setEnv, getEnv } from './env.js';
import { fetchGitHubTrendingData } from './github.js';

// 新增一个统一的消息发送函数
async function sendMessages(options) {
	const { botId, chatIdZh, chatIdEn, data, sendFunction, introMessage } = options;

	const promises = [];
	if (botId) promises.push(sendFunction(botId, data, true));
	if (chatIdZh) promises.push(sendFunction(chatIdZh, data, true));
	if (chatIdEn) promises.push(sendFunction(chatIdEn, data, false, introMessage));

	await Promise.all(promises);
	return { status: '消息已加入发送队列' };
}

// 重构 sendToUser 函数
async function sendToUser({ botId, chatIdZh, chatIdEn, timePeriod }) {
	const introMessage = getIntroMessage(timePeriod);
	let products = await fetchProductHuntData(timePeriod);
	products = await translateProducts(products);

	return sendMessages({
		botId,
		chatIdZh,
		chatIdEn,
		data: products,
		sendFunction: sendProductMessages,
		introMessage,
	});
}

// 重构 sendGitHubMessages 函数
async function sendGitHubMessages({ botId, chatIdEn, chatIdZh, time = '', codeLang = '' }) {
	let trendingRepos = await fetchGitHubTrendingData(time, codeLang);
	trendingRepos = await translateRepos(trendingRepos);

	return sendMessages({
		botId,
		chatIdZh,
		chatIdEn,
		data: trendingRepos,
		sendFunction: sendRepoMessages,
	});
}

// 重命名并简化 sendRepoMessages 函数
async function sendRepoMessages(chatId, repos, isZh = false) {
	for (let repo of repos) {
		await sendTelegramTextResponse(chatId, repo, isZh, generateRepoHTML);
	}
}

// 合并 sendZhMessages 和 sendEnMessages 为一个函数
async function sendProductMessages(chatId, products, isZh = false, introMessage = null) {
	if (introMessage) await sendTelegramResponse(chatId, introMessage);

	for (let [index, product] of products.entries()) {
		await sendTelegramMediaResponse(chatId, product, index, isZh ? generateProductHTMLZh : generateProductHTML);
	}
}

async function handleCommand(chatId, command) {
	const env = getEnv();

	const commandHandlers = {
		'/start': () =>
			sendSimpleResponse(
				'欢迎使用 Product Hunt Bot! 使用 /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth 获取 Product Hunt 上的最新产品。'
			),
		'/help': () =>
			sendSimpleResponse('使用 /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth 获取 Product Hunt 上的最新产品。'),
		'/contact': () => sendSimpleResponse('您可以通过 Telegram @noncain 联系我'),
		'/github': () => handleGitHubCommand(),
		'/today': () => handleProductHuntCommand('today'),
		'/yesterday': () => handleProductHuntCommand('yesterday'),
		'/thisweek': () => handleProductHuntCommand('thisweek'),
		'/thismonth': () => handleProductHuntCommand('thismonth'),
		'/lastweek': () => handleProductHuntCommand('lastweek'),
		'/lastmonth': () => handleProductHuntCommand('lastmonth'),
	};

	const commandPatterns = [
		{ regex: /^code\s+/, handler: handleCodeLanguageCommand },
		{ regex: /^(daily|weekly|monthly)$/, handler: handleGitHubTimeCommand },
		{ regex: /^\d{4}-\d{2}-\d{2}$/, handler: handleDateCommand },
	];

	if (command in commandHandlers) {
		await commandHandlers[command]();
	} else {
		const matchedPattern = commandPatterns.find((pattern) => pattern.regex.test(command));
		if (matchedPattern) {
			await matchedPattern.handler(command);
		} else {
			await sendSimpleResponse('无效的命令。请使用 /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth');
		}
	}

	async function sendSimpleResponse(message) {
		await sendTelegramResponse(chatId, message);
	}

	async function handleGitHubCommand() {
		await sendTelegramResponse(chatId, `${new Date().toLocaleDateString()} 的 GitHub 热榜`);
		await sendGitHubMessages({ botId: chatId });
	}

	async function handleCodeLanguageCommand(command) {
		const codeLang = command.split(' ')[1];
		await sendTelegramResponse(chatId, `${codeLang} 语言的 GitHub 热榜`);
		await sendGitHubMessages({ botId: chatId, codeLang: codeLang });
	}

	async function handleGitHubTimeCommand(time) {
		await sendTelegramResponse(chatId, `${time} 的 GitHub 热榜`);
		await sendGitHubMessages({ botId: chatId, time: time });
	}

	async function handleProductHuntCommand(timePeriod) {
		const messageId = await sendTelegramResponse(chatId, `正在获取${timePeriod}的产品数据,请稍候...`);
		await sendToUser({ chatIdZh: chatId, timePeriod: timePeriod });
		await deleteTelegramMessage(chatId, messageId);
	}

	async function handleDateCommand(date) {
		const messageId = await sendTelegramResponse(chatId, `正在获取 ${date} 的产品数据,请稍候...`);
		await sendToUser({ botId: chatId, chatIdZh: env.CHANNEL_ID_ZH, timePeriod: date });
		await deleteTelegramMessage(chatId, messageId);
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
