// Blog settings configuration
export const BLOG_SETTINGS = {
  // Blog title displayed on the homepage
  blogTitle: "Redwood Cloudflare Blog",
  
  // Number of posts to display per page
  paginationCount: 7,
  
  // Maximum number of posts per page allowed
  maxPaginationCount: 50,
  
  // Minimum number of posts per page allowed
  minPaginationCount: 1,
} as const

// Type for blog settings
export type BlogSettings = typeof BLOG_SETTINGS

// Helper function to update settings
export function updateSettings(newSettings: Partial<BlogSettings>) {
  Object.assign(BLOG_SETTINGS, newSettings)
} 