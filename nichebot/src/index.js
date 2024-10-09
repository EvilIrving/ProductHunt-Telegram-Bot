import { TimePeriodEnum } from './constants.js';
import { fetchProductHuntData } from './api.js';
import { sendTelegramResponse, sendTelegramMediaResponse } from './telegram.js';
import { translateText, translateProduct } from './translation.js';
import { getIntroMessage, generateProductHTML, generateProductHTMLZh } from './utils.js';
import { setEnv, getEnv } from './env.js';

// Main functions
async function sendToUser(chatIds, timePeriod) {
  const introMessage = getIntroMessage(timePeriod);
  const products = await fetchProductHuntData(timePeriod);

  for (const chatId of chatIds) {
    const env = getEnv();
    if (chatId === env.CHANNEL_ID_ZH) {
      // 翻译消息到中文
      const translatedIntro = await translateText(introMessage, "en", "zh");
      await sendTelegramResponse(chatId, translatedIntro);

      for (let i = 0; i < products.length; i++) {
        const translatedProduct = await translateProduct(products[i]);
        await sendTelegramMediaResponse(chatId, translatedProduct, i, generateProductHTMLZh);
      }
    } else {
      // 发送英文消息
      await sendTelegramResponse(chatId, introMessage);

      for (let i = 0; i < products.length; i++) {
        await sendTelegramMediaResponse(chatId, products[i], i, generateProductHTML);
      }
    }
  }
}

async function handleCommand(chatId, command) {
  const env = getEnv();
  const commands = {
    "/start": () => sendTelegramResponse(chatId, "Welcome to Product Hunt Bot! Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt."),
    "/help": () => sendTelegramResponse(chatId, "Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt."),
    "/contact": () => sendTelegramResponse(chatId, "You can contact me in telegram @noncain"),
    "/today": () => sendToUser([chatId], TimePeriodEnum.TODAY),
    "/yesterday": () => sendToUser([chatId], TimePeriodEnum.YESTERDAY),
    "/thisweek": () => sendToUser([chatId], TimePeriodEnum.THIS_WEEK),
    "/thismonth": () => sendToUser([chatId], TimePeriodEnum.THIS_MONTH),
    "/lastweek": () => sendToUser([chatId], TimePeriodEnum.LAST_WEEK),
    "/lastmonth": () => sendToUser([chatId], TimePeriodEnum.LAST_MONTH),
  };

  const handler = commands[command];
  if (handler) {
    await handler();
  } else {
    await sendTelegramResponse(chatId, "Invalid command. Please use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth");
  }
}

async function handleRequest(request) {
  const { method, headers } = request;
  const url = new URL(request.url);

  if (method === "POST" && url.pathname === "/webhooks/telegram") {
    const { message } = await request.json();
    if (message && message.text) {
      const command = message.text.trim();
      const chatId = message.chat.id;
      await handleCommand(chatId, command);
    }
  }

  return new Response("OK", { status: 200 });
}

// 更新主要的发送逻辑，支持多频道发送
async function scheduledRequest(event, env, ctx) {
  setEnv(env);
  const cronJobs = {
    "0 1 * * *": () => sendToUser([env.CHANNEL_ID, env.CHANNEL_ID_ZH], TimePeriodEnum.YESTERDAY),
    "0 0 * * mon": () => sendToUser([env.CHANNEL_ID, env.CHANNEL_ID_ZH], TimePeriodEnum.LAST_WEEK),
    "0 0 1 * *": () => sendToUser([env.CHANNEL_ID, env.CHANNEL_ID_ZH], TimePeriodEnum.LAST_MONTH),
  };

  const job = cronJobs[event.cron] || cronJobs["0 1 * * *"];
  await job();

  return new Response(event.cron + " OK", { status: 200 });
}

// Export
export default {
  async fetch(request, env, ctx) {
    setEnv(env);
    return handleRequest(request);
  },

  async scheduled(event, env, ctx) {
	setEnv(env);
    return scheduledRequest(event, env, ctx);
  },
};
