// GET /api/app/admin/audit?action=...&entityType=...
// Returns last 100 audit log entries (most recent first), with optional filters.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";
  const entityType = url.searchParams.get("entityType") || "";

  const where: { action?: string; entityType?: string } = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const list = logs.map((l) => {
    let parsedDetails: unknown = null;
    try {
      parsedDetails = l.details ? JSON.parse(l.details) : null;
    } catch {
      parsedDetails = l.details;
    }
    return {
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      performedBy: l.performedBy,
      details: parsedDetails,
      createdAt: l.createdAt,
    };
  });

  return NextResponse.json({ ok: true, logs: list });
}
