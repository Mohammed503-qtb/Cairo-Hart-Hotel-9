// GET /api/app/admin/guests
// Returns last 100 guests (most recent first), with reservation count + stay count.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const guests = await db.guest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: {
        select: { reservations: true, stays: true },
      },
    },
  });

  const list = guests.map((g) => ({
    id: g.id,
    fullName: g.fullName,
    phone: g.phone,
    email: g.email,
    countryCode: g.countryCode,
    whatsapp: g.whatsapp,
    createdAt: g.createdAt,
    reservationCount: g._count.reservations,
    stayCount: g._count.stays,
  }));

  return NextResponse.json({ ok: true, guests: list });
}
