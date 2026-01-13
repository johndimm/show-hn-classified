import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const CLASSIFIED_FILE = path.join(DATA_DIR, 'classified_posts.json');

const CATEGORIES = {
  'Data Visualization & Dashboards': ['dashboard', 'monitor', 'geopolitical', 'budget', 'visualize', 'map', 'citi bike', 'stock', 'portfolio', '13f', 'yacht', 'tco', 'analytics', 'charts', 'plotting', 'd3', 'grafana', 'kibana', 'graph', 'visualization'],
  'Education & Philosophy': ['philosophy', 'course', 'learn', 'education', 'research', 'academy', 'tutorial', 'documentation', 'book', 'reading', 'school', 'university', 'history'],
  'Games & Entertainment': ['game', 'minesweeper', 'geoguess', 'word search', 'mario party', 'robot', 'piano', 'musical', 'ear training', 'tiktok', 'wikipedia', 'rocket', 'simulator', 'batte', 'music', 'video', 'stream', 'audio', 'puzzle', 'rpg', 'fps', 'unity', 'unreal'],
  'Productivity & Browser Extensions': ['chrome extension', 'saas tracker', 'subscription', 'browser history', 'new tab', 'spreadsheet', 'usage tracker', 'calendar', 'todo', 'notes', 'productivity', 'organizer', 'automation', 'slack', 'discord', 'email', 'crm'],
  'Web3 & Blockchain': ['blockchain', 'equity', 'solana', 'tokenized', 'securities', 'auction', 'crypto', 'nft', 'ethereum', 'bitcoin', 'web3', 'dao', 'defi'],
  'Design & Creative Tools': ['design', 'figma', 'svg', 'canvas', 'image editor', 'photo', 'icon', 'font', 'css', 'tailwind', 'ui', 'ux', 'animation', '3d', 'modeling'],
  'Privacy & Security': ['privacy', 'security', 'encryption', 'vpn', 'firewall', 'auth', 'authentication', 'password', 'hacking', 'osint', 'forensics', 'audit'],
  'Developer Tools & Frameworks': ['github', 'debug', 'debugger', 'terminal', 'cli', 'programming language', 'framework', 'rust', 'zig', 'go', 'git', 'pr', 'distributed', 'consensus', 'proxy', 'unzip', 'text editor', 'markdown', 'tmux', 'api', 'backend', 'frontend', 'database', 'docker', 'kubernetes', 'compiler', 'interpreter', 'npm', 'pip', 'cargo'],
  'AI & LLM Tools': ['ai', 'llm', 'claude', 'gpt', 'agent', 'chatbot', 'natural language', 'video generator', 'poker', 'machine learning', 'deep learning', 'openai', 'anthropic', 'stable diffusion', 'midjourney', 'transformer']
};

function classify(app: any): string {
  const content = (
    (app.title || '') + ' ' + 
    (app.metadata?.title || '') + ' ' + 
    (app.metadata?.description || '')
  ).toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'Other';
}

function main() {
  if (!fs.existsSync(POSTS_FILE)) {
    console.error('posts.json not found. Run scrape script first.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  const classifiedPosts = posts.map((post: any) => ({
    ...post,
    category: classify(post)
  }));

  // Group by category for easier display if needed, but let's keep it flat and let the UI handle it
  fs.writeFileSync(CLASSIFIED_FILE, JSON.stringify(classifiedPosts, null, 2));
  console.log(`Classified ${classifiedPosts.length} posts and saved to ${CLASSIFIED_FILE}`);
}

main();
