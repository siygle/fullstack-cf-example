import React from "react";

interface PostContentShellProps {
  content: string;
  format: string;
  postId: string;
}

// This is a server component that creates a placeholder for client-side hydration
export function PostContentShell({ content, format, postId }: PostContentShellProps) {
  // Create a unique ID for this content shell
  const shellId = `post-content-shell-${postId}`;
  
  // Simple server-side rendering of markdown for initial display
  let initialContent = '';
  
  if (format === 'markdown') {
    // Very basic markdown rendering for server
    initialContent = content
      .split('\n')
      .map(line => {
        if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
        if (line.trim() === '') return '<br/>';
        return `<p>${line}</p>`;
      })
      .join('');
  } else if (format === 'html') {
    initialContent = content;
  } else {
    initialContent = `<pre>${content}</pre>`;
  }
  
  // Add a script to notify when this element is mounted in the DOM
  const notifyScript = `
    <script>
      console.log("PostContentShell mounted: ${shellId}");
      window.dispatchEvent(new CustomEvent('contentShellMounted', {
        detail: { id: "${shellId}" }
      }));
    </script>
  `;
  
  return (
    <div
      id={shellId}
      data-content={encodeURIComponent(content)}
      data-format={format}
      className="prose prose-lg max-w-none"
      style={{ minHeight: 100 }}
      dangerouslySetInnerHTML={{ __html: initialContent + notifyScript }}
    />
  );
}