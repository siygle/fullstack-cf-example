"use client"

import React from 'react';
import { YouTubeEmbed } from './YouTubeEmbed';
import { TwitterEmbed } from './TwitterEmbed';
import { BlueskyEmbedOfficial } from './BlueskyEmbedOfficial';

interface EmbedRouterProps {
  url: string;
}

export type EmbedType = 'youtube' | 'twitter' | 'bluesky' | 'unknown';

// Smart URL detection middleware
export function detectEmbedType(url: string): EmbedType {
  // Clean the URL
  const cleanUrl = url.trim().toLowerCase();

  // YouTube patterns
  if (
    cleanUrl.includes('youtube.com/watch') ||
    cleanUrl.includes('youtu.be/') ||
    cleanUrl.includes('youtube.com/embed/') ||
    cleanUrl.includes('youtube.com/v/')
  ) {
    return 'youtube';
  }

  // Twitter/X patterns
  if (
    (cleanUrl.includes('twitter.com/') && cleanUrl.includes('/status/')) ||
    (cleanUrl.includes('x.com/') && cleanUrl.includes('/status/')) ||
    (cleanUrl.includes('mobile.twitter.com/') && cleanUrl.includes('/status/')) ||
    (cleanUrl.includes('mobile.x.com/') && cleanUrl.includes('/status/'))
  ) {
    return 'twitter';
  }

  // Bluesky patterns
  if (
    cleanUrl.includes('bsky.app/profile/') && cleanUrl.includes('/post/')
  ) {
    return 'bluesky';
  }

  return 'unknown';
}

// Extract clean URL from various formats
export function extractCleanUrl(input: string): string {
  // Remove common markdown link syntax if present
  const markdownLinkMatch = input.match(/\[.*?\]\((.*?)\)/);
  if (markdownLinkMatch) {
    return markdownLinkMatch[1];
  }

  // Remove angle brackets if present
  const angleBracketMatch = input.match(/<(.*)>/);
  if (angleBracketMatch) {
    return angleBracketMatch[1];
  }

  // Return as-is if no special formatting detected
  return input.trim();
}

export function EmbedRouter({ url }: EmbedRouterProps) {
  const cleanUrl = extractCleanUrl(url);
  const embedType = detectEmbedType(cleanUrl);

  // Validate URL format
  try {
    new URL(cleanUrl);
  } catch {
    return (
      <div className="my-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">Invalid URL format</span>
        </div>
        <p className="text-sm text-red-600 mt-1">Please provide a valid URL.</p>
      </div>
    );
  }

  switch (embedType) {
    case 'youtube':
      return <YouTubeEmbed url={cleanUrl} />;
    
    case 'twitter':
      return <TwitterEmbed url={cleanUrl} />;
    
    case 'bluesky':
      return <BlueskyEmbedOfficial url={cleanUrl} />;
    
    case 'unknown':
    default:
      // Fallback to a generic link card for unsupported URLs
      return (
        <div className="my-6">
          <div className="max-w-md mx-auto border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">External Link</h3>
                <p className="text-sm text-slate-600">Click to view content</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4 break-all">
              {cleanUrl.length > 60 ? `${cleanUrl.substring(0, 60)}...` : cleanUrl}
            </p>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              Open Link
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      );
  }
}