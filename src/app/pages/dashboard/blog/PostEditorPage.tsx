import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import SimpleMDEEditor from 'react-simplemde-editor'; // Original import
import 'easymde/dist/easymde.min.css'; // Import EasyMDE styles

const SimpleMDEEditor = React.lazy(() => import('react-simplemde-editor'));

// Wrapper component to ensure SimpleMDEEditor is only rendered on the client-side
interface ClientOnlySimpleMDEEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: object; // Adjust the type according to SimpleMDEEditor's options prop
}

const ClientOnlySimpleMDEEditor: React.FC<ClientOnlySimpleMDEEditorProps> = ({ id, value, onChange, options }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading editor...</div>; // Or null, or a more sophisticated placeholder
  }

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <SimpleMDEEditor
        id={id}
        value={value}
        onChange={onChange}
        options={options}
      />
    </Suspense>
  );
};

export const PostEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('postId');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated string
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(postId);

  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      fetch(`/api/posts/${postId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: `Failed to fetch post ${postId}` }));
            throw new Error(errorData.message);
          }
          return res.json();
        })
        .then((data) => {
          setTitle(data.title);
          setContent(data.content);
          setTags(data.tags ? data.tags.join(', ') : '');
        })
        .catch((err) => {
          console.error('Error fetching post:', err);
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    }
  }, [postId, isEditing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      title,
      content,
      tagNames: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    const url = isEditing ? `/api/posts/${postId}` : '/api/posts';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `${method} request failed`);
      }
      navigate('/dashboard/blog/posts'); // Navigate to posts list
    } catch (err) {
      console.error('Error saving post:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      // Add other options here if needed
    };
  }, []);

  if (isLoading && isEditing) {
    return <div className="container mx-auto p-4 text-center">Loading post data...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <ClientOnlySimpleMDEEditor
            id="content"
            value={content}
            onChange={setContent}
            options={editorOptions}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/blog/posts')} // Navigate to posts list
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Default export for RedwoodJS page discovery
export default PostEditorPage;
