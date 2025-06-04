"use client"

import { useState } from "react"
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Button } from "@/app/shared/components/ui/button"
import { Card } from "@/app/shared/components/ui/card"

interface MarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ id, name, value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  
  return (
    <div className="space-y-2">
      <div className="flex justify-end space-x-2">
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
      
      {mode === "edit" ? (
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[300px] font-mono"
        />
      ) : (
        <>
          {/* Hidden input to ensure content is submitted when in preview mode */}
          <input type="hidden" name={name} value={value} />
          <Card className="p-4 min-h-[300px] prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
          </Card>
        </>
      )}
    </div>
  )
}

// Simple markdown rendering function (placeholder)
function renderMarkdown(markdown: string) {
  return markdown
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}