"use client"

import { Button } from "@/app/shared/components/ui/button"
import { Input } from "@/app/shared/components/ui/input"
import { Label } from "@/app/shared/components/ui/label"
import { useState } from "react"

interface TagWithCount {
  id: string
  name: string
  postCount: number
}

interface TagManagementClientProps {
  tagsWithCounts: TagWithCount[]
}

export function TagManagementClient({ tagsWithCounts }: TagManagementClientProps) {
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [deletingTag, setDeletingTag] = useState<string | null>(null)

  const handleEditClick = (tagId: string) => {
    setEditingTag(tagId)
    setDeletingTag(null)
  }

  const handleDeleteClick = (tagId: string) => {
    setDeletingTag(tagId)
    setEditingTag(null)
  }

  const handleCancel = () => {
    setEditingTag(null)
    setDeletingTag(null)
  }

  return (
    <>
      <div className="space-y-4">
        {tagsWithCounts.map((tagItem) => (
          <div key={tagItem.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-medium">#{tagItem.name}</span>
                <p className="text-sm text-gray-600">
                  {tagItem.postCount} {tagItem.postCount === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={`/tags/${encodeURIComponent(tagItem.name)}`}>View Posts</a>
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleEditClick(tagItem.id)}
              >
                Edit
              </Button>

              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDeleteClick(tagItem.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <form method="POST" className="space-y-4">
              <input type="hidden" name="action" value="edit" />
              <input type="hidden" name="tagId" value={editingTag} />
              
              <h3 className="text-lg font-medium mb-4">Edit Tag</h3>
              
              <div>
                <Label htmlFor="edit-tag-name">Tag Name</Label>
                <Input
                  id="edit-tag-name"
                  name="name"
                  defaultValue={tagsWithCounts.find(t => t.id === editingTag)?.name || ''}
                  required
                  placeholder="Enter tag name..."
                  pattern="[a-zA-Z0-9\s\-_]+"
                  title="Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Letters, numbers, spaces, hyphens, and underscores only
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" size="sm">Save Changes</Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <form method="POST" className="space-y-4">
              <input type="hidden" name="action" value="delete" />
              <input type="hidden" name="tagId" value={deletingTag} />
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-2">
                    Delete Tag "#{tagsWithCounts.find(t => t.id === deletingTag)?.name}"
                  </h3>
                  <div className="text-sm text-red-800 space-y-2">
                    <p>This action cannot be undone. The tag will be:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Removed from all {tagsWithCounts.find(t => t.id === deletingTag)?.postCount} {tagsWithCounts.find(t => t.id === deletingTag)?.postCount === 1 ? 'post' : 'posts'}</li>
                      <li>Permanently deleted from the system</li>
                      {(tagsWithCounts.find(t => t.id === deletingTag)?.postCount ?? 0) > 0 && (
                        <li>Posts will remain unchanged except for this tag removal</li>
                      )}
                    </ul>
                    {(tagsWithCounts.find(t => t.id === deletingTag)?.postCount ?? 0) === 0 && (
                      <p className="text-green-700 bg-green-50 p-2 rounded text-xs">
                        ✓ This tag is not currently used by any posts, so deletion is safe.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" size="sm" variant="destructive">
                  Yes, Delete Tag
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}