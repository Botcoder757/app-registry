/**
 * Developer dashboard — GitHub-auth'd per-app env var management.
 *
 * Routes (all under /dev on registry.construct.computer):
 *   GET  /dev                        — entry; redirect to dashboard or login
 *   GET  /dev/login                  — redirect to GitHub OAuth
 *   GET  /dev/callback               — OAuth callback; create session
 *   POST /dev/logout                 — destroy session
 *   GET  /dev/dashboard              — list apps the logged-in user owns
 *   GET  /dev/apps/:id               — per-app dashboard with env var CRUD
 *   POST /dev/apps/:id/env           — upsert a single env var (form-encoded)
 *   POST /dev/apps/:id/env/delete    — delete an env var (form-encoded)
 *
 * Isolation model
 *   Env var *values* live encrypted in D1 (app_env_vars.value_encrypted) with
 *   AES-256-GCM, keyed off ENV_ENCRYPTION_KEY. Values are never returned to
 *   the dashboard (only names + last-updated timestamps). Apps receive their
 *   own env vars — and no one else's — via an internal x-construct-env header
 *   set by handleAppProxy at dispatch time.
 */

import { encryptValue } from './lib/crypto';
import {
  authorizationUrl,
  exchangeCodeForToken,
  fetchGitHubUser,
  signState,
  verifyState,
} from './lib/github';
import {
  SESSION_COOKIE,
  buildClearCookieHeader,
  createSession,
  destroySession,
  readSession,
  sessionCookie,
  type DevSession,
} from './lib/session';

export interface DevEnv {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  ENV_ENCRYPTION_KEY: string;
}

// ── Entry ──────────────────────────────────────────────────────────────────

export async function handleDevRequest(
  request: Request,
  env: DevEnv,
  url: URL,
): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  try {
    if (method === 'GET' && path === '/dev') return indexRedirect(request, env);
    if (method === 'GET' && path === '/dev/login') return loginRedirect(env, url);
    if (method === 'GET' && path === '/dev/callback') return oauthCallback(request, env, url);
    if (method === 'POST' && path === '/dev/logout') return logout(request, env);
    if (method === 'GET' && path === '/dev/dashboard') return dashboardPage(request, env);

    const appMatch = path.match(/^\/dev\/apps\/([a-z0-9-]+)$/);
    if (method === 'GET' && appMatch) return appDashboardPage(request, env, appMatch[1]);

    const envMatch = path.match(/^\/dev\/apps\/([a-z0-9-]+)\/env$/);
    if (method === 'POST' && envMatch) return upsertEnvVar(request, env, envMatch[1]);

    const delMatch = path.match(/^\/dev\/apps\/([a-z0-9-]+)\/env\/delete$/);
    if (method === 'POST' && delMatch) return deleteEnvVar(request, env, delMatch[1]);

    return textResponse('Not found', 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Dev dashboard error:', msg, err);
    return textResponse(`Dashboard error: ${msg}`, 500);
  }
}

// ── OAuth ──────────────────────────────────────────────────────────────────

async function indexRedirect(request: Request, env: DevEnv): Promise<Response> {
  const session = await readSession(env, request);
  return redirect(session ? '/dev/dashboard' : '/dev/login');
}

async function loginRedirect(env: DevEnv, url: URL): Promise<Response> {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return textResponse(
      'GitHub OAuth is not configured (set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET).',
      503,
    );
  }
  const returnTo = url.searchParams.get('next') || '/dev/dashboard';
  const state = await signState(env, returnTo);
  const redirectUri = `${url.origin}/dev/callback`;
  return redirect(authorizationUrl(env, redirectUri, state));
}

