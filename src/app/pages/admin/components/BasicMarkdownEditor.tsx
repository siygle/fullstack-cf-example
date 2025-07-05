"use client"

import React, { useState, useEffect } from 'react'

interface BasicMarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function BasicMarkdownEditor({ id, name, value, onChange }: BasicMarkdownEditorProps) {
  const [MDEditor, setMDEditor] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadEditor = async () => {
      try {
        const { default: MDEditorComponent } = await import('@uiw/react-md-editor')
        await import('@uiw/react-md-editor/markdown-editor.css')
        await import('@uiw/react-markdown-preview/markdown.css')
        setMDEditor(() => MDEditorComponent)
        setMounted(true)
      } catch (error) {
        console.error('Failed to load MDEditor:', error)
      }
    }

    loadEditor()
  }, [])

  if (!mounted || !MDEditor) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Content Editor</h3>
        </div>
        <div className="space-y-2">
          <input type="hidden" name={name} value={value} />
          <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Loading editor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Content Editor</h3>
      </div>

      <div className="space-y-2">
        <input type="hidden" name={name} value={value} />
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={400}
          preview="edit"
          hideToolbar={false}
          data-color-mode="light"
        />
      </div>
    </div>
  )
}