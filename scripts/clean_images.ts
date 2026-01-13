import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  const lowUrl = url.toLowerCase();
  if (
    lowUrl.includes('img.shields.io') || 
    lowUrl.includes('badge.svg') || 
    lowUrl.includes('travis-ci.org') || 
    lowUrl.includes('circleci.com') ||
    lowUrl.includes('github-readme-stats') ||
    lowUrl.includes('codacy.com') ||
    lowUrl.includes('codecov.io') ||
    lowUrl.includes('opencollective.com')
  ) {
    return false;
  }

  try {
    const res = await axios.get(url, { 
      timeout: 5000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'stream'
    });
    const contentType = res.headers['content-type'] || '';
    const isValid = res.status >= 200 && res.status < 300 && (contentType.startsWith('image/') || url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));
    res.data.destroy();
    return !!isValid;
  } catch (e) {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(POSTS_FILE)) {
    console.error('posts.json not found.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  console.log(`Checking ${posts.length} images...`);

  let checked = 0;
  let removed = 0;

  for (const post of posts) {
    if (post.metadata?.image) {
      const isValid = await validateImageUrl(post.metadata.image);
      if (!isValid) {
        console.log(`Removing invalid image for ${post.title}: ${post.metadata.image}`);
        post.metadata.image = undefined;
        removed++;
      }
    }
    checked++;
    if (checked % 50 === 0) console.log(`Checked ${checked}/${posts.length}...`);
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  console.log(`Finished. Removed ${removed} invalid images.`);
}

main();
