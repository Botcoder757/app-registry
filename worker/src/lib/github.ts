/**
 * GitHub OAuth — standard authorization_code flow.
 *
 * `state` is a signed HMAC token of `<nonce>.<returnTo>.<expiry>` so the
 * callback can prove the redirect originated from our /dev/login handler
 * without needing server-side storage.
 */

import { hmacSign, hmacVerify, randomToken, b64urlEncode, b64urlDecode } from './crypto';

const enc = new TextEncoder();
const dec = new TextDecoder();

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface GitHubOAuthDeps {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}

export function authorizationUrl(
  env: Pick<GitHubOAuthDeps, 'GITHUB_CLIENT_ID'>,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
    allow_signup: 'true',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function signState(
  env: Pick<GitHubOAuthDeps, 'SESSION_SECRET'>,
  returnTo: string,
): Promise<string> {
  const nonce = randomToken(12);
  const expiresAt = Date.now() + STATE_TTL_MS;
  const payload = JSON.stringify({ n: nonce, r: returnTo, e: expiresAt });
  const payloadB64 = b64urlEncode(enc.encode(payload));
  const sig = await hmacSign(payloadB64, env.SESSION_SECRET);
  return `${payloadB64}.${sig}`;
}

export async function verifyState(
  env: Pick<GitHubOAuthDeps, 'SESSION_SECRET'>,
  state: string,
): Promise<{ returnTo: string } | null> {
  const [payloadB64, sig] = state.split('.');
  if (!payloadB64 || !sig) return null;
  if (!(await hmacVerify(payloadB64, sig, env.SESSION_SECRET))) return null;
  try {
    const payload = JSON.parse(dec.decode(b64urlDecode(payloadB64))) as {
      n: string;
      r: string;
      e: number;
    };
    if (payload.e < Date.now()) return null;
    return { returnTo: payload.r };
  } catch {
    return null;
  }
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
}

export async function exchangeCodeForToken(
  env: GitHubOAuthDeps,
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GitHub token exchange error: ${data.error || 'unknown'}`);
  }
  return data.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'construct-app-registry',
    },
  });
  if (!res.ok) throw new Error(`GitHub user fetch failed: ${res.status}`);
  return (await res.json()) as GitHubUser;
}
