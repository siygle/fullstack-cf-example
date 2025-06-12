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
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="outline">
          <a href={link("/")}>← Back to Posts</a>
        </Button>
        {user && (
          <Button asChild>
            <a href={`/admin/post/${postId}`}>Edit Post</a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{blogPost.title}</CardTitle>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Published: {new Date(blogPost.createdAt).toLocaleDateString()}</span>
            <div className="flex gap-2">
              {blogPost.format && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {blogPost.format.charAt(0).toUpperCase() + blogPost.format.slice(1)}
                </span>
              )}
              {blogPost.status !== "published" && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  {blogPost.status.charAt(0).toUpperCase() + blogPost.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {postTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-muted rounded-full text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <div className="prose max-w-none">
            <PostContentShell
              content={blogPost.content}
              format={blogPost.format || "markdown"}
              postId={blogPost.id}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { Post }