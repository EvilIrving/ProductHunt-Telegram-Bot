import { getEnv } from './env.js';

export async function translateText(text, sourceLang, targetLang) {
	const env = getEnv();

	try {
		const texts = Array.isArray(text) ? text : [text];
		const translatedTexts = [];

		// 处理每个文本
		for (const t of texts) {
			const response = await fetch('https://api.longcat.chat/anthropic/v1/messages', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${env.THIRD_API_KEY}`,
					'Content-Type': 'application/json',
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'LongCat-Flash-Chat',
					max_tokens: 1000,
					messages: [
						{
							role: 'user',
							content: `Translate the following text from ${sourceLang || 'English'} to ${targetLang}. Only return the translated text without any explanations or additional formatting.\n\n${t}`
						}
					]
				})
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const result = await response.json();
			const translated = result.content?.[0]?.text?.trim();

			if (translated) {
				translatedTexts.push(translated);
			} else {
				throw new Error('翻译结果无效');
			}
		}

		return Array.isArray(text) ? translatedTexts : translatedTexts[0];
	} catch (error) {
		console.error(`翻译失败: ${error.message}`);
		return text; // 返回原文作为备选方案
	}
}

export async function translateProducts(products) {
	const texts = products
		.map((product) => {
			return [product.tagline, product.description];
		})
		.flat();
	const translatedTexts = await translateText(texts, 'EN', 'ZH');

	return products.map((product, index) => {
		return {
			...product,
			tagline_zh: translatedTexts[index * 2],
			description_zh: translatedTexts[index * 2 + 1],
		};
	});
}

export async function translateRepos(repos) {
	const texts = repos.map((repo) => {
		return repo.description;
	});

	const translatedTexts = await translateText(texts, 'EN', 'ZH');

	return repos.map((repo, index) => {
		return {
			...repo,
			description_zh: translatedTexts[index],
		};
	});
}

export async function translateProduct(product) {
	const [translatedTagline, translatedDescription] = await translateText([product.tagline, product.description], 'EN', 'ZH');
	return {
		...product,
		tagline: translatedTagline,
		description: translatedDescription,
	};
}
