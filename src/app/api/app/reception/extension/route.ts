// GET /api/app/reception/extension
// Lists pending extension requests (status PENDING), newest first.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const requests = await db.extensionRequest.findMany({
    where: { status: "PENDING" },
    include: {
      stay: { include: { guest: true, room: { include: { roomType: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      currentCheckOut: r.currentCheckOut,
      requestedCheckOut: r.requestedCheckOut,
      additionalNights: r.additionalNights,
      estimatedCost: r.estimatedCost,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt,
      stay: r.stay
        ? {
            id: r.stay.id,
            stayNumber: r.stay.stayNumber,
            guestName: r.stay.guest?.fullName || "—",
            roomNumber: r.stay.room?.roomNumber || "—",
            roomTypeName: r.stay.room?.roomType?.nameEn || null,
          }
        : null,
    })),
  });
}