async function oauthCallback(request: Request, env: DevEnv, url: URL): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  if (oauthError) return htmlErrorPage('GitHub returned an error', oauthError);
  if (!code || !state) return htmlErrorPage('Invalid callback', 'Missing code or state');

  const verified = await verifyState(env, state);
  if (!verified) return htmlErrorPage('Invalid callback', 'State did not verify');

  const redirectUri = `${url.origin}/dev/callback`;
  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(env, code, redirectUri);
  } catch (err) {
    return htmlErrorPage('GitHub token exchange failed', (err as Error).message);
  }

  let user;
  try {
    user = await fetchGitHubUser(accessToken);
  } catch (err) {
    return htmlErrorPage('Could not fetch GitHub user', (err as Error).message);
  }

  const { cookie } = await createSession(env, user.id, user.login);

  const safeReturn = verified.returnTo.startsWith('/dev/') ? verified.returnTo : '/dev/dashboard';
  return new Response(null, {
    status: 302,
    headers: {
      Location: safeReturn,
      'Set-Cookie': sessionCookie(cookie),
      'Cache-Control': 'no-store',
    },
  });
}

async function logout(request: Request, env: DevEnv): Promise<Response> {
  if (!isSameOrigin(request)) return textResponse('Forbidden', 403);
  const session = await readSession(env, request);
  if (session) await destroySession(env, session.id);
  // Return HTML page with JS redirect instead of 302 — ensures the
  // Set-Cookie header is processed by the browser before navigation.
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Logged out</title></head>` +
    `<body style="background:#0a0a12;color:#e4e4ed;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">` +
    `<p>Signing out…</p>` +
    `<script>setTimeout(function(){window.location.href='/dev/login';},300);</script>` +
    `</body></html>`,
    {
      status: 200,
      headers: {
        'Set-Cookie': buildClearCookieHeader(SESSION_COOKIE),
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

async function dashboardPage(request: Request, env: DevEnv): Promise<Response> {
  const session = await readSession(env, request);
  if (!session) return redirect('/dev/login');

  const apps = await listOwnedApps(env.DB, session.githubLogin);
  const body = renderDashboard(session, apps);
  return htmlResponse(body);
}

async function appDashboardPage(request: Request, env: DevEnv, appId: string): Promise<Response> {
  const session = await readSession(env, request);
  if (!session) return redirect(`/dev/login?next=${encodeURIComponent(`/dev/apps/${appId}`)}`);

  const ownership = await assertOwnership(env.DB, appId, session.githubLogin);
  if (ownership.status !== 'ok') return ownership.response;

  const vars = await env.DB.prepare(
    `SELECT name, updated_at, updated_by FROM app_env_vars WHERE app_id = ? ORDER BY name ASC`,
  )
    .bind(appId)
    .all<{ name: string; updated_at: number; updated_by: string }>();

  const rendered = renderAppPage(session, ownership.app, vars.results ?? []);
  const withFlash = injectFlashFromQuery(rendered, new URL(request.url));
  return htmlResponse(withFlash);
}

async function upsertEnvVar(request: Request, env: DevEnv, appId: string): Promise<Response> {
  if (!isSameOrigin(request)) return textResponse('Forbidden', 403);
  const session = await readSession(env, request);
  if (!session) return redirect('/dev/login');

  const ownership = await assertOwnership(env.DB, appId, session.githubLogin);
  if (ownership.status !== 'ok') return ownership.response;

  const form = await request.formData();
  const rawName = (form.get('name') || '').toString().trim();
  const value = (form.get('value') || '').toString();

  const validation = validateVarName(rawName);
  if (!validation.ok) {
    return appRedirect(appId, { error: validation.reason });
  }
  if (!value) {
    return appRedirect(appId, { error: 'Value cannot be empty' });
  }
  if (value.length > 8 * 1024) {
    return appRedirect(appId, { error: 'Value too long (8 KiB max)' });
  }

  let encrypted: string;
  try {
    encrypted = await encryptValue(value, env.ENV_ENCRYPTION_KEY);
  } catch (err) {
    return appRedirect(appId, { error: `Encryption failed: ${(err as Error).message}` });
  }

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO app_env_vars (app_id, name, value_encrypted, created_at, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(app_id, name) DO UPDATE SET
       value_encrypted = excluded.value_encrypted,
       updated_at      = excluded.updated_at,
       updated_by      = excluded.updated_by`,
  )
    .bind(appId, rawName, encrypted, now, now, session.githubLogin)
    .run();

  return appRedirect(appId, { ok: `Saved ${rawName}` });
}

