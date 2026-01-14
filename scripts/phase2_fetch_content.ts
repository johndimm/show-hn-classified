import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_RAW_FILE = path.join(DATA_DIR, 'posts_raw.json');
const HTML_CACHE_DIR = path.join(DATA_DIR, 'html_cache');

function getCachePath(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return path.join(HTML_CACHE_DIR, `${hash}.json`);
}

async function fetchAndCache(url: string) {
  const cachePath = getCachePath(url);
  if (fs.existsSync(cachePath)) return;

  try {
    console.log(`Downloading: ${url}...`);
    const { data: html, request } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const finalUrl = request.res.responseUrl || url;
    fs.writeFileSync(cachePath, JSON.stringify({ html, finalUrl }));
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error(`Failed to download ${url}:`, (error as Error).message);
    // Store empty result to avoid re-trying failed ones every time
    fs.writeFileSync(cachePath, JSON.stringify({ html: '', finalUrl: url, error: (error as Error).message }));
  }
}

async function main() {
  if (!fs.existsSync(HTML_CACHE_DIR)) fs.mkdirSync(HTML_CACHE_DIR, { recursive: true });
  if (!fs.existsSync(POSTS_RAW_FILE)) {
    console.error('posts_raw.json not found. Run phase 1 first.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_RAW_FILE, 'utf8'));
  console.log(`Checking content for ${posts.length} posts...`);

  let count = 0;
  for (const post of posts) {
    if (post.url.includes('news.ycombinator.com/item?id=')) continue;
    await fetchAndCache(post.url);
    count++;
    if (count % 50 === 0) console.log(`Progress: ${count}/${posts.length}`);
  }

  console.log('Finished downloading content.');
}

main().catch(console.error);
