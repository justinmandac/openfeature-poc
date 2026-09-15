# Implementation Plan: Fix Feature Gateway Bulk Evaluation Proxying and Test Suite

## Phase 1: Diagnose and Reproduce Bulk Evaluation Behavior

- [ ] Task: Isolate and Reproduce Failure in Gateway Tests
    - [ ] Write targeted integration test reproducing the exact bulk evaluation payload and inspecting upstream communication
    - [ ] Confirm red test output indicating missing flag resolution in bulk evaluation response
- [ ] Task: Conductor - User Manual Verification 'Diagnose and Reproduce Bulk Evaluation Behavior' (Protocol in workflow.md)

## Phase 2: Fix Gateway Forwarding and ETag Caching

- [ ] Task: Resolve Gateway Parameter and Context Forwarding
    - [ ] Write unit and integration tests for query parameter resolution (`appTag`, `appId`, `channel`, `bu`)
    - [ ] Fix `feature-gateway/src/app.js` bulk OFREP proxy handler to ensure accurate flag evaluation
- [ ] Task: Ensure Consistent ETag Header and 304 Response Propagation
    - [ ] Write tests verifying 304 Not Modified responses on valid ETag match
    - [ ] Ensure ETag headers are cleanly mirrored between Core API and client
- [ ] Task: Conductor - User Manual Verification 'Fix Gateway Forwarding and ETag Caching' (Protocol in workflow.md)

## Phase 3: Monorepo Verification and Regression Testing

- [ ] Task: Execute Comprehensive Test Suites Across Workspaces
    - [ ] Verify test suite execution in `feature-gateway` passes with 100% green status
    - [ ] Verify monorepo-wide `npm test` across `api`, `webapp-bff`, and `feature-gateway` succeeds
- [ ] Task: Conductor - User Manual Verification 'Monorepo Verification and Regression Testing' (Protocol in workflow.md)
