import * as cheerio from 'cheerio';
import { $fetch } from 'ofetch';
export async function fetchGitHubTrendingData() {
	const baseURL = 'https://github.com';
	const html = await $fetch(`${baseURL}/trending?since=daily`);

	const $ = cheerio.load(html);
	const $main = $('main .Box div[data-hpc] > article');

	const trendingRepos = [];
	$main.each((_, el) => {
		const a = $(el).find('>h2 a');
		const title = a.attr('href').replace(/^\//, ''); // 获取 href 并去除开头的斜杠
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
