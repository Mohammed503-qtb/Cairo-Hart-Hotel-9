// GET /api/app/reception/requests
// Returns all requests across in-house stays, ordered by createdAt desc.
// Supports filters: ?status=...&priority=...

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");

  // Status filter accepts multiple comma-separated values (e.g. ?status=NEW,ACKNOWLEDGED)
  const statusList = status ? status.split(",").map((s) => s.trim()).filter(Boolean) : null;

  const where: Record<string, unknown> = {};
  if (statusList && statusList.length) where.status = { in: statusList };
  if (priority) where.priority = priority;

  const requests = await db.guestRequest.findMany({
    where,
    include: {
      stay: { include: { guest: true, room: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      category: r.category,
      service: r.service,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      assignedTo: r.assignedTo,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      cancelledAt: r.cancelledAt,
      guestName: r.stay?.guest?.fullName || "—",
      guestId: r.guestId,
      stayId: r.stayId,
      roomNumber: r.stay?.room?.roomNumber || "—",
      roomId: r.roomId,
    })),
  });
}
