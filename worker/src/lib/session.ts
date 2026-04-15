/**
 * Dev-dashboard sessions.
 *
 * A session is a DB row keyed by an opaque session id, combined with an
 * HttpOnly signed cookie. The cookie value is `<sessionId>.<hmac>` — the
 * signature is computed over the session id + expiry using SESSION_SECRET,
 * so a stolen session id alone is not enough to impersonate the user (the
 * attacker also needs to derive the HMAC, which requires the secret).
 *
 * Sessions live for 7 days and are deleted on explicit logout.
 */

import { hmacSign, hmacVerify, randomToken } from './crypto';

export const SESSION_COOKIE = 'construct_dev_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface DevSession {
  id: string;
  githubUserId: number;
  githubLogin: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionDeps {
  DB: D1Database;
  SESSION_SECRET: string;
}

export async function createSession(
  env: SessionDeps,
  githubUserId: number,
  githubLogin: string,
): Promise<{ session: DevSession; cookie: string }> {
  const id = randomToken(24);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await env.DB.prepare(
    `INSERT INTO dev_sessions (id, github_user_id, github_login, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, githubUserId, githubLogin, now, expiresAt)
    .run();

  const signature = await hmacSign(`${id}.${expiresAt}`, env.SESSION_SECRET);
  const cookie = `${id}.${expiresAt}.${signature}`;

  return {
    session: { id, githubUserId, githubLogin, createdAt: now, expiresAt },
    cookie,
  };
}

export async function readSession(
  env: SessionDeps,
  request: Request,
): Promise<DevSession | null> {
  const cookie = getCookie(request, SESSION_COOKIE);
  if (!cookie) return null;

  const parts = cookie.split('.');
  if (parts.length !== 3) return null;
  const [id, expiresStr, signature] = parts;
  const expiresAt = parseInt(expiresStr, 10);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const signedOk = await hmacVerify(`${id}.${expiresAt}`, signature, env.SESSION_SECRET);
  if (!signedOk) return null;

  const row = await env.DB.prepare(
    `SELECT id, github_user_id, github_login, created_at, expires_at
     FROM dev_sessions WHERE id = ? AND expires_at > ?`,
  )
    .bind(id, Date.now())
    .first<{
      id: string;
      github_user_id: number;
      github_login: string;
      created_at: number;
      expires_at: number;
    }>();

  if (!row) return null;
  return {
    id: row.id,
    githubUserId: row.github_user_id,
    githubLogin: row.github_login,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function destroySession(env: SessionDeps, sessionId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM dev_sessions WHERE id = ?`).bind(sessionId).run();
}

// ── Cookies ───────────────────────────────────────────────────────────────

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function buildCookieHeader(name: string, value: string, maxAgeMs: number): string {
  const maxAge = Math.floor(maxAgeMs / 1000);
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function buildClearCookieHeader(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sessionCookie(cookie: string): string {
  return buildCookieHeader(SESSION_COOKIE, cookie, SESSION_TTL_MS);
}
