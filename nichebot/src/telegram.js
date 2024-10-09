import { getEnv } from './env.js';

export async function sendTelegramResponse(chatId, message) {
  const env = getEnv();
  const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: chatId,
    text: message,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      return new Response("Message sent successfully!", { status: 200 });
    } else {
      return new Response("Failed to send message.", { status: 500 });
    }
  } catch (error) {
    return new Response("Error occurred while sending the message.", {
      status: 500,
    });
  }
}

export async function sendTelegramMediaResponse(chatId, product, index, generateHTML) {
  const env = getEnv();
  const html = generateHTML(product, index);
  const photo = product.media.length > 0 ? product.media[0].url : "";

  const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

  const params = {
    chat_id: chatId,
    photo: photo,
    caption: html,
    method: "post",
    reply_markup: {
      inline_keyboard: [[{ text: "Go to website", url: product.website }]],
    },
    parse_mode: "HTML",
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      return new Response("Message sent successfully!", { status: 200 });
    } else {
      return new Response("Failed to send message.", { status: 500 });
    }
  } catch (error) {
    return new Response("Error occurred while sending the message.", {
      status: 500,
    });
  }
}
