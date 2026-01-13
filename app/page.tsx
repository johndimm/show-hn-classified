import { getAppsByCategory, slugify } from "@/lib/data";
import { ExternalLink, MessageSquare, TrendingUp, Tag, ArrowRight } from "lucide-react";
import { AppImage } from "@/components/AppImage";
import { SearchInput } from "@/components/SearchInput";
import Link from "next/link";
import { Suspense } from "react";

export default async function Home() {
  const categories = await getAppsByCategory();
  const categoryNames = Object.keys(categories).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-orange-500 text-white p-1 rounded font-bold text-sm px-2 group-hover:bg-orange-600 transition-colors">HN</div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Show HN Classified</h1>
              </Link>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <Suspense fallback={<div className="h-10 w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />}>
                <SearchInput />
              </Suspense>
            </div>
          </div>
          <nav className="mt-4 flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar border-t border-zinc-100 dark:border-zinc-800 pt-3">
            {categoryNames.map(name => (
              <a 
                key={name}
                href={`#${slugify(name)}`}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-orange-500 transition-colors whitespace-nowrap"
              >
                {name}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-12">
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            A curated and classified list of recent Show HN submissions. 
            Browsing innovation, one category at a time.
          </p>
        </div>

        {categoryNames.map(category => (
          <section 
            key={category} 
            id={slugify(category)}
            className="mb-16 scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {category}
                </h2>
                <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-2">
                  ({categories[category].length} apps)
                </span>
              </div>
              <Link 
                href={`/${slugify(category)}`}
                className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 group"
              >
                View All in {category} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories[category].slice(0, 4).map(app => (
                <div 
                  key={app.id} 
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
                >
                  <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <AppImage 
                      src={app.metadata?.image || ''} 
                      alt={app.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      {app.score}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-tight line-clamp-2">
                      {app.title.replace('Show HN: ', '')}
                    </h3>
                    
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3 flex-grow">
                      {app.metadata?.description || "No description available."}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <a 
                          href={app.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                          Visit App <ExternalLink className="w-3 h-3" />
                        </a>
                        <a 
                          href={app.hnUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" /> {app.comments}
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                        by {app.author}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12 mt-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">
          Built for the Hacker News community. Classified automatically.
        </p>
      </footer>
    </div>
  );
}
