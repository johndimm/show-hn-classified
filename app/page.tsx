import { getAppsByCategory, slugify } from "@/lib/data";
import { Tag, ArrowRight } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { AppCard } from "@/components/AppCard";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-orange-500 text-white p-1 rounded font-bold text-sm px-2 group-hover:bg-orange-600 transition-colors">HN</div>
                <h1 className="text-xl font-bold tracking-tight">Show HN Classified</h1>
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
            A curated directory of the best innovation from Hacker News. 
            Browsing Show HN, automatically classified.
          </p>
        </div>

        {categoryNames.map(category => (
          <section 
            key={category} 
            id={slugify(category)}
            className="mb-16 scroll-mt-32"
          >
            <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                <h2 className="text-2xl font-bold uppercase tracking-wider">
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
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {categories[category].slice(0, 4).map(app => (
                <AppCard key={app.id} app={app} />
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
