# Agent Instructions

## Overview
This directory manages the application registry, including app manifests, collections, and the registry worker.

## Core Components
- `worker/`: The Cloudflare Worker that handles the registry and app runtime.
- `apps/`: Contains JSON manifests for published apps.
- `collections/`: Curated collections of apps.
- `scripts/`: Utility scripts for managing the registry.

## Key Files & Data
- `apps/*.json`: App manifests.
- `collections/*.json`: Staff picks and curated lists.
- `verified.json`: List of verified apps.
- `categories.json`: App categories.

## Commands
- Use `pnpm` for all operations.
- See `worker/package.json` for specific worker commands.

## App Development
- New apps should be created from the [template repo](https://github.com/construct-computer/construct-app-sample), not from a CLI scaffolder.
- The `ConstructApp` SDK handles MCP routing, CORS, asset serving, and `/ui/*` rewriting automatically — `export default app` is all that's needed.
- Developer docs are in `DEVELOPER_DOCS.md` in this directory.

## Notes
- This is a submodule of the monorepo.
- Deploys to `registry.construct.computer` and `apps.construct.computer`.
