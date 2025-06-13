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
import { eq } from "drizzle-orm"
import { generatePostUrl } from "@/lib/url-utils"

const Posts = async ({ ctx }: { ctx: AppContext }) => {
  // Fetch all posts
  const posts = await db.query.post.findMany({
    orderBy: (post, { desc }) => [desc(post.createdAt)],
  })
  
  // Fetch tags for each post
  const postsWithTags = await Promise.all(
    posts.map(async (post) => {
      const postTags = await db
        .select({ tag: tag })
        .from(postToTag)
        .innerJoin(tag, eq(postToTag.tag_id, tag.id))
        .where(eq(postToTag.post_id, post.id))
        .all()
      
      return {
        ...post,
        tags: postTags.map(pt => pt.tag)
      }
    })
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Posts</h1>
        <div className="flex gap-4">
          <Button asChild>
            <a href="/admin/post">Create New Post</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/admin">Back to Dashboard</a>
          </Button>
        </div>
      </div>

      {postsWithTags.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You haven't created any posts yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {postsWithTags.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{post.title}</CardTitle>
                  <span className={`px-2 py-1 rounded text-xs ${
                    post.status === "published" 
                      ? "bg-green-100 text-green-800" 
                      : post.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {post.slug && (
                    <div>
                      <span className="font-medium">URL: </span>
                      <code className="bg-muted px-1 rounded text-xs">{generatePostUrl(post)}</code>
                    </div>
                  )}
                  {post.publishedDate && (
                    <div>
                      <span className="font-medium">Published: </span>
                      {new Date(post.publishedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Button asChild variant="outline">
                    <a href={`/admin/post/${post.id}`}>Edit</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={post.slug ? generatePostUrl(post) : `/post/${post.id}`} target="_blank">View</a>
                  </Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { Posts }