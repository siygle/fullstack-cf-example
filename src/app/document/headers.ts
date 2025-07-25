import { RouteMiddleware } from "rwsdk/router"
import { IS_DEV } from "rwsdk/constants"

export const setCommonHeaders =
  (): RouteMiddleware =>
  ({ headers, rw: { nonce } }) => {
    if (!IS_DEV) {
      // Forces browsers to always use HTTPS for a specified time period (2 years)
      headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
      )
    }

    // Forces browser to use the declared content-type instead of trying to guess/sniff it
    headers.set("X-Content-Type-Options", "nosniff")

    // Stops browsers from sending the referring webpage URL in HTTP headers
    headers.set("Referrer-Policy", "no-referrer")

    // Explicitly disables access to specific browser features/APIs
    headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    )

    // Defines trusted sources for content loading and script execution:
    headers.set(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://embed.bsky.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://embed.bsky.app https://public.api.bsky.app https://bsky.social; frame-src https://challenges.cloudflare.com https://www.youtube.com https://platform.twitter.com https://twitter.com https://x.com https://embed.bsky.app; object-src 'none';`,
    )
  }
