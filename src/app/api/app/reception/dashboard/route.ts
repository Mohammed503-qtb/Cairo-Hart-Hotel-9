// GET /api/app/reception/dashboard
// Returns reception KPIs (today's arrivals/departures/in-house/pending/urgent requests)
// plus short top-6 lists for arrivals, departures, and pending requests.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, addDays } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = startOfDay(addDays(now, 1));

  // ── Counts ────────────────────────────────────────────────────────────
  // Today's arrivals = reservations with checkIn today AND status in [CONFIRMED, PAYMENT_PENDING]
  // (NOT CHECKED_IN — those have already arrived)
  const arrivalsWhere = {
    checkIn: { gte: todayStart, lt: todayEnd },
    status: { in: ["CONFIRMED", "PAYMENT_PENDING"] },
  };
  const todayArrivals = await db.reservation.count({ where: arrivalsWhere });

  // Today's departures = stays with checkOut today AND status CHECKED_IN
  const departuresWhere = {
    checkOut: { gte: todayStart, lt: todayEnd },
    status: "CHECKED_IN",
  };
  const todayDepartures = await db.stay.count({ where: departuresWhere });

  // In-house guests = stays with status CHECKED_IN
  const inHouseGuests = await db.stay.count({ where: { status: "CHECKED_IN" } });

  // Pending requests
  const pendingStatuses = ["NEW", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "WAITING"];
  const pendingRequests = await db.guestRequest.count({
    where: { status: { in: pendingStatuses } },
  });

  const urgentRequests = await db.guestRequest.count({
    where: {
      priority: "URGENT",
      status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
    },
  });

  // ── Top-6 lists ───────────────────────────────────────────────────────
  const arrivalsList = await db.reservation.findMany({
    where: arrivalsWhere,
    include: {
      guest: true,
      items: { include: { roomType: true } },
    },
    orderBy: { checkIn: "asc" },
    take: 6,
  });

  const departuresList = await db.stay.findMany({
    where: departuresWhere,
    include: {
      guest: true,
      room: { include: { roomType: true } },
    },
    orderBy: { checkOut: "asc" },
    take: 6,
  });

  const pendingRequestsList = await db.guestRequest.findMany({
    where: { status: { in: pendingStatuses } },
    include: {
      stay: { include: { guest: true, room: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return NextResponse.json({
    ok: true,
    kpis: {
      todayArrivals,
      todayDepartures,
      inHouseGuests,
      pendingRequests,
      urgentRequests,
    },
    arrivalsList: arrivalsList.map((r) => ({
      id: r.id,
      bookingReference: r.bookingReference,
      status: r.status,
      paymentStatus: r.paymentStatus,
      grandTotal: r.grandTotal,
      paidTotal: r.paidTotal,
      adults: r.adults,
      children: r.children,
      nights: r.nights,
      guest: {
        id: r.guest.id,
        fullName: r.guest.fullName,
        phone: r.guest.phone,
      },
      roomType: r.items[0]?.roomType
        ? {
            id: r.items[0].roomType.id,
            slug: r.items[0].roomType.slug,
            nameAr: r.items[0].roomType.nameAr,
            nameEn: r.items[0].roomType.nameEn,
          }
        : null,
    })),
    departuresList: departuresList.map((s) => ({
      id: s.id,
      stayNumber: s.stayNumber,
      checkOut: s.checkOut,
      balance: s.balance,
      adults: s.adults,
      children: s.children,
      guest: { id: s.guest.id, fullName: s.guest.fullName, phone: s.guest.phone },
      room: {
        id: s.room.id,
        roomNumber: s.room.roomNumber,
        floor: s.room.floor,
        roomType: s.room.roomType
          ? {
              id: s.room.roomType.id,
              slug: s.room.roomType.slug,
              nameAr: s.room.roomType.nameAr,
              nameEn: s.room.roomType.nameEn,
            }
          : null,
      },
    })),
    pendingRequestsList: pendingRequestsList.map((rq) => ({
      id: rq.id,
      requestNumber: rq.requestNumber,
      category: rq.category,
      service: rq.service,
      title: rq.title,
      priority: rq.priority,
      status: rq.status,
      createdAt: rq.createdAt,
      assignedTo: rq.assignedTo,
      guestName: rq.stay?.guest?.fullName || "—",
      roomNumber: rq.stay?.room?.roomNumber || "—",
    })),
  });
}
