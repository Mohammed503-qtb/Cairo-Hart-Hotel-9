import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await req.json().catch(() => ({}));
    const phone = (body.phone || "").replace(/\D/g, "");
    const reason = (body.reason || "").slice(0, 500);

    const reservation = await db.reservation.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: { guest: true, items: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // Verify phone again
    const resPhoneDigits = reservation.guest.phone.replace(/\D/g, "");
    const phoneTail = phone.slice(-8);
    const resTail = resPhoneDigits.slice(-8);
    if (phoneTail.length < 6 || phoneTail !== resTail) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    // Already cancelled
    if (reservation.status === "CANCELLED") {
      return NextResponse.json({ error: "alreadyCancelled", bookingReference: reservation.bookingReference }, { status: 400 });
    }

    // Prevent cancelling past check-out
    const now = new Date();
    if (reservation.checkOut < now) {
      return NextResponse.json({ error: "cannotCancelPast" }, { status: 400 });
    }

    // Perform cancellation in transaction
    const updated = await db.$transaction(async (tx) => {
      const prev = { status: reservation.status, paymentStatus: reservation.paymentStatus };
      const res = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || null,
          payments: {
            updateMany: {
              where: { status: "PENDING" },
              data: { status: "FAILED" },
            },
          },
        },
      });

      // Record modification history
      await tx.bookingModification.create({
        data: {
          reservationId: reservation.id,
          changeType: "CANCEL",
          previousValue: JSON.stringify(prev),
          newValue: JSON.stringify({ status: "CANCELLED", cancelledAt: res.cancelledAt }),
          reason: reason || null,
          performedBy: "GUEST",
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          action: "RESERVATION_CANCELLED",
          entityType: "Reservation",
          entityId: reservation.id,
          performedBy: "GUEST",
          details: JSON.stringify({ reference: reservation.bookingReference, reason }),
        },
      });

      // Notification record
      await tx.notification.create({
        data: {
          reservationId: reservation.id,
          channel: "EMAIL",
          type: "BOOKING_CANCELLED",
          status: "PENDING",
          recipient: reservation.guest.email || "",
          content: `Booking ${reservation.bookingReference} cancelled.`,
        },
      });

      return res;
    });

    return NextResponse.json({
      bookingReference: updated.bookingReference,
      status: updated.status,
      cancelledAt: updated.cancelledAt,
    });
  } catch (e) {
    console.error("[booking/cancel] error", e);
    return NextResponse.json({ error: "cancelFailed" }, { status: 500 });
  }
}
