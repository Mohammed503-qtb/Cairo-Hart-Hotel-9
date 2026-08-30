// POST /api/app/reception/extension/[id]/approve
// Approves an extension request. Steps:
//   - Validate still pending
//   - Recheck availability (simple overlap check on stays + reservations) for the new checkout date
//   - Update stay.checkOut + nights + balance (add charge for additional nights)
//   - Update linked reservation if exists (extend checkOut + nights + recompute grandTotal)
//   - Create charge for the extension
//   - Mark APPROVED, AppNotification for GUEST, audit.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, addDays, roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: requestId } = await params;
  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const ext = await db.extensionRequest.findUnique({
      where: { id: requestId },
      include: { stay: { include: { guest: true, room: { include: { roomType: true } }, reservation: true } } },
    });
    if (!ext) return NextResponse.json({ error: "extensionNotFound" }, { status: 404 });
    if (ext.status !== "PENDING") {
      return NextResponse.json({ error: "notPending", status: ext.status }, { status: 400 });
    }
    const stay = ext.stay;
    if (!stay) return NextResponse.json({ error: "stayMissing" }, { status: 400 });
    const roomTypeId = stay.room.roomTypeId;

    // ── Availability recheck (simple overlap check) ─────────────────
    // For an extension, the room is already occupied by this stay.
    // We only need to ensure no OTHER reservation conflicts for the additional nights.
    const newCheckOut = startOfDay(ext.requestedCheckOut);
    const currentCheckOut = startOfDay(ext.currentCheckOut);
    if (newCheckOut.getTime() <= currentCheckOut.getTime()) {
      return NextResponse.json({ error: "invalidNewCheckOut" }, { status: 400 });
    }

    // Find reservations overlapping [currentCheckOut, newCheckOut) for this room type
    // excluding this stay's own reservation. If any, deny approval.
    const conflicting = await db.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING", "CHECKED_IN"] },
        checkIn: { lt: newCheckOut },
        checkOut: { gt: currentCheckOut },
        items: { some: { roomTypeId } },
        id: { not: stay.reservationId || undefined },
      },
      select: { id: true, bookingReference: true },
    });
    // If there's a physical room of the same type available for the additional nights,
    // approval is still possible; for simplicity, if ANY conflict, deny.
    if (conflicting.length) {
      return NextResponse.json({
        error: "availabilityConflict",
        conflicts: conflicting.map((c) => c.bookingReference),
      }, { status: 400 });
    }

    // Compute cost for additional nights using the room type base price
    const additionalNights = Math.round((newCheckOut.getTime() - currentCheckOut.getTime()) / (1000 * 60 * 60 * 24));
    const nightlyRate = stay.room.roomType?.basePrice || ext.estimatedCost / Math.max(1, additionalNights);
    const extensionSubtotal = roundMoney(nightlyRate * additionalNights);
    // Apply hotel tax + service charge if linked reservation has them
    const hotel = await db.hotel.findFirst({ select: { taxRatePercent: true, serviceChargePercent: true, currency: true } });
    const taxRate = hotel?.taxRatePercent || 0;
    const serviceCharge = hotel?.serviceChargePercent || 0;
    const extTax = roundMoney(extensionSubtotal * (taxRate / 100));
    const extService = roundMoney(extensionSubtotal * (serviceCharge / 100));
    const extTotal = roundMoney(extensionSubtotal + extTax + extService);

    await db.$transaction(async (tx) => {
      // 1. Update stay: extend checkOut, increment nights, add to balance
      const newNights = stay.nights + additionalNights;
      await tx.stay.update({
        where: { id: stay.id },
        data: {
          checkOut: newCheckOut,
          nights: newNights,
          balance: roundMoney(stay.balance + extTotal),
        },
      });

      // 2. Update linked reservation if exists
      if (stay.reservation) {
        const res = stay.reservation;
        const newResNights = res.nights + additionalNights;
        const newSubtotal = roundMoney(res.subtotal + extensionSubtotal);
        const newTax = roundMoney(res.taxTotal + extTax);
        const newService = roundMoney(res.serviceChargeTotal + extService);
        const newGrand = roundMoney(res.grandTotal + extTotal);
        await tx.reservation.update({
          where: { id: res.id },
          data: {
            checkOut: newCheckOut,
            nights: newResNights,
            subtotal: newSubtotal,
            taxTotal: newTax,
            serviceChargeTotal: newService,
            grandTotal: newGrand,
          },
        });
        // Optionally extend the existing ReservationItem nights
        const firstItem = await tx.reservationItem.findFirst({ where: { reservationId: res.id }, orderBy: { id: "asc" } });
        if (firstItem) {
          await tx.reservationItem.update({
            where: { id: firstItem.id },
            data: {
              checkOut: newCheckOut,
              nights: firstItem.nights + additionalNights,
              subtotal: roundMoney(firstItem.subtotal + extensionSubtotal),
            },
          });
        }
      }

      // 3. Create charge for the extension
      await tx.charge.create({
        data: {
          stayId: stay.id,
          description: `Extension: ${additionalNights} night${additionalNights > 1 ? "s" : ""} × ${stay.room.roomType?.nameEn || "Room"}`,
          category: "ROOM",
          quantity: additionalNights,
          unitPrice: nightlyRate,
          grossAmount: extensionSubtotal,
          discount: 0,
          netAmount: extensionSubtotal,
          tax: extTax,
          source: "ROOM",
          createdBy: staffName,
        },
      });

      // 4. Mark APPROVED
      await tx.extensionRequest.update({
        where: { id: ext.id },
        data: {
          status: "APPROVED",
          reviewedBy: staffName,
          reviewedAt: new Date(),
        },
      });

      // 5. Extend guest access code validity (so guest can still log in during extension)
      await tx.accessCode.updateMany({
        where: { stayId: stay.id, codeType: "GUEST", status: "ACTIVE" },
        data: { validUntil: addDays(newCheckOut, 1) },
      });

      // 6. AppNotification for GUEST
      if (stay.guestId) {
        await tx.appNotification.create({
          data: {
            recipientRole: "GUEST",
            recipientId: stay.guestId,
            stayId: stay.id,
            title: `Stay extended: ${additionalNights} more night${additionalNights > 1 ? "s" : ""}`,
            body: `Your checkout is now ${newCheckOut.toISOString().slice(0, 10)}. Additional charge: ${extTotal} ${hotel?.currency || "YER"}.`,
            type: "EXTENSION_APPROVED",
          },
        });
      }

      // 7. Audit
      await tx.auditLog.create({
        data: {
          action: "EXTENSION_APPROVED",
          entityType: "ExtensionRequest",
          entityId: ext.id,
          performedBy: staffName,
          details: JSON.stringify({
            stayId: stay.id,
            stayNumber: stay.stayNumber,
            additionalNights,
            extensionTotal: extTotal,
            newCheckOut,
          }),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      additionalNights,
      extensionTotal: extTotal,
      newCheckOut,
    });
  } catch (e) {
    console.error("[reception/extension-approve] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
