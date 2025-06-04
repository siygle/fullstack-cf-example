"use client"

import { useState } from "react"
import { Button } from "@/app/shared/components/ui/button"
import { Input } from "@/app/shared/components/ui/input"
import { Label } from "@/app/shared/components/ui/label"
import { MarkdownEditor } from "./MarkdownEditor"
import { Post, Tag } from "@/db/schema/blog-schema"

interface PostFormProps {
  post?: Post | null
  tags?: Tag[]
}

export function PostForm({ post, tags = [] }: PostFormProps) {
  const [title, setTitle] = useState(post?.title || "")
  const [content, setContent] = useState(post?.content || "")
  const [status, setStatus] = useState(post?.status || "draft")
  const [tagInput, setTagInput] = useState(tags?.map(t => t.name).join(", ") || "")
  
  return (
    <form method="POST" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
            />
            <span>Draft</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="published"
              checked={status === "published"}
              onChange={() => setStatus("published")}
            />
            <span>Published</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="private"
              checked={status === "private"}
              onChange={() => setStatus("private")}
            />
            <span>Private</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          name="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="technology, programming, web"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content (Markdown)</Label>
        <MarkdownEditor
          id="content"
          name="content"
          value={content}
          onChange={setContent}
        />
      </div>
      
      <Button type="submit" className="w-full">
        {post ? "Update Post" : "Create Post"}
      </Button>
    </form>
  )
}