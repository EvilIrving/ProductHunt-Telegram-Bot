import { getEnv } from './env.js';

export async function sendTelegramResponse(chatId, text) {
	const env = getEnv();
	const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: text,
		}),
	});

	const data = await response.json();
	if (data.ok) {
		return data.result.message_id;
	} else {
		console.error('发送Telegram消息失败:', data);
		throw new Error('发送Telegram消息失败');
	}
}

export async function sendTelegramMediaResponse(chatId, product, index, generateHTML) {
	const env = getEnv();
	const html = generateHTML(product, index);
	const photo = product.media.length > 0 ? product.media[0].url : '';

	const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

	const params = {
		chat_id: chatId,
		photo: photo,
		caption: html,
		method: 'post',
		reply_markup: {
			inline_keyboard: [[{ text: 'Go to website', url: product.website }]],
		},
		parse_mode: 'HTML',
	};

	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});

		if (response.ok) {
			return new Response('Message sent successfully!', { status: 200 });
		} else {
			return new Response('Failed to send message.', { status: 500 });
		}
	} catch (error) {
		return new Response('Error occurred while sending the message.', {
			status: 500,
		});
	}
}

export async function deleteTelegramMessage(chatId, messageId) {
	const env = getEnv();
	const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/deleteMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			message_id: messageId,
		}),
	});

	const data = await response.json();
	if (!data.ok) {
		console.error('删除Telegram消息失败:', data);
		throw new Error('删除Telegram消息失败');
	}
}
