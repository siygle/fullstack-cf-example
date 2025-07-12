"use client"

import React, { useState, useEffect } from 'react'
import { Textarea } from '@/app/shared/components/ui/textarea'
import { Button } from '@/app/shared/components/ui/button'

interface SimpleMarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function SimpleMarkdownEditor({ id, name, value, onChange }: SimpleMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [previewContent, setPreviewContent] = useState('')

  // Simple markdown to HTML converter (SSR-safe)
  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-white p-3 rounded overflow-x-auto"><code>$1</code></pre>')
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    
    // Line breaks
    html = html.replace(/\n/g, '<br>')
    
    return html
  }

  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewContent(convertMarkdownToHtml(value))
    }
  }, [activeTab, value])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Content Editor</h3>
        <div className="flex rounded-md border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'write'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <input type="hidden" name={name} value={value} />
        
        {activeTab === 'write' ? (
          <div className="space-y-2">
            <Textarea
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Write your markdown content here..."
            />
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Markdown Quick Reference:</strong></p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>• # Header 1</div>
                <div>• **bold text**</div>
                <div>• ## Header 2</div>
                <div>• *italic text*</div>
                <div>• ### Header 3</div>
                <div>• `inline code`</div>
                <div>• [link text](url)</div>
                <div>• ```code block```</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-md p-4 min-h-[400px] bg-gray-50">
            <div className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: previewContent }}
                className="text-sm leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}