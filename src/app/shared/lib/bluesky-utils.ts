/**
 * Utility functions for handling Bluesky URLs and API interactions
 */

interface BlueskyPostParams {
  did: string;
  rkey: string;
}

interface BlueskyUrlParts {
  handle: string;
  rkey: string;
}

/**
 * Parse a Bluesky URL to extract handle and rkey
 * Supports formats like: https://bsky.app/profile/handle.domain/post/rkey
 */
export function parseBlueskyUrl(url: string): BlueskyUrlParts | null {
  try {
    // Handle different URL formats
    const cleanUrl = url.replace(/[<>]/g, ''); // Remove angle brackets if present
    
    // Pattern for bsky.app URLs: https://bsky.app/profile/{handle}/post/{rkey}
    const bskyPattern = /bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?#]+)/;
    const match = cleanUrl.match(bskyPattern);
    
    if (match && match[1] && match[2]) {
      return {
        handle: match[1],
        rkey: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Bluesky URL:', error);
    return null;
  }
}

/**
 * Resolve a Bluesky handle to a DID using the AT Protocol
 */
export async function resolveHandleToDid(handle: string): Promise<string | null> {
  try {
    // Clean the handle (remove @ if present)
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    // Try multiple endpoints for handle resolution
    const endpoints = [
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${cleanHandle}`,
      `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${cleanHandle}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json() as { did?: string };
          if (data.did) {
            return data.did;
          }
        }
      } catch (err) {
        console.warn(`Failed to resolve handle via ${endpoint}:`, err);
        continue;
      }
    }
    
    console.error('Failed to resolve handle via all endpoints:', cleanHandle);
    return null;
  } catch (error) {
    console.error('Error resolving handle to DID:', error);
    return null;
  }
}

/**
 * Convert a Bluesky URL to the format needed by react-bluesky-embed
 * This function handles the conversion from bsky.app URLs to DID + rkey format
 */
export async function parseBlueskyUrlToParams(url: string): Promise<BlueskyPostParams | null> {
  try {
    const urlParts = parseBlueskyUrl(url);
    if (!urlParts) {
      return null;
    }
    
    const { handle, rkey } = urlParts;
    
    // Resolve handle to DID
    const did = await resolveHandleToDid(handle);
    if (!did) {
      console.error('Could not resolve handle to DID:', handle);
      return null;
    }
    
    return {
      did,
      rkey
    };
  } catch (error) {
    console.error('Error converting Bluesky URL to params:', error);
    return null;
  }
}

/**
 * Check if a URL is a valid Bluesky post URL
 */
export function isBlueskyUrl(url: string): boolean {
  const urlParts = parseBlueskyUrl(url);
  return urlParts !== null;
}

/**
 * Cache for handle-to-DID resolution to avoid repeated API calls
 */
const didCache = new Map<string, string>();

/**
 * Cached version of handle to DID resolution
 */
export async function resolveHandleToDidCached(handle: string): Promise<string | null> {
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  
  if (didCache.has(cleanHandle)) {
    return didCache.get(cleanHandle) || null;
  }
  
  const did = await resolveHandleToDid(cleanHandle);
  if (did) {
    didCache.set(cleanHandle, did);
  }
  
  return did;
}

/**
 * Convert a Bluesky URL to params with caching
 */
export async function parseBlueskyUrlToParamsCached(url: string): Promise<BlueskyPostParams | null> {
  try {
    const urlParts = parseBlueskyUrl(url);
    if (!urlParts) {
      return null;
    }
    
    const { handle, rkey } = urlParts;
    
    // Use cached resolution
    const did = await resolveHandleToDidCached(handle);
    if (!did) {
      console.error('Could not resolve handle to DID:', handle);
      return null;
    }
    
    return {
      did,
      rkey
    };
  } catch (error) {
    console.error('Error converting Bluesky URL to params:', error);
    return null;
  }
}