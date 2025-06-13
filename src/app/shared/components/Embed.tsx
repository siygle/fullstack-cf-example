"use client"

import React from 'react';
import { EmbedRouter, detectEmbedType, extractCleanUrl } from './embeds/index';

interface EmbedProps {
  type?: 'twitter' | 'bluesky' | 'youtube' | 'auto';
  url: string;
}

export function Embed({ type = 'auto', url }: EmbedProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Clean the URL
  const cleanUrl = extractCleanUrl(url);

  // If type is specified, validate it matches the URL
  if (type !== 'auto') {
    const detectedType = detectEmbedType(cleanUrl);
    
    // If the specified type doesn't match the detected type, show a warning
    if (detectedType !== 'unknown' && detectedType !== type) {
      return (
        <div className="my-6 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">
              Embed type mismatch: specified "{type}" but URL appears to be "{detectedType}"
            </span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Using auto-detection instead.
          </p>
        </div>
      );
    }
  }

  // SSR-safe rendering
  if (!isClient) {
    return (
      <div className="my-6 flex justify-center">
        <div className="w-full max-w-lg border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use the embed router for smart detection and rendering
  return <EmbedRouter url={cleanUrl} />;
}

// Legacy support - keep the old interface working
export default Embed;