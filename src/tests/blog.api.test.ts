import app from '../worker'; // Assuming 'defineApp' default export is the Hono app
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db/db';
import { posts, tags, postTags, user as userTable } from '@/db/schema';
import { sql } from 'drizzle-orm';

// Mock the auth module
const mockAuthModule = {
  api: {
    getSession: vi.fn(), // This will be our mock function
  },
  handler: vi.fn(), // Mock other exports if needed by the app instance
  // Add any other exports from '@/lib/auth' that worker.tsx might use during setup
};
vi.mock('@/lib/auth', () => ({ auth: mockAuthModule }));


// Helper to create a dummy user for testing
const createUser = async (id: string, name: string, email: string) => {
  // Use .get() if your Drizzle version/dialect supports it for returning one row,
  // otherwise, adjust to how you get the inserted row.
  const result = await db.insert(userTable).values({ id, name, email }).returning();
  return result[0];
};


describe('Blog API Endpoints', () => {
  let testUser1: Awaited<ReturnType<typeof createUser>>;
  let testUser2: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    // Reset mocks and database before each test
    mockAuthModule.api.getSession.mockReset();

    // Clean up database tables
    await db.delete(postTags).execute();
    await db.delete(posts).execute();
    await db.delete(tags).execute();
    await db.delete(userTable).execute();

    // Create test users
    testUser1 = await createUser('user1_id_test', 'User One Test', 'user1.test@example.com');
    testUser2 = await createUser('user2_id_test', 'User Two Test', 'user2.test@example.com');
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore all mocks after each test
  });

  describe('Public Access', () => {
    it('GET /api/posts - should return an array of posts', async () => {
      // Create a post first by user1 (simulating direct DB insertion for setup)
      const [post1] = await db.insert(posts).values({ title: 'Post 1', content: 'Content 1', userId: testUser1.id }).returning();

      const response = await app.request('/api/posts');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].title).toBe('Post 1');
    });

    it('GET /api/posts/:id - should return a single post if found', async () => {
      const [post1Data] = await db.insert(posts).values({ title: 'Post Alpha', content: 'Content Alpha', userId: testUser1.id }).returning();

      const response = await app.request(`/api/posts/${post1Data.id}`);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(post1Data.id);
      expect(body.title).toBe('Post Alpha');
    });

    it('GET /api/posts/:id - should return 404 if post not found', async () => {
      const response = await app.request('/api/posts/999999');
      expect(response.status).toBe(404);
    });

    it('GET /api/tags - should return an array of tags', async () => {
      await db.insert(tags).values({ name: 'testingtag' }).execute();
      const response = await app.request('/api/tags');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((tag: any) => tag.name === 'testingtag')).toBe(true);
    });
  });

  describe('Authentication & Authorization', () => {
    const postPayload = { title: 'Auth Test Post', content: 'Content for auth test', tagNames: ['auth', 'test'] };

    it('POST /api/posts - should return 401 if not authenticated', async () => {
      const response = await app.request('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postPayload),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(401);
    });

    // The following tests for PUT and DELETE (401) require a post to exist.
    // We'll create one directly in the DB for these tests.

    it('PUT /api/posts/:id - should return 401 if not authenticated', async () => {
        const [postToUpdateData] = await db.insert(posts).values({ title: 'Pre-update', content: '...', userId: testUser1.id }).returning();
        const response = await app.request(`/api/posts/${postToUpdateData.id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: 'Updated Title' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(response.status).toBe(401);
    });

    it('DELETE /api/posts/:id - should return 401 if not authenticated', async () => {
        const [postToDeleteData] = await db.insert(posts).values({ title: 'Pre-delete', content: '...', userId: testUser1.id }).returning();
        const response = await app.request(`/api/posts/${postToDeleteData.id}`, {
            method: 'DELETE',
        });
        expect(response.status).toBe(401);
    });
  });

  describe('Authenticated Operations', () => {
    const postPayload = { title: 'New Test Post', content: 'Awesome content here', tagNames: ['new', 'testing'] };

    it('POST /api/posts - should create a post if authenticated', async () => {
      mockAuthModule.api.getSession.mockResolvedValue({ user: { id: testUser1.id } });

      const response = await app.request('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200); // Should be 201 for created, but worker returns 200 from c.json()
      const createdPost = await response.json();
      expect(createdPost.title).toBe(postPayload.title);
      expect(createdPost.content).toBe(postPayload.content);
      expect(createdPost.userId).toBe(testUser1.id);

      // Verify tags were created and associated
      const createdPostTags = await db.select().from(postTags).where(eq(postTags.postId, createdPost.id));
      expect(createdPostTags.length).toBe(2);
      const associatedTags = await db.select().from(tags).where(inArray(tags.id, createdPostTags.map(pt => pt.tagId)));
      expect(associatedTags.some(t => t.name === 'new')).toBe(true);
      expect(associatedTags.some(t => t.name === 'testing')).toBe(true);
    });

    it('PUT /api/posts/:id - should return 403 if authenticated user tries to update another user\'s post', async () => {
      mockAuthModule.api.getSession.mockResolvedValue({ user: { id: testUser2.id } }); // Authenticated as User 2
      const [postOwnedByTestUser1] = await db.insert(posts).values({ title: 'User1 Post', content: 'Content', userId: testUser1.id }).returning();

      const response = await app.request(`/api/posts/${postOwnedByTestUser1.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Attempted Update Title' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(403);
    });

    it('DELETE /api/posts/:id - should return 403 if authenticated user tries to delete another user\'s post', async () => {
      mockAuthModule.api.getSession.mockResolvedValue({ user: { id: testUser2.id } }); // Authenticated as User 2
      const [postOwnedByTestUser1] = await db.insert(posts).values({ title: 'User1 Post for Delete', content: 'Content', userId: testUser1.id }).returning();

      const response = await app.request(`/api/posts/${postOwnedByTestUser1.id}`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(403);
    });

    it('PUT /api/posts/:id - should update a post if authenticated owner', async () => {
      mockAuthModule.api.getSession.mockResolvedValue({ user: { id: testUser1.id } });
      const [originalPost] = await db.insert(posts).values({ title: 'Original Title', content: 'Original Content', userId: testUser1.id }).returning();
      const updatedPayload = { title: 'Updated Title by Owner', content: 'Updated content.', tagNames: ['updated'] };

      const response = await app.request(`/api/posts/${originalPost.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPayload),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(200);
      const updatedPost = await response.json();
      expect(updatedPost.title).toBe(updatedPayload.title);
      expect(updatedPost.content).toBe(updatedPayload.content);

      const dbPost = await db.select().from(posts).where(eq(posts.id, originalPost.id)).get();
      expect(dbPost?.title).toBe(updatedPayload.title);
    });

    it('DELETE /api/posts/:id - should delete a post if authenticated owner', async () => {
      mockAuthModule.api.getSession.mockResolvedValue({ user: { id: testUser1.id } });
      const [postToDelete] = await db.insert(posts).values({ title: 'To Delete', content: 'Content', userId: testUser1.id }).returning();

      const response = await app.request(`/api/posts/${postToDelete.id}`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(204);

      const dbPost = await db.select().from(posts).where(eq(posts.id, postToDelete.id)).get();
      expect(dbPost).toBeUndefined();
    });
  });

});
