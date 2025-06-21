"use client"

import React, { useState, useEffect } from "react"

interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
}

interface LinkPreviewProps {
  url: string
  title?: string
  className?: string
}

export function LinkPreview({ url, title, className = "" }: LinkPreviewProps) {
  const [ogData, setOgData] = useState<OpenGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchOgData = async () => {
      try {
        // Create a simple Open Graph fetcher endpoint call
        // For now, we'll use a mock implementation that extracts basic info from URL
        const domain = new URL(url).hostname
        const mockData: OpenGraphData = {
          title: title || domain,
          description: `Visit ${domain}`,
          siteName: domain,
          url: url
        }
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 300))
        setOgData(mockData)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOgData()
  }, [url, title])

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-slate-300 rounded"></div>
        <span>Loading preview...</span>
      </div>
    )
  }

  if (error || !ogData) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors ${className}`}
      >
        {title || url}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block max-w-lg mx-auto my-4 ${className}`}
    >
      <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300">
        <div className="flex items-start gap-4">
          {/* Favicon/Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors mb-1" style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {ogData.title || new URL(url).hostname}
            </h3>
            
            {ogData.description && (
              <p className="text-sm text-slate-600 mb-2" style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {ogData.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">{ogData.siteName || new URL(url).hostname}</span>
              <svg className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

// Enhanced link component with preview option
export function EnhancedLink({ href, children, showPreview = false }: { 
  href: string
  children: React.ReactNode
  showPreview?: boolean
}) {
  // Check if this looks like a URL that should have a preview
  const shouldShowPreview = showPreview && 
    href.startsWith('http') && 
    !href.includes('youtube.com') && 
    !href.includes('youtu.be') &&
    !href.includes('twitter.com') &&
    !href.includes('x.com') &&
    !href.includes('bsky.app')

  if (shouldShowPreview) {
    return <LinkPreview url={href} title={children?.toString()} />
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
    >
      {children}
    </a>
  )
}