import { searchApps } from "@/lib/data";
import { ExternalLink, MessageSquare, TrendingUp, ChevronLeft } from "lucide-react";
import { AppImage } from "@/components/AppImage";
import { SearchInput } from "@/components/SearchInput";
import Link from "next/link";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query } = await searchParams;
  const results = query ? await searchApps(query) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-zinc-500 hover:text-orange-500 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="bg-orange-500 text-white p-1 rounded font-bold text-sm px-2 group-hover:bg-orange-600 transition-colors">HN</div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Search Results</h1>
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <Suspense fallback={<div className="h-10 w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />}>
                <SearchInput />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-12">
          {query ? (
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Found {results.length} results for <span className="font-bold text-zinc-900 dark:text-white">"{query}"</span>
            </p>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400 text-lg text-center py-12">
              Enter a search term to find apps.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map(app => (
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
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black/60 backdrop-blur text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                    {app.category}
                  </span>
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

        {query && results.length === 0 && (
          <div className="text-center py-24">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">No apps found matching your search.</p>
            <Link href="/" className="text-orange-500 hover:underline mt-4 inline-block">
              Back to all categories
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12 mt-12 text-center">
        <Link href="/" className="text-orange-500 hover:underline font-medium">
          Back to Home
        </Link>
      </footer>
    </div>
  );
}
