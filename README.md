# OpenFeature Enterprise Proof-of-Concept

An enterprise runtime configuration and feature flag management proof-of-concept built strictly to OpenFeature CNCF specifications, featuring OFREP evaluation, SSE live sync, JSON Schema validation, revision audit logs, and cross-tier frontend/backend evaluations.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                1. Core API (Port 4000)                            |
|  - OFREP Spec: POST /ofrep/v1/evaluate/flags/{key} & POST /ofrep/v1/evaluate/flags|
|  - SSE Stream: GET /api/v1/events/flags (PROVIDER_CONFIGURATION_CHANGED)          |
|  - Admin API: GET/POST/PUT/DELETE /api/v1/admin/flags                             |
|  - DB Layer: Knex.js (SQLite default, PostgreSQL swappable)                       |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-----------------------------------+             +-----------------------------------+
|    2. Admin Web App (Port 4001)   |             |       3. WebApp BFF (Port 4002)   |
|  - Express + EJS Base Layout      |             |  - NodeJS Express Backend         |
|  - React Interactive Dashboard    |             |  - @openfeature/server-sdk        |
|  - Schema Validation & Diff Viewer|             |  - Custom OfrepServerProvider     |
|  - Last-5 Revision Audit History  |             |  - Context-Aware Chatbot API      |
+-----------------------------------+             +-----------------+-----------------+
                                                                    |
                                                                    v
                                                  +-----------------------------------+
                                                  |       4. Demo WebApp (Port 3000)  |
                                                  |  - React + Vite + Tailwind        |
                                                  |  - @openfeature/react-sdk         |
                                                  |  - Custom OfrepWebProvider        |
                                                  |  - Dynamic Generative UI Cards    |
                                                  |  - Live Context Switcher Toolbar  |
                                                  +-----------------------------------+
```

---

## Services & Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Core API** | `4000` | OFREP remote evaluation endpoints, SSE change stream, and Admin CRUD |
| **Admin Web App** | `4001` | Flag inventory, live switches, JSON schema editor, targeting rule builder, revision history |
| **WebApp BFF** | `4002` | Financial chatbot backend evaluating OpenFeature flags per request context |
| **Demo WebApp** | `3000` | Financial banking portal demonstrating dynamic Generative UI, banners, and context toggles |

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All 4 Services Concurrently
```bash
npm run dev
```

### 3. Open in Browser
- **Demo WebApp**: [http://localhost:3000](http://localhost:3000)
- **Admin Control Center**: [http://localhost:4001](http://localhost:4001)
- **Core API Health / OpenAPI**: [http://localhost:4000/health](http://localhost:4000/health)

---

## Running Automated Tests

```bash
npm test
```
Runs both the Core API integration suite (13 tests) and WebApp BFF OpenFeature suite (3 tests).

---

## Key Enterprise Demonstrations

1. **Targeting Rule Hierarchy**:
   - In the WebApp context switcher, switch from **Sophia Chen (Singapore Premier)** to **James Miller (US Standard)**.
   - Observe how the banner switches dynamically from the Singapore yield promotion to the US system maintenance notice.
   - In the chatbot, observe how Generative UI cards and wealth insights are selectively enabled/disabled according to regional compliance and user tier rules.

2. **Real-time SSE Live Synchronization**:
   - Open [http://localhost:3000](http://localhost:3000) and [http://localhost:4001](http://localhost:4001) side by side.
   - Toggle `feature.chatbot-gemini-ui` in the Admin App.
   - Watch the WebApp immediately adapt without requiring a page refresh via the `PROVIDER_CONFIGURATION_CHANGED` event stream.

3. **Schema Validation & History Audit**:
   - In the Admin App, create an `OBJECT` configuration or edit `config.chatbot-limits`.
   - The JSON Schema validator ensures malformed payloads cannot be persisted.
   - Click the History button on any flag to inspect the visual diff and last 5 recorded revisions.
