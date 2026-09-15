# Technology Stack: OpenFeature Enterprise Platform

## 1. Monorepo Structure & Workspace Management
- **Monorepo Manager**: npm workspaces (`npm` v9+) orchestrating multi-package dependency resolution and cross-tier scripts.
- **Service Workspaces**:
  - `api`: Core feature flag service, OFREP endpoints, and admin management.
  - `admin-webapp`: Administration dashboard, JSON schema editor, and revision audit viewer.
  - `webapp-bff`: Backend-for-Frontend evaluating server-side flags and serving context-aware chatbot logic.
  - `webapp`: Client-facing financial banking demo app built with React, Vite, and OpenFeature React SDK.
  - `feature-gateway`: Reverse proxy and SSE distributor for edge evaluations.
  - `android-app`: Native Kotlin Android mobile application.

## 2. Core Service Technologies

### Core API (`api/`, Port 4000)
- **Runtime & Framework**: Node.js (v18+ / v20+), Express.js.
- **Database & Persistence**: Knex.js SQL query builder providing an abstraction layer with SQLite (`better-sqlite3`) for default local development and zero-code migration support for PostgreSQL (`pg`).
- **Protocols & Standards**: OpenFeature Remote Evaluation Protocol (OFREP), Server-Sent Events (SSE) via `/api/v1/events/flags`, Model Context Protocol (`@modelcontextprotocol/sdk`).
- **Validation**: Ajv (JSON Schema Draft 7 / 2020-12) for object payload validation; Zod for request input schemas.

### Admin Web App (`admin-webapp/`, Port 4001)
- **Backend & Templating**: Express.js with EJS layout templating.
- **Frontend SPA**: React 18, Vite bundler, Tailwind CSS for styling, Lucide React for iconography.
- **Capabilities**: Interactive flag inventory, live switches, JSON Schema rule builder, visual diffs, and 5-stage lifecycle state management.

### WebApp BFF (`webapp-bff/`, Port 4002)
- **Runtime & Framework**: Node.js, Express.js.
- **OpenFeature SDK**: `@openfeature/server-sdk` configured with a custom `OfrepServerProvider` supporting live SSE reconfiguration.
- **Domain Services**: Multi-region context resolution, financial mock services, generative UI card metadata.

### Demo WebApp (`webapp/`, Port 3000)
- **Framework & Bundler**: React 18 with Vite.
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer.
- **OpenFeature SDK**: `@openfeature/react-sdk` and `@openfeature/web-sdk` with custom `OfrepWebProvider`.
- **UI Components**: Interactive evaluation dock, persona context switcher, dynamic banner layouts, and generative UI chatbot widgets.

### Feature Gateway (`feature-gateway/`, Port 4003)
- **Runtime & Framework**: Node.js, Express.js.
- **Role**: Edge OFREP reverse proxy, route caching, and SSE event broadcast to distributed clients.

### Mobile Client (`android-app/`)
- **Language & Tooling**: Kotlin, Gradle Kotlin DSL (`build.gradle.kts`), Android SDK (API 34/36).

## 3. Testing, Quality & Tooling
- **Unit & Integration Testing**: Jest, Supertest (covering Core API, WebApp BFF, and Gateway).
- **Process Management**: Concurrently, Nodemon.
- **Version Control**: Git with Conventional Commits specification.
