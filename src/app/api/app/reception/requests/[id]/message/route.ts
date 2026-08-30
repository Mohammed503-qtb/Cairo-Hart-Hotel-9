// POST /api/app/reception/requests/[id]/message
// Body: { body }. Adds a NOTE event (performedByRole=RECEPTION, performedBy = staff name).
// AppNotification for GUEST (type=NEW_MESSAGE).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { loadRequestForTransition, notifyGuest } from "@/lib/app/request-actions";

export const dynamic = "force-dynamic";

interface MessageBody {
  body?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  let body: MessageBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const messageBody = (body.body || "").trim();
  if (!messageBody) return NextResponse.json({ error: "bodyRequired" }, { status: 400 });

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const request = await loadRequestForTransition(requestId);
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    const guestId = request.stay?.guestId || request.guestId;
    const stayId = request.stayId;

    await db.$transaction(async (tx) => {
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "NOTE",
          note: messageBody,
          performedBy: staffName,
          performedByRole: "RECEPTION",
        },
      });
      if (guestId) {
        await notifyGuest(tx, guestId, stayId, requestId, `New message about: ${request.title}`,
          messageBody, "NEW_MESSAGE");
      }
      await tx.auditLog.create({
        data: {
          action: "REQUEST_NOTE",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: staffName,
          details: JSON.stringify({ requestId, body: messageBody }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    console.error("[reception/message] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
