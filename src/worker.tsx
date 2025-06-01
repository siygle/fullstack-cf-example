import { defineApp } from "rwsdk/worker"
import { prefix, render, route } from "rwsdk/router"
import { HTTPException } from "hono/http-exception"
import { eq, desc, sql, inArray } from "drizzle-orm"

import { Document } from "@/app/document/Document"
import { setCommonHeaders } from "@/app/document/headers"

import { Home } from "@/app/pages/Home"
import { Landing } from "@/app/pages/Landing"
import { PostsPage } from "@/app/pages/dashboard/blog/PostsPage"
import { PostEditorPage } from "@/app/pages/dashboard/blog/PostEditorPage"
import { BlogIndexPage } from "@/app/pages/blog/BlogIndexPage" // Added import for public blog
import { PostPage } from "@/app/pages/blog/PostPage" // Added import for public blog
import { userRoutes } from "@/app/pages/user/routes"
import { auth } from "@/lib/auth"
import { db } from "@/db/db"
import { posts, tags, postTags, user } from "@/db/schema"
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

// Helper function for tag management
async function manageTags(tx: any, tagNames: string[]) {
  if (!tagNames || tagNames.length === 0) {
    return []
  }

  const existingTags = await tx
    .select()
    .from(tags)
    .where(inArray(tags.name, tagNames))
  const existingTagNames = existingTags.map((tag: any) => tag.name)
  const newTagNames = tagNames.filter(
    (name: string) => !existingTagNames.includes(name),
  )

  let newTags: any[] = []
  if (newTagNames.length > 0) {
    newTags = await tx
      .insert(tags)
      .values(newTagNames.map((name: string) => ({ name })))
      .returning()
  }

  return [...existingTags, ...newTags].map((tag: any) => tag.id)
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

  // Blog Post API Endpoints
  route("/api/posts", async ({ c, request }) => {
    const session = await auth.api.getSession(c)
    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" })
    }

    if (request.method === "POST") {
      const { title, content, tagNames } = await request.json()

      if (!title || !content) {
        throw new HTTPException(400, { message: "Title and content are required" })
      }

      const newPost = await db.transaction(async (tx) => {
        const tagIds = await manageTags(tx, tagNames || [])
        const [postData] = await tx
          .insert(posts)
          .values({
            title,
            content,
            userId: session.user.id,
          })
          .returning()

        if (tagIds.length > 0) {
          await tx.insert(postTags).values(
            tagIds.map((tagId: number) => ({
              postId: postData.id,
              tagId,
            })),
          )
        }
        return postData
      })
      return c.json(newPost)
    }

    // GET /api/posts (List Posts)
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        tags: sql<string>`GROUP_CONCAT(${tags.name})`.as("tags"),
      })
      .from(posts)
      .leftJoin(user, eq(posts.userId, user.id))
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagId, tags.id))
      .groupBy(posts.id, user.id)
      .orderBy(desc(posts.createdAt))

    const postsWithTagsArray = allPosts.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : []
    }));

    return c.json(postsWithTagsArray)
  }),

  route("/api/posts/:id", async ({ c, request, params }) => {
    const postId = parseInt(params.id, 10)

    // GET /api/posts/:id (Get Single Post)
    if (request.method === "GET") {
      const postResult = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          author: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          tags: sql<string>`GROUP_CONCAT(${tags.name})`.as("tags"),
        })
        .from(posts)
        .where(eq(posts.id, postId))
        .leftJoin(user, eq(posts.userId, user.id))
        .leftJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(tags, eq(postTags.tagId, tags.id))
        .groupBy(posts.id, user.id)

      if (!postResult || postResult.length === 0) {
        throw new HTTPException(404, { message: "Post not found" })
      }

      const postWithTagsArray = {
        ...postResult[0],
        tags: postResult[0].tags ? postResult[0].tags.split(',') : []
      };

      return c.json(postWithTagsArray)
    }

    const session = await auth.api.getSession(c)
    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" })
    }

    // PUT /api/posts/:id (Update Post)
    if (request.method === "PUT") {
      const { title, content, tagNames } = await request.json()

      const updatedPost = await db.transaction(async (tx) => {
        const [existingPost] = await tx
          .select({ userId: posts.userId })
          .from(posts)
          .where(eq(posts.id, postId))

        if (!existingPost) {
          throw new HTTPException(404, { message: "Post not found" })
        }

        if (existingPost.userId !== session.user.id) {
          throw new HTTPException(403, { message: "Forbidden" })
        }

        const tagIds = await manageTags(tx, tagNames || [])
        const [postData] = await tx
          .update(posts)
          .set({ title, content, updatedAt: new Date() })
          .where(eq(posts.id, postId))
          .returning()

        await tx.delete(postTags).where(eq(postTags.postId, postId))
        if (tagIds.length > 0) {
          await tx.insert(postTags).values(
            tagIds.map((tagId: number) => ({
              postId: postData.id,
              tagId,
            })),
          )
        }
        return postData
      })
      return c.json(updatedPost)
    }

    // DELETE /api/posts/:id (Delete Post)
    if (request.method === "DELETE") {
      await db.transaction(async (tx) => {
        const [existingPost] = await tx
          .select({ userId: posts.userId })
          .from(posts)
          .where(eq(posts.id, postId))

        if (!existingPost) {
          throw new HTTPException(404, { message: "Post not found" })
        }
        if (existingPost.userId !== session.user.id) {
          throw new HTTPException(403, { message: "Forbidden" })
        }
        // Rely on cascade delete for postTags
        await tx.delete(posts).where(eq(posts.id, postId))
      })
      return c.body(null, 204)
    }
  }),

  route("/api/tags", async ({c}) => {
    const allTags = await db.select().from(tags).orderBy(tags.name);
    return c.json(allTags);
  }),

  render(Document, [
    route("/", Landing),
    route("/home", [isAuthenticated, Home]),
    prefix("/user", userRoutes),
    // Dashboard / Blog Pages - Ensure these are protected by isAuthenticated
    route("/dashboard/blog/posts", [isAuthenticated, PostsPage]),
    route("/dashboard/blog/post-editor", [isAuthenticated, PostEditorPage]),
    // Public Blog Pages
    route("/blog", BlogIndexPage),
    route("/blog/:id", PostPage),
  ]),
])
