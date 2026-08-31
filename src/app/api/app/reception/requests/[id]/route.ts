// GET /api/app/reception/requests/[id]
// Returns a single request with its full event timeline (asc order).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const request = await db.guestRequest.findUnique({
    where: { id },
    include: {
      stay: { include: { guest: true, room: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });

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
      attachmentUrl: request.attachmentUrl,
      relatedChargeId: request.relatedChargeId,
      completedAt: request.completedAt,
      cancelledAt: request.cancelledAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      stay: request.stay
        ? {
            id: request.stay.id,
            stayNumber: request.stay.stayNumber,
            guest: request.stay.guest
              ? { id: request.stay.guest.id, fullName: request.stay.guest.fullName, phone: request.stay.guest.phone }
              : null,
          }
        : null,
      room: request.stay?.room ? { id: request.stay.room.id, roomNumber: request.stay.room.roomNumber, floor: request.stay.room.floor } : null,
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
