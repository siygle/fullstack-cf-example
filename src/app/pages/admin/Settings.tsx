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
import { db } from "@/db/db"
import { menuItem, tag } from "@/db/schema/blog-schema"
import { eq, desc } from "drizzle-orm"
import { nanoid } from "nanoid"

const Settings = async ({ ctx, request, params }: { ctx: AppContext; request: Request; params?: any }) => {
  const { user } = ctx

  // Handle form submission
  if (request.method === "POST") {
    const formData = await request.formData()
    const action = formData.get("action") as string

    if (action === "settings") {
      const newBlogTitle = formData.get("blog_title") as string
      const newPaginationCount = parseInt(formData.get("pagination_count") as string, 10)

      // Update settings (cast to handle readonly constraints)
      updateSettings({
        blogTitle: newBlogTitle as any,
        paginationCount: newPaginationCount as any,
      })
    } else if (action === "add_menu_item") {
      const title = formData.get("title") as string
      const type = formData.get("type") as string
      const url = formData.get("url") as string
      const tagId = formData.get("tag_id") as string

      if (title && type) {
        const nextOrder = await db.query.menuItem.findMany({
          orderBy: [desc(menuItem.order)],
          limit: 1,
        })
        
        const newOrder = nextOrder.length > 0 ? nextOrder[0].order + 1 : 0

        await db.insert(menuItem).values({
          id: nanoid(),
          title,
          type,
          url: type === "link" ? url : undefined,
          tag_id: type === "tag" ? tagId : undefined,
          order: newOrder,
          is_visible: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    } else if (action === "delete_menu_item") {
      const menuItemId = formData.get("menu_item_id") as string
      if (menuItemId) {
        await db.delete(menuItem).where(eq(menuItem.id, menuItemId))
      }
    } else if (action === "toggle_menu_item") {
      const menuItemId = formData.get("menu_item_id") as string
      const isVisible = formData.get("is_visible") === "true"
      if (menuItemId) {
        await db.update(menuItem)
          .set({ is_visible: !isVisible, updated_at: new Date() })
          .where(eq(menuItem.id, menuItemId))
      }
    }

    // Redirect back to settings page
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/setting" },
    })
  }

  // Fetch menu items and tags for display
  const menuItems = await db.query.menuItem.findMany({
    orderBy: [menuItem.order],
  })

  // Fetch tags for each menu item separately
  const menuItemsWithTags = await Promise.all(
    menuItems.map(async (item) => {
      if (item.type === "tag" && item.tag_id) {
        const tagData = await db.query.tag.findFirst({
          where: eq(tag.id, item.tag_id),
        })
        return { ...item, tag: tagData }
      }
      return item
    })
  )

  const tags = await db.query.tag.findMany({
    orderBy: [tag.name],
  })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Blog Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Settings</CardTitle>
          <CardDescription>
            Configure your blog settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="POST" className="space-y-6">
            <input type="hidden" name="action" value="settings" />
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

      {/* Menu Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>
            Manage your blog's navigation menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add Menu Item Form */}
            <form method="POST" className="space-y-4 border-b pb-4">
              <input type="hidden" name="action" value="add_menu_item" />
              <div>
                <Label htmlFor="title">Menu Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter menu item title"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Menu Type</Label>
                <select
                  id="type"
                  name="type"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select menu type</option>
                  <option value="link">Custom Link</option>
                  <option value="tag">Tag Page</option>
                </select>
              </div>

              <div id="link-fields">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the full URL for custom links
                </p>
              </div>

              <div id="tag-fields">
                <Label htmlFor="tag_id">Tag</Label>
                <select
                  id="tag_id"
                  name="tag_id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select a tag</option>
                  {tags.map((tagItem) => (
                    <option key={tagItem.id} value={tagItem.id}>
                      {tagItem.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a tag to create a link to its posts
                </p>
              </div>

              <Button type="submit">Add Menu Item</Button>
            </form>

            {/* Menu Items List */}
            <div className="space-y-2">
              <h3 className="font-medium">Current Menu Items</h3>
              {menuItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No menu items yet</p>
              ) : (
                <div className="space-y-2">
                  {menuItemsWithTags.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.type === "link" ? (
                              <span>Link: {item.url}</span>
                            ) : (
                              <span>Tag: {(item as any).tag?.name || "Unknown"}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.is_visible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.is_visible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <form method="POST" className="inline">
                          <input type="hidden" name="action" value="toggle_menu_item" />
                          <input type="hidden" name="menu_item_id" value={item.id} />
                          <input type="hidden" name="is_visible" value={item.is_visible.toString()} />
                          <Button type="submit" variant="outline" size="sm">
                            {item.is_visible ? 'Hide' : 'Show'}
                          </Button>
                        </form>
                        <form method="POST" className="inline">
                          <input type="hidden" name="action" value="delete_menu_item" />
                          <input type="hidden" name="menu_item_id" value={item.id} />
                          <Button type="submit" variant="destructive" size="sm">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { Settings }