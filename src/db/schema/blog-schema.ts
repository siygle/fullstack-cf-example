import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const post = sqliteTable("post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  // Status can be: "published", "draft", "private"
  status: text("status").notNull().$defaultFn(() => "draft"),
  // Format can be: "markdown", "html", "text"
  format: text("format").notNull().$defaultFn(() => "markdown"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const tag = sqliteTable("tag", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
})

export const postToTag = sqliteTable("post_to_tag", {
  id: text("id").primaryKey(),
  post_id: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  tag_id: text("tag_id")
    .notNull()
    .references(() => tag.id, { onDelete: "cascade" }),
})

export type Post = typeof post.$inferSelect
export type Tag = typeof tag.$inferSelect
export type PostToTag = typeof postToTag.$inferSelect