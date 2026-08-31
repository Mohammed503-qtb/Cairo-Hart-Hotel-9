// GET /api/app/guest/home
// Returns the guest's home dashboard:
//   - stay summary (id, stayNumber, guestName, roomNumber, roomTypeName, roomTypeNameEn,
//     checkIn, checkOut, nights, adults, children, status, balance, roomId)
//   - hotel info
//   - recent notifications (last 5, unread first)
//   - activeRequestsCount (requests not COMPLETED/CANCELLED/REJECTED)
//   - unpaidBalance (alias for stay.balance)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "GUEST");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stayId = ctx.stayId!;
  const stay = await db.stay.findUnique({
    where: { id: stayId },
    include: {
      guest: true,
      room: { include: { roomType: true } },
    },
  });
  if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
  const guestId = stay.guestId;

  const hotel = await db.hotel.findFirst();

  // Active requests: not in [COMPLETED, CANCELLED, REJECTED]
  const activeRequestsCount = await db.guestRequest.count({
    where: {
      stayId,
      status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
    },
  });

  // Recent notifications: last 5, unread first
  const recentNotifications = await db.appNotification.findMany({
    where: { recipientRole: "GUEST", recipientId: guestId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 5,
  });

  return NextResponse.json({
    ok: true,
    stay: {
      id: stay.id,
      stayNumber: stay.stayNumber,
      guestName: stay.guest.fullName,
      roomNumber: stay.room.roomNumber,
      roomTypeName: stay.room.roomType?.nameAr || "",
      roomTypeNameEn: stay.room.roomType?.nameEn || "",
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      nights: stay.nights,
      adults: stay.adults,
      children: stay.children,
      status: stay.status,
      balance: stay.balance,
      roomId: stay.roomId,
    },
    hotel: hotel
      ? {
          nameAr: hotel.nameAr,
          nameEn: hotel.nameEn,
          phone: hotel.phone,
          whatsapp: hotel.whatsapp,
          email: hotel.email,
          addressAr: hotel.addressAr,
          addressEn: hotel.addressEn,
          checkInTime: hotel.checkInTime,
          checkOutTime: hotel.checkOutTime,
          currency: hotel.currency,
        }
      : null,
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      requestId: n.requestId,
      stayId: n.stayId,
      createdAt: n.createdAt,
    })),
    activeRequestsCount,
    unpaidBalance: stay.balance,
  });
}
