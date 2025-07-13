import { defineApp } from "rwsdk/worker"
import { prefix, render, route } from "rwsdk/router"

import { Document } from "@/app/document/Document"
import { setCommonHeaders } from "@/app/document/headers"

import { Home } from "@/app/pages/Home"
// import { Landing } from "@/app/pages/Landing"
import { Post } from "@/app/pages/Post"
import { PostByUrl } from "@/app/pages/PostByUrl"
import { TaggedPosts } from "@/app/pages/TaggedPosts"
import { userRoutes } from "@/app/pages/user/routes"
import { Dashboard } from "@/app/pages/admin/Dashboard"
import { Posts } from "@/app/pages/admin/Posts"
import { PostEditor } from "@/app/pages/admin/PostEditor"
import { TagsAdmin } from "@/app/pages/admin/TagsAdmin"
import { Settings } from "@/app/pages/admin/Settings"
import { auth } from "@/lib/auth"
import { User } from "@/db/schema/auth-schema"
import { link } from "@/app/shared/links"

export type AppContext = {
  user: User | undefined
  authUrl: string
}

const isAuthenticated = ({ ctx }: { ctx: AppContext }) => {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: link("/user/login") },
    })
  }
}

export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request }) => {
    const url = new URL(request.url)
    ctx.authUrl = url.origin

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (session?.user) {
        ctx.user = {
          ...session.user,
          image: session.user.image ?? null,
        }
      }
    } catch (error) {
      console.error("Session error:", error)
    }
  },

  route("/api/auth/*", ({ request }) => {
    return auth.handler(request)
  }),

  route("/api/bluesky-oembed", async ({ request }) => {
    const url = new URL(request.url)
    const blueskyUrl = url.searchParams.get('url')
    
    if (!blueskyUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const oembedUrl = `https://embed.bsky.app/oembed?url=${encodeURIComponent(blueskyUrl)}&format=json`
      const response = await fetch(oembedUrl)
      
      if (!response.ok) {
        throw new Error(`oEmbed request failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      console.error('Error fetching Bluesky oEmbed:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch oEmbed data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }),

  route("/api/metadata", async ({ request }) => {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate URL
    try {
      new URL(targetUrl)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Blog-Card-Bot/1.0)',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const html = await response.text()
      
      // Extract metadata using comprehensive regex patterns
      const getMetaContent = (property: string) => {
        const patterns = [
          // Standard patterns with quotes
          new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']*?)["']`, 'is'),
          new RegExp(`<meta\\s+content=["']([^"']*?)["']\\s+property=["']${property}["']`, 'is'),
          new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']*?)["']`, 'is'),
          new RegExp(`<meta\\s+content=["']([^"']*?)["']\\s+name=["']${property}["']`, 'is'),
          // Handle cases without quotes around attribute values
          new RegExp(`<meta\\s+property=${property}\\s+content=["']([^"']*?)["']`, 'is'),
          new RegExp(`<meta\\s+name=${property}\\s+content=["']([^"']*?)["']`, 'is'),
          // Handle mixed quote types
          new RegExp(`<meta\\s+property=['"]${property}['"]\\s+content=['"]([^'"]*?)['"]`, 'is'),
          new RegExp(`<meta\\s+content=['"]([^'"]*?)['"]\\s+property=['"]${property}['"]`, 'is'),
          // Handle spaces and other attributes
          new RegExp(`<meta[^>]*property=['"]${property}['"][^>]*content=['"]([^'"]*?)['"]`, 'is'),
          new RegExp(`<meta[^>]*content=['"]([^'"]*?)['"][^>]*property=['"]${property}['"]`, 'is'),
        ]
        
        for (const pattern of patterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            return match[1].trim()
          }
        }
        return null
      }
      
      // Get title from <title> tag if og:title not found
      const getTitle = () => {
        const ogTitle = getMetaContent('og:title')
        if (ogTitle) return ogTitle
        
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
        return titleMatch ? titleMatch[1].trim() : null
      }
      
      // Extract favicon
      const getFavicon = () => {
        const patterns = [
          /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
        ]
        
        for (const pattern of patterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            const faviconUrl = match[1]
            // Convert relative URLs to absolute
            if (faviconUrl.startsWith('/')) {
              const baseUrl = new URL(targetUrl)
              return `${baseUrl.protocol}//${baseUrl.host}${faviconUrl}`
            }
            if (!faviconUrl.startsWith('http')) {
              const baseUrl = new URL(targetUrl)
              return `${baseUrl.protocol}//${baseUrl.host}/${faviconUrl}`
            }
            return faviconUrl
          }
        }
        
        // Fallback to default favicon location
        const baseUrl = new URL(targetUrl)
        return `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`
      }
      
      // Extract and normalize Open Graph image
      const getOGImage = () => {
        const ogImage = getMetaContent('og:image')
        if (!ogImage) return null
        
        // Convert relative URLs to absolute
        if (ogImage.startsWith('/')) {
          const baseUrl = new URL(targetUrl)
          return `${baseUrl.protocol}//${baseUrl.host}${ogImage}`
        }
        if (!ogImage.startsWith('http')) {
          const baseUrl = new URL(targetUrl)
          return `${baseUrl.protocol}//${baseUrl.host}/${ogImage}`
        }
        return ogImage
      }

      const metadata = {
        title: getTitle(),
        description: getMetaContent('og:description') || getMetaContent('description'),
        image: getOGImage(),
        siteName: getMetaContent('og:site_name'),
        url: getMetaContent('og:url') || targetUrl,
        favicon: getFavicon(),
        domain: new URL(targetUrl).hostname,
      }
      
      return new Response(JSON.stringify(metadata), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        }
      })
    } catch (error) {
      console.error('Error fetching metadata:', error)
      
      // Return basic fallback data
      const fallback = {
        title: new URL(targetUrl).hostname,
        description: `Visit ${new URL(targetUrl).hostname}`,
        siteName: new URL(targetUrl).hostname,
        url: targetUrl,
        domain: new URL(targetUrl).hostname,
        error: true,
      }
      
      return new Response(JSON.stringify(fallback), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
  }),
  
  // Image proxy endpoint for OG images
  route("/api/image-proxy", async ({ request }) => {
    const url = new URL(request.url)
    const imageUrl = url.searchParams.get('url')
    
    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400 })
    }

    // Validate URL
    try {
      new URL(imageUrl)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Blog-Card-Bot/1.0)',
          'Accept': 'image/*',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('Not an image')
      }
      
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
        }
      })
    } catch (error) {
      console.error('Error proxying image:', error)
      return new Response('Failed to load image', { status: 500 })
    }
  }),

  render(Document, [
    route("/", Home),
    route("/post/:id", Post),
    route("/tags/:tagName", TaggedPosts),
    prefix("/user", userRoutes),
    route("/admin", [isAuthenticated, Dashboard]),
    route("/admin/posts", [isAuthenticated, Posts]),
    route("/admin/post", [isAuthenticated, PostEditor]),
    route("/admin/post/:id", [isAuthenticated, PostEditor]),
    route("/admin/tags", [isAuthenticated, TagsAdmin]),
    route("/admin/setting", [isAuthenticated, Settings]),
    // Dynamic route for custom post URLs - must be last to act as catch-all
    route("/:path*", PostByUrl),
  ]),
])
