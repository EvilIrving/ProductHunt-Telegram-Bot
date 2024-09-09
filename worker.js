// Cloudflare Worker example for Telegram bot integration
const CHANNEL_ID = "-1002227026093";

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const TELEGRAM_BOT_TOKEN = "7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI";

// # PRODUCT HUNT API KEYS
const PRODUCT_HUNT_ACCESS_TOKEN = "76mPN-WTUPaXFRUK_X7Gq7ga1cqMQzJwe1xyPbn7FGI";

const queryTemplate = `
    query GetPosts($postedAfter: DateTime!, $postedBefore: DateTime, $featured: Boolean!, $first: Int!) {
      posts(order: VOTES, postedAfter:  $postedAfter, postedBefore: $postedBefore, featured: $featured, first: $first) {
        nodes {
          id
          name
          tagline
          description
          votesCount
          createdAt
          featuredAt
          website
          url
          slug
          media {
            url
          }
          topics {
            nodes {
              id
              name
              description
              slug
              url
            }
          }
        }
      }
    }
    `;

const api = "https://api.producthunt.com/v2/api/graphql";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

addEventListener("scheduled", async (event) => {
  const cron = event.cron;
  switch (cron) {
    case "0 1 * * *":
      // Every day at midnight
      await sendToUser(CHANNEL_ID, "yesterday");
      break;
    case "0 0 * * mon":
      // Every Monday
      await sendToUser(CHANNEL_ID, "weekly");
      break;
    case "0 0 1 * *":
      // Every first day of the month
      await sendToUser(CHANNEL_ID, "monthly");
      break;
    default:
      await sendToUser(CHANNEL_ID, "monthly");
      break;
  }

  return new Response(cron + " OK", { status: 200 });
});

class Product {
  id;
  name;
  tagline;
  description;
  votesCount;
  createdAt;
  featuredAt;
  website;
  url;
  ogImageUrl;
  media;
  topics; // 新增属性用于存储话题标签

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.tagline = data.tagline;
    this.description = data.description;
    this.votesCount = data.votesCount;
    this.createdAt = this.convertTime(data.createdAt);
    this.featuredAt = data.featuredAt ? "是" : "否";
    this.website = data.website;
    this.url = data.url;
    this.ogImageUrl = "";
    this.media = data.media;
    this.topics = this.formatTopics(data.topics); // 初始化时处理话题标签
  }

  convertTime(utcTimeStr) {
    return new Date(utcTimeStr).toLocaleString("en-US");
  }

  formatTopics(topicsData) {
    // 处理话题标签
    return topicsData.nodes
      .map((node) => `#${node.name.replace(/\s+/g, "_")}`)
      .join(" ");
  }
}

// Set up webhook URL.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/setWebhook?url=https://testbot.cain-wuyi.workers.dev/

// delete webhook URL.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/deleteWebhook

// get webhook info.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/getWebhookInfo

// get updates.
// https://api.telegram.org/bot7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI/getUpdates

const TimePeriodEnum = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "thisweek",
  THIS_MONTH: "thismonth",
  LAST_WEEK: "lastweek",
  LAST_MONTH: "lastmonth",
};

