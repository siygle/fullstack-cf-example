"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { Embed } from "@/app/shared/components/Embed"

interface PostContentProps {
  content: string;
  format: 'html' | 'plain' | 'markdown';
}

// 自定义组件来处理嵌入
const components = {
  // 处理自定义嵌入语法
  p: ({ children, ...props }: any) => {
    const content = React.Children.toArray(children)[0]?.toString() || '';
    
    // Check for embed syntax in various formats
    const twitterMatch = content.match(/^\[twitter\](.*?)\[\/twitter\]$/);
    const blueskyMatch = content.match(/^\[bluesky\](.*?)\[\/bluesky\]$/);
    const youtubeMatch = content.match(/^\[youtube\](.*?)\[\/youtube\]$/);
    
    // Also check for the {type:url} format
    const altFormatMatch = content.match(/^\{([^:]+):([^}]+)\}$/);
    
    if (twitterMatch) {
      return <Embed type="twitter" url={twitterMatch[1]} />;
    }
    if (blueskyMatch) {
      return <Embed type="bluesky" url={blueskyMatch[1]} />;
    }
    if (youtubeMatch) {
      return <Embed type="youtube" url={youtubeMatch[1]} />;
    }
    if (altFormatMatch) {
      const [_, type, url] = altFormatMatch;
      // Ensure type is one of the supported types
      const embedType = type.toLowerCase();
      if (embedType === 'twitter' || embedType === 'bluesky' || embedType === 'youtube') {
        return <Embed type={embedType as 'twitter' | 'bluesky' | 'youtube'} url={url} />;
      } else {
        // Fallback for unsupported types
        return <p>{content} <em>(Unsupported embed type: {type})</em></p>;
      }
    }
    
    return <p {...props}>{children}</p>;
  }
};

// 简单的 Markdown 渲染函数
function simpleMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      // 处理标题
      if (line.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold mb-4">${line.slice(2)}</h1>`;
      }
      if (line.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold mb-3">${line.slice(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-xl font-bold mb-2">${line.slice(4)}</h3>`;
      }
      // 处理列表
      if (line.startsWith('- ')) {
        return `<li class="ml-4">${line.slice(2)}</li>`;
      }
      // 处理链接
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return line.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 hover:underline">$1</a>'
        );
      }
      // 处理加粗
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        return line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      }
      // 处理斜体
      const italicMatch = line.match(/\*([^*]+)\*/);
      if (italicMatch) {
        return line.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      }
      // 处理代码块
      if (line.startsWith('```')) {
        return `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto">${line.slice(3)}</pre>`;
      }
      // 处理图片
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        return `<img src="${imageMatch[2]}" alt="${imageMatch[1]}" class="max-w-full h-auto rounded-lg shadow-md" />`;
      }
      // 处理引用
      if (line.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-gray-300 pl-4 italic">${line.slice(2)}</blockquote>`;
      }
      // 处理分隔线
      if (line === '---') {
        return '<hr class="my-4 border-gray-300" />';
      }
      // 处理普通段落
      if (line.trim()) {
        return `<p class="mb-4">${line}</p>`;
      }
      return '<br />';
    })
    .join('\n');
}

// Process content to handle custom embed syntax before rendering
function processContent(content: string): string {
  // Handle {bluesky:url} syntax
  return content.replace(/\{([^:]+):([^}]+)\}\}/g, (match, type, url) => {
    return `[${type}]${url}[/${type}]`;
  });
}

export function PostContent({ content, format }: PostContentProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [processedContent, setProcessedContent] = React.useState(content);
  
  React.useEffect(() => {
    setIsClient(true);
    console.log("PostContent mounted with format:", format);
    
    // Process content to handle custom embed syntax
    const processed = processContent(content);
    setProcessedContent(processed);
    console.log("Content processed for embeds");
  }, [content]);

  if (format === 'html') {
    return (
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (format === 'plain') {
    return (
      <pre className="whitespace-pre-wrap font-sans text-base">
        {content}
      </pre>
    );
  }

  // For server-side rendering or initial client render, use simple markdown
  if (!isClient) {
    return (
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: simpleMarkdown(processedContent) }}
      />
    );
  }

  // For client-side rendering with full markdown capabilities
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          rehypeHighlight,
        ]}
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}