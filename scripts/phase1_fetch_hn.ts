import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_RAW_FILE = path.join(DATA_DIR, 'posts_raw.json');

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

async function fetchHNPage(url: string): Promise<{ posts: HNPost[], nextUrl: string | null }> {
  console.log(`Fetching HN page: ${url}...`);
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $ = cheerio.load(data);
  const posts: HNPost[] = [];

  $('.athing').each((i, el) => {
    const id = $(el).attr('id') || '';
    const titleRow = $(el);
    const subtextRow = titleRow.next();

    const titleLink = titleRow.find('.titleline > a');
    const title = titleLink.text();
    let externalUrl = titleLink.attr('href') || '';
    
    if (externalUrl.startsWith('item?id=')) {
      externalUrl = `https://news.ycombinator.com/${externalUrl}`;
    }

    const hnUrl = `https://news.ycombinator.com/item?id=${id}`;
    const author = subtextRow.find('.hnuser').text();
    const scoreText = subtextRow.find('.score').text();
    const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 0;
    
    const links = subtextRow.find('a');
    let comments = 0;
    links.each((i, link) => {
      const text = $(link).text();
      if (text.includes('comment')) {
        comments = parseInt(text.replace(/[^0-9]/g, '')) || 0;
      }
    });

    const timestamp = subtextRow.find('.age').attr('title') || '';

    posts.push({ id, title, url: externalUrl, hnUrl, author, score, comments, timestamp });
  });

  const moreLink = $('.morelink').attr('href');
  const nextUrl = moreLink ? `https://news.ycombinator.com/${moreLink}` : null;

  return { posts, nextUrl };
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  const urls = [
    'https://news.ycombinator.com/show',
    'https://news.ycombinator.com/shownew'
  ];

  let allPosts: HNPost[] = [];
  const maxPagesPerUrl = 30;

  for (const startUrl of urls) {
    let currentUrl: string | null = startUrl;
    let pagesFetched = 0;

    while (currentUrl && pagesFetched < maxPagesPerUrl) {
      try {
        const { posts, nextUrl } = await fetchHNPage(currentUrl);
        allPosts = allPosts.concat(posts);
        currentUrl = nextUrl;
        pagesFetched++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${currentUrl}:`, (error as Error).message);
        break;
      }
    }
  }

  const uniquePostsMap = new Map<string, HNPost>();
  allPosts.forEach(post => uniquePostsMap.set(post.id, post));
  const uniquePosts = Array.from(uniquePostsMap.values());

  fs.writeFileSync(POSTS_RAW_FILE, JSON.stringify(uniquePosts, null, 2));
  console.log(`Saved ${uniquePosts.length} raw posts to ${POSTS_RAW_FILE}`);
}

main().catch(console.error);
