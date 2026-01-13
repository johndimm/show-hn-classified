'use client';

import { useState } from 'react';

interface AppImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function AppImage({ src, alt, className }: AppImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800 text-xs">
        No image available
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
