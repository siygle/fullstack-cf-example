import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used

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

const SNIPPET_LENGTH = 150; // Characters

export const BlogIndexPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Basic pagination state
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const postsPerPage = 5;


  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
      setVisiblePosts(data.slice(0, postsPerPage));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const loadMorePosts = () => {
    const nextPage = page + 1;
    const newVisiblePosts = posts.slice(0, nextPage * postsPerPage);
    setVisiblePosts(newVisiblePosts);
    setPage(nextPage);
  };


  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading posts...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Blog</h1>
      {visiblePosts.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">No posts available yet. Check back soon!</p>
      )}
      <div className="space-y-8">
        {visiblePosts.map((post) => (
          <article key={post.id} className="p-6 rounded-lg shadow-lg bg-white">
            <h2 className="text-2xl font-semibold mb-2">
              <Link to={`/blog/${post.id}`} className="text-blue-600 hover:text-blue-800">
                {post.title}
              </Link>
            </h2>
            <div className="text-sm text-gray-500 mb-2">
              <span>By {post.author?.name || post.author?.email || 'Unknown Author'}</span>
              <span className="mx-2">|</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700 mb-3">
              {post.content.substring(0, SNIPPET_LENGTH)}
              {post.content.length > SNIPPET_LENGTH ? '...' : ''}
            </p>
            {post.tags && post.tags.length > 0 && (
              <div className="mb-3">
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
            <Link to={`/blog/${post.id}`} className="text-blue-500 hover:text-blue-700 font-medium">
              Read more &rarr;
            </Link>
          </article>
        ))}
      </div>
      {visiblePosts.length < posts.length && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMorePosts}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogIndexPage;
