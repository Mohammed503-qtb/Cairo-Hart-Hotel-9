import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/stats
// Returns booking analytics for the admin dashboard.
export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Total reservations
  const totalReservations = await db.reservation.count();
  const confirmedReservations = await db.reservation.count({ where: { status: "CONFIRMED" } });
  const cancelledReservations = await db.reservation.count({ where: { status: "CANCELLED" } });
  const pendingReservations = await db.reservation.count({
    where: { status: { in: ["PENDING", "PAYMENT_PENDING"] } },
  });

  // This month's bookings
  const thisMonthReservations = await db.reservation.count({
    where: { createdAt: { gte: startOfMonth } },
  });
  const lastMonthReservations = await db.reservation.count({
    where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
  });

  // Revenue (confirmed only)
  const revenueResult = await db.reservation.aggregate({
    where: { status: "CONFIRMED" },
    _sum: { grandTotal: true, paidTotal: true },
  });
  const totalRevenue = revenueResult._sum.grandTotal || 0;
  const totalCollected = revenueResult._sum.paidTotal || 0;

  // This month's revenue
  const thisMonthRevenue = await db.reservation.aggregate({
    where: { createdAt: { gte: startOfMonth }, status: "CONFIRMED" },
    _sum: { grandTotal: true },
  });

  // Upcoming check-ins (next 7 days)
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingCheckIns = await db.reservation.count({
    where: {
      status: "CONFIRMED",
      checkIn: { gte: now, lte: sevenDaysAhead },
    },
  });

  // Current guests (checked in, not yet checked out)
  const currentGuests = await db.reservation.count({
    where: {
      status: "CONFIRMED",
      checkIn: { lte: now },
      checkOut: { gt: now },
    },
  });

  // Room type popularity
  const roomTypeStats = await db.reservationItem.groupBy({
    by: ["roomTypeId"],
    _count: { reservationId: true },
    _sum: { quantity: true },
  });
  const roomTypes = await db.roomType.findMany({
    select: { id: true, nameAr: true, nameEn: true, totalInventory: true },
  });
  const roomTypeMap = new Map(roomTypes.map((r) => [r.id, r]));
  const popularRooms = roomTypeStats
    .map((stat) => {
      const rt = roomTypeMap.get(stat.roomTypeId);
      if (!rt) return null;
      return {
        nameAr: rt.nameAr,
        nameEn: rt.nameEn,
        bookingCount: stat._count.reservationId,
        totalRooms: stat._sum.quantity || 0,
        inventory: rt.totalInventory,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.bookingCount - a.bookingCount);

  // Status distribution
  const statusDistribution = [
    { status: "CONFIRMED", count: confirmedReservations, labelAr: "مؤكد", labelEn: "Confirmed", color: "#10b981" },
    { status: "PENDING", count: pendingReservations, labelAr: "قيد الانتظار", labelEn: "Pending", color: "#f59e0b" },
    { status: "CANCELLED", count: cancelledReservations, labelAr: "ملغى", labelEn: "Cancelled", color: "#ef4444" },
  ];

  // Booking trend (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentBookings = await db.reservation.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, status: true, grandTotal: true },
  });
  const bookingTrend: { date: string; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayBookings = recentBookings.filter(
      (b) => b.createdAt >= day && b.createdAt < nextDay
    );
    const dayRevenue = dayBookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((s, b) => s + b.grandTotal, 0);
    bookingTrend.push({
      date: day.toISOString().split("T")[0],
      count: dayBookings.length,
      revenue: Math.round(dayRevenue),
    });
  }

  // Calculate month-over-month change
  const monthChange =
    lastMonthReservations > 0
      ? Math.round(((thisMonthReservations - lastMonthReservations) / lastMonthReservations) * 100)
      : thisMonthReservations > 0
      ? 100
      : 0;

  return NextResponse.json({
    totals: {
      totalReservations,
      confirmedReservations,
      cancelledReservations,
      pendingReservations,
      totalRevenue,
      totalCollected,
      thisMonthRevenue: thisMonthRevenue._sum.grandTotal || 0,
      thisMonthReservations,
      lastMonthReservations,
      monthChange,
      upcomingCheckIns,
      currentGuests,
    },
    statusDistribution,
    popularRooms,
    bookingTrend,
  });
}
