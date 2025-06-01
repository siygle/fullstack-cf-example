# Architecture

This document outlines the architecture of the project, including the main frameworks, libraries, and project structure.

## Frameworks and Libraries

The project utilizes the following key technologies:

- **RedwoodJS:** A full-stack JavaScript framework that provides a robust structure for building modern web applications.
- **React:** A JavaScript library for building user interfaces, used for the frontend components.
- **Vite:** A fast build tool and development server that significantly improves the development experience.
- **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
- **Drizzle ORM:** A TypeScript ORM for building SQL queries with type safety.
- **Cloudflare Workers:** A serverless execution environment for running backend logic at the edge.
- **better-auth:** A library for handling authentication and authorization.

## Project Structure

The project is organized into several key directories:

- **`src/app`**: This directory contains the frontend application code, including React components, pages, and layouts.
- **`src/db`**: This directory houses the database schema, migrations, and Drizzle ORM configuration.
- **`src/lib`**: This directory contains shared libraries and utility functions used across both the frontend and backend.

## Frontend Architecture

The frontend is built using React and organized following common practices within the RedwoodJS framework.

### Component Organization

- **Pages:** Application pages are located in `src/app/pages`. Each file in this directory typically corresponds to a specific route in the application. For example, `src/app/pages/HomePage.tsx` would render the home page.
- **Shared Components:** Reusable UI components that are not specific to a single page are located in `src/app/shared/components`. This promotes modularity and code reuse. Examples could include buttons, modals, or form elements.
- **Layouts:** RedwoodJS often uses Layout components (potentially in `src/app/layouts` or a similar convention) to wrap pages and provide consistent structure, like headers, footers, and navigation sidebars.

### Routing

RedwoodJS handles routing conventionally through its file-based routing system. Pages created in the `src/app/pages` directory are automatically mapped to routes. For example, a component `src/app/pages/AboutPage.tsx` would be accessible at the `/about` URL. Dynamic routing and parameters are also supported through specific naming conventions for files and directories within `src/app/pages`.

### Styling

Styling is primarily managed using **Tailwind CSS**. This utility-first CSS framework allows for rapid UI development by composing utility classes directly in the HTML/JSX markup. Global styles and Tailwind CSS configuration are typically found in a file like `src/index.css` or a dedicated Tailwind configuration file (`tailwind.config.js`). Custom CSS can still be written for more complex components or global overrides when necessary.

## Backend Architecture

The backend is built as a serverless application running on Cloudflare Workers, leveraging Drizzle ORM for database interactions and `better-auth` for authentication.

### Cloudflare Workers

- **Entry Point:** The main entry point for the backend is `src/worker.tsx`. This file uses `defineApp` from the RedwoodJS worker development kit (`rwsdk/worker`) to initialize the application and define routes.
- **Request Handling:** The worker handles incoming HTTP requests, routing them to appropriate handlers for API endpoints (e.g., `/api/auth/*`) or rendering frontend pages. It also manages context for requests, such as user authentication status.

### Database and ORM

- **Database Schema:** The database schema is defined using Drizzle ORM. Key schema definitions related to authentication (like users, sessions, accounts, and verification tokens) are located in `src/db/schema/auth-schema.ts`. Other schema definitions would reside in `src/db/schema/index.ts` or similar files.
- **Drizzle ORM:** The project uses Drizzle ORM for type-safe SQL query building and database interactions. The Drizzle client is configured in `src/db/db.ts` and is used by `better-auth` via the `drizzleAdapter` for database operations related to authentication. Migrations for managing database schema changes are located in `src/db/migrations/`.

### Authentication

- **`better-auth` Library:** Authentication is handled by the `better-auth` library, configured in `src/lib/auth.ts`.
- **Email OTP Plugin:** The primary authentication method implemented is Email OTP (One-Time Password). The `emailOTP` plugin from `better-auth` is configured to handle the generation and verification of OTPs. The current implementation includes a placeholder for sending the OTP email to the user.
- **Session Management:** `better-auth` manages user sessions, and its API (e.g., `auth.api.getSession`, `auth.handler`) is integrated into the Cloudflare Worker (`src/worker.tsx`) to protect routes and handle authentication requests.
- **Adapter:** The `drizzleAdapter` is used to connect `better-auth` to the project's database, allowing it to store and retrieve user and session information.
- **Secondary Storage:** The configuration in `src/lib/auth.ts` also mentions `secondaryStorage` (from `src/db/secondaryStorage.ts`), which might be used by `better-auth` for caching or other purposes.

## Blogging System

The application includes a full-featured blogging system with capabilities for post creation, management, and public viewing.

### Key Components:

1.  **Database Schema (`src/db/schema/blog-schema.ts`):**
    *   **`posts` Table:** Stores the main content of blog posts, including title, content (Markdown), author (`userId`), creation, and update timestamps.
    *   **`tags` Table:** A simple table to store unique tag names.
    *   **`postTags` Table:** A join table linking posts to tags, enabling many-to-many relationships between posts and tags.
    *   Relationships between these tables and the `users` table (from `auth-schema.ts`) are defined to link posts to authors and manage tag associations.

