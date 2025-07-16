import { Button } from "@/app/shared/components/ui/button"
import { LogoutButton } from "@/app/shared/components/LogoutButton"
import { MenuItem, Tag } from "@/db/schema/blog-schema"
import { link } from "@/app/shared/links"

interface MenuItemWithTag extends MenuItem {
  tag?: Tag
}

interface CustomMenuProps {
  menuItems: MenuItemWithTag[]
  user: any
  authUrl: string
}

export const CustomMenu = ({ menuItems, user, authUrl }: CustomMenuProps) => {
  const visibleMenuItems = menuItems.filter(item => item.is_visible)

  return (
    <div className="flex gap-4 items-center">
      {visibleMenuItems.map((item) => (
        <Button key={item.id} asChild variant="outline">
          <a href={
            item.type === "link" 
              ? item.url || "#" 
              : `/tags/${item.tag?.name || ""}`
          }>
            {item.title}
          </a>
        </Button>
      ))}
      
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
  )
}