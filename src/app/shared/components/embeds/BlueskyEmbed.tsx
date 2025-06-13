"use client"

import React from 'react';

interface BlueskyEmbedProps {
  url: string;
}

// Extract post information from Bluesky URL
function extractBlueskyPostInfo(url: string): { handle: string; postId: string } | null {
  // Pattern: https://bsky.app/profile/{handle}/post/{postId}
  const pattern = /bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?#]+)/;
  const match = url.match(pattern);
  
  if (match && match[1] && match[2]) {
    return {
      handle: match[1],
      postId: match[2]
    };
  }

  return null;
}

export function BlueskyEmbed({ url }: BlueskyEmbedProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const postInfo = extractBlueskyPostInfo(url);

  if (!postInfo) {
    return (
      <div className="my-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">Invalid Bluesky URL</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View original post
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  // SSR-safe rendering with placeholder
  if (!isClient) {
    return (
      <div className="my-6 flex justify-center">
        <div className="w-full max-w-lg border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Bluesky Post</h3>
              <p className="text-sm text-slate-600">Loading...</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View original post
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  // Create a nice link card for Bluesky posts
  return (
    <div className="my-6 flex justify-center">
      <div className="w-full max-w-lg border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.017-.276.035-.415.056-2.67-.296-5.568.628-6.383 3.364C.378 17.58 0 22.54 0 23.23c0 .687.139 1.86.902 2.202.659.299 1.664.621 4.3-1.24 2.752-1.942 5.711-5.881 6.798-7.995z"/>
              <path d="M24 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C14.566.944 13.561 1.266 12.902 1.565c-.763.343-.902 1.515-.902 2.203 0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.017-.276.035-.415.056-2.67-.296-5.568.628-6.383 3.364-.246.829-.624 5.789-.624 6.479 0 .687.139 1.86.902 2.202.659.299 1.664.621 4.3-1.24 2.752-1.942 5.711-5.881 6.798-7.995z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Bluesky Post</h3>
            <p className="text-sm text-slate-600">@{postInfo.handle}</p>
          </div>
        </div>
        <p className="text-slate-700 mb-4 text-sm">
          View this post on Bluesky to see the full content and engage with the community.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white rounded-lg hover:from-blue-600 hover:to-sky-500 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
        >
          Open on Bluesky
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}