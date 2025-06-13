"use client"

import React, { useState } from 'react'
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Button } from "@/app/shared/components/ui/button"
import { PostContent } from "../../components/PostContent"

interface BasicMarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function BasicMarkdownEditor({ id, name, value, onChange }: BasicMarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Content Editor</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(false)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-2">
          <Textarea
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Write your content here using Markdown syntax..."
          />
          <div className="text-xs text-gray-500">
            <p>Markdown shortcuts: # Heading, **bold**, *italic*, `code`, - list</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input type="hidden" name={name} value={value} />
          <div className="border rounded-lg p-4 min-h-[400px] bg-white">
            <div className="prose prose-sm max-w-none">
              <PostContent content={value} format="markdown" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}