"use client"

import React, { useState, useEffect } from "react"
import { Embed } from "@/app/shared/components/Embed"

interface PostContentProps {
  content: string;
  format: 'html' | 'plain' | 'markdown';
}

// Simple markdown renderer that doesn't require external libraries
function simpleMarkdownRender(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      // Handle headings
      if (line.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold mb-4">${line.slice(2)}</h1>`;
      }
      if (line.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold mb-3">${line.slice(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-xl font-bold mb-2">${line.slice(4)}</h3>`;
      }
      
      // Handle lists
      if (line.startsWith('- ')) {
        return `<li class="ml-4 list-disc">${line.slice(2)}</li>`;
      }
      
      // Handle bold and italic
      let processedLine = line;
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
      
      // Handle links
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
      
      // Empty line
      if (!line.trim()) {
        return '<br />';
      }
      
      // Default paragraph
      return `<p class="mb-4">${processedLine}</p>`;
    })
    .join('\n');
}

// Process content to handle embed syntax
function processContent(content: string): string {
  // Convert {type:url} syntax to [type]url[/type] format
  return content.replace(/\{([^:]+):([^}]+)\}/g, (match, type, url) => {
    return `[${type}]${url}[/${type}]`;
  });
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
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (format === 'plain') {
    return (
      <pre className="whitespace-pre-wrap font-sans text-base">
        {content}
      </pre>
    );
  }

  // For markdown format, process content and check for embeds
  const processedContent = processContent(content);
  const lines = processedContent.split('\n');
  
  return (
    <div className="prose prose-lg max-w-none">
      {lines.map((line, i) => {
        // Check for embed syntax patterns
        const twitterMatch = line.match(/^\[twitter\](.*?)\[\/twitter\]$/);
        const blueskyMatch = line.match(/^\[bluesky\](.*?)\[\/bluesky\]$/);
        const youtubeMatch = line.match(/^\[youtube\](.*?)\[\/youtube\]$/);
        
        if (twitterMatch) {
          return <Embed key={i} type="twitter" url={twitterMatch[1]} />;
        }
        if (blueskyMatch) {
          return <Embed key={i} type="bluesky" url={blueskyMatch[1]} />;
        }
        if (youtubeMatch) {
          return <Embed key={i} type="youtube" url={youtubeMatch[1]} />;
        }
        
        // Regular markdown content
        const renderedLine = simpleMarkdownRender(line);
        return <div key={i} dangerouslySetInnerHTML={{ __html: renderedLine }} />;
      })}
    </div>
  );
}