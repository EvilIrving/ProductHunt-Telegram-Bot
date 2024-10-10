import { QUERY_TEMPLATE } from './constants.js';
import { generateQueryForTimePeriod } from './utils.js';
import { Product } from './models.js';
import { getEnv } from './env.js';

export async function fetchProductHuntData(timePeriod) {
  const env = getEnv();
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

  const response = await fetch(env.API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PRODUCT_HUNT_ACCESS_TOKEN}`,
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
	console.log(`data: ${data.data.posts.nodes.length}`);
  return data.data.posts.nodes.map((post) => new Product(post));
}
