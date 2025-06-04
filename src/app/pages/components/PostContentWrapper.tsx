"use client"

import React, { useState, useEffect } from 'react'

interface PostContentProps {
  content: string;
  format: string;
}

// Simple fallback content renderer
function SimpleFallbackRenderer({ content, format }: PostContentProps) {
  if (format === "html") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  
  return (
    <div className="whitespace-pre-wrap">
      {content}
    </div>
  );
}

// This is a wrapper component that dynamically loads the real PostContent only on the client side
export function PostContentWrapper(props: PostContentProps) {
  const [ContentComponent, setContentComponent] = useState<React.ComponentType<PostContentProps> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Only import the content component on the client side
    const loadComponent = async () => {
      try {
        // Create a simple content component that doesn't use any external libraries
        const SimpleContent: React.FC<PostContentProps> = ({ content, format }) => {
          if (format === "html") {
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
          }
          
          // For markdown, do a very basic rendering
          if (format === "markdown") {
            return (
              <div className="markdown-content">
                {content.split('\n').map((line, i) => {
                  // Very basic markdown rendering
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                  }
                  if (line.startsWith('- ')) {
                    return <div key={i} className="ml-4">• {line.substring(2)}</div>;
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
          
          // Plain text
          return <div className="whitespace-pre-wrap">{content}</div>;
        }

        setContentComponent(() => SimpleContent)
      } catch (error) {
        console.error('Failed to load content component:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadComponent()
  }, [])

  // Server-side rendering or loading state
  if (!isClient || isLoading) {
    return (
      <div className="prose max-w-none">
        <SimpleFallbackRenderer {...props} />
      </div>
    )
  }

  if (!ContentComponent) {
    return (
      <div className="prose max-w-none">
        <SimpleFallbackRenderer {...props} />
      </div>
    )
  }

  return (
    <div className="prose max-w-none">
      <ContentComponent {...props} />
    </div>
  )
}