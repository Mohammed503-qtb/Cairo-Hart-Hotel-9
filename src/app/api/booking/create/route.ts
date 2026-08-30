import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  computeSeasonalPrice,
  findExistingReservationByIdempotencyKey,
  generateBookingReference,
  recheckRoomAvailability,
  validateBookingQuery,
} from "@/lib/booking";
import { calculateNights, roundMoney, startOfDay } from "@/lib/format";

export const dynamic = "force-dynamic";

interface CreateBody {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  roomTypeId: string;
  guest: {
    fullName: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    countryCode: string;
  };
  specialRequest?: string;
  paymentMethod: "PAY_AT_HOTEL" | "PAY_ONLINE" | "DEPOSIT";
  idempotencyKey: string;
  acceptPolicies: boolean;
  promoCode?: string;
  // Anti-bot honeypot fields (should be empty / match expected value)
  website?: string; // honeypot: hidden field, bots fill this
  _formStartedAt?: number; // timestamp when form was first interacted with
}

export async function POST(req: Request) {
  try {
    const body: CreateBody = await req.json();

    // Honeypot anti-bot check: if the hidden "website" field is filled, it's a bot
    // Silently return success to not tip off the bot
    if (body.website && body.website.trim().length > 0) {
      return NextResponse.json({
        reservationId: "bot-blocked",
        bookingReference: "HTL-BOT-000000",
        status: "CONFIRMED",
      });
    }

    // Form timing check: if form was submitted in under 2 seconds, likely a bot
    if (body._formStartedAt && Date.now() - body._formStartedAt < 2000) {
      return NextResponse.json({
        reservationId: "bot-blocked",
        bookingReference: "HTL-BOT-000000",
        status: "CONFIRMED",
      });
    }

    // Idempotency: return existing reservation if same key already processed
    const existing = await findExistingReservationByIdempotencyKey(body.idempotencyKey);
    if (existing) {
      return NextResponse.json({
        reservationId: existing.id,
        bookingReference: existing.bookingReference,
        status: existing.status,
        idempotentReplay: true,
      });
    }

    const hotel = await db.hotel.findFirst();
    if (!hotel) {
      return NextResponse.json({ error: "hotel_not_configured" }, { status: 500 });
    }

    // Validate dates / occupancy
    const validation = validateBookingQuery(
      {
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        adults: body.adults,
        children: body.children,
        rooms: body.rooms,
      },
      hotel
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate guest fields server-side (never trust client)
    const fullName = (body.guest?.fullName || "").trim();
    const phone = (body.guest?.phone || "").trim();
    if (fullName.length < 3) {
      return NextResponse.json({ error: "fillGuestInfo" }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 6) {
      return NextResponse.json({ error: "validPhone" }, { status: 400 });
    }
    if (body.guest?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guest.email)) {
      return NextResponse.json({ error: "validEmail" }, { status: 400 });
    }
    if (!body.acceptPolicies) {
      return NextResponse.json({ error: "acceptPolicies" }, { status: 400 });
    }

    // Resolve room type (server-side authoritative)
    const roomType = await db.roomType.findUnique({
      where: { id: body.roomTypeId },
      include: { ratePlan: true },
    });
    if (!roomType || !roomType.isActive) {
      return NextResponse.json({ error: "soldOut" }, { status: 409 });
    }

    // Occupancy check
    if (body.adults > roomType.maxAdults * body.rooms || body.children > roomType.maxChildren * body.rooms) {
      return NextResponse.json({ error: "occupancyExceeded" }, { status: 400 });
    }

    const ci = startOfDay(new Date(body.checkIn));
    const co = startOfDay(new Date(body.checkOut));
    const nights = calculateNights(ci, co);

    // CRITICAL: Revalidate availability at creation time (not just frontend)
    const recheck = await recheckRoomAvailability(roomType.id, ci, co, body.rooms);
    if (!recheck.available) {
      return NextResponse.json({ error: "soldOut" }, { status: 409 });
    }

    // Authoritative price calculation using seasonal rates (never trust client-provided prices)
    const price = await computeSeasonalPrice({
      basePrice: roomType.basePrice,
      checkIn: ci,
      checkOut: co,
      rooms: body.rooms,
      roomTypeId: roomType.id,
      ratePlanId: roomType.ratePlanId,
      taxRatePercent: hotel.taxRatePercent,
      serviceChargePercent: hotel.serviceChargePercent,
      currency: hotel.currency,
    });

    // Promo code validation and discount (server-side authoritative)
    let promoDiscount = 0;
    let appliedPromoCode: string | null = null;
    if (body.promoCode) {
      const promo = await db.promoCode.findUnique({
        where: { code: body.promoCode.trim().toUpperCase() },
      });
      if (promo && promo.isActive) {
        const nowDate = new Date();
        if (nowDate >= promo.validFrom && nowDate <= promo.validTo) {
          if (promo.maxUses <= 0 || promo.usedCount < promo.maxUses) {
            if (promo.discountType === "PERCENTAGE") {
              promoDiscount = roundMoney(price.subtotal * (promo.discountValue / 100));
            } else {
              promoDiscount = Math.min(roundMoney(promo.discountValue), price.subtotal);
            }
            appliedPromoCode = promo.code;
          }
        }
      }
    }
    // Recalculate totals with promo discount
    if (promoDiscount > 0) {
      price.discountTotal = roundMoney(promoDiscount);
      const afterDiscount = roundMoney(price.subtotal - price.discountTotal);
      price.taxTotal = roundMoney(afterDiscount * (hotel.taxRatePercent / 100));
      price.serviceChargeTotal = roundMoney(afterDiscount * (hotel.serviceChargePercent / 100));
      price.grandTotal = roundMoney(afterDiscount + price.taxTotal + price.serviceChargeTotal);
    }

    const bookingReference = await generateBookingReference();

    // Snapshot of relevant policies
    const policies = await db.policy.findMany({
      where: { category: { in: ["checkin", "checkout", "cancellation", "noshow", "payment"] } },
      orderBy: { displayOrder: "asc" },
    });
    const policySnapshot = JSON.stringify(
      policies.map((p) => ({ category: p.category, titleAr: p.titleAr, bodyAr: p.bodyAr, titleEn: p.titleEn, bodyEn: p.bodyEn }))
    );

    // Determine reservation status based on payment method
    let reservationStatus: "CONFIRMED" | "PAYMENT_PENDING" | "PENDING" = "CONFIRMED";
    let paymentStatus: "UNPAID" | "PARTIAL" = "UNPAID";
    if (body.paymentMethod === "PAY_AT_HOTEL") {
      reservationStatus = "CONFIRMED";
      paymentStatus = "UNPAID";
    } else if (body.paymentMethod === "DEPOSIT") {
      reservationStatus = "PAYMENT_PENDING";
      paymentStatus = "PARTIAL";
    } else {
      // PAY_ONLINE — not fully implemented; mark pending until payment verified
      reservationStatus = "PAYMENT_PENDING";
      paymentStatus = "UNPAID";
    }

    // Create or upsert guest (by phone)
    const normalizedPhone = phone.replace(/\s+/g, "");
    let guest = await db.guest.findFirst({ where: { phone: normalizedPhone } });
    if (!guest) {
      guest = await db.guest.create({
        data: {
          fullName,
          phone: normalizedPhone,
          email: body.guest.email || null,
          whatsapp: body.guest.whatsapp || null,
          countryCode: body.guest.countryCode || "+967",
        },
      });
    } else {
      // Update guest info if changed
      if (body.guest.email && body.guest.email !== guest.email) {
        await db.guest.update({
          where: { id: guest.id },
          data: { email: body.guest.email, fullName: fullName || guest.fullName, whatsapp: body.guest.whatsapp || guest.whatsapp },
        });
      }
    }

    // Transactional reservation creation
    const reservation = await db.$transaction(async (tx) => {
      // Double-check availability inside transaction to prevent race conditions
      const overlapping = await tx.reservation.findMany({
        where: {
          status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING"] },
          checkIn: { lt: co },
          checkOut: { gt: ci },
          items: { some: { roomTypeId: roomType.id } },
        },
        include: { items: { where: { roomTypeId: roomType.id } } },
      });
      let booked = 0;
      for (const r of overlapping) for (const it of r.items) booked += it.quantity;
      const availableInsideTx = roomType.totalInventory - booked;
      if (availableInsideTx < body.rooms) {
        throw new Error("soldOut");
      }

      const created = await tx.reservation.create({
        data: {
          bookingReference,
          hotelId: hotel.id,
          guestId: guest!.id,
          status: reservationStatus,
          source: "WEBSITE",
          checkIn: ci,
          checkOut: co,
          nights,
          adults: body.adults,
          children: body.children,
          rooms: body.rooms,
          currency: hotel.currency,
          subtotal: price.subtotal,
          discountTotal: price.discountTotal,
          taxTotal: price.taxTotal,
          serviceChargeTotal: price.serviceChargeTotal,
          grandTotal: price.grandTotal,
          paidTotal: 0,
          paymentStatus,
          paymentMethod: body.paymentMethod,
          specialRequest: body.specialRequest || null,
          policySnapshot,
          idempotencyKey: body.idempotencyKey,
          confirmedAt: reservationStatus === "CONFIRMED" ? new Date() : null,
          items: {
            create: [
              {
                roomTypeId: roomType.id,
                quantity: body.rooms,
                checkIn: ci,
                checkOut: co,
                nights,
                nightlyRate: price.nightlyRate,
                subtotal: price.subtotal,
              },
            ],
          },
          priceSnapshot: {
            create: price.nightlyBreakdown.map((nb, i) => ({
              nightDate: new Date(nb.date),
              roomTypeId: roomType.id,
              baseRate: price.nightlyRates?.[i]?.rate ? price.nightlyRates[i].rate * body.rooms : nb.rate,
              discount: 0,
              tax: roundMoney(nb.total * (hotel.taxRatePercent / 100)),
              serviceCharge: roundMoney(nb.total * (hotel.serviceChargePercent / 100)),
              total: nb.total,
              currency: hotel.currency,
            })),
          },
          payments:
            body.paymentMethod === "PAY_AT_HOTEL"
              ? undefined
              : {
                  create: [
                    {
                      provider: "manual",
                      method: body.paymentMethod,
                      amount: body.paymentMethod === "DEPOSIT" ? roundMoney(price.grandTotal * 0.3) : price.grandTotal,
                      currency: hotel.currency,
                      status: "PENDING",
                      idempotencyKey: body.idempotencyKey,
                    },
                  ],
                },
          notifications: {
            create: [
              {
                channel: "EMAIL",
                type: "BOOKING_RECEIVED",
                status: hotel.emailEnabled ? "PENDING" : "FAILED",
                recipient: body.guest.email || guest!.email || "",
                content: `Booking ${bookingReference} received for ${guest!.fullName}.`,
              },
            ],
          },
        },
        include: { items: true },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          action: "RESERVATION_CREATED",
          entityType: "Reservation",
          entityId: created.id,
          performedBy: "GUEST",
          details: JSON.stringify({ reference: bookingReference, roomType: roomType.slug, nights, total: price.grandTotal, promoCode: appliedPromoCode, promoDiscount }),
        },
      });

      // Increment promo code usage if applied
      if (appliedPromoCode) {
        await tx.promoCode.update({
          where: { code: appliedPromoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    return NextResponse.json({
      reservationId: reservation.id,
      bookingReference: reservation.bookingReference,
      status: reservation.status,
      grandTotal: price.grandTotal,
      currency: hotel.currency,
      nights,
      guestName: guest.fullName,
      roomTypeNameAr: roomType.nameAr,
      roomTypeNameEn: roomType.nameEn,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      appliedPromoCode,
      promoDiscount,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    if (err?.message === "soldOut") {
      return NextResponse.json({ error: "soldOut" }, { status: 409 });
    }
    console.error("[booking/create] error", e);
    return NextResponse.json({ error: "creationFailed" }, { status: 500 });
  }
}
