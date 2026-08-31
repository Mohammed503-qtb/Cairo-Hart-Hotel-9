// POST /api/app/guest/requests/[id]/cancel
// Body: { reason? }. Only allowed if status is NEW or ACKNOWLEDGED.
// Sets status=CANCELLED, cancelledAt=now. Creates CANCELLED event (performedByRole=GUEST).
// AppNotification for RECEPTION (recipientId="*"). Audit log.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

interface CancelBody {
  reason?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const { id: requestId } = await params;
  let body: CancelBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const reason = (body.reason || "").trim() || null;

  try {
    const request = await db.guestRequest.findUnique({
      where: { id: requestId },
      include: { stay: { include: { guest: true, room: true } } },
    });
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (request.stayId !== stayId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (request.status !== "NEW" && request.status !== "ACKNOWLEDGED") {
      return NextResponse.json({ error: "cannotCancel" }, { status: 400 });
    }

    const guestName = request.stay?.guest?.fullName || "Guest";
    const roomNumber = request.stay?.room?.roomNumber || "—";

    await db.$transaction(async (tx) => {
      await tx.guestRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "CANCELLED",
          fromStatus: request.status,
          toStatus: "CANCELLED",
          note: reason,
          performedBy: guestName,
          performedByRole: "GUEST",
        },
      });
      await tx.appNotification.create({
        data: {
          recipientRole: "RECEPTION",
          recipientId: "*",
          stayId,
          requestId,
          title: `Request cancelled: ${request.title}`,
          body: `Room ${roomNumber} — ${guestName} cancelled request #${request.requestNumber}.`,
          type: "REQUEST_CANCELLED",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GUEST_REQUEST_CANCELLED",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: guestName,
          details: JSON.stringify({ requestId, stayId, reason }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "CANCELLED" });
  } catch (e) {
    console.error("[guest/requests/cancel] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