async function deleteEnvVar(request: Request, env: DevEnv, appId: string): Promise<Response> {
  if (!isSameOrigin(request)) return textResponse('Forbidden', 403);
  const session = await readSession(env, request);
  if (!session) return redirect('/dev/login');

  const ownership = await assertOwnership(env.DB, appId, session.githubLogin);
  if (ownership.status !== 'ok') return ownership.response;

  const form = await request.formData();
  const name = (form.get('name') || '').toString().trim();
  if (!name) return appRedirect(appId, { error: 'Missing name' });

  await env.DB.prepare(`DELETE FROM app_env_vars WHERE app_id = ? AND name = ?`)
    .bind(appId, name)
    .run();

  return appRedirect(appId, { ok: `Deleted ${name}` });
}

// ── DB helpers ─────────────────────────────────────────────────────────────

interface OwnedApp {
  id: string;
  name: string;
  icon_url: string | null;
  repo_owner: string;
  repo_name: string;
  var_count: number;
}

async function listOwnedApps(db: D1Database, githubLogin: string): Promise<OwnedApp[]> {
  const { results } = await db
    .prepare(
      `SELECT a.id, a.name, a.repo_owner, a.repo_name, a.icon_path, a.latest_commit,
              COALESCE((SELECT COUNT(*) FROM app_env_vars e WHERE e.app_id = a.id), 0) AS var_count
       FROM apps a
       JOIN app_owners o ON o.app_id = a.id
       WHERE o.github_login = ? COLLATE NOCASE
         AND a.status = 'active'
       ORDER BY a.name ASC`,
    )
    .bind(githubLogin)
    .all<{
      id: string;
      name: string;
      repo_owner: string;
      repo_name: string;
      icon_path: string;
      latest_commit: string;
      var_count: number;
    }>();

  return (results || []).map((r) => ({
    id: r.id,
    name: r.name,
    repo_owner: r.repo_owner,
    repo_name: r.repo_name,
    icon_url: `https://raw.githubusercontent.com/${r.repo_owner}/${r.repo_name}/${r.latest_commit}/${r.icon_path}`,
    var_count: r.var_count,
  }));
}

type OwnershipResult =
  | { status: 'ok'; app: { id: string; name: string; repo_owner: string; repo_name: string } }
  | { status: 'err'; response: Response };

async function assertOwnership(
  db: D1Database,
  appId: string,
  githubLogin: string,
): Promise<OwnershipResult> {
  const app = await db
    .prepare(`SELECT id, name, repo_owner, repo_name FROM apps WHERE id = ? AND status = 'active'`)
    .bind(appId)
    .first<{ id: string; name: string; repo_owner: string; repo_name: string }>();
  if (!app) return { status: 'err', response: htmlErrorPage('App not found', `${appId} is not registered`) };

  const owned = await db
    .prepare(
      `SELECT 1 FROM app_owners WHERE app_id = ? AND github_login = ? COLLATE NOCASE LIMIT 1`,
    )
    .bind(appId, githubLogin)
    .first();
  if (!owned) {
    return {
      status: 'err',
      response: htmlErrorPage(
        'Forbidden',
        `@${githubLogin} is not in ${appId}'s owners[]. Add them to the manifest.json and open a PR.`,
        403,
      ),
    };
  }
  return { status: 'ok', app };
}

const VAR_NAME_RE = /^[A-Z][A-Z0-9_]{0,63}$/;
const RESERVED_VAR_PREFIXES = ['CF_', 'CLOUDFLARE_', 'CONSTRUCT_'];

