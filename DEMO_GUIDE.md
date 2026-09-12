# OpenFeature Enterprise POC — Interactive Demo Guide

This guide provides a comprehensive, step-by-step script for demonstrating the OpenFeature Proof-of-Concept to stakeholders, technical leads, and product managers.

---

## 1. System Preparation & Startup

### 1.1 Prerequisites
- **Node.js**: `v20.x` or higher (tested on `v24.x`)
- **npm**: `v10.x` or higher

### 1.2 Start All Services
From the repository root, start all 4 services concurrently with one command:
```bash
npm run dev
```

This starts:
| Service | URL | Role |
| :--- | :--- | :--- |
| **Demo WebApp** | [http://localhost:3000](http://localhost:3000) | Retail Banking Portal demonstrating client-side flag evaluation & dynamic Generative UI |
| **Admin Control Center** | [http://localhost:4001](http://localhost:4001) | Flag Inventory, Segments, Scheduled Releases, Hygiene, and Analytics |
| **WebApp BFF** | [http://localhost:4002](http://localhost:4002) | Backend-for-Frontend with OpenFeature Server SDK & transaction context |
| **Core API** | [http://localhost:4000](http://localhost:4000) | OFREP evaluation engine, SSE change stream, and SQLite/PostgreSQL store |

> [!TIP]
> **Recommended Screen Setup**:
> Open two browser windows side by side:
> - **Left Window**: [http://localhost:3000](http://localhost:3000) (Demo WebApp)
> - **Right Window**: [http://localhost:4001](http://localhost:4001) (Admin Control Center)

---

## 2. Interactive Demo Scenarios

---

### Scenario 1: Real-Time Live Sync via Server-Sent Events (SSE)
**Goal**: Prove that runtime feature flag updates propagate to consumer applications instantly without requiring a page refresh or server restart.

1. In the **Left Window (WebApp)**, observe the header banner and the chatbot status:
   - Notice the badge: `Generative UI: ON`.
   - Ask the chatbot: *"Show my portfolio breakdown"*.
   - Notice that the chatbot returns rich interactive Generative UI cards (asset allocation chart).
2. In the **Right Window (Admin Control Center)**:
   - Find `feature.chatbot-gemini-ui` in the Flag Inventory table.
   - Click the green **ENABLED** toggle switch to turn it **DISABLED**.
3. In the **Left Window (WebApp)**:
   - **Do not refresh the page.**
   - Notice the badge changes instantly to `Generative UI: OFF` via the SSE `PROVIDER_CONFIGURATION_CHANGED` event.
   - Ask the chatbot again: *"Show my portfolio breakdown"*.
   - Notice the chatbot now falls back safely to plain text output without rendering Generative UI widgets.
4. Toggle `feature.chatbot-gemini-ui` back to **ENABLED** in the Admin App.

---

### Scenario 2: Context-Aware Targeting & Rule Hierarchy
**Goal**: Show how OpenFeature evaluates multi-dimensional context (`country`, `userTier`, `targetingKey`) top-to-bottom instead of simple key-value lookups.

1. In the **Left Window (WebApp)**, locate the **Evaluation Persona** bar at the top:
   - Select **Sophia Chen (Singapore Premier VIP)**:
     - **Country**: `SG`, **Tier**: `PREMIUM`.
     - **Dynamic Banner**: Notice the green banner displays *"🇸🇬 Singapore Wealth Premier: Earn 3.8% p.a. yield on SGD fixed deposits"*.
     - **Chatbot**: Click prompt *"✨ Wealth Forecast"*. Because she is in the APAC Premier tier, the AI Wealth Trajectory model unlocks with full 5-year compounding charts.
2. Switch the persona to **James Miller (US Standard User)**:
   - **Country**: `US`, **Tier**: `STANDARD`.
   - **Dynamic Banner**: Instantly switches to yellow warning: *"🇺🇸 Scheduled System Update: ACH instant transfers will pause tonight"*.
   - **Chatbot**: Ask for *"Wealth Forecast"*. Notice the system politely indicates that advanced wealth forecasting is restricted to Premier clients.
   - Ask for a loan quote: Notice the currency dynamically adapts to `USD`.
3. Switch persona to **Alex Rivera (Internal Beta Tester)**:
   - **Targeting Key**: `user-beta-01`.
   - Even with `STANDARD` tier, the targeting rule explicitly matches his `targetingKey`, unlocking beta insights.

---

### Scenario 3: Flag Dependencies & Prerequisites
**Goal**: Demonstrate how flag prerequisites prevent cascading feature misconfigurations.

1. Notice that `feature.advanced-financial-insights` depends on `feature.chatbot-gemini-ui == 'on'`.
2. In the **Admin Control Center**:
   - Notice the blue link icon next to `feature.advanced-financial-insights` indicating it has prerequisites.
   - Toggle `feature.chatbot-gemini-ui` to **DISABLED**.
3. In the **WebApp**:
   - Even for Sophia Chen (Singapore Premier), advanced financial insights will now safely return `false`.
   - Open the **OpenFeature Live Evaluation Inspector** (expandable panel on the right).
   - Observe the resolution reason: `reason: PREREQUISITE_FAILED` with metadata showing `unmetPrerequisite: feature.chatbot-gemini-ui`.

---

### Scenario 4: Percentage / Gradual Rollouts with Sticky Bucketing
**Goal**: Show canary releases using deterministic MurmurHash3 hashing to provide sticky user bucketing.

1. In the **Admin Control Center**:
   - Click **Edit** on `feature.chatbot-gemini-ui`.
   - Look at Rule #3: *"50% Percentage Rollout for Standard tier users"*.
2. In the **WebApp**:
   - Select **James Miller (US Standard User)** with `STANDARD` tier.
   - The user's `targetingKey` (`user-us-reg`) is hashed into a bucket from `0..99`.
   - If the bucket is `< 50`, the variant is `on`; if `>= 50`, it is `off`.
   - Repeated requests for the same user always yield the exact same bucket and variant (sticky bucketing).

---

### Scenario 5: Reusable Audience Segments
**Goal**: Demonstrate how central audience definitions eliminate rule duplication across flags.

1. In the **Admin Control Center**, click the **Audience Segments** tab.
2. Inspect `segment-apac-premier`:
   - Matching criteria: `country: ["SG", "PH"]` AND `userTier: "PREMIUM"`.
3. Click **New Segment**:
   - **ID**: `segment-latam-vip`
   - **Name**: `Latin America VIP Cohort`
   - **Condition**: `{"country": ["BR", "MX"], "userTier": "PREMIUM"}`
   - Click **Save Segment**.
4. When authoring any flag, targeting rules can now simply reference `{"segmentId": "segment-latam-vip"}`.

---

### Scenario 6: JSON Schema Validation for Dynamic Configurations
**Goal**: Prove that invalid configurations are rejected before they can reach production systems.

1. In the **Admin Control Center**, click **Edit** on `config.chatbot-limits`.
2. Notice this is an `OBJECT` type flag with an active **JSON Schema Validator**:
   - Requires `maxTokens` (integer between 50 and 8000).
   - Requires `temperature` (number between 0 and 1).
3. Attempt to corrupt the configuration:
   - In the `standard` variant, change `"temperature": 0.2` to `"temperature": "hot"` (a string instead of number).
   - Click **Save Flag**.
4. Observe the validation error:
   - `Variant "standard" failed schema validation: /temperature must be number`.
   - The bad configuration is blocked from persisting!
5. Restore `"temperature": 0.2` and save successfully.

---

### Scenario 7: Flag Lifecycle State Machine
**Goal**: Walk through the flag lifecycle from inception to graduation and technical debt removal.

1. In the **Admin Control Center**, filter by **Lifecycle**:
   - `DRAFT`: Look at `feature.crypto-staking-pools`. Draft flags return safe fallback defaults and cannot accidentally expose incomplete code to end-users.
   - `ENABLED`: Active flags evaluating rules.
   - `GRADUATED`: Look at `config.legacy-auth-migration`.
     - The feature is 100% complete and permanent.
     - The flag is **frozen and read-only** to signify that developers should remove the `if/else` flag check from the application source code.
     - Attempting to toggle it alerts: *"Flag is GRADUATED (frozen permanent feature)"*.

---

### Scenario 8: Scheduled Flag Releases
**Goal**: Schedule an automated future release without manual developer intervention.

1. In the **Admin Control Center**, click **Schedule Release** (or the **Scheduled Releases** tab).
2. Configure a release:
   - **Target Flag**: `feature.crypto-staking-pools`
   - **Target State**: `ENABLED`
   - **Scheduled Time**: Select a timestamp 1 minute in the future.
   - **Reason**: *"Q4 Staking Product Launch"*
   - Click **Confirm Schedule**.
3. Once the target time arrives, the background scheduler automatically executes the mutation, writes to `flag_history`, and broadcasts the SSE event.

---

### Scenario 9: Audit Trail & 5-Version Diff Inspector
**Goal**: Show enterprise compliance and change auditing.

1. In the **Admin Control Center**, find `config.banner-announcement`.
2. Click the **History** button (clock icon) in the Actions column.
3. The modal displays the **last 5 revisions**:
   - Who made the change (Author).
   - When it was made (Relative age & ISO timestamp).
   - Change reason.
   - **Detailed JSON Diff**: Visualizing exact field-level changes (`from` &rarr; `to`).
   - **Complete Snapshot**: Inspecting the full flag configuration at that specific version.

---

### Scenario 10: Telemetry, Hooks & Evaluation Analytics
**Goal**: Showcase how OpenFeature lifecycle hooks capture metrics and track conversion outcomes.

1. In the **Admin Control Center**, click the **Evaluation Analytics** tab:
   - View **Total Flag Evaluations** across the system.
   - Inspect the **Variant Distribution Split** for each flag (e.g. `feature.chatbot-gemini-ui` split between `on` and `off`).
   - View **OpenFeature client.track() Business Outcomes**:
     - `portfolio_breakdown_viewed`
     - `loan_simulator_viewed`
     - `wealth_projection_viewed`
2. In the terminal running the BFF, observe structured JSON logs emitted in real-time by `EvaluationLoggerHook`:
   ```json
   {"level":"INFO","type":"OPENFEATURE_EVALUATION","flagKey":"feature.chatbot-gemini-ui","variant":"on","reason":"TARGETING_MATCH"}
   ```

---

## 3. Resetting / Re-seeding Demo Data

If at any point during testing you want to reset the database to the clean initial demo state:

```bash
npm --workspace=api run seed
```

This clears modifications and re-seeds all default flags, audience segments, and baseline telemetry.
