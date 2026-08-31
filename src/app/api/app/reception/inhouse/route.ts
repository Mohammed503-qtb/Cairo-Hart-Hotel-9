// GET /api/app/reception/inhouse
// Returns in-house guests (stays with status CHECKED_IN).
// Each item includes guest, room, active requests count, balance.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const stays = await db.stay.findMany({
    where: { status: "CHECKED_IN" },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      requests: { where: { status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] } } },
    },
    orderBy: { checkedInAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    inhouse: stays.map((s) => ({
      id: s.id,
      stayNumber: s.stayNumber,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      nights: s.nights,
      adults: s.adults,
      children: s.children,
      balance: s.balance,
      checkedInAt: s.checkedInAt,
      activeRequestsCount: s.requests.length,
      guest: { id: s.guest.id, fullName: s.guest.fullName, phone: s.guest.phone, email: s.guest.email },
      room: {
        id: s.room.id,
        roomNumber: s.room.roomNumber,
        floor: s.room.floor,
        roomType: s.room.roomType
          ? { id: s.room.roomType.id, slug: s.room.roomType.slug, nameAr: s.room.roomType.nameAr, nameEn: s.room.roomType.nameEn }
          : null,
      },
    })),
  });
}
