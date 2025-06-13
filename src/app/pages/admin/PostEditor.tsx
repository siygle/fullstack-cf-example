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
import { PostForm } from "@/app/pages/admin/components/PostForm"
import { eq, ne } from "drizzle-orm"
import { nanoid } from "nanoid"
import { generateSlug, generateUniqueSlug } from "@/lib/url-utils"

const PostEditor = async ({ ctx, params, request }: { ctx: AppContext; params?: { id?: string }; request: Request }) => {
  const postId = params?.id
  
  let existingPost = null
  let existingTags: Array<{ id: string; name: string }> = []
  
  if (postId) {
    // Fetch existing post for editing
    existingPost = await db.query.post.findFirst({
      where: (post, { eq }) => eq(post.id, postId),
    })
    
    if (existingPost) {
      // Fetch tags for this post
      const postTags = await db
        .select({ tag: tag })
        .from(postToTag)
        .innerJoin(tag, eq(postToTag.tag_id, tag.id))
        .where(eq(postToTag.post_id, postId))
        .all()
      
      existingTags = postTags.map(pt => pt.tag)
    }
  }
  
  // Handle form submission
  if (request.method === "POST") {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const status = formData.get("status") as string
    const format = formData.get("format") as string || "markdown" // Default to markdown if not specified
    const tagNames = (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean)
    const slugInput = formData.get("slug") as string
    const publishedDateInput = formData.get("publishedDate") as string
    
    // Handle slug generation
    let slug = slugInput
    if (!slug) {
      // Generate slug from title
      slug = generateSlug(title)
    }
    
    // Ensure slug is unique (check against other posts, excluding current post)
    if (slug) {
      const existingSlugs = await db
        .select({ slug: post.slug })
        .from(post)
        .where(postId ? ne(post.id, postId) : undefined)
        .then(rows => rows.map(r => r.slug).filter((slug): slug is string => slug !== null))
      
      if (existingSlugs.includes(slug)) {
        slug = generateUniqueSlug(title, existingSlugs)
      }
    }
    
    // Handle published date
    const publishedDate = publishedDateInput ? new Date(publishedDateInput) : new Date()
    
    let currentPostId = postId
    
    if (currentPostId && existingPost) {
      // Update existing post
      await db.update(post)
        .set({
          title,
          content,
          status,
          format,
          slug,
          publishedDate,
          updatedAt: new Date(),
        })
        .where(eq(post.id, currentPostId))
    } else {
      // Create new post
      const newPostId = nanoid()
      await db.insert(post).values({
        id: newPostId,
        title,
        content,
        status,
        format,
        slug,
        publishedDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      // Set currentPostId for tag processing
      currentPostId = newPostId
    }
    
    // Process tags
    if (currentPostId) {
      // Get or create tags
      const tagIds = []
      for (const tagName of tagNames) {
        // Check if tag exists
        let tagRecord = await db.query.tag.findFirst({
          where: (tag, { eq }) => eq(tag.name, tagName),
        })
        
        if (!tagRecord) {
          // Create new tag
          const newTagId = nanoid()
          await db.insert(tag).values({
            id: newTagId,
            name: tagName,
          })
          tagIds.push(newTagId)
        } else {
          tagIds.push(tagRecord.id)
        }
      }
      
      // Delete existing tag associations
      await db.delete(postToTag).where(eq(postToTag.post_id, currentPostId))
      
      // Create new tag associations
      for (const tagId of tagIds) {
        await db.insert(postToTag).values({
          id: nanoid(),
          post_id: currentPostId,
          tag_id: tagId,
        })
      }
    }
    
    // Redirect to posts list
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/posts" },
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {existingPost ? "Edit Post" : "Create New Post"}
        </h1>
        <Button asChild variant="outline">
          <a href="/admin/posts">Back to Posts</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {existingPost ? "Edit Post Details" : "Post Details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm post={existingPost} tags={existingTags} />
        </CardContent>
      </Card>
    </div>
  )
}

export { PostEditor }