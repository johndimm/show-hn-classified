import { getAppsByCategory, slugify } from "@/lib/data";
import { ChevronLeft } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { AppCard } from "@/components/AppCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const categories = await getAppsByCategory();
  const categoryName = Object.keys(categories).find(name => slugify(name) === slug);

  if (!categoryName) return { title: "Category Not Found" };

  return {
    title: `${categoryName} - Show HN Classified`,
    description: `Browse ${categories[categoryName].length} apps in the ${categoryName} category from Hacker News.`,
    openGraph: {
      title: `${categoryName} - Show HN Classified`,
      description: `Browse ${categories[categoryName].length} apps in the ${categoryName} category from Hacker News.`,
      images: ["/screenshot.png"],
    },
  };
}

export async function generateStaticParams() {
  const categories = await getAppsByCategory();
  return Object.keys(categories).map((category) => ({
    category: slugify(category),
  }));
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const categories = await getAppsByCategory();
  
  // Find the original category name
  const categoryName = Object.keys(categories).find(
    name => slugify(name) === slug
  );

  if (!categoryName) {
    notFound();
  }

  const apps = categories[categoryName];

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
                  <h1 className="text-xl font-bold tracking-tight">
                    {categoryName}
                  </h1>
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
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Showing {apps.length} apps in the {categoryName} category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {apps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12 mt-12 text-center">
        <Link href="/" className="text-orange-500 hover:underline font-medium">
          Back to all categories
        </Link>
      </footer>
    </div>
  );
}
