"use client"

import React, { forwardRef, useEffect, useState } from 'react'

interface CustomMDXEditorProps {
  id?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  markdown?: string
}

// Core MDXEditor component that loads everything dynamically
export const MDXEditorCore = forwardRef<any, CustomMDXEditorProps>(
  ({ id, name, value, onChange, markdown, ...props }, ref) => {
    const [EditorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Use value prop if provided, otherwise fall back to markdown
    const content = value ?? markdown ?? ''

    useEffect(() => {
      const loadMDXEditor = async () => {
        try {
          // Dynamic import to avoid SSR issues
          const mdxModule = await import('@mdxeditor/editor')
          const {
            MDXEditor,
            headingsPlugin,
            listsPlugin,
            quotePlugin,
            thematicBreakPlugin,
            markdownShortcutPlugin,
            linkPlugin,
            linkDialogPlugin,
            imagePlugin,
            tablePlugin,
            codeBlockPlugin,
            toolbarPlugin,
            UndoRedo,
            BoldItalicUnderlineToggles,
            CreateLink,
            InsertImage,
            InsertTable,
            InsertThematicBreak,
            ListsToggle,
            BlockTypeSelect,
            CodeToggle,
            InsertCodeBlock
          } = mdxModule

          // Import CSS dynamically (skip for now to avoid build issues)
          // await import('@mdxeditor/editor/style.css')

          // Custom toolbar component
          const EditorToolbar = () => React.createElement(React.Fragment, null,
            React.createElement(UndoRedo),
            React.createElement(BoldItalicUnderlineToggles),
            React.createElement(CodeToggle),
            React.createElement(BlockTypeSelect),
            React.createElement(CreateLink),
            React.createElement(InsertImage),
            React.createElement(ListsToggle),
            React.createElement(InsertTable),
            React.createElement(InsertThematicBreak),
            React.createElement(InsertCodeBlock)
          )

          // Create the configured MDXEditor component
          const ConfiguredMDXEditor = React.forwardRef<any, any>((editorProps, editorRef) => {
            return React.createElement(MDXEditor, {
              ref: editorRef,
              markdown: editorProps.content,
              onChange: editorProps.onChange,
              plugins: [
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
                toolbarPlugin({
                  toolbarContents: EditorToolbar
                }),
                markdownShortcutPlugin()
              ],
              ...editorProps
            })
          })

          setEditorComponent(() => ConfiguredMDXEditor)
          setError(null)
        } catch (err) {
          console.error('Failed to load MDXEditor:', err)
          setError('Failed to load the rich text editor')
        } finally {
          setIsLoading(false)
        }
      }

      loadMDXEditor()
    }, [])

    if (isLoading) {
      return React.createElement('div', {
        className: "border rounded-lg p-4 min-h-[400px] bg-gray-50 animate-pulse flex items-center justify-center"
      }, React.createElement('p', {
        className: "text-gray-500"
      }, "Loading rich text editor..."))
    }

    if (error || !EditorComponent) {
      return React.createElement('div', {
        className: "border rounded-lg p-4 min-h-[400px] bg-red-50 border-red-200"
      }, React.createElement('p', {
        className: "text-red-800 text-sm"
      }, error || "Failed to load rich text editor"))
    }

    return React.createElement(React.Fragment, null,
      // Hidden input for form submission when name is provided
      name && React.createElement('input', {
        type: 'hidden',
        name: name,
        value: content
      }),
      React.createElement(EditorComponent, {
        ref: ref,
        content: content,
        onChange: onChange,
        ...props
      })
    )
  }
)

MDXEditorCore.displayName = 'MDXEditorCore'