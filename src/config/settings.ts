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
  
  // URL format configuration for posts
  urlFormat: {
    // URL pattern for posts - variables: {year}, {month}, {day}, {slug}
    // Examples:
    // "/post/{slug}" -> "/post/my-post-title"
    // "/{year}/{month}/{day}/{slug}" -> "/2025/06/05/my-post-title"
    // "/blog/{year}/{slug}" -> "/blog/2025/my-post-title"
    pattern: "/{year}/{month}/{day}/{slug}",
    
    // Date format for URL generation
    dateFormat: {
      year: "YYYY",     // 4-digit year
      month: "MM",      // 2-digit month with leading zero
      day: "DD"         // 2-digit day with leading zero
    },
    
    // Slug generation settings
    slug: {
      // Maximum length for slugs
      maxLength: 60,
      
      // Whether to include the post ID as fallback if slug is empty
      includeIdFallback: true,
      
      // Separator for words in slug
      separator: "-",
      
      // Whether to convert to lowercase (disable for international characters)
      lowercase: false
    }
  }
} as const

// Type for blog settings
export type BlogSettings = typeof BLOG_SETTINGS

// Helper function to update settings
export function updateSettings(newSettings: Partial<BlogSettings>) {
  Object.assign(BLOG_SETTINGS, newSettings)
} 