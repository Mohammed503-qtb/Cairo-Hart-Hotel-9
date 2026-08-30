// GET /api/app/reception/rooms
// Returns the room status board: all PhysicalRooms ordered by floor then roomNumber,
// grouped by floor. Includes currentStay if OCCUPIED.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const rooms = await db.physicalRoom.findMany({
    include: { roomType: true },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
  });

  // Get current stays for OCCUPIED rooms (CHECKED_IN only)
  const occupiedRoomIds = rooms.filter((r) => r.status === "OCCUPIED").map((r) => r.id);
  const activeStays = occupiedRoomIds.length
    ? await db.stay.findMany({
        where: { roomId: { in: occupiedRoomIds }, status: "CHECKED_IN" },
        include: { guest: true },
      })
    : [];
  const stayByRoom = new Map(activeStays.map((s) => [s.roomId, s]));

  // Group by floor
  const floorsMap = new Map<number, typeof rooms>();
  for (const r of rooms) {
    if (!floorsMap.has(r.floor)) floorsMap.set(r.floor, []);
    floorsMap.get(r.floor)!.push(r);
  }
  const floors = Array.from(floorsMap.keys()).sort((a, b) => a - b).map((floor) => ({
    floor,
    rooms: (floorsMap.get(floor) || []).map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      status: r.status,
      notes: r.notes,
      roomType: r.roomType
        ? { id: r.roomType.id, slug: r.roomType.slug, nameAr: r.roomType.nameAr, nameEn: r.roomType.nameEn }
        : null,
      currentStay: r.status === "OCCUPIED" && stayByRoom.has(r.id)
        ? {
            id: stayByRoom.get(r.id)!.id,
            stayNumber: stayByRoom.get(r.id)!.stayNumber,
            checkIn: stayByRoom.get(r.id)!.checkIn,
            checkOut: stayByRoom.get(r.id)!.checkOut,
            guestName: stayByRoom.get(r.id)!.guest.fullName,
            guestId: stayByRoom.get(r.id)!.guestId,
          }
        : null,
    })),
  }));

  // Compute counts per status
  const statusCounts: Record<string, number> = {};
  for (const r of rooms) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;

  return NextResponse.json({ ok: true, floors, statusCounts, total: rooms.length });
}
