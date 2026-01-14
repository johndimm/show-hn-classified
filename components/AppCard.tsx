import { ExternalLink, MessageSquare, TrendingUp, Calendar, User, Building } from "lucide-react";
import { AppImage } from "./AppImage";
import { HNPost } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";

interface AppCardProps {
  app: HNPost;
  showCategory?: boolean;
}

export function AppCard({ app, showCategory }: AppCardProps) {
  const formattedTime = app.timestamp ? formatDistanceToNow(new Date(app.timestamp.split(' ')[0]), { addSuffix: true }) : null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full">
      {/* Hero Image Section */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <AppImage 
          src={app.metadata?.image || ''} 
          alt={app.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 border border-zinc-100 dark:border-zinc-800">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-zinc-900 dark:text-white">{app.score}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* Category & Publisher */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
            {showCategory && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded mr-1">
                {app.category}
              </span>
            )}
            {app.metadata?.logo && (
              <img src={app.metadata.logo} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
            )}
            {app.metadata?.publisher && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">
                {app.metadata.publisher}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
            {app.title.replace('Show HN: ', '')}
          </h3>
        </div>
        
        {/* Description */}
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-5 line-clamp-3 flex-grow leading-relaxed">
          {app.metadata?.description || "No description available."}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-y-3 mb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium truncate">@{app.author}</span>
          </div>
          
          {formattedTime && (
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 justify-end">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">{formattedTime}</span>
            </div>
          )}

          {app.metadata?.author && app.metadata.author !== app.author && (
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 col-span-2">
              <Building className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium truncate">By {app.metadata.author}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-auto">
          <a 
            href={app.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm shadow-orange-200 dark:shadow-none"
          >
            Visit App <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a 
            href={app.hnUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-2.5 rounded-lg text-sm font-bold transition-colors"
            title="Discuss on Hacker News"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{app.comments} <span className="hidden sm:inline">Comments</span></span>
          </a>
        </div>
      </div>
    </div>
  );
}
