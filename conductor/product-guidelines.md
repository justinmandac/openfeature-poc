# Product Guidelines: OpenFeature Enterprise Platform

## 1. Design & UX Principles
- **Clarity and Operational Trust**: In enterprise banking and configuration control systems, predictability is paramount. Status indicators (e.g. `ENABLED`, `DISABLED`, `DRAFT`, `GRADUATED`) must use distinct, accessible color coding and explicit icons.
- **Zero-Flicker Dynamic Toggles**: Feature flag evaluations and SSE-driven live updates must adapt components seamlessly without disruptive layout shifts or page reloads.
- **Consistent Visual Language**: Interface built with clean modern components using Tailwind CSS and Lucide React icons. Administrative interfaces prioritize dense, scannable data grids and visual diff representations.
- **Responsive Across Devices**: Unified experiences across desktop control center screens, responsive mobile web layouts, and native mobile Android interfaces.

## 2. Terminology & Communication Style
- **OpenFeature CNCF Standards Alignment**: Always use canonical OpenFeature specification terminology across docs, UI, and code:
  - *Evaluation Context*: Set of contextual attributes (e.g. `targetingKey`, `country`, `businessUnit`, `appId`).
  - *Variant*: The resolved value (e.g. `true`/`false`, a string label, number, or object payload).
  - *Resolution Details*: Includes `value`, `variant`, `reason` (`TARGETING_MATCH`, `DEFAULT`, `DISABLED`, `PREREQUISITE_FAILED`), and metadata.
  - *Provider*: The implementation providing evaluation mechanics (e.g., `OfrepServerProvider`, `OfrepWebProvider`).
- **Deterministic & Professional Tone**: Technical documentation and system messages must be precise, authoritative, and helpful, avoiding ambiguous jargon or casual colloquialisms.
- **Defensive & Explicit Errors**: System warnings must detail the specific validation failure (e.g., JSON Schema path error or unmet prerequisite key) and display the active fallback value.

## 3. Operational Safety & Governance
- **Safe Defaults Rule**: Every flag evaluation must supply a safe, deterministic default value in consumer code. A network outage, OFREP provider error, or database disconnect must never disrupt critical user workflows.
- **Strict Schema Enforcement**: Object configurations must define and validate against JSON Schema specifications before submission.
- **Lifecycle & Hygiene Discipline**: Flags must be actively managed throughout their lifecycle (`DRAFT` → `ENABLED` → `DISABLED` → `GRADUATED` → `ARCHIVED`). Graduated flags should trigger prompt codebase refactor reminders.
