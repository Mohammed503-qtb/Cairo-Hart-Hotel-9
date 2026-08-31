// POST /api/app/reception/requests/[id]/complete
// Body: { note? }. Sets status COMPLETED, completedAt=now.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest, isTransitionAllowed } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

interface CompleteBody {
  note?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: CompleteBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const note = (body.note || "").trim();

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const request = await loadRequestForTransition(requestId);
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (!isTransitionAllowed(request.status, "COMPLETED")) {
      return NextResponse.json({ error: "invalidTransition", from: request.status, to: "COMPLETED" }, { status: 400 });
    }
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;
    const guestName = request.stay?.guest?.fullName || "Guest";

    await db.$transaction(async (tx) => {
      await tx.guestRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "COMPLETED",
          fromStatus: request.status,
          toStatus: "COMPLETED",
          note: note || undefined,
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `Request completed: ${request.title}`,
          `Your request "${request.title}" has been completed.${note ? ` ${note}` : ""}`, "REQUEST_COMPLETED");
      }
      // If the request has a related charge, leave it as-is (final state implicit on COMPLETED).
      await tx.auditLog.create({
        data: {
          action: "REQUEST_COMPLETED",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, guestName, note }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "COMPLETED" });
  } catch (e) {
    console.error("[reception/complete] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