function validateVarName(name: string): { ok: true } | { ok: false; reason: string } {
  if (!name) return { ok: false, reason: 'Name is required' };
  if (!VAR_NAME_RE.test(name)) {
    return { ok: false, reason: 'Name must match /^[A-Z][A-Z0-9_]{0,63}$/' };
  }
  for (const prefix of RESERVED_VAR_PREFIXES) {
    if (name.startsWith(prefix)) {
      return { ok: false, reason: `Prefix ${prefix}* is reserved` };
    }
  }
  return { ok: true };
}

// ── Responses / redirects ──────────────────────────────────────────────────

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  });
}

function appRedirect(appId: string, flash: { ok?: string; error?: string }): Response {
  const qs = new URLSearchParams();
  if (flash.ok) qs.set('ok', flash.ok);
  if (flash.error) qs.set('error', flash.error);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return redirect(`/dev/apps/${appId}${suffix}`);
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function isSameOrigin(request: Request): boolean {
  // Defense-in-depth on top of SameSite=Lax.
  const origin = request.headers.get('Origin');
  if (!origin) return true; // same-origin form POSTs omit Origin in some browsers
  try {
    const reqUrl = new URL(request.url);
    return new URL(origin).host === reqUrl.host;
  } catch {
    return false;
  }
}

// ── HTML ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, body: string, session?: DevSession | null): string {
  const header = session
    ? `<div class="user"><span>@${escapeHtml(session.githubLogin)}</span>
         <form action="/dev/logout" method="post" style="display:inline">
           <button class="btn-ghost">Log out</button>
         </form></div>`
    : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · Construct Developer</title>
<style>
:root{--bg:#0a0a12;--fg:#e4e4ed;--muted:rgba(228,228,237,0.6);--faint:rgba(228,228,237,0.35);--surface:rgba(255,255,255,0.04);--surface-hover:rgba(255,255,255,0.07);--border:rgba(255,255,255,0.09);--accent:#6366f1;--danger:#ef4444;--ok:#10b981}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased;min-height:100vh}
.container{max-width:780px;margin:0 auto;padding:32px 20px 96px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
header a{color:var(--fg);text-decoration:none;font-weight:600;font-size:15px}
header .user{display:flex;gap:12px;align-items:center;font-size:13px;color:var(--muted)}
h1{font-size:22px;font-weight:700;margin-bottom:4px}
h2{font-size:15px;font-weight:600;margin-top:32px;margin-bottom:12px;color:var(--fg)}
p.lede{color:var(--muted);font-size:13px;line-height:1.55;margin-bottom:24px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 20px}
.card + .card{margin-top:10px}
.app-row{display:flex;gap:14px;align-items:center;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--fg);transition:background 0.15s}
.app-row + .app-row{margin-top:8px}
.app-row:hover{background:var(--surface-hover)}
.app-row img{width:36px;height:36px;border-radius:8px;background:#222}
.app-row .meta{flex:1;min-width:0}
.app-row .name{font-weight:600;font-size:14px}
.app-row .sub{font-size:12px;color:var(--faint);margin-top:2px}
.app-row .count{font-size:12px;color:var(--muted);background:var(--surface-hover);border:1px solid var(--border);padding:3px 8px;border-radius:999px}
.empty{text-align:center;padding:48px 20px;color:var(--muted);border:1px dashed var(--border);border-radius:12px}
.login-card{max-width:380px;margin:80px auto;text-align:center;padding:32px 28px;background:var(--surface);border:1px solid var(--border);border-radius:14px}
.login-card h1{margin-bottom:8px}
.login-card p{color:var(--muted);font-size:13px;margin-bottom:24px;line-height:1.5}
.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:8px;background:var(--accent);color:#fff;text-decoration:none;border:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:filter 0.15s}
.btn:hover{filter:brightness(1.1)}
.btn-gh{background:#24292f}
.btn-danger{background:transparent;color:var(--danger);border:1px solid rgba(239,68,68,0.3)}
.btn-danger:hover{background:rgba(239,68,68,0.1)}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer}
.btn-ghost:hover{color:var(--fg);background:var(--surface-hover)}
form.inline{display:flex;gap:8px;align-items:center}
label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:500}
input[type=text],input[type=password],textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 11px;color:var(--fg);font-family:"SF Mono",Menlo,monospace;font-size:12.5px;outline:none}
input:focus,textarea:focus{border-color:var(--accent)}
textarea{min-height:80px;resize:vertical}
.row{display:grid;grid-template-columns:220px 1fr auto;gap:10px;align-items:start;padding:12px 0;border-bottom:1px solid var(--border)}
.row:last-child{border-bottom:none}
.row .key{font-family:"SF Mono",Menlo,monospace;font-size:13px;font-weight:600;word-break:break-all}
.row .val{font-family:"SF Mono",Menlo,monospace;font-size:12px;color:var(--faint);letter-spacing:0.5px}
.row .when{font-size:11px;color:var(--faint);margin-top:2px}
.flash{padding:10px 14px;border-radius:8px;margin-bottom:18px;font-size:13px;border:1px solid transparent}
.flash-ok{background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);color:var(--ok)}
.flash-error{background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.3);color:var(--danger)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:640px){.row{grid-template-columns:1fr}.row .when{margin-top:0}.grid{grid-template-columns:1fr}}
code{font-family:"SF Mono",Menlo,monospace;background:var(--surface-hover);padding:1px 5px;border-radius:4px;font-size:12px}
.notice{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.22);border-radius:8px;padding:10px 14px;font-size:12.5px;color:var(--muted);line-height:1.55;margin-bottom:20px}
.notice strong{color:var(--fg)}
</style>
</head><body>
<div class="container">
<header>
  <a href="/dev/dashboard">Construct · Developer</a>
  ${header}
