"use client"

import { useState } from "react"
import { Button } from "@/app/shared/components/ui/button"
import { Input } from "@/app/shared/components/ui/input"
import { Label } from "@/app/shared/components/ui/label"
import { MarkdownEditor } from "./MarkdownEditor"
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Post, Tag } from "@/db/schema/blog-schema"

interface PostFormProps {
  post?: Post | null
  tags?: Tag[]
}

// Available post formats
type PostFormat = "markdown" | "html" | "text"

export function PostForm({ post, tags = [] }: PostFormProps) {
  const [title, setTitle] = useState(post?.title || "")
  const [content, setContent] = useState(post?.content || "")
  const [status, setStatus] = useState(post?.status || "draft")
  const [tagInput, setTagInput] = useState(tags?.map(t => t.name).join(", ") || "")
  const [format, setFormat] = useState<PostFormat>("markdown")
  
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
        <Label htmlFor="format">Format</Label>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="format"
              value="markdown"
              checked={format === "markdown"}
              onChange={() => setFormat("markdown")}
            />
            <span>Markdown</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="format"
              value="html"
              checked={format === "html"}
              onChange={() => setFormat("html")}
            />
            <span>HTML</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="format"
              value="text"
              checked={format === "text"}
              onChange={() => setFormat("text")}
            />
            <span>Plain Text</span>
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
        <Label htmlFor="content">Content</Label>
        
        {/* Hidden input to store the format */}
        <input type="hidden" name="format" value={format} />
        
        {format === "markdown" ? (
          <MarkdownEditor
            id="content"
            name="content"
            value={content}
            onChange={setContent}
          />
        ) : format === "html" ? (
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono"
            placeholder="<p>Your HTML content here</p>"
          />
        ) : (
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px]"
            placeholder="Your plain text content here"
          />
        )}
      </div>
      
      <Button type="submit" className="w-full">
        {post ? "Update Post" : "Create Post"}
      </Button>
    </form>
  )
}