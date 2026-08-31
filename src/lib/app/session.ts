// Shared session helpers for /api/app/* routes.
// Reads the session cookie, looks up the GuestSession by token hash, and
// returns the resolved persona context (GUEST/RECEPTION/ADMIN + stay/staff).
//
// Usage in an API route:
//   const ctx = await requireSession(req, "GUEST");
//   if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

import { db } from "@/lib/db";
import { hashToken, parseCookies, SESSION_COOKIE } from "@/lib/app/auth";
import type { NextRequest } from "next/server";

export type Persona = "GUEST" | "RECEPTION" | "ADMIN";

export interface SessionContext {
  ok: true;
  sessionId: string;
  codeId: string;
  persona: Persona;
  stayId?: string;
  staffId?: string;
  role?: string; // for RECEPTION/ADMIN: RECEPTION | ADMIN | MASTER_ADMIN
}

export interface SessionError {
  ok: false;
  error: string;
  status: number;
}

export async function resolveSession(req: Request | NextRequest): Promise<SessionContext | SessionError> {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return { ok: false, error: "no_session", status: 401 };

  const tokenHash = hashToken(token);
  const session = await db.guestSession.findUnique({
    where: { tokenHash },
    include: { accessCode: true },
  });
  if (!session) return { ok: false, error: "invalid_session", status: 401 };
  if (session.revokedAt) return { ok: false, error: "session_revoked", status: 401 };
  if (session.expiresAt.getTime() < Date.now()) return { ok: false, error: "session_expired", status: 401 };
  if (session.accessCode.status !== "ACTIVE") return { ok: false, error: "code_revoked", status: 401 };

  // Touch lastSeen
  await db.guestSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });

  return {
    ok: true,
    sessionId: session.id,
    codeId: session.codeId,
    persona: session.persona as Persona,
    stayId: session.stayId ?? undefined,
    staffId: session.staffId ?? undefined,
    role: session.accessCode.role ?? undefined,
  };
}

export async function requireSession(req: Request | NextRequest, persona: Persona | Persona[]): Promise<SessionContext | SessionError> {
  const ctx = await resolveSession(req);
  if (!ctx.ok) return ctx;
  const allowed = Array.isArray(persona) ? persona : [persona];
  if (!allowed.includes(ctx.persona)) return { ok: false, error: "forbidden", status: 403 };
  return ctx;
}
