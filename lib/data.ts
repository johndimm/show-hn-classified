import fs from 'fs';
import path from 'path';

export interface HNPost {
  id: string;
  title: string;
  url: string;
  hnUrl: string;
  author: string;
  score: number;
  comments: number;
  timestamp: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    logo?: string;
    publisher?: string;
    author?: string;
  };
  category: string;
}

export async function getApps(): Promise<HNPost[]> {
  const filePath = path.join(process.cwd(), 'data', 'classified_posts.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function sortApps(apps: HNPost[]) {
  return apps.sort((a, b) => {
    const aHasImage = !!a.metadata?.image;
    const bHasImage = !!b.metadata?.image;

    if (aHasImage && !bHasImage) return -1;
    if (!aHasImage && bHasImage) return 1;

    // Secondary sort by comments descending
    return (b.comments || 0) - (a.comments || 0);
  });
}

export async function getAppsByCategory(): Promise<Record<string, HNPost[]>> {
  const apps = await getApps();
  const grouped: Record<string, HNPost[]> = {};
  
  apps.forEach(app => {
    if (!grouped[app.category]) {
      grouped[app.category] = [];
    }
    grouped[app.category].push(app);
  });

  // Sort apps in each category
  for (const category in grouped) {
    sortApps(grouped[category]);
  }
  
  return grouped;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function getAppsForCategory(category: string): Promise<HNPost[]> {
  const apps = await getApps();
  const filtered = apps.filter(app => slugify(app.category) === category.toLowerCase());
  return sortApps(filtered);
}
