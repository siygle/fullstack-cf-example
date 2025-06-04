import { db } from "@/db/db"
import { post } from "@/db/schema"
import { AppContext } from "@/worker"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/shared/components/ui/card"
import { Button } from "@/app/shared/components/ui/button"
import { link } from "@/app/shared/links"
import { eq, count } from "drizzle-orm"

const Dashboard = async ({ ctx }: { ctx: AppContext }) => {
  // Get post counts by status
  const publishedCount = await db
    .select({ count: count() })
    .from(post)
    .where(eq(post.status, "published"))
    .get()
  
  const draftCount = await db
    .select({ count: count() })
    .from(post)
    .where(eq(post.status, "draft"))
    .get()
    
  const privateCount = await db
    .select({ count: count() })
    .from(post)
    .where(eq(post.status, "private"))
    .get()
  
  const totalCount = await db
    .select({ count: count() })
    .from(post)
    .get()

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Button asChild>
            <a href="/admin/post">Create New Post</a>
          </Button>
          <Button asChild variant="outline">
            <a href={link("/home")}>View Blog</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount?.count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount?.count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount?.count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Private</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateCount?.count || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <a href="/admin/posts">Manage All Posts</a>
            </Button>
            <Button asChild className="w-full">
              <a href="/admin/post">Write New Post</a>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your recent post editing activity will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { Dashboard }