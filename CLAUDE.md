# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun dev` - Start local development server with hot reload
- `bun build` - Build production bundle
- `bun preview` - Preview production build locally
- `bun types` - Run TypeScript type checking
- `bun dev:init` - Initialize development environment (RW scripts)

### Database Management
- `bun migrate:new --name="migration_name"` - Generate new migration
- `bun migrate:dev` - Apply migrations to local D1 database
- `bun generate` - Generate initial migration (alias for migrate:new --name=init)

### Infrastructure
- `bun infra:up` - Deploy all resources to Cloudflare (app, database, KV storage)
- `bun infra:destroy` - Tear down all Cloudflare resources

### Code Quality
- `bun format` - Format code with Prettier
- `bun clean` - Clean Vite cache

## Architecture Overview

This is a fullstack blog application built on Cloudflare infrastructure using:

### Core Stack
- **RedwoodSDK**: React 19 framework with SSR/RSC/Server Functions on Cloudflare Workers
- **Drizzle ORM**: Type-safe SQL ORM with D1 (SQLite) database
- **Better-auth**: Authentication with OTP support, sessions stored in KV
- **Alchemy**: Infrastructure-as-Code for Cloudflare resources
- **Vite**: Build tool with TypeScript support

### Key Architecture Patterns

**Server-Side Routing**: Routes defined in `src/worker.tsx` using RedwoodSDK's routing system:
- Authentication middleware applies to all routes via `auth.api.getSession()`
- Protected admin routes use `isAuthenticated` guard
- API routes handle auth (`/api/auth/*`) and oEmbed proxy (`/api/bluesky-oembed`)

**Client Hydration**: `src/client.tsx` handles client-side markdown rendering:
- Uses React roots to hydrate server-rendered content shells
- Supports multiple content formats (markdown, HTML, plain text)
- Implements progressive enhancement for post content

**Database Schema**: Located in `src/db/schema/`:
- `auth-schema.ts` - User authentication tables (Better-auth integration)
- `blog-schema.ts` - Blog posts, settings, and content management
- Migrations in `src/db/migrations/` with Drizzle snapshots

**Component Architecture**:
- Page components in `src/app/pages/` (Home, Post, admin pages)
- Shared UI components in `src/app/shared/components/ui/` (Shadcn-based)
- Admin components in `src/app/pages/admin/components/`
- Markdown editing with MDXEditor integration

### Important Implementation Details

**Authentication Flow**: 
- Session management via Better-auth with KV storage
- Context provides `user` and `authUrl` to all routes
- Admin routes redirect to `/user/login` if unauthenticated

**Content Rendering**:
- Server renders content shells with encoded data attributes
- Client-side React hydrates these shells with formatted content using `createRoot()`
- Progressive enhancement with fallback mechanisms for unprocessed content
- Supports embeds (Bluesky, Twitter, YouTube) via dedicated components
- Custom oEmbed proxy at `/api/bluesky-oembed` for Bluesky post embedding

**Infrastructure Management**:
- All Cloudflare resources defined in `alchemy.run.ts` 
- Automatic type generation for environment variables in `types/env.d.ts`
- Local development uses Wrangler for D1 database simulation
- Running `bun infra:up` updates and overwrites `wrangler.jsonc` with actual resource IDs

### Development Workflow

1. Schema changes require new migration: `bun migrate:new --name="description"`
2. Apply locally: `bun migrate:dev`
3. Type checking: `bun types`
4. Deploy: `bun infra:up` (handles both infrastructure and application)

### Testing and Quality

Always run `bun types` before deployment to catch TypeScript errors. The project uses Prettier for code formatting with specific JSON/JSONC trailing comma configuration. Note: This project does not include automated tests - manual testing is required.

### URL Routing Patterns

The application supports flexible URL patterns for blog posts:
- `/post/:id` - Access posts by database ID
- `/:path*` - Dynamic catch-all route for custom post URLs (using `slug` field)
- Custom URLs are resolved through the `PostByUrl` component, which acts as the final catch-all route

### Post Management

Posts support multiple formats and statuses:
- **Formats**: `markdown`, `html`, `plain` (stored in `format` field)
- **Statuses**: `published`, `draft`, `private` (stored in `status` field)
- **URL Slugs**: Optional custom slugs for SEO-friendly URLs
- **Publication Dates**: Separate from creation dates for scheduling

### Environment Setup

Create `.env` file (see `env.example` for reference) before running locally. The project uses Bun as the JavaScript runtime and package manager.