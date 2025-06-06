import { db } from "@/db/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { AppContext } from "@/worker"
import { Button } from "@/app/shared/components/ui/button"
import { Input } from "@/app/shared/components/ui/input"
import { Label } from "@/app/shared/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/shared/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/shared/components/ui/form"

const Settings = async ({ ctx, request, params }: { ctx: AppContext; request: Request; params?: any }) => {
  const { user } = ctx

  // Fetch current settings
  const blogTitleSetting = await db.query.settings.findFirst({
    where: eq(settings.key, "blog_title"),
  })

  const paginationSetting = await db.query.settings.findFirst({
    where: eq(settings.key, "pagination_count"),
  })

  const blogTitle = blogTitleSetting?.value || "My Blog"
  const paginationCount = paginationSetting?.value || "10"

  // Handle form submission
  if (request.method === "POST") {
    const formData = await request.formData()
    const newBlogTitle = formData.get("blog_title") as string
    const newPaginationCount = formData.get("pagination_count") as string

    // Update blog title
    if (blogTitleSetting) {
      await db
        .update(settings)
        .set({
          value: newBlogTitle,
          updatedAt: new Date()
        })
        .where(eq(settings.id, blogTitleSetting.id))
    } else {
      await db.insert(settings).values({
        id: nanoid(),
        key: "blog_title",
        value: newBlogTitle,
        updatedAt: new Date(),
      })
    }

    // Update pagination count
    if (paginationSetting) {
      await db
        .update(settings)
        .set({
          value: newPaginationCount,
          updatedAt: new Date()
        })
        .where(eq(settings.id, paginationSetting.id))
    } else {
      await db.insert(settings).values({
        id: nanoid(),
        key: "pagination_count",
        value: newPaginationCount,
        updatedAt: new Date(),
      })
    }

    // Redirect back to settings page
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/setting" },
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Blog Settings</CardTitle>
          <CardDescription>
            Configure your blog settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="POST" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="blog_title">Blog Title</Label>
                <Input
                  id="blog_title"
                  name="blog_title"
                  defaultValue={blogTitle}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This title will be displayed on your blog's homepage
                </p>
              </div>

              <div>
                <Label htmlFor="pagination_count">Posts Per Page</Label>
                <Input
                  id="pagination_count"
                  name="pagination_count"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue={paginationCount}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Number of posts to display per page on the homepage
                </p>
              </div>
            </div>

            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export { Settings }