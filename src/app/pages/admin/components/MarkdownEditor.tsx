"use client"

import { useState, useRef } from "react"
import { Textarea } from "@/app/shared/components/ui/textarea"
import { Button } from "@/app/shared/components/ui/button"
import { Card } from "@/app/shared/components/ui/card"

// Interfaces
interface MarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

interface ToolbarButtonProps {
  icon: string
  label: string
  onClick: () => void
}

// Toolbar button component
function ToolbarButton({ icon, label, onClick }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      title={label}
      onClick={onClick}
      className="px-2 py-1 h-8"
    >
      {icon}
    </Button>
  )
}

// Simple preview component that doesn't use any external libraries
function SimplePreview({ content }: { content: string }) {
  return (
    <div className="markdown-preview">
      {content.split('\n').map((line, i) => {
        // Basic heading support
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
        }
        
        // Basic list support
        if (line.startsWith('- ')) {
          return <div key={i} className="ml-4 my-1">• {line.substring(2)}</div>;
        }
        
        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-4"></div>;
        }
        
        // Default paragraph
        return <p key={i} className="my-2">{line}</p>;
      })}
    </div>
  );
}

export function MarkdownEditor({ id, name, value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Function to insert text at cursor position
  const insertAtCursor = (before: string, after: string = "") => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
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
  
  // Toolbar actions
  const toolbarActions = [
    {
      icon: "H1",
      label: "Heading 1",
      onClick: () => insertAtCursor("# ", "\n")
    },
    {
      icon: "H2",
      label: "Heading 2",
      onClick: () => insertAtCursor("## ", "\n")
    },
    {
      icon: "B",
      label: "Bold",
      onClick: () => insertAtCursor("**", "**")
    },
    {
      icon: "I",
      label: "Italic",
      onClick: () => insertAtCursor("*", "*")
    },
    {
      icon: "~",
      label: "Strikethrough",
      onClick: () => insertAtCursor("~~", "~~")
    },
    {
      icon: "🔗",
      label: "Link",
      onClick: () => insertAtCursor("[", "](url)")
    },
    {
      icon: "📝",
      label: "List",
      onClick: () => insertAtCursor("- ", "\n")
    },
    {
      icon: "1.",
      label: "Numbered List",
      onClick: () => insertAtCursor("1. ", "\n")
    },
    {
      icon: "`",
      label: "Code",
      onClick: () => insertAtCursor("`", "`")
    },
    {
      icon: "```",
      label: "Code Block",
      onClick: () => insertAtCursor("```\n", "\n```")
    }
  ]
  
  // Embed actions
  const embedActions = [
    {
      icon: "𝕏",
      label: "Embed Twitter/X Post",
      onClick: () => {
        const url = prompt("Enter Twitter/X post URL:")
        if (url) {
          insertAtCursor(`{{twitter:${url}}}`, "\n")
        }
      }
    },
    {
      icon: "🐘",
      label: "Embed Mastodon Post",
      onClick: () => {
        const url = prompt("Enter Mastodon post URL:")
        if (url) {
          insertAtCursor(`{{mastodon:${url}}}`, "\n")
        }
      }
    },
    {
      icon: "🦋",
      label: "Embed BlueSky Post",
      onClick: () => {
        const url = prompt("Enter BlueSky post URL:")
        if (url) {
          insertAtCursor(`{{bluesky:${url}}}`, "\n")
        }
      }
    }
  ]
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {toolbarActions.map((action, index) => (
            <ToolbarButton
              key={index}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
            />
          ))}
          <div className="border-l border-gray-300 mx-1"></div>
          {embedActions.map((action, index) => (
            <ToolbarButton
              key={index}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
            />
          ))}
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
          className="min-h-[300px] font-mono"
        />
      ) : (
        <>
          {/* Hidden input to ensure content is submitted when in preview mode */}
          <input type="hidden" name={name} value={value} />
          <Card className="p-4 min-h-[300px] prose prose-sm max-w-none overflow-auto">
            <SimplePreview content={value} />
          </Card>
        </>
      )}
    </div>
  )
}