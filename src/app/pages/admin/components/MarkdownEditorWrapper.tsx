"use client"

import React from 'react'
import { BasicMarkdownEditor } from './BasicMarkdownEditor'

interface MarkdownEditorProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditorWrapper(props: MarkdownEditorProps) {
  return <BasicMarkdownEditor {...props} />
}