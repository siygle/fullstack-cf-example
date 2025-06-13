/**
 * Utility functions for generating and parsing post URLs
 */

import { BLOG_SETTINGS } from '../config/settings';
import type { Post } from '../db/schema/blog-schema';

/**
 * Generate a URL slug from a title
 */
export function generateSlug(title: string): string {
  const { slug: slugConfig } = BLOG_SETTINGS.urlFormat;
  
  let slug = title
    .trim()
    // Keep Unicode characters (including Chinese), letters, numbers, and spaces
    // Replace punctuation and special symbols with separators
    .replace(/[^\p{L}\p{N}\s]/gu, slugConfig.separator)
    // Replace multiple spaces and separators with single separator
    .replace(/[\s\-_]+/g, slugConfig.separator)
    // Remove leading/trailing separators
    .replace(new RegExp(`^${slugConfig.separator}+|${slugConfig.separator}+$`, 'g'), '');
  
  // Convert to lowercase only if the slug config specifies it
  if (slugConfig.lowercase) {
    slug = slug.toLowerCase();
  }
  
  // Truncate to max length (be careful with Unicode characters)
  if (slug.length > slugConfig.maxLength) {
    slug = slug.substring(0, slugConfig.maxLength);
    // Don't cut off in the middle of a word
    const lastSeparator = slug.lastIndexOf(slugConfig.separator);
    if (lastSeparator > slugConfig.maxLength * 0.8) {
      slug = slug.substring(0, lastSeparator);
    }
  }
  
  return slug;
}

/**
 * Format a date according to the URL format settings
 */
export function formatDateForUrl(date: Date): { year: string; month: string; day: string } {
  const { dateFormat } = BLOG_SETTINGS.urlFormat;
  
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    day: date.getDate().toString().padStart(2, '0')
  };
}

/**
 * Generate a post URL based on the configured pattern
 */
export function generatePostUrl(post: Post): string {
  const { pattern } = BLOG_SETTINGS.urlFormat;
  const { slug: slugConfig } = BLOG_SETTINGS.urlFormat;
  
  // Use publishedDate if available, otherwise use createdAt
  const date = post.publishedDate || post.createdAt;
  const { year, month, day } = formatDateForUrl(date);
  
  // Use post slug if available, otherwise generate from title
  let slug = post.slug;
  if (!slug) {
    slug = generateSlug(post.title);
    // If slug is still empty and fallback is enabled, use post ID
    if (!slug && slugConfig.includeIdFallback) {
      slug = post.id;
    }
  }
  
  // Replace variables in the pattern
  return pattern
    .replace('{year}', year)
    .replace('{month}', month)
    .replace('{day}', day)
    .replace('{slug}', slug);
}

/**
 * Parse a URL to extract post identifiers
 * Returns an object with the extracted values or null if no match
 */
export function parsePostUrl(url: string): { 
  year?: string; 
  month?: string; 
  day?: string; 
  slug?: string;
  pattern: string;
} | null {
  const { pattern } = BLOG_SETTINGS.urlFormat;
  
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\{year\}/g, '(?<year>\\d{4})')
    .replace(/\{month\}/g, '(?<month>\\d{2})')
    .replace(/\{day\}/g, '(?<day>\\d{2})')
    .replace(/\{slug\}/g, '(?<slug>[^/]+)')
    .replace(/\//g, '\\/');
  
  const regex = new RegExp(`^${regexPattern}$`);
  const match = url.match(regex);
  
  if (!match || !match.groups) {
    return null;
  }
  
  return {
    year: match.groups.year,
    month: match.groups.month,
    day: match.groups.day,
    slug: match.groups.slug,
    pattern
  };
}

/**
 * Check if a URL matches the configured post URL pattern
 */
export function isPostUrl(url: string): boolean {
  return parsePostUrl(url) !== null;
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate a slug according to the configuration
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const { slug: slugConfig } = BLOG_SETTINGS.urlFormat;
  
  if (!slug) {
    return { valid: false, error: 'Slug cannot be empty' };
  }
  
  if (slug.length > slugConfig.maxLength) {
    return { valid: false, error: `Slug cannot be longer than ${slugConfig.maxLength} characters` };
  }
  
  // Check for valid characters (Unicode letters, numbers, separators)
  // This pattern allows Unicode letters (\p{L}), Unicode numbers (\p{N}), and the configured separator
  const validPattern = new RegExp(`^[\\p{L}\\p{N}${slugConfig.separator}]+$`, 'u');
  if (!validPattern.test(slug)) {
    return { valid: false, error: `Slug can only contain letters, numbers, and "${slugConfig.separator}"` };
  }
  
  // Check for leading/trailing separators
  if (slug.startsWith(slugConfig.separator) || slug.endsWith(slugConfig.separator)) {
    return { valid: false, error: `Slug cannot start or end with "${slugConfig.separator}"` };
  }
  
  // Check for consecutive separators
  const consecutivePattern = new RegExp(`${slugConfig.separator}{2,}`);
  if (consecutivePattern.test(slug)) {
    return { valid: false, error: `Slug cannot contain consecutive "${slugConfig.separator}" characters` };
  }
  
  return { valid: true };
}

/**
 * Get the current URL pattern as a human-readable example
 */
export function getUrlPatternExample(): string {
  const { pattern } = BLOG_SETTINGS.urlFormat;
  const exampleDate = new Date('2025-06-05');
  const { year, month, day } = formatDateForUrl(exampleDate);
  
  return pattern
    .replace('{year}', year)
    .replace('{month}', month)
    .replace('{day}', day)
    .replace('{slug}', 'my-post-title');
}