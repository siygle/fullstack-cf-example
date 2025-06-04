import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"

// Check if we're in a browser environment
const isBrowser = typeof document !== 'undefined'

export const setupAuthClient = (baseUrl: string) => {
  // Only create the client in browser environment
  if (!isBrowser) {
    // Return a dummy client for SSR
    return {
      signOut: () => {},
    } as ReturnType<typeof createAuthClient>
  }

  return createAuthClient({
    plugins: [emailOTPClient()],

    // The base URL of the server (optional if you're using the same domain)
    baseURL: baseUrl,
    basePath: "/api/auth",
  })
}
