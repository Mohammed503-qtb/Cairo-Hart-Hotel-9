// GET /api/app/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD (default last 30 days)
// Returns:
//   - occupancy: [{ date, occupancyRate }] for each day in range
//   - revenue: { totalRevenue, roomRevenue, serviceRevenue, paymentsCollected }
//   - requests: { total, byStatus, avgResponseMinutes, avgCompletionMinutes }
//   - reservations: { total, confirmed, cancelled, noShow }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, addDays, toISODate, fromISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const today = startOfDay(new Date());
  const defaultFrom = addDays(today, -29); // last 30 days inclusive
  const fromDate = fromParam ? fromISODate(fromParam) : defaultFrom;
  const toDate = toParam ? fromISODate(toParam) : today;
  // Make range inclusive of "to"
  const toInclusive = addDays(toDate, 0);
  const rangeEndExclusive = addDays(toInclusive, 1);

  if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime())) {
    return NextResponse.json({ error: "invalidDateRange" }, { status: 400 });
  }

  // ── Total physical rooms (constant for occupancy calc) ──────────────
  const totalRooms = await db.physicalRoom.count();

  // ── Build occupancy per day ────────────────────────────────────────
  // For each day in range, count stays that are CHECKED_IN on that day.
  const days: string[] = [];
  let cursor = startOfDay(fromDate);
  const end = startOfDay(toInclusive);
  while (cursor.getTime() <= end.getTime()) {
    days.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }

  // Fetch stays with checkIn <= day and checkOut > day, status CHECKED_IN (or CHECKED_OUT/CLOSED if their range overlapped the day)
  // For simplicity, count distinct rooms occupied per day.
  const allStays = await db.stay.findMany({
    where: {
      OR: [
        { status: "CHECKED_IN" },
        { status: "CHECKED_OUT" },
        { status: "CLOSED" },
      ],
      checkIn: { lt: rangeEndExclusive },
      checkOut: { gt: fromDate },
    },
    select: { checkIn: true, checkOut: true, roomId: true, status: true },
  });

  const occupancyByDay: Array<{ date: string; occupancyRate: number }> = [];
  for (const dayISO of days) {
    const dayStart = startOfDay(fromISODate(dayISO));
    const dayEnd = addDays(dayStart, 1);
    const occupiedRoomIds = new Set<string>();
    for (const s of allStays) {
      const ci = new Date(s.checkIn).getTime();
      const co = new Date(s.checkOut).getTime();
      // Stay is "in-house" on this day if ci < dayEnd AND co > dayStart
      if (ci < dayEnd.getTime() && co > dayStart.getTime()) {
        occupiedRoomIds.add(s.roomId);
      }
    }
    const occupiedCount = occupiedRoomIds.size;
    const rate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 10000) / 100 : 0;
    occupancyByDay.push({ date: dayISO, occupancyRate: rate });
  }

  // ── Revenue ────────────────────────────────────────────────────────
  // Payments collected in range (SUCCEEDED only, completedAt within range)
  const payments = await db.payment.findMany({
    where: {
      status: "SUCCEEDED",
      completedAt: { gte: fromDate, lt: rangeEndExclusive },
    },
    select: { amount: true, method: true },
  });
  const paymentsCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  // Charges in range by category
  const charges = await db.charge.findMany({
    where: { createdAt: { gte: fromDate, lt: rangeEndExclusive } },
    select: { category: true, netAmount: true },
  });
  let roomRevenue = 0;
  let serviceRevenue = 0;
  for (const c of charges) {
    if (c.category === "ROOM") roomRevenue += c.netAmount || 0;
    else if (c.category === "SERVICE") serviceRevenue += c.netAmount || 0;
    else if (c.category === "ROOM_SERVICE" || c.category === "LAUNDRY" || c.category === "EXTRA_BED") {
      serviceRevenue += c.netAmount || 0;
    }
  }
  const totalRevenue = roomRevenue + serviceRevenue;

  // ── Requests ───────────────────────────────────────────────────────
  const requests = await db.guestRequest.findMany({
    where: { createdAt: { gte: fromDate, lt: rangeEndExclusive } },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
  });
  const byStatus: Record<string, number> = {};
  let completedCount = 0;
  let completionMinutesSum = 0;
  let ackedCount = 0;
  let responseMinutesSum = 0;
  // We only have completedAt for completion time. For response time, we'd need
  // the first ACKNOWLEDGED event timestamp — fetch them in a batch.
  const requestIds = requests.map((r) => r.id);
  const firstAckEvents = requestIds.length
    ? await db.guestRequestEvent.findMany({
        where: { requestId: { in: requestIds }, eventType: "ACKNOWLEDGED" },
        orderBy: { createdAt: "asc" },
        select: { requestId: true, createdAt: true },
      })
    : [];
  const ackByRequest = new Map<string, Date>();
  for (const ev of firstAckEvents) {
    if (!ackByRequest.has(ev.requestId)) ackByRequest.set(ev.requestId, ev.createdAt);
  }
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.completedAt) {
      completedCount += 1;
      completionMinutesSum += (r.completedAt.getTime() - r.createdAt.getTime()) / 60000;
    }
    const ack = ackByRequest.get(r.id);
    if (ack) {
      ackedCount += 1;
      responseMinutesSum += (ack.getTime() - r.createdAt.getTime()) / 60000;
    }
  }
  const avgResponseMinutes = ackedCount > 0 ? Math.round(responseMinutesSum / ackedCount) : 0;
  const avgCompletionMinutes = completedCount > 0 ? Math.round(completionMinutesSum / completedCount) : 0;

  // ── Reservations in range ──────────────────────────────────────────
  const reservations = await db.reservation.findMany({
    where: { createdAt: { gte: fromDate, lt: rangeEndExclusive } },
    select: { id: true, status: true },
  });
  const resByStatus: Record<string, number> = {};
  for (const r of reservations) {
    resByStatus[r.status] = (resByStatus[r.status] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    range: { from: toISODate(fromDate), to: toISODate(toInclusive), days: days.length },
    occupancy: occupancyByDay,
    revenue: {
      totalRevenue,
      roomRevenue,
      serviceRevenue,
      paymentsCollected,
    },
    requests: {
      total: requests.length,
      byStatus,
      avgResponseMinutes,
      avgCompletionMinutes,
    },
    reservations: {
      total: reservations.length,
      confirmed: resByStatus["CONFIRMED"] || 0,
      cancelled: resByStatus["CANCELLED"] || 0,
      noShow: resByStatus["NO_SHOW"] || 0,
    },
  });
}
