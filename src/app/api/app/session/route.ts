// GET /api/app/session
// Returns the current session context (persona + stay/staff) if logged in,
// else 401. Used by the app shell on load to restore the session.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await resolveSession(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const resp: Record<string, unknown> = {
    ok: true,
    persona: ctx.persona,
    sessionId: ctx.sessionId,
  };

  if (ctx.persona === "GUEST" && ctx.stayId) {
    const stay = await db.stay.findUnique({
      where: { id: ctx.stayId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
      },
    });
    if (stay) {
      resp.stay = {
        id: stay.id,
        stayNumber: stay.stayNumber,
        guestName: stay.guest.fullName,
        roomNumber: stay.room.roomNumber,
        roomTypeName: stay.room.roomType.nameAr,
        roomTypeNameEn: stay.room.roomType.nameEn,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stay.nights,
        adults: stay.adults,
        children: stay.children,
        status: stay.status,
        balance: stay.balance,
      };
    }
  }

  if (ctx.persona !== "GUEST" && ctx.staffId) {
    const staff = await db.staff.findUnique({ where: { id: ctx.staffId } });
    if (staff) {
      resp.staff = {
        id: staff.id,
        fullName: staff.fullName,
        role: staff.role,
      };
    }
  }

  return NextResponse.json(resp);
}
