import { TimePeriodEnum } from './constants.js';

export function generateQueryForTimePeriod(timePeriod) {
	let today = new Date();
	let postedAfter, postedBefore;
	const dayOfWeek = today.getUTCDay();

	// 检查是否为 yyyy-mm-dd 格式的日期
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (dateRegex.test(timePeriod)) {
		postedAfter = new Date(timePeriod);
		postedBefore = new Date(timePeriod);
		postedBefore.setUTCDate(postedBefore.getUTCDate() + 1);
	} else {
		switch (timePeriod) {
			case TimePeriodEnum.TODAY:
				postedAfter = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
				postedBefore = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
				break;
			case TimePeriodEnum.YESTERDAY:
				postedAfter = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
				postedBefore = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
				break;
			case TimePeriodEnum.THIS_WEEK:
				const startOfWeek = new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (dayOfWeek - (dayOfWeek === 0 ? 6 : 0)))
				);
				postedAfter = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate()));
				postedBefore = new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + (7 - dayOfWeek - (dayOfWeek === 0 ? 1 : 0)))
				);
				break;
			case TimePeriodEnum.THIS_MONTH:
				postedAfter = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
				postedBefore = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
				break;
			case TimePeriodEnum.LAST_WEEK:
				const startOfLastWeek = new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (today.getUTCDay() - 1 + 7))
				);
				postedAfter = new Date(Date.UTC(startOfLastWeek.getUTCFullYear(), startOfLastWeek.getUTCMonth(), startOfLastWeek.getUTCDate()));
				postedBefore = new Date(Date.UTC(startOfLastWeek.getUTCFullYear(), startOfLastWeek.getUTCMonth(), startOfLastWeek.getUTCDate() + 7));
				break;
			case TimePeriodEnum.LAST_MONTH:
				const lastMonth = today.getUTCMonth() === 0 ? 11 : today.getUTCMonth() - 1;
				const lastMonthYear = today.getUTCMonth() === 0 ? today.getUTCFullYear() - 1 : today.getUTCFullYear();
				postedAfter = new Date(Date.UTC(lastMonthYear, lastMonth, 1));
				postedBefore = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
				break;
			default:
				throw new Error('Invalid time period');
		}
	}

	// 格式化日期为 YYYY-MM-DD
	postedAfter = postedAfter.toISOString().split('T')[0];
	postedBefore = postedBefore ? postedBefore.toISOString().split('T')[0] : undefined;

	return {
		postedAfter,
		postedBefore,
	};
}

export function getIntroMessage(timePeriod) {
	const messages = {
		[TimePeriodEnum.TODAY]: "Today's products on Product Hunt:",
		[TimePeriodEnum.YESTERDAY]: "Yesterday's products on Product Hunt:",
		[TimePeriodEnum.THIS_WEEK]: "This week's products on Product Hunt:",
		[TimePeriodEnum.THIS_MONTH]: "This month's products on Product Hunt:",
		[TimePeriodEnum.LAST_WEEK]: "Last week's products on Product Hunt:",
		[TimePeriodEnum.LAST_MONTH]: "Last month's products on Product Hunt:",
	};
	return messages[timePeriod] || 'Products on Product Hunt:';
}

export function generateProductHTML(product, index) {
	return `
<b>🏅 Rank: ${index + 1}   </b>

<b>${product.name}</b> --- <i>${product.tagline}</i>  <a href="${product.url}">Link</a>

<b>📝 Product description: </b> ${product.description}

<b>👍 Votes:</b> ${product.votesCount}

<b>📅 Publish date:</b> ${product.createdAt}

<b>🏷 ${product.topics}</b>
`;
}

export function generateProductHTMLZh(product, index) {
	return `
<b>🏅 排名: ${index + 1}   </b>

<b>${product.name}</b> --- <i>${product.tagline_zh}</i>  <a href="${product.url}">链接</a>

<b>📝 产品描述: </b> ${product.description_zh}

<b>👍 投票数:</b> ${product.votesCount}

<b>📅 发布日期:</b> ${product.createdAt}

<b>🏷 ${product.topics}</b>
  `;
}
