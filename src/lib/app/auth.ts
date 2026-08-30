// Access-code + session library for the mobile app (PLAN_ MOBILE-APK.md §5)
//
// Code formats:
//   GUEST:     H + 6 digits + 2-char checksum  (e.g. H834729X7)
//   RECEPTION: R + 6 digits + 2-char checksum
//   ADMIN:     A + 6 digits + 2-char checksum
//
// Codes are hashed (SHA-256) before storage. Validation is server-side only.
// Rate limiting: 5 attempts per 60s, lockout after 10 failed attempts.

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars (0,O,1,I)

function randomDigits6(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

// 2-char checksum: alphanum derived from SHA-256 of prefix+6digits, mod alphabet
function checksum(prefix: string, digits: string): string {
  const h = crypto.createHash("sha256").update(`${prefix}${digits}`).digest();
  const c1 = h[0] % ALPHABET.length;
  const c2 = h[1] % ALPHABET.length;
  return `${ALPHABET[c1]}${ALPHABET[c2]}`;
}

export type CodeType = "GUEST" | "RECEPTION" | "ADMIN";

export function generateAccessCode(type: CodeType): { raw: string } {
  const prefix = type === "GUEST" ? "H" : type === "RECEPTION" ? "R" : "A";
  const digits = randomDigits6();
  const sum = checksum(prefix, digits);
  return { raw: `${prefix}${digits}${sum}` };
}

// Validate format (does not check DB). Returns the inferred code type.
export function identifyCodeType(raw: string): CodeType | null {
  if (!raw || raw.length < 9) return null;
  const upper = raw.trim().toUpperCase();
  const prefix = upper[0];
  if (!["H", "R", "A"].includes(prefix)) return null;
  const digits = upper.slice(1, 7);
  if (!/^\d{6}$/.test(digits)) return null;
  const sum = upper.slice(7, 9);
  if (!/^[A-Z0-9]{2}$/.test(sum)) return null;
  // verify checksum
  if (checksum(prefix, digits) !== sum) return null;
  return prefix === "H" ? "GUEST" : prefix === "R" ? "RECEPTION" : "ADMIN";
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------
export function hashAccessCode(raw: string): string {
  return crypto.createHash("sha256").update(raw.trim().toUpperCase()).digest("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Generate a random session token (32 bytes => 64 hex chars)
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per IP + per code-prefix)
// ---------------------------------------------------------------------------
// Tracks attempts per identifier (IP or code prefix). Resets after window.
// In production with multiple instances, move to Redis. For now, in-memory.
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX_ATTEMPTS = 5;
const LOCKOUT_AFTER = 10;

type Attempt = { count: number; firstAt: number; lockedUntil: number | null };
const attempts = new Map<string, Attempt>();

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number; remaining?: number } {
  const now = Date.now();
  const a = attempts.get(identifier) || { count: 0, firstAt: now, lockedUntil: null };
  // Reset window
  if (now - a.firstAt > RATE_WINDOW_MS) {
    a.count = 0;
    a.firstAt = now;
    a.lockedUntil = null;
  }
  if (a.lockedUntil && now < a.lockedUntil) {
    return { allowed: false, retryAfterMs: a.lockedUntil - now };
  }
  if (a.count >= LOCKOUT_AFTER) {
    a.lockedUntil = now + 15 * 60 * 1000; // 15 min lockout
    attempts.set(identifier, a);
    return { allowed: false, retryAfterMs: 15 * 60 * 1000 };
  }
  return { allowed: true, remaining: RATE_MAX_ATTEMPTS - a.count - 1 };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const a = attempts.get(identifier) || { count: 0, firstAt: now, lockedUntil: null };
  if (now - a.firstAt > RATE_WINDOW_MS) {
    a.count = 0;
    a.firstAt = now;
  }
  a.count += 1;
  if (a.count >= LOCKOUT_AFTER) {
    a.lockedUntil = now + 15 * 60 * 1000;
  }
  attempts.set(identifier, a);
}

export function clearAttempts(identifier: string): void {
  attempts.delete(identifier);
}

// ---------------------------------------------------------------------------
// Session token cookie helpers (used by API routes)
// ---------------------------------------------------------------------------
export const SESSION_COOKIE = "hotel_app_session";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12h default

export function setSessionCookie(res: Response, token: string, maxAgeSec: number = SESSION_MAX_AGE_SECONDS): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isProd ? "; Secure" : ""}`;
  res.headers.set("Set-Cookie", cookie);
}

export function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`;
  res.headers.set("Set-Cookie", cookie);
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie") || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k && v.length) out[k] = v.join("=");
  }
  return out;
}
