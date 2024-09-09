// Cloudflare Worker example for Telegram bot integration
const CHANNEL_ID = "-1002227026093";

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const TELEGRAM_BOT_TOKEN = "7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI";

// # PRODUCT HUNT API KEYS
const PRODUCT_HUNT_TOKEN = "76mPN-WTUPaXFRUK_X7Gq7ga1cqMQzJwe1xyPbn7FGI";

// Set up webhook URL.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/setWebhook?url=https://testbot.cain-wuyi.workers.dev/

// delete webhook URL.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/deleteWebhook

// get webhook info.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/getWebhookInfo

// get updates.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/getUpdates

// Cloudflare Worker code
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Sends a Telegram response to the specified chat ID with the given message.
 * @param {string} chatId - The chat ID where the message will be sent.
 * @param {string} message - The message to send.
 * @returns {Response} - The response from the Telegram API.
 */
async function sendTelegramResponse(chatId, message) {
  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
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
    console.error(error);
    return new Response("Error occurred while sending the message.", {
      status: 500,
    });
  }
}

/**
 * Handles incoming requests and responds with the appropriate action.
 * @param {Request} request - The incoming request to handle.
 * @returns {Response} - The response to the request.
 */
async function handleRequest(request) {
  const { method, headers } = request;

  const url = new URL(request.url);

  // Check if the request is a POST request to /webhooks/telegram and has JSON content-type
  if (
    method === "POST" &&
    url.pathname == "/webhooks/telegram" &&
    headers.get("content-type") === "application/json"
  ) {
    const data = await request.json();
    const { message } = data;

    if (message && message.text) {
      const command = message.text.trim();

      if (command.startsWith("/today")) {
        const chatId = message.chat.id;

        await sendTelegramResponse(chatId, "Test");

        return new Response("OK", { status: 200 });
      }
    }
  }

  return new Response("OK", { status: 200 });
}
