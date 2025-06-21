"use client"

import React, { useState, useEffect } from "react"

interface CardMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
  favicon?: string
  domain?: string
  error?: boolean
}

interface CardPreviewProps {
  url: string
  className?: string
}

export function CardPreview({ url, className = "" }: CardPreviewProps) {
  const [metadata, setMetadata] = useState<CardMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json() as CardMetadata
        console.log('CardPreview metadata for', url, ':', data)
        setMetadata(data)
      } catch (err) {
        console.error('Error fetching metadata:', err)
        setError(true)
        // Set fallback data
        setMetadata({
          title: new URL(url).hostname,
          description: `Visit ${new URL(url).hostname}`,
          domain: new URL(url).hostname,
          url: url,
          error: true,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [url])

  if (loading) {
    return (
      <div className={`my-6 ${className}`}>
        <div className="max-w-lg mx-auto">
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return null
  }

  return (
    <div className={`my-6 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block max-w-2xl mx-auto"
      >
        <div className="border border-slate-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-400 relative overflow-hidden">
          {/* Main content */}
          <div className={`p-6 ${metadata.image && !metadata.error ? 'pr-32' : ''}`}>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-1">
              {metadata.title || metadata.domain}
            </h3>
            
            {metadata.description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}
            
            {/* URL with favicon */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {metadata.favicon && !metadata.error ? (
                <img
                  src={metadata.favicon}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    // Replace with fallback emoji
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<span class="text-xs">🔗</span><span class="truncate ml-2">' + (metadata.domain || url) + '</span>'
                    }
                  }}
                />
              ) : (
                <span className="text-xs">🔗</span>
              )}
              <span className="truncate">{metadata.domain || url}</span>
            </div>
          </div>
          
          {/* OG Image - right side */}
          {metadata.image && !metadata.error && (
            <div className="absolute top-4 right-4 w-24 h-16 rounded-lg overflow-hidden shadow-sm">
              <img
                src={metadata.image}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onLoad={() => {
                  console.log('CardPreview image loaded successfully:', metadata.image)
                }}
                onError={(e) => {
                  console.error('CardPreview image failed to load:', metadata.image)
                  // Hide the image container if it fails to load
                  const container = e.currentTarget.parentElement
                  if (container) {
                    container.style.display = 'none'
                    // Also remove the right padding from the main content
                    const mainContent = container.previousElementSibling as HTMLElement
                    if (mainContent) {
                      mainContent.classList.remove('pr-32')
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </a>
    </div>
  )
}