import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load .env.local for local development
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config(); // Fallback to .env

const DATA_DIR = path.join(process.cwd(), 'data');
const METADATA_POSTS_FILE = path.join(DATA_DIR, 'posts_with_metadata.json');
const FINAL_POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const CLASSIFIED_POSTS_FILE = path.join(DATA_DIR, 'classified_posts.json');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable not set.');
    console.log('Please create a .env file with your key.');
    process.exit(1);
  }

  if (!fs.existsSync(METADATA_POSTS_FILE)) {
    console.error('posts_with_metadata.json not found. Run phase 3 first.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(METADATA_POSTS_FILE, 'utf8'));
  console.log(`Classifying ${posts.length} apps using LLM...`);

  // Step 1: Get a larger representative sample to define categories
  const sample = posts.slice(0, 300).map((p: any) => ({
    title: p.title,
    description: p.metadata?.description || ''
  }));

  console.log('Defining balanced categories...');
  const categoryPrompt = `
    Analyze these 300 Hacker News "Show HN" posts and suggest 9-10 distinct categories.
    
    CRITICAL: 
    1. The goal is to distribute ~900 apps so that each category has roughly 100 apps.
    2. Suggest only 9-10 high-level categories.
    3. DO NOT create generic categories like "AI" or "Development Tools" if they will end up with 200+ items. Instead, force them to split into more balanced high-level themes (e.g., instead of one big "AI", have "AI for Creative & Media" and "AI for Data & Code").
    4. Ensure every app in this list can fit into one of your categories.
    5. Avoid a large "Other" category.
    
    Apps to analyze:
    ${JSON.stringify(sample, null, 2)}
    
    Return ONLY a JSON object with a "categories" array of strings.
  `;

  const categoryResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: categoryPrompt }],
    response_format: { type: "json_object" }
  });

  // Extract array from JSON (expecting { "categories": [...] })
  const content = categoryResponse.choices[0].message.content || '{"categories": []}';
  const { categories } = JSON.parse(content);
  console.log(`Defined ${categories.length} categories:`, categories);

  // Step 2: Classify all apps in batches
  const batchSize = 50;
  const classifiedApps = [];

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(posts.length / batchSize)}...`);

    const classifyPrompt = `
      Classify these apps into EXACTLY ONE of the following categories:
      ${categories.join(', ')}
      
      CRITICAL:
      - DO NOT create new categories.
      - DO NOT use "Other" unless it is absolutely impossible to fit the app elsewhere.
      - Aim for a balanced distribution across the categories provided.
      - If multiple categories could apply, pick the one that seems most specific to the app's core value proposition.
      
      Apps:
      ${JSON.stringify(batch.map(p => ({ id: p.id, title: p.title, desc: p.metadata?.description || '' })), null, 2)}
      
      Return ONLY a JSON object where keys are app IDs and values are the chosen category name.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: classifyPrompt }],
      response_format: { type: "json_object" }
    });

    const classification = JSON.parse(response.choices[0].message.content || '{}');
    
    batch.forEach(post => {
      classifiedApps.push({
        ...post,
        category: classification[post.id] || 'Other'
      });
    });
  }

  fs.writeFileSync(FINAL_POSTS_FILE, JSON.stringify(classifiedApps, null, 2));
  fs.writeFileSync(CLASSIFIED_POSTS_FILE, JSON.stringify(classifiedApps, null, 2));
  console.log(`Saved results to ${FINAL_POSTS_FILE} and ${CLASSIFIED_POSTS_FILE}`);
}

main().catch(console.error);
