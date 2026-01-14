# Show HN Classified

![Show HN Classified Screenshot](https://raw.githubusercontent.com/johndimm/show-hn-classified/main/public/screenshot.png)

Hacker News rejects categorization of news articles because that makes silos.  I have no problem with that.  

But apps are a different story.  There is an undifferentiated sea of them now in Show HN and it makes them hard to browse.  Personally I get bored clicking through a huge list, one random app after another, trying to pick out the interesting ones based on title alone.  I'm sure I am missing lots of good stuff.  

Categorization of apps would be a good thing.  Developers naturally have different interests and silos of technical interest are not like political divisions.  Lumping all apps together is not the way to encourage us to look outside our current interests.

Hence this app.  It is a proof of concept, and I'm not sure if I will try to update it with any frequency.  Let me know in discussion if there is interest.  

The app was written in one evening using Cursor and Gemini 3 Flash.  The next day I asked it to use an LLM for the categorization rather than its first iteration using static keyword lists.  




## 🚀 How it Works

The application operates in three main stages:

1.  **Scraping**: Fetches the latest posts from Hacker News.
2.  **Download & Cache**: Downloads the HTML of each external link and caches it locally in `data/html_cache/`. This ensures we only download each link once.
3.  **Metadata Extraction**: Uses `metascraper` and custom logic to pull the best possible titles, descriptions, and images. For GitHub repositories, it deep-scans README files to find actual screenshots instead of generic social previews.
4.  **LLM Classification**: Uses GPT-4o-mini to analyze the metadata and group projects into ~10 balanced high-level categories, aiming for roughly 100 items per category for optimal browsing.

## 📋 Features

- **Categorized Browsing**: Quickly find apps in broad themes like "Web Development", "AI Tools", and "Creative & Media".
- **Rich Previews**: Each app card shows a high-quality screenshot, detailed description, and engagement metrics (score/comments).
- **Direct Links**: Easy access to both the live application and the original Hacker News discussion.
- **Dynamic Routing**: Dedicated pages for each category for focused browsing.
- **LLM-Powered Classification**: Uses GPT-4o-mini to dynamically group apps into balanced categories (~100 items each).

## 📊 Data Analysis

Our automated pipeline has identified **909 unique apps** from the most recent 60 pages of "Show HN" and "Show New HN".

### App Submission Frequency

**Daily Submissions (January 2026)**
The dataset shows a consistent volume of ~150 apps per day.

```text
2026-01-08: 165 █████████████████████████████████
2026-01-09: 139 ████████████████████████████
2026-01-10: 123 █████████████████████████
2026-01-11: 135 ███████████████████████████
2026-01-12: 156 ████████████████████████████████
2026-01-13: 182 █████████████████████████████████████
```

**Link Quality**
Of the 909 links processed:
- **Valid Links**: 882 (97%)
- **Bad/Broken Links**: 27 (3%) - *These are automatically identified and cleaned from the visual directory.*

### Monthly Trends (Past Year)
*Note: Our current scrape depth captures the last 7 days. To view full-year trends, the pipeline can be run with a higher page limit.*

```text
2026-01: 909 ██████████████████████████████████████████████
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

```bash
npm install
```

### Refreshing Data

To pull the latest 1,000+ apps from Hacker News and re-classify them:

```bash
npm run scrape
```

### Development

Start the Next.js development server:

```bash
npm run dev
```

## 📄 Origin

This project was built based on the [original prompt](./starting-prompt.txt).

> "Create an app that reads hacker news submitted apps and classifies them... The result should be a series of pages that show a category name followed by a list of apps showing the image, title, and description along with the original link."

## 🚀 Deployment

The app is designed to be deployed on **Vercel**. All classified data is saved statically in the `./data` directory, allowing for lightning-fast performance and SEO-friendly pages.
