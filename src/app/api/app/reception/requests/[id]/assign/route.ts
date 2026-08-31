// POST /api/app/reception/requests/[id]/assign
// Body: { assignedTo }. Sets status ASSIGNED + assignedTo field.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest, isTransitionAllowed } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

interface AssignBody {
  assignedTo?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: AssignBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const assignedTo = (body.assignedTo || "").trim();
  if (!assignedTo) return NextResponse.json({ error: "assignedToRequired" }, { status: 400 });

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const request = await loadRequestForTransition(requestId);
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (!isTransitionAllowed(request.status, "ASSIGNED")) {
      return NextResponse.json({ error: "invalidTransition", from: request.status, to: "ASSIGNED" }, { status: 400 });
    }
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;
    const guestName = request.stay?.guest?.fullName || "Guest";

    await db.$transaction(async (tx) => {
      await tx.guestRequest.update({
        where: { id: requestId },
        data: { status: "ASSIGNED", assignedTo },
      });
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "ASSIGNED",
          fromStatus: request.status,
          toStatus: "ASSIGNED",
          note: `Assigned to ${assignedTo}`,
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `Request assigned: ${request.title}`,
          `Your request "${request.title}" has been assigned to ${assignedTo}.`, "REQUEST_ASSIGNED");
      }
      await tx.auditLog.create({
        data: {
          action: "REQUEST_ASSIGNED",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, guestName, assignedTo }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "ASSIGNED", assignedTo });
  } catch (e) {
    console.error("[reception/assign] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
