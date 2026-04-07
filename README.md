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
│ icon.png         │           └──────────────────┘       └───────────────────────┘
│ ui/ ...          │
└──────────────────┘
```

- **registry.construct.computer** — browse and search apps (HTML + API)
- **apps.construct.computer** — app runtime proxy (MCP endpoints, UI serving, SDK)
- Every listing is a reviewable PR against this repo
- Assets (icons, screenshots) are served from GitHub's CDN at the pinned commit

## App Repository Structure

Every Construct app repo must follow this layout:

```
construct-app-{name}/
├── manifest.json              # REQUIRED — app metadata
├── server.ts                  # REQUIRED — MCP server entry (Deno)
├── icon.png                   # REQUIRED — 256x256 (or icon.svg)
├── README.md                  # REQUIRED — shown as store description
├── screenshots/               # OPTIONAL
│   ├── 1.png                  #   1280x800 recommended
│   ├── 2.png
│   └── 3.png
├── CHANGELOG.md               # OPTIONAL
└── ui/                        # OPTIONAL — app GUI
    ├── index.html
    └── ...
```

## Manifest Schema

The manifest is validated against the JSON Schema at [`https://registry.construct.computer/schemas/manifest.json`](https://registry.construct.computer/schemas/manifest.json).

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique kebab-case identifier |
| `name` | string | Display name |
| `version` | string | Semver version |
| `description` | string | One-line description |
| `author` | `{ name, url? }` | Author info |
| `entry` | string | MCP server entry point |

### Optional fields

`runtime`, `transport`, `permissions`, `categories`, `tags`, `icon`, `ui`, `tools`

## Publishing an App

1. **Create your app repo** following the [structure above](#app-repository-structure).
2. **Fork this registry** and add `apps/{your-app-id}.json`:

```json
{
  "repo": "https://github.com/you/construct-app-myapp",
  "versions": [
    {
      "version": "1.0.0",
      "commit": "full-40-char-commit-sha",
      "date": "2026-03-24"
    }
  ]
}
```

3. **Open a PR** — CI validates your app manifest, icon, and entry point.
4. **Merge** — once reviewed and merged, the sync pipeline pushes your app to the store.

## Updating an App

1. Push the update to your app repo.
2. Open a PR to this registry adding a new entry to your `versions` array:

```json
{
  "repo": "https://github.com/you/construct-app-myapp",
  "versions": [
    { "version": "1.0.0", "commit": "abc123...", "date": "2026-03-15" },
    { "version": "1.1.0", "commit": "def456...", "date": "2026-03-24" }
  ]
}
```

The latest version (last in the array) becomes the version shown in the store.

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
| GET | `/v1/apps` | List/search apps. Query params: `q`, `category`, `sort` (`popular`/`recent`/`rating`/`name`), `page`, `limit` |
| GET | `/v1/apps/:id` | App detail — metadata, versions, reviews |
| GET | `/v1/apps/:id/download` | Redirect to repo tarball for latest version |
| GET | `/v1/apps/:id/download/:version` | Redirect to repo tarball for a specific version |
| GET | `/v1/categories` | Categories with app counts |
| GET | `/v1/featured` | Featured apps and collections |
| GET | `/v1/curated` | Curated third-party integrations |

## Links

- [App Store](https://registry.construct.computer) — browse apps
- [Publishing Guide](https://registry.construct.computer/publish) — step-by-step guide
- [App SDK](https://www.npmjs.com/package/@construct-computer/app-sdk) — build apps
- [Create a new app](https://www.npmjs.com/package/@construct-computer/create-construct-app) — scaffold in seconds
- [Sample App](https://github.com/construct-computer/construct-app-sample) — reference implementation

## License

MIT
