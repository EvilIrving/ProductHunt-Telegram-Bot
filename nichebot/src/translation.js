import { getEnv } from './env.js';

export async function translateText(text, sourceLang, targetLang) {
	try {
		const apiUrl = 'https://api.deepl-pro.com/v2/translate';
		const authKey = '25e193b9-704f-43a7-945a-6e22fa05f64e:dp';

		const formData = new URLSearchParams();
		if (Array.isArray(text)) {
			text.forEach((t) => formData.append('text', t));
		} else {
			formData.append('text', text);
		}
		formData.append('target_lang', targetLang);
		if (sourceLang) {
			formData.append('source_lang', sourceLang);
		}

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Authorization: `DeepL-Auth-Key ${authKey}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: formData,
		});

		if (response.status !== 200) {
			throw new Error(`接口错误: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();
		if (!result.translations || result.translations.length === 0) {
			throw new Error('翻译结果无效');
		}

		// 返回翻译文本
		return result.translations.map((translation) => translation.text);
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

export async function translateProduct(product) {
	const [translatedTagline, translatedDescription] = await translateText([product.tagline, product.description], 'EN', 'ZH');
	return {
		...product,
		tagline: translatedTagline,
		description: translatedDescription,
	};
}
