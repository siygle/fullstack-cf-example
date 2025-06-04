"use client"

import React, { useState, useEffect } from 'react'
import { Textarea } from "@/app/shared/components/ui/textarea"

interface MarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

// This is a wrapper component that dynamically loads the real editor only on the client side
export function MarkdownEditorWrapper(props: MarkdownEditorProps) {
  const [EditorComponent, setEditorComponent] = useState<React.ComponentType<MarkdownEditorProps> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only import the editor component on the client side
    const loadEditor = async () => {
      try {
        // Create a simple editor component that doesn't use any external libraries
        const SimpleEditor: React.FC<MarkdownEditorProps> = ({ id, name, value, onChange }) => {
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Markdown Editor</div>
                <div className="text-xs text-gray-500">Simple mode (preview disabled)</div>
              </div>
              <Textarea
                id={id}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[300px] font-mono"
                placeholder="Write your markdown content here..."
              />
              <div className="text-xs text-gray-500">
                <p>Markdown tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li># Heading 1</li>
                  <li>## Heading 2</li>
                  <li>**Bold text**</li>
                  <li>*Italic text*</li>
                  <li>[Link text](url)</li>
                  <li>- List item</li>
                </ul>
              </div>
            </div>
          )
        }

        setEditorComponent(() => SimpleEditor)
      } catch (error) {
        console.error('Failed to load editor:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEditor()
  }, [])

  if (isLoading) {
    return (
      <div className="border rounded p-4 min-h-[300px] bg-gray-100 animate-pulse">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    )
  }

  if (!EditorComponent) {
    return (
      <div className="border rounded p-4 min-h-[300px] bg-red-50">
        <p className="text-red-500">Failed to load editor. Please try refreshing the page.</p>
        <Textarea
          id={props.id}
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="mt-4 min-h-[200px] font-mono"
        />
      </div>
    )
  }

  return <EditorComponent {...props} />
}