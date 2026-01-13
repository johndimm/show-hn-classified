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

async function getMetadata(url: string): Promise<AppMetadata | null> {
  try {
    console.log(`Extracting metadata for ${url}...`);
    const { data: html, request } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // metascraper needs the final URL after redirects
    const finalUrl = request.res.responseUrl || url;
    const metadata = await metascraper({ html, url: finalUrl });
    
    // Improve GitHub images
    if (finalUrl.includes('github.com') && (metadata.image?.includes('opengraph.githubassets.com') || !metadata.image)) {
      console.log(`Detected generic GitHub image for ${finalUrl}, searching for screenshots in README...`);
      const $ = cheerio.load(html);
      // Look for images in the README (usually in .markdown-body)
      const readmeImages = $('.markdown-body img').map((i, el) => $(el).attr('src')).get();
      
      const screenshot = readmeImages.find(src => {
        if (!src) return false;
        const low = src.toLowerCase();
        // Prefer images that look like screenshots or examples
        return !low.includes('badge') && 
               !low.includes('shield') && 
               !low.includes('logo') && 
               !low.includes('icon') &&
               (low.includes('screenshot') || low.includes('demo') || low.includes('example') || low.includes('asset') || low.includes('images') || low.includes('raw'));
      }) || readmeImages[0]; // Fallback to first image if no "screenshot" found

      if (screenshot) {
        // Resolve relative URLs
        let resolvedScreenshot = screenshot;
        if (!screenshot.startsWith('http')) {
          const urlObj = new URL(finalUrl);
          if (screenshot.startsWith('/')) {
            resolvedScreenshot = `${urlObj.origin}${screenshot}`;
          } else {
            // For GitHub, if it's relative, it's usually relative to the repo root
            // We'll try to guess the raw URL
            resolvedScreenshot = `${finalUrl}/raw/main/${screenshot}`;
          }
        }
        
        // GitHub specific: convert blob links to raw links for images
        // Correctly handle the URL structure
        if (resolvedScreenshot.includes('github.com')) {
          resolvedScreenshot = resolvedScreenshot
            .replace('github.com/', 'raw.githubusercontent.com/')
            .replace('/blob/', '/')
            .replace('/raw/', '/');
        }
        
        console.log(`Found better image candidate: ${resolvedScreenshot}`);
        metadata.image = resolvedScreenshot;
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
  const maxPagesPerUrl = 30; // Further increased to get a massive list

  for (const startUrl of urls) {
    let currentUrl: string | null = startUrl;
    let pagesFetched = 0;

    while (currentUrl && pagesFetched < maxPagesPerUrl) {
      try {
        const { posts, nextUrl } = await fetchHNPage(currentUrl);
        allPosts = allPosts.concat(posts);
        currentUrl = nextUrl;
        pagesFetched++;
        // Wait a bit to be polite
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${currentUrl}:`, (error as Error).message);
        break;
      }
    }
  }

  // De-duplicate posts by ID
  const uniquePostsMap = new Map<string, HNPost>();
  allPosts.forEach(post => uniquePostsMap.set(post.id, post));
  const uniquePosts = Array.from(uniquePostsMap.values());

  console.log(`Found ${uniquePosts.length} unique posts.`);

  const classifiedApps: ClassifiedApp[] = [];
  
  // Set limit high to process a lot of apps
  const limit = 1500; 
  const subset = uniquePosts.slice(0, limit);

  for (const post of subset) {
    // Skip if URL is just HN
    if (post.url.includes('news.ycombinator.com/item?id=')) {
      classifiedApps.push(post);
      continue;
    }

    // Check cache first
    // Force re-scraping for the user's app or if image looks generic
    const isGenericImage = existingMetadataMap.get(post.id)?.image?.includes('opengraph.githubassets.com');
    const isUserApp = post.author === 'johndimm';

    if (existingMetadataMap.has(post.id) && !isGenericImage && !isUserApp) {
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
    // Be polite
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(classifiedApps, null, 2));
  console.log(`Saved ${classifiedApps.length} apps with metadata to ${POSTS_FILE}`);
}

main().catch(console.error);
