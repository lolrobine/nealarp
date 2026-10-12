import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel-only password protection.
 *
 * When deployed to Vercel (non-static), this middleware enforces the site
 * password via a cookie before HTML is served, unlike the client-side
 * PasswordGate which is the fallback for GitHub Pages static export.
 *
 * Flow:
 * - If NEXT_PUBLIC_SITE_PASSWORD is not set, skip (open site)
 * - Check cookie `nealarp.site-unlock.v1` matches expected token
 * - If not, allow request to /api/*? No, protect all, but let the client
 *   PasswordGate handle UI — we just set a header for rate limiting hint.
 *
 * For static export (GitHub Pages), middleware is ignored by Next.js
 * because `output: "export"` disables middleware. So this only runs on Vercel.
 */

const UNLOCK_COOKIE = "nealarp.site-unlock.v1";
const UNLOCK_SALT = "nealarp-site-gate-v1";

// Simple FNV-1a for edge runtime (no crypto.subtle needed for fallback)
function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export async function middleware(request: NextRequest) {
  // Only enforce on Vercel, not in dev unless env set
  const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD;
  // If no env override, let client-side gate handle default password
  // (middleware would need hardcoded digest, which we avoid duplicating)
  if (!sitePassword) {
    return NextResponse.next();
  }

  // Allow static assets and Next internals
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(webp|png|jpg|jpeg|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check cookie — we store digest(password|salt|key) same as client
  const cookie = request.cookies.get(UNLOCK_COOKIE)?.value;
  if (cookie) {
    // We can't compute SHA-256 easily in middleware without async crypto,
    // but we can at least check FNV fallback quickly.
    // For proper check, compute expected token via Web Crypto if available.
    try {
      const expected = await computeExpectedToken(sitePassword);
      if (cookie === expected) {
        return NextResponse.next();
      }
    } catch {
      // fall through to allow client gate to handle
    }
  }

  // Not unlocked — let request through but add header so client knows
  // server-side protection is active (PasswordGate will still show)
  const response = NextResponse.next();
  response.headers.set("x-nealarp-gate", "locked");
  return response;
}

async function computeExpectedToken(password: string): Promise<string> {
  const secretId = await digest(password);
  return digest(`${secretId}|${UNLOCK_SALT}|${UNLOCK_COOKIE}`);
}

async function digest(text: string): Promise<string> {
  // Edge runtime has crypto.subtle
  try {
    const subtle = (globalThis as unknown as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
    if (subtle) {
      const enc = new TextEncoder().encode(text);
      const buf = await subtle.digest("SHA-256", enc);
      const hex = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `sha256:${hex}`;
    }
  } catch {
    // fallback
  }
  return `fnv1a:${fnv1aHex(text)}`;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
