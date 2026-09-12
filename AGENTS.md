# AGENT.md

## Technology
- Use NodeJS and Express for the API, BFF, and Admin Web App Backend
  - For the Admin Web App, use EJS for templating.
- Use React JS for the Web App and Admin Web App
- SQLite for persistence but needs to be swappable for PostgreSQL

## Project Structure
- **api/** holds the core business logic.
- **webapp/** contains the demo web app that will be used to demonstrate feature toggling with OpenFeature
- **bff/** is the corresponding backend for **webapp/**. This will be used to demo features flags that cut across frontend and backend.
- **admin-webapp** contains the UI for interactively toggling feature flags.

## Commit Structure
- Use Conventional Commits