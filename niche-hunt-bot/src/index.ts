import { Telegraf } from "telegraf";
import fetch from "node-fetch";
import { config } from "dotenv";
import { log } from "console";

config();

const productHuntClientId = process.env.PRODUCT_HUNT_CLIENT_ID!;
const productHuntClientSecret = process.env.PRODUCT_HUNT_CLIENT_SECRET!;

class Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  votesCount: number;
  createdAt: string;
  featuredAt: string | null;
  website: string;
  url: string;
  ogImageUrl: string;
  topics: string; // 新增属性用于存储话题标签
  media: Object[];

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.tagline = data.tagline;
    this.description = data.description;
    this.votesCount = data.votesCount;
    this.createdAt = this.convertToBeijingTime(data.createdAt);
    this.featuredAt = data.featuredAt ? "是" : "否";
    this.website = data.website;
    this.url = data.url;
    this.ogImageUrl = "";
    this.media = data.media;
    this.topics = this.formatTopics(data.topics); // 初始化时处理话题标签
  }

  private convertToBeijingTime(utcTimeStr: string): string {
    const utcTime = new Date(utcTimeStr);
    const offset = 8 * 60; // Beijing is UTC+8
    const beijingTime = new Date(utcTime.getTime() + offset * 60 * 1000);
    return beijingTime.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  }

  private formatTopics(topicsData: any): string {
    // 提取话题名称并格式化为 '#name1 #name2' 的形式
    return topicsData.nodes.map((node: any) => `#${node.name}`).join(" ");
  }

  public async fetchOgImageUrl(): Promise<void> {
    try {
      const response = await fetch(this.url);
      const text = await response.text();
      const ogImageMatch = text.match(
        /<meta property="og:image" content="(.*?)"/
      );
      this.ogImageUrl = ogImageMatch ? ogImageMatch[1] : "";
    } catch (error) {
      console.error(`Failed to fetch OG image for ${this.name}: ${error}`);
    }
  }
}

async function getProductHuntToken(): Promise<string> {
  const url = "https://api.producthunt.com/v2/oauth/token";
  const payload = {
    client_id: productHuntClientId,
    client_secret: productHuntClientSecret,
    grant_type: "client_credentials",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to obtain access token: ${
        response.status
      } ${await response.text()}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchProductHuntData(): Promise<Product[]> {
  const token =  '76mPN-WTUPaXFRUK_X7Gq7ga1cqMQzJwe1xyPbn7FGI'
  console.log(token, "token");
  
  const yesterday = new Date(Date.now());
  const dateStr = yesterday.toISOString().split("T")[0];
  const url = "https://api.producthunt.com/v2/api/graphql";
   
  const variables = {
    // postedAfter: "2024-07-01T00:00:00Z",
    // postedBefore: "2024-07-31T23:59:59Z",
    postedAfter: "2024/09/02",
    postedBefore: "",
    featured: true,
    first: 20,
  };
  // 定义查询模板，使用${variable}作为参数占位符
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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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

  return posts.map((post: any) => new Product(post));
}

const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Telegraf(botToken);
bot.start((ctx) => ctx.reply("Welcome to Niche Hunt!"));

bot.command("leaderboard", async (ctx) => {
  try {
    const products = await fetchProductHuntData();

    // for (const product of products) {
    //   await product.fetchOgImageUrl();
    //   const message = generateProductHTML(product);
    //   await bot.telegram.sendMessage("-1002227026093", message, {
    //     parse_mode: "HTML",
    //   });
    // }
  } catch (error) {
    ctx.reply("Failed to fetch the leaderboard. Please try again later.");
  }
});

// Your main function to fetch products and send to Telegram
async function main() {
  try {
    const products = await fetchProductHuntData();
    console.log(products.length, "length");

    for (const product of products) {
      log(product.name, "name");

      // await product.fetchOgImageUrl();
      // const message = generateProductHTML(product);
      // await bot.telegram.sendMessage("-1002227026093", message, {
      //   parse_mode: "HTML",
      //   disable_notification: false,
      //   link_preview_options: {
      //     is_disabled: false,
      //     url: product.website,
      //     prefer_small_media: false,
      //     prefer_large_media: false,
      //     show_above_text: true,
      //   },
      // });
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Function to generate the HTML message for each product
function generateProductHTML(product: Product): string {
  return `
<b> ${product.topics} </b>

<b>${product.name}</b> --- <i>${product.tagline}</i>  <a href="${product.website}">Link</a>

<b>Product description: </b> ${product.description}

<b>票数:</b> 🔺${product.votesCount} || <b>发布时间:</b> ${product.createdAt}
`;
}

main();
