// POST /api/app/reception/arrivals/[id]/checkin
// Body: { roomId: string, idNumber?: string, note?: string }
// Performs the check-in workflow inside a transaction:
//   - Validate reservation (status, check-in date)
//   - Validate room (matching roomTypeId, status AVAILABLE or RESERVED)
//   - Create Stay (status CHECKED_IN, balance = grandTotal - paidTotal)
//   - Update reservation → CHECKED_IN
//   - Update room → OCCUPIED, write RoomStatusHistory
//   - Create room charge (category=ROOM, source=ROOM, qty=nights, unitPrice=items[0].nightlyRate, grossAmount=subtotal, netAmount=subtotal)
//   - Generate GUEST access code (raw returned once), hash, create AccessCode validUntil=end of checkout day
//   - Create StayStatusHistory (EXPECTED → CHECKED_IN)
//   - Create AppNotification for ADMIN (type=CHECKIN)
//   - Audit log (action=CHECK_IN)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { generateAccessCode, hashAccessCode } from "@/lib/app/auth";
import { startOfDay, addDays, roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface CheckinBody {
  roomId?: string;
  idNumber?: string;
  note?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: reservationId } = await params;
  let body: CheckinBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const roomId = (body.roomId || "").trim();
  const idNumber = (body.idNumber || "").trim();
  const note = (body.note || "").trim();
  if (!roomId) return NextResponse.json({ error: "roomIdRequired" }, { status: 400 });

  const staffId = ctx.staffId!;
  // Resolve staff name once (outside transaction to keep transaction lean)
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    // ── Validate reservation ────────────────────────────────────────
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true, items: { include: { roomType: true } } },
    });
    if (!reservation) return NextResponse.json({ error: "reservationNotFound" }, { status: 404 });
    if (!["CONFIRMED", "PAYMENT_PENDING"].includes(reservation.status)) {
      return NextResponse.json({ error: "invalidReservationStatus", status: reservation.status }, { status: 400 });
    }
    // Check-in date must be today (or already today)
    const todayStart = startOfDay(new Date());
    const todayEnd = startOfDay(addDays(new Date(), 1));
    const ci = startOfDay(reservation.checkIn);
    if (ci.getTime() < todayStart.getTime()) {
      // Allow late check-in for past-dated reservations: still permit
      // (front desk may be running catch-up) but record original date.
    }
    if (ci.getTime() >= todayEnd.getTime()) {
      return NextResponse.json({ error: "checkInNotToday" }, { status: 400 });
    }

    if (!reservation.items.length) {
      return NextResponse.json({ error: "noItems" }, { status: 400 });
    }
    const firstItem = reservation.items[0];
    const roomTypeId = firstItem.roomTypeId;

    // ── Validate room ──────────────────────────────────────────────
    const room = await db.physicalRoom.findUnique({
      where: { id: roomId },
      include: { roomType: true },
    });
    if (!room) return NextResponse.json({ error: "roomNotFound" }, { status: 404 });
    if (room.roomTypeId !== roomTypeId) {
      return NextResponse.json({
        error: "roomTypeMismatch",
        expected: roomTypeId,
        actual: room.roomTypeId,
      }, { status: 400 });
    }
    if (!["AVAILABLE", "RESERVED"].includes(room.status)) {
      return NextResponse.json({ error: "roomNotAvailable", status: room.status }, { status: 400 });
    }

    // ── Generate guest access code (raw will be returned once) ────
    const code = generateAccessCode("GUEST");
    const codeHash = hashAccessCode(code.raw);
    // Valid until end of checkout day (23:59 local)
    const checkoutDay = startOfDay(reservation.checkOut);
    const validUntil = addDays(checkoutDay, 1); // startOfNextDay

    // Stay number ST-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const existingCount = await db.stay.count({
      where: { stayNumber: { startsWith: `ST-${year}-` } },
    });
    const stayNumber = `ST-${year}-${String(existingCount + 1).padStart(6, "0")}`;

    const balance = roundMoney(reservation.grandTotal - reservation.paidTotal);
    const noteLine = note ? ` | Note: ${note}` : "";
    const idLine = idNumber ? ` | ID: ${idNumber}` : "";

    // ── Transaction ────────────────────────────────────────────────
    const result = await db.$transaction(async (tx) => {
      // 1. Create Stay
      const stay = await tx.stay.create({
        data: {
          stayNumber,
          reservationId: reservation.id,
          guestId: reservation.guestId,
          roomId: room.id,
          hotelId: reservation.hotelId,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          nights: reservation.nights,
          adults: reservation.adults,
          children: reservation.children,
          status: "CHECKED_IN",
          balance,
          notes: `Checked in by ${staffName}${idLine}${noteLine}`,
          checkedInAt: new Date(),
        },
      });

      // 2. Update reservation status → CHECKED_IN
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "CHECKED_IN" },
      });

      // 3. Update room → OCCUPIED + history
      const prevRoomStatus = room.status;
      await tx.physicalRoom.update({
        where: { id: room.id },
        data: { status: "OCCUPIED" },
      });
      await tx.roomStatusHistory.create({
        data: {
          roomId: room.id,
          fromStatus: prevRoomStatus,
          toStatus: "OCCUPIED",
          reason: `Check-in ${stay.stayNumber} (${reservation.bookingReference})`,
          changedBy: staffName,
        },
      });

      // 4. Create room charge
      const roomChargeDesc = `Room ${room.roomNumber} (${firstItem.nights} night${firstItem.nights > 1 ? "s" : ""} × ${firstItem.roomType?.nameEn || "Room"})`;
      await tx.charge.create({
        data: {
          stayId: stay.id,
          description: roomChargeDesc,
          category: "ROOM",
          quantity: firstItem.nights,
          unitPrice: firstItem.nightlyRate,
          grossAmount: reservation.subtotal,
          discount: reservation.discountTotal,
          netAmount: roundMoney(reservation.subtotal - reservation.discountTotal),
          tax: reservation.taxTotal,
          source: "ROOM",
          createdBy: staffName,
        },
      });

      // 5. Generate + hash access code, create AccessCode
      await tx.accessCode.create({
        data: {
          codeHash,
          codeType: "GUEST",
          stayId: stay.id,
          guestId: stay.guestId,
          validFrom: new Date(),
          validUntil,
          status: "ACTIVE",
        },
      });

      // 6. Stay status history (EXPECTED → CHECKED_IN)
      await tx.stayStatusHistory.create({
        data: {
          stayId: stay.id,
          fromStatus: "EXPECTED",
          toStatus: "CHECKED_IN",
          reason: `Check-in by ${staffName}`,
          changedBy: staffName,
        },
      });

      // 7. AppNotification for ADMIN (all admins)
      const admins = await tx.staff.findMany({ where: { role: { in: ["ADMIN", "MASTER_ADMIN"] }, isActive: true } });
      if (admins.length) {
        await tx.appNotification.createMany({
          data: admins.map((a) => ({
            recipientRole: "ADMIN",
            recipientId: a.id,
            stayId: stay.id,
            title: `Check-in: ${reservation.guest.fullName} → Room ${room.roomNumber}`,
            body: `Stay ${stay.stayNumber} checked in by ${staffName}.`,
            type: "CHECKIN",
          })),
        });
      }

      // 8. Audit log
      await tx.auditLog.create({
        data: {
          action: "CHECK_IN",
          entityType: "Reservation",
          entityId: reservation.id,
          performedBy: staffName,
          details: JSON.stringify({
            stayId: stay.id,
            stayNumber: stay.stayNumber,
            roomId: room.id,
            roomNumber: room.roomNumber,
            guestId: reservation.guestId,
            accessCodeIssued: true,
          }),
        },
      });

      return { stay, room, reservation };
    });

    return NextResponse.json({
      ok: true,
      stayId: result.stay.id,
      stayNumber: result.stay.stayNumber,
      accessCode: code.raw,
      roomNumber: result.room.roomNumber,
      guestName: result.reservation.guest.fullName,
    });
  } catch (e) {
    console.error("[reception/checkin] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
