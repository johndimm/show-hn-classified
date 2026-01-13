import { searchApps } from "@/lib/data";
import { ChevronLeft } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { AppCard } from "@/components/AppCard";
import Link from "next/link";
import { Suspense } from "react";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q: query } = await searchParams;
  return {
    title: query ? `Search: ${query} - Show HN Classified` : "Search - Show HN Classified",
    description: query ? `Search results for "${query}" across all Hacker News Show HN apps.` : "Search for apps across all Hacker News Show HN categories.",
  };
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query } = await searchParams;
  const results = query ? await searchApps(query) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {results.map(app => (
            <AppCard key={app.id} app={app} showCategory />
          ))}
        </div>

        {query && results.length === 0 && (
          <div className="text-center py-24">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">No apps found matching your search.</p>
            <Link href="/" className="text-orange-500 hover:underline mt-4 inline-block font-medium">
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
