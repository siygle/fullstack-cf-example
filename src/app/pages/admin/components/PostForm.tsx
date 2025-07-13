"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/shared/components/ui/button"
import { Input } from "@/app/shared/components/ui/input"
import { Label } from "@/app/shared/components/ui/label"
import { SimpleMarkdownEditor } from "./SimpleMarkdownEditor"
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Post, Tag } from "@/db/schema/blog-schema"
import { generateSlug, validateSlug, getUrlPatternExample } from "@/lib/url-utils"

interface PostFormProps {
  post?: Post | null
  tags?: Tag[]
}


export function PostForm({ post, tags = [] }: PostFormProps) {
  const [title, setTitle] = useState(post?.title || "")
  const [content, setContent] = useState(post?.content || "")
  const [status, setStatus] = useState(post?.status || "draft")
  const [tagInput, setTagInput] = useState(tags?.map(t => t.name).join(", ") || "")
  const [slug, setSlug] = useState(post?.slug || "")
  const [publishedDate, setPublishedDate] = useState(
    post?.publishedDate 
      ? new Date(post.publishedDate).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  )
  const [slugError, setSlugError] = useState<string | null>(null)
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(!post?.slug)

  // Auto-generate slug from title
  useEffect(() => {
    if (autoGenerateSlug && title) {
      const generatedSlug = generateSlug(title)
      setSlug(generatedSlug)
    }
  }, [title, autoGenerateSlug])

  // Validate slug when it changes
  useEffect(() => {
    if (slug) {
      const validation = validateSlug(slug)
      setSlugError(validation.valid ? null : validation.error || null)
    } else {
      setSlugError(null)
    }
  }, [slug])
  
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
        <Label htmlFor="slug">URL Slug</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoGenerateSlug"
              checked={autoGenerateSlug}
              onChange={(e) => setAutoGenerateSlug(e.target.checked)}
            />
            <Label htmlFor="autoGenerateSlug" className="text-sm font-normal">
              Auto-generate from title
            </Label>
          </div>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setAutoGenerateSlug(false)
            }}
            placeholder="my-post-title"
            className={slugError ? "border-red-500" : ""}
          />
          {slugError && (
            <p className="text-sm text-red-500">{slugError}</p>
          )}
          <p className="text-sm text-gray-500">
            URL will be: <code className="bg-gray-100 px-1 rounded">{getUrlPatternExample().replace('my-post-title', slug || 'my-post-title')}</code>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publishedDate">Published Date</Label>
        <Input
          id="publishedDate"
          name="publishedDate"
          type="datetime-local"
          value={publishedDate}
          onChange={(e) => setPublishedDate(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          This date will be used in the URL and for sorting posts
        </p>
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
        <Label htmlFor="content">Content</Label>
        
        <SimpleMarkdownEditor
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