</header>
${body}
</div>
</body></html>`;
}

function renderLogin(): string {
  return layout(
    'Sign in',
    `
<div class="login-card">
  <h1>Developer dashboard</h1>
  <p>Sign in with GitHub to manage env vars for apps you own on the Construct registry.</p>
  <a class="btn btn-gh" href="/dev/login">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38V14.3C3.73 14.77 3.26 13.43 3.26 13.43c-.36-.93-.88-1.17-.88-1.17-.72-.49.05-.48.05-.48.8.06 1.22.82 1.22.82.71 1.21 1.87.86 2.33.66.07-.51.28-.86.5-1.06-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    Continue with GitHub
  </a>
</div>
`,
    null,
  );
}

function renderDashboard(session: DevSession, apps: OwnedApp[]): string {
  const rows = apps.length
    ? apps
        .map(
          (a) => `
<a class="app-row" href="/dev/apps/${escapeHtml(a.id)}">
  <img src="${escapeHtml(a.icon_url || '')}" alt="" onerror="this.style.visibility='hidden'">
  <div class="meta">
    <div class="name">${escapeHtml(a.name)}</div>
    <div class="sub">${escapeHtml(a.id)} · ${escapeHtml(a.repo_owner)}/${escapeHtml(a.repo_name)}</div>
  </div>
  <span class="count">${a.var_count} vars</span>
</a>`,
        )
        .join('')
    : `<div class="empty">
         No apps yet. Add your GitHub login to <code>owners[]</code> in an app's <code>manifest.json</code>,
         open a PR to the <a href="https://github.com/construct-computer/app-registry" style="color:var(--accent)">app registry</a>,
         and this list will populate after merge.
       </div>`;

  return layout(
    'Your apps',
    `
