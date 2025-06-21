"use client"

import React, { useState, useEffect } from "react"
import { BlueskyEmbedOfficial } from "../../shared/components/embeds/BlueskyEmbedOfficial"
import { detectEmbedType as routerDetectEmbedType } from "../../shared/components/embeds/EmbedRouter"
import { LinkPreview, EnhancedLink } from "../../shared/components/LinkPreview"
import { CardPreview } from "../../shared/components/CardPreview"

interface PostContentProps {
  content: string;
  format: 'html' | 'plain' | 'markdown';
}

// Enhanced markdown renderer with better styling and features
function simpleMarkdownRender(content: string): string {
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';
  let inList = false;
  
  return lines
    .map((line, index) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim();
          codeBlockContent = '';
          return '';
        } else {
          inCodeBlock = false;
          const result = `<pre class="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-6"><code class="text-sm font-mono${codeBlockLanguage ? ` language-${codeBlockLanguage}` : ''}">${escapeHtml(codeBlockContent)}</code></pre>`;
          codeBlockContent = '';
          return result;
        }
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return '';
      }
      
      // Handle headings with better styling
      if (line.startsWith('# ')) {
        return `<h1 class="text-4xl font-bold text-slate-900 mb-6 mt-8 first:mt-0 leading-tight">${escapeHtml(line.slice(2))}</h1>`;
      }
      if (line.startsWith('## ')) {
        return `<h2 class="text-3xl font-bold text-slate-900 mb-5 mt-8 first:mt-0 leading-tight">${escapeHtml(line.slice(3))}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-2xl font-bold text-slate-900 mb-4 mt-6 first:mt-0 leading-tight">${escapeHtml(line.slice(4))}</h3>`;
      }
      if (line.startsWith('#### ')) {
        return `<h4 class="text-xl font-bold text-slate-900 mb-3 mt-5 first:mt-0 leading-tight">${escapeHtml(line.slice(5))}</h4>`;
      }
      
      // Handle blockquotes
      if (line.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-slate-700 italic">${escapeHtml(line.slice(2))}</blockquote>`;
      }
      
      // Handle horizontal rules
      if (line.trim() === '---' || line.trim() === '***') {
        return `<hr class="border-t border-slate-300 my-8" />`;
      }
      
      // Handle lists with better nesting
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          inList = true;
        }
        return `<li class="ml-6 mb-2 list-disc text-slate-700">${processInlineMarkdown(line.slice(2))}</li>`;
      }
      if (line.match(/^\d+\. /)) {
        if (!inList) {
          inList = true;
        }
        return `<li class="ml-6 mb-2 list-decimal text-slate-700">${processInlineMarkdown(line.replace(/^\d+\. /, ''))}</li>`;
      }
      
      // Reset list state if not in list
      if (inList && !line.startsWith('- ') && !line.startsWith('* ') && !line.match(/^\d+\. /) && line.trim()) {
        inList = false;
      }
      
      // Empty line
      if (!line.trim()) {
        return '<div class="h-4"></div>';
      }
      
      // Default paragraph with better styling
      return `<p class="mb-6 text-slate-700 leading-relaxed">${processInlineMarkdown(line)}</p>`;
    })
    .filter(line => line !== '')
    .join('\n');
}

// Process inline markdown (bold, italic, code, links)
function processInlineMarkdown(text: string): string {
  let processed = escapeHtml(text);
  
  // Handle bold
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  
  // Handle italic
  processed = processed.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  // Handle inline code
  processed = processed.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono">$1</code>');
  
  // Handle links - now with enhanced preview support
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Check if this should be a preview link (standalone links on their own lines will be handled separately)
    return `<a href="${url}" class="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  
  return processed;
}

// Escape HTML to prevent XSS (SSR-safe)
function escapeHtml(text: string): string {
  // Use a simple string replacement approach that works on both server and client
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Simple embed detection functions
function detectEmbedType(url: string): 'youtube' | 'twitter' | 'bluesky' | 'unknown' {
  const cleanUrl = url.trim().toLowerCase();
  
  if (cleanUrl.includes('youtube.com/watch') || cleanUrl.includes('youtu.be/')) {
    return 'youtube';
  }
  if ((cleanUrl.includes('twitter.com/') || cleanUrl.includes('x.com/')) && cleanUrl.includes('/status/')) {
    return 'twitter';
  }
  if (cleanUrl.includes('bsky.app/profile/') && cleanUrl.includes('/post/')) {
    return 'bluesky';
  }
  return 'unknown';
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractTwitterId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/.*\/status\/(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function fetchBlueskyEmbed(url: string) {
  try {
    // Use our server-side proxy to avoid CORS issues
    const proxyUrl = `/api/bluesky-oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Bluesky oEmbed:', error);
    return null;
  }
}


