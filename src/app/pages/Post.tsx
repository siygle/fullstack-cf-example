import { db } from "@/db/db"
import { post, tag, postToTag } from "@/db/schema"
import { AppContext } from "@/worker"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/shared/components/ui/card"
import { Button } from "@/app/shared/components/ui/button"
import { link } from "@/app/shared/links"
import { eq, and } from "drizzle-orm"
import { PostContentShell } from "./components/PostContentShell"

const Post = async ({ ctx, params }: { ctx: AppContext; params: { id: string } }) => {
  const { user } = ctx
  const postId = params.id
  
  // Fetch the post
  const blogPost = await db.query.post.findFirst({
    where: (post, { eq, and }) => {
      // If user is logged in, they can see any post
      // Otherwise, only published posts are visible
      if (user) {
        return eq(post.id, postId)
      } else {
        return and(
          eq(post.id, postId),
          eq(post.status, "published")
        )
      }
    }
  })
  
  // Fetch tags for this post
  const postTags = blogPost ? await db
    .select({ tag: tag })
    .from(postToTag)
    .innerJoin(tag, eq(postToTag.tag_id, tag.id))
    .where(eq(postToTag.post_id, postId))
    .all() : []
  
  // If post not found or not accessible, return 404
  if (!blogPost) {
    return new Response("Post not found", { status: 404 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Button asChild variant="ghost" className="hover:bg-slate-100">
              <a href={link("/")} className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Posts
              </a>
            </Button>
            {user && (
              <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800">
                <a href={`/admin/post/${postId}`}>Edit Post</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Article Header */}
          <header className="px-6 sm:px-8 lg:px-12 pt-8 lg:pt-12 pb-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                {blogPost.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600 mb-6">
                <time className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(blogPost.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                
                <div className="flex items-center gap-3">
                  {blogPost.format && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {blogPost.format.charAt(0).toUpperCase() + blogPost.format.slice(1)}
                    </span>
                  )}
                  {blogPost.status !== "published" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      {blogPost.status.charAt(0).toUpperCase() + blogPost.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {postTags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {postTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="px-6 sm:px-8 lg:px-12 pb-8 lg:pb-12">
            <div className="max-w-3xl mx-auto">
              <div className="post-content prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                <PostContentShell
                  content={blogPost.content}
                  format={blogPost.format || "markdown"}
                  postId={blogPost.id}
                />
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

export { Post }