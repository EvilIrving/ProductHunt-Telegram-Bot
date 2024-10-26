import { getEnv } from './env.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

// 通用的Telegram API请求函数
async function makeApiRequest(method, params) {
	const env = getEnv();
	const url = `${TELEGRAM_API_BASE}${env.TELEGRAM_BOT_TOKEN}/${method}`;
	
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params),
		});
		
		const data = await response.json();
		if (!data.ok) {
			throw new Error(`Telegram API 错误: ${data.description}`);
		}
		return data.result;
	} catch (error) {
		console.error(`Telegram API 请求失败 (${method}):`, error);
		throw error;
	}
}

// 发送文本消息
export async function sendTelegramResponse(chatId, text) {
	const result = await makeApiRequest('sendMessage', { chat_id: chatId, text });
	return result.message_id;
}

// 发送带有HTML格式的文本消息
export async function sendTelegramTextResponse(chatId, repo, isZh, generateHTML) {
	const html = generateHTML(repo, isZh);
	await makeApiRequest('sendMessage', {
		chat_id: chatId,
		text: html,
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [[{ text: 'GitHub Link', url: repo.url }]],
		},
	});
	return new Response('消息发送成功!', { status: 200 });
}

// 发送媒体消息
export async function sendTelegramMediaResponse(chatId, product, index, generateHTML) {
	const html = generateHTML(product, index);
	const photo = product.media.length > 0 ? product.media[0].url : '';
	await makeApiRequest('sendPhoto', {
		chat_id: chatId,
		photo,
		caption: html,
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: [[{ text: '访问网站', url: product.website }]],
		},
	});
	return new Response('消息发送成功!', { status: 200 });
}

// 删除消息
export async function deleteTelegramMessage(chatId, messageId) {
	await makeApiRequest('deleteMessage', { chat_id: chatId, message_id: messageId });
}
