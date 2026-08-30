import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, addDays, toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

// GET /api/availability/calendar?month=YYYY-MM&roomTypeId=...
// Returns day-by-day availability for a given month + room type.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month"); // YYYY-MM
    const roomTypeId = url.searchParams.get("roomTypeId");

    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: "invalid_month" }, { status: 400 });
    }

    const [year, month] = monthParam.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // last day of month

    // Start from first day shown in calendar (could be previous month for alignment)
    const calendarStart = startOfDay(monthStart);
    // Adjust to start of week (Saturday in Yemen = start of week, day 6)
    const startDayOfWeek = calendarStart.getDay();
    const calendarOffset = (startDayOfWeek - 6 + 7) % 7;
    const displayStart = addDays(calendarStart, -calendarOffset);
    // Show 42 days (6 weeks)
    const displayEnd = addDays(displayStart, 41);

    const hotel = await db.hotel.findFirst();
    if (!hotel) return NextResponse.json({ error: "hotel_not_configured" }, { status: 500 });

    let roomType = null;
    if (roomTypeId) {
      roomType = await db.roomType.findUnique({ where: { id: roomTypeId } });
      if (!roomType) return NextResponse.json({ error: "room_not_found" }, { status: 404 });
    }

    // Get all room types if none specified
    const roomTypes = roomType
      ? [roomType]
      : await db.roomType.findMany({ where: { isActive: true } });

    const totalInventory = roomTypes.reduce((s, r) => s + r.totalInventory, 0);

    // Find all overlapping reservations in the display range
    const overlapping = await db.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING", "PAYMENT_PENDING"] },
        checkIn: { lt: addDays(displayEnd, 1) },
        checkOut: { gt: displayStart },
        items: roomTypeId
          ? { some: { roomTypeId } }
          : undefined,
      },
      include: { items: roomTypeId ? { where: { roomTypeId } } : true },
    });

    // Build per-day booked count
    const days: {
      date: string;
      booked: number;
      available: number;
      totalInventory: number;
      isPast: boolean;
      isToday: boolean;
      inMonth: boolean;
      dayOfWeek: number;
      isWeekend: boolean;
    }[] = [];

    const today = startOfDay(new Date());
    const weekendDays = new Set([5, 6]); // Fri=5, Sat=6

    for (let d = new Date(displayStart); d <= displayEnd; d = addDays(d, 1)) {
      const dayStart = startOfDay(d);
      const dayEnd = addDays(dayStart, 1);
      const isoDate = toISODate(dayStart);

      let booked = 0;
      for (const res of overlapping) {
        if (res.checkIn < dayEnd && res.checkOut > dayStart) {
          for (const item of res.items) {
            booked += item.quantity;
          }
        }
      }

      const available = Math.max(0, totalInventory - booked);
      const isPast = dayStart < today;
      const isToday = dayStart.getTime() === today.getTime();
      const inMonth = dayStart.getMonth() === month - 1 && dayStart.getFullYear() === year;
      const dayOfWeek = dayStart.getDay();

      days.push({
        date: isoDate,
        booked,
        available,
        totalInventory,
        isPast,
        isToday,
        inMonth,
        dayOfWeek,
        isWeekend: weekendDays.has(dayOfWeek),
      });
    }

    return NextResponse.json({
      days,
      month: monthParam,
      roomTypeId: roomTypeId || null,
      totalInventory,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
    });
  } catch (e) {
    console.error("[availability/calendar] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
