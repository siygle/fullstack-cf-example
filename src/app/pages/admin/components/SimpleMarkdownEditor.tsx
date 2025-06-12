"use client"

import React, { useState, useRef } from 'react'
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Button } from "@/app/shared/components/ui/button"
import { Card } from "@/app/shared/components/ui/card"

interface SimpleMarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function SimpleMarkdownEditor({ id, name, value, onChange }: SimpleMarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Simple markdown preview renderer
  const renderPreview = (markdown: string) => {
    return markdown
      .split('\n')
      .map((line, i) => {
        // Basic heading support
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>
        }
        
        // Basic list support
        if (line.startsWith('- ')) {
          return <div key={i} className="ml-4 my-1">• {line.substring(2)}</div>
        }
        
        // Basic bold/italic support
        let processedLine = line
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
        processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
        
        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-4"></div>
        }
        
        // Default paragraph
        return <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
      })
  }

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
              {renderPreview(value)}
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
        </ul>
      </div>
    </div>
  )
}