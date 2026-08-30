// POST /api/app/reception/inhouse/[id]/checkout
// Body: { note?, forceBalance? }
// Check-out workflow:
//   - Validate stay status = CHECKED_IN
//   - Optionally validate balance = 0 OR accept with forceBalance flag
//   - Transaction:
//     * stay status → CHECKED_OUT, checkedOutAt = now
//     * room status → DIRTY, RoomStatusHistory
//     * Revoke active GUEST access codes for this stay (status=EXPIRED)
//     * If linked reservation exists, status → CHECKED_OUT
//     * StayStatusHistory
//     * Audit log (action=CHECK_OUT)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { roundMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  note?: string;
  forceBalance?: boolean;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id: stayId } = await params;
  let body: CheckoutBody = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body */
  }
  const note = (body.note || "").trim();
  const forceBalance = !!body.forceBalance;

  const staffId = ctx.staffId!;
  const staff = await db.staff.findUnique({ where: { id: staffId } });
  const staffName = staff?.fullName || "RECEPTION";

  try {
    const stay = await db.stay.findUnique({
      where: { id: stayId },
      include: { guest: true, room: true, reservation: true },
    });
    if (!stay) return NextResponse.json({ error: "stayNotFound" }, { status: 404 });
    if (stay.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "stayNotCheckedIn", status: stay.status }, { status: 400 });
    }
    // Balance check (allow small float tolerance)
    const balance = roundMoney(stay.balance);
    if (balance > 0.01 && !forceBalance) {
      return NextResponse.json({
        error: "balanceDue",
        balance,
      }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Stay → CHECKED_OUT
      await tx.stay.update({
        where: { id: stay.id },
        data: {
          status: "CHECKED_OUT",
          checkedOutAt: new Date(),
          notes: note ? `${stay.notes || ""}\nCheckout note: ${note}`.trim() : stay.notes,
        },
      });

      // 2. Room → DIRTY + history
      const prevRoomStatus = stay.room.status;
      await tx.physicalRoom.update({
        where: { id: stay.room.id },
        data: { status: "DIRTY" },
      });
      await tx.roomStatusHistory.create({
        data: {
          roomId: stay.room.id,
          fromStatus: prevRoomStatus,
          toStatus: "DIRTY",
          reason: `Check-out ${stay.stayNumber}`,
          changedBy: staffName,
        },
      });

      // 3. Revoke active GUEST access codes for this stay
      await tx.accessCode.updateMany({
        where: { stayId: stay.id, codeType: "GUEST", status: "ACTIVE" },
        data: { status: "EXPIRED", revokedAt: new Date(), revokedBy: staffName },
      });

      // 4. Update reservation status if linked
      if (stay.reservation) {
        await tx.reservation.update({
          where: { id: stay.reservation.id },
          data: { status: "CHECKED_OUT" },
        });
      }

      // 5. StayStatusHistory
      await tx.stayStatusHistory.create({
        data: {
          stayId: stay.id,
          fromStatus: "CHECKED_IN",
          toStatus: "CHECKED_OUT",
          reason: note || `Check-out by ${staffName}`,
          changedBy: staffName,
        },
      });

      // 6. AppNotification for ADMIN
      const admins = await tx.staff.findMany({ where: { role: { in: ["ADMIN", "MASTER_ADMIN"] }, isActive: true } });
      if (admins.length) {
        await tx.appNotification.createMany({
          data: admins.map((a) => ({
            recipientRole: "ADMIN",
            recipientId: a.id,
            stayId: stay.id,
            title: `Check-out: ${stay.guest.fullName} from Room ${stay.room.roomNumber}`,
            body: `Stay ${stay.stayNumber} checked out by ${staffName}.`,
            type: "CHECKOUT",
          })),
        });
      }

      // 7. Audit
      await tx.auditLog.create({
        data: {
          action: "CHECK_OUT",
          entityType: "Stay",
          entityId: stay.id,
          performedBy: staffName,
          details: JSON.stringify({
            stayId: stay.id,
            stayNumber: stay.stayNumber,
            roomId: stay.room.id,
            roomNumber: stay.room.roomNumber,
            balance,
            forcedBalance: balance > 0.01,
          }),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      stayNumber: stay.stayNumber,
      roomNumber: stay.room.roomNumber,
    });
  } catch (e) {
    console.error("[reception/checkout] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
