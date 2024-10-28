import * as cheerio from 'cheerio';
import { $fetch } from 'ofetch';
export async function fetchGitHubTrendingData(time = 'daily', codeLang = '', lang = '') {
	const baseURL = 'https://github.com';

	console.log(`?${codeLang}?since=${time}&spoken_language_code=${lang}`);
	const html = await $fetch(`${baseURL}/trending/${codeLang}?since=${time}&spoken_language_code=${lang}`);

	const $ = cheerio.load(html);
	const $main = $('main .Box div[data-hpc] > article');

	const trendingRepos = [];
	$main.each((_, el) => {
		const a = $(el).find('>h2 a');
		const title = a.attr('href').replace(/^\//, ''); // 获取 href 并去除开头的斜杠
		const url = a.attr('href');
		const star = $(el).find('[href$=stargazers]').text().replace(/\s+/g, '').trim();
		const desc = $(el).find('>p').text().replace(/\n+/g, '').trim();
		const language = $(el).find('span[itemprop="programmingLanguage"]').text().trim();

		if (url && title) {
			trendingRepos.push({
				url: `${baseURL}${url}`,
				title,
				id: url,
				stars: star,
				description: desc,
				language,
			});
		}
	});

	console.log(`获取到 ${trendingRepos.length} 个热门仓库`);
	return trendingRepos;
}
