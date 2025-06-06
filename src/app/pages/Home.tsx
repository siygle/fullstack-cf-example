import { db } from "@/db/db"
import { post, tag, postToTag, settings } from "@/db/schema"
import { LogoutButton } from "@/app/shared/components"
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

const Home = async ({ ctx, request }: { ctx: AppContext; request: Request }) => {
  const { user, authUrl } = ctx
  
  // Get current page from URL query parameters
  const url = new URL(request.url)
  const currentPage = parseInt(url.searchParams.get("page") || "1")
  
  // Fetch blog title and pagination settings
  const blogTitleSetting = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.key, "blog_title"),
  })
  
  const paginationSetting = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.key, "pagination_count"),
  })
  
  const blogTitle = blogTitleSetting?.value || "Blog Posts"
  const paginationCount = parseInt(paginationSetting?.value || "10")
  
  // Calculate offset for pagination
  const offset = (currentPage - 1) * paginationCount
  
  // Get total count of published posts for pagination
  const totalPostsCount = await db.query.post.findMany({
    where: (post, { eq }) => eq(post.status, "published"),
    columns: {
      id: true,
    },
  })
  
  const totalPosts = totalPostsCount.length
  const totalPages = Math.ceil(totalPosts / paginationCount)
  
  // Fetch only published posts with their tags, limited by pagination setting
  const posts = await db.query.post.findMany({
    where: (post, { eq }) => eq(post.status, "published"),
    orderBy: (post, { desc }) => [desc(post.createdAt)],
    limit: paginationCount,
    offset: offset,
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
        <h1 className="text-3xl font-bold">{blogTitle}</h1>
        <div className="flex gap-4">
          {user && (
            <Button asChild>
              <a href="/admin/posts">Manage Posts</a>
            </Button>
          )}
          {user ? (
            <LogoutButton authUrl={authUrl} className="button" />
          ) : (
            <Button asChild variant="outline">
              <a href={link("/user/login")}>Login</a>
            </Button>
          )}
        </div>
      </div>

      {postsWithTags.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No posts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {postsWithTags.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {/* Display a preview of the content */}
                  <p>{post.content.substring(0, 200)}...</p>
                </div>
                <div className="mt-4 flex gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <a href={`/post/${post.id}`}>Read More</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {/* Previous Page Button */}
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            asChild
          >
            <a href={`/?page=${currentPage - 1}`} aria-label="Previous page">
              Previous
            </a>
          </Button>
          
          {/* Page Indicators */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                asChild
              >
                <a href={`/?page=${page}`} aria-label={`Page ${page}`}>
                  {page}
                </a>
              </Button>
            ))}
          </div>
          
          {/* Next Page Button */}
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            asChild
          >
            <a href={`/?page=${currentPage + 1}`} aria-label="Next page">
              Next
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

export { Home }
