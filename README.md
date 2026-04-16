[![App Store](https://img.shields.io/badge/App_Store-Live-6366f1)](https://registry.construct.computer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# Construct App Registry

Source of truth for published [Construct](https://construct.computer) apps. App code lives in each developer's own repository; this registry stores pointers (repo URL + commit SHA per version). A Cloudflare Worker + D1 database serves as a read replica for fast browsing and search.

## How It Works

```
Developer repo                  This registry              Cloudflare Worker + D1
┌──────────────────┐           ┌──────────────────┐       ┌───────────────────────┐
│ manifest.json    │           │ apps/{id}.json   │──CI──▶│ D1 database           │
│ server.ts        │◀─pointer──│ (repo + commits) │       │ (search, browse, API) │
│ icon.png         │           └──────────────────┘       ├───────────────────────┤
│ ui/ ...          │                                        │ Bundled app handlers  │
└──────────────────┘                                        │ (/{appId}/mcp)        │
                                                            └───────────────────────┘
```

- **registry.construct.computer** — browse and search apps (HTML + API)
- **apps.construct.computer** — app runtime proxy (MCP endpoints, UI serving, SDK)
- Every listing is a reviewable PR against this repo
- Assets (icons, screenshots, UI files) are served from GitHub's CDN at the pinned commit

## Documentation

**[DEVELOPER_DOCS.md](DEVELOPER_DOCS.md)** — Complete guide for building, testing, and publishing Construct apps, including:

- Quick start from the template repo
- Project structure and required files
- manifest.json reference with all fields
- Building MCP servers with the App SDK
- Adding visual UIs with the Browser SDK
- OAuth2 authentication
- Testing locally and in Construct
- Publishing and updating your app
- Troubleshooting

## Quick Links

- [App Store](https://registry.construct.computer) — browse apps
- [Publishing Guide](https://registry.construct.computer/publish) — step-by-step guide
- [App SDK](https://www.npmjs.com/package/@construct-computer/app-sdk) — build apps with TypeScript
- [Sample App (Text Tools)](https://github.com/construct-computer/construct-app-sample) — template repo with nine example tools and UI
- [Manifest Schema](https://github.com/construct-computer/app-sdk/blob/main/schemas/manifest.schema.json) — JSON Schema for IDE validation

## App Repository Structure

Every Construct app repo must follow this layout:

```
construct-app-{name}/
├── manifest.json              # REQUIRED — app metadata
├── server.ts                  # REQUIRED — MCP server entry point
│                              #   (or src/index.ts, or index.ts)
├── icon.png                   # REQUIRED — 256×256 (or icon.svg, icon.jpg)
├── README.md                  # REQUIRED — shown as store description
├── screenshots/               # OPTIONAL
│   ├── 1.png                  #   1280×800 recommended
│   └── 2.png
├── CHANGELOG.md               # OPTIONAL
└── ui/                        # OPTIONAL — visual interface
    ├── index.html             #   UI entry point
    └── construct.d.ts         #   SDK type declarations
```

## Publishing an App

1. **Create your app** using the [template repo](https://github.com/construct-computer/construct-app-sample) or the [Developer Guide](DEVELOPER_DOCS.md)
2. **Push to a public GitHub repo** (e.g., `construct-app-myapp`)
3. **Fork this registry** and add `apps/{your-app-id}.json`:
   ```json
   {
     "repo": "https://github.com/you/construct-app-myapp",
     "description": "A short description for the registry",
     "versions": [
       { "version": "1.0.0", "commit": "full-40-char-sha", "date": "2026-04-10" }
     ]
   }
   ```
4. **Open a PR** — CI validates your manifest, entry point, icon, and README
5. **Merge** — once reviewed and merged, the sync pipeline publishes your app

See [DEVELOPER_DOCS.md](DEVELOPER_DOCS.md) for the full guide.

## Updating an App

Push the update to your repo, then open a PR adding a new version entry:

```json
{
  "repo": "https://github.com/you/construct-app-myapp",
  "description": "A short description for the registry",
  "versions": [
    { "version": "1.0.0", "commit": "abc123...", "date": "2026-04-01" },
    { "version": "1.1.0", "commit": "def456...", "date": "2026-04-10" }
  ]
}
```

The latest version (last in the array) becomes the current version in the store.

## Categories

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

## API

All endpoints are under `registry.construct.computer`. Responses are JSON with CORS enabled.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/apps` | List/search apps. Params: `q`, `category`, `sort` (`popular`/`recent`/`rating`/`name`), `page`, `limit` |
| GET | `/v1/apps/:id` | App detail — metadata, versions, reviews |
| GET | `/v1/apps/:id/download` | Redirect to repo tarball for latest version |
| GET | `/v1/apps/:id/download/:version` | Redirect to repo tarball for a specific version |
| GET | `/v1/categories` | Categories with app counts |
| GET | `/v1/featured` | Featured apps and collections |
| GET | `/v1/curated` | Curated third-party integrations |

App runtime endpoints under `apps.construct.computer`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/{appId}/mcp` | MCP JSON-RPC endpoint |
| GET | `/{appId}/ui/*` | Proxy UI files from GitHub |
| GET | `/{appId}/icon` | Proxy app icon |
| GET | `/sdk/construct.css` | Construct SDK CSS |
| GET | `/sdk/construct.js` | Construct SDK JavaScript bridge |

## License

MIT# Trigger sync
