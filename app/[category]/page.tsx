import { getAppsByCategory, slugify } from "@/lib/data";
import { ExternalLink, MessageSquare, TrendingUp, ChevronLeft } from "lucide-react";
import { AppImage } from "@/components/AppImage";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-orange-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 text-white p-1 rounded font-bold text-sm px-2">HN</div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {categoryName}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-12">
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Showing {apps.length} apps in the {categoryName} category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map(app => (
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
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12 mt-12 text-center">
        <Link href="/" className="text-orange-500 hover:underline font-medium">
          Back to all categories
        </Link>
      </footer>
    </div>
  );
}
