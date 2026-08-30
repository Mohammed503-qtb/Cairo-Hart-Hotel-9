import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeSeasonalPrice } from "@/lib/booking";
import { calculateNights, roundMoney, startOfDay } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ModifyBody {
  phone: string;
  // Optional modifications — only provided fields are applied
  newCheckIn?: string;
  newCheckOut?: string;
  newAdults?: number;
  newChildren?: number;
  newRooms?: number;
  newRoomTypeId?: string;
  newSpecialRequest?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body: ModifyBody = await req.json();
    const phone = (body.phone || "").replace(/\D/g, "");

    const reservation = await db.reservation.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: { guest: true, items: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const hotel = await db.hotel.findFirst();
    if (!hotel) {
      return NextResponse.json({ error: "modifyFailed" }, { status: 500 });
    }

    // Verify phone
    const resPhoneDigits = reservation.guest.phone.replace(/\D/g, "");
    const phoneTail = phone.slice(-8);
    const resTail = resPhoneDigits.slice(-8);
    if (phoneTail.length < 6 || phoneTail !== resTail) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // Cannot modify cancelled or past reservations
    if (reservation.status === "CANCELLED") {
      return NextResponse.json({ error: "alreadyCancelled" }, { status: 400 });
    }
    const now = new Date();
    if (reservation.checkOut < now) {
      return NextResponse.json({ error: "cannotModifyPast" }, { status: 400 });
    }

    // Determine new values
    const currentCi = startOfDay(reservation.checkIn);
    const currentCo = startOfDay(reservation.checkOut);

    const newCi = body.newCheckIn ? startOfDay(new Date(body.newCheckIn)) : currentCi;
    const newCo = body.newCheckOut ? startOfDay(new Date(body.newCheckOut)) : currentCo;

    // Validate new dates
    if (newCo <= newCi) {
      return NextResponse.json({ error: "invalidDates" }, { status: 400 });
    }
    const today = startOfDay(new Date());
    if (newCi < today) {
      return NextResponse.json({ error: "pastDates" }, { status: 400 });
    }
    const newNights = calculateNights(newCi, newCo);
    if (newNights < hotel.minStayNights) {
      return NextResponse.json({ error: "tooShort" }, { status: 400 });
    }
    if (newNights > hotel.maxStayNights) {
      return NextResponse.json({ error: "tooLong" }, { status: 400 });
    }
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + hotel.bookingHorizonDays);
    if (newCi > horizon) {
      return NextResponse.json({ error: "tooFar" }, { status: 400 });
    }

    const newAdults = body.newAdults ?? reservation.adults;
    const newChildren = body.newChildren ?? reservation.children;
    const newRooms = body.newRooms ?? reservation.rooms;
    if (newAdults < 1 || newRooms < 1) {
      return NextResponse.json({ error: "occupancyExceeded" }, { status: 400 });
    }

    // Resolve room type (current or new)
    const currentItem = reservation.items[0];
    if (!currentItem) {
      return NextResponse.json({ error: "noItems" }, { status: 500 });
    }
    const targetRoomTypeId = body.newRoomTypeId || currentItem.roomTypeId;
    const targetRoomType = await db.roomType.findUnique({
      where: { id: targetRoomTypeId },
      include: { ratePlan: true },
    });
    if (!targetRoomType || !targetRoomType.isActive) {
      return NextResponse.json({ error: "soldOut" }, { status: 400 });
    }

    // Occupancy check
    if (newAdults > targetRoomType.maxAdults * newRooms || newChildren > targetRoomType.maxChildren * newRooms) {
      return NextResponse.json({ error: "occupancyExceeded" }, { status: 400 });
    }

    // Revalidate availability for new dates/room (excluding this reservation's own inventory)
    const overlapping = await db.reservation.findMany({
      where: {
        id: { not: reservation.id },
        status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING"] },
        checkIn: { lt: newCo },
        checkOut: { gt: newCi },
        items: { some: { roomTypeId: targetRoomType.id } },
      },
      include: { items: { where: { roomTypeId: targetRoomType.id } } },
    });
    let booked = 0;
    for (const r of overlapping) for (const it of r.items) booked += it.quantity;
    const availableCount = targetRoomType.totalInventory - booked;
    if (availableCount < newRooms) {
      return NextResponse.json({ error: "soldOut" }, { status: 409 });
    }

    // Recalculate price using seasonal rates (server-side authoritative)
    const seasonalResult = await computeSeasonalPrice({
      basePrice: targetRoomType.basePrice,
      checkIn: newCi,
      checkOut: newCo,
      rooms: newRooms,
      roomTypeId: targetRoomType.id,
      ratePlanId: targetRoomType.ratePlanId,
      taxRatePercent: hotel.taxRatePercent,
      serviceChargePercent: hotel.serviceChargePercent,
      currency: hotel.currency,
    });
    const nightlyRate = seasonalResult.nightlyRate;
    const subtotal = seasonalResult.subtotal;
    const discountTotal = seasonalResult.discountTotal;
    const taxTotal = seasonalResult.taxTotal;
    const serviceChargeTotal = seasonalResult.serviceChargeTotal;
    const grandTotal = seasonalResult.grandTotal;

    // Capture previous values for modification history
    const previousValue = {
      checkIn: reservation.checkIn.toISOString(),
      checkOut: reservation.checkOut.toISOString(),
      nights: reservation.nights,
      adults: reservation.adults,
      children: reservation.children,
      rooms: reservation.rooms,
      roomTypeId: currentItem.roomTypeId,
      subtotal: reservation.subtotal,
      grandTotal: reservation.grandTotal,
      specialRequest: reservation.specialRequest,
    };

    // Determine change types
    const changes: string[] = [];
    if (body.newCheckIn || body.newCheckOut) changes.push("DATES");
    if (body.newAdults !== undefined || body.newChildren !== undefined) changes.push("GUESTS");
    if (body.newRooms !== undefined) changes.push("ROOMS");
    if (body.newRoomTypeId) changes.push("ROOM_TYPE");
    if (body.newSpecialRequest !== undefined) changes.push("REQUEST");

    if (changes.length === 0) {
      return NextResponse.json({ error: "noChanges" }, { status: 400 });
    }

    // Apply modification in transaction
    const updated = await db.$transaction(async (tx) => {
      // Delete old items + price snapshots
      await tx.reservationItem.deleteMany({ where: { reservationId: reservation.id } });
      await tx.reservationPriceSnapshot.deleteMany({ where: { reservationId: reservation.id } });

      // Update reservation
      const res = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          checkIn: newCi,
          checkOut: newCo,
          nights: newNights,
          adults: newAdults,
          children: newChildren,
          rooms: newRooms,
          subtotal,
          discountTotal,
          taxTotal,
          serviceChargeTotal,
          grandTotal,
          specialRequest: body.newSpecialRequest !== undefined ? body.newSpecialRequest : reservation.specialRequest,
          items: {
            create: [
              {
                roomTypeId: targetRoomType.id,
                quantity: newRooms,
                checkIn: newCi,
                checkOut: newCo,
                nights: newNights,
                nightlyRate,
                subtotal,
              },
            ],
          },
        },
      });

      // Create new price snapshots using seasonal nightly rates
      for (const nr of seasonalResult.nightlyRates) {
        const dayTotal = roundMoney(nr.rate * newRooms);
        await tx.reservationPriceSnapshot.create({
          data: {
            reservationId: reservation.id,
            nightDate: new Date(nr.date),
            roomTypeId: targetRoomType.id,
            baseRate: nr.rate * newRooms,
            discount: 0,
            tax: roundMoney(dayTotal * (hotel.taxRatePercent / 100)),
            serviceCharge: roundMoney(dayTotal * (hotel.serviceChargePercent / 100)),
            total: dayTotal,
            currency: hotel.currency,
          },
        });
      }

      // Record modification history
      await tx.bookingModification.create({
        data: {
          reservationId: reservation.id,
          changeType: changes.join(","),
          previousValue: JSON.stringify(previousValue),
          newValue: JSON.stringify({
            checkIn: newCi.toISOString(),
            checkOut: newCo.toISOString(),
            nights: newNights,
            adults: newAdults,
            children: newChildren,
            rooms: newRooms,
            roomTypeId: targetRoomType.id,
            subtotal,
            grandTotal,
            specialRequest: body.newSpecialRequest !== undefined ? body.newSpecialRequest : reservation.specialRequest,
          }),
          performedBy: "GUEST",
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          action: "RESERVATION_MODIFIED",
          entityType: "Reservation",
          entityId: reservation.id,
          performedBy: "GUEST",
          details: JSON.stringify({ reference: reservation.bookingReference, changes }),
        },
      });

      // Notification record
      await tx.notification.create({
        data: {
          reservationId: reservation.id,
          channel: "EMAIL",
          type: "BOOKING_MODIFIED",
          status: "PENDING",
          recipient: reservation.guest.email || "",
          content: `Booking ${reservation.bookingReference} modified: ${changes.join(", ")}.`,
        },
      });

      return res;
    });

    return NextResponse.json({
      bookingReference: updated.bookingReference,
      status: updated.status,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      nights: updated.nights,
      adults: updated.adults,
      children: updated.children,
      rooms: updated.rooms,
      grandTotal: updated.grandTotal,
      currency: hotel.currency,
      changes,
      modifiedAt: updated.updatedAt,
    });
  } catch (e) {
    console.error("[booking/modify] error", e);
    return NextResponse.json({ error: "modifyFailed" }, { status: 500 });
  }
}
