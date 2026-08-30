// POST /api/app/auth/logout
// Revokes the current session and clears the cookie.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearSessionCookie } from "@/lib/app/auth";
import { resolveSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await resolveSession(req);
  if (!ctx.ok) {
    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res);
    return res;
  }
  await db.guestSession.update({
    where: { id: ctx.sessionId },
    data: { revokedAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      action: "APP_LOGOUT",
      entityType: "GuestSession",
      entityId: ctx.sessionId,
      performedBy: ctx.persona,
      details: JSON.stringify({ persona: ctx.persona }),
    },
  });
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
