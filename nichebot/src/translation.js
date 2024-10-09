import { getEnv } from './env.js';

export async function translateText(text, sourceLang, targetLang) {
  const env = getEnv();
  const response = await env.AI.run(
    "@cf/meta/m2m100-1.2b",
    {
      text: text,
      source_lang: sourceLang,
      target_lang: targetLang,
    }
  );
  return response.translated_text;
}

export async function translateProduct(product) {
  const translatedName = await translateText(product.name, "en", "zh");
  const translatedTagline = await translateText(product.tagline, "en", "zh");
  const translatedDescription = await translateText(product.description, "en", "zh");
  const translatedTopics = await translateText(product.topics, "en", "zh");

  return {
    ...product,
    name: translatedName,
    tagline: translatedTagline,
    description: translatedDescription,
    topics: translatedTopics,
  };
}
