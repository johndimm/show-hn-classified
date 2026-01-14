import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_RAW_FILE = path.join(DATA_DIR, 'posts_raw.json');
const HTML_CACHE_DIR = path.join(DATA_DIR, 'html_cache');

interface HNPost {
  id: string;
  title: string;
  url: string;
  hnUrl: string;
  author: string;
  score: number;
  comments: number;
  timestamp: string;
}

function main() {
  if (!fs.existsSync(POSTS_RAW_FILE)) {
    console.error('posts_raw.json not found.');
    return;
  }

  const posts: HNPost[] = JSON.parse(fs.readFileSync(POSTS_RAW_FILE, 'utf8'));
  
  // Count bad links
  let badLinks = 0;
  if (fs.existsSync(HTML_CACHE_DIR)) {
    const files = fs.readdirSync(HTML_CACHE_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = JSON.parse(fs.readFileSync(path.join(HTML_CACHE_DIR, file), 'utf8'));
        if (content.error || (content.html && content.html.length < 100)) {
          badLinks++;
        }
      }
    }
  }

  // Daily counts for this month (Jan 2026)
  const dailyCounts: Record<string, number> = {};
  posts.forEach((p) => {
    const date = p.timestamp.split('T')[0];
    if (date.startsWith('2026-01')) {
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
  });

  // Monthly counts for past year
  const monthlyCounts: Record<string, number> = {};
  posts.forEach((p) => {
    const month = p.timestamp.split('-').slice(0, 2).join('-');
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  console.log('--- Stats for README ---');
  console.log(`Total Apps: ${posts.length}`);
  console.log(`Bad Links: ${badLinks}`);
  
  console.log('\n--- Daily (Jan 2026) ---');
  Object.keys(dailyCounts).sort().forEach(d => {
    const bar = '█'.repeat(Math.ceil(dailyCounts[d] / 5));
    console.log(`${d}: ${dailyCounts[d]} ${bar}`);
  });

  console.log('\n--- Monthly (Past Year) ---');
  Object.keys(monthlyCounts).sort().forEach(m => {
    const bar = '█'.repeat(Math.ceil(monthlyCounts[m] / 20));
    console.log(`${m}: ${monthlyCounts[m]} ${bar}`);
  });
}

main();
