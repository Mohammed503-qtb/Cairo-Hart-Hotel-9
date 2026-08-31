// POST /api/app/guest/checkout
// Body: { note? }. Validate: stay CHECKED_IN, no existing PENDING checkout request.
// Create CheckoutRequest (status=PENDING). AppNotification for RECEPTION. Audit log.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  note?: string;
}

export async function POST(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  let body: CheckoutBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty */
  }
  const note = (body.note || "").trim() || null;

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn" }, { status: 400 });
    }

    const existingPending = await db.checkoutRequest.findFirst({
      where: { stayId, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json({ error: "alreadyPending" }, { status: 400 });
    }

    const guestName = stay.guest.fullName;
    const roomNumber = stay.room?.roomNumber || "—";

    const created = await db.$transaction(async (tx) => {
      const cr = await tx.checkoutRequest.create({
        data: {
          stayId,
          guestId: stay.guestId,
          status: "PENDING",
          note,
        },
      });
      await tx.appNotification.create({
        data: {
          recipientRole: "RECEPTION",
          recipientId: "*",
          stayId,
          title: `Checkout request from ${guestName}`,
          body: `Room ${roomNumber} has requested checkout. Please proceed with the formal check-out.`,
          type: "CHECKOUT_REQUESTED",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GUEST_CHECKOUT_REQUEST",
          entityType: "CheckoutRequest",
          entityId: cr.id,
          performedBy: guestName,
          details: JSON.stringify({ stayId, stayNumber: stay.stayNumber, note }),
        },
      });
      return cr;
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: created.id,
        stayId: created.stayId,
        guestId: created.guestId,
        status: created.status,
        requestedAt: created.requestedAt,
        note: created.note,
      },
    });
  } catch (e) {
    console.error("[guest/checkout POST] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
