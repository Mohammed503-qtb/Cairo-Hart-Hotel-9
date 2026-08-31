// POST /api/app/reception/requests/[id]/progress
// Body: { note? }. Sets status IN_PROGRESS.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest, isTransitionAllowed } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

interface ProgressBody {
  note?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: ProgressBody = {};
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
    if (!isTransitionAllowed(request.status, "IN_PROGRESS")) {
      return NextResponse.json({ error: "invalidTransition", from: request.status, to: "IN_PROGRESS" }, { status: 400 });
    }
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;
    const guestName = request.stay?.guest?.fullName || "Guest";

    await db.$transaction(async (tx) => {
      await tx.guestRequest.update({
        where: { id: requestId },
        data: { status: "IN_PROGRESS" },
      });
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "IN_PROGRESS",
          fromStatus: request.status,
          toStatus: "IN_PROGRESS",
          note: note || undefined,
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `Request in progress: ${request.title}`,
          `Your request "${request.title}" is now in progress.${note ? ` ${note}` : ""}`, "REQUEST_IN_PROGRESS");
      }
      await tx.auditLog.create({
        data: {
          action: "REQUEST_IN_PROGRESS",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, guestName, note }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId, status: "IN_PROGRESS" });
  } catch (e) {
    console.error("[reception/progress] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
