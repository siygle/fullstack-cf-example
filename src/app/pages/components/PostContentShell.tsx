"use client";

import React from "react";
import { PostContent } from "./PostContent";

interface PostContentShellProps {
  content: string;
  postId: string;
}

// Simplified server component that directly renders PostContent
export function PostContentShell({ content, postId }: PostContentShellProps) {
  return (
    <div 
      id={`post-content-${postId}`}
      className="post-content-container"
    >
      <PostContent 
        content={content} 
        format="markdown" 
      />
    </div>
  );
}