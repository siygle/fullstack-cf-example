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
import { eq, and, desc } from "drizzle-orm"

interface TaggedPostsProps {
  ctx: AppContext
  params: { tagName: string }
}

const TaggedPosts = async ({ ctx, params }: TaggedPostsProps) => {
  const { user } = ctx
  const tagName = decodeURIComponent(params.tagName)

  // Find the tag
  const tagRecord = await db.query.tag.findFirst({
    where: (tag, { eq }) => eq(tag.name, tagName),
  })

  if (!tagRecord) {
    return new Response("Tag not found", { status: 404 })
  }

  // Fetch posts with this tag
  const postsQuery = db
    .select({ 
      post: post,
      tag: tag 
    })
    .from(postToTag)
    .innerJoin(post, eq(postToTag.post_id, post.id))
    .innerJoin(tag, eq(postToTag.tag_id, tag.id))
    .where(
      and(
        eq(tag.id, tagRecord.id),
        // If user is not logged in, only show published posts
        user ? undefined : eq(post.status, "published")
      )
    )
    .orderBy(desc(post.publishedDate))

  const taggedPosts = await postsQuery.all()

  // Get all tags for each post
  const postsWithTags = await Promise.all(
    taggedPosts.map(async ({ post: blogPost }) => {
      const postTags = await db
        .select({ tag: tag })
        .from(postToTag)
        .innerJoin(tag, eq(postToTag.tag_id, tag.id))
        .where(eq(postToTag.post_id, blogPost.id))
        .all()
      
      return {
        ...blogPost,
        tags: postTags.map(pt => pt.tag)
      }
    })
  )

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
                Back to All Posts
              </a>
            </Button>
            {user && (
              <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800">
                <a href="/admin/posts">Admin</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Posts tagged with "{tagName}"
          </h1>
          <p className="text-lg text-slate-600">
            {postsWithTags.length} {postsWithTags.length === 1 ? 'post' : 'posts'} found
          </p>
        </div>

        {/* Posts Grid */}
        {postsWithTags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-slate-600 mb-6">No posts found with this tag.</p>
            <Button asChild variant="outline">
              <a href={link("/")}>Browse All Posts</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {postsWithTags.map((blogPost) => (
              <Card key={blogPost.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        <a href={`/post/${blogPost.id}`} className="block">
                          {blogPost.title}
                        </a>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <time className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(blogPost.publishedDate || blogPost.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                        {blogPost.status !== "published" && user && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            {blogPost.status.charAt(0).toUpperCase() + blogPost.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none text-slate-600 mb-4">
                    {blogPost.content.substring(0, 200)}
                    {blogPost.content.length > 200 && "..."}
                  </div>
                  
                  {/* Tags */}
                  {blogPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blogPost.tags.map((tag) => (
                        <a
                          key={tag.id}
                          href={`/tags/${encodeURIComponent(tag.name)}`}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            tag.name === tagName
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          #{tag.name}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export { TaggedPosts }