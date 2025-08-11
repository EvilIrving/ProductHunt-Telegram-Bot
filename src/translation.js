import { getEnv } from './env.js';
import OpenAI from 'openai';

export async function translateText(text, sourceLang, targetLang) {
	const env = getEnv();
	
	// 创建 OpenAI 客户端，使用阿里云的 DashScope API
	const openai = new OpenAI({
		apiKey: env.THIRD_API_KEY,
		baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
	});

	try {
		const texts = Array.isArray(text) ? text : [text];
		const translatedTexts = [];

		// 处理每个文本
		for (const t of texts) {
			const completion = await openai.chat.completions.create({
				model: 'qwen-mt-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a professional translator. Translate the following text from ${sourceLang || 'English'} to ${targetLang}. Only return the translated text without any explanations or additional formatting.`
					},
					{
						role: 'user',
						content: t
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			});

			if (completion.choices && completion.choices[0] && completion.choices[0].message) {
				translatedTexts.push(completion.choices[0].message.content.trim());
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
