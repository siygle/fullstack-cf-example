"use client"

import React, { useState, useEffect } from "react"

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
  
  // Handle links
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer">$1</a>');
  
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
          <div
            className="w-full max-w-lg"
            dangerouslySetInnerHTML={{ __html: blueskyData.html }}
          />
        </div>
      );
    }
    
    // Loading state or fallback
    return (
      <div className="my-6 flex justify-center">
        <div className="w-full max-w-lg border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 truncate">
                  {blueskyData?.author_name || 'Bluesky User'}
                </h3>
                <span className="text-sm text-slate-500">@{blueskyData?.author_url?.split('/').pop() || 'user'}</span>
              </div>
              <p className="text-slate-700 mb-4 leading-relaxed">
                {blueskyData ? 'Loading Bluesky post...' : 'View this post on Bluesky to see the full content and engage with the community.'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Bluesky</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
                >
                  View on Bluesky
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
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
  // Convert {type:url} syntax to [type]url[/type] format
  let processed = content.replace(/\{([^:]+):([^}]+)\}/g, (match, type, url) => {
    return `[${type}]${url}[/${type}]`;
  });
  
  // Auto-detect standalone URLs and convert to embeds
  const lines = processed.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Skip if line already has embed syntax or is part of markdown link
    if (trimmedLine.match(/^\[(?:twitter|bluesky|youtube|embed)\]/) ||
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
  const processedContent = processContent(content);
  const lines = processedContent.split('\n');
  
  return (
    <div className="max-w-none">
      {lines.map((line, i) => {
        const trimmedLine = line.trim();
        
        // Check for embed syntax patterns (both old and new)
        const twitterMatch = trimmedLine.match(/^\[twitter\](.*?)\[\/twitter\]$/);
        const blueskyMatch = trimmedLine.match(/^\[bluesky\](.*?)\[\/bluesky\]$/);
        const youtubeMatch = trimmedLine.match(/^\[youtube\](.*?)\[\/youtube\]$/);
        const embedMatch = trimmedLine.match(/^\[embed\](.*?)\[\/embed\]$/);
        
        // Handle embed syntax with simple embed component
        if (twitterMatch) {
          return <SimpleEmbed key={i} type="twitter" url={twitterMatch[1]} />;
        }
        if (blueskyMatch) {
          return <SimpleEmbed key={i} type="bluesky" url={blueskyMatch[1]} />;
        }
        if (youtubeMatch) {
          return <SimpleEmbed key={i} type="youtube" url={youtubeMatch[1]} />;
        }
        if (embedMatch) {
          const embedType = detectEmbedType(embedMatch[1]);
          return <SimpleEmbed key={i} type={embedType} url={embedMatch[1]} />;
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