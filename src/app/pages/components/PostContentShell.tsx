import React from "react";
import { PostContent } from "./PostContent";

interface PostContentShellProps {
  content: string;
  format: string;
  postId: string;
}

// Simplified server component that directly renders PostContent
export function PostContentShell({ content, format, postId }: PostContentShellProps) {
  // Validate format and provide fallback
  const validFormat = ['html', 'markdown', 'plain'].includes(format) 
    ? format as 'html' | 'markdown' | 'plain'
    : 'plain';

  return (
    <div 
      id={`post-content-${postId}`}
      className="post-content-container"
    >
      <PostContent 
        content={content} 
        format={validFormat} 
      />
    </div>
  );
}