<h1>Your apps</h1>
<p class="lede">Apps where <code>@${escapeHtml(session.githubLogin)}</code> is listed in <code>owners[]</code>.</p>
${rows}
`,
    session,
  );
}

function renderAppPage(
  session: DevSession,
  app: { id: string; name: string; repo_owner: string; repo_name: string },
  vars: Array<{ name: string; updated_at: number; updated_by: string }>,
): string {
  // Flash banner is injected later by injectFlashFromQuery based on ?ok=/?error=
  const flashPlaceholder = '<!--FLASH-->';

  const rows = vars.length
    ? vars
        .map(
          (v) => `
<div class="row">
  <div>
    <div class="key">${escapeHtml(v.name)}</div>
    <div class="when">updated ${new Date(v.updated_at).toISOString().slice(0, 10)} by @${escapeHtml(v.updated_by)}</div>
  </div>
  <div class="val">••••••••••••</div>
  <form method="post" action="/dev/apps/${escapeHtml(app.id)}/env/delete" onsubmit="return confirm('Delete ${escapeHtml(v.name)}?')">
    <input type="hidden" name="name" value="${escapeHtml(v.name)}">
    <button class="btn-danger">Delete</button>
  </form>
</div>`,
        )
        .join('')
    : `<div class="empty" style="padding:24px">No env vars yet.</div>`;

  return layout(
    app.name,
    `
${flashPlaceholder}
<h1>${escapeHtml(app.name)}</h1>
<p class="lede"><code>${escapeHtml(app.id)}</code> · <a href="https://github.com/${escapeHtml(app.repo_owner)}/${escapeHtml(app.repo_name)}" style="color:var(--accent)">repo</a></p>

<div class="notice">
<strong>How your app reads these.</strong> At dispatch time, Construct decrypts <em>only this app's</em> env vars
and injects them as the <code>x-construct-env</code> header (base64-encoded JSON). Your handler parses
<code>ctx.request.headers.get('x-construct-env')</code>. Values are never loaded into the shared Worker
<code>env</code> binding — other apps in the same bundle can't read them.
</div>

<h2>Environment variables</h2>
${rows}

<h2>Add or update a variable</h2>
<div class="card">
  <form method="post" action="/dev/apps/${escapeHtml(app.id)}/env" class="grid">
    <div>
      <label for="name">Name</label>
      <input id="name" name="name" type="text" placeholder="MY_API_KEY" autocomplete="off" required maxlength="64">
    </div>
    <div>
      <label for="value">Value</label>
      <input id="value" name="value" type="password" placeholder="••••••" autocomplete="off" required maxlength="8192">
    </div>
    <div style="grid-column:1/-1;text-align:right">
      <button class="btn" type="submit">Save</button>
    </div>
  </form>
</div>

<p class="lede" style="margin-top:32px">Names must match <code>^[A-Z][A-Z0-9_]{0,63}$</code>. Reserved prefixes: <code>CF_</code>, <code>CLOUDFLARE_</code>, <code>CONSTRUCT_</code>.</p>
`,
    session,
  );
}

function htmlErrorPage(title: string, detail: string, status = 400): Response {
  return new Response(
    layout(
      title,
      `<div class="login-card">
         <h1>${escapeHtml(title)}</h1>
         <p>${escapeHtml(detail)}</p>
         <a class="btn" href="/dev/dashboard">Back to dashboard</a>
       </div>`,
    ),
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

// ── Page-level flash rendering ─────────────────────────────────────────────
// The app page uses a placeholder that the dispatcher replaces with a flash
// banner if the URL has ?ok=... or ?error=... — keeps the per-app render
// function simple while still surfacing form feedback.

export function injectFlashFromQuery(html: string, url: URL): string {
  const ok = url.searchParams.get('ok');
  const err = url.searchParams.get('error');
  if (!ok && !err) return html.replace('<!--FLASH-->', '');
  const flash = err
    ? `<div class="flash flash-error">${escapeHtml(err)}</div>`
    : `<div class="flash flash-ok">${escapeHtml(ok || '')}</div>`;
  return html.replace('<!--FLASH-->', flash);
}

// Convenience re-export for index.ts
export { renderLogin as _renderLoginPage };
