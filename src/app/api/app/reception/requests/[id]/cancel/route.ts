// POST /api/app/reception/requests/[id]/cancel
// Body: { reason }. Sets status CANCELLED, cancelledAt=now.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest, isTransitionAllowed } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

interface CancelBody {
  reason?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: CancelBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const reason = (body.reason || "").trim();
  if (!reason) return NextResponse.json({ error: "reasonRequired" }, { status: 400 });

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const request = await loadRequestForTransition(requestId);
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (!isTransitionAllowed(request.status, "CANCELLED")) {
      return NextResponse.json({ error: "invalidTransition", from: request.status, to: "CANCELLED" }, { status: 400 });
    }
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;
    const guestName = request.stay?.guest?.fullName || "Guest";

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
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `Request cancelled: ${request.title}`,
          `Your request "${request.title}" has been cancelled. Reason: ${reason}`, "REQUEST_CANCELLED");
      }
      await tx.auditLog.create({
        data: {
          action: "REQUEST_CANCELLED",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, guestName, reason }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "CANCELLED" });
  } catch (e) {
    console.error("[reception/cancel] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
