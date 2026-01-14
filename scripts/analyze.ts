import fs from 'fs';
import path from 'path';

const CLASSIFIED_FILE = path.join(process.cwd(), 'data', 'classified_posts.json');

function main() {
  if (!fs.existsSync(CLASSIFIED_FILE)) {
    console.error('classified_posts.json not found.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(CLASSIFIED_FILE, 'utf8'));
  
  const dates = posts.map((p: any) => p.timestamp.split('T')[0]);
  const dateCounts: Record<string, number> = {};
  
  dates.forEach((date: string) => {
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  const sortedDates = Object.keys(dateCounts).sort();
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const avgPerDay = posts.length / diffDays;

  const since2025 = posts.filter((p: any) => {
    const postDate = new Date(p.timestamp.split(' ')[0]);
    return postDate >= new Date('2025-01-01');
  }).length;

  const categoryCounts: Record<string, number> = {};
  posts.forEach((p: any) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  console.log(`--- Analysis of ${posts.length} apps ---`);
  console.log(`First post date: ${sortedDates[0]}`);
  console.log(`Last post date: ${sortedDates[sortedDates.length - 1]}`);
  console.log(`Duration: ${diffDays} days`);
  console.log(`Average posts per day (in this sample): ${avgPerDay.toFixed(2)}`);
  console.log(`Total posts since Jan 1, 2025: ${since2025}`);
  
  console.log('\n--- Category Distribution ---');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`${cat}: ${count} apps`);
    });

  // Show last 7 days distribution
  console.log('\n--- Posts in the last 7 days of the dataset ---');
  sortedDates.slice(-7).reverse().forEach(date => {
    console.log(`${date}: ${dateCounts[date]} posts`);
  });
}

main();