2.  **API Endpoints (`src/worker.tsx`):**
    *   A set of RESTful API endpoints are implemented to manage blog posts and tags. These are defined within the Hono application in `src/worker.tsx`.
    *   **`/api/posts`:**
        *   `GET`: Lists all blog posts with author details and associated tags. Publicly accessible.
        *   `POST`: Creates a new blog post. Requires authentication. Associates the post with the logged-in user.
    *   **`/api/posts/:id`:**
        *   `GET`: Retrieves a single blog post by its ID, including author and tags. Publicly accessible.
        *   `PUT`: Updates an existing blog post. Requires authentication and ownership (user must be the author of the post).
        *   `DELETE`: Deletes a blog post. Requires authentication and ownership.
    *   **`/api/tags`:**
        *   `GET`: Lists all available tags. Publicly accessible.

3.  **Frontend Components - Blog Management (Dashboard):**
    *   Located under `src/app/pages/dashboard/blog/`.
    *   **`PostsPage.tsx`**: Provides a table view of created posts with options to edit or delete them. Includes a link to create new posts.
    *   **`PostEditorPage.tsx`**: A form for creating and editing blog posts.
        *   Uses `react-simplemde-editor` for a rich Markdown editing experience for the post content.
        *   Allows input for title and comma-separated tags.
    *   These components interact with the secure blog API endpoints.

4.  **Frontend Components - Public View:**
    *   Located under `src/app/pages/blog/`.
    *   **`BlogIndexPage.tsx`**: Displays a list of all blog posts with snippets, author information, publication dates, and tags. Includes basic pagination.
    *   **`PostPage.tsx`**: Displays a single blog post's full content.
        *   Renders Markdown content to HTML using the `react-markdown` library.
    *   These components consume the public blog API endpoints.

5.  **Authentication and Authorization:**
    *   Blog management functionalities (creating, editing, deleting posts) are protected.
    *   The API endpoints (`POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`) require a valid user session, managed by `better-auth`. An unauthenticated request results in a 401 Unauthorized error.
    *   Posts have an ownership model: only the author of a post can edit or delete it. Attempts to modify another user's post will result in a 403 Forbidden error.
    *   The dashboard pages (`PostsPage.tsx`, `PostEditorPage.tsx`) are also protected by the `isAuthenticated` middleware in `src/worker.tsx`, redirecting unauthenticated users to the login page.

## Build and Deployment Process

The project uses Vite for building, and is deployed on Cloudflare Workers. Infrastructure management is aided by a tool referred to as "alchemy."

### Build Process

- **Vite:** The frontend and backend assets are compiled using Vite. The Vite configuration is located in `vite.config.mts`, which includes plugins for RedwoodJS (`rwsdk/vite`) and Tailwind CSS (`@tailwindcss/vite`).
- **Build Command:** The project is built using the `bun run build` command (which executes `vite build`), as specified in `package.json`. This command processes the source code, optimizes assets, and prepares the application for deployment, outputting client assets to the `dist/client` directory.

### Deployment

- **Cloudflare Workers:** The application is deployed to Cloudflare Workers. The `wrangler.jsonc` file configures the deployment, specifying:
    - The main worker script: `src/worker.tsx`.
    - The static assets directory: `dist/client` (bound to `ASSETS`).
    - Required Cloudflare services like:
        - **KV Namespaces:** `SESSIONS_KV` is configured for storing session data or similar key-value information.
        - **D1 Databases:** A D1 database (bound to `DB`) is used as the primary relational database, with migrations managed from `src/db/migrations/`.
- **Wrangler CLI:** Deployment to Cloudflare is typically handled using the Wrangler CLI, which uses the `wrangler.jsonc` configuration.

### Infrastructure Management

- **Alchemy:** The project uses a tool or script collection referred to as "alchemy" for managing Cloudflare infrastructure components. This is evident from the `alchemy.run.ts` script and the `infra:up` and `infra:destroy` scripts in `package.json`.
- **`infra:up`:** This script (running `bun alchemy.run.ts`) is likely responsible for provisioning or updating Cloudflare resources like D1 databases and KV namespaces. The `wrangler.jsonc` file notes that running `bun infra:up` will update and overwrite it, suggesting that "alchemy" dynamically generates or updates this configuration.
- **`infra:destroy`:** This script is likely used to tear down or remove the provisioned Cloudflare infrastructure.
- **Database Migrations:**
    - New database migrations are generated using Drizzle Kit via `bun migrate:new --name=<migration_name>`.
    - Migrations are applied to the local development D1 database using `bun migrate:dev` (which runs `wrangler d1 migrations apply DB --local`). For production, migrations are typically applied as part of the deployment process managed by Wrangler or the "alchemy" scripts.

The specifics of "alchemy" and its `alchemy.run.ts` script would require further inspection of that script or external documentation if available, but its role is to automate infrastructure setup and updates on Cloudflare.
