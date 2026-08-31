// POST /api/app/guest/extension
// Body: { requestedCheckOut, note? }. Validate: stay CHECKED_IN, requestedCheckOut > currentCheckOut.
// Compute additionalNights (days diff) + estimatedCost = additionalNights * room.roomType.basePrice
//   plus tax/service charge using hotel.taxRatePercent + serviceChargePercent.
// Create ExtensionRequest (status=PENDING). AppNotification for RECEPTION. Audit log.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ExtBody {
  requestedCheckOut?: string;
  note?: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function POST(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  let body: ExtBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const requestedCheckOutRaw = (body.requestedCheckOut || "").trim();
  const note = (body.note || "").trim() || null;
  if (!requestedCheckOutRaw) {
    return NextResponse.json({ error: "requestedCheckOutRequired" }, { status: 400 });
  }
  // Accept ISO string or YYYY-MM-DD
  const requestedCheckOut = new Date(requestedCheckOutRaw);
  if (isNaN(requestedCheckOut.getTime())) {
    return NextResponse.json({ error: "invalidDate" }, { status: 400 });
  }

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn" }, { status: 400 });
    }
    const currentCheckOut = startOfDay(stay.checkOut);
    const reqCheckOut = startOfDay(requestedCheckOut);
    if (reqCheckOut.getTime() <= currentCheckOut.getTime()) {
      return NextResponse.json({ error: "mustBeAfterCurrent" }, { status: 400 });
    }
    const additionalNights = Math.max(1, Math.round((reqCheckOut.getTime() - currentCheckOut.getTime()) / MS_PER_DAY));

    const hotel = await db.hotel.findFirst();
    const basePrice = stay.room?.roomType?.basePrice || 0;
    const taxRate = hotel?.taxRatePercent || 0;
    const serviceRate = hotel?.serviceChargePercent || 0;
    const subtotal = basePrice * additionalNights;
    const tax = roundMoney((subtotal * taxRate) / 100);
    const service = roundMoney((subtotal * serviceRate) / 100);
    const estimatedCost = roundMoney(subtotal + tax + service);

    const guestName = stay.guest.fullName;
    const roomNumber = stay.room?.roomNumber || "—";

    const created = await db.$transaction(async (tx) => {
      const ext = await tx.extensionRequest.create({
        data: {
          stayId,
          guestId: stay.guestId,
          currentCheckOut: stay.checkOut,
          requestedCheckOut: reqCheckOut,
          additionalNights,
          estimatedCost,
          note,
          status: "PENDING",
        },
      });
      await tx.appNotification.create({
        data: {
          recipientRole: "RECEPTION",
          recipientId: "*",
          stayId,
          title: `Extension request from ${guestName}`,
          body: `Room ${roomNumber} wants to extend stay by ${additionalNights} night(s) until ${reqCheckOut.toISOString().slice(0, 10)}. Estimated cost: ${estimatedCost}.`,
          type: "EXTENSION_REQUESTED",
        },
      });
      await tx.auditLog.create({
        data: {
          action: "GUEST_EXTENSION_REQUEST",
          entityType: "ExtensionRequest",
          entityId: ext.id,
          performedBy: guestName,
          details: JSON.stringify({
            stayId,
            stayNumber: stay.stayNumber,
            currentCheckOut: stay.checkOut,
            requestedCheckOut: reqCheckOut,
            additionalNights,
            estimatedCost,
            basePrice,
          }),
        },
      });
      return ext;
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: created.id,
        stayId: created.stayId,
        guestId: created.guestId,
        currentCheckOut: created.currentCheckOut,
        requestedCheckOut: created.requestedCheckOut,
        additionalNights: created.additionalNights,
        estimatedCost: created.estimatedCost,
        note: created.note,
        status: created.status,
        createdAt: created.createdAt,
      },
    });
  } catch (e) {
    console.error("[guest/extension POST] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
