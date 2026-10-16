/**
 * Site-wide password gate (client side).
 *
 * The site is deployed as a **static export** to GitHub Pages (`output:
 * "export"` in next.config.ts), so there is no server runtime that could
 * verify a password before serving HTML. The gate therefore runs in the
 * browser: every page stays hidden behind the unlock screen in
 * lib/components/PasswordGate.tsx until the visitor enters the site password.
 *
 * Security note: this keeps casual visitors out, but it is not real access
 * control — the pages are still part of the published static bundle, so a
 * determined person can read them (and could brute-force the digest below).
 * If this site is ever deployed somewhere with a server (Vercel, `next
 * start`), add a `middleware.ts` that enforces the password before HTML is
 * served; this module can remain as the GitHub Pages fallback.
 *
 * ── Changing the password ────────────────────────────────────────────────
 * Only digests are stored here, never the password itself, so the password is
 * not readable in the page source. To change it, run:
 *
 *   pnpm password:hash "my new password"
 *
 * and paste the two digests it prints into DEFAULT_PASSWORD_SHA256 and
 * DEFAULT_PASSWORD_FNV1A below.
 *
 * Alternatively set NEXT_PUBLIC_SITE_PASSWORD at build time to override the
 * built-in password without touching code — note that value does end up
 * verbatim in the built bundle:
 *
 *   NEXT_PUBLIC_SITE_PASSWORD="my new password" pnpm build
 */

/** localStorage key holding the "this browser is unlocked" token. */
export const UNLOCK_STORAGE_KEY = "nealarp.site-unlock.v1";

/** Mixed into the unlock token so the stored value is unique to this gate. */
const UNLOCK_SALT = "nealarp-site-gate-v1";

/**
 * SHA-256 hex digest of the current site password ("nealarp").
 * Generate a new digest with `pnpm password:hash "<new password>"`.
 */
const DEFAULT_PASSWORD_SHA256 = "fecc1595b9a008f8628d9986cc872df7e1ce77e927483fe2fc513c66db144070";

/**
 * FNV-1a 32-bit hex digest of the same password. Browsers only expose
 * `crypto.subtle` in a secure context (https, localhost); this weaker digest
 * keeps the gate usable on plain-http origins instead of locking everyone out.
 */
const DEFAULT_PASSWORD_FNV1A = "c1f78782";

/** Build-time override (inlined by Next.js, see the note above). */
const ENV_PASSWORD =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_PASSWORD : undefined;

function envPassword(): string | undefined {
  const value = typeof ENV_PASSWORD === "string" ? ENV_PASSWORD.trim() : "";
  return value.length > 0 ? value : undefined;
}

function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

/** SHA-256 hex, or `null` when Web Crypto is unavailable (insecure context). */
async function sha256Hex(text: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return toHex(new Uint8Array(digest));
  } catch {
    return null;
  }
}

/** FNV-1a 32-bit hex digest — fallback for contexts without Web Crypto. */
export function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Salted digest of `text`, tagged with the algorithm that produced it:
 * `sha256:<hex>` when Web Crypto is available, `fnv1a:<hex>` otherwise.
 * Comparing the tagged strings keeps the two algorithms from ever being
 * mistaken for one another.
 */
async function digest(text: string): Promise<string> {
  const sha256 = await sha256Hex(text);
  return sha256 ? `sha256:${sha256}` : `fnv1a:${fnv1aHex(text)}`;
}

/**
 * Checks a visitor's input (surrounding whitespace is ignored) against the
 * site password. Hashing is async because Web Crypto's digest is async.
 */
export async function verifyPassword(input: string): Promise<boolean> {
  const candidate = input.trim();
  if (!candidate) return false;

  const actual = await digest(candidate);

  const override = envPassword();
  if (override) return actual === (await digest(override));

  return (
    actual === `sha256:${DEFAULT_PASSWORD_SHA256}` || actual === `fnv1a:${DEFAULT_PASSWORD_FNV1A}`
  );
}

/** Identifies the password currently accepted by this build. */
async function secretId(): Promise<string> {
  const override = envPassword();
  return override ? digest(override) : `sha256:${DEFAULT_PASSWORD_SHA256}`;
}

/**
 * Value stored in localStorage once a browser has unlocked the site. It is
 * derived from the password digest rather than being a plain `true` flag, but
 * see the security note at the top of this file: none of this replaces real
 * server-side auth.
 */
export async function unlockToken(): Promise<string> {
  return digest(`${await secretId()}|${UNLOCK_SALT}|${UNLOCK_STORAGE_KEY}`);
}

/** True when this browser has already unlocked the site. */
export async function isUnlocked(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(UNLOCK_STORAGE_KEY);
    return stored !== null && stored === (await unlockToken());
  } catch {
    // localStorage unavailable (private mode, blocked storage, …) → ask again.
    return false;
  }
}

/** Remembers the unlock so the password is only asked once per browser. */
export async function rememberUnlock(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNLOCK_STORAGE_KEY, await unlockToken());
  } catch {
    // Not fatal: this page view simply stays unlocked without being remembered.
  }
}

/** Locks the site again on this browser. */
export function forgetUnlock(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    // ignore
  }
}
