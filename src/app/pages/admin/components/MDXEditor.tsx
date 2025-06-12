"use client"

import React, { forwardRef, useEffect, useState } from 'react'

interface CustomMDXEditorProps {
  id?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  markdown?: string
}

// Loading component
const EditorLoading = () => (
  <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50 animate-pulse flex items-center justify-center">
    <p className="text-gray-500">Loading rich text editor...</p>
  </div>
)

// Error component
const EditorError = () => (
  <div className="border rounded-lg p-4 min-h-[400px] bg-red-50 border-red-200">
    <p className="text-red-800 text-sm">
      Failed to load rich text editor. Please refresh the page.
    </p>
  </div>
)

// Main wrapper component that loads MDXEditor only on client side
const InitializedMDXEditor = forwardRef<any, CustomMDXEditorProps>(
  (props, ref) => {
    const [EditorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      // Only load on client side
      const loadEditor = async () => {
        try {
          const { MDXEditorCore } = await import('./MDXEditorCore')
          setEditorComponent(() => MDXEditorCore)
          setError(null)
        } catch (err) {
          console.error('Failed to load MDXEditor:', err)
          setError('Failed to load the rich text editor')
        } finally {
          setIsLoading(false)
        }
      }

      loadEditor()
    }, [])

    if (isLoading) {
      return <EditorLoading />
    }

    if (error || !EditorComponent) {
      return <EditorError />
    }

    return <EditorComponent {...props} ref={ref} />
  }
)

InitializedMDXEditor.displayName = 'InitializedMDXEditor'

export { InitializedMDXEditor as MDXEditor }
export type { CustomMDXEditorProps as MDXEditorProps }