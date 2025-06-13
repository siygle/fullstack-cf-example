import { Post } from "./Post"
import { parsePostUrl } from "@/lib/url-utils"
import { db } from "@/db/db"
import { post } from "@/db/schema/blog-schema"
import { eq, and, ne, isNotNull } from "drizzle-orm"
import { AppContext } from "@/worker"

export async function PostByUrl({ ctx, params }: { ctx: AppContext; params: { path: string | string[]; '$0'?: string } }) {
  // The wildcard route splits the path: first segment in `path`, rest in `$0`
  // We need to reconstruct the full path
  const firstSegment = Array.isArray(params.path) ? params.path[0] : params.path
  const restOfPath = params['$0'] || ''
  const fullPath = firstSegment + restOfPath
  
  // Decode URL-encoded characters (like Chinese characters)
  const decodedPath = decodeURIComponent(fullPath)
  
  // Parse the URL to extract post identifiers
  const urlData = parsePostUrl(`/${decodedPath}`)
  
  if (!urlData || !urlData.slug) {
    return <div>Post not found</div>
  }
  
  try {
    // Find post by slug and optionally by date
    let query = db.select().from(post).where(eq(post.slug, urlData.slug))
    const posts = await query.execute()
    
    if (posts.length === 0) {
      return <div>Post not found</div>
    }
    
    const foundPost = posts[0]
    
    // If we have multiple posts with the same slug, we might want to filter by date
    if (posts.length > 1 && urlData.year && urlData.month && urlData.day) {
      const targetDate = new Date(`${urlData.year}-${urlData.month}-${urlData.day}`)
      const dateFilteredPosts = posts.filter(p => {
        const postDate = p.publishedDate || p.createdAt
        const postDateString = new Date(postDate).toDateString()
        return postDateString === targetDate.toDateString()
      })
      
      if (dateFilteredPosts.length > 0) {
        const matchedPost = dateFilteredPosts[0]
        // Forward to the Post component with the found post ID
        return await Post({ 
          ctx, 
          params: { id: matchedPost.id }
        })
      }
    }
    
    // Forward to the Post component with the found post ID
    return await Post({ 
      ctx, 
      params: { id: foundPost.id }
    })
    
  } catch (error) {
    console.error("Error fetching post by URL:", error)
    return <div>Internal server error</div>
  }
}