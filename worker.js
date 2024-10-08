// Constants
const CHANNEL_ID = "-1002227026093";
const TELEGRAM_BOT_TOKEN = "7329448395:AAGV_Mf_03RpSXhKqpFyRrPgMkhVWPYpvaI";
const PRODUCT_HUNT_ACCESS_TOKEN = "76mPN-WTUPaXFRUK_X7Gq7ga1cqMQzJwe1xyPbn7FGI";
const API_URL = "https://api.producthunt.com/v2/api/graphql";

// GraphQL query
const QUERY_TEMPLATE = `
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

// Enums
const TimePeriodEnum = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "thisweek",
  THIS_MONTH: "thismonth",
  LAST_WEEK: "lastweek",
  LAST_MONTH: "lastmonth",
};

// Classes
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

// Helper functions
function generateQueryForTimePeriod(timePeriod) {
  let today = new Date();
  let postedAfter, postedBefore;
  const dayOfWeek = today.getUTCDay();

  switch (timePeriod) {
    case TimePeriodEnum.TODAY:
      postedAfter = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + 1
        )
      );
      break;
    case TimePeriodEnum.YESTERDAY:
      postedAfter = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - 1
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );
      break;
    case TimePeriodEnum.THIS_WEEK:
      const startOfWeek = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - (dayOfWeek - (dayOfWeek === 0 ? 6 : 0))
        )
      );
      postedAfter = new Date(
        Date.UTC(
          startOfWeek.getUTCFullYear(),
          startOfWeek.getUTCMonth(),
          startOfWeek.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + (7 - dayOfWeek - (dayOfWeek === 0 ? 1 : 0))
        )
      );
      break;
    case TimePeriodEnum.THIS_MONTH:
      postedAfter = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      postedBefore = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
      );
      break;
    case TimePeriodEnum.LAST_WEEK:
      const startOfLastWeek = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - (today.getUTCDay() - 1 + 7)
        )
      );
      postedAfter = new Date(
        Date.UTC(
          startOfLastWeek.getUTCFullYear(),
          startOfLastWeek.getUTCMonth(),
          startOfLastWeek.getUTCDate()
        )
      );
      postedBefore = new Date(
        Date.UTC(
          startOfLastWeek.getUTCFullYear(),
          startOfLastWeek.getUTCMonth(),
          startOfLastWeek.getUTCDate() + 7
        )
      );
      break;
    case TimePeriodEnum.LAST_MONTH:
      const lastMonth =
        today.getUTCMonth() === 0 ? 11 : today.getUTCMonth() - 1;
      const lastMonthYear =
        today.getUTCMonth() === 0
          ? today.getUTCFullYear() - 1
          : today.getUTCFullYear();
      postedAfter = new Date(Date.UTC(lastMonthYear, lastMonth, 1));
      postedBefore = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      break;
    default:
      throw new Error("Invalid time period");
  }

  // Format the date to YYYY-MM-DD
  postedAfter = postedAfter.toISOString().split("T")[0];
  postedBefore = postedBefore
    ? postedBefore.toISOString().split("T")[0]
    : undefined;

  return {
    postedAfter,
    postedBefore,
  };
}

function generateProductHTML(product, index) {
  return `
<b>Rank: ${index + 1}   </b>

<b>${product.name}</b> --- <i>${product.tagline}</i>

<b>Product description: </b> ${product.description}

<b>Votes:</b> ${product.votesCount} 

<b>Publish date:</b> ${product.createdAt}

<b>🏷 ${product.topics}</b>
`;
}

// API functions
async function fetchProductHuntData(timePeriod) {
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

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PRODUCT_HUNT_ACCESS_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY_TEMPLATE,
      variables: variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data from Product Hunt: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.posts.nodes.map((post) => new Product(post));
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
 

  // const originalUrl = 
  const params = {
    chat_id: chatId,
    // media: { type: 'photo', media: photo },
    photo: photo,
    // message: html,
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

// Main functions
async function sendToUser(chatId, timePeriod) {
  const introMessage = getIntroMessage(timePeriod);
  await sendTelegramResponse(chatId, introMessage);

  const products = await fetchProductHuntData(timePeriod);
  for (let i = 0; i < products.length; i++) {
    await sendTelegramMediaResponse(chatId, products[i], i);
  }
}

function getIntroMessage(timePeriod) {
  const messages = {
    [TimePeriodEnum.TODAY]: "Today's products on Product Hunt:",
    [TimePeriodEnum.YESTERDAY]: "Yesterday's products on Product Hunt:",
    [TimePeriodEnum.THIS_WEEK]: "This week's products on Product Hunt:",
    [TimePeriodEnum.THIS_MONTH]: "This month's products on Product Hunt:",
    [TimePeriodEnum.LAST_WEEK]: "Last week's products on Product Hunt:",
    [TimePeriodEnum.LAST_MONTH]: "Last month's products on Product Hunt:",
  };
  return messages[timePeriod] || "Products on Product Hunt:";
}

async function handleCommand(chatId, command) {
  const commands = {
    "/start": () => sendTelegramResponse(chatId, "Welcome to Product Hunt Bot! Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt."),
    "/help": () => sendTelegramResponse(chatId, "Use /today, /yesterday, /thisweek, /thismonth, /lastweek, /lastmonth to get the latest products on Product Hunt."),
    "/contact": () => sendTelegramResponse(chatId, "You can contact me in telegram @noncain"),
    "/today": () => sendToUser(chatId, TimePeriodEnum.TODAY),
    "/yesterday": () => sendToUser(chatId, TimePeriodEnum.YESTERDAY),
    "/thisweek": () => sendToUser(chatId, TimePeriodEnum.THIS_WEEK),
    "/thismonth": () => sendToUser(chatId, TimePeriodEnum.THIS_MONTH),
    "/lastweek": () => sendToUser(chatId, TimePeriodEnum.LAST_WEEK),
    "/lastmonth": () => sendToUser(chatId, TimePeriodEnum.LAST_MONTH),
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

// Export
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },

  async scheduled(event, env, ctx) {
    const cronJobs = {
      "0 1 * * *": () => sendToUser(CHANNEL_ID, TimePeriodEnum.YESTERDAY),
      "0 0 * * mon": () => sendToUser(CHANNEL_ID, TimePeriodEnum.LAST_WEEK),
      "0 0 1 * *": () => sendToUser(CHANNEL_ID, TimePeriodEnum.LAST_MONTH),
    };

    const job = cronJobs[event.cron] || cronJobs["0 1 * * *"];
    await job();

    return new Response(event.cron + " OK", { status: 200 });
  },
};