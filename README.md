# Construct App Registry

The official app registry for [construct.computer](https://construct.computer) — an AI-powered virtual desktop.

This repository is the **source of truth** for all published apps. The Cloudflare Worker at `apps.construct.computer` acts as a read replica, providing a fast API for browsing, searching, and installing apps.

## How it works

```
GitHub (this repo)          Cloudflare Worker + D1
┌─────────────────┐        ┌─────────────────────┐
│  apps/*.json     │──sync─▶│  D1 database          │
│  (pointers to    │        │  (fast search/browse) │
│   app repos)     │        │                       │
└─────────────────┘        │  API: apps.construct.  │
                            │       computer/v1/     │
                            └─────────────────────┘
```

- **App code lives in the developer's own repo** (e.g. `github.com/you/construct-app-weather`)
- **This registry stores only pointers** — repo URL + commit SHA per version
- **Assets (icons, screenshots) are served directly from GitHub's CDN** at the pinned commit
- **Full transparency** — every app listing is a reviewable PR

## Submitting an app

1. Create your app repo following the [standard structure](#app-repository-structure)
2. Fork this repo and add `apps/{your-app-id}.json`:

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

3. Open a PR — CI will automatically validate your app
4. Once reviewed and merged, your app appears in the Construct App Store

## Publishing an update

1. Push the update to your app repo
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

## App repository structure

Every Construct app repo **must** follow this layout:

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

### manifest.json

Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique kebab-case identifier |
| `name` | string | Display name |
| `version` | string | Semver version |
| `description` | string | One-line description |
| `author` | `{ name, url? }` | Author info |
| `entry` | string | MCP server entry point |

Optional fields: `runtime`, `transport`, `permissions`, `categories`, `tags`, `icon`, `ui`, `tools`

See the [hello-world app](https://github.com/construct-computer/construct-app-hello-world) for a complete example.

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

## License

MIT
