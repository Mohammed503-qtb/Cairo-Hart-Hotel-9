import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = (body.reference || "").trim().toUpperCase();
    const phone = (body.phone || "").replace(/\D/g, "");

    if (!reference || !phone) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const reservation = await db.reservation.findUnique({
      where: { bookingReference: reference },
      include: {
        guest: true,
        items: { include: { roomType: true } },
        payments: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const hotel = await db.hotel.findFirst();

    // Verify phone (last digits match) — never expose based on reference alone
    const resPhoneDigits = reservation.guest.phone.replace(/\D/g, "");
    const phoneTail = phone.slice(-8);
    const resTail = resPhoneDigits.slice(-8);
    if (phoneTail.length < 6 || phoneTail !== resTail) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // Return public-safe details only (no internal IDs exposed unnecessarily)
    return NextResponse.json({
      reservation: {
        bookingReference: reservation.bookingReference,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        paymentMethod: reservation.paymentMethod,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        nights: reservation.nights,
        adults: reservation.adults,
        children: reservation.children,
        rooms: reservation.rooms,
        currency: reservation.currency,
        subtotal: reservation.subtotal,
        discountTotal: reservation.discountTotal,
        taxTotal: reservation.taxTotal,
        serviceChargeTotal: reservation.serviceChargeTotal,
        grandTotal: reservation.grandTotal,
        paidTotal: reservation.paidTotal,
        specialRequest: reservation.specialRequest,
        createdAt: reservation.createdAt,
        confirmedAt: reservation.confirmedAt,
        cancelledAt: reservation.cancelledAt,
      },
      guest: {
        fullName: reservation.guest.fullName,
        phone: reservation.guest.phone,
        email: reservation.guest.email,
      },
      hotel: hotel ? {
        nameAr: hotel.nameAr,
        nameEn: hotel.nameEn,
        phone: hotel.phone,
        whatsapp: hotel.whatsapp,
        email: hotel.email,
        addressAr: hotel.addressAr,
        addressEn: hotel.addressEn,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
      } : null,
      items: reservation.items.map((it) => ({
        roomTypeId: it.roomTypeId,
        nameAr: it.roomType.nameAr,
        nameEn: it.roomType.nameEn,
        imageUrl: it.roomType.imageUrl,
        quantity: it.quantity,
        nights: it.nights,
        nightlyRate: it.nightlyRate,
        subtotal: it.subtotal,
      })),
      cancellationPolicy: reservation.policySnapshot,
    });
  } catch (e) {
    console.error("[booking/lookup] error", e);
    return NextResponse.json({ error: "notFound" }, { status: 500 });
  }
}
