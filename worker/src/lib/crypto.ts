/**
 * Crypto helpers for the registry worker.
 *
 *   AES-256-GCM — encrypts per-app env var values at rest.
 *   HMAC-SHA256 — signs session cookies + OAuth state tokens.
 *
 * Keys are read from Worker secrets (ENV_ENCRYPTION_KEY / SESSION_SECRET).
 * Both accept any string length — we SHA-256-hash to derive a fixed-size key
 * so rotating by any random string "just works" without re-encrypting.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

// ── base64url (no padding) ────────────────────────────────────────────────

export function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const raw = atob(s);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

async function importAesKey(secret: string): Promise<CryptoKey> {
  const keyBytes = await sha256(enc.encode(secret));
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

// ── AES-GCM (for env var values) ──────────────────────────────────────────

export async function encryptValue(plaintext: string, secret: string): Promise<string> {
  if (!secret) throw new Error('ENV_ENCRYPTION_KEY is not configured');
  const key = await importAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)),
  );
  // Pack as `v1.<iv>.<ct>` so we can rotate the format later without
  // re-encrypting everything.
  return `v1.${b64urlEncode(iv)}.${b64urlEncode(ct)}`;
}

export async function decryptValue(payload: string, secret: string): Promise<string> {
  if (!secret) throw new Error('ENV_ENCRYPTION_KEY is not configured');
  const parts = payload.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('Unknown ciphertext format');
  }
  const key = await importAesKey(secret);
  const iv = b64urlDecode(parts[1]);
  const ct = b64urlDecode(parts[2]);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(pt);
}

// ── HMAC (for signed cookies + OAuth state) ──────────────────────────────

export async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  return b64urlEncode(sig);
}

export async function hmacVerify(
  message: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    return await crypto.subtle.verify('HMAC', key, b64urlDecode(signature), enc.encode(message));
  } catch {
    return false;
  }
}

// ── Random ids ────────────────────────────────────────────────────────────

export function randomToken(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}
