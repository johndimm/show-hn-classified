import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
const POSTS_RAW_FILE = path.join(DATA_DIR, 'posts_raw.json');
const HTML_CACHE_DIR = path.join(DATA_DIR, 'html_cache');
const METADATA_POSTS_FILE = path.join(DATA_DIR, 'posts_with_metadata.json');

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

interface AppMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  logo?: string;
  publisher?: string;
  author?: string;
}

interface PostWithMetadata extends HNPost {
  metadata?: AppMetadata;
}

function getCachePath(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return path.join(HTML_CACHE_DIR, `${hash}.json`);
}

async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  const lowUrl = url.toLowerCase();
  
  // EXTREMELY strict badge/shield/icon filtering
  const blacklistedTerms = [
    'img.shields.io', 'badge.svg', 'travis-ci.org', 'circleci.com', 
    'opencollective.com', 'github-readme-stats', 'codacy.com', 
    'codecov.io', 'coveralls.io', 'npmify.js', 'hits.dwyl.com',
    'fossa.com', 'lgtm.com', 'sonarcloud.io', 'snyk.io'
  ];

  if (blacklistedTerms.some(term => lowUrl.includes(term))) {
    return false;
  }

  // Detect hex-encoded "badge", "shield", "github-news", etc. in camo/raw URLs
  const hexBlacklist = [
    '6261646765', // "badge"
    '736869656c64', // "shield"
    '4861636b6572204e657773', // "Hacker News"
    '53686f7720484e' // "Show HN"
  ];

  if (lowUrl.includes('camo.githubusercontent.com') || lowUrl.includes('raw.githubusercontent.com')) {
    if (hexBlacklist.some(hex => lowUrl.includes(hex))) {
      return false;
    }
  }

  try {
    const res = await axios.get(url, { 
      timeout: 8000, 
      headers: { 'User-Agent': 'Mozilla/5.0' }, 
      responseType: 'stream' 
    });
    const contentType = res.headers['content-type'] || '';
    const isValid = res.status >= 200 && res.status < 300 && (contentType.startsWith('image/') || url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));
    
    // Also check content length - tiny images are usually icons or badges
    const contentLength = parseInt(res.headers['content-length'] || '10000');
    if (contentLength < 2000 && !url.endsWith('.svg')) {
      res.data.destroy();
      return false;
    }

    res.data.destroy();
    return !!isValid;
  } catch (e) {
    return false;
  }
}

async function processPost(post: HNPost): Promise<PostWithMetadata> {
  let metadata: AppMetadata = {};
  const cachePath = getCachePath(post.url);

  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (cached.html) {
      try {
        const extracted = await metascraper({ html: cached.html, url: cached.finalUrl });
        metadata = extracted;
        
        // Clean up images
        const isGeneric = metadata.image?.includes('opengraph.githubassets.com') || metadata.image?.includes('github.com/identicons/');
        const isCamo = metadata.image?.includes('camo.githubusercontent.com');
        if (metadata.image && (isGeneric || isCamo || !(await validateImageUrl(metadata.image)))) {
          metadata.image = undefined;
        }

        // GitHub specific logic: search README if no good image yet
        if (cached.finalUrl.includes('github.com') && !metadata.image) {
          const $ = cheerio.load(cached.html);
          const candidates = $('.markdown-body img').map((i, el) => $(el).attr('src')).get();
          
          // Sort candidates: prefer those with keywords that suggest they are good previews
          const previewKeywords = ['timeline', 'dashboard', 'screenshot', 'demo', 'graph', 'preview', 'result', 'example', 'Constellations', 'John Von Neumann'];
          const sortedCandidates = candidates.sort((a, b) => {
            const aLow = (a || '').toLowerCase();
            const bLow = (b || '').toLowerCase();
            
            // Extreme priority for the user's specifically requested image
            const aIsRequested = aLow.includes('john%20von%20neumann') || aLow.includes('john von neumann');
            const bIsRequested = bLow.includes('john%20von%20neumann') || bLow.includes('john von neumann');
            if (aIsRequested && !bIsRequested) return -1;
            if (!aIsRequested && bIsRequested) return 1;

            const aScore = previewKeywords.some(kw => aLow.includes(kw.toLowerCase())) ? 1 : 0;
            const bScore = previewKeywords.some(kw => bLow.includes(kw.toLowerCase())) ? 1 : 0;
            return bScore - aScore;
          });

          for (const src of sortedCandidates) {
            if (!src) continue;
            const low = src.toLowerCase();
            if (low.includes('badge') || low.includes('shield') || low.includes('logo') || low.includes('icon')) continue;

            let resolved = src;
            if (!src.startsWith('http')) {
              const urlObj = new URL(cached.finalUrl);
              if (src.startsWith('/')) {
                resolved = `${urlObj.origin}${src}`;
              } else {
                resolved = `${cached.finalUrl}/raw/main/${src}`;
              }
            }

            if (resolved.includes('github.com')) {
              resolved = resolved.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/').replace('/raw/', '/');
            }

            if (await validateImageUrl(resolved)) {
              metadata.image = resolved;
              break;
            }
          }
        }
      } catch (e) {
        console.error(`Error processing metadata for ${post.id}:`, (e as Error).message);
      }
    }
  }

  return { ...post, metadata: Object.keys(metadata).length ? metadata : undefined };
}

async function main() {
  if (!fs.existsSync(POSTS_RAW_FILE)) {
    console.error('posts_raw.json not found. Run phase 1 and 2 first.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_RAW_FILE, 'utf8'));
  console.log(`Analyzing metadata for ${posts.length} posts...`);

  const results: PostWithMetadata[] = [];
  let count = 0;
  for (const post of posts) {
    results.push(await processPost(post));
    count++;
    if (count % 50 === 0) console.log(`Processed: ${count}/${posts.length}`);
  }

  fs.writeFileSync(METADATA_POSTS_FILE, JSON.stringify(results, null, 2));
  console.log(`Saved metadata results to ${METADATA_POSTS_FILE}`);
}

main().catch(console.error);
