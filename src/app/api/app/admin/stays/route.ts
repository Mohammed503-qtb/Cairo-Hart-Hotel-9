// GET /api/app/admin/stays?status=CHECKED_IN
// Returns stays (with guest + room + roomType), used for the GUEST access code
// generator's stay dropdown. Default filter: status CHECKED_IN.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "CHECKED_IN";

  const stays = await db.stay.findMany({
    where: { status },
    orderBy: { checkIn: "desc" },
    take: 200,
    include: {
      guest: true,
      room: { include: { roomType: true } },
    },
  });

  const list = stays.map((s) => ({
    id: s.id,
    stayNumber: s.stayNumber,
    status: s.status,
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    balance: s.balance,
    guestName: s.guest.fullName,
    guestPhone: s.guest.phone,
    roomNumber: s.room.roomNumber,
    roomTypeName: s.room.roomType?.nameAr || null,
    roomTypeNameEn: s.room.roomType?.nameEn || null,
  }));

  return NextResponse.json({ ok: true, stays: list });
}
