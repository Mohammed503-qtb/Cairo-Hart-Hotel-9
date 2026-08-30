// POST /api/app/reception/rooms/[id]/status
// Body: { status, reason? }. Updates room status. Creates RoomStatusHistory. Audit.
// Restricted transitions: OUT_OF_ORDER and OUT_OF_SERVICE require ADMIN.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "AVAILABLE", "RESERVED", "OCCUPIED", "DIRTY", "CLEANING",
  "CLEAN", "INSPECTED", "OUT_OF_ORDER", "OUT_OF_SERVICE",
];

// Allowed transitions per current status (best-effort). Allows the same status (idempotent).
const ALLOWED_NEXT: Record<string, string[]> = {
  AVAILABLE: ["RESERVED", "OCCUPIED", "OUT_OF_ORDER", "OUT_OF_SERVICE", "AVAILABLE"],
  RESERVED: ["AVAILABLE", "OCCUPIED", "OUT_OF_ORDER", "OUT_OF_SERVICE", "RESERVED"],
  OCCUPIED: ["DIRTY", "OUT_OF_ORDER", "OCCUPIED"],
  DIRTY: ["CLEANING", "OUT_OF_ORDER", "OUT_OF_SERVICE", "DIRTY"],
  CLEANING: ["CLEAN", "DIRTY", "CLEANING"],
  CLEAN: ["INSPECTED", "DIRTY", "CLEAN"],
  INSPECTED: ["AVAILABLE", "DIRTY", "INSPECTED"],
  OUT_OF_ORDER: ["DIRTY", "OUT_OF_ORDER"],
  OUT_OF_SERVICE: ["DIRTY", "OUT_OF_SERVICE"],
};

interface StatusBody {
  status?: string;
  reason?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, ["RECEPTION", "ADMIN"]);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: roomId } = await params;
  let body: StatusBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const targetStatus = (body.status || "").trim().toUpperCase();
  const reason = (body.reason || "").trim();
  if (!targetStatus) return NextResponse.json({ error: "statusRequired" }, { status: 400 });
  if (!VALID_STATUSES.includes(targetStatus)) {
    return NextResponse.json({ error: "invalidStatus", status: targetStatus }, { status: 400 });
  }

  // OUT_OF_ORDER / OUT_OF_SERVICE require ADMIN persona
  if (["OUT_OF_ORDER", "OUT_OF_SERVICE"].includes(targetStatus) && ctx.persona !== "ADMIN") {
    return NextResponse.json({ error: "adminRequired" }, { status: 403 });
  }

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || ctx.persona;

  try {
    const room = await db.physicalRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "roomNotFound" }, { status: 404 });

    const allowed = ALLOWED_NEXT[room.status] || [];
    if (!allowed.includes(targetStatus)) {
      return NextResponse.json({
        error: "transitionNotAllowed",
        from: room.status,
        to: targetStatus,
        allowed,
      }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.physicalRoom.update({
        where: { id: roomId },
        data: { status: targetStatus, notes: reason || null },
      });
      await tx.roomStatusHistory.create({
        data: {
          roomId,
          fromStatus: room.status,
          toStatus: targetStatus,
          reason: reason || `Changed by ${staffName}`,
          changedBy: staffName,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "ROOM_STATUS_CHANGE",
          entityType: "PhysicalRoom",
          entityId: roomId,
          performedBy: staffName,
          details: JSON.stringify({ roomId, roomNumber: room.roomNumber, from: room.status, to: targetStatus, reason }),
        },
      });
    });

    return NextResponse.json({ ok: true, roomId, status: targetStatus });
  } catch (e) {
    console.error("[reception/room-status] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
