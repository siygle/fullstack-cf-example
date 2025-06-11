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
import { BLOG_SETTINGS, updateSettings } from "@/config/settings"

const Settings = async ({ ctx, request, params }: { ctx: AppContext; request: Request; params?: any }) => {
  const { user } = ctx

  // Handle form submission
  if (request.method === "POST") {
    const formData = await request.formData()
    const newBlogTitle = formData.get("blog_title") as string
    const newPaginationCount = parseInt(formData.get("pagination_count") as string, 10)

    // Update settings
    updateSettings({
      blogTitle: newBlogTitle,
      paginationCount: newPaginationCount,
    })

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
                  defaultValue={BLOG_SETTINGS.blogTitle}
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
                  min={BLOG_SETTINGS.minPaginationCount}
                  max={BLOG_SETTINGS.maxPaginationCount}
                  defaultValue={BLOG_SETTINGS.paginationCount}
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