# Construct App Developer Guide

Everything you need to build, test, and publish apps for [Construct](https://construct.computer) — the AI-powered virtual desktop.

---

## Table of Contents

1. [What is a Construct App?](#what-is-a-construct-app)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [manifest.json Reference](#manifestjson-reference)
5. [Building Your MCP Server](#building-your-mcp-server)
6. [Using the App SDK](#using-the-app-sdk)
7. [Adding a Visual UI](#adding-a-visual-ui)
8. [Construct Browser SDK](#construct-browser-sdk)
9. [Authentication (OAuth2)](#authentication-oauth2)
10. [Testing Locally](#testing-locally)
11. [Publishing to the Registry](#publishing-to-the-registry)
12. [Updating Your App](#updating-your-app)
13. [How Publishing Works Internally](#how-publishing-works-internally)
14. [Categories](#categories)
15. [API Reference](#api-reference)
16. [Troubleshooting](#troubleshooting)

---

## What is a Construct App?

A Construct app is a small server that exposes **tools** via the **Model Context Protocol (MCP)** — a JSON-RPC 2.0 protocol. When a user installs your app, the Construct agent can call your tools to help the user accomplish tasks.

Apps can optionally include a **visual UI** that opens in a sandboxed window on the Construct desktop, allowing users to interact with your app directly.

**Two types of Construct apps:**

| Type | Description | Example |
|------|-------------|---------|
| **Tools-only** | MCP server with no visual UI. The agent calls your tools directly. | MercadoLibre, currency converter |
| **With UI** | MCP server + an HTML interface that users can interact with in a desktop window. | DevTools, calculator, notes |

**Key concepts:**

- Your app server handles `POST /mcp` requests using the MCP JSON-RPC protocol
- Three MCP methods: `initialize`, `tools/list`, and `tools/call`
- Apps run on **Cloudflare Workers** — they're bundled into the registry worker during deployment
- If your app has a UI, it loads in an iframe and communicates with the Construct platform via the `window.construct` JavaScript SDK

---

## Quick Start

The fastest way to create a new Construct app:

```bash
npx @construct-computer/create-construct-app my-app
```

This interactive CLI will ask for a name and description, then scaffold a complete project:

```bash
cd my-app
npm install
npm run dev
```

Your app is now running at `http://localhost:8787`. Test it:

```bash
# Health check
curl http://localhost:8787/health

# List available tools
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}},"id":2}'
```

**CLI flags:**

| Flag | Description |
|------|-------------|
| `--with-ui` | Include a visual UI (interactive HTML interface) |
| `--no-ui` | Tools only, no visual interface |

---

## Project Structure

```
my-app/
├── manifest.json        # App metadata — name, description, icon, categories
├── server.ts            # MCP server — registers tools, handles requests
├── icon.png             # App icon, 256×256 (or icon.svg)
├── package.json         # Dependencies and scripts
├── wrangler.toml        # Cloudflare Workers config for local dev
├── tsconfig.json        # TypeScript config
├── .gitignore
├── README.md
└── ui/                  # OPTIONAL — Visual interface
    ├── index.html       # UI entry point
    └── construct.d.ts   # TypeScript types for the SDK globals
```

### With UI vs Without UI

**Tools-only app** (no `ui/` directory):
```
my-app/
├── manifest.json        # No "ui" field
├── server.ts
├── icon.png
├── package.json
└── wrangler.toml
```

**App with UI** (includes `ui/` directory):
```
my-app/
├── manifest.json        # Has "ui" field with window dimensions
├── server.ts
├── icon.png
├── package.json
├── wrangler.toml
└── ui/
    ├── index.html        # Loads construct.js + construct.css SDK
    └── construct.d.ts
```

### Required Files

| File | Required | Description |
|------|----------|-------------|
| `manifest.json` | Yes | App metadata for the store listing |
| `server.ts` (or `src/index.ts` or `index.ts`) | Yes | MCP server entry point |
| `icon.png` (or `.svg`/`.jpg`) | Yes | App icon, 256×256 recommended |
| `README.md` | Yes | Shown as the store description |
| `ui/index.html` | No | Visual interface (omit for tools-only apps) |

---

## manifest.json Reference

The manifest declares your app's metadata. It's validated against the [JSON Schema](https://registry.construct.computer/schemas/manifest.json).

### Minimal Example

```json
{
  "$schema": "https://registry.construct.computer/schemas/manifest.json",
  "name": "My App",
  "description": "A short one-line description of what your app does."
}
```

### Full Example (with UI and auth)

```json
{
  "$schema": "https://registry.construct.computer/schemas/manifest.json",
  "name": "My App",
  "description": "A short one-line description of what your app does.",
  "author": { "name": "Your Name", "url": "https://github.com/your-username" },
  "icon": "icon.png",
  "categories": ["utilities"],
  "tags": ["example", "demo"],
  "ui": {
    "entry": "ui/index.html",
    "width": 800,
    "height": 600
  },
  "auth": {
    "oauth2": {
      "authorization_url": "https://api.example.com/oauth/authorize",
      "token_url": "https://api.example.com/oauth/token",
      "scopes": ["read", "write"]
    }
  },
  "permissions": {
    "network": ["api.example.com"],
    "storage": "1MB"
  },
  "tools": [
    { "name": "search", "description": "Search for items" }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | No | JSON Schema URL for IDE validation. Always include this. |
| `name` | string | **Yes** | Display name (1–50 chars). Shown in the App Store and Launchpad. |
| `description` | string | **Yes** | Short description (1–200 chars). Shown in search results and app cards. |
| `author` | object | No | `{ "name": string, "url?": string }` — Author info. |
| `icon` | string | No | Relative path to icon file. Defaults to `icon.png`. |
| `categories` | string[] | No | Array of category IDs (see [Categories](#categories)). Max 1 recommended. |
| `tags` | string[] | No | Searchable tags for discovery. Max 10, each max 30 chars. |
| `ui` | object | No | UI configuration. Omit for tools-only apps. |
| `ui.entry` | string | No | Entry point relative to repo root. Default: `ui/index.html`. |
| `ui.width` | integer | No | Default window width. Default: 800, range: 200–2000. |
| `ui.height` | integer | No | Default window height. Default: 600, range: 200–2000. |
| `auth` | object | No | Authentication configuration. |
| `auth.oauth2` | object | No | OAuth2 config with `authorization_url`, `token_url`, and optional `scopes`. |
| `permissions` | object | No | Declared permissions shown to users during install. |
| `permissions.network` | string[] | No | External domains this app connects to. |
| `permissions.storage` | string | No | Maximum storage needed (e.g., `"1MB"`). |
| `tools` | array | No | Pre-declared tool list. Auto-discovered on deploy if omitted. |

> **Tip:** Add `"$schema": "https://registry.construct.computer/schemas/manifest.json"` to get autocomplete and validation in VS Code and other editors.

---

## Building Your MCP Server

Your `server.ts` file is a Cloudflare Worker that handles MCP JSON-RPC requests. It must respond to three methods:

| Method | Description |
|--------|-------------|
| `initialize` | Returns protocol info and capabilities |
| `tools/list` | Returns a list of available tools |
| `tools/call` | Executes a tool and returns the result |

### The Simplest App

You can write the MCP handler from scratch, but it's easier to use the **ConstructApp SDK**:

```typescript
import { ConstructApp } from '@construct-computer/app-sdk';

const app = new ConstructApp({ name: 'my-app', version: '1.0.0' });

app.tool('hello', {
  description: 'Say hello to someone',
  parameters: {
    name: { type: 'string', description: 'Who to greet' },
  },
  handler: async (args) => {
    return `Hello, ${args.name}!`;
  },
});

export default app;
```

That's it. The SDK handles JSON-RPC routing, CORS, and the `initialize`/`tools/list` methods automatically.

### Tool Registration

Each tool has a **name**, **description**, **parameters**, and a **handler**:

```typescript
app.tool('search_products', {
  description: 'Search for products on the marketplace',
  parameters: {
    query: { type: 'string', description: 'Search terms' },
    category: { type: 'string', enum: ['electronics', 'clothing', 'books'], description: 'Product category' },
    limit: { type: 'number', description: 'Max results (default: 10)', default: 10 },
  },
  handler: async (args) => {
    const query = args.query as string;
    const category = args.category as string;
    const limit = (args.limit as number) || 10;
    // ... your logic here
    return `Found ${limit} results for "${query}" in ${category}`;
  },
});
```

**Parameter types:** `string`, `number`, `boolean`, `array`, `object`. Use `enum` for fixed choices and `description` to help the AI decide when to use each tool.

### Handler Return Values

A handler can return:

1. **A string** — automatically wrapped in a text content block:
   ```typescript
   handler: async (args) => 'Hello, World!'
   ```

2. **A ToolResult object** — for multiple content blocks or error states:
   ```typescript
   handler: async (args): Promise<ToolResult> => {
     if (!args.query) {
       return { content: [{ type: 'text', text: 'Query is required' }], isError: true };
     }
     return { content: [{ type: 'text', text: 'Results found' }] };
   }
   ```

### Inlining the SDK

When your app is bundled into the registry worker, imports like `@construct-computer/app-sdk` won't resolve. You have two options:

1. **Inline the SDK class** in your `server.ts` (what `create-construct-app` does by default). The SDK is ~150 lines and self-contained.

2. **Use ES module bundling** — if you prefer imports, add a build step:
   ```json
   {
     "scripts": {
       "build": "esbuild server.ts --bundle --format=esm --outfile=dist/worker.js --platform=browser",
       "dev": "wrangler dev"
     }
   }
   ```
   Then set `main = "dist/worker.js"` in `wrangler.toml`.

---

## Using the App SDK

Install the SDK for local development with types:

```bash
npm install @construct-computer/app-sdk
```

### Core API

#### `new ConstructApp(options)`

Creates a new app instance.

```typescript
import { ConstructApp } from '@construct-computer/app-sdk';

const app = new ConstructApp({ name: 'my-app', version: '1.0.0' });
```

#### `app.tool(name, definition)`

Register a tool. Returns `this` for chaining.

```typescript
app
  .tool('tool_a', { description: '...', handler: async () => 'OK' })
  .tool('tool_b', { description: '...', handler: async () => 'OK' });
```

#### `app.fetch(request)`

Cloudflare Worker entry point. Export as default:

```typescript
export default app;
```

#### `requireAuth(ctx)`

Throws if the user isn't authenticated. Use in handlers that need OAuth:

```typescript
import { requireAuth } from '@construct-computer/app-sdk';

app.tool('get_my_account', {
  description: 'Get authenticated user account',
  handler: async (args, ctx) => {
    requireAuth(ctx);
    // ctx.auth.access_token is now guaranteed to exist
    const response = await fetch('https://api.example.com/me', {
      headers: { Authorization: `Bearer ${ctx.auth.access_token}` },
    });
    return await response.text();
  },
});
```

### RequestContext

Every handler receives a `ctx` (RequestContext) with:

| Field | Type | Description |
|-------|------|-------------|
| `ctx.userId` | `string \| undefined` | User ID from the `x-construct-user` header |
| `ctx.auth` | `object \| undefined` | OAuth data from the `x-construct-auth` header |
| `ctx.auth.access_token` | `string` | OAuth access token (when authenticated) |
| `ctx.isAuthenticated` | `boolean` | Whether valid auth is present |
| `ctx.request` | `Request` | The raw HTTP request |

---

## Adding a Visual UI

If your app has a visual interface, create a `ui/index.html` file and add the `ui` field to your manifest:

```json
{
  "ui": {
    "entry": "ui/index.html",
    "width": 800,
    "height": 600
  }
}
```

### How UIs Work

1. Your `ui/index.html` (and any CSS/JS/images) is served from GitHub's CDN at the pinned commit
2. Construct loads it in a **sandboxed iframe** inside a desktop window
3. The `construct.js` and `construct.css` SDK files are available at `/sdk/construct.js` and `/sdk/construct.css`
4. Your UI communicates with the platform and your MCP server via `window.postMessage`

### Minimal UI Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="/sdk/construct.css">
  <script src="/sdk/construct.js"></script>
</head>
<body>
  <div class="app">
    <input type="text" id="input" placeholder="Enter text..." />
    <button class="btn" onclick="runTool()">Go</button>
    <div id="output"></div>
  </div>

  <script>
    construct.ready(() => {
      construct.ui.setTitle('My App');
    });

    async function runTool() {
      const result = await construct.tools.callText('hello', {
        name: document.getElementById('input').value
      });
      document.getElementById('output').textContent = result;
    }
  </script>
</body>
</html>
```

### Serving UI Locally

For local development, add an `[assets]` section to `wrangler.toml`:

```toml
name = "construct-app-myapp"
main = "server.ts"
compatibility_date = "2024-12-01"

[assets]
directory = "./ui"
binding = "ASSETS"
not_found_handling = "none"
run_worker_first = ["/*"]
```

Then in your `server.ts`, serve static assets through the ASSETS binding:

```typescript
const app = new ConstructApp({ name: 'my-app', version: '1.0.0' });

// Override fetch to handle static assets
export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    const url = new URL(request.url);

    // Serve MCP and health from the app
    if (url.pathname === '/mcp' || url.pathname === '/health') {
      return app.fetch(request);
    }
    if (request.method === 'OPTIONS') {
      return app.fetch(request);
    }

    // Serve UI files from the ASSETS binding
    if (env.ASSETS) {
      return (env.ASSETS as { fetch: typeof fetch }).fetch(request);
    }
    return new Response('Not found', { status: 404 });
  }
};
```

> **Note:** In production, UI files are served from GitHub's CDN — the ASSETS binding is only for local development.

---

## Construct Browser SDK

The SDK is a `postMessage` bridge that lets your app's UI communicate with the Construct platform. It works through two layers:

1. **`/sdk/construct.js`** — The core bridge loaded in your `ui/index.html`. Provides `tools`, `ui`, and `ready`.
2. **Construct desktop bridge** — When your app runs inside Construct, the parent frame provides additional methods (`state`, `agent`) via the same bridge.

> **Note:** When testing your UI locally outside of Construct, only the core methods (`tools`, `ui`, `ready`) are available. The `state` and `agent` namespaces require the Construct desktop environment.

### Loading the SDK

Add these two lines to your `ui/index.html`:

```html
<link rel="stylesheet" href="/sdk/construct.css">
<script src="/sdk/construct.js"></script>
```

### Core API (always available)

These methods are available both in standalone testing and when running inside Construct.

#### `construct.ready(callback)`

Wait for the SDK bridge to be ready. **Always wrap your initialization code in this.**

```javascript
construct.ready(() => {
  construct.ui.setTitle('My App');
});
```

#### `construct.tools.call(name, args?)`

Call one of your app's MCP tools. Returns the full result object.

```javascript
const result = await construct.tools.call('search_products', { query: 'laptop' });
// result = { content: [{ type: 'text', text: '...' }], isError?: boolean }
```

#### `construct.tools.callText(name, args?)`

Call a tool and get just the text content. Most common for simple results.

```javascript
const text = await construct.tools.callText('hello', { name: 'World' });
// text = "Hello, World!"
```

#### `construct.ui.setTitle(title)`

Update the window title bar text.

```javascript
construct.ui.setTitle('Search Results');
```

#### `construct.ui.getTheme()`

Get the current Construct theme (dark/light mode and accent color).

```javascript
const theme = await construct.ui.getTheme();
// theme = { mode: 'dark', accent: '#60A5FA' }
```

#### `construct.ui.close()`

Close this app window.

### Extended API (requires Construct desktop)

These methods are only available when your app is running inside the Construct desktop. They communicate through the parent frame's bridge.

#### `construct.state.get()`

Read your app's persistent state (stored server-side, max 1MB). Primarily designed for local apps created by the AI agent.

```javascript
const state = await construct.state.get();
console.log(state.lastSearch);
```

#### `construct.state.set(state)`

Write state. Triggers `onUpdate` callbacks on all connected clients.

```javascript
await construct.state.set({ lastSearch: 'laptop', recentItems: [] });
```

#### `construct.state.onUpdate(callback)`

Subscribe to state changes (from the agent or other tabs).

```javascript
construct.state.onUpdate((newState) => {
  console.log('State updated:', newState);
  renderFromState(newState);
});
```

#### `construct.agent.notify(message)`

Send a message to the AI agent. The agent can then respond by calling your tools or updating your app state.

```javascript
await construct.agent.notify('User clicked the search button');
```

### CSS Design System

The `construct.css` SDK provides a dark theme with CSS variables:

```css
:root {
  --c-bg: #0a0a12;
  --c-surface: rgba(255,255,255,0.04);
  --c-surface-hover: rgba(255,255,255,0.06);
  --c-surface-raised: rgba(255,255,255,0.08);
  --c-text: #e4e4ed;
  --c-text-secondary: rgba(228,228,237,0.7);
  --c-text-muted: rgba(228,228,237,0.4);
  --c-accent: #6366f1;
  --c-accent-muted: rgba(99,102,241,0.15);
  --c-border: rgba(255,255,255,0.08);
  --c-error: #ef4444;
  --c-radius-sm: 6px;
  --c-radius-md: 10px;
  --c-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --c-font-mono: "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
}
```

Utility classes: `.btn`, `.btn-secondary`, `.btn-sm`, `.badge`, `.badge-accent`, `.fade-in`, `.container`.

### TypeScript Declarations

Type definitions for the full SDK (including `state` and `agent` namespaces) are available at `ui/construct.d.ts`. The scaffolder generates this file automatically. Add it to your project for autocomplete:

```typescript
/// <reference path="./construct.d.ts" />
```

---

## Authentication (OAuth2)

If your app connects to an external API that requires user authentication, use the OAuth2 flow:

### 1. Declare auth in your manifest

```json
{
  "auth": {
    "oauth2": {
      "authorization_url": "https://api.example.com/oauth/authorize",
      "token_url": "https://api.example.com/oauth/token",
      "scopes": ["read", "write"]
    }
  }
}
```

### 2. Use `requireAuth` in your tool handlers

```typescript
import { ConstructApp, requireAuth, RequestContext } from '@construct-computer/app-sdk';

app.tool('get_my_account', {
  description: 'Get the authenticated user account',
  handler: async (args, ctx) => {
    requireAuth(ctx); // throws if not authenticated

    // ctx.auth is now guaranteed to have access_token
    const response = await fetch('https://api.example.com/me', {
      headers: { Authorization: `Bearer ${ctx.auth.access_token}` },
    });
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  },
});
```

### How it works

1. The user connects their account in the Construct settings
2. Construct stores the OAuth access token
3. When the agent calls your tool, Construct injects the `x-construct-auth` header:
   ```
   x-construct-auth: {"access_token":"...","user_id":"..."}
   ```
4. The SDK parses this into `ctx.auth` and sets `ctx.isAuthenticated = true`
5. Use `requireAuth(ctx)` to guard tools that need authentication

### Public vs Authenticated Tools

You can mix public and authenticated tools in the same app:

```typescript
// Public — works for everyone
app.tool('search_products', {
  description: 'Search products (no login required)',
  handler: async (args) => { /* ... */ },
});

// Authenticated — requires connected account
app.tool('manage_listing', {
  description: 'Update a product listing (requires seller account)',
  handler: async (args, ctx) => {
    requireAuth(ctx);
    // ctx.auth.access_token available here
  },
});
```

---

## Testing Locally

### Start the dev server

```bash
npm run dev
```

This runs `wrangler dev` and starts your app at `http://localhost:8787`.

### Test MCP endpoints

```bash
# Health check
curl http://localhost:8787/health
# → ok

# Initialize (handshake)
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
# → {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05",...}}

# List tools
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
# → {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}

# Call a tool
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}},"id":3}'
# → {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"Hello, World!"}]}}
```

### Test in Construct

1. Start your dev server: `npm run dev`
2. Open Construct and go to **App Registry > Installed**
3. Find **"Developer Tools"** at the bottom
4. Enter your app name and `http://localhost:8787` as the URL
5. Click **"Install from URL"**

Your app's tools are now available to the Construct agent.

> **Tip:** For remote testing, use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/app-network/create-tunnel/) to create a tunnel: `cloudflared tunnel --url http://localhost:8787`

### Test with auth headers

Simulate authenticated requests by adding the `x-construct-auth` header:

```bash
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'x-construct-auth: {"access_token":"test-token","user_id":"user-123"}' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_my_account","arguments":{}},"id":1}'
```

---

## Publishing to the Registry

### Step 1: Prepare your app

Make sure your app has all required files:

- [ ] `manifest.json` — with at least `name` and `description`
- [ ] `server.ts` (or `src/index.ts` or `index.ts`) — MCP server entry point
- [ ] `icon.png` — 256×256 icon (or `icon.svg`, `icon.jpg`)
- [ ] `README.md` — used as the store description

### Step 2: Push to GitHub

Create a public repository for your app. The recommended naming convention is `construct-app-{name}`:

```bash
git init && git add -A
git commit -m "Initial release"
git remote add origin git@github.com:you/construct-app-myapp.git
git push -u origin main
```

### Step 3: Get your commit SHA

Find the full 40-character SHA of the commit you want to publish:

```bash
git rev-parse HEAD
# → abc123def456789abc123def456789abc123def4
```

This pins your app to an exact, auditable version.

### Step 4: Create a pointer file

Fork [construct-computer/app-registry](https://github.com/construct-computer/app-registry) and add a file at `apps/{your-app-id}.json`:

```json
{
  "repo": "https://github.com/you/construct-app-myapp",
  "description": "A short description for the registry listing",
  "versions": [
    {
      "version": "1.0.0",
      "commit": "abc123def456789abc123def456789abc123def4",
      "date": "2026-04-10"
    }
  ]
}
```

> **Note:** The app ID (filename without `.json`) must be kebab-case: lowercase letters, numbers, and hyphens only.

### Step 5: Open a pull request

CI will automatically validate your app:

- Clones your repo at the pinned commit
- Validates `manifest.json` has required fields (`name`, `description`)
- Checks that an entry point exists (`server.ts`, `src/index.ts`, or `index.ts`)
- Verifies `icon.png` (or `.svg`/`.jpg`) exists
- Verifies `README.md` exists
- Type-checks your server (via `npm build` or `deno check`)

Once a maintainer reviews and merges your PR:

1. **Sync** — Your app metadata is pushed to the D1 database
2. **Bundle** — Your server code is bundled into the registry worker
3. **Deploy** — The worker is deployed to Cloudflare
4. **Extract tools** — Your app's tools are discovered and cached

Your app appears in the Construct App Registry within minutes!

---

## Updating Your App

To publish a new version:

1. Push the update to your app repo
2. Get the new commit SHA: `git rev-parse HEAD`
3. Open a PR to the registry adding a new version entry:

```json
{
  "repo": "https://github.com/you/construct-app-myapp",
  "description": "A short description for the registry listing",
  "versions": [
    { "version": "1.0.0", "commit": "abc123...", "date": "2026-04-01" },
    { "version": "1.1.0", "commit": "def456...", "date": "2026-04-10" }
  ]
}
```

The **last entry** in the `versions` array becomes the "latest" version shown in the store. Previous versions are still available in the version history.

---

## How Publishing Works Internally

Understanding the pipeline helps you debug issues:

```
Your repo                     app-registry repo              Cloudflare
┌─────────────────┐          ┌──────────────────┐          ┌───────────────────┐
│ manifest.json    │          │ apps/my-app.json │──CI──▶   │ D1 database       │
│ server.ts       │◀─pointer─│ (repo + commits) │          │ (search, browse)  │
│ icon.png        │          │                  │──CI──▶   │                   │
│ ui/index.html   │          │                  │          │ Worker bundles    │
│ README.md       │          │                  │          │ your server.ts    │
└─────────────────┘          └──────────────────┘          │ into the runtime  │
                                                            └───────────────────┘
```

1. **You create a PR** adding `apps/{id}.json` to the registry repo
2. **CI validates** your app (manifest, entry point, icon, README)
3. **On merge**, CI runs three scripts:
   - `scripts/sync.ts` — Clones your repo, reads manifest, pushes metadata to D1
   - `scripts/bundle-apps.sh` — Copies your `server.ts` into the worker, patches it, generates a handler registry
   - `scripts/extract-tools.sh` — Calls your app's `tools/list` endpoint to cache tool definitions
4. The worker is deployed with your app handler bundled in

Your app code is **bundled directly into the registry worker**. There's no separate deployment per app — the worker routes `/{appId}/mcp` to your handler.

Assets (icons, screenshots, UI files) are served from `raw.githubusercontent.com/{owner}/{repo}/{commit}/...` — no separate asset storage needed.

---

## Categories

Use these category IDs in your manifest's `categories` array:

| ID | Label |
|----|-------|
| `productivity` | Productivity |
| `developer-tools` | Developer Tools |
| `communication` | Communication |
| `finance` | Finance |
| `media` | Media |
| `ai-tools` | AI Tools |
| `data` | Data & Analytics |
| `utilities` | Utilities |
| `integrations` | Integrations |
| `shopping` | Shopping |
| `games` | Games |

---

## API Reference

The public registry API is at `https://registry.construct.computer`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/apps` | List/search apps. Params: `q`, `category`, `sort` (`popular`/`recent`/`rating`/`name`), `page`, `limit` |
| `GET` | `/v1/apps/:id` | App detail — metadata, versions, reviews |
| `GET` | `/v1/apps/:id/download` | Redirect to repo tarball (latest version) |
| `GET` | `/v1/apps/:id/download/:version` | Redirect to repo tarball (specific version) |
| `GET` | `/v1/categories` | Categories with app counts |
| `GET` | `/v1/featured` | Featured apps and collections |
| `GET` | `/v1/curated` | Curated third-party integrations |

The app runtime is at `https://apps.construct.computer`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/{appId}/mcp` | MCP JSON-RPC endpoint for the app |
| `GET` | `/{appId}/ui/*` | Proxy UI files from GitHub at pinned commit |
| `GET` | `/{appId}/icon` | Proxy app icon from GitHub |
| `GET` | `/sdk/construct.css` | Construct SDK CSS |
| `GET` | `/sdk/construct.js` | Construct SDK JavaScript bridge |

---

## Troubleshooting

### My PR failed CI validation

Common validation errors:

| Error | Fix |
|-------|-----|
| Missing `manifest.json` | Add a `manifest.json` to your repo root |
| Missing required fields | Ensure `name` and `description` are in your manifest |
| No entry point found | Create `server.ts`, `src/index.ts`, or `index.ts` |
| No icon file found | Add `icon.png` (256×256), `icon.svg`, or `icon.jpg` |
| Missing `README.md` | Add a `README.md` to your repo root |
| `npm build` failed | Check that your `server.ts` compiles without errors |

### My app doesn't appear in the store

- Make sure the PR was merged (not just opened)
- Check that the commit SHA in your pointer file matches an actual commit
- Wait a few minutes after merge — the sync pipeline needs to run

### MCP endpoint returns "App not installed"

This means your app handler isn't bundled in the worker yet. Check that:
- The `bundle-apps.sh` script found your app
- The `server.ts` exports `default app` (or uses the SDK pattern)

### My UI doesn't load

- Make sure `manifest.json` has the `ui` field
- Check that `ui/index.html` exists in your repo
- Verify the SDK paths: `/sdk/construct.js` and `/sdk/construct.css`
- Test locally with `wrangler dev` and the `[assets]` config

### Auth header not received

The `x-construct-auth` header is only present when the user has connected their account through Construct. In local development, you can add headers manually:

```bash
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'x-construct-auth: {"access_token":"test-token","user_id":"test-user"}' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"my_tool","arguments":{}},"id":1}'
```

---

## Links

- [App Store](https://registry.construct.computer) — Browse apps
- [Publishing Guide](https://registry.construct.computer/publish) — Step-by-step guide
- [App SDK](https://www.npmjs.com/package/@construct-computer/app-sdk) — Build apps with TypeScript
- [Create a new app](https://www.npmjs.com/package/@construct-computer/create-construct-app) — Scaffold in seconds
- [DevTools Reference App](https://github.com/construct-computer/construct-app-hello-world) — Complete example with UI
- [Manifest Schema](https://registry.construct.computer/schemas/manifest.json) — JSON Schema for IDE validation