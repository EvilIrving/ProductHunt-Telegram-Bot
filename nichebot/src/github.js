import * as cheerio from 'cheerio';
import { getEnv } from './env.js';

export async function fetchGitHubTrendingData() {
	const env = getEnv();
	const baseURL = 'https://github.com';
	const response = await fetch(`${baseURL}/trending?spoken_language_code=`, {
		headers: {
			Accept: 'application/json',
			'User-Agent': env.USER_AGENT || 'NicheBot',
		},
	});

	if (!response.ok) {
		throw new Error(`获取GitHub热榜数据失败: ${response.status} ${await response.text()}`);
	}

	const html = await response.text();
	const $ = cheerio.load(html);
	const $main = $('main .Box div[data-hpc] > article');

	const trendingRepos = [];
	$main.each((_, el) => {
		const a = $(el).find('>h2 a');
		const title = a.text().replace(/\n+/g, '').trim();
		const url = a.attr('href');
		const star = $(el).find('[href$=stargazers]').text().replace(/\s+/g, '').trim();
		const desc = $(el).find('>p').text().replace(/\n+/g, '').trim();

		if (url && title) {
			trendingRepos.push({
				url: `${baseURL}${url}`,
				title,
				id: url,
				stars: star,
				description: desc,
			});
		}
	});

	console.log(`获取到 ${trendingRepos.length} 个热门仓库`);
	return trendingRepos;
}

fetchGitHubTrendingData();
