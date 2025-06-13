"use client"

import React, { useState, useRef } from 'react'
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Button } from "@/app/shared/components/ui/button"
import { Card } from "@/app/shared/components/ui/card"
import { PostContent } from "../../components/PostContent"

interface SimpleMarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function SimpleMarkdownEditor({ id, name, value, onChange }: SimpleMarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Toolbar actions
  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end)
    
    onChange(newText)
    
    // Set cursor position after the operation
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("# ", "\n")}
            title="Heading 1"
          >
            H1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("## ", "\n")}
            title="Heading 2"
          >
            H2
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("**", "**")}
            title="Bold"
          >
            B
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("*", "*")}
            title="Italic"
          >
            I
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("`", "`")}
            title="Code"
          >
            `
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText("- ", "\n")}
            title="List"
          >
            •
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={mode === "edit" ? "default" : "outline"}
            onClick={() => setMode("edit")}
            size="sm"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "outline"}
            onClick={() => setMode("preview")}
            size="sm"
          >
            Preview
          </Button>
        </div>
      </div>
      
      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
          placeholder="Write your markdown content here..."
        />
      ) : (
        <>
          {/* Hidden input to ensure content is submitted when in preview mode */}
          <input type="hidden" name={name} value={value} />
          <Card className="p-4 min-h-[400px] prose prose-sm max-w-none overflow-auto">
            <div className="markdown-preview">
              <PostContent content={value} format="markdown" />
            </div>
          </Card>
        </>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Markdown syntax supported:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li># Heading 1, ## Heading 2, ### Heading 3</li>
          <li>**Bold text**, *Italic text*</li>
          <li>`inline code`</li>
          <li>- List items</li>
          <li>Embeds: YouTube, Twitter/X, and Bluesky URLs are automatically detected</li>
          <li>Manual embed syntax: [youtube]URL[/youtube], [twitter]URL[/twitter], [bluesky]URL[/bluesky]</li>
        </ul>
      </div>
    </div>
  )
}