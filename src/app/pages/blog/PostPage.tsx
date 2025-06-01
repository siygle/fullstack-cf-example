import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Assuming react-router-dom
import ReactMarkdown from 'react-markdown';

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name?: string;
    email?: string;
  };
  tags: string[];
}

export const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    fetch(`/api/posts/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch post ${id}` }));
          throw new Error(errorData.message || `Failed to fetch post ${id}`);
        }
        return res.json();
      })
      .then((data) => {
        setPost(data);
      })
      .catch((err) => {
        console.error('Error fetching post:', err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading post...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">Error: {error}</div>;
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-gray-700">Post not found.</p>
        <Link to="/blog" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
          &larr; Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <article className="prose lg:prose-xl max-w-none bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
          <div className="text-sm text-gray-500 mb-4">
            <span>By {post.author?.name || post.author?.email || 'Unknown Author'}</span>
            <span className="mx-2">|</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <ReactMarkdown className="markdown-content">{post.content}</ReactMarkdown>

        <hr className="my-8" />
        <Link to="/blog" className="text-blue-500 hover:text-blue-700">
          &larr; Back to All Posts
        </Link>
      </article>
      {/* Basic styling for markdown content - can be expanded in a global CSS file */}
      <style jsx global>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          margin-bottom: 0.5em;
          margin-top: 1em;
        }
        .markdown-content p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1em;
          margin-left: 2em;
        }
        .markdown-content blockquote {
          border-left: 4px solid #ccc;
          padding-left: 1em;
          margin-left: 0;
          color: #666;
        }
        .markdown-content pre {
          background-color: #f5f5f5;
          padding: 1em;
          border-radius: 0.25em;
          overflow-x: auto;
        }
        .markdown-content code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 0.2em 0.4em;
          border-radius: 0.2em;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.25em;
        }
      `}</style>
    </div>
  );
};

export default PostPage;
