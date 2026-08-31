// POST /api/app/guest/requests/[id]/message
// Body: { body }. Adds a NOTE event (performedByRole=GUEST, performedBy=guest.fullName).
// AppNotification for RECEPTION (recipientId="*", type=NEW_MESSAGE).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

interface MessageBody {
  body?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const { id: requestId } = await params;
  let body: MessageBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const messageBody = (body.body || "").trim();
  if (!messageBody) return NextResponse.json({ error: "bodyRequired" }, { status: 400 });

  try {
    const request = await db.guestRequest.findUnique({
      where: { id: requestId },
      include: { stay: { include: { guest: true, room: true } } },
    });
    if (!request) return NextResponse.json({ error: "requestNotFound" }, { status: 404 });
    if (request.stayId !== stayId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const guestName = request.stay?.guest?.fullName || "Guest";
    const roomNumber = request.stay?.room?.roomNumber || "—";

    await db.$transaction(async (tx) => {
      await tx.guestRequestEvent.create({
        data: {
          requestId,
          eventType: "NOTE",
          note: messageBody,
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
          title: `New message about: ${request.title}`,
          body: `Room ${roomNumber} — ${guestName}: ${messageBody}`,
          type: "NEW_MESSAGE",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GUEST_REQUEST_NOTE",
          entityType: "GuestRequest",
          entityId: requestId,
          performedBy: guestName,
          details: JSON.stringify({ requestId, stayId, body: messageBody }),
        },
      });
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    console.error("[guest/requests/message] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
