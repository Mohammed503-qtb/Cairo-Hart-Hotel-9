// GET /api/app/guest/requests/[id]
// Returns a single request with its full event timeline (asc order).
// Validates the request belongs to the session's stay.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const { id } = await params;

  const request = await db.guestRequest.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
  if (request.stayId !== stayId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    request: {
      id: request.id,
      requestNumber: request.requestNumber,
      category: request.category,
      service: request.service,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      assignedTo: request.assignedTo,
      preferredTime: request.preferredTime,
      relatedChargeId: request.relatedChargeId,
      completedAt: request.completedAt,
      cancelledAt: request.cancelledAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      events: request.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        performedBy: e.performedBy,
        performedByRole: e.performedByRole,
        createdAt: e.createdAt,
      })),
    },
  });
}
