import { db } from "@/db/db"
import { tag, postToTag, post } from "@/db/schema"
import { AppContext } from "@/worker"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/shared/components/ui/card"
import { Button } from "@/app/shared/components/ui/button"
import { eq, ne, count, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { TagManagementClient } from "./components/TagManagementClient"

interface TagsAdminProps {
  ctx: AppContext
  request: Request
}

const TagsAdmin = async ({ ctx, request }: TagsAdminProps) => {
  const { user } = ctx
  const url = new URL(request.url)
  const error = url.searchParams.get('error')

  // Handle form submissions
  if (request.method === "POST") {
    const formData = await request.formData()
    const action = formData.get("action") as string

    if (action === "edit") {
      const tagId = formData.get("tagId") as string
      const newName = (formData.get("name") as string)?.trim()

      if (tagId && newName) {
        // Check if tag name already exists (excluding current tag)
        const existingTags = await db
          .select()
          .from(tag)
          .where(eq(tag.name, newName))

        const duplicateTag = existingTags.find(t => t.id !== tagId)
        
        if (duplicateTag) {
          // Return error response for duplicate tag name
          return new Response(null, {
            status: 302,
            headers: { Location: "/admin/tags?error=duplicate_name" },
          })
        }

        // Validate tag name format (alphanumeric, spaces, hyphens, underscores)
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(newName)) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/admin/tags?error=invalid_format" },
          })
        }

        await db.update(tag)
          .set({ name: newName })
          .where(eq(tag.id, tagId))
      }
    } else if (action === "delete") {
      const tagId = formData.get("tagId") as string

      if (tagId) {
        // Delete tag associations first (cascade should handle this, but being explicit)
        await db.delete(postToTag).where(eq(postToTag.tag_id, tagId))
        // Delete the tag
        await db.delete(tag).where(eq(tag.id, tagId))
      }
    }

    // Redirect to refresh the page
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/tags" },
    })
  }

  // Fetch all tags with post counts
  const tagsWithCounts = await db
    .select({
      id: tag.id,
      name: tag.name,
      postCount: count(postToTag.id),
    })
    .from(tag)
    .leftJoin(postToTag, eq(tag.id, postToTag.tag_id))
    .groupBy(tag.id, tag.name)
    .orderBy(tag.name)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tag Management</h1>
        <Button asChild variant="outline">
          <a href="/admin/posts">Back to Posts</a>
        </Button>
      </div>

      {/* Error Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                {error === 'duplicate_name' && 'A tag with this name already exists. Please choose a different name.'}
                {error === 'invalid_format' && 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores.'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Tags Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Tags ({tagsWithCounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tagsWithCounts.length === 0 ? (
              <p className="text-gray-600">No tags found. Tags are automatically created when you add them to posts.</p>
            ) : (
              <TagManagementClient tagsWithCounts={tagsWithCounts} />
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{tagsWithCounts.length}</div>
                <div className="text-sm text-gray-600">Total Tags</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {tagsWithCounts.filter(t => t.postCount > 0).length}
                </div>
                <div className="text-sm text-gray-600">Tags in Use</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {tagsWithCounts.filter(t => t.postCount === 0).length}
                </div>
                <div className="text-sm text-gray-600">Unused Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Management Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p><strong>Edit:</strong> Rename a tag. This will update the tag name across all posts that use it.</p>
            <p><strong>Delete:</strong> Remove a tag completely. This will remove the tag from all posts that use it.</p>
            <p><strong>View Posts:</strong> Click "View Posts" to see all posts tagged with a specific tag.</p>
            <p><strong>Note:</strong> New tags are automatically created when you add them to posts. You don't need to create tags manually.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { TagsAdmin }