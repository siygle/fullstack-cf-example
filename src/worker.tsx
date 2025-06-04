import { defineApp } from "rwsdk/worker"
import { prefix, render, route } from "rwsdk/router"

import { Document } from "@/app/document/Document"
import { setCommonHeaders } from "@/app/document/headers"

import { Home } from "@/app/pages/Home"
import { Landing } from "@/app/pages/Landing"
import { Post } from "@/app/pages/Post"
import { userRoutes } from "@/app/pages/user/routes"
import { Dashboard } from "@/app/pages/admin/Dashboard"
import { Posts } from "@/app/pages/admin/Posts"
import { PostEditor } from "@/app/pages/admin/PostEditor"
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

  render(Document, [
    route("/", Landing),
    route("/home", Home),
    route("/post/:id", Post),
    prefix("/user", userRoutes),
    route("/admin", [isAuthenticated, Dashboard]),
    route("/admin/posts", [isAuthenticated, Posts]),
    route("/admin/post", [isAuthenticated, PostEditor]),
    route("/admin/post/:id", [isAuthenticated, PostEditor]),
  ]),
])
