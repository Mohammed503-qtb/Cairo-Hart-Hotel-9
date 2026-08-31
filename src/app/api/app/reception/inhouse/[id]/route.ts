// GET /api/app/reception/inhouse/[id]
// Returns full stay detail (guest, room.roomType, charges, payments via linked reservation,
// requests, balance). Used by the in-house guest detail sheet.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: stayId } = await params;

  const stay = await db.stay.findUnique({
    where: { id: stayId },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      reservation: { include: { payments: true } },
      requests: {
        include: { events: true },
        orderBy: { createdAt: "desc" },
      },
      charges: { orderBy: { createdAt: "asc" } },
      conversations: { include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
  });

  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });

  // Compute totals
  const chargesTotal = stay.charges.reduce((sum, c) => sum + c.netAmount + c.tax, 0);
  const paymentsTotal = stay.reservation?.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  return NextResponse.json({
    ok: true,
    stay: {
      id: stay.id,
      stayNumber: stay.stayNumber,
      status: stay.status,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      nights: stay.nights,
      adults: stay.adults,
      children: stay.children,
      balance: stay.balance,
      checkedInAt: stay.checkedInAt,
      checkedOutAt: stay.checkedOutAt,
      notes: stay.notes,
    },
    guest: {
      id: stay.guest.id,
      fullName: stay.guest.fullName,
      phone: stay.guest.phone,
      email: stay.guest.email,
      countryCode: stay.guest.countryCode,
      whatsapp: stay.guest.whatsapp,
    },
    room: {
      id: stay.room.id,
      roomNumber: stay.room.roomNumber,
      floor: stay.room.floor,
      status: stay.room.status,
      roomType: stay.room.roomType
        ? {
            id: stay.room.roomType.id,
            slug: stay.room.roomType.slug,
            nameAr: stay.room.roomType.nameAr,
            nameEn: stay.room.roomType.nameEn,
            bedConfigAr: stay.room.roomType.bedConfigAr,
            bedConfigEn: stay.room.roomType.bedConfigEn,
          }
        : null,
    },
    reservation: stay.reservation
      ? {
          id: stay.reservation.id,
          bookingReference: stay.reservation.bookingReference,
          grandTotal: stay.reservation.grandTotal,
          paidTotal: stay.reservation.paidTotal,
          paymentStatus: stay.reservation.paymentStatus,
          paymentMethod: stay.reservation.paymentMethod,
          currency: stay.reservation.currency,
        }
      : null,
    payments: (stay.reservation?.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    })),
    charges: stay.charges.map((c) => ({
      id: c.id,
      description: c.description,
      category: c.category,
      source: c.source,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      grossAmount: c.grossAmount,
      discount: c.discount,
      netAmount: c.netAmount,
      tax: c.tax,
      createdAt: c.createdAt,
    })),
    requests: stay.requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      category: r.category,
      service: r.service,
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      assignedTo: r.assignedTo,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      eventsCount: r.events.length,
    })),
    financialSummary: {
      chargesTotal,
      paymentsTotal,
      balance: stay.balance,
    },
  });
}
