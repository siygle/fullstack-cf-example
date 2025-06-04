import React from "react"

interface PostContentProps {
  content: string;
  format: string;
}

// A simple server-side compatible content renderer
export function PostContent({ content, format = "markdown" }: PostContentProps) {
  // For HTML content, use dangerouslySetInnerHTML
  if (format === "html") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  
  // For plain text, just render it with whitespace preserved
  if (format === "text") {
    return <pre className="whitespace-pre-wrap">{content}</pre>;
  }
  
  // For markdown, render a very basic version that works on server
  // This is a simplified version without any client-side dependencies
  return (
    <div className="markdown-content">
      {content.split('\n').map((line, i) => {
        // Basic heading support
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
        }
        
        // Basic list support
        if (line.startsWith('- ')) {
          return <div key={i} className="ml-4 my-1">• {line.substring(2)}</div>;
        }
        
        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-4"></div>;
        }
        
        // Default paragraph
        return <p key={i} className="my-2">{line}</p>;
      })}
    </div>
  );
}