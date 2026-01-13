import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import metascraperFactory from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperUrl from 'metascraper-url';
import metascraperLogo from 'metascraper-logo';
import metascraperPublisher from 'metascraper-publisher';
import metascraperAuthor from 'metascraper-author';

const metascraper = metascraperFactory([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperUrl(),
  metascraperLogo(),
  metascraperPublisher(),
  metascraperAuthor()
]);

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

interface HNPost {
  id: string;
  title: string;
  url: string; // external url
  hnUrl: string; // hn discussion url
  author: string;
  score: number;
  comments: number;
  timestamp: string;
}

interface AppMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  logo?: string;
  publisher?: string;
  author?: string;
}

interface ClassifiedApp extends HNPost {
  metadata?: AppMetadata;
  category?: string;
}

async function fetchHNPage(url: string): Promise<{ posts: HNPost[], nextUrl: string | null }> {
  console.log(`Fetching ${url}...`);
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
    
    // If it's a relative link, it's an HN link (usually for Ask HN or some Show HNs)
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

    posts.push({
      id,
      title,
      url: externalUrl,
      hnUrl,
      author,
      score,
      comments,
      timestamp
    });
  });

  const moreLink = $('.morelink').attr('href');
  const nextUrl = moreLink ? `https://news.ycombinator.com/${moreLink}` : null;

  return { posts, nextUrl };
}

async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  const lowUrl = url.toLowerCase();
  // Filter out badges, shields, and other common non-screenshot images
  if (
    lowUrl.includes('img.shields.io') || 
    lowUrl.includes('badge.svg') || 
    lowUrl.includes('travis-ci.org') || 
    lowUrl.includes('circleci.com') ||
    lowUrl.includes('github-readme-stats') ||
    lowUrl.includes('codacy.com') ||
    lowUrl.includes('codecov.io') ||
    lowUrl.includes('opencollective.com') ||
    (lowUrl.includes('camo.githubusercontent.com') && (lowUrl.includes('6261646765') || lowUrl.includes('736869656c64')))
  ) {
    return false;
  }

  try {
    const res = await axios.get(url, { 
      timeout: 8000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'stream'
    });
    
    const contentType = res.headers['content-type'] || '';
    const isValid = res.status >= 200 && res.status < 300 && (contentType.startsWith('image/') || url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));
    
    // Close the stream immediately
    res.data.destroy();
    
    return !!isValid;
  } catch (e) {
    return false;
  }
}

async function getMetadata(url: string): Promise<AppMetadata | null> {
  try {
    console.log(`Extracting metadata for ${url}...`);
    const { data: html, request } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const finalUrl = request.res.responseUrl || url;
    const metadata = await metascraper({ html, url: finalUrl });
    
    const isGeneric = metadata.image?.includes('opengraph.githubassets.com') || metadata.image?.includes('github.com/identicons/');
    if (metadata.image && (isGeneric || !(await validateImageUrl(metadata.image)))) {
      console.log(`Initial image ${metadata.image} is generic or invalid, searching for alternatives...`);
      metadata.image = undefined;
    }

    if (finalUrl.includes('github.com') && !metadata.image) {
      const $ = cheerio.load(html);
      const candidates = $('.markdown-body img').map((i, el) => $(el).attr('src')).get();
      
      for (const src of candidates) {
        if (!src) continue;
        const low = src.toLowerCase();
        if (low.includes('badge') || low.includes('shield') || low.includes('logo') || low.includes('icon')) continue;

        let resolved = src;
        if (!src.startsWith('http')) {
          const urlObj = new URL(finalUrl);
          if (src.startsWith('/')) {
            resolved = `${urlObj.origin}${src}`;
          } else {
            const base = finalUrl.endsWith('/') ? finalUrl.slice(0, -1) : finalUrl;
            const branches = ['main', 'master'];
            let found = false;
            for (const branch of branches) {
              const testUrl = `${base}/raw/${branch}/${src}`;
              if (await validateImageUrl(testUrl)) {
                resolved = testUrl;
                found = true;
                break;
              }
            }
            if (!found) continue;
          }
        }

        if (resolved.includes('github.com') && (resolved.includes('/blob/') || resolved.includes('/raw/'))) {
          resolved = resolved
            .replace('github.com/', 'raw.githubusercontent.com/')
            .replace('/blob/', '/')
            .replace('/raw/', '/');
        }

        if (await validateImageUrl(resolved)) {
          console.log(`Found valid image candidate: ${resolved}`);
          metadata.image = resolved;
          break;
        }
      }
    }

    return metadata;
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, (error as Error).message);
    return null;
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  // Load existing posts to avoid re-fetching metadata
  let existingPosts: ClassifiedApp[] = [];
  if (fs.existsSync(POSTS_FILE)) {
    try {
      existingPosts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    } catch (e) {
      existingPosts = [];
    }
  }
  const existingMetadataMap = new Map<string, AppMetadata>();
  existingPosts.forEach(p => {
    if (p.metadata) existingMetadataMap.set(p.id, p.metadata);
  });

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

  console.log(`Found ${uniquePosts.length} unique posts.`);

  const classifiedApps: ClassifiedApp[] = [];
  const limit = 1500; 
  const subset = uniquePosts.slice(0, limit);

  for (const post of subset) {
    if (post.url.includes('news.ycombinator.com/item?id=')) {
      classifiedApps.push(post);
      continue;
    }

    // Force re-scrape for specific apps user mentioned or if image is likely a badge
    const currentMetadata = existingMetadataMap.get(post.id);
    const isBadge = currentMetadata?.image?.includes('shields.io') || currentMetadata?.image?.includes('badge') || currentMetadata?.image?.includes('camo.githubusercontent.com');
    const isGenericOrMissing = !currentMetadata?.image || currentMetadata?.image?.includes('githubassets.com');
    const isTarget = post.title.includes('Ferrite');

    if (existingMetadataMap.has(post.id) && !isGenericOrMissing && !isTarget && !isBadge) {
      classifiedApps.push({
        ...post,
        metadata: existingMetadataMap.get(post.id)
      });
      continue;
    }

    const metadata = await getMetadata(post.url);
    classifiedApps.push({
      ...post,
      metadata: metadata || undefined
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(classifiedApps, null, 2));
  console.log(`Saved ${classifiedApps.length} apps with metadata to ${POSTS_FILE}`);
}

main().catch(console.error);
