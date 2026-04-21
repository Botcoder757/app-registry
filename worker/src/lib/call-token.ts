/**
 * Signed call tokens — mint side (registry worker).
 *
 * The registry is the only component that mints these tokens: when it
 * dispatches a /mcp request to a bundled app handler, it stamps the
 * request with a short-lived HS256 JWT so the app SDK can call back
 * into the construct-worker gateway on behalf of the user.
 *
 * Verification lives in the construct worker at /v1/gateway. Both
 * workers share the same `CALL_TOKEN_SECRET` secret.
 */

export interface CallTokenClaims {
  sub: string
  aud: string
  depth: number
  iat: number
  exp: number
  iss: string
  jti?: string
}

const ISSUER = 'construct-worker'
const ALG = 'HS256'
const DEFAULT_TTL_SECONDS = 120

function base64UrlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlEncodeString(text: string): string {
  return base64UrlEncode(new TextEncoder().encode(text))
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export interface MintOptions {
  userId: string
  appId: string
  depth: number
  ttlSeconds?: number
  jti?: string
}

/** Mint a signed call token. */
export async function mintCallToken(secret: string, opts: MintOptions): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const claims: CallTokenClaims = {
    sub: opts.userId,
    aud: opts.appId,
    depth: opts.depth,
    iat: now,
    exp: now + (opts.ttlSeconds ?? DEFAULT_TTL_SECONDS),
    iss: ISSUER,
    ...(opts.jti ? { jti: opts.jti } : {}),
  }

  const header = base64UrlEncodeString(JSON.stringify({ alg: ALG, typ: 'JWT' }))
  const payload = base64UrlEncodeString(JSON.stringify(claims))
  const signingInput = `${header}.${payload}`

  const key = await importKey(secret)
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  const signature = base64UrlEncode(new Uint8Array(sigBuf))

  return `${signingInput}.${signature}`
}
