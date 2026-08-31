// POST /api/app/reception/requests/[id]/acknowledge
// Body: (none required). Sets status ACKNOWLEDGED (from NEW).
// Creates event, AppNotification for GUEST (type=REQUEST_ACKNOWLEDGED), audit.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest, isTransitionAllowed } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const request = await loadRequestForTransition(requestId);
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (!isTransitionAllowed(request.status, "ACKNOWLEDGED")) {
      return NextResponse.json({ error: "invalidTransition", from: request.status, to: "ACKNOWLEDGED" }, { status: 400 });
    }
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;
    const guestName = request.stay?.guest?.fullName || "Guest";

    await db.$transaction(async (tx) => {
      await tx.guestRequest.update({
        where: { id: requestId },
        data: { status: "ACKNOWLEDGED" },
      });
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "ACKNOWLEDGED",
          fromStatus: request.status,
          toStatus: "ACKNOWLEDGED",
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `Request acknowledged: ${request.title}`,
          `Your request "${request.title}" has been acknowledged by reception.`, "REQUEST_ACKNOWLEDGED");
      }
      await tx.auditLog.create({
        data: {
          action: "REQUEST_ACKNOWLEDGED",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, guestName, fromStatus: request.status }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "ACKNOWLEDGED" });
  } catch (e) {
    console.error("[reception/acknowledge] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
