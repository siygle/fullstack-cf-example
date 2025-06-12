"use client"

import React from 'react';

interface EmbedProps {
  type: 'twitter' | 'bluesky' | 'youtube';
  url: string;
}

export function Embed({ type, url }: EmbedProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;

    const loadEmbed = async () => {
      try {
        setIsLoading(true);
        setError(null);

        switch (type) {
          case 'twitter': {
            // 使用 Twitter 的 oEmbed 服务
            const response = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&theme=light&dnt=true`);
            if (!response.ok) throw new Error('无法加载 Twitter 嵌入');
            const data = await response.json();
            if (containerRef.current) {
              containerRef.current.innerHTML = data.html;
              // 加载 Twitter 的 widget.js
              const script = document.createElement('script');
              script.src = 'https://platform.twitter.com/widgets.js';
              script.async = true;
              document.body.appendChild(script);
            }
            break;
          }
          case 'bluesky': {
            // Bluesky 目前没有官方的嵌入 API，显示一个链接卡片
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div class="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <a href="${url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <span>查看 Bluesky 帖子</span>
                  </a>
                </div>
              `;
            }
            break;
          }
          case 'youtube': {
            // 从 YouTube URL 中提取视频 ID
            const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
            if (!videoId) throw new Error('无效的 YouTube 链接');
            
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div class="relative pb-[56.25%] h-0 rounded-lg overflow-hidden shadow-md">
                  <iframe
                    class="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/${videoId}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              `;
            }
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载嵌入内容失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmbed();
  }, [type, url, isClient]);

  if (!isClient) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 text-red-600">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="my-4" />;
} 