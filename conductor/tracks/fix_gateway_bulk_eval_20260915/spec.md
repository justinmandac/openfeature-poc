# Specification: Fix Feature Gateway Bulk Evaluation Proxying and Test Suite

## 1. Overview
The Feature Gateway serves as an omni-channel edge reverse proxy and SSE distribution layer between client consumers (Web, Android, iOS, partner APIs) and the internal Core API (`/api`). Currently, the test suite in `feature-gateway` experiences a failure during `POST /ofrep/v1/evaluate/flags proxies bulk evaluation with ETag support`, where `feature.chatbot-gemini-ui` is missing from the bulk evaluation response.

## 2. Root Cause Analysis
- In `feature-gateway/src/app.js`, `POST /ofrep/v1/evaluate/flags` infers query parameter `appTag` based on `incomingContext.appId === 'webapp'`.
- The Core API evaluates and filters flags based on whether their `app_tags` array matches the supplied `appTag`. If tags or context mappings between Gateway and Core API disagree, expected flags are pruned from the bulk response.
- Context parameter forwarding and ETag roundtrip handling must be aligned with Core API expectations.

## 3. Requirements
- **FR-1: Accurate Bulk Evaluation Proxying**: Gateway must correctly forward context and parameters to upstream Core API so all expected flags for the evaluated context are returned.
- **FR-2: ETag 304 Caching**: Gateway must correctly handle `If-None-Match` and propagate 304 Not Modified responses with matching ETag headers.
- **FR-3: Regression Prevention**: Omni-channel routing (`channel`), business unit scoping (`bu`), and dangerous context property sanitization (`__internal_override`, `__bypass_auth`) must remain intact.
- **FR-4: Full Monorepo Green Suite**: All test suites across `api`, `webapp-bff`, and `feature-gateway` must pass without errors.

## 4. Acceptance Criteria
- `npm test --workspace=feature-gateway` passes with 0 errors.
- Monorepo `npm test` passes cleanly across all workspaces.
- Manual verification confirms Gateway returns 200 with ETag and expected flags for Singapore VIP context.