// Enhanced embed component with proper embeds
function SimpleEmbed({ type, url }: { type: string; url: string }) {
  const [isClient, setIsClient] = React.useState(false);
  const [blueskyData, setBlueskyData] = React.useState<any>(null);

  React.useEffect(() => {
    setIsClient(true);
    
    // Fetch Bluesky embed data if needed
    if (type === 'bluesky') {
      fetchBlueskyEmbed(url).then(setBlueskyData);
    }
  }, [type, url]);

  if (!isClient) {
    return (
      <div className="my-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-slate-600">Loading {type} embed...</p>
      </div>
    );
  }

  // YouTube embed with proper iframe
  if (type === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return (
        <div className="my-6 flex justify-center">
          <div className="w-full max-w-4xl" style={{ maxWidth: '800px' }}>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      );
    }
  }

  // Twitter/X embed using iframe (Twitter's embed system)
  if (type === 'twitter') {
    const tweetId = extractTwitterId(url);
    if (tweetId) {
      return (
        <div className="my-6 flex justify-center">
          <div className="w-full max-w-lg">
            <iframe
              src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&chrome=nofooter`}
              width="100%"
              height="400"
              frameBorder="0"
              scrolling="no"
              className="rounded-lg shadow-sm border border-slate-200"
              loading="lazy"
              title={`Twitter Tweet ${tweetId}`}
            />
          </div>
        </div>
      );
    }
  }

  // Bluesky embed using oEmbed API
  if (type === 'bluesky') {
    if (blueskyData && blueskyData.html) {
      return (
        <div className="my-6 flex justify-center">
          <div className="w-full max-w-lg">
            <div 
              className="bluesky-embed-container"
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
              dangerouslySetInnerHTML={{ __html: blueskyData.html }}
            />
          </div>
        </div>
      );
    }
    
    // Loading state or fallback
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
              <p className="text-sm text-slate-600">
                {blueskyData ? 'Loading content...' : 'Loading from Bluesky...'}
              </p>
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

  // Fallback for unknown types
  return (
    <div className="my-6 flex justify-center">
      <div className="w-full max-w-lg border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">External Link</h3>
            <p className="text-sm text-slate-600">Click to view content</p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
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

// Process content to handle embed syntax and detect URLs
function processContent(content: string): string {
  // Convert {{card:url}} syntax to [card]url[/card] format
  let processed = content.replace(/\{\{card:([^}]+)\}\}/g, (match, url) => {
    return `[card]${url.trim()}[/card]`;
  });
  
  // Convert {type:url} syntax to [type]url[/type] format
  processed = processed.replace(/\{([^:]+):([^}]+)\}/g, (match, type, url) => {
    return `[${type}]${url}[/${type}]`;
  });
  
  // Auto-detect standalone URLs and convert to embeds
  const lines = processed.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Skip if line already has embed syntax or is part of markdown link
    if (trimmedLine.match(/^\[(?:twitter|bluesky|youtube|embed|card)\]/) ||
        trimmedLine.includes('](') ||
        trimmedLine.includes('[') ||
        !trimmedLine.startsWith('http')) {
      return line;
    }
    
    // Use simple embed detection
    const embedType = detectEmbedType(trimmedLine);
    
    if (embedType !== 'unknown') {
      return `[embed]${trimmedLine}[/embed]`;
    }
    
    return line;
  });
  
  return processedLines.join('\n');
}

export function PostContent({ content, format }: PostContentProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle different content formats
  if (format === 'html') {
    return (
      <div
        className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (format === 'plain') {
    return (
      <pre className="whitespace-pre-wrap font-sans text-base text-slate-700 leading-relaxed">
        {content}
      </pre>
    );
  }

  // For markdown format, process content and check for embeds
  let processedContent = processContent(content);
  
  // Store aside blocks in a separate array to avoid encoding issues
  const asideBlocks: string[] = [];
  
  // Handle aside blocks BEFORE line-by-line processing
  processedContent = processedContent.replace(/<aside>\s*([\s\S]*?)\s*<\/aside>/g, (match, asideContent) => {
    const cleanContent = asideContent.trim();
    const processedAside = cleanContent
      .split('\n')
      .map((line: string) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return '<div class="h-4"></div>';
        
        // Handle headings in aside
        if (trimmedLine.startsWith('# ')) {
          return `<h1 class="text-2xl font-bold text-amber-900 mb-4 mt-0 leading-tight">${escapeHtml(trimmedLine.slice(2))}</h1>`;
        }
        if (trimmedLine.startsWith('## ')) {
          return `<h2 class="text-xl font-bold text-amber-900 mb-3 mt-0 leading-tight">${escapeHtml(trimmedLine.slice(3))}</h2>`;
        }
        if (trimmedLine.startsWith('### ')) {
          return `<h3 class="text-lg font-bold text-amber-900 mb-2 mt-0 leading-tight">${escapeHtml(trimmedLine.slice(4))}</h3>`;
        }
        if (trimmedLine.startsWith('#### ')) {
          return `<h4 class="text-base font-bold text-amber-900 mb-2 mt-0 leading-tight">${escapeHtml(trimmedLine.slice(5))}</h4>`;
        }
        
        // Handle blockquotes in aside
        if (trimmedLine.startsWith('> ')) {
          return `<blockquote class="border-l-4 border-amber-600 pl-4 py-2 my-3 bg-amber-100 text-amber-800 italic">${escapeHtml(trimmedLine.slice(2))}</blockquote>`;
        }
        
        // Handle lists in aside
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return `<li class="ml-6 mb-2 list-disc text-amber-900">${processInlineMarkdown(trimmedLine.slice(2))}</li>`;
        }
        if (trimmedLine.match(/^\d+\. /)) {
          return `<li class="ml-6 mb-2 list-decimal text-amber-900">${processInlineMarkdown(trimmedLine.replace(/^\d+\. /, ''))}</li>`;
        }
        
        // Default paragraph in aside
        return `<p class="mb-4 text-amber-900 leading-relaxed">${processInlineMarkdown(trimmedLine)}</p>`;
      })
      .join('\n');

    // Store the processed aside content and return a simple marker
    const asideIndex = asideBlocks.length;
    asideBlocks.push(processedAside);
    return `ASIDE_BLOCK_${asideIndex}`;
  });
  
  const lines = processedContent.split('\n');
  
  return (
    <div className="max-w-none">
      {lines.map((line, i) => {
        const trimmedLine = line.trim();
        
        // Handle aside blocks
        if (trimmedLine.startsWith('ASIDE_BLOCK_')) {
          const asideIndex = parseInt(trimmedLine.replace('ASIDE_BLOCK_', ''));
          const asideContent = asideBlocks[asideIndex];
          
          if (asideContent) {
            return (
              <aside 
                key={i} 
                className="relative border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-r-lg p-6 my-6 shadow-sm w-full"
              >
                <div className="absolute -left-3 top-4 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div 
                  className="max-w-none text-amber-900" 
                  dangerouslySetInnerHTML={{ __html: asideContent }}
                />
              </aside>
            );
          } else {
            return <div key={i} className="text-red-500">Aside block not found</div>;
          }
        }
        
        // Check for embed syntax patterns (both old and new)
        const twitterMatch = trimmedLine.match(/^\[twitter\](.*?)\[\/twitter\]$/);
        const blueskyMatch = trimmedLine.match(/^\[bluesky\](.*?)\[\/bluesky\]$/);
        const youtubeMatch = trimmedLine.match(/^\[youtube\](.*?)\[\/youtube\]$/);
        const embedMatch = trimmedLine.match(/^\[embed\](.*?)\[\/embed\]$/);
        const cardMatch = trimmedLine.match(/^\[card\](.*?)\[\/card\]$/);
        
        // Handle card syntax
        if (cardMatch) {
          return <CardPreview key={i} url={cardMatch[1]} />;
        }
        
        // Handle embed syntax with simple embed component
        if (twitterMatch) {
          return <SimpleEmbed key={i} type="twitter" url={twitterMatch[1]} />;
        }
        if (blueskyMatch) {
          return <BlueskyEmbedOfficial key={i} url={blueskyMatch[1]} />;
        }
        if (youtubeMatch) {
          return <SimpleEmbed key={i} type="youtube" url={youtubeMatch[1]} />;
        }
        if (embedMatch) {
          const embedType = routerDetectEmbedType(embedMatch[1]);
          if (embedType === 'bluesky') {
            return <BlueskyEmbedOfficial key={i} url={embedMatch[1]} />;
          }
          return <SimpleEmbed key={i} type={embedType} url={embedMatch[1]} />;
        }
        
        // Check for standalone URLs that should become link previews
        if (trimmedLine.match(/^https?:\/\/[^\s]+$/)) {
          // Don't show preview for URLs that are already handled as embeds
          const embedType = detectEmbedType(trimmedLine);
          if (embedType === 'unknown') {
            return <LinkPreview key={i} url={trimmedLine} />;
          }
        }
        
        // Skip empty lines that are just spacing
        if (!trimmedLine) {
          return <div key={i} className="h-4"></div>;
        }
        
        // Regular markdown content
        const renderedLine = simpleMarkdownRender(line);
        return <div key={i} dangerouslySetInnerHTML={{ __html: renderedLine }} />;
      })}
    </div>
  );
}