function generateQueryForTimePeriod(timePeriod) {
  let today = new Date();
  let postedAfter, postedBefore;
  const dayOfWeek = today.getDay();

  switch (timePeriod) {
    case TimePeriodEnum.TODAY:
      postedAfter = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      break;
    case TimePeriodEnum.YESTERDAY:
      postedAfter = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1
      );
      postedBefore = postedAfter;
      break;
    case TimePeriodEnum.THIS_WEEK:
      const startOfWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek + 1
      );
      postedAfter = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate()
      );
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + (7 - dayOfWeek)
      );
      break;
    case TimePeriodEnum.THIS_MONTH:
      postedAfter = new Date(today.getFullYear(), today.getMonth(), 1);
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0 // last day of the current month
      );
      break;
    case TimePeriodEnum.LAST_WEEK:
      const startOfLastWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek - 6
      );
      postedAfter = new Date(
        startOfLastWeek.getFullYear(),
        startOfLastWeek.getMonth(),
        startOfLastWeek.getDate()
      );
      postedBefore = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - dayOfWeek
      );
      break;
    case TimePeriodEnum.LAST_MONTH:
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      postedAfter = lastMonth;
      postedBefore = lastMonthEnd;
      break;
    default:
      throw new Error("Invalid time period");
  }

  // Format the date to YYYY-MM-DD
  postedAfter = postedAfter.toLocaleDateString("en-US");
  if (postedBefore) {
    postedBefore = postedBefore.toLocaleDateString("en-US");
  }

  return {
    postedAfter,
    postedBefore: postedBefore ? postedBefore : undefined,
  };
}
async function fetchProductHuntData(chatId, timePeriod) {
  const { postedAfter, postedBefore } = generateQueryForTimePeriod(timePeriod);

  const variables = {
    postedAfter,
    postedBefore,
    featured: true,
    first: 20,
  };

  if (!postedBefore) {
    delete variables.postedBefore;
  }

  let message;
  switch (timePeriod) {
    case TimePeriodEnum.TODAY:
      message = "Today's products on Product Hunt:";
      break;
    case TimePeriodEnum.YESTERDAY:
      message = "Yesterday's products on Product Hunt:";
      break;
    case TimePeriodEnum.THIS_WEEK:
      message = "This week's products on Product Hunt:";
      break;
    case TimePeriodEnum.THIS_MONTH:
      message = "This month's products on Product Hunt:";
      break;
    case TimePeriodEnum.LAST_WEEK:
      message = "Last week's products on Product Hunt:";
      break;
    case TimePeriodEnum.LAST_MONTH:
      message = "Last month's products on Product Hunt:";
      break;
    default:
      throw new Error("Invalid time period");
  }

  await sendTelegramResponse(chatId, message);

  const response = await fetch(api, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PRODUCT_HUNT_ACCESS_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryTemplate,
      variables: variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch data from Product Hunt: ${
        response.status
      } ${await response.text()}`
    );
  }

  const data = await response.json();
  const posts = data.data.posts.nodes;
  return posts.map((post) => new Product(post));
}

function generateProductHTML(product, index) {
  return `
<b>Rank: ${index + 1}   </b>

<b>${product.name}</b> --- <i>${product.tagline}</i>  <a href="${
    product.website
  }">Link</a>

<b>Product description: </b> ${product.description}

<b>Votes:</b> ${product.votesCount} & <b>Publish date:</b> ${product.createdAt}

<b>🏷 ${product.topics}</b>
`;
}

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
    return new Response("Error occurred while sending the message.", {
      status: 500,
    });
  }
}

async function sendTelegramMediaResponse(chatId, product, index) {
  const html = generateProductHTML(product, index);
  const photo = product.media.length > 0 ? product.media[0].url : "";

  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const params = {
    chat_id: chatId,
    // media: { type: 'photo', media: photo },
    photo: photo,
    // message: html,
    caption: html,
    method: "post",
    reply_markup: {
      inline_keyboard: [[{ text: "Go to website", url: product.url }]],
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

async function sendToUser(chatId, timePeriod) {
  const products = await fetchProductHuntData(timePeriod, chatId);
  let index = 0;

  console.log("length of products: ", products.length);

  for (const product of products) {
    await sendTelegramMediaResponse(chatId, product, index);
    index++;
  }
}

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
      const chatId = message.chat.id;

      const commands = [
        "/today",
        "/yesterday",
        "/thisweek",
        "/thismonth",
        "/lastweek",
        "/lastmonth",
      ];
      if (commands.includes(command)) {
        await sendToUser(chatId, command.split("/").pop());
        return new Response("OK", { status: 200 });
      } else {
        await sendTelegramResponse(
          chatId,
          "Invalid command. Please use /today, /yesterday, /thisWeek, /thisMonth, /lastWeek, /lastMonth"
        );
        return new Response("OK", { status: 200 });
      }
    }
  }

  return new Response("OK", { status: 200 });
}

// commands
// start - Get start
// today - Get today products
// yesterday - Get yesterday products
// thisweek - Get this week products
// thismonth - Get this month products
// lastweek - Get last week products
// lastmonth - Get last month products
// help - Get help message
// contact - call me in telegram
