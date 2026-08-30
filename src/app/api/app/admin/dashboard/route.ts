// GET /api/app/admin/dashboard
// Admin dashboard KPIs: occupancy rate, in-house guests, total rooms, monthly
// revenue, monthly bookings, top-5 recent bookings, active access code counts,
// and alerts (out-of-order rooms, pending requests > 30min).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, addDays } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const now = new Date();
  const todayStart = startOfDay(now);

  // ── Total rooms + occupied rooms (for occupancy) ────────────────────
  const totalRooms = await db.physicalRoom.count();
  const occupiedRooms = await db.physicalRoom.count({ where: { status: "OCCUPIED" } });
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 10000) / 100 : 0;

  // ── In-house guests (CHECKED_IN stays) ──────────────────────────────
  const inHouseGuests = await db.stay.count({ where: { status: "CHECKED_IN" } });

  // ── Revenue this month (succeeded payments completed in current month) ────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = addDays(new Date(now.getFullYear(), now.getMonth() + 1, 1), 0); // first of next month
  const paymentsThisMonth = await db.payment.findMany({
    where: {
      status: "SUCCEEDED",
      completedAt: { gte: monthStart, lt: monthEnd },
    },
    select: { amount: true },
  });
  const revenueThisMonth = paymentsThisMonth.reduce((s, p) => s + (p.amount || 0), 0);

  // ── Total bookings this month ───────────────────────────────────────
  const totalBookingsThisMonth = await db.reservation.count({
    where: { createdAt: { gte: monthStart, lt: monthEnd } },
  });

  // ── Recent bookings (last 5) ────────────────────────────────────────
  const recentBookingsRaw = await db.reservation.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      guest: true,
      items: { include: { roomType: true }, take: 1 },
    },
  });
  const recentBookings = recentBookingsRaw.map((r) => ({
    id: r.id,
    bookingReference: r.bookingReference,
    status: r.status,
    grandTotal: r.grandTotal,
    paymentStatus: r.paymentStatus,
    createdAt: r.createdAt,
    guestName: r.guest.fullName,
    roomTypeName: r.items[0]?.roomType?.nameAr || null,
    roomTypeNameEn: r.items[0]?.roomType?.nameEn || null,
  }));

  // ── Active access codes count by type ───────────────────────────────
  const [guestActive, receptionActive, adminActive] = await Promise.all([
    db.accessCode.count({ where: { codeType: "GUEST", status: "ACTIVE" } }),
    db.accessCode.count({ where: { codeType: "RECEPTION", status: "ACTIVE" } }),
    db.accessCode.count({ where: { codeType: "ADMIN", status: "ACTIVE" } }),
  ]);

  // ── Alerts ──────────────────────────────────────────────────────────
  const outOfOrderRooms = await db.physicalRoom.count({
    where: { status: { in: ["OUT_OF_ORDER", "OUT_OF_SERVICE"] } },
  });

  // Pending requests > 30min (not yet completed/cancelled/rejected)
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const pendingStatuses = ["NEW", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "WAITING"];
  const stalePendingRequests = await db.guestRequest.count({
    where: {
      status: { in: pendingStatuses },
      createdAt: { lt: thirtyMinAgo },
    },
  });

  const alerts: Array<{ type: string; message: string; count: number }> = [];
  if (outOfOrderRooms > 0) {
    alerts.push({
      type: "OUT_OF_ORDER",
      count: outOfOrderRooms,
      message: `${outOfOrderRooms} room(s) out of order or service`,
    });
  }
  if (stalePendingRequests > 0) {
    alerts.push({
      type: "STALE_REQUESTS",
      count: stalePendingRequests,
      message: `${stalePendingRequests} request(s) pending > 30 min`,
    });
  }

  return NextResponse.json({
    ok: true,
    occupancyRate,
    inHouseGuests,
    totalRooms,
    occupiedRooms,
    revenueThisMonth,
    totalBookingsThisMonth,
    recentBookings,
    activeCodesCount: {
      guest: guestActive,
      reception: receptionActive,
      admin: adminActive,
    },
    alerts,
    asOf: todayStart.toISOString(),
  });
}
