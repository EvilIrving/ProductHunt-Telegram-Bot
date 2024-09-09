let bot;

export function setBot(bot) {
	bot = bot;
}

export function getBot() {
	if (!bot) {
		throw new Error('Bot not set');
	}
	return bot;